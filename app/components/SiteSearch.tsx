"use client";

/**
 * 헤더 검색 (React 라우트용)
 *
 * 정적 페이지에는 같은 UI 가 scripts/site_search.js 로 한 번 더 있다.
 * 헤더 자체가 header.html 과 SiteHeader.tsx 로 이원화되어 있어 그 구조를 따랐다.
 * 한쪽을 고치면 반대쪽도 함께 고쳐야 한다. 대신 인덱스(data/search-index.json)와
 * 스타일(styles/search.css)은 공유하므로 결과 모양과 순위는 저절로 같이 간다.
 *
 * 오버레이를 body 로 포털하는 이유
 * ─────────────────────────────────────────────────────────────────────────
 * 헤더에 backdrop-filter 가 걸려 있다. backdrop-filter 는 자식의 position: fixed
 * 기준을 그 요소로 바꿔 버려서, 헤더 안에 두면 오버레이가 헤더 높이에 갇힌다.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useI18n } from "../i18n/i18n";
import { searchIndex, type IndexPage, type SearchIndex, type SearchResult } from "../../scripts/search-engine.mjs";

type Result = SearchResult;

const INDEX_URL = "data/search-index.json";
function siteHref(path:string) {
  if(typeof document === "undefined") return "../"+path;
  const here=new URL(document.baseURI);
  if(!here.pathname.endsWith("/")) here.pathname+="/";
  return new URL("../"+path,here).toString();
}
const RECENT_KEY = "destiny-guide-recent-search";
const RECENT_LIMIT = 5;
const PAGE_SIZE = 24;
const SCOPES = ["all","items","drops","pages"] as const;
const SCOPE_LABELS = {all:"All",items:"Items / DB",drops:"Drop routes",pages:"Guides / pages"};

/**
 * 검색어가 없고 최근 기록도 없을 때 보여줄 목록.
 * 페이지 순서대로 자르면 레이드 4개가 자리를 다 먹어서 Drop Tables / Database 가
 * 밀린다. 처음 열었을 때 가장 쓸모 있는 순서로 직접 골라 둔다.
 * scripts/site_search.js 의 QUICK_LINKS 와 같아야 한다.
 */
const QUICK_LINKS = [
  "beginner_page.html",
  "item_page.html",
  "database/",
  "drop-tables/",
  "class_builds.html",
  "player_tools.html",
  "redeem/",
  "quest_data_page.html",
];

const GROUP_LABELS: Record<IndexPage["g"], [string, string]> = {
  guide: ["search.group.guide", "Guides"],
  raid: ["search.group.raid", "Raids"],
  tool: ["search.group.tool", "Tools"],
  data: ["search.group.data", "Data"],
};

function readRecent(): Result[] {
  // 서버 렌더에서도 불린다. localStorage 가 없으면 빈 목록으로 시작한다.
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0, RECENT_LIMIT).map((entry) => ({
      kind: entry.kind || (String(entry.u).startsWith("drop-tables/?") ? "drop" : "item"),
      name: entry.n,
      meta: entry.m,
      badge: entry.b,
      url: entry.u,
      exclusive: Boolean(entry.x),
    }));
  } catch {
    return [];
  }
}

function pushRecent(result: Result) {
  try {
    // 정적 페이지 쪽과 같은 저장 형식이어야 최근 목록이 이어진다.
    const stored = { kind:result.kind, n: result.name, m: result.meta, b: result.badge, u: result.url, x: result.exclusive ? 1 : 0 };
    const list = readRecent()
      .filter((entry) => entry.url !== result.url)
      .map((entry) => ({ kind:entry.kind, n: entry.name, m: entry.meta, b: entry.badge, u: entry.url, x: entry.exclusive ? 1 : 0 }));
    list.unshift(stored);
    window.localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, RECENT_LIMIT)));
  } catch {
    /* 저장이 막혀 있어도 검색은 되어야 한다 */
  }
}

/** 이름 안에서 검색어와 겹치는 부분만 강조한다. 원문 그대로 보여줘야 하므로 위치만 찾아 쓴다. */
function Highlighted({ name, query }: { name: string; query: string }) {
  const at = query ? name.toLowerCase().indexOf(query.toLowerCase()) : -1;
  if (at < 0) return <>{name}</>;
  return (
    <>
      {name.slice(0, at)}
      <mark>{name.slice(at, at + query.length)}</mark>
      {name.slice(at + query.length)}
    </>
  );
}

const SearchIcon = ({ className }: { className: string }) => (
  <svg className={className} viewBox="0 0 16 16" aria-hidden="true" focusable="false">
    <circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" strokeWidth="1.6" />
    <path d="M10.6 10.6 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
);

