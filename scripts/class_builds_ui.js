/* ==========================================================================
   클래스 빌드 페이지 렌더러
   ==========================================================================
   데이터는 scripts/class_builds.js (window.DESTINY_BUILDS) 에 있고, 이 파일은 그리기만 한다.

   번역 규칙
     - 산문은 데이터에 영어 원문과 키(noteKey / summaryKey ...)가 함께 들어 있다.
       요소에 data-i18n 을 달고 영어를 textContent 로 넣으면 i18n.js 가 알아서 바꾼다.
     - 장비 이름 · 요구 % · 태그 · DB 수치는 게임 데이터라 번역하지 않는다.

   상태는 URL 에 담는다: #humar 또는 #humar/1 (클래스/변형). 링크로 공유된다.
   ========================================================================== */
(function () {
    "use strict";

    var DATA = window.DESTINY_BUILDS;
    var root = document.getElementById("cb-root");
    if (!DATA || !root) return;

    var UI = DATA.ui || {};

    /** UI 문구: 사전이 늦게 와도 영어가 먼저 보인다. */
    function t(key) {
        var api = window.DestinyI18n;
        var en = UI[key] || key;
        return (api && typeof api.t === "function" ? api.t(key, en) : en) || en;
    }

    function el(tag, cls, text) {
        var e = document.createElement(tag);
        if (cls) e.className = cls;
        if (text != null) e.textContent = text;
        return e;
    }

    /** 번역 대상 문구를 담은 요소. 영어 원문 + data-i18n 키. */
    function prose(tag, cls, en, key) {
        var e = el(tag, cls, en || "");
        if (key) e.dataset.i18n = key;
        return e;
    }

    /** UI 문구를 담은 요소 (고정 키). */
    function label(tag, cls, key) {
        var e = el(tag, cls, UI[key] || key);
        e.dataset.i18n = key;
        return e;
    }

    var CAT_PARAM = { Weapons: "Weapons", Armor: "Armor", Shields: "Shields", Units: "Units", Mags: "Mags" };

    /** 자바스크립트가 꺼졌을 때만 사용하는 데이터베이스 대체 링크. */
    function dbHref(item) {
        var q = item.dbName || item.name;
        var url = "./database/?q=" + encodeURIComponent(q);
        if (item.cat && CAT_PARAM[item.cat]) url += "&cat=" + encodeURIComponent(CAT_PARAM[item.cat]);
        return url;
    }

    /**
     * 빌드 장비를 현재 페이지의 아이템 상세 팝업과 연결한다.
     * href 는 스크립트 로드 실패 시에만 쓰는 대체 경로로 남긴다.
     */
    function itemTrigger(a, item) {
        a.href = dbHref(item);
        a.dataset.buildItem = "";
        a.dataset.itemName = item.name || "";
        a.dataset.dbName = item.dbName || item.name || "";
        a.dataset.itemCategory = item.cat || "";
        a.dataset.itemStat = [item.tag, item.stat].filter(Boolean).join(" · ");
        a.setAttribute("aria-haspopup", "dialog");
        a.setAttribute("aria-controls", "destinyDetailModal");
        return a;
    }

    /* ----------------------------------------------------------------------
       장비 칩
       ---------------------------------------------------------------------- */
    function chip(item) {
        var a = itemTrigger(el("a", "cb_chip"), item);
        a.dataset.item = (item.name || "").toLowerCase();
        if (item.unresolved) a.classList.add("is-unresolved");

        var top = el("span", "cb_chip_top");
        top.appendChild(el("span", "cb_chip_name", item.name));
        if (item.req) top.appendChild(el("span", "cb_req", item.req));
        a.appendChild(top);

        /* DB 수치 + 태그. 둘 다 게임 데이터라 번역하지 않는다. */
        var statBits = [];
        if (item.tag) statBits.push(item.tag);
        if (item.stat) statBits.push(item.stat);
        if (statBits.length) a.appendChild(el("span", "cb_chip_stat", statBits.join(" · ")));
        else if (item.unresolved) a.appendChild(label("span", "cb_chip_stat", "ui.notInDb"));

        /* 대체 장비 - 이름은 게임 데이터, "or" 만 번역 */
        if (item.alt && item.alt.length) {
            var alt = el("span", "cb_chip_stat");
            var or = el("span", null, t("ui.or"));
            or.dataset.i18n = "ui.or";
            alt.appendChild(or);
            alt.appendChild(document.createTextNode(" " + item.alt.map(function (x) { return x.name; }).join(", ")));
            a.appendChild(alt);
        }

        if (item.note) a.appendChild(prose("span", "cb_chip_note", item.note, item.noteKey));
        if (item.hint) a.appendChild(prose("span", "cb_chip_hint", item.hint, item.hintKey));
        return a;
    }

    function chips(items) {
        var wrap = el("div", "cb_chips");
        items.forEach(function (i) { wrap.appendChild(chip(i)); });
        return wrap;
    }

    function slot(labelKey, items) {
        if (!items || !items.length) return null;
        var sec = el("section", "cb_slot");
        var head = el("div", "cb_slot_head");
        head.appendChild(label("h3", null, labelKey));
        head.appendChild(el("span", "cb_slot_n", String(items.length)));
        sec.appendChild(head);
        sec.appendChild(chips(items));
        return sec;
    }

    /* ----------------------------------------------------------------------
       2층 - 원문 이후 추가된 후보
       ---------------------------------------------------------------------- */
    function newLayer(classId) {
        var rows = (DATA.newLayer || []).filter(function (n) {
            return n.classes.indexOf("all") >= 0 || n.classes.indexOf(classId) >= 0;
        });
        if (!rows.length) return null;

        var box = el("section", "cb_new");
        box.id = "cb-new";
        var head = el("div", "cb_new_head");
        head.appendChild(label("h3", null, "ui.newLayerTitle"));
        head.appendChild(label("span", "cb_layer", "ui.newLayerBadge"));
        box.appendChild(head);
        box.appendChild(label("p", null, "ui.newLayerBody"));

        var list = el("div", "cb_new_list");
        rows.forEach(function (n) {
            var a = itemTrigger(el("a", "cb_new_item"), n);
            a.dataset.item = (n.name || "").toLowerCase();
            var top = el("div", "cb_new_item_top");
            top.appendChild(el("b", null, n.name));
            top.appendChild(el("span", "cb_year", n.year));
            top.appendChild(prose("span", "cb_slotname", n.slot, n.slotKey));
            a.appendChild(top);
            if (n.stat) a.appendChild(el("p", "cb_chip_stat", n.stat));
            if (n.why) a.appendChild(prose("p", null, n.why, n.whyKey));
            if (n.pair) a.appendChild(prose("p", "cb_pair", n.pair, n.pairKey));
            list.appendChild(a);
        });
        box.appendChild(list);
        return box;
    }

    /* ----------------------------------------------------------------------
       빌드 한 개
       ---------------------------------------------------------------------- */
    function buildBody(cls, v) {
        var wrap = el("div", "cb_build");

        var flags = el("div", "cb_flags");
        if (!v.verified) flags.appendChild(label("span", "cb_flag is-warn", "ui.theory"));
        if (flags.childNodes.length) wrap.appendChild(flags);

        if (v.plan) {
            var plan = el("div", "cb_plan");
            plan.appendChild(label("span", "cb_plan_label", "ui.plan"));
            plan.appendChild(el("span", "cb_plan_val", v.plan));
            var asw = label("span", "cb_plan_label", "ui.planAsWritten");
            plan.appendChild(asw);
            if (v.planNote) plan.appendChild(prose("span", "cb_plan_note", v.planNote, v.planNoteKey));
            if (v.mats) {
                var m = el("span", "cb_plan_mats");
                var ml = label("span", null, "ui.mats");
                m.appendChild(ml);
                m.appendChild(document.createTextNode(" - " + v.mats));
                plan.appendChild(m);
            }
            wrap.appendChild(plan);
        }

        if (v.summary) wrap.appendChild(prose("p", "cb_summary", v.summary, v.summaryKey));
        if (v.warn) wrap.appendChild(prose("p", "cb_credit", v.warn, v.warnKey));

        var w = slot("ui.slotWeapons", v.weapons);
        if (w) wrap.appendChild(w);

        /* 방어구 · 실드 · 유닛은 항목이 적으니 나란히 놓는다 */
        var row = el("div", "cb_row3");
        [["ui.slotArmor", v.armor], ["ui.slotShield", v.shield], ["ui.slotUnits", v.units]]
            .forEach(function (pair) {
                var s = slot(pair[0], pair[1]);
                if (s) { s.classList.remove("cb_slot"); s.className = "cb_slot"; row.appendChild(s); }
            });
        if (row.childNodes.length) wrap.appendChild(row);

        if (v.optional && v.optional.length) {
            var d = el("details", "cb_optional");
            var sum = el("summary");
            sum.appendChild(label("span", null, "ui.slotOptional"));
            sum.appendChild(el("span", "cb_slot_n", String(v.optional.length)));
            d.appendChild(sum);
            d.appendChild(chips(v.optional));
            wrap.appendChild(d);
        }

        var nl = newLayer(cls.id);
        if (nl) wrap.appendChild(nl);

        /* Over Resilience 는 해당 클래스에서만 */
        var or = DATA.overResilience;
        if (or && or.forClasses.indexOf(cls.id) >= 0) {
            var box = el("section", "cb_or");
            box.appendChild(prose("h3", null, or.title, or.titleKey));
            box.appendChild(prose("p", null, or.body, or.bodyKey));
            box.appendChild(prose("div", "cb_or_result", or.result, or.resultKey));
            box.appendChild(chips(or.items));
            box.appendChild(prose("p", "cb_credit", or.warn, or.warnKey));
            box.appendChild(prose("p", "cb_credit", or.credit, or.creditKey));
            wrap.appendChild(box);
        }
        return wrap;
    }

    /* ----------------------------------------------------------------------
       상태
       ---------------------------------------------------------------------- */
    var state = { cls: DATA.classes[0].id, vi: 0, q: "" };
    var nodes = {};

    function classById(id) {
        for (var i = 0; i < DATA.classes.length; i += 1) {
            if (DATA.classes[i].id === id) return DATA.classes[i];
        }
        return DATA.classes[0];
    }

    function readHash() {
        var h = (location.hash || "").replace(/^#/, "").split("/");
        if (!h[0]) return;
        var c = classById(h[0]);
        state.cls = c.id;
        var n = parseInt(h[1], 10);
        state.vi = n > 0 && n <= c.variants.length ? n - 1 : 0;
    }

    function writeHash() {
        var h = "#" + state.cls + (state.vi ? "/" + (state.vi + 1) : "");
        if (location.hash !== h) history.replaceState(null, "", h);
    }

    /* ----------------------------------------------------------------------
       검색 - 어떤 빌드가 이 아이템을 쓰는지
       ---------------------------------------------------------------------- */
    /** classId -> 그 클래스에서 검색어와 일치하는 변형 개수 */
    function countHits(q) {
        var map = {};
        if (!q) return map;
        DATA.classes.forEach(function (c) {
            var n = 0;
            c.variants.forEach(function (v) {
                var found = ["weapons", "armor", "shield", "units", "optional"].some(function (s) {
                    return (v[s] || []).some(function (i) {
                        if (i.name.toLowerCase().indexOf(q) >= 0) return true;
                        return (i.alt || []).some(function (a) { return a.name.toLowerCase().indexOf(q) >= 0; });
                    });
                });
                if (found) n += 1;
            });
            if (n) map[c.id] = n;
        });
        return map;
    }

    function renderHits() {
        var q = state.q;
        var box = nodes.hits;
        box.innerHTML = "";
        if (!q) { box.hidden = true; return; }
        box.hidden = false;

        var map = countHits(q);
        var ids = Object.keys(map);
        if (!ids.length) {
            box.appendChild(label("p", "cb_hits_head", "ui.noHits"));
            return;
        }
        box.appendChild(label("p", "cb_hits_head", "ui.hits"));
        var list = el("div", "cb_hits_list");
        ids.forEach(function (id) {
            var c = classById(id);
            var b = el("button", "cb_hit");
            b.type = "button";
            b.appendChild(document.createTextNode(c.name));
            b.appendChild(el("span", null, String(map[id])));
            b.addEventListener("click", function () {
                state.cls = id;
                state.vi = 0;
                render();
                nodes.classes.scrollIntoView({ block: "start", behavior: "smooth" });
            });
            list.appendChild(b);
        });
        box.appendChild(list);
    }

    /* ----------------------------------------------------------------------
       렌더
       ---------------------------------------------------------------------- */
    function render() {
        var cls = classById(state.cls);
        if (state.vi >= cls.variants.length) state.vi = 0;
        var v = cls.variants[state.vi];
        var hits = countHits(state.q);

        /* 클래스 버튼 상태 */
        Object.keys(nodes.clsBtn).forEach(function (id) {
            var b = nodes.clsBtn[id];
            b.classList.toggle("is-active", id === state.cls);
            b.classList.toggle("is-dim", !!state.q && !hits[id]);
            b.setAttribute("aria-pressed", String(id === state.cls));
        });

        /* 클래스 본문 */
        var host = nodes.class;
        host.innerHTML = "";

        var head = el("div", "cb_class_head");
        var img = el("img");
        img.src = "./images/classes/" + cls.id + ".png";
        img.alt = "";
        img.loading = "lazy";
        head.appendChild(img);
        head.appendChild(el("h2", null, cls.name));
        host.appendChild(head);
        host.appendChild(prose("p", null, cls.blurb, cls.blurbKey));

        if (cls.variants.length > 1) {
            var tabs = el("div", "cb_variants");
            cls.variants.forEach(function (vv, i) {
                var b = el("button", "cb_var" + (i === state.vi ? " is-active" : ""));
                b.type = "button";
                b.textContent = vv.name;
                if (vv.nameKey) b.dataset.i18n = vv.nameKey;
                b.setAttribute("aria-pressed", String(i === state.vi));
                b.addEventListener("click", function () { state.vi = i; render(); });
                tabs.appendChild(b);
            });
            host.appendChild(tabs);
        }

        host.appendChild(buildBody(cls, v));

        /* 검색 일치 칩 강조 */
        if (state.q) {
            host.querySelectorAll("[data-item]").forEach(function (e) {
                if (e.dataset.item.indexOf(state.q) >= 0) e.classList.add("is-hit");
            });
        }

        renderHits();
        writeHash();
        window.DestinyI18n && window.DestinyI18n.hydrate(host);
        window.DestinyI18n && window.DestinyI18n.hydrate(nodes.hits);
    }

    /* ----------------------------------------------------------------------
       정적 골격
       ---------------------------------------------------------------------- */
    function build() {
        /* 머리말 */
        var head = el("header", "cb_head");
        head.appendChild(label("h1", null, "ui.title"));
        head.appendChild(label("p", null, "ui.lead"));
        root.appendChild(head);

        /* 툴바 */
        var bar = el("div", "cb_bar");
        var search = el("div", "cb_search");
        search.innerHTML =
            '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">' +
            '<circle cx="9" cy="9" r="6"></circle><path d="M13.5 13.5 18 18"></path></svg>' +
            '<input type="search" autocomplete="off" spellcheck="false"' +
            ' data-i18n-placeholder="ui.search" data-i18n-aria-label="ui.search"' +
            ' placeholder="' + (UI["ui.search"] || "") + '" aria-label="' + (UI["ui.search"] || "") + '">' +
            '<button type="button" class="cb_clear" data-i18n-aria-label="ui.searchClear"' +
            ' aria-label="' + (UI["ui.searchClear"] || "") + '">&times;</button>';
        bar.appendChild(search);

        var legendBtn = el("button", "cb_legend_btn");
        legendBtn.type = "button";
        legendBtn.setAttribute("aria-expanded", "false");
        legendBtn.appendChild(label("span", null, "ui.legendBtn"));
        bar.appendChild(legendBtn);
        root.appendChild(bar);

        /* 범례 */
        var legend = el("section", "cb_legend");
        legend.hidden = true;
        legend.appendChild(label("h3", null, "ui.legendTitle"));
        var grid = el("div", "cb_legend_grid");
        [["N", "Native"], ["A.B", "A.Beast"], ["M", "Machine"], ["D", "Dark"], ["H", "Hit"],
         ["SET", "All three attributes maxed"], ["Hit 40+", "Hit 40% or above"]]
            .forEach(function (p) {
                var d = el("div");
                d.appendChild(el("b", null, p[0]));
                d.appendChild(document.createTextNode(p[1]));
                grid.appendChild(d);
            });
        legend.appendChild(grid);
        var areaP = el("p");
        areaP.appendChild(label("span", null, "ui.legendArea"));
        areaP.appendChild(document.createTextNode(" "));
        var areaA = el("a", null, UI["ui.legendAreaLink"] || "");
        areaA.dataset.i18n = "ui.legendAreaLink";
        areaA.href = "./system_page.html#area";
        areaP.appendChild(areaA);
        legend.appendChild(areaP);
        root.appendChild(legend);

        /* 검색 결과 */
        nodes.hits = el("section", "cb_hits");
        nodes.hits.hidden = true;
        root.appendChild(nodes.hits);

        /* 클래스 선택 */
        nodes.classes = el("nav", "cb_classes");
        nodes.clsBtn = {};
        ["HU", "RA", "FO"].forEach(function (fam) {
            var rowWrap = el("div", "cb_family");
            rowWrap.appendChild(el("span", "cb_family_label", fam));
            var row = el("div", "cb_family_row");
            DATA.classes.filter(function (c) { return c.family === fam; }).forEach(function (c) {
                /* 배너 원본이 246x34 라 버튼 크기로 줄이면 글자가 안 보인다.
                   버튼에는 이름만 쓰고 배너는 클래스 머리말에서만 쓴다. */
                var b = el("button", "cb_cls");
                b.type = "button";
                b.appendChild(el("b", null, c.name));
                if (c.variants.length > 1) b.appendChild(el("span", "cb_cls_n", String(c.variants.length)));
                b.addEventListener("click", function () {
                    state.cls = c.id;
                    state.vi = 0;
                    render();
                });
                nodes.clsBtn[c.id] = b;
                row.appendChild(b);
            });
            rowWrap.appendChild(row);
            nodes.classes.appendChild(rowWrap);
        });
        root.appendChild(nodes.classes);

        nodes.class = el("section", "cb_class");
        root.appendChild(nodes.class);

        /* 공통 참고 */
        var extra = el("section", "cb_extra");
        extra.appendChild(label("h2", null, "ui.extraTitle"));
        var notes = el("div", "cb_notes");
        (DATA.general || []).forEach(function (g) {
            var n = el("article", "cb_note");
            n.appendChild(prose("h3", null, g.title, g.titleKey));
            n.appendChild(prose("p", null, g.body, g.bodyKey));
            n.appendChild(chips(g.items));
            notes.appendChild(n);
        });
        extra.appendChild(notes);
        root.appendChild(extra);

        /* 출처 */
        var src = el("aside", "cb_source");
        src.appendChild(label("p", null, "ui.sourceLine"));
        var a = el("a", null, UI["ui.openSource"] || "");
        a.dataset.i18n = "ui.openSource";
        a.href = DATA.source.url;
        a.target = "_blank";
        a.rel = "noopener noreferrer";
        src.appendChild(a);
        root.appendChild(src);

        /* --- 배선 --- */
        var input = search.querySelector("input");
        var timer;
        input.addEventListener("input", function () {
            window.clearTimeout(timer);
            timer = window.setTimeout(function () {
                state.q = input.value.trim().toLowerCase();
                search.classList.toggle("is-filled", !!state.q);
                render();
            }, 110);
        });
        input.addEventListener("search", function () {
            state.q = input.value.trim().toLowerCase();
            search.classList.toggle("is-filled", !!state.q);
            render();
        });
        search.querySelector(".cb_clear").addEventListener("click", function () {
            input.value = "";
            state.q = "";
            search.classList.remove("is-filled");
            render();
            input.focus();
        });

        var legendCloseTimer;
        legendBtn.addEventListener("click", function (event) {
            if (legend.hidden) {
                window.clearTimeout(legendCloseTimer);
                legend.dataset.state = "open";
                legend.hidden = false;
                legendBtn.setAttribute("aria-expanded", "true");
                return;
            }

            legendBtn.setAttribute("aria-expanded", "false");
            if (event.detail === 0 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
                legend.hidden = true;
                delete legend.dataset.state;
                return;
            }

            legend.dataset.state = "closing";
            legendCloseTimer = window.setTimeout(function () {
                legend.hidden = true;
                delete legend.dataset.state;
            }, 150);
        });
        window.addEventListener("hashchange", function () { readHash(); render(); });
    }

    readHash();
    build();
    render();
    window.DestinyI18n && window.DestinyI18n.hydrate(root);
    document.addEventListener("destiny-lang-change", function () {
        /* {n} 자리표시자는 쓰지 않으므로 i18n.js 가 전부 처리한다. 다만 동적으로 그린
           검색 결과 버튼의 클래스 이름은 게임 데이터라 그대로 둔다. */
    });
})();
