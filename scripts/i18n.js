/**
 * 다국어 지원 런타임 (정적 HTML 페이지용)
 *
 * 설계 원칙
 * ─────────────────────────────────────────────────────────────────────────
 * 1. 영어를 HTML 안에 그대로 남긴다.
 *    data-i18n 으로 표시만 해두고 원문은 지우지 않는다. 그래서
 *      - JS 가 실패하거나 사전을 못 받아도 영어가 그대로 보인다
 *      - 검색엔진과 스크린리더가 빈 화면을 보지 않는다
 *    번역이 "덮어쓰는" 구조라 최악의 실패 모드가 없다.
 *
 * 2. 게임 데이터는 번역하지 않는다.
 *    아이템명(DARK FLOW), 스탯 표기(ATP : 320 - 350), 스페셜(Charge),
 *    클래스명(HUmar), Section ID(Viridia) 는 전 세계 PSOBB 플레이어가
 *    영어로 쓴다. 번역하면 오히려 검색과 소통이 어려워진다.
 *    번역 대상은 UI 라벨과 설명 문장뿐이다.
 *
 * 3. 레이아웃을 깨지 않는다.
 *    언어에 따라 문자열 길이가 크게 달라지므로(프랑스어/스페인어는 영어보다
 *    20~30% 길다) 번역문은 짧게 다듬고, 헤더처럼 폭이 빡빡한 곳은
 *    줄바꿈 대신 축약형을 쓴다. 검증은 _qa 도구로 5개 언어 전부 돌린다.
 *
 * 마크업 규칙
 * ─────────────────────────────────────────────────────────────────────────
 *   <p data-i18n="index.hero.desc">English text</p>
 *   <img data-i18n-alt="header.logo.alt" alt="English alt">
 *   <input data-i18n-placeholder="db.search.placeholder" placeholder="...">
 *   <button data-i18n-aria-label="header.theme.toDark" aria-label="...">
 *
 * 여러 속성을 동시에 지정할 수 있다.
 */