export function SiteSearch() {
  const { t } = useI18n();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [scope,setScope] = useState<string>("all");
  const [limit,setLimit] = useState(PAGE_SIZE);
  const [index, setIndex] = useState<SearchIndex | null>(null);
  const [failed, setFailed] = useState(false);
  const [active, setActive] = useState(0);
  const [mounted, setMounted] = useState(false);
  const [shortcut, setShortcut] = useState("Ctrl K");

  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);
  const lastFocusRef = useRef<HTMLElement | null>(null);

  // 포털은 클라이언트에서만 쓸 수 있다. 서버 렌더 결과에는 오버레이가 없다.
  useEffect(() => {
    setMounted(true);
    setShortcut(/Mac|iPhone|iPad/.test(navigator.platform || "") ? "⌘K" : "Ctrl K");
  }, []);

  const loadIndex = useCallback(() => {
    if (index || loadingRef.current) return;
    loadingRef.current = true;
    setFailed(false);
    fetch(siteHref(INDEX_URL), { cache: "no-cache" })
      .then((response) => {
        if (!response.ok) throw new Error("search index " + response.status);
        return response.json() as Promise<SearchIndex>;
      })
      .then((payload)=>{
        if(payload.schemaVersion !== 3 || !Array.isArray(payload.drops)) throw new Error("Outdated search index");
        setIndex(payload);
      })
      .catch((error) => {
        console.warn("[search] 인덱스를 불러오지 못했습니다.", error);
        setFailed(true);
      })
      .finally(() => {
        loadingRef.current = false;
      });
  }, [index]);

  const openSearch = useCallback(() => {
    lastFocusRef.current = document.activeElement as HTMLElement | null;
    setQuery("");
    setScope("all"); setLimit(PAGE_SIZE);
    setActive(0);
    setOpen(true);
    loadIndex();
  }, [loadIndex]);

  const closeSearch = useCallback(() => {
    setOpen(false);
    lastFocusRef.current?.focus({ preventScroll: true });
  }, []);

  // 어느 페이지에서든 Ctrl/Cmd+K 로 열린다. "/" 는 글을 쓰고 있지 않을 때만.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const typing =
        !!target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable);

      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        openSearch();
        return;
      }
      if (event.key === "/" && !typing && !event.ctrlKey && !event.metaKey && !event.altKey) {
        event.preventDefault();
        openSearch();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [openSearch]);

  // 뒤 페이지가 같이 스크롤되지 않게 막는다.
  useEffect(() => {
    if (!open) return;
    document.documentElement.classList.add("ds_search_open");
    inputRef.current?.focus();
    return () => document.documentElement.classList.remove("ds_search_open");
  }, [open]);

  const allResults = useMemo<Result[]>(() => {
    if (!index) return [];
    const trimmed = query.trim();

    if (!trimmed) {
      // 검색어가 없을 때: 최근에 연 항목, 없으면 주요 페이지.
      const recent = readRecent();
      if (recent.length) return recent;
      return QUICK_LINKS.map((url) => index.pages.find((page) => page.u === url))
        .filter((page): page is IndexPage => Boolean(page))
        .map((page) => ({
          kind:"page",
          name: page.k ? t(page.k, page.t) : page.t,
          meta: "",
          badge: t(...GROUP_LABELS[page.g]),
          url: page.u,
          exclusive: false,
        }));
    }

    return searchIndex(index,trimmed,t,scope);
  }, [index, query, t, scope]);

  const results=allResults.slice(0,limit);

  useEffect(() => {
    setActive(0);
    if (listRef.current) listRef.current.scrollTop = 0;
    setLimit(PAGE_SIZE);
  }, [query,scope,t,index]);

  // scrollIntoView 는 뒤 페이지까지 같이 움직여서 쓰지 않는다.
  useEffect(() => {
    const list = listRef.current;
    const current = list?.querySelector<HTMLElement>(`[data-result="${active}"]`);
    if (!list || !current) return;
    const top = current.offsetTop;
    const bottom = top + current.offsetHeight;
    if (top < list.scrollTop) list.scrollTop = top;
    else if (bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight;
  }, [active]);

  const go = (result: Result) => {
    pushRecent(result);
    window.location.href = siteHref(result.url);
  };

  const onInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (!results.length && event.key !== "Escape") return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((current) => (current + 1) % results.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((current) => (current - 1 + results.length) % results.length);
    } else if (event.key === "Enter") {
      event.preventDefault();
      const current = results[active];
      if (current) go(current);
    } else if (event.key === "Escape") {
      event.preventDefault();
      closeSearch();
    }
  };

  const showingDefault = query.trim().length === 0;
  const heading = showingDefault ? (readRecent().length ? t("search.recent", "Recent") : t("search.jumpTo", "Jump to")) : "";

  const overlay = (
    <div className="ds_search">
      <div className="ds_search_dim" onClick={closeSearch} />
      <div className="ds_search_panel" role="dialog" aria-modal="true" aria-label={t("search.dialog.label", "Search the site")} onKeyDown={event=>{
        if(event.key==="Escape") { event.preventDefault();closeSearch(); }
        if(event.key!=="Tab") return;
        const nodes=Array.from(event.currentTarget.querySelectorAll<HTMLElement>("input,button,a[href]")).filter(node=>!node.hidden && node.getClientRects().length);
        const first=nodes[0],last=nodes[nodes.length-1];
        if(event.shiftKey && document.activeElement===first) { event.preventDefault();last?.focus(); }
        else if(!event.shiftKey && document.activeElement===last) { event.preventDefault();first?.focus(); }
      }}>
        <div className="ds_search_field">
          <SearchIcon className="ds_search_icon" />
          <input
            ref={inputRef}
            className="ds_search_input"
            type="text"
            autoComplete="off"
            spellCheck={false}
            role="combobox"
            aria-expanded
            aria-controls="ds-search-results"
            aria-autocomplete="list"
            aria-activedescendant={results.length ? `ds-result-${active}` : undefined}
            aria-label={t("search.dialog.label","Search the site")}
            placeholder={t("search.placeholder", "Search items, effects, monsters, Section IDs…")}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onInputKeyDown}
          />
          <button type="button" className="ds_search_dismiss" onClick={closeSearch}>
            Esc
          </button>
        </div>

        <div className="ds_search_scopes" role="group" aria-label={t("search.scope.label","Search category")}>
          {SCOPES.map(name=><button key={name} type="button" data-scope={name} aria-pressed={scope===name} onClick={()=>setScope(name)}>{t("search.scope."+name,SCOPE_LABELS[name])}</button>)}
        </div>
        {!showingDefault && results.some(result=>result.kind==="drop") && <p className="ds_search_info">{t("search.dropNote","Drops show the saved table's base rates. Open a route to check the difficulty and rate modifiers.")}</p>}
        <div className="ds_search_results" id="ds-search-results" role="listbox" ref={listRef}>
          {!index && failed ? <p className="ds_search_note">{t("search.error","Search data could not be loaded. Close and reopen to retry.")}</p> : !index ? (
            <p className="ds_search_note">{t("search.loading", "Loading…")}</p>
          ) : !results.length ? (
            <p className="ds_search_note">
              {t("search.empty", "No matches. Try an item, effect, monster or Section ID, or change the search category.")}
            </p>
          ) : (
            <>
              {heading ? <p className="ds_search_heading">{heading}</p> : null}
              {results.map((result, position) => (
                <a
                  key={result.url + position}
                  className="ds_search_result"
                  role="option"
                  id={`ds-result-${position}`}
                  aria-selected={position === active}
                  data-result={position}
                  href={siteHref(result.url)}
                  onPointerMove={() => position !== active && setActive(position)}
                  onClick={() => pushRecent(result)}
                >
                  <span className="ds_search_result_main">
                    <span className="ds_search_result_name">
                      <Highlighted name={result.name} query={query.trim()} />
                    </span>
                    {result.meta ? <span className="ds_search_result_meta">{result.meta}</span> : null}
                  </span>
                  <span className={"ds_search_result_badge" + (result.exclusive ? " is_exclusive" : "")}>
                    {result.badge}
                  </span>
                </a>
              ))}
            </>
          )}
        </div>

        {!showingDefault && results.length<allResults.length && <button type="button" className="ds_search_more" onClick={()=>setLimit(value=>value+PAGE_SIZE)}>{t("search.more","Show more results")}</button>}
        <div className="ds_search_foot">
          <span>
            <kbd>↑</kbd>
            <kbd>↓</kbd> {t("search.hint.move", "to move")}
          </span>
          <span>
            <kbd>Enter</kbd> {t("search.hint.open", "to open")}
          </span>
          <span className="ds_search_count">
            {showingDefault ? "" : t("search.count","{shown} of {total} results").replace("{shown}",String(results.length)).replace("{total}",String(allResults.length))}
          </span>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        type="button"
        className="ds_search_trigger"
        disabled={!mounted}
        aria-label={t("search.trigger", "Search")}
        onPointerEnter={loadIndex}
        onFocus={loadIndex}
        onClick={openSearch}
      >
        <SearchIcon className="ds_search_trigger_icon" />
        <span className="ds_search_trigger_label">{t("search.trigger", "Search")}</span>
        <kbd className="ds_search_trigger_key">{shortcut}</kbd>
      </button>
      {mounted && open ? createPortal(overlay, document.body) : null}
    </>
  );
}
