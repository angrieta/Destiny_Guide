/**
 * 모드 · 스킨 갤러리
 *
 * 자료는 data/mods.json 에 있고 이 파일은 그리기만 한다.
 * 파일 자체는 재호스팅하지 않는다. 카드의 버튼은 전부 원본 배포처로 나가고,
 * 원본이 사라질 수 있다는 점을 페이지에서 먼저 밝힌다.
 *
 * 이미지는 아직 비어 있는 항목이 많다. 없는 자리는 빈칸으로 두지 않고
 * 분류 글자를 넣은 자리표시자를 그린다 — 목록의 높이가 들쭉날쭉해지지 않게 하려는 것이다.
 */
(function () {
  "use strict";

  function t(key, fallback) {
    return (window.DestinyI18n && window.DestinyI18n.t(key, fallback)) || fallback;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function normalize(value) {
    return String(value == null ? "" : value).toLowerCase().trim();
  }

  /** mediafire.com -> MediaFire 처럼 어디로 나가는지 버튼에 적어 준다. */
  function hostLabel(url) {
    try {
      var host = new URL(url).hostname.replace(/^www\./, "");
      if (/mediafire/.test(host)) return "MediaFire";
      if (/mega\.nz/.test(host)) return "MEGA";
      // 디스코드에 파일을 직접 올린 모드. 첨부 URL 은 서명이 만료되므로 글로 보낸다.
      if (/discord\.com/.test(host)) return t("mod.onDiscord", "Discord post");
      if (/playpso/.test(host)) return "PlayPSO";
      if (/universps/.test(host)) return "Univers-PS";
      if (/pioneer2/.test(host)) return "Pioneer2";
      if (/steampowered/.test(host)) return "Steam";
      if (/reddit/.test(host)) return "Reddit";
      return host;
    } catch (error) {
      return "Link";
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    var mount = document.querySelector("[data-mods-mount]");
    if (!mount) return;

    var countEl = document.querySelector("[data-mods-count]");
    var searchEl = document.querySelector("[data-mods-search]");
    var sourcesEl = document.querySelector("[data-mods-sources]");
    var data = null;
    var category = "all";

    function card(mod, labels) {
      /* 미리보기는 카드에서 16:9 로 잘리므로, 눌러서 원본 비율로 볼 수 있게 버튼으로 감싼다. */
      var media = mod.image
        ? '<button type="button" class="md_shot_btn" data-full="' + escapeHtml(mod.image) +
          '" data-name="' + escapeHtml(mod.name) + '" data-by="' + escapeHtml(mod.author) +
          '" title="' + escapeHtml(t("mod.viewFull", "View the full image")) + '">' +
          '<img class="md_shot" src="' + escapeHtml(mod.image) + '" alt="' + escapeHtml(mod.name) + '" loading="lazy">' +
          "</button>"
        : '<div class="md_shot is_empty"><span>' + escapeHtml(labels[mod.cat] || mod.cat) + "</span></div>";

      var note = mod.note
        ? '<p class="md_note"' + (mod.noteKey ? ' data-i18n="' + escapeHtml(mod.noteKey) + '"' : "") + ">" +
          escapeHtml(mod.note) + "</p>"
        : "";

      return (
        '<article class="md_card' + (mod.featured ? " is_featured" : "") + '">' +
        media +
        '<div class="md_body">' +
        '<h3 class="md_name">' + escapeHtml(mod.name) +
        (mod.featured ? '<span class="md_star" title="' + escapeHtml(t("mod.featuredHint", "Most asked for in the channel")) + '">★</span>' : "") +
        "</h3>" +
        '<p class="md_meta"><span class="md_author"' + (mod.authorKey ? ' data-i18n="' + escapeHtml(mod.authorKey) + '"' : "") + ">" +
        escapeHtml(mod.author) + "</span><span class=\"md_date\">" + escapeHtml(mod.date) + "</span></p>" +
        note +
        '<a class="md_get" href="' + escapeHtml(mod.url) + '" target="_blank" rel="noreferrer">' +
        escapeHtml(t("mod.get", "Get it")) + " · " + escapeHtml(hostLabel(mod.url)) +
        "</a>" +
        "</div></article>"
      );
    }

    /**
     * 다시 그린 노드에 번역을 입힌다.
     *
     * 카드와 출처는 매번 innerHTML 로 새로 만들기 때문에, 그대로 두면 data-i18n 이
     * 붙어 있어도 영어 원문에 머문다. 검색·분류를 누를 때마다 번역이 풀리던 원인이다.
     */
    function applyI18n(node) {
      var api = window.DestinyI18n;
      if (api && typeof api.hydrate === "function" && node) api.hydrate(node);
    }

    function render() {
      if (!data) return;

      var labels = {};
      data.categories.forEach(function (c) { labels[c.key] = t(c.labelKey, c.label); });

      var query = normalize(searchEl ? searchEl.value : "");
      var list = data.mods.filter(function (mod) {
        if (category !== "all" && mod.cat !== category) return false;
        if (!query) return true;
        return (
          normalize(mod.name).indexOf(query) >= 0 ||
          normalize(mod.author).indexOf(query) >= 0 ||
          normalize(mod.note).indexOf(query) >= 0
        );
      });

      if (countEl) countEl.textContent = list.length + " / " + data.mods.length;

      if (!list.length) {
        mount.innerHTML = '<p class="md_empty">' + escapeHtml(t("mod.empty", "Nothing matched.")) + "</p>";
        applyI18n(mount);
        return;
      }

      // 대표작 → 미리보기 있는 것 → 최신순.
      // 갤러리라 첫 화면이 그림으로 채워져야 한다. 미리보기가 없는 넷은 대부분 외부 링크라
      // 아래로 내려가도 손해가 없다.
      var sorted = list.slice().sort(function (a, b) {
        if (Boolean(a.featured) !== Boolean(b.featured)) return a.featured ? -1 : 1;
        if (Boolean(a.image) !== Boolean(b.image)) return a.image ? -1 : 1;
        return String(b.date).localeCompare(String(a.date));
      });

      mount.innerHTML = '<div class="md_grid">' +
        sorted.map(function (mod) { return card(mod, labels); }).join("") + "</div>";
      applyI18n(mount);
    }

    function chips() {
      var wrap = document.querySelector("[data-mods-cats]");
      if (!wrap || !data) return;

      var all = '<button type="button" class="md_chip" data-cat="all" aria-pressed="true" data-i18n="mod.cat.all">All</button>';
      wrap.innerHTML = all + data.categories.map(function (c) {
        var n = data.mods.filter(function (m) { return m.cat === c.key; }).length;
        if (!n) return "";
        return '<button type="button" class="md_chip" data-cat="' + escapeHtml(c.key) + '" aria-pressed="false" data-i18n="' +
          escapeHtml(c.labelKey) + '">' + escapeHtml(c.label) + "</button>";
      }).join("");

      var buttons = Array.prototype.slice.call(wrap.querySelectorAll("[data-cat]"));
      buttons.forEach(function (button) {
        button.addEventListener("click", function () {
          category = button.getAttribute("data-cat");
          buttons.forEach(function (other) { other.setAttribute("aria-pressed", String(other === button)); });
          render();
        });
      });
    }

    function sources() {
      if (!sourcesEl || !data) return;
      sourcesEl.innerHTML = data.sources.map(function (s) {
        return '<li' + (s.primary ? ' class="is_primary"' : "") + '>' +
          '<a href="' + escapeHtml(s.url) + '" target="_blank" rel="noreferrer">' + escapeHtml(s.label) + "</a>" +
          (s.note ? ' — <span' + (s.noteKey ? ' data-i18n="' + escapeHtml(s.noteKey) + '"' : "") + ">" +
            escapeHtml(s.note) + "</span>" : "") +
          "</li>";
      }).join("");
      applyI18n(sourcesEl);
    }

    /* ── 원본 보기 ──────────────────────────────────────────────────────
       카드는 목록이 고르게 보이도록 16:9 로 자른다. 세로로 긴 스크린샷은 그
       과정에서 절반이 날아가므로, 눌렀을 때는 자르지 않고 통째로 보여 준다. */
    (function setupLightbox() {
      var box = document.querySelector("[data-mods-lightbox]");
      if (!box) return;

      var image = box.querySelector(".md_lb_img");
      var title = box.querySelector(".md_lb_cap b");
      var by = box.querySelector(".md_lb_cap span");
      var closeButton = box.querySelector(".md_lb_close");
      var lastFocus = null;

      function open(trigger) {
        lastFocus = trigger;
        image.src = trigger.getAttribute("data-full");
        image.alt = trigger.getAttribute("data-name") || "";
        title.textContent = trigger.getAttribute("data-name") || "";
        by.textContent = trigger.getAttribute("data-by") || "";
        box.hidden = false;
        document.body.classList.add("md_lb_open");
        closeButton.focus();
      }

      function close() {
        box.hidden = true;
        // src="" 로 두면 브라우저가 그것을 페이지 주소로 읽어 HTML 을 이미지로
        // 받으려다 실패한다. 닫을 때마다 헛된 요청과 에러가 하나씩 생긴다.
        image.removeAttribute("src");
        document.body.classList.remove("md_lb_open");
        // 목록에서 보던 자리로 초점을 돌려 준다.
        if (lastFocus && document.contains(lastFocus)) lastFocus.focus();
        lastFocus = null;
      }

      document.addEventListener("click", function (event) {
        var trigger = event.target.closest && event.target.closest(".md_shot_btn");
        if (trigger) { open(trigger); return; }
        if (event.target.closest && event.target.closest("[data-lb-close]")) close();
      });

      document.addEventListener("keydown", function (event) {
        if (event.key === "Escape" && !box.hidden) close();
      });
    })();

    if (searchEl) searchEl.addEventListener("input", render);

    fetch("./data/mods.json", { cache: "no-cache" })
      .then(function (response) {
        if (!response.ok) throw new Error("mods " + response.status);
        return response.json();
      })
      .then(function (payload) {
        data = payload;
        chips();
        sources();
        render();
        applyI18n(document);
        document.addEventListener("destiny-lang-change", function () {
          render();
          sources();
        });
      })
      .catch(function (error) {
        console.warn("[mods] 목록을 불러오지 못했습니다.", error);
        mount.innerHTML = '<p class="md_empty">' + escapeHtml(t("mod.loadFail", "The list could not be loaded.")) + "</p>";
      });
  });
})();
