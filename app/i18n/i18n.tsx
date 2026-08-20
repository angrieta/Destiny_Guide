"use client";

/**
 * React 라우트(/drop-tables, /database)용 다국어 지원.
 *
 * 정적 페이지(scripts/i18n.js)와 완전히 같은 규칙을 따른다.
 *   - 같은 localStorage 키를 쓰므로 정적 <-> React 페이지를 오가도 언어가 유지된다
 *   - 같은 /i18n/<lang>.json 사전을 쓴다
 *   - 영어는 코드에 그대로 남기고 사전이 덮어쓴다.
 *     사전 로딩이 실패하면 영어가 보인다. 빈 화면이 되지 않는다.
 */

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";

const LANG_KEY = "destiny-guide-lang";
export const SUPPORTED = ["en", "ko", "ja", "es", "fr"] as const;
export type Lang = (typeof SUPPORTED)[number];

export const LANG_LABELS: Record<Lang, string> = {
  en: "EN",
  ko: "한국어",
  ja: "日本語",
  es: "Español",
  fr: "Français",
};

const LANG_SHORT: Record<Lang, string> = { en: "EN", ko: "KO", ja: "JA", es: "ES", fr: "FR" };

/**
 * 사전 주소를 만든다.
 *
 * 절대 경로(`/i18n/...`)를 쓰면 GitHub Pages 의 basePath(`/Destiny_Guide`) 아래에서
 * 도메인 루트를 찾아가 404 가 된다. 이 라우트는 `<base>/drop-tables/` 형태이므로
 * 한 단계 위가 사이트 루트다. 컴포넌트가 이미지에 `../images/...` 를 쓰는 것과 같은 방식이다.
 * 끝에 슬래시가 없는 주소로 들어올 수도 있으니 먼저 붙여서 계산한다.
 */
function dictUrl(lang: Lang) {
  const here = new URL(document.baseURI);
  if (!here.pathname.endsWith("/")) here.pathname += "/";
  return new URL(`../i18n/${lang}.json`, here).toString();
}

type Dict = Record<string, string>;

type I18nValue = {
  lang: Lang;
  setLang: (next: Lang) => void;
  /** t(키, 영어원문) — 사전에 번역이 없으면 영어 원문을 그대로 돌려준다. */
  t: (key: string, en: string) => string;
};

const I18nContext = createContext<I18nValue>({
  lang: "en",
  setLang: () => {},
  t: (_key, en) => en,
});

function readStoredLang(): Lang {
  try {
    const saved = window.localStorage.getItem(LANG_KEY);
    if (saved && (SUPPORTED as readonly string[]).includes(saved)) return saved as Lang;
    const nav = (window.navigator.language || "").slice(0, 2).toLowerCase();
    if ((SUPPORTED as readonly string[]).includes(nav)) return nav as Lang;
  } catch {
    /* 스토리지 접근이 막혀 있으면 영어로 둔다 */
  }
  return "en";
}

export function I18nProvider({ children }: { children: React.ReactNode }) {
  // 서버 렌더 결과와 어긋나지 않도록 첫 렌더는 항상 영어로 시작한다.
  const [lang, setLangState] = useState<Lang>("en");
  const [dict, setDict] = useState<Dict>({});

  useEffect(() => {
    setLangState(readStoredLang());
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    if (lang === "en") {
      setDict({});
      return;
    }
    let cancelled = false;
    fetch(dictUrl(lang), { cache: "no-cache" })
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error(String(res.status)))))
      .then((data: Dict) => {
        if (!cancelled) setDict(data);
      })
      .catch((error) => {
        // 영어로 남는 편이 빈 화면보다 낫다.
        console.warn(`[i18n] ${lang} 사전을 불러오지 못했습니다. 영어로 표시합니다.`, error);
        if (!cancelled) setDict({});
      });
    return () => {
      cancelled = true;
    };
  }, [lang]);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      window.localStorage.setItem(LANG_KEY, next);
    } catch {
      /* 저장에 실패해도 현재 화면에는 적용된다 */
    }
  }, []);

  const t = useCallback((key: string, en: string) => dict[key] ?? en, [dict]);

  const value = useMemo<I18nValue>(() => ({ lang, setLang, t }), [lang, setLang, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  return useContext(I18nContext);
}

/**
 * 언어 선택기. 정적 페이지의 헤더와 같은 모양이며 스타일도 공유한다(globals.css).
 *
 * 칩 폭을 고정하고 그 안의 넓은 select 를 잘라내는 방식이다.
 * select 자체를 좁히면 브라우저가 열린 목록 폭까지 맞춰 언어명이 잘린다.
 */
export function LanguageSwitcher() {
  const { lang, setLang, t } = useI18n();
  const label = t("header.lang.label", "Language");

  return (
    <label className="lang_switch" data-current={LANG_SHORT[lang]}>
      <span className="lang_switch_icon" aria-hidden="true" />
      <span className="sr_only">{label}</span>
      <select
        aria-label={label}
        value={lang}
        onChange={(event) => setLang(event.target.value as Lang)}
      >
        {SUPPORTED.map((code) => (
          <option key={code} value={code}>
            {LANG_LABELS[code]}
          </option>
        ))}
      </select>
    </label>
  );
}
