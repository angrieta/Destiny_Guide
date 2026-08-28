/**
 * 헤더 검색 (정적 HTML 페이지용)
 *
 * 왜 입력창이 아니라 버튼인가
 * ─────────────────────────────────────────────────────────────────────────
 * 헤더 오른쪽에는 이미 Happy Hour, Drop Tables, Database, 언어, 테마, Discord,
 * Menu 가 들어 있다. 여기에 입력창을 끼우면 1160px 부근에서 내비가 밀려 줄바꿈이
 * 난다. 그래서 헤더에는 좁은 버튼만 두고, 누르면 화면 가운데에 검색창을 연다.
 * 단축키(Ctrl/Cmd+K, /)로도 열리므로 실제로는 입력창보다 빠르다.
 *
 * 무엇을 찾는가
 * ─────────────────────────────────────────────────────────────────────────
 *   - 사이트 안의 페이지 (가이드/레이드/데이터)
 *   - 아이템 1000여 개. Destiny 전용 아이템은 item_page.html 의 상세창으로,
 *     나머지는 /database/ 의 상세로 보낸다.
 * 인덱스는 scripts/build-search-index.mjs 가 만든 data/search-index.json 하나다.
 *
 * 검색어를 못 받아도 페이지는 그대로 동작해야 한다. 인덱스 요청이 실패하면
 * 페이지 목록만으로 계속 쓸 수 있게 두고, 조용히 넘어간다.
 *
 * React 라우트(/database, /drop-tables, /redeem)에는 같은 UI 가
 * app/components/SiteSearch.tsx 로 한 번 더 있다. 헤더 자체가 그렇게 이원화되어
 * 있어서(header.html vs SiteHeader.tsx) 이 구조를 따랐다. 한쪽을 고치면 반대쪽도
 * 함께 고쳐야 한다. 인덱스와 CSS 는 공유하므로 결과 모양은 자동으로 같이 간다.
 */

