/* Aggregate counters only. No identifiers, search text or form values are sent. */
(function () {
    "use strict";
    if (window.DestinyAnalytics) return;
    var API_BASE = "https://destiny-roster.weba44.workers.dev";
    var EVENTS = ["page_view", "engaged_view", "content_view", "content_use", "class_select", "level_select", "measurement"];
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
    window.DestinyAnalytics = {apiBase:API_BASE,path:pagePath,track:track};
    var path = pagePath(), visibleTime = 0, previousTick = performance.now();
    function startPage() { track("measurement","v2"); track("page_view"); }
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
        if (!(node instanceof Element) || !node.closest("main") || node.closest("#site-header,header nav")) return;
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
})();
