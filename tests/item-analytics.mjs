import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import ts from 'typescript';
import {DatabaseSync} from 'node:sqlite';
import {chromium} from 'playwright';

const registry=JSON.parse(fs.readFileSync('data/analytics-items.json','utf8'));
const elements=JSON.parse(fs.readFileSync('data/analytics-elements.json','utf8'));
const source=fs.readFileSync('api/src/index.ts','utf8').replace("import analyticsItems from '../../data/analytics-items.json';",'const analyticsItems='+JSON.stringify(registry)+';').replace("import analyticsElements from '../../data/analytics-elements.json';",'const analyticsElements='+JSON.stringify(elements)+';');
const code=ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.ESNext,target:ts.ScriptTarget.ES2022}}).outputText;
const worker=(await import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'))).default;
const db=new DatabaseSync(':memory:');db.exec(fs.readFileSync('api/migrations/0002-analytics.sql','utf8'));
const env={ALLOWED_ORIGINS:'https://angrieta.github.io',DB:{prepare(sql){const stmt=db.prepare(sql);let args=[];return {bind(...v){args=v;return this;},async run(){return stmt.run(...args);},async all(){return {results:stmt.all(...args)};},async first(){return stmt.get(...args)||null;}};}}};
const post=body=>worker.fetch(new Request('https://test/api/analytics/view',{method:'POST',headers:{'Content-Type':'application/json',Origin:'https://angrieta.github.io'},body:JSON.stringify(body)}),env);
for(const body of [
  {event:'item_open',path:'/item_page',target:'not-a-catalog-item'},
  {event:'item_open',path:'/index',target:'darkflow'},
  {event:'item_source_click',path:'/item_page',target:'https://private.example/'},
]) assert.equal((await post(body)).status,400);
const browser=await chromium.launch({headless:true});
try {
  const context=await browser.newContext({viewport:{width:1280,height:960}});
  const calls=[];
  await context.route('https://**/*',async route=>{
    const req=route.request(), url=new URL(req.url());
    if(url.hostname==='angrieta.github.io') {
      const file=path.resolve('.sites-static','.'+decodeURIComponent(url.pathname.replace('/Destiny_Guide','')));
      try {
        const type={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.jpg':'image/jpeg','.webp':'image/webp','.svg':'image/svg+xml'}[path.extname(file)];
        return route.fulfill({body:fs.readFileSync(file),contentType:type||'application/octet-stream'});
      } catch {return route.fulfill({status:404,body:'not found'});}
    }
    if(url.pathname.startsWith('/api/analytics/')) {
      const body=req.method()==='POST'?req.postData():undefined;
      if(body) calls.push(JSON.parse(body));
      const result=await worker.fetch(new Request(req.url(),{method:req.method(),headers:{'Content-Type':'application/json',Origin:'https://angrieta.github.io'},body}),env);
      return route.fulfill({status:result.status,body:await result.text(),headers:Object.fromEntries(result.headers)});
    }
    if(/^(cdn\.jsdelivr\.net|cdnjs\.cloudflare\.com)$/.test(url.hostname))return route.continue();
    return route.abort();
  });
  await context.addInitScript(()=>localStorage.setItem('destiny-guide-lang','ko'));
  const page=await context.newPage();
  await page.goto('https://angrieta.github.io/Destiny_Guide/item_page.html?name=Dark%20Flow');
  await page.waitForSelector('[data-item-acquisition][aria-busy="false"]');
  await page.waitForFunction(()=>sessionStorage.getItem('destiny-usage-v2:/item_page:item_open:darkflow'));
  assert.equal(calls.filter(c=>c.event==='item_open'&&c.target==='darkflow').length,1);
  await page.evaluate(()=>{window.DestinyItemCatalog.close();const card=Array.from(document.querySelectorAll('.item_section_aria')).find(c=>c.querySelector('.item_title .item_name')?.textContent.trim()==='Dark Flow');card.click();});
  await page.waitForSelector('[data-item-acquisition][aria-busy="false"]');
  await page.locator('.acquisition_materials > summary').first().click();
  await page.locator('.acquisition_materials details > summary').filter({hasText:'Parasitic Gene'}).click();
  await page.evaluate(()=>document.querySelector('#destinyDetailModal').addEventListener('click',event=>{if(event.target.closest('a'))event.preventDefault();}));
  await page.locator('[data-item-acquisition] a[href*="drop-tables"]').filter({visible:true}).first().click();
  await page.waitForFunction(()=>sessionStorage.getItem('destiny-usage-v2:/item_page:item_drop_click:darkflow'));
  await page.waitForFunction(()=>sessionStorage.getItem('destiny-usage-v2:/item_page:item_material_open:darkflow'));
  await page.evaluate(()=>window.DestinyI18n.setLang('en'));
  await page.waitForFunction(()=>document.querySelector('[data-item-acquisition]')?.textContent.includes('Crafting / exchange'));
  await page.reload();await page.waitForSelector('[data-item-acquisition][aria-busy="false"]');
  assert.equal(calls.filter(c=>c.event==='item_open'&&c.target==='darkflow').length,1);
  await page.goto('https://angrieta.github.io/Destiny_Guide/item_page.html?item=matrix-scope');
  await page.waitForSelector('[data-item-acquisition][aria-busy="false"]');
  await page.evaluate(()=>document.querySelector('#destinyDetailModal').addEventListener('click',e=>{if(e.target.closest('a'))e.preventDefault();}));
  await page.locator('[data-item-acquisition] a[href*="recipe_page"]').first().click();
  await page.waitForFunction(()=>sessionStorage.getItem('destiny-usage-v2:/item_page:item_recipe_click:matrixscope'));
  await page.locator('[data-item-acquisition] a[href*="discord.com"]').first().click();
  await page.waitForFunction(()=>sessionStorage.getItem('destiny-usage-v2:/item_page:item_source_click:matrixscope'));
  const before=calls.length;
  await page.goto('https://angrieta.github.io/Destiny_Guide/analytics_page.html');
  await page.waitForSelector('#usage-results:not([hidden])');
  await page.locator('#usage-item-search').fill('DARK FLOW');
  const row=page.locator('#usage-items-body tr');assert.equal(await row.count(),1);
  assert.deepEqual(await row.locator('td').allTextContents(),['Dark Flow','1','1','0','1','0']);
  const [download]=await Promise.all([page.waitForEvent('download'),page.locator('#usage-item-export').click()]);
  const csv=fs.readFileSync(await download.path(),'utf8');assert(csv.includes('darkflow'));assert(csv.includes('item_drop_click'));
  await page.setViewportSize({width:390,height:844});assert(!(await page.evaluate(()=>document.documentElement.scrollWidth>innerWidth)));
  await page.locator('#item-usage').scrollIntoViewIfNeeded();await page.screenshot({path:'.codex-tmp/item-analytics-mobile.png'});
  assert.equal(calls.length,before,'dashboard must not collect events');
  assert(calls.every(c=>!('ip' in c)&&!('query' in c)&&!('url' in c)));
  console.log('PASS: fixed item validation, real modal events, material expansion, drop/recipe/source clicks, tab deduplication, language refresh, dashboard ranking, CSV and mobile layout');
} finally {await browser.close();db.close();}
