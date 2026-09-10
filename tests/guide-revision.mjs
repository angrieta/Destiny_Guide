import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";
import ts from "typescript";
import { DatabaseSync } from "node:sqlite";
import { chromium } from "playwright";
import path from "node:path";

const base = process.env.QA_BASE || "http://localhost:3003";
const screenshotDir = "C:/Users/USER/.codex/visualizations/2026/09/07/01a079ea-71d7-7451-ac95-6b6c08addd94";
const copy = JSON.parse(fs.readFileSync("i18n/revision.json","utf8"));
const langs = ["en","ko","ja","es","fr"];
for (const [key,values] of Object.entries(copy)) assert(values.length === 5 && values.every(v=>typeof v==="string" && v.trim()),key);
for (const lang of langs.slice(1)) {
    const dictionary = JSON.parse(fs.readFileSync(".sites-static/i18n/"+lang+".json","utf8"));
    for (const key of Object.keys(copy)) assert.equal(dictionary[key],copy[key][langs.indexOf(lang)],key+"/"+lang);
}
const ctx = {window:{}}; vm.createContext(ctx);
for (const name of ["class_builds_progression.js","guide_revision_copy.js","class_builds_beginner.js"]) vm.runInContext(fs.readFileSync(".sites-static/scripts/"+name,"utf8"),ctx);
const leveling = ctx.window.DESTINY_LEVELING;
const norm = s=>s.toLowerCase().replace(/[^a-z0-9]/g,"");
const directRoutes = [...new Set(Object.values(leveling.families).flat().flatMap(stage=>stage.farm))].filter(id=>{
    const route=leveling.routes[id];
    return ["Hard","Very Hard","Ultimate"].includes(route.difficulty) && route.source !== "craft" && route.exactItem !== false;
});
for (const id of directRoutes) {
    const route=leveling.routes[id];
    const file=["Normal","Hard","Very Hard","Ultimate"].indexOf(route.difficulty);
    const drops=JSON.parse(fs.readFileSync("data/drop-tables-"+file+".json","utf8"));
    const ep=drops.episodes.find(e=>String(e.episode).replace(/[^0-9]/g,"")===route.episode.replace(/[^0-9]/g,""));
    assert(ep,"episode "+id);
    const enemy=ep.rows.find(row=>norm(row[0])===norm(route.enemy)); assert(enemy,"enemy "+id);
    for (const section of route.section.split(" / ")) {
        const drop=enemy[2].find(d=>d[0]===section && norm(d[1])===norm(route.dbName));
        assert(drop,id+" "+section); assert.equal(drop[2],route.rate,id+" rate");
    }
}
for (const stages of Object.values(leveling.families)) for (const stage of stages) {
    assert.equal(stage.equip.length<=5,true);
    for (const id of [...stage.equip,...stage.farm]) assert(leveling.routes[id],id);
    assert(copy[stage.summaryKey] && copy[stage.units]);
}
console.log("PASS: five-language dictionary, milestones and all " + directRoutes.length + " direct farming routes");

