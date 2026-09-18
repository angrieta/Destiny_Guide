/* Aggregate counters only. No identifiers, search text or form values are sent. */
(function () {
    "use strict";
    if (window.DestinyAnalytics) return;
    var API_BASE = "https://destiny-roster.weba44.workers.dev";
    var EVENTS = ["page_view", "engaged_view", "content_view", "content_use", "class_select", "level_select", "measurement", "item_open", "item_drop_click", "item_recipe_click", "item_material_open", "item_source_click", "element_click"];
    var pending = new Set(), recorded = new Set(), watched = new Map(), retryAfter = new Map();
    function pagePath() {
        return location.pathname.replace(/^\/Destiny_Guide(?=\/|$)/i, "").replace(/\/index\.html$/i, "/")
            .replace(/\.html$/i, "").replace(/\/$/, "") || "/";
    }
    function track(event, target) {
        if (location.hostname !== "angrieta.github.io" || EVENTS.indexOf(event) < 0) return Promise.resolve(false);
        target = target || "";
        var path = pagePath(), key = "destiny-usage-v2:" + path + ":" + event + ":" + target;
        if (path === "/analytics_page") return Promise.resolve(false);
        if (recorded.has(key) || pending.has(key) || Date.now() < (retryAfter.get(key) || 0)) return Promise.resolve(false);
        try { if (sessionStorage.getItem(key)) return Promise.resolve(false); } catch (_) {}
        pending.add(key); retryAfter.set(key,Date.now() + 30000);
        return fetch(API_BASE + "/api/analytics/view", {
            method:"POST", mode:"cors", credentials:"omit", cache:"no-store", keepalive:true,
            headers:{"Content-Type":"application/json"}, body:JSON.stringify({path:path,event:event,target:target})
        }).then(function (res) {
            if (!res.ok) return false;
            recorded.add(key); retryAfter.delete(key);
            try { sessionStorage.setItem(key,"1"); } catch (_) {}
            return true;
        }).catch(function () { return false; }).finally(function () { pending.delete(key); });
    }
    // 클릭 "횟수"를 세는 경로. track() 은 세션당 1회라 빈도를 볼 수 없어서 따로 둔다.
    // 보내는 값은 data-click-id 에 손으로 적어 둔 고정 id 뿐이고, 워커도 같은 목록으로 거른다.
    var clickBudget = 400, lastClick = new Map();
    function trackClick(id) {
        if (!id || clickBudget <= 0 || location.hostname !== "angrieta.github.io") return;
        var path = pagePath();
        if (path === "/analytics_page") return;
        var now = Date.now();
        // 더블클릭이나 연타로 튄 값은 한 번으로 본다.
        if (now - (lastClick.get(id) || 0) < 400) return;
        lastClick.set(id, now);
        clickBudget -= 1;
        fetch(API_BASE + "/api/analytics/view", {
            method:"POST", mode:"cors", credentials:"omit", cache:"no-store", keepalive:true,
            headers:{"Content-Type":"application/json"}, body:JSON.stringify({path:path,event:"element_click",target:id})
        }).catch(function () {});
    }
    // 이동하는 링크도 있으므로 캡처 단계에서 받고, keepalive 로 페이지가 떠나도 살려 보낸다.
    document.addEventListener("click",function (event) {
        var node = event.target instanceof Element ? event.target : null;
        var hit = node && node.closest("[data-click-id]");
        if (hit) trackClick(hit.dataset.clickId);
    },true);

    window.DestinyAnalytics = {apiBase:API_BASE,path:pagePath,track:track,trackClick:trackClick};
    var path = pagePath(), visibleTime = 0, previousTick = performance.now();
    function startPage() {
        track("measurement","v2"); track("page_view");
        if (pagePath() === '/item_page') track('measurement','items-v1');
    }
    startPage();
    window.addEventListener("online",startPage);
    setInterval(function () { if (!document.hidden) startPage(); },30000);
    // Foreground time only. Route changes reset the timer.
    setInterval(function () {
        var now = performance.now();
        if (pagePath() !== path) { path = pagePath(); visibleTime = 0; startPage(); }
        if (!document.hidden) {
            visibleTime += Math.min(now - previousTick, 1100);
            if (visibleTime >= 15000) track("engaged_view");
        }
        previousTick = now;
    },1000);
    function stopTimer(state) { clearTimeout(state.timer); state.timer = null; }
    function startTimer(node, state) {
        if (state.timer || !state.visible || document.hidden) return;
        state.timer = setTimeout(function () {
            state.timer = null;
            if (node.isConnected && state.visible && !document.hidden) track("content_view",node.dataset.usageId);
        },2000);
    }
    if ("IntersectionObserver" in window) {
        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                var state = watched.get(entry.target);
                if (!state) return;
                state.visible = entry.isIntersecting;
                if (state.visible) startTimer(entry.target,state); else stopTimer(state);
            });
        },{threshold:0});
        function observeSections() {
            watched.forEach(function (state,node) {
                if (!node.isConnected) { stopTimer(state); observer.unobserve(node); watched.delete(node); }
            });
            document.querySelectorAll("[data-usage-id]").forEach(function (node) {
                if (!watched.has(node)) { watched.set(node,{visible:false,timer:null}); observer.observe(node); }
            });
        }
        var attachTimer;
        new MutationObserver(function () { clearTimeout(attachTimer); attachTimer = setTimeout(observeSections,100); })
            .observe(document.body,{childList:true,subtree:true});
        observeSections();
        document.addEventListener("visibilitychange",function () {
            previousTick = performance.now();
            watched.forEach(function (state,node) { if (document.hidden) stopTimer(state); else startTimer(node,state); });
        });
    }
    function use(event) {
        var node = event.target;
        if (!(node instanceof Element) || !node.closest("main,[data-destiny-item-grid],#destinyDetailModal") || node.closest("#site-header,header nav")) return;
        if (!node.closest("a,button,input,select,textarea,summary,[role=button]")) return;
        // Capture before a class/level click replaces its DOM; never read the input value.
        track("content_use","page");
        var section = node.closest("[data-usage-id]");
        if (section) track("content_use",section.dataset.usageId);
    }
    document.addEventListener("click",use,true);
    document.addEventListener("change",use,true);
    var inputTimer;
    document.addEventListener("input",function (event) { clearTimeout(inputTimer); inputTimer = setTimeout(function () { use(event); },600); },true);

    // Only fixed catalog names are sent, never arbitrary link URLs or input text.
    var itemRegistry;
    function trackItem(event, name) {
        if (pagePath() !== '/item_page' || !name) return;
        if (!itemRegistry) itemRegistry = fetch('./data/analytics-items.json',{cache:'no-cache'})
            .then(function (res) { if (!res.ok) throw new Error('registry'); return res.json(); })
            .catch(function () { itemRegistry = null; return []; });
        itemRegistry.then(function (items) {
            var item = items.find(function (item) { return item.names.includes(name); });
            if (item) track(event,item.key);
        });
    }
    document.addEventListener('destiny-item-open',function (event) { trackItem('item_open',event.detail.name); });
    var openItem = document.querySelector('#destinyDetailModal.is-open');
    if (openItem) trackItem('item_open',openItem.dataset.analyticsItemName);
    document.addEventListener('click',function (event) {
        var node = event.target instanceof Element ? event.target : null;
        var modal = node && node.closest('#destinyDetailModal.is-open');
        if (!modal) return;
        var anchor = node.closest('.destiny_detail_sections a');
        if (!anchor) return;
        var url = new URL(anchor.href,location.href), kind;
        if (url.origin === location.origin && /\/drop-tables\/?$/.test(url.pathname)) kind = 'item_drop_click';
        else if (url.origin === location.origin && /\/recipe_page\.html$/.test(url.pathname)) kind = 'item_recipe_click';
        else if (anchor.closest('[data-item-acquisition]')) kind = 'item_source_click';
        if (kind) trackItem(kind,modal.dataset.analyticsItemName);
    },true);
    document.addEventListener('toggle',function (event) {
        var node = event.target;
        if (!(node instanceof Element) || !node.open || !node.matches('.acquisition_materials, .acquisition_materials details')) return;
        var modal = node.closest('#destinyDetailModal.is-open');
        if (modal) trackItem('item_material_open',modal.dataset.analyticsItemName);
    },true);
})();