(function () {
  "use strict";

  var LANG_KEY = "destiny-guide-lang";
  var SUPPORTED = ["en", "ko", "ja", "es", "fr"];
  var DEFAULT_LANG = "en";

  /** 사전 경로. 페이지가 루트에 있으므로 상대 경로로 충분하다. */
  function dictUrl(lang) {
    return "./i18n/" + lang + ".json";
  }

  function readStoredLang() {
    try {
      var stored = window.localStorage.getItem(LANG_KEY);
      return SUPPORTED.indexOf(stored) >= 0 ? stored : null;
    } catch (error) {
      return null;
    }
  }

  /** 저장된 값 -> 브라우저 언어 -> 영어 */
  function detectLang() {
    var stored = readStoredLang();
    if (stored) return stored;

    var candidates = (navigator.languages || [navigator.language || ""]).slice();
    for (var i = 0; i < candidates.length; i += 1) {
      var base = String(candidates[i] || "").toLowerCase().split("-")[0];
      if (SUPPORTED.indexOf(base) >= 0) return base;
    }
    return DEFAULT_LANG;
  }

  function storeLang(lang) {
    try {
      window.localStorage.setItem(LANG_KEY, lang);
    } catch (error) {
      /* 저장이 막혀 있어도 화면 전환은 되어야 한다 */
    }
  }

  var cache = {};

  function loadDict(lang) {
    if (lang === DEFAULT_LANG) return Promise.resolve(null); // 영어는 원문 그대로
    if (cache[lang]) return Promise.resolve(cache[lang]);
    return fetch(dictUrl(lang))
      .then(function (res) {
        if (!res.ok) throw new Error("dictionary " + res.status);
        return res.json();
      })
      .then(function (dict) {
        cache[lang] = dict;
        return dict;
      })
      .catch(function (error) {
        console.warn("[i18n] " + lang + " 사전을 불러오지 못했습니다. 영어로 표시합니다.", error);
        return null;
      });
  }

  /**
   * 원문을 보관해 둔다. 다른 언어로 갔다가 영어로 돌아올 때 복원해야 한다.
   * 사전에 키가 없는 항목도 원문으로 되돌린다.
   */
  function rememberOriginals(root) {
    root.querySelectorAll("[data-i18n]").forEach(function (el) {
      if (el.dataset.i18nOriginal === undefined) el.dataset.i18nOriginal = el.textContent;
    });
    ["alt", "placeholder", "title", "aria-label"].forEach(function (attr) {
      var key = "data-i18n-" + attr;
      root.querySelectorAll("[" + key + "]").forEach(function (el) {
        var store = "i18nOriginal" + attr.replace(/(^|-)([a-z])/g, function (m, p1, p2) {
          return p2.toUpperCase();
        });
        if (el.dataset[store] === undefined) el.dataset[store] = el.getAttribute(attr) || "";
      });
    });
  }

  function lookup(dict, key) {
    if (!dict) return undefined;
    var value = dict[key];
    return typeof value === "string" ? value : undefined;
  }

  function applyDict(dict, root) {
    var scope = root || document;

    scope.querySelectorAll("[data-i18n]").forEach(function (el) {
      var translated = lookup(dict, el.dataset.i18n);
      el.textContent = translated !== undefined ? translated : (el.dataset.i18nOriginal || el.textContent);
    });

    ["alt", "placeholder", "title", "aria-label"].forEach(function (attr) {
      var attrKey = "data-i18n-" + attr;
      var store = "i18nOriginal" + attr.replace(/(^|-)([a-z])/g, function (m, p1, p2) {
        return p2.toUpperCase();
      });
      scope.querySelectorAll("[" + attrKey + "]").forEach(function (el) {
        var translated = lookup(dict, el.getAttribute(attrKey));
        var value = translated !== undefined ? translated : el.dataset[store];
        if (value !== undefined) el.setAttribute(attr, value);
      });
    });
  }

  var current = DEFAULT_LANG;

  function setLang(lang, persist) {
    if (SUPPORTED.indexOf(lang) < 0) lang = DEFAULT_LANG;
    current = lang;
    document.documentElement.setAttribute("lang", lang);
    if (persist) storeLang(lang);

    return loadDict(lang).then(function (dict) {
      rememberOriginals(document);
      applyDict(dict);
      updateSwitcher();
      document.dispatchEvent(new CustomEvent("destiny-lang-change", { detail: { lang: lang } }));
      return lang;
    });
  }

  var LABELS = { en: "EN", ko: "한국어", ja: "日本語", es: "Español", fr: "Français" };
  var SHORT = { en: "EN", ko: "KO", ja: "JA", es: "ES", fr: "FR" };

  function updateSwitcher() {
    document.querySelectorAll("[data-lang-select]").forEach(function (select) {
      if (select.value !== current) select.value = current;
    });
    document.querySelectorAll("[data-lang-current]").forEach(function (el) {
      el.textContent = SHORT[current] || "EN";
    });
    // CSS ::after 로 현재 언어 코드를 보여준다. select 폭을 고정해 두었기 때문에
    // 언어명이 길어져도 헤더 폭이 변하지 않는다.
    document.querySelectorAll(".lang_switch").forEach(function (el) {
      el.setAttribute("data-current", SHORT[current] || "EN");
    });
  }

  /** 헤더가 나중에 주입되므로, 셀렉트가 생길 때마다 연결한다. */
  function bindSwitchers(root) {
    (root || document).querySelectorAll("[data-lang-select]").forEach(function (select) {
      if (select.dataset.i18nBound === "1") return;
      select.dataset.i18nBound = "1";
      SUPPORTED.forEach(function (lang) {
        if ([].some.call(select.options, function (o) { return o.value === lang; })) return;
        var option = document.createElement("option");
        option.value = lang;
        option.textContent = LABELS[lang];
        select.appendChild(option);
      });
      select.value = current;
      select.addEventListener("change", function () {
        setLang(select.value, true);
      });
    });
    updateSwitcher();
  }

  /** 이미 불러온 사전에서 문구를 꺼낸다. JS 로 만드는 DOM 에서 쓴다. */
  function translate(key, fallbackEnglish) {
    var dict = cache[current];
    return (dict && dict[key]) || fallbackEnglish;
  }

  window.DestinyI18n = {
    supported: SUPPORTED.slice(),
    labels: LABELS,
    t: translate,
    get lang() { return current; },
    setLang: function (lang) { return setLang(lang, true); },
    /** 헤더처럼 나중에 추가된 DOM 에 번역과 셀렉트 연결을 적용한다. */
    hydrate: function (root) {
      rememberOriginals(root || document);
      bindSwitchers(root);
      return loadDict(current).then(function (dict) {
        applyDict(dict, root);
      });
    },
  };

  // lang 속성은 사전 로드보다 먼저 맞춰 둔다 (폰트/줄바꿈 규칙에 영향)
  document.documentElement.setAttribute("lang", detectLang());

  function start() {
    bindSwitchers(document);
    setLang(detectLang(), false);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", start);
  } else {
    start();
  }
})();