(function () {
  "use strict";

  var INDEX_URL = "./data/search-index.json";
  var RECENT_KEY = "destiny-guide-recent-search";
  var RECENT_LIMIT = 5;
  var MAX_PAGE_RESULTS = 5;
  var MAX_ITEM_RESULTS = 24;

  /**
   * 검색어가 없고 최근 기록도 없을 때 보여줄 목록.
   * 페이지 순서대로 자르면 레이드 4개가 자리를 다 먹어서 Drop Tables / Database 가
   * 밀린다. 처음 열었을 때 가장 쓸모 있는 순서로 직접 골라 둔다.
   */
  var QUICK_LINKS = [
    "beginner_page.html",
    "item_page.html",
    "database/",
    "drop-tables/",
    "class_builds.html",
    "player_tools.html",
    "redeem/",
    "quest_data_page.html"
  ];

  var GROUP_LABELS = {
    guide: ["search.group.guide", "Guides"],
    raid: ["search.group.raid", "Raids"],
    tool: ["search.group.tool", "Tools"],
    data: ["search.group.data", "Data"]
  };

  function t(key, fallback) {
    return (window.DestinyI18n && window.DestinyI18n.t(key, fallback)) || fallback;
  }

  /**
   * 돋보기 아이콘. currentColor 로 그려서 테마와 hover 색을 따라간다.
   * header.html 의 검색 버튼에도 같은 모양이 들어 있다.
   */
  function searchIcon(className) {
    return (
      '<svg class="' + className + '" viewBox="0 0 16 16" aria-hidden="true" focusable="false">' +
      '<circle cx="7" cy="7" r="4.5" fill="none" stroke="currentColor" stroke-width="1.6"></circle>' +
      '<path d="M10.6 10.6 14 14" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"></path>' +
      "</svg>"
    );
  }

  /** 인덱스를 만들 때 쓴 normalize 와 같아야 점수가 맞는다. */
  function normalize(value) {
    return String(value == null ? "" : value)
      .normalize("NFKD")
      .toLowerCase()
      .replace(/[’']/g, "")
      .replace(/[^a-z0-9]+/g, " ")
      .trim();
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  /**
   * 이름 안에서 검색어와 겹치는 부분을 <mark> 로 감싼다.
   * 원문 그대로 보여줘야 하므로 normalize 한 문자열이 아니라 위치만 찾아 쓴다.
   */
  function highlight(name, query) {
    if (!query) return escapeHtml(name);
    var at = name.toLowerCase().indexOf(query.toLowerCase());
    if (at < 0) return escapeHtml(name);
    return (
      escapeHtml(name.slice(0, at)) +
      "<mark>" +
      escapeHtml(name.slice(at, at + query.length)) +
      "</mark>" +
      escapeHtml(name.slice(at + query.length))
    );
  }

  /**
   * 점수 규칙. 위에서부터 강한 일치다.
   *   정확히 같음 > 앞에서부터 일치 > 단어 첫머리 일치 > 어딘가 포함 > 낱말 전부 포함
   * 마지막 단계 덕분에 "charge dagger" 처럼 이름에 없는 조합도 찾힌다.
   * 짧은 이름을 조금 우대해서 DARK FLOW 가 DARK FLOW REPLICA 보다 위로 온다.
   */
  function score(name, searchText, aliases, query, tokens) {
    if (!query) return 0;
    if (name === query) return 1000;

    // 약칭이 검색어와 통째로 같으면 이름을 그대로 친 것이나 다름없다.
    // PSOBB 는 줄여 부르는 장비가 많다("df" = DARK FLOW). 이름 앞부분이 우연히
    // 겹치는 DF FIELD 보다 이쪽이 위로 와야 찾는 물건이 먼저 보인다.
    if (aliases && (" " + aliases + " ").indexOf(" " + query + " ") >= 0) {
      return 950 - Math.min(name.length, 60) * 0.5;
    }

    var found = 0;
    if (name.indexOf(query) === 0) found = 700;
    else if ((" " + name).indexOf(" " + query) >= 0) found = 520;
    else if (name.indexOf(query) > 0) found = 340;
    else if (searchText.indexOf(query) >= 0) found = 220;

    if (!found) {
      for (var i = 0; i < tokens.length; i += 1) {
        if (searchText.indexOf(tokens[i]) < 0) return 0;
      }
      found = 120;
    }

    return found - Math.min(name.length, 60) * 0.5;
  }

  function readRecent() {
    try {
      var raw = window.localStorage.getItem(RECENT_KEY);
      var parsed = raw ? JSON.parse(raw) : [];
      return Array.isArray(parsed) ? parsed.slice(0, RECENT_LIMIT) : [];
    } catch (error) {
      return [];
    }
  }

  function pushRecent(entry) {
    try {
      var list = readRecent().filter(function (item) {
        return item && item.u !== entry.u;
      });
      list.unshift(entry);
      window.localStorage.setItem(RECENT_KEY, JSON.stringify(list.slice(0, RECENT_LIMIT)));
    } catch (error) {
      /* 저장이 막혀 있어도 검색은 되어야 한다 */
    }
  }

  /**
   * 검색 오버레이. 페이지당 하나만 만든다.
   *
   * options.base 는 결과 링크 앞에 붙일 경로다. 정적 페이지는 루트에 있으므로
   * "./" 이고, /database/ 같은 하위 경로에서는 "../" 가 된다.
   */
  function createSearchOverlay(options) {
    var base = (options && options.base) || "./";
    var indexUrl = (options && options.indexUrl) || INDEX_URL;

    var index = null;
    var loading = null;
    var loadFailed = false;
    var activeIndex = 0;
    var results = [];
    var lastFocus = null;

    var overlay = document.createElement("div");
    overlay.className = "ds_search";
    overlay.hidden = true;
    overlay.innerHTML =
      '<div class="ds_search_dim" data-search-dismiss></div>' +
      '<div class="ds_search_panel" role="dialog" aria-modal="true" aria-label="' +
      escapeHtml(t("search.dialog.label", "Search the site")) +
      '">' +
      '<div class="ds_search_field">' +
      searchIcon("ds_search_icon") +
      '<input class="ds_search_input" type="text" autocomplete="off" spellcheck="false"' +
      ' role="combobox" aria-expanded="true" aria-controls="ds-search-results" aria-autocomplete="list">' +
      '<button type="button" class="ds_search_dismiss" data-search-dismiss>Esc</button>' +
      "</div>" +
      '<div class="ds_search_results" id="ds-search-results" role="listbox"></div>' +
      '<div class="ds_search_foot">' +
      '<span><kbd>↑</kbd><kbd>↓</kbd> <span class="ds_search_foot_label"></span></span>' +
      '<span><kbd>Enter</kbd> <span class="ds_search_foot_open"></span></span>' +
      '<span class="ds_search_count"></span>' +
      "</div>" +
      "</div>";
    document.body.appendChild(overlay);

    var input = overlay.querySelector(".ds_search_input");
    var list = overlay.querySelector(".ds_search_results");
    var count = overlay.querySelector(".ds_search_count");
    var panel = overlay.querySelector(".ds_search_panel");

    function applyStrings() {
      input.placeholder = t("search.placeholder", "Search items, guides, raids…");
      panel.setAttribute("aria-label", t("search.dialog.label", "Search the site"));
      overlay.querySelector(".ds_search_foot_label").textContent = t("search.hint.move", "to move");
      overlay.querySelector(".ds_search_foot_open").textContent = t("search.hint.open", "to open");
    }
    applyStrings();
    document.addEventListener("destiny-lang-change", function () {
      applyStrings();
      if (!overlay.hidden) render();
    });

    function loadIndex() {
      if (index || loading) return loading || Promise.resolve(index);
      loading = fetch(indexUrl, { cache: "force-cache" })
        .then(function (response) {
          if (!response.ok) throw new Error("search index " + response.status);
          return response.json();
        })
        .then(function (payload) {
          index = payload;
          loading = null;
          if (!overlay.hidden) render();
          return payload;
        })
        .catch(function (error) {
          console.warn("[search] 인덱스를 불러오지 못했습니다. 페이지 검색만 동작합니다.", error);
          loadFailed = true;
          loading = null;
          if (!overlay.hidden) render();
          return null;
        });
      return loading;
    }

    /** 페이지는 번역된 제목으로도 찾을 수 있어야 한다. */
    function pageTitle(page) {
      return t(page.k, page.t);
    }

    function search(rawQuery) {
      var query = normalize(rawQuery);
      var tokens = query.split(" ").filter(Boolean);
      var pages = (index && index.pages) || [];
      var items = (index && index.items) || [];
      var out = [];

      for (var p = 0; p < pages.length; p += 1) {
        var page = pages[p];
        var title = pageTitle(page);
        var haystack = normalize(title + " " + page.t + " " + page.d + " " + page.g);
        var pageScore = score(normalize(title), haystack, "", query, tokens);
        if (pageScore > 0) {
          out.push({
            kind: "page",
            name: title,
            // page.d 는 화면에 쓰지 않고 검색어로만 쓴다. 아이템 쪽 meta 는 게임
            // 데이터라 번역 대상이 아니지만, 페이지 설명은 번역이 필요한 문장이다.
            // 19줄을 5개 언어로 늘리는 대신 제목과 분류 뱃지만 보여준다.
            meta: "",
            badge: t(GROUP_LABELS[page.g][0], GROUP_LABELS[page.g][1]),
            url: page.u,
            score: pageScore + 60,
            exclusive: false
          });
        }
      }

      out.sort(function (a, b) {
        return b.score - a.score;
      });
      var pageResults = out.slice(0, MAX_PAGE_RESULTS);

      var itemResults = [];
      for (var i = 0; i < items.length; i += 1) {
        var row = items[i];
        var itemScore = score(normalize(row[0]), row[4], row[6], query, tokens);
        if (itemScore <= 0) continue;
        itemResults.push({
          kind: "item",
          name: row[0],
          meta: row[3],
          badge: row[2],
          url: row[1],
          // Destiny 전용 아이템은 이 서버에서 찾는 빈도가 훨씬 높아 위로 올린다.
          score: itemScore + (row[5] ? 90 : 0),
          exclusive: Boolean(row[5])
        });
      }
      itemResults.sort(function (a, b) {
        return b.score - a.score;
      });

      return pageResults.concat(itemResults.slice(0, MAX_ITEM_RESULTS));
    }

    /** 검색어가 없을 때 보여줄 것: 최근에 연 항목, 없으면 주요 페이지. */
    function defaultResults() {
      var recent = readRecent().map(function (entry) {
        return {
          kind: entry.kind,
          name: entry.n,
          meta: entry.m,
          badge: entry.b,
          url: entry.u,
          exclusive: Boolean(entry.x),
          recent: true
        };
      });
      if (recent.length) return recent;

      var pages = (index && index.pages) || [];
      return QUICK_LINKS.map(function (url) {
        return pages.filter(function (page) {
          return page.u === url;
        })[0];
      })
        .filter(Boolean)
        .map(function (page) {
          return {
            kind: "page",
            name: pageTitle(page),
            meta: "",
            badge: t(GROUP_LABELS[page.g][0], GROUP_LABELS[page.g][1]),
            url: page.u,
            exclusive: false
          };
        });
    }

    function render() {
      var query = input.value.trim();
      var showingDefault = query.length === 0;
      results = showingDefault ? defaultResults() : search(query);
      activeIndex = 0;

      if (!index && !loadFailed) {
        list.innerHTML = '<p class="ds_search_note">' + escapeHtml(t("search.loading", "Loading…")) + "</p>";
        count.textContent = "";
        return;
      }

      if (!results.length) {
        list.innerHTML =
          '<p class="ds_search_note">' +
          escapeHtml(t("search.empty", "Nothing matched. Try an item name, a class, or a special.")) +
          "</p>";
        count.textContent = "";
        return;
      }

      var heading = showingDefault
        ? readRecent().length
          ? t("search.recent", "Recent")
          : t("search.jumpTo", "Jump to")
        : "";

      var html = heading ? '<p class="ds_search_heading">' + escapeHtml(heading) + "</p>" : "";

      for (var i = 0; i < results.length; i += 1) {
        var result = results[i];
        html +=
          '<a class="ds_search_result" role="option" id="ds-result-' + i + '"' +
          ' aria-selected="' + (i === 0 ? "true" : "false") + '"' +
          ' href="' + escapeHtml(base + result.url) + '" data-result="' + i + '">' +
          '<span class="ds_search_result_main">' +
          '<span class="ds_search_result_name">' + highlight(result.name, query) + "</span>" +
          (result.meta ? '<span class="ds_search_result_meta">' + escapeHtml(result.meta) + "</span>" : "") +
          "</span>" +
          '<span class="ds_search_result_badge' + (result.exclusive ? " is_exclusive" : "") + '">' +
          escapeHtml(result.badge) +
          "</span>" +
          "</a>";
      }

      list.innerHTML = html;
      count.textContent = showingDefault
        ? ""
        : results.length + (results.length >= MAX_ITEM_RESULTS ? "+" : "");
      input.setAttribute("aria-activedescendant", "ds-result-0");
      list.scrollTop = 0;
    }

    function setActive(next) {
      if (!results.length) return;
      var previous = list.querySelector('[data-result="' + activeIndex + '"]');
      if (previous) previous.setAttribute("aria-selected", "false");

      activeIndex = (next + results.length) % results.length;
      var current = list.querySelector('[data-result="' + activeIndex + '"]');
      if (!current) return;
      current.setAttribute("aria-selected", "true");
      input.setAttribute("aria-activedescendant", current.id);

      // scrollIntoView 는 뒤에 있는 페이지까지 같이 움직여서 쓰지 않는다.
      var top = current.offsetTop;
      var bottom = top + current.offsetHeight;
      if (top < list.scrollTop) list.scrollTop = top;
      else if (bottom > list.scrollTop + list.clientHeight) list.scrollTop = bottom - list.clientHeight;
    }

    function remember(result) {
      pushRecent({ kind: result.kind, n: result.name, m: result.meta, b: result.badge, u: result.url, x: result.exclusive ? 1 : 0 });
    }

    function open() {
      if (!overlay.hidden) return;
      lastFocus = document.activeElement;
      overlay.hidden = false;
      document.documentElement.classList.add("ds_search_open");
      input.value = "";
      loadIndex();
      render();
      input.focus();
    }

    function close() {
      if (overlay.hidden) return;
      overlay.hidden = true;
      document.documentElement.classList.remove("ds_search_open");
      if (lastFocus && lastFocus.focus) lastFocus.focus({ preventScroll: true });
    }

    input.addEventListener("input", render);

    input.addEventListener("keydown", function (event) {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        setActive(activeIndex + 1);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        setActive(activeIndex - 1);
      } else if (event.key === "Enter") {
        var current = results[activeIndex];
        if (!current) return;
        event.preventDefault();
        remember(current);
        window.location.href = base + current.url;
      } else if (event.key === "Escape") {
        event.preventDefault();
        close();
      }
    });

    list.addEventListener("click", function (event) {
      var link = event.target.closest("[data-result]");
      if (!link) return;
      var result = results[Number(link.dataset.result)];
      if (result) remember(result);
      close();
    });

    list.addEventListener("pointermove", function (event) {
      var link = event.target.closest("[data-result]");
      if (!link) return;
      var next = Number(link.dataset.result);
      if (next !== activeIndex) setActive(next);
    });

    overlay.addEventListener("click", function (event) {
      if (event.target.closest("[data-search-dismiss]")) close();
    });

    return { open: open, close: close, prefetch: loadIndex, isOpen: function () { return !overlay.hidden; } };
  }

  var overlay = null;

  function ensureOverlay(options) {
    if (!overlay) overlay = createSearchOverlay(options);
    return overlay;
  }

  /**
   * 헤더 안의 검색 버튼을 연결한다. 헤더는 include.js 가 나중에 주입하므로
   * 헤더가 DOM 에 들어온 뒤 불러야 한다.
   */
  function mount(root, options) {
    var scope = root || document;
    var trigger = scope.querySelector("[data-search-trigger]");
    if (!trigger || trigger.dataset.searchBound === "1") return;
    trigger.dataset.searchBound = "1";

    var api = ensureOverlay(options);

    // 버튼에 마우스만 올려도 인덱스를 미리 받아 둔다. 열었을 때 기다리지 않게.
    trigger.addEventListener("pointerenter", api.prefetch, { once: true });
    trigger.addEventListener("focus", api.prefetch, { once: true });
    trigger.addEventListener("click", api.open);

    // 맥은 ⌘K 로 적어 준다. 윈도우/리눅스는 Ctrl.
    var hint = trigger.querySelector(".ds_search_trigger_key");
    if (hint) hint.textContent = /Mac|iPhone|iPad/.test(navigator.platform || "") ? "⌘K" : "Ctrl K";
  }

  /** 어떤 페이지에서도 단축키로 열 수 있게 한 번만 등록한다. */
  document.addEventListener("keydown", function (event) {
    var typing =
      event.target instanceof HTMLElement &&
      (event.target.tagName === "INPUT" ||
        event.target.tagName === "TEXTAREA" ||
        event.target.tagName === "SELECT" ||
        event.target.isContentEditable);

    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      if (overlay) overlay.open();
      return;
    }

    // "/" 는 글을 쓰고 있지 않을 때만. 입력창에서는 그냥 슬래시여야 한다.
    if (event.key === "/" && !typing && !event.ctrlKey && !event.metaKey && !event.altKey) {
      if (!overlay) return;
      event.preventDefault();
      overlay.open();
    }
  });

  window.DestinySearch = { mount: mount, create: createSearchOverlay };
})();
