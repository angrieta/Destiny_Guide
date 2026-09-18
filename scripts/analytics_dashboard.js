(function () {
    "use strict";
    var API_BASE = "https://destiny-roster.weba44.workers.dev";
    var stateNode = document.getElementById("usage-state"), resultsNode = document.getElementById("usage-results");
    var days = 30, mode = "pages", payload = null, catalog = null, requestId = 0, status = "analytics.loading";
    var visibleRows = [];
    var itemCatalog = [], visibleItems = [];
    var visibleElements = [];
    var itemEvents = ['item_open','item_drop_click','item_recipe_click','item_material_open','item_source_click'];
    function t(key, fallback) {
        fallback = (window.DESTINY_REVISION_COPY || {})[key] || fallback || key;
        return window.DestinyI18n ? window.DestinyI18n.t(key,fallback) : fallback;
    }
    function textNode(tag, text, cls) { var node = document.createElement(tag); node.textContent = text; if (cls) node.className = cls; return node; }
    function number(n) { return n === null || n === undefined ? "—" : Number(n).toLocaleString(); }
    function label(page) { return page.titleKey ? t(page.titleKey,page.title || page.path) : page.title || page.path; }
    function href(path) {
        var page = catalog.pages.find(function (p) { return p.path === path; });
        return page ? "./" + page.href : "#";
    }
    function rowFor(path,event,target) {
        return payload.rows.find(function (r) { return r.path === path && r.event === event && r.target === (target || ""); }) || {count:0,previousCount:0,activeDays:0,lastSeen:null};
    }
    function buildRows() {
        var list = mode === "pages" ? catalog.pages.slice() : catalog.sections.slice();
        // Include real, formerly tracked paths so retired content does not vanish from the report.
        if (mode === "pages") payload.rows.forEach(function (r) {
            if (r.event === "page_view" && !list.some(function (p) { return p.path === r.path; })) list.push({path:r.path,title:r.path});
        });
        return list.map(function (entry) {
            var section = mode === "sections";
            var views = rowFor(entry.path, section ? "content_view" : "page_view", section ? entry.id : "");
            var featureAvailable = !!payload.signalsStart;
            var coverage = section ? payload.signalsStart : payload.coverageStart;
            var comparable = coverage && coverage <= payload.previousSince;
            var count = section && !featureAvailable ? null : Number(views.count || 0);
            var change = comparable ? Number(views.count || 0) - Number(views.previousCount || 0) : null;
            return {path:entry.path,id:entry.id || "",name:label(entry),href:entry.href ? "./" + entry.href : href(entry.path),
                views:count,engaged:section || !featureAvailable ? null : Number(rowFor(entry.path,"engaged_view").count || 0),
                uses:featureAvailable ? Number(rowFor(entry.path,"content_use",section ? entry.id : "page").count || 0) : null,
                activeDays:count === null ? null : views.activeDays,last:views.lastSeen || "—",change:change};
        });
    }
    function comparison(value) { return value === null ? "—" : (value > 0 ? "+" : "") + number(value); }
    function renderTable() {
        if (!payload || !catalog) return;
        var search = document.getElementById("usage-search").value.trim().toLowerCase();
        var low = document.getElementById("usage-low").checked, sort = document.getElementById("usage-sort").value;
        visibleRows = buildRows().filter(function (row) {
            return (!low || (row.views !== null && row.views <= 5)) && (!search || (row.name + " " + row.path + " " + row.id).toLowerCase().includes(search));
        }).sort(function (a,b) {
            var diff = sort === "asc" ? (a.views || 0) - (b.views || 0) :
                sort === "uses" ? (b.uses || 0) - (a.uses || 0) : (b.views || 0) - (a.views || 0);
            return diff || a.name.localeCompare(b.name);
        });
        var body = document.getElementById("usage-table-body"); body.replaceChildren();
        visibleRows.forEach(function (row) {
            var tr = document.createElement("tr"); if (row.views === 0) tr.className = "is-zero";
            var title = document.createElement("td");
            var name = textNode(row.href === "#" ? "span" : "a",row.name);
            if (name.tagName === "A") name.href = row.href;
            title.append(name,textNode("small",row.path + (row.id ? " · " + row.id : ""))); tr.appendChild(title);
            [number(row.views),number(row.engaged),number(row.uses),number(row.activeDays),row.last,comparison(row.change)].forEach(function (value) { tr.appendChild(textNode("td",value)); });
            body.appendChild(tr);
        });
        if (!visibleRows.length) {
            var tr = document.createElement("tr"), cell = textNode("td",t("usage.noResults")); cell.colSpan = 7; tr.appendChild(cell); body.appendChild(tr);
        }
        document.getElementById("usage-row-count").textContent = t("usage.rows") + ": " + visibleRows.length;
    }
    function ranked(id, rows) {
        var list = document.getElementById(id); list.replaceChildren();
        var classNames = {humar:"HUmar",hunewearl:"HUnewearl",hucast:"HUcast",hucaseal:"HUcaseal",ramar:"RAmar",ramarl:"RAmarl",racast:"RAcast",racaseal:"RAcaseal",fomar:"FOmar",fomarl:"FOmarl",fonewm:"FOnewm",fonewearl:"FOnewearl"};
        rows.slice().sort(function (a,b) { return b.count-a.count; }).slice(0,12).forEach(function (row,index) {
            var parts = row.target.split(":"), li = document.createElement("li");
            li.append(textNode("span",String(index+1),"usage_rank"),textNode("span",(classNames[parts[0]] || parts[0]) + (parts[1] ? " · LV "+parts[1] : ""),"usage_name"),textNode("strong",number(row.count),"usage_count"));
            list.appendChild(li);
        });
        if (!rows.length) list.appendChild(textNode("li",t("analytics.empty","No data yet.")));
    }
    function render() {
        if (!payload) { showStatus(status); return; }
        stateNode.hidden = true; resultsNode.hidden = false;
        document.getElementById("usage-total").textContent = number(payload.totalViews);
        document.getElementById("usage-viewed").textContent = number(catalog.pages.filter(function (p) { return rowFor(p.path,"page_view").count > 0; }).length);
        document.getElementById("usage-zero").textContent = number(catalog.pages.filter(function (p) { return !rowFor(p.path,"page_view").count; }).length);
        document.getElementById("usage-coverage").textContent = payload.coverageStart || "—";
        document.getElementById("usage-range").textContent = t("usage.range") + ": " + payload.since + " → " + payload.until;
        document.getElementById("usage-signals").textContent = payload.coverageStart
            ? t("usage.signalsStart") + ": " + (payload.signalsStart || "—") : t("usage.noData");
        ranked("usage-classes",payload.classes || []); ranked("usage-levels",payload.levels || []);
        renderTable();
        renderItems();
        renderElements();
    }
    function renderElements() {
        var list = (catalog.elements || []);
        var startNode = document.getElementById("usage-elements-start");
        if (startNode) startNode.textContent = list.length ? "" : t("usage.elements.none","No buttons or cards are tagged for measurement yet.");
        var search = document.getElementById("usage-element-search").value.trim().toLowerCase();
        var sort = document.getElementById("usage-element-sort").value;
        visibleElements = list.filter(function (entry) {
            return !search || (entry.title + " " + entry.key + " " + entry.path).toLowerCase().includes(search);
        }).map(function (entry) {
            var row = rowFor(entry.path,"element_click",entry.key);
            var comparable = payload.coverageStart && payload.coverageStart <= payload.previousSince;
            return {key:entry.key,path:entry.path,title:entry.title,clicks:Number(row.count || 0),
                activeDays:row.activeDays || 0,last:row.lastSeen || "—",
                change:comparable ? Number(row.count || 0) - Number(row.previousCount || 0) : null};
        }).sort(function (a,b) {
            if (sort === "path") return a.path.localeCompare(b.path) || b.clicks - a.clicks || a.title.localeCompare(b.title);
            if (sort === "asc") return a.clicks - b.clicks || a.title.localeCompare(b.title);
            return b.clicks - a.clicks || a.title.localeCompare(b.title);
        });
        var countNode = document.getElementById("usage-element-count");
        if (countNode) countNode.textContent = t("usage.rows") + ": " + number(visibleElements.length);
        var body = document.getElementById("usage-elements-body"); body.replaceChildren();
        visibleElements.forEach(function (row) {
            var tr = document.createElement("tr"); if (!row.clicks) tr.className = "is-zero";
            var cell = document.createElement("td");
            var name = textNode(row.path && href(row.path) !== "#" ? "a" : "span",row.title);
            if (name.tagName === "A") name.href = href(row.path);
            cell.appendChild(name); cell.appendChild(textNode("small"," " + row.key,"usage_path")); tr.appendChild(cell);
            tr.appendChild(textNode("td",row.path));
            tr.appendChild(textNode("td",number(row.clicks)));
            tr.appendChild(textNode("td",number(row.activeDays)));
            tr.appendChild(textNode("td",row.last));
            tr.appendChild(textNode("td",comparison(row.change)));
            body.appendChild(tr);
        });
        if (!visibleElements.length) {
            var tr = document.createElement("tr"), td = textNode("td",t("usage.noResults")); td.colSpan = 6;
            tr.appendChild(td); body.appendChild(tr);
        }
    }
    function renderItems() {
        if (!payload) return;
        document.getElementById('usage-items-start').textContent = payload.itemsStart
            ? t('usage.items.start') + ': ' + payload.itemsStart + ' (UTC)'
            : t('usage.items.noData');
        var search = document.getElementById('usage-item-search').value.trim().toLowerCase();
        var sort = document.getElementById('usage-item-sort').value;
        visibleItems = itemCatalog.filter(function (item) {
            return !search || [item.name].concat(item.names).join(' ').toLowerCase().includes(search);
        }).map(function (item) {
            var row = {key:item.key,name:item.name,linkName:item.names[0]};
            itemEvents.forEach(function (event) { row[event] = payload.itemsStart ? Number(rowFor('/item_page',event,item.key).count || 0) : null; });
            return row;
        }).sort(function (a,b) { return (b[sort] || 0)-(a[sort] || 0) || a.name.localeCompare(b.name); });
        var body = document.getElementById('usage-items-body');body.replaceChildren();
        visibleItems.forEach(function (row) {
            var tr=document.createElement('tr'), cell=document.createElement('td'), anchor=textNode('a',row.name);
            anchor.href='./item_page.html?name='+encodeURIComponent(row.linkName);cell.appendChild(anchor);tr.appendChild(cell);
            itemEvents.forEach(function (event) { tr.appendChild(textNode('td',number(row[event]))); });body.appendChild(tr);
        });
        if (!visibleItems.length) {var tr=document.createElement('tr'), td=textNode('td',t('usage.noResults'));td.colSpan=6;tr.appendChild(td);body.appendChild(tr);}
    }
    function showStatus(key) {
        status = key; resultsNode.hidden = true; stateNode.hidden = false;
        stateNode.replaceChildren(textNode("p",t(key,key === "analytics.loading" ? "Loading usage totals..." : "Usage totals are unavailable. The guide still works normally.")));
    }
    async function load() {
        var id = ++requestId; payload = null; showStatus("analytics.loading");
        try {
            var responses = await Promise.all([
                fetch(API_BASE + "/api/analytics/summary?days=" + days,{cache:"no-store",mode:"cors",credentials:"omit"}),
                catalog ? Promise.resolve(null) : fetch("./data/content-catalog.json",{cache:"no-cache"}),
                itemCatalog.length ? Promise.resolve(null) : fetch('./data/analytics-items.json',{cache:'no-cache'})
            ]);
            if (id !== requestId) return;
            if (responses[0].status === 404) { showStatus("usage.notEnabled"); return; }
            if (!responses[0].ok) throw new Error("api");
            var next = await responses[0].json();
            var nextCatalog = responses[1] ? await responses[1].json() : catalog;
            var nextItems = responses[2] ? await responses[2].json() : itemCatalog;
            if (id !== requestId) return;
            if (next.version !== 2 || !Array.isArray(next.rows)) { showStatus("usage.upgrade"); return; }
            if (!nextCatalog || !Array.isArray(nextCatalog.pages) || !Array.isArray(nextCatalog.sections)) throw new Error("catalog");
            if (!Array.isArray(nextItems)) throw new Error('item catalog');
            itemCatalog = nextItems; catalog = nextCatalog; payload = next; render();
        } catch (_) { if (id === requestId) showStatus("usage.connection"); }
    }
    document.querySelectorAll("[data-days]").forEach(function (button) {
        button.addEventListener("click",function () {
            days = Number(button.dataset.days);
            document.querySelectorAll("[data-days]").forEach(function (other) { other.classList.toggle("is-active",other === button); other.setAttribute("aria-pressed",String(other === button)); });
            load();
        });
    });
    document.querySelectorAll("[data-mode]").forEach(function (button) {
        button.addEventListener("click",function () {
            mode = button.dataset.mode;
            document.querySelectorAll("[data-mode]").forEach(function (other) { other.classList.toggle("is-active",other === button); other.setAttribute("aria-pressed",String(other === button)); });
            renderTable();
        });
    });
    ["usage-search","usage-sort","usage-low"].forEach(function (id) {
        document.getElementById(id).addEventListener(id === "usage-search" ? "input" : "change",renderTable);
    });
    document.getElementById("usage-export").addEventListener("click",function () {
        if (!payload) return;
        function csv(value) { return '"' + String(value == null ? "" : value).replace(/"/g,'""') + '"'; }
        var rows = [["content","path","section","views","foreground15s","interactions","activeDays","lastViewUTC","change","since","until"]];
        visibleRows.forEach(function (r) { rows.push([r.name,r.path,r.id,r.views,r.engaged,r.uses,r.activeDays,r.last,r.change,payload.since,payload.until]); });
        var url = URL.createObjectURL(new Blob(["\uFEFF" + rows.map(function (row) { return row.map(csv).join(","); }).join("\r\n")],{type:"text/csv;charset=utf-8"}));
        var a = document.createElement("a"); a.href=url; a.download="destiny-usage-"+mode+"-"+payload.until+".csv"; a.click();
        setTimeout(function () { URL.revokeObjectURL(url); },1000);
    });
    document.addEventListener("destiny-lang-change",render);
    ['usage-item-search','usage-item-sort'].forEach(function (id) {
        document.getElementById(id).addEventListener(id==='usage-item-search'?'input':'change',renderItems);
    });
    document.getElementById('usage-item-export').addEventListener('click',function () {
        if (!payload) return;
        function csv(value) { return '"'+String(value==null?'':value).replace(/"/g,'""')+'"'; }
        var rows = [['item','key'].concat(itemEvents,['since','until','collectionStartUTC'])];
        visibleItems.forEach(function (row) {rows.push([row.name,row.key].concat(itemEvents.map(function (event) {return row[event];}),[payload.since,payload.until,payload.itemsStart]));});
        var url=URL.createObjectURL(new Blob(['\uFEFF'+rows.map(function (row) {return row.map(csv).join(',');}).join('\r\n')],{type:'text/csv;charset=utf-8'}));
        var anchor=document.createElement('a');anchor.href=url;anchor.download='destiny-item-usage-'+payload.until+'.csv';anchor.click();
        setTimeout(function () {URL.revokeObjectURL(url);},1000);
    });
    ["usage-element-search","usage-element-sort"].forEach(function (id) {
        document.getElementById(id).addEventListener(id === "usage-element-search" ? "input" : "change",renderElements);
    });
    document.getElementById("usage-element-export").addEventListener("click",function () {
        if (!payload) return;
        function csv(value) { return '"' + String(value == null ? "" : value).replace(/"/g,'""') + '"'; }
        var rows = [["element","key","path","clicks","activeDays","lastClickUTC","change","since","until"]];
        visibleElements.forEach(function (r) { rows.push([r.title,r.key,r.path,r.clicks,r.activeDays,r.last,r.change,payload.since,payload.until]); });
        var url = URL.createObjectURL(new Blob(["\uFEFF" + rows.map(function (row) { return row.map(csv).join(","); }).join("\r\n")],{type:"text/csv;charset=utf-8"}));
        var anchor = document.createElement("a"); anchor.href = url; anchor.download = "destiny-click-usage-" + payload.until + ".csv"; anchor.click();
        setTimeout(function () { URL.revokeObjectURL(url); },1000);
    });
    load();
})();
