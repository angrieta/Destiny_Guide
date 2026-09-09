import assert from "node:assert/strict";
import fs from "node:fs";
import {chromium} from "playwright";
import {normalizeSearch,searchIndex} from "../scripts/search-engine.mjs";

const index=JSON.parse(fs.readFileSync("data/search-index.json","utf8"));
const translation=JSON.parse(fs.readFileSync(".sites-static/i18n/ko.json","utf8"));
const t=(key,fallback)=>translation[key]||fallback;
const base=process.env.QA_BASE || "http://localhost:3003";
const output="C:/Users/USER/.codex/visualizations/2026/09/07/01a079ea-71d7-7451-ac95-6b6c08addd94";
assert.equal(normalizeSearch("공속"),"공속");
assert.equal(normalizeSearch("Épée"),"epee");
assert.equal(searchIndex(index,"없는아이템입니다").length,0);
assert.equal(searchIndex(index,"!!!").length,0);
for(const [query,name] of [["V 801","V801"],["HeavenlyBattle","Heavenly/Battle"],["공속","V101"],["시전속도","V801"],["프로즌슈터","FROZEN SHOOTER"],["무적","Sato"]]) {
    assert(searchIndex(index,query,t,"items").some(r=>r.name===name),query);
}
assert.equal(searchIndex(index,"드랍테이블",t)[0].url,"drop-tables/");
assert.equal(searchIndex(index,"데이타베이스",t)[0].url,"database/");
assert(searchIndex(index,"ASTRAL WINGS",t,"items").some(r=>r.url.startsWith("database/")));
assert(searchIndex(index,"ASTRAL WINGS",t,"items").some(r=>r.url.startsWith("item_page.html")));
assert(searchIndex(index,"cures all",t,"items").some(r=>r.name==="State/Maintenance"));
assert(searchIndex(index,"humar",t,"items").some(r=>r.name==="VJAYA"));
assert(searchIndex(index,"빛나는없는몬스터",t,"drops").length===0);

