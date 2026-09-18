import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile, mkdir} from 'node:fs/promises';
import path from 'node:path';
import {chromium} from 'playwright';

const root = path.resolve('.sites-static');
const types = {'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.json':'application/json','.css':'text/css','.png':'image/png','.webp':'image/webp','.jpg':'image/jpeg','.svg':'image/svg+xml'};
const server = createServer(async (req,res) => {
  const pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname).replace(/^\/Destiny_Guide/,'');
  const file = path.resolve(root,'.'+pathname);
  if (!file.startsWith(root+path.sep)) {res.writeHead(403).end();return;}
  try {const body=await readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream'}).end(body);} catch {res.writeHead(404).end();}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser = await chromium.launch({headless:true});
try {
  const page = await browser.newPage({viewport:{width:1280,height:900}});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const external = route => /^(cdn\.jsdelivr\.net|cdnjs\.cloudflare\.com)$/.test(new URL(route.request().url()).hostname) ? route.continue() : route.abort();
  await page.route('https://**/*', external);
  await page.addInitScript(()=>localStorage.setItem('destiny-guide-lang','ko'));
  const url=`http://127.0.0.1:${server.address().port}/Destiny_Guide/item_page.html`;
  await page.goto(url);
  await page.waitForFunction(()=>window.DestinyItemCatalog && document.querySelector('.ig_grid'));
  async function open(name) {
    await page.evaluate(name=>{
      const cards=Array.from(document.querySelectorAll('.destiny_item_slide .item_section_aria'));
      const card=cards.find(c=>(c.querySelector('.item_title .item_name')?.textContent||'').trim().toLowerCase()===name.toLowerCase());
      if(!card)throw new Error('Card missing: '+name);
      card.click();
    },name);
    await page.waitForSelector('[data-item-acquisition][aria-busy="false"]');
    return page.locator('[data-item-acquisition]').innerText();
  }
  assert.match(await open('GILDE DIVINE X'),/Ultimate/);
  assert.match(await open('Combustion Canon'),/Section ID|Greenill|Skyly|Bluefull|Viridia|Redria|Oran|Purplenum|Pinkal|Yellowboze|Whitill/);
  assert.match(await open('Dark Flow'),/Sword series ×1.*Parasitic Gene/);
  assert.match(await open('Christmas Spirit'),/이벤트 기간 한정/);
  assert.match(await open('MATRIX SCOPE'),/일부 재료/);
  assert.match(await open('V803'),/Millennium Photon Core ×20/);
  assert.match(await open('CRYSTALIZED WINGS'),/Eclipse Dragon/);
  const inventory=await page.evaluate(()=>Array.from(document.querySelectorAll('.destiny_item_slide .item_section_aria')).map(c=>c.querySelector('.item_title .item_name')?.textContent.trim()).filter(Boolean));
  let routes=0;const unresolved=[];
  for(const name of inventory) {
    const text=await open(name);
    assert(!text.includes('현재 카드에는 구체적인'),name);
    if(text.includes('아직 확인하지 못한')) unresolved.push(name); else routes++;
  }
  // Real keyboard and pointer paths, language refresh, and nested material routes.
  await page.evaluate(()=>window.DestinyItemCatalog.close());
  const search=page.locator('input[type="search"]').first();
  await search.fill('Dark Flow');
  const dark=page.locator('.item_section_aria').filter({has:page.locator('.item_title .item_name', {hasText:/^\s*Dark Flow\s*$/i})}).first();
  await dark.focus();await page.keyboard.press('Enter');
  await page.waitForSelector('[data-item-acquisition][aria-busy="false"]');
  await page.locator('.acquisition_materials > summary').first().click();
  await page.locator('.acquisition_materials details > summary').filter({hasText:'Parasitic Gene'}).click();
  assert.match(await page.locator('[data-item-acquisition]').innerText(),/Olga Flow/);
  await page.evaluate(()=>window.DestinyI18n.setLang('en'));
  await page.waitForFunction(()=>document.querySelector('[data-item-acquisition]')?.textContent.includes('Crafting / exchange'));
  await page.evaluate(()=>window.DestinyI18n.setLang('ko'));
  await page.waitForFunction(()=>document.querySelector('[data-item-acquisition]')?.textContent.includes('조합 / 교환'));
  await page.setViewportSize({width:390,height:844});
  await open('V802');
  await page.locator('[data-item-acquisition]').scrollIntoViewIfNeeded();
  const widths=await page.locator('.destiny_detail_dialog').evaluate(el=>({client:el.clientWidth,scroll:el.scrollWidth}));
  assert(widths.scroll<=widths.client+1,JSON.stringify(widths));
  await mkdir('.codex-tmp',{recursive:true});
  await page.screenshot({path:'.codex-tmp/item-acquisition-mobile.png'});
  // Failure must be retryable and a late response must not replace another card.
  const retry=await browser.newPage();await retry.route('https://**/*',external);
  await retry.addInitScript(()=>localStorage.setItem('destiny-guide-lang','ko'));
  let requests=0;
  await retry.route('**/data/item-acquisition.json',async route=>{
    requests++;if(requests===1) return route.fulfill({status:503,body:'unavailable'});
    await new Promise(resolve=>setTimeout(resolve,150));await route.continue();
  });
  await retry.goto(url+'?item=database-v803');
  await retry.waitForFunction(()=>document.querySelector('[data-item-acquisition]')?.textContent.includes('재시도'));
  await retry.evaluate(()=>{window.DestinyItemCatalog.close();window.DestinyItemCatalog.open(window.DestinyItemCatalog.findByName('V803'));window.DestinyItemCatalog.open(window.DestinyItemCatalog.findByName('V802'));});
  await retry.waitForSelector('[data-item-acquisition][aria-busy="false"]');
  assert.equal(await retry.locator('.destiny_detail_title').innerText(),'V802');
  assert.match(await retry.locator('[data-item-acquisition]').innerText(),/Sinow Blue/);
  assert.equal(requests,2);
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({cards:inventory.length,withRoutesOrNotes:routes,unresolved,errors},null,2));
} finally {await browser.close();await new Promise(resolve=>server.close(resolve));}
