/* ==========================================================================
   item_page 그리드 뷰
   ==========================================================================
   기존 item_page 는 카테고리마다 Swiper 캐러셀이었다. 카드가 121개로 늘면서
   - 이름으로 찾을 방법이 없고
   - 390px 에서 한 번에 1.2장만 보여 마지막 실드까지 25번 스와이프해야 하고
   - PC 에는 화살표조차 없어 마우스로 드래그해야 했다.

   이 스크립트는 같은 카드 DOM 을 그대로 쓰면서 컨테이너만 그리드로 바꾸고,
   위에 검색창과 결과 수를 붙인다. 카드 마크업과 상세 모달은 건드리지 않으므로
   destiny_catalog.js 의 클릭 핸들러와 i18n 이 그대로 동작한다.

   실행 순서(둘 다 defer):
     destiny_catalog.js  카드/섹션 생성 · 필터 · 모달 배선
     item_grid.js        (이 파일) 캐러셀 컨테이너 -> 그리드 + 검색 UI
     index.js            .destiny_item_swiper 가 남아 있으면 Swiper 초기화.
                         이 페이지는 data-destiny-item-grid 마커로 건너뛴다.
   ========================================================================== */
(function () {
    "use strict";

    var root = document.querySelector("[data-destiny-item-grid]");
    if (!root) return;

    /* 영어 원문. 사전이 늦게 와도 이 값이 먼저 보인다. */
    var EN = {
        "ig.search.ph": "Search by name, type, or special",
        "ig.search.label": "Search items",
        "ig.search.clear": "Clear search",
        "ig.count.all": "{total} items",
        "ig.count.some": "{shown} of {total} items",
        "ig.sec.count": "{n} items",
        "ig.sec.count.some": "{shown} / {n}",
        "ig.more": "Show {n} more",
        "ig.less": "Show less",
        "ig.empty.title": "No matching items",
        "ig.empty.desc": "Try a shorter keyword, or pick another category.",
        "ig.empty.reset": "Show all items",
        "ig.db.text": "Looking for an item that is not here? The Item Database has every item with search and filters.",
        "ig.db.cta": "Open Item Database"
    };

    function t(key) {
        var api = window.DestinyI18n;
        var value = api && typeof api.t === "function" ? api.t(key, EN[key]) : EN[key];
        return value || EN[key] || key;
    }

    /** "{n} items" 처럼 자리표시자가 든 문구를 채운다. 번역에도 자리표시자가 남아 있어야 한다. */
    function fill(key, values) {
        var text = t(key);
        Object.keys(values).forEach(function (name) {
            text = text.split("{" + name + "}").join(String(values[name]));
        });
        return text;
    }

    /* ----------------------------------------------------------------------
       1. 캐러셀 컨테이너를 그리드로 바꾼다.
       ---------------------------------------------------------------------- */
    var sections = [];

    function toGrid() {
        root.querySelectorAll(".destiny_item_block").forEach(function (block) {
            var carousel = block.querySelector(".destiny_item_swiper");
            if (!carousel) return;

            var track = carousel.querySelector(".swiper-wrapper");
            if (!track) return;

            /* swiper 클래스를 전부 떼어낸다. swiper-bundle.min.css 는 우리 CSS 보다
               뒤에 로드되므로, 클래스를 남겨 두면 overflow: hidden 이나
               flex-shrink: 0 같은 규칙을 특정성으로 이겨야 한다. 아예 떼는 게 안전하다. */
            carousel.classList.remove("swiper", "destiny_item_swiper");
            carousel.classList.add("ig_grid");
            carousel.removeAttribute("data-destiny-swiper");

            track.classList.remove("swiper-wrapper");
            track.classList.add("ig_grid_inner");

            var cards = [];
            track.querySelectorAll(".destiny_item_slide").forEach(function (slide) {
                slide.classList.remove("swiper-slide");
                slide.removeAttribute("style"); /* Swiper 가 남겼을 수 있는 인라인 폭 */
                cards.push(slide);
            });

            /* 진행바는 캐러셀 전용이라 의미가 없어졌다. */
            var pagination = block.querySelector(".destiny_item_pagination");
            if (pagination) pagination.remove();

            /* 섹션 설명이 "좌우로 넘겨서 보세요" 였던 자리에는
               클릭 안내가 들어간다(HTML 에서 키를 바꿔 두었다). */

            /* 섹션 헤더에 개수 배지 */
            var title = block.querySelector(".destiny_item_title");
            var badge = null;
            if (title) {
                badge = document.createElement("span");
                badge.className = "ig_seccount";
                title.appendChild(badge);
            }

            /* 더 보기 버튼 */
            var moreWrap = document.createElement("div");
            moreWrap.className = "ig_more_wrap";
            var moreBtn = document.createElement("button");
            moreBtn.type = "button";
            moreBtn.className = "ig_more";
            moreWrap.appendChild(moreBtn);
            carousel.appendChild(moreWrap);

            var section = {
                block: block,
                track: track,
                cards: cards,
                badge: badge,
                moreWrap: moreWrap,
                moreBtn: moreBtn,
                expanded: false
            };

            moreBtn.addEventListener("click", function () {
                section.expanded = !section.expanded;
                render();
                if (!section.expanded) {
                    block.scrollIntoView({ block: "start", behavior: "smooth" });
                }
            });

            sections.push(section);
        });
    }

    /* ----------------------------------------------------------------------
       1-2. 모바일 압축 행
       ---------------------------------------------------------------------- */
    /*
      모바일에서 카드 한 장이 약 470px 이라 세로가 너무 길어진다. 560px 미만에서는
      카드(.item_inner) 대신 한 줄 행(.ig_row, 약 88px)을 보여 준다.

      카드 DOM 은 건드리지 않고 같은 <a>/<button> 안에 행을 하나 더 넣는다. 그래서
      - destiny_catalog.js 의 클릭 핸들러와 상세 모달이 그대로 동작하고
      - readExistingCard() 가 읽는 .item_info / .item_detail 도 그대로 남는다.
      행에는 그 클래스를 쓰지 않는다(썼다면 모달에 같은 줄이 두 번 들어간다).

      카드가 두 종류다:
        정적 카드 47장   .important_info(별점) 있음, 첫 .item_info 는 라벨 없는 "ATP : ..."
        카탈로그 71장    별점 없음, 첫 줄이 "Class: All" / "Type: ..." 로 시작
      그래서 Class / Type 라벨 줄은 건너뛰고 그다음 두 줄을 쓴다.
    */
    var SKIP_LABELS = { "stat.class": 1, "stat.type": 1 };

    function labelKey(el) {
        var span = el.querySelector("[data-i18n]");
        return span ? span.dataset.i18n : "";
    }

    function buildCompactRows() {
        sections.forEach(function (section) {
            section.cards.forEach(function (card) {
                var link = card.querySelector(".item_section_aria");
                if (!link || link.querySelector(".ig_row")) return;

                var image = card.querySelector(".item_img img");
                var nameEl = card.querySelector(".item_title .item_name") || card.querySelector(".item_name");
                var starsEl = card.querySelector(".important_info");
                var typeEl = card.querySelector(".item_type");

                /* Class / Type 은 행에 따로 보여 주므로 후보에서 뺀다. */
                var infos = Array.prototype.filter.call(
                    card.querySelectorAll(".item_info"),
                    function (el) { return !SKIP_LABELS[labelKey(el)]; }
                );
                var special = infos.filter(function (el) { return labelKey(el) === "stat.special"; })[0];
                var primary = infos[0];
                var secondary = special || infos.filter(function (el) { return el !== primary; })[0];

                var row = document.createElement("span");
                row.className = "ig_row";

                var thumb = document.createElement("span");
                thumb.className = "ig_row_thumb";
                if (image && image.getAttribute("src")) {
                    var img = document.createElement("img");
                    img.src = image.getAttribute("src");
                    img.alt = "";
                    img.loading = "lazy";
                    thumb.appendChild(img);
                }
                row.appendChild(thumb);

                var body = document.createElement("span");
                body.className = "ig_row_body";

                var top = document.createElement("span");
                top.className = "ig_row_top";
                var name = document.createElement("span");
                name.className = "ig_row_name";
                name.textContent = nameEl ? nameEl.textContent.trim() : "";
                top.appendChild(name);
                if (starsEl) {
                    var stars = document.createElement("span");
                    stars.className = "ig_row_stars";
                    stars.textContent = starsEl.textContent.trim();
                    top.appendChild(stars);
                }
                body.appendChild(top);

                /* 2번째 줄: 종류 · 대표 수치. innerHTML 로 복사해 data-i18n 라벨을 살린다. */
                var meta = document.createElement("span");
                meta.className = "ig_row_meta";
                if (typeEl) {
                    var type = document.createElement("span");
                    type.className = "ig_row_type";
                    type.textContent = typeEl.textContent.trim();
                    meta.appendChild(type);
                }
                if (primary) {
                    var stat = document.createElement("span");
                    stat.className = "ig_row_stat";
                    stat.innerHTML = primary.innerHTML;
                    meta.appendChild(stat);
                }
                if (meta.childNodes.length) body.appendChild(meta);

                if (secondary) {
                    var sub = document.createElement("span");
                    sub.className = "ig_row_sub";
                    sub.innerHTML = secondary.innerHTML;
                    body.appendChild(sub);
                }

                row.appendChild(body);

                var chevron = document.createElement("span");
                chevron.className = "ig_row_chev";
                chevron.setAttribute("aria-hidden", "true");
                chevron.textContent = "›";
                row.appendChild(chevron);

                link.appendChild(row);
            });
        });
    }

    /* ----------------------------------------------------------------------
       2. 툴바(검색 + 칩 + 결과 수)를 만든다.
       ---------------------------------------------------------------------- */
    var input, searchWrap, countEl, emptyEl;

    function buildToolbar() {
        var intro = root.querySelector(".destiny_item_filters");
        var chips = root.querySelector(".destiny_item_filter_buttons");

        var bar = document.createElement("div");
        bar.className = "ig_bar";

        searchWrap = document.createElement("div");
        searchWrap.className = "ig_search";
        searchWrap.innerHTML =
            '<svg class="ig_search_icon" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">' +
            '<circle cx="9" cy="9" r="6"></circle><path d="M13.5 13.5 18 18"></path></svg>' +
            '<input type="search" class="ig_input" autocomplete="off" spellcheck="false"' +
            ' data-i18n-placeholder="ig.search.ph" data-i18n-aria-label="ig.search.label"' +
            ' placeholder="' + EN["ig.search.ph"] + '" aria-label="' + EN["ig.search.label"] + '">' +
            '<button type="button" class="ig_clear" data-i18n-aria-label="ig.search.clear"' +
            ' aria-label="' + EN["ig.search.clear"] + '">&times;</button>';
        bar.appendChild(searchWrap);

        /* 칩은 기존 요소를 그대로 옮긴다. destiny_catalog.js 가 붙인 클릭 핸들러가
           요소에 매여 있으므로 이동해도 필터는 계속 동작한다. */
        if (chips) bar.appendChild(chips);

        countEl = document.createElement("p");
        countEl.className = "ig_count";
        bar.appendChild(countEl);

        if (intro && intro.parentNode) intro.parentNode.insertBefore(bar, intro.nextSibling);
        else root.insertBefore(bar, root.firstChild);

        /* 결과 없음 안내 */
        emptyEl = document.createElement("div");
        emptyEl.className = "ig_empty";
        emptyEl.innerHTML =
            '<strong data-i18n="ig.empty.title">' + EN["ig.empty.title"] + "</strong>" +
            '<p data-i18n="ig.empty.desc">' + EN["ig.empty.desc"] + "</p>" +
            '<button type="button" class="ig_more ig_reset" data-i18n="ig.empty.reset">' +
            EN["ig.empty.reset"] + "</button>";
        bar.parentNode.insertBefore(emptyEl, bar.nextSibling);

        input = searchWrap.querySelector(".ig_input");

        var debounce;
        input.addEventListener("input", function () {
            window.clearTimeout(debounce);
            debounce = window.setTimeout(render, 110);
        });
        input.addEventListener("search", render); /* 브라우저 기본 X 버튼 */
        input.addEventListener("keydown", function (event) {
            if (event.key === "Escape" && input.value) {
                event.stopPropagation(); /* 모달 닫기 핸들러와 겹치지 않게 */
                clearSearch();
            }
        });

        searchWrap.querySelector(".ig_clear").addEventListener("click", clearSearch);
        emptyEl.querySelector(".ig_reset").addEventListener("click", function () {
            clearSearch();
            var all = root.querySelector('[data-destiny-filter="all"]');
            if (all && !all.classList.contains("is-active")) all.click();
        });

        /* 카테고리 칩을 누르면 검색어를 비우고 개수를 다시 센다.
           (칩 자체의 블록 숨김은 destiny_catalog.js 가 처리한다.) */
        root.querySelectorAll("[data-destiny-filter]").forEach(function (button) {
            button.addEventListener("click", function () {
                if (input.value) clearSearch(true);
                window.requestAnimationFrame(render);
            });
        });
    }

    function clearSearch(skipRender) {
        input.value = "";
        searchWrap.classList.remove("is-filled");
        if (!skipRender) render();
        input.focus();
    }

    /* ----------------------------------------------------------------------
       3. 검색 색인 — 카드의 표시 텍스트를 그대로 쓴다. 언어가 바뀌면 다시 만든다.
       ---------------------------------------------------------------------- */
    var indexed = false;

    function buildIndex() {
        sections.forEach(function (section) {
            section.cards.forEach(function (card) {
                card.__igText = (card.textContent || "").toLowerCase().replace(/\s+/g, " ");
            });
        });
        indexed = true;
    }

    function matches(card, terms) {
        for (var i = 0; i < terms.length; i += 1) {
            if (card.__igText.indexOf(terms[i]) < 0) return false;
        }
        return true;
    }

    /* ----------------------------------------------------------------------
       4. 렌더 — 검색·필터·접기 상태를 화면에 반영한다.
       ---------------------------------------------------------------------- */
    /** 현재 열 수. CSS 의 --ig-cols 를 그대로 읽어 접기 기준을 맞춘다. */
    function columns() {
        var grid = root.querySelector(".ig_grid");
        if (!grid) return 1;
        var value = parseInt(getComputedStyle(grid).getPropertyValue("--ig-cols"), 10);
        return value > 0 ? value : 1;
    }

    function render() {
        if (!indexed) buildIndex();

        var query = (input.value || "").trim().toLowerCase().replace(/\s+/g, " ");
        var terms = query ? query.split(" ") : [];
        var searching = terms.length > 0;
        searchWrap.classList.toggle("is-filled", searching);

        /* 접기 기준. 여러 열이면 두 줄.
           1열은 곧 모바일 압축 행(약 82px)이라 카드(약 470px)보다 훨씬 싸다.
           4개면 섹션당 330px 정도로, 전체 문서가 원래 캐러셀보다 짧아진다. */
        var cols = columns();
        var limit = cols === 1 ? 4 : cols * 2;

        /* 블록의 hidden 을 집계 기준으로 쓰면 안 된다. 직전 렌더에서 검색 결과가
           0이라 숨긴 블록이 다음 렌더의 집계 범위에서 빠져, 검색을 거듭할수록
           "121개 중" 이 "11개 중" 으로 줄어들었다.
           범위는 항상 활성 카테고리 칩에서 새로 계산한다. */
        var active = root.querySelector("[data-destiny-filter].is-active");
        var filter = active ? active.dataset.destinyFilter : "all";

        var total = 0;
        var shown = 0;

        sections.forEach(function (section) {
            var inScope = filter === "all" || section.block.dataset.category === filter;
            var hits = [];

            section.cards.forEach(function (card) {
                var hit = !searching || matches(card, terms);
                if (hit) hits.push(card);
                card.hidden = !hit;
            });

            if (inScope) {
                total += section.cards.length;
                shown += hits.length;
            }

            /* 접을 만한 분량인가. 남는 게 2장 이하면 "2개 더 보기" 를 누르게 하는 편이
               더 번거롭다. 검색 중에는 결과를 다 보여주는 게 맞으니 접지 않는다. */
            var worthCollapsing = !searching && hits.length > limit + 2;

            /* 펼친 뒤 화면이 넓어져 접을 게 없어졌다면 상태를 되돌린다.
               그러지 않으면 아무 일도 하지 않는 "접기" 버튼이 남는다. */
            if (section.expanded && !worthCollapsing) section.expanded = false;

            var collapsible = worthCollapsing && !section.expanded;
            var cut = collapsible ? limit : hits.length;
            hits.forEach(function (card, i) {
                card.hidden = i >= cut;
            });

            /* 범위 밖이거나, 검색 결과가 0인 섹션은 통째로 숨긴다. */
            section.block.hidden = !inScope || (searching && hits.length === 0);

            /* 개수 배지 */
            if (section.badge) {
                section.badge.textContent = searching
                    ? fill("ig.sec.count.some", { shown: hits.length, n: section.cards.length })
                    : fill("ig.sec.count", { n: section.cards.length });
            }

            /* 더 보기 — 접을 만한 분량일 때만 버튼을 둔다. */
            section.moreWrap.hidden = !worthCollapsing;
            if (worthCollapsing) {
                section.moreBtn.textContent = section.expanded
                    ? t("ig.less")
                    : fill("ig.more", { n: hits.length - cut });
                section.moreBtn.setAttribute("aria-expanded", String(section.expanded));
            }
        });

        countEl.textContent = searching
            ? fill("ig.count.some", { shown: shown, total: total })
            : fill("ig.count.all", { total: total });

        emptyEl.classList.toggle("is-on", searching && shown === 0);
    }

    /* ----------------------------------------------------------------------
       5. 전체 아이템 DB 안내
       ---------------------------------------------------------------------- */
    function buildDbLink() {
        var box = document.createElement("aside");
        box.className = "ig_dblink";
        box.innerHTML =
            '<p data-i18n="ig.db.text">' + EN["ig.db.text"] + "</p>" +
            '<a href="./database/" data-i18n="ig.db.cta">' + EN["ig.db.cta"] + "</a>";
        root.appendChild(box);
    }

    /* ----------------------------------------------------------------------
       6. 시작
       ---------------------------------------------------------------------- */
    toGrid();
    if (!sections.length) return;

    buildCompactRows();
    buildToolbar();
    buildDbLink();
    render();

    /* 새로 만든 DOM 에 번역을 적용한다. 이후 언어 변경은 i18n.js 가 처리하지만
       {n} 이 든 문구는 이 스크립트가 직접 그리므로 다시 render 한다. */
    window.DestinyI18n?.hydrate(root);
    document.addEventListener("destiny-lang-change", function () {
        indexed = false; /* 카드 텍스트가 번역되었으니 색인을 다시 만든다 */
        render();
    });

    /* 열 수가 바뀌면 접기 기준도 달라진다. */
    var resizeTimer;
    var lastCols = columns();
    window.addEventListener("resize", function () {
        window.clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(function () {
            var now = columns();
            if (now !== lastCols) {
                lastCols = now;
                render();
            }
        }, 150);
    });
})();