// Every source database row is represented, including same-name colour variants.
const seen=new Map(), dbRows=[];
const slug=name=>name.normalize("NFKD").toLowerCase().replace(/[’']/g,"").replace(/[^a-z0-9]+/g," ").trim().replace(/\s+/g,"-");
for(let i=1;i<=5;i++) {
    const category=JSON.parse(fs.readFileSync("data/database-"+i+".json","utf8"));
    for(const row of category.rows) {
        const name=row.Name.trim(), s=slug(name)||"item-"+category.type;
        const count=(seen.get(s)||0)+1;seen.set(s,count);
        const url="database/?item="+s+(count===1?"":"-"+count);
        assert(index.items.some(r=>r[0]===name && r[1]===url),url);dbRows.push(row);
    }
}
// Every nonempty source drop cell survives grouping, and every link contains a real route.
let dropCells=0;
const dropRoutes=new Set();
for(const row of index.drops) {
    const p=new URL(row[1],"https://test/").searchParams;
    for(const section of row[7]) dropRoutes.add(JSON.stringify([row[0],section,p.get("enemy"),p.get("difficulty"),p.get("episode"),row[3].split(" · ").at(-1)]));
}
for(let i=0;i<4;i++) {
    const table=JSON.parse(fs.readFileSync("data/drop-tables-"+i+".json","utf8"));
    for(const ep of table.episodes) for(const [enemy,,cells] of ep.rows) for(const [section,item,rate] of cells) {
        if(!item || item.toLowerCase()==="no item") continue;
        dropCells++;
        assert(dropRoutes.has(JSON.stringify([item,section,enemy,table.name,String(ep.episode),rate || "—"])),JSON.stringify({item,enemy,section}));
    }
}
assert.equal(index.dropSourceRows,dropCells);
const route=searchIndex(index,"휘틸 V802",t,"drops")[0];
const routeParams=new URL(route.url,"https://test/").searchParams;
assert.equal(routeParams.get("item"),"V802"); assert.equal(routeParams.get("section"),"Whitill");
assert.equal(routeParams.get("enemy"),"Sinow Blue"); assert.equal(routeParams.get("difficulty"),"Ultimate");
console.log("PASS: full coverage of "+dbRows.length+" DB rows and "+dropCells+" drop cells; Unicode, aliases, effects, classes and deep links");

const browser=await chromium.launch({headless:true});
try {
    const context=await browser.newContext({viewport:{width:1280,height:900}});
    await context.addInitScript(()=>{localStorage.setItem("destiny-guide-lang","ko");localStorage.removeItem("destiny-guide-recent-search");});
    const page=await context.newPage();const errors=[];page.on("pageerror",error=>errors.push(error.message));
    const examples=["V801","Whitill V802","Garanz","공속","무적","드랍테이블","HeavenlyBattle","없는아이템입니다","!!!"];
    const fingerprints={};
    for(const [type,path] of [["static","class_builds.html"],["react","database/"]]) {
        await page.goto(base+"/"+path);
        await page.locator(".ds_search_trigger").click();
        await page.locator(".ds_search_input").waitFor();
        for(const query of examples) {
            await page.locator(".ds_search_input").fill(query);
            const expected=searchIndex(index,query,t).slice(0,24);
            await page.waitForFunction(n=>document.querySelectorAll(".ds_search_result").length===n,expected.length);
            const actual=await page.locator(".ds_search_result").evaluateAll(nodes=>nodes.map(node=>new URL(node.href).pathname+new URL(node.href).search));
            const want=expected.map(r=>new URL(r.url,"https://test/")).map(url=>url.pathname+url.search);
            assert.deepEqual(actual,want,type+" "+query);
            if(type==="static") fingerprints[query]=actual;else assert.deepEqual(actual,fingerprints[query]);
        }
        await page.locator(".ds_search_input").fill("V101");
        await page.locator('[data-scope="drops"]').click();
        await page.waitForFunction(()=>[...document.querySelectorAll(".ds_search_result")].every(a=>a.href.includes("/drop-tables")));
        assert(await page.locator(".ds_search_result").count()>0);
        await page.locator(".ds_search_input").fill("Redria");
        await page.waitForFunction(()=>document.querySelectorAll(".ds_search_result").length===24);
        await page.locator(".ds_search_more").click();
        assert.equal(await page.locator(".ds_search_result").count(),48);
        await page.locator('[data-scope="pages"]').click();
        await page.locator(".ds_search_input").fill("드랍테이블");
        await page.waitForFunction(()=>document.querySelector(".ds_search_result")?.getAttribute("href")?.includes("drop-tables"));
        await page.locator('[data-scope="all"]').click();
        await page.locator(".ds_search_input").fill("V801");
        await page.waitForFunction(()=>document.querySelector(".ds_search_result")?.textContent.includes("V801"));
        await page.screenshot({path:output+"/header-search-"+type+".png",animations:"disabled"});
        for(const width of [390,344]) {
            await page.setViewportSize({width,height:844});
            assert(!(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)),type+" overflow "+width);
        }
        await page.screenshot({path:output+"/header-search-"+type+"-mobile.png",animations:"disabled"});
        await page.keyboard.press("Escape");
        assert.equal(await page.locator(".ds_search_input").isVisible(),false);
        await page.setViewportSize({width:1280,height:900});
    }
    // Static search -> prefilled drop table, reload persistence, browser history restoration.
    await page.goto(base+"/class_builds.html"); await page.locator(".ds_search_trigger").click();
    await page.locator(".ds_search_input").fill("Whitill V802");
    await page.locator(".ds_search_result").filter({hasText:"Sinow Blue"}).click();
    await page.waitForURL(url=>url.pathname.replace(/\/$/,"")==="/drop-tables");
    await page.waitForFunction(()=>[...document.querySelectorAll("main input")].some(e=>e.value==="V802"));
    assert.deepEqual((await page.locator("main select").evaluateAll(nodes=>nodes.map(n=>n.value))).slice(0,2),["Whitill","1"]);
    assert.equal(await page.locator("main button").filter({hasText:/^Ultimate$/}).first().getAttribute("class").then(x=>x.includes("Active")),true);
    await page.reload();
    await page.waitForFunction(()=>[...document.querySelectorAll("main input")].some(e=>e.value==="Sinow Blue"));
    await page.evaluate(()=>{
        history.pushState(null,"","?item=V801&enemy=Astark&section=Pinkal&episode=4&difficulty=Very+Hard");
        dispatchEvent(new PopStateEvent("popstate"));
    });
    await page.waitForFunction(()=>[...document.querySelectorAll("main input")].some(e=>e.value==="Astark"));
    assert((await page.locator("main select").evaluateAll(nodes=>nodes.map(n=>n.value))).includes("Pinkal"));
    // Search result opens the actual DB modal.
    await page.locator(".ds_search_trigger").click(); await page.locator(".ds_search_input").fill("V801");
    await page.locator('.ds_search_result[href*="database/?item=v801"]').click();
    await page.waitForURL(url=>url.pathname.replace(/\/$/,"")==="/database");
    await page.waitForSelector('[role="dialog"]');
    assert((await page.locator('[role="dialog"]').innerText()).includes("V801"));
    assert.deepEqual(errors,[]);
    console.log("PASS: static/React result parity, scopes, pagination, keyboard close, mobile widths, drop filters/reload/history and DB detail");

    // Retry index errors in both headers; do not turn network failure into 'no matches'.
    for(const path of ["class_builds.html","database/"]) {
        const failedContext=await browser.newContext();let fail=true;
        await failedContext.route("**/data/search-index.json",route=>fail?route.fulfill({status:503,body:"unavailable"}):route.continue());
        const p=await failedContext.newPage();await p.goto(base+"/"+path);await p.locator(".ds_search_trigger").click();
        await p.waitForFunction(()=>document.querySelector(".ds_search_note")?.textContent.includes("retry") || document.querySelector(".ds_search_note")?.textContent.includes("재시도"));
        await p.keyboard.press("Escape");fail=false;await p.locator(".ds_search_trigger").click();
        await p.locator(".ds_search_input").fill("V502");await p.locator(".ds_search_result").filter({hasText:"V502"}).first().waitFor();
        await failedContext.close();
    }
    console.log("PASS: loading failure and retry in both headers");
    const copy=JSON.parse(fs.readFileSync("i18n/revision.json","utf8"));
    for(const [languageIndex,lang] of ["en","ko","ja","es","fr"].entries()) {
        const localeContext=await browser.newContext();
        await localeContext.addInitScript(lang=>localStorage.setItem("destiny-guide-lang",lang),lang);
        const localized=await localeContext.newPage();
        for(const path of ["class_builds.html","database/"]) {
            await localized.goto(base+"/"+path);
            await localized.locator(".ds_search_trigger").click();
            await localized.waitForFunction(label=>document.querySelector('[data-scope="drops"]')?.textContent===label,copy["search.scope.drops"][languageIndex]);
            await localized.locator(".ds_search_input").fill("V801");
            await localized.waitForFunction(()=>document.querySelectorAll(".ds_search_result").length===6);
            assert.equal(await localized.locator(".ds_search_input").getAttribute("placeholder"),copy["search.placeholder"][languageIndex]);
            assert.equal(await localized.locator(".ds_search_count").textContent(),copy["search.count"][languageIndex].replace("{shown}","6").replace("{total}","6"));
        }
        await localeContext.close();
    }
    console.log("PASS: all five languages in static and React headers");
    await context.close();
} finally {await browser.close();}
console.log("ALL HEADER SEARCH CHECKS PASSED");
