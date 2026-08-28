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

/** [이름, 링크, 뱃지, 부가정보, 검색어, Destiny 전용 여부, 약칭] */
type IndexItem = [string, string, string, string, string, number, string];

type IndexPage = {
  u: string;
  g: "guide" | "raid" | "tool" | "data";
  t: string;
  k: string;
  d: string;
};

type SearchIndex = { pages: IndexPage[]; items: IndexItem[] };

type Result = {
  name: string;
  meta: string;
  badge: string;
  url: string;
  exclusive: boolean;
};

const INDEX_URL = "../data/search-index.json";
const RECENT_KEY = "destiny-guide-recent-search";
const RECENT_LIMIT = 5;
const MAX_PAGE_RESULTS = 5;
const MAX_ITEM_RESULTS = 24;

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

/** 인덱스를 만들 때 쓴 normalize 와 같아야 점수가 맞는다. */
const normalize = (value: string) =>
  String(value ?? "")
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/**
 * 점수 규칙. 위에서부터 강한 일치다.
 *   정확히 같음 > 앞에서부터 일치 > 단어 첫머리 일치 > 어딘가 포함 > 낱말 전부 포함
 * 마지막 단계 덕분에 "charge dagger" 처럼 이름에 없는 조합도 찾힌다.
 * 짧은 이름을 조금 우대해서 DARK FLOW 가 DARK FLOW REPLICA 보다 위로 온다.
 * scripts/site_search.js 의 score() 와 같은 규칙이다.
 */
function score(name: string, searchText: string, aliases: string, query: string, tokens: string[]) {
  if (!query) return 0;
  if (name === query) return 1000;

  // 약칭이 검색어와 통째로 같으면 이름을 그대로 친 것이나 다름없다.
  // PSOBB 는 줄여 부르는 장비가 많다("df" = DARK FLOW). 이름 앞부분이 우연히
  // 겹치는 DF FIELD 보다 이쪽이 위로 와야 찾는 물건이 먼저 보인다.
  if (aliases && (" " + aliases + " ").includes(" " + query + " ")) {
    return 950 - Math.min(name.length, 60) * 0.5;
  }

  let found = 0;
  if (name.indexOf(query) === 0) found = 700;
  else if ((" " + name).includes(" " + query)) found = 520;
  else if (name.indexOf(query) > 0) found = 340;
  else if (searchText.includes(query)) found = 220;

  if (!found) {
    if (!tokens.every((token) => searchText.includes(token))) return 0;
    found = 120;
  }

  return found - Math.min(name.length, 60) * 0.5;
}

function readRecent(): Result[] {
  // 서버 렌더에서도 불린다. localStorage 가 없으면 빈 목록으로 시작한다.
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(RECENT_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(parsed)) return [];
    return parsed.slice(0, RECENT_LIMIT).map((entry) => ({
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
    const stored = { n: result.name, m: result.meta, b: result.badge, u: result.url, x: result.exclusive ? 1 : 0 };
    const list = readRecent()
      .filter((entry) => entry.url !== result.url)
      .map((entry) => ({ n: entry.name, m: entry.meta, b: entry.badge, u: entry.url, x: entry.exclusive ? 1 : 0 }));
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
    fetch(INDEX_URL, { cache: "force-cache" })
      .then((response) => {
        if (!response.ok) throw new Error("search index " + response.status);
        return response.json() as Promise<SearchIndex>;
      })
      .then(setIndex)
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

  const results = useMemo<Result[]>(() => {
    if (!index) return [];
    const trimmed = query.trim();

    if (!trimmed) {
      // 검색어가 없을 때: 최근에 연 항목, 없으면 주요 페이지.
      const recent = readRecent();
      if (recent.length) return recent;
      return QUICK_LINKS.map((url) => index.pages.find((page) => page.u === url))
        .filter((page): page is IndexPage => Boolean(page))
        .map((page) => ({
          name: t(page.k, page.t),
          meta: "",
          badge: t(...GROUP_LABELS[page.g]),
          url: page.u,
          exclusive: false,
        }));
    }

    const normalized = normalize(trimmed);
    const tokens = normalized.split(" ").filter(Boolean);

    const pages = index.pages
      .map((page) => {
        const title = t(page.k, page.t);
        // page.d 는 화면에 쓰지 않고 검색어로만 쓴다. 번역이 필요한 문장을 19줄 ×
        // 5개 언어로 늘리는 대신, 제목과 분류 뱃지만 보여준다.
        const haystack = normalize(title + " " + page.t + " " + page.d + " " + page.g);
        return { page, title, value: score(normalize(title), haystack, "", normalized, tokens) + 60 };
      })
      .filter((entry) => entry.value > 60)
      .sort((a, b) => b.value - a.value)
      .slice(0, MAX_PAGE_RESULTS)
      .map(({ page, title }) => ({
        name: title,
        meta: "",
        badge: t(...GROUP_LABELS[page.g]),
        url: page.u,
        exclusive: false,
      }));

    const items = index.items
      .map((row) => ({
        row,
        // Destiny 전용 아이템은 이 서버에서 찾는 빈도가 훨씬 높아 위로 올린다.
        value: score(normalize(row[0]), row[4], row[6], normalized, tokens) + (row[5] ? 90 : 0),
      }))
      .filter((entry) => entry.value > (entry.row[5] ? 90 : 0))
      .sort((a, b) => b.value - a.value)
      .slice(0, MAX_ITEM_RESULTS)
      .map(({ row }) => ({ name: row[0], meta: row[3], badge: row[2], url: row[1], exclusive: Boolean(row[5]) }));

    return pages.concat(items);
  }, [index, query, t]);

  useEffect(() => {
    setActive(0);
    if (listRef.current) listRef.current.scrollTop = 0;
  }, [query]);

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
    window.location.href = "../" + result.url;
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
      <div className="ds_search_panel" role="dialog" aria-modal="true" aria-label={t("search.dialog.label", "Search the site")}>
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
            placeholder={t("search.placeholder", "Search items, guides, raids…")}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={onInputKeyDown}
          />
          <button type="button" className="ds_search_dismiss" onClick={closeSearch}>
            Esc
          </button>
        </div>

        <div className="ds_search_results" id="ds-search-results" role="listbox" ref={listRef}>
          {!index && !failed ? (
            <p className="ds_search_note">{t("search.loading", "Loading…")}</p>
          ) : !results.length ? (
            <p className="ds_search_note">
              {t("search.empty", "Nothing matched. Try an item name, a class, or a special.")}
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
                  href={"../" + result.url}
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

        <div className="ds_search_foot">
          <span>
            <kbd>↑</kbd>
            <kbd>↓</kbd> {t("search.hint.move", "to move")}
          </span>
          <span>
            <kbd>Enter</kbd> {t("search.hint.open", "to open")}
          </span>
          <span className="ds_search_count">
            {showingDefault ? "" : `${results.length}${results.length >= MAX_ITEM_RESULTS ? "+" : ""}`}
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
