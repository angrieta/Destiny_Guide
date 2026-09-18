import {readFile, writeFile} from 'node:fs/promises';
import {resolve} from 'node:path';
import {fileURLToPath} from 'node:url';
import {runInNewContext} from 'node:vm';
import {readDestinyCatalog} from './lib/catalog-data.mjs';
import {acquisitionKey, groupDropRoutes, isAcquisitionPlaceholder} from './acquisition-core.mjs';

const json = async path => JSON.parse(await readFile(path, 'utf8'));
export async function buildItemAcquisition() {
  const recipes = await json('data/item-recipes.json');
  const tables = await Promise.all([0,1,2,3].map(i => json(`data/drop-tables-${i}.json`)));
  const items = {};
  const get = name => items[acquisitionKey(name)] ||= {name, drops: [], recipes: [], notes: []};
  for (const [key, drops] of Object.entries(groupDropRoutes(tables))) get(drops[0].name).drops = drops;
  for (const recipe of recipes.recipes) get(recipe.name).recipes.push({...recipe, kind: 'trade'});
  for (const group of recipes.forumGroups) for (const combo of group.combos) {
    const entry = get(combo.result);
    // Prefer the combination's level/class requirements over an identical catalog list.
    const signature = ingredients => ingredients.map(i => `${acquisitionKey(i.item)}:${i.qty}`).sort().join('|');
    const ingredients = combo.parts.map(item => ({item, qty: 1}));
    entry.recipes = entry.recipes.filter(r => signature(r.ingredients) !== signature(ingredients));
    entry.recipes.push({...combo, ingredients, kind: 'combination', recipeComplete: true,
      status: /not available yet/i.test(combo.note || '') ? 'planned' : undefined,
      source: 'https://discord.com/channels/363947585154580480/1545231887004606494', checkedAt: '2026-09-04'});
  }
  // Existing home-page recipes have no catalog recipe. Keep their provenance and
  // mark them partial: unlike the verified lists these older quantities need NPC confirmation.
  const legacy = runInNewContext(await readFile('scripts/item_info.js','utf8') + '\nITEM_DETAIL;', {window:{}}, {timeout:1000});
  for (const [id, name] of [['v803','V803'], ['phantasmal_field','PHANTASMAL FIELD']]) {
    const ingredients = legacy[id].sections.flatMap(s=>s.body).flatMap(html => {
      const match = html.match(/<div class="Material_title">([^<]+)<\/div>/);
      if (!match) return [];
      const [, item, qty] = match[1].match(/^(.*?)(?:\s+x(\d+))?$/);
      return [{item, qty: Number(qty || 1)}];
    });
    get(name).recipes.push({kind:'trade', ingredients, recipeComplete:false, source:'./index.html', obtain:['Millennium Shop — The Phantastic Bazaar (EP2 > Shop)']});
  }
  const supplemental = await json('data/item-acquisition-extra.json');
  for (const extra of supplemental) {
    const item = get(extra.name);
    item.notes.push(...(extra.notes || []));
    item.recipes.push(...(extra.recipes || []));
  }
  const catalog = await readDestinyCatalog();
  const priorityWindow = {};
  runInNewContext(await readFile('scripts/item_priority_data.js','utf8'), {window:priorityWindow}, {timeout:1000});
  const html = await readFile('item_page.html','utf8');
  const decode = s => s.replace(/&amp;/g,'&').replace(/&#39;|&apos;/g,"'");
  const names = [...catalog.map(i=>i.name), ...priorityWindow.DestinyItemPriorityData.imports.map(i=>i.name),
    ...Array.from(html.matchAll(/<span class="item_name">([^<]+)<\/span>/g), m=>decode(m[1].trim()))];
  const roots = new Set(names.map(acquisitionKey));
  const analyticsItems = [...roots].sort().map(key => ({key,
    name: items[key]?.name || names.find(name=>acquisitionKey(name)===key),
    names: [...new Set(names.filter(name=>acquisitionKey(name)===key))],
  }));
  await writeFile('data/analytics-items.json', JSON.stringify(analyticsItems,null,2)+'\n');
  // Keep ingredient recipes and routes too, so crafting chains are navigable.
  const keep = new Set();
  function visit(key) {
    if (keep.has(key)) return;
    keep.add(key);
    for (const recipe of items[key]?.recipes || []) for (const part of recipe.ingredients) visit(acquisitionKey(part.item));
  }
  roots.forEach(visit);
  // Preserve announced recipes with their status even when no card is mounted yet.
  recipes.recipes.forEach(recipe => visit(acquisitionKey(recipe.name)));
  const selected = Object.fromEntries([...keep].filter(k=>items[k]).sort().map(k=>[k,items[k]]));
  const output = {schemaVersion:1, items:selected};
  await writeFile('data/item-acquisition.json', JSON.stringify(output,null,2)+'\n');
  const known = catalog.filter(item=>(item.obtain||[]).some(text=>!isAcquisitionPlaceholder(text))).map(i=>acquisitionKey(i.name));
  const covered = [...roots].filter(key => items[key]?.drops.length || items[key]?.recipes.length || items[key]?.notes.length || known.includes(key));
  return {items:roots.size, covered:covered.length, missing:[...roots].filter(k=>!covered.includes(k)).map(k=>names.find(n=>acquisitionKey(n)===k))};
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) console.log(await buildItemAcquisition());