// Run the actual Worker against in-memory SQLite; no remote writes.
const db = new DatabaseSync(":memory:");
db.exec(fs.readFileSync("api/migrations/0002-analytics.sql","utf8"));
const env={ALLOWED_ORIGINS:"https://angrieta.github.io",DB:{prepare(sql){
    const stmt=db.prepare(sql); let args=[];
    return {bind(...values){args=values;return this;},async run(){return stmt.run(...args);},async all(){return {results:stmt.all(...args)};},async first(){return stmt.get(...args)||null;}};
}}};
const workerCode=ts.transpileModule(fs.readFileSync("api/src/index.ts","utf8"),{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const worker=(await import("data:text/javascript;base64,"+Buffer.from(workerCode).toString("base64"))).default;
const post=body=>worker.fetch(new Request("https://unit.test/api/analytics/view",{method:"POST",headers:{"Content-Type":"application/json",Origin:"https://angrieta.github.io"},body:JSON.stringify(body)}),env);
for (const body of [
    {event:"page_view",path:"/Destiny_Guide/class_builds.html"},
    {event:"engaged_view",path:"/class_builds"},
    {event:"content_view",path:"/class_builds",target:"class-roadmap"},
    {event:"content_use",path:"/class_builds",target:"class-roadmap"},
    {event:"content_use",path:"/class_builds",target:"page"},
    {event:"class_select",path:"/class_builds",target:"humar"},
    {event:"level_select",path:"/class_builds",target:"humar:150"},
    {event:"measurement",path:"/class_builds",target:"v2"}
]) assert.equal((await post(body)).status,200,JSON.stringify(body));
for (const body of [
    {event:"content_use",path:"/class_builds",target:"private search text"},
    {event:"level_select",path:"/class_builds",target:"humar:999"},
    {event:"class_select",path:"/other",target:"humar"},
    {event:"page_view",path:"/bad?secret=yes"},
    {event:"page_view",path:"/"+ "a".repeat(110)}
]) assert.equal((await post(body)).status,400);
assert.equal((await worker.fetch(new Request("https://unit.test/api/analytics/view",{method:"POST",headers:{"Content-Type":"application/json",Origin:"https://bad.test"},body:JSON.stringify({event:"page_view",path:"/"})}),env)).status,403);
function day(offset) { const date=new Date(); date.setUTCDate(date.getUTCDate()+offset); return date.toISOString().slice(0,10); }
db.prepare("INSERT INTO analytics_daily VALUES (?, 'page_view', '/class_builds', '', 4)").run(day(-40));
db.prepare("INSERT INTO analytics_daily VALUES (?, 'page_view', '/class_builds', '', 2)").run(day(-1));
for(let i=0;i<65;i++) db.prepare("INSERT INTO analytics_daily VALUES (?, 'page_view', ?, '', 1)").run(day(0),"/retired-"+i);
const apiResponse=await worker.fetch(new Request("https://unit.test/api/analytics/summary?days=30"),env);
assert.equal(apiResponse.status,200);
const summary=await apiResponse.json();
assert.equal(summary.totalViews,68); assert.equal(summary.pages.length,66);
const classRow=summary.rows.find(r=>r.event==="page_view" && r.path==="/class_builds");
assert.equal(classRow.count,3); assert.equal(classRow.previousCount,4); assert.equal(classRow.activeDays,2);
assert.equal(summary.signalsStart,day(0));
console.log("PASS: Worker validation, origin rejection, SQLite totals, comparison and >50 paths");

if (process.argv.includes("--data-only")) process.exit(0);

const browser=await chromium.launch({headless:true});
try {
    const context=await browser.newContext({viewport:{width:1440,height:1000}});
    const errors=[]; const page=await context.newPage(); page.on("pageerror",e=>errors.push(e.message));
    await page.goto(base+"/class_builds.html");
    await page.locator(".cb_leveling").waitFor();
    const classes=["humar","hunewearl","hucast","hucaseal","ramar","ramarl","racast","racaseal","fomar","fomarl","fonewm","fonewearl"];
    for (const lang of langs) {
        await page.evaluate(lang=>window.DestinyI18n.setLang(lang),lang);
        for (const cls of classes) {
            await page.evaluate(cls=>{location.hash=cls+"/1/l150";},cls);
            await page.waitForFunction(cls=>document.querySelector(".cb_cls.is-active b")?.textContent.toLowerCase()===cls,cls);
            for (const level of [100,150,180,200]) {
                await page.locator(".cb_level_tab").filter({hasText:"LV "+level}).click();
                assert.equal(await page.locator(".cb_level_tab.is-active").textContent(),"LV "+level);
                assert((await page.locator(".cb_unit_plan").textContent()).includes(cls.startsWith("fo") ? "V80" : "V101"));
                assert.equal(await page.locator(".cb_leveling [data-i18n='b2.lead']").textContent(),copy["b2.lead"][langs.indexOf(lang)]);
                assert((await page.locator(".cb_route_priority").count())>=3);
            }
        }
    }
    await page.evaluate(()=>window.DestinyI18n.setLang("ko"));
    await page.evaluate(()=>{location.hash="fomar/1/l100";});
    await page.locator('.cb_route_card[data-db-name="V801"]').click();
    await page.waitForFunction(()=>document.getElementById("destinyDetailModal").getAttribute("aria-hidden")==="false");
    assert.equal(await page.locator("#destinyDetailTitle").textContent(),"V801");
    await page.keyboard.press("Escape");
    await page.evaluate(()=>{location.hash="ramarl/1/l150";});
    await page.waitForFunction(()=>document.querySelector(".cb_cls.is-active b").textContent==="RAmarl");
    await page.locator(".cb_leveling").screenshot({path:screenshotDir+"/roadmap-desktop.png"});
    for (const width of [390,344]) {
        await page.setViewportSize({width,height:844}); await page.evaluate(()=>window.DestinyI18n.setLang("fr"));
        assert(!(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)), "roadmap overflow "+width);
    }
    await page.evaluate(()=>window.DestinyI18n.setLang("ko"));
    await page.locator(".cb_leveling").screenshot({path:screenshotDir+"/roadmap-mobile.png"});
    await page.setViewportSize({width:1440,height:1000});
    await page.goto(base+"/pb_guide.html");
    for (const lang of langs) {
        await page.evaluate(lang=>window.DestinyI18n.setLang(lang),lang);
        for (let n=1;n<=4;n++) {
            await page.locator('[data-step="'+n+'"]').click();
            assert.equal(await page.locator("#pb-step-body").textContent(),copy["pb.step"+n+"Body"][langs.indexOf(lang)]);
        }
    }
    await page.evaluate(()=>window.DestinyI18n.setLang("ko"));
    await page.screenshot({path:screenshotDir+"/pb-guide-desktop.png",fullPage:true});
    for (const width of [390,344]) {
        await page.setViewportSize({width,height:844});
        await page.evaluate(()=>window.DestinyI18n.setLang("fr"));
        assert(!(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)),"PB overflow");
    }
    await page.evaluate(()=>window.DestinyI18n.setLang("ko"));
    await page.screenshot({path:screenshotDir+"/pb-guide-mobile.png",fullPage:true});
    await page.evaluate(()=>{document.documentElement.dataset.theme="dark";});
    await page.screenshot({path:screenshotDir+"/pb-guide-mobile-dark.png",fullPage:true,animations:"disabled"});
    console.log("PASS: 12 classes × 4 levels × 5 languages, PB 4 steps × 5 languages; mobile overflow");

    // Dashboard fixtures are local test-only. No sample traffic ships with the site.
    const report={version:2,days:30,since:day(-29),until:day(0),previousSince:day(-59),coverageStart:day(-90),signalsStart:day(-60),totalViews:120,
        rows:[
            {path:"/class_builds",event:"page_view",target:"",count:80,previousCount:50,activeDays:12,lastSeen:day(0)},
            {path:"/pb_guide",event:"page_view",target:"",count:40,previousCount:0,activeDays:8,lastSeen:day(-1)},
            {path:"/class_builds",event:"engaged_view",target:"",count:62},
            {path:"/class_builds",event:"content_use",target:"page",count:44},
            {path:"/class_builds",event:"content_view",target:"class-roadmap",count:55,previousCount:20,activeDays:9,lastSeen:day(0)},
            {path:"/class_builds",event:"content_use",target:"class-roadmap",count:25}],
        classes:[{path:"/class_builds",target:"ramarl",count:18}],levels:[{path:"/class_builds",target:"ramarl:150",count:10}]};
    await page.route("**/api/analytics/summary?*",route=>route.fulfill({json:report}));
    await page.setViewportSize({width:1440,height:1000}); await page.goto(base+"/analytics_page.html");
    await page.locator("#usage-results").waitFor({state:"visible"});
    const inventory=JSON.parse(fs.readFileSync(".sites-static/data/content-catalog.json","utf8"));
    assert.equal(await page.locator("#usage-table-body tr").count(),inventory.pages.length);
    assert.equal(await page.locator("#usage-total").textContent(),"120");
    assert.equal(await page.locator("#usage-zero").textContent(),String(inventory.pages.length-2));
    for (const lang of langs) {
        await page.evaluate(lang=>window.DestinyI18n.setLang(lang),lang);
        assert.equal(await page.locator("[data-i18n='usage.inventory']").textContent(),copy["usage.inventory"][langs.indexOf(lang)]);
    }
    await page.locator("#usage-sort").selectOption("asc");
    assert.equal(await page.locator("#usage-table-body tr").first().locator("td").nth(1).textContent(),"0");
    await page.locator("#usage-low").check();
    assert.equal(await page.locator("#usage-table-body tr").count(),inventory.pages.length-2);
    await page.locator("#usage-search").fill("does-not-exist");
    assert((await page.locator("#usage-table-body").textContent()).includes(copy["usage.noResults"][4]));
    await page.locator("#usage-search").fill(""); await page.locator("#usage-low").uncheck();
    await page.locator("#usage-sort").selectOption("desc");
    const download=page.waitForEvent("download"); await page.locator("#usage-export").click();
    assert((await download).suggestedFilename().endsWith(".csv"));
    await page.evaluate(()=>window.DestinyI18n.setLang("ko"));
    await page.screenshot({path:screenshotDir+"/analytics-test-fixture-desktop.png",fullPage:true});
    await page.locator('[data-mode="sections"]').click();
    assert.equal(await page.locator("#usage-table-body tr").count(),inventory.sections.length);
    assert.equal(await page.locator("#usage-table-body tr").first().locator("td").nth(1).textContent(),"55");
    await page.setViewportSize({width:344,height:844});
    assert(!(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)),"analytics overflow");
    await page.screenshot({path:screenshotDir+"/analytics-test-fixture-mobile.png",fullPage:true});
    await page.unroute("**/api/analytics/summary?*");
    await page.route("**/api/analytics/summary?*",route=>route.fulfill({status:503,json:{error:"analytics_unavailable"}}));
    await page.locator("[data-days='7']").click();
    await page.waitForFunction(()=>!document.getElementById("usage-state").hidden && !document.getElementById("usage-state").textContent.includes("불러오는"));
    await page.evaluate(()=>window.DestinyI18n.setLang("ja"));
    assert.equal(await page.locator("#usage-results").isVisible(),false);
    assert((await page.locator("#usage-state").textContent()).includes(copy["usage.connection"][2]));
    assert.deepEqual(errors,[]);
    console.log("PASS: dashboard inventory, 0-view rows, sorts, filters, CSV, sections, language changes and API-error states");
    await context.close();

    // Simulate production origin, intercept ALL requests; counters never leave the test.
    const collector=await browser.newContext({viewport:{width:1280,height:900}});
    const events=[];
    await collector.route("**/*",async route=>{
        const url=new URL(route.request().url());
        if(url.hostname==="destiny-roster.weba44.workers.dev") {
            if(route.request().method()==="POST") events.push(JSON.parse(route.request().postData()));
            return route.fulfill({status:200,json:{recorded:true}});
        }
        if(url.hostname==="angrieta.github.io") {
            const name=decodeURIComponent(url.pathname.replace(/^\/Destiny_Guide\//,""));
            const file=path.resolve(".sites-static",name);
            if(file.startsWith(path.resolve(".sites-static")+path.sep) && fs.existsSync(file) && fs.statSync(file).isFile()) {
                const mime=file.endsWith(".js")?"application/javascript":file.endsWith(".css")?"text/css":file.endsWith(".json")?"application/json":file.endsWith(".html")?"text/html":"application/octet-stream";
                return route.fulfill({contentType:mime,body:fs.readFileSync(file)});
            }
        }
        return route.abort();
    });
    const cp=await collector.newPage();
    await cp.clock.install();
    await cp.goto("https://angrieta.github.io/Destiny_Guide/pb_guide.html");
    await cp.locator('[data-step="2"]').click();
    await cp.locator('[data-step="3"]').click();
    await cp.clock.runFor(17000);
    await cp.waitForFunction(()=>window.DestinyAnalytics!=null);
    await cp.evaluate(()=>window.DestinyAnalytics.track("content_use","pb-cycle"));
    assert.equal(events.filter(e=>e.event==="page_view").length,1);
    assert.equal(events.filter(e=>e.event==="content_use" && e.target==="pb-cycle").length,1);
    assert.equal(events.filter(e=>e.event==="engaged_view").length,1);
    assert(events.some(e=>e.event==="content_view" && e.target==="pb-cycle"));
    assert(events.every(e=>Object.keys(e).sort().join(",")==="event,path,target"));
    assert(!events.some(e=>e.event==="class_select"));
    await cp.reload(); await cp.clock.runFor(17000);
    assert.equal(events.filter(e=>e.event==="page_view").length,1);
    const hiddenPage=await collector.newPage();
    await hiddenPage.clock.install();
    await hiddenPage.addInitScript(()=>{
        window.qaHidden=true;
        Object.defineProperty(document,"hidden",{get:()=>window.qaHidden,configurable:true});
    });
    await hiddenPage.goto("https://angrieta.github.io/Destiny_Guide/pb_guide.html");
    await hiddenPage.clock.runFor(20000);
    assert.equal(events.filter(e=>e.event==="engaged_view").length,1,"hidden tab must not add engagement");
    await hiddenPage.evaluate(()=>{window.qaHidden=false;document.dispatchEvent(new Event("visibilitychange"));});
    await hiddenPage.clock.runFor(17000);
    await hiddenPage.evaluate(()=>window.DestinyAnalytics.track("content_use","page"));
    assert.equal(events.filter(e=>e.event==="engaged_view").length,2,"visible tab accumulates engagement");
    console.log("PASS: collector once-per-tab dedupe, 15s engagement, section view/use, no raw values, reload dedupe");
    await collector.close();
} finally { await browser.close(); db.close(); }
console.log("ALL REVISION CHECKS PASSED");
