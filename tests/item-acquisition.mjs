import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {acquisitionKey, groupDropRoutes} from '../scripts/acquisition-core.mjs';
import {renderAcquisition} from '../scripts/item-acquisition.mjs';
import {buildItemAcquisition} from '../scripts/build-item-acquisition.mjs';

await buildItemAcquisition();
const data = JSON.parse(await readFile('data/item-acquisition.json','utf8'));
globalThis.document = {documentElement:{lang:'ko'}};
const item = name => data.items[acquisitionKey(name)];
for (const name of ['Twin_Blaze','GILDE DIVINE','GILDE DIVINE X','GILDE DIVINE S','Combustion Canon','Ill Gill Reaper(IGR)','CRYSTALIZED WINGS','M&A85 Fury']) assert(item(name)?.drops.length,name);
assert.notEqual(acquisitionKey('GILDE DIVINE'),acquisitionKey('GILDE DIVINE X'));
assert(item('Dark Flow').recipes.some(r=>r.level===140 && r.ingredients.some(p=>p.item==='Sword series')));
assert(item('Guld Milla').recipes.some(r=>r.ingredients.some(p=>p.item==='Handgun: Guld')));
assert(item('MATRIX SCOPE').recipes.every(r=>r.recipeComplete===false));
assert(item('V803').recipes[0].ingredients.some(p=>p.item==='Millennium Photon Core' && p.qty===20));
assert(item('PHANTASMAL FIELD').recipes[0].ingredients.some(p=>p.item==='Millennium Photon Core' && p.qty===25));
assert(item('Astral Dragon').recipes.length);
assert(item('Blueprint: Astral Dragon').notes.length);
assert(item('Phantasmal Ore Syncesta').recipes.some(r=>r.status==='planned'));
// Every real obtainable source cell survives grouping, including lower difficulties.
for (let difficulty=0;difficulty<4;difficulty++) {
  const table = JSON.parse(await readFile(`data/drop-tables-${difficulty}.json`,'utf8'));
  for (const ep of table.episodes) for(const [enemy,dar,cells] of ep.rows) for(const [section,name,rate] of cells) {
    if (!rate || !dar || !item(name)) continue;
    assert(item(name).drops.some(r=>r.difficulty===difficulty && r.episode===ep.episode && r.enemy===enemy && r.rate===rate && r.sections.includes(section)),`${name}/${enemy}/${section}`);
  }
}
const grouped = groupDropRoutes([{difficulty:0,episodes:[{episode:1,rows:[['Enemy',0,[['Skyly','Hidden','1/10']]],['Enemy',50,[['Skyly','Hidden',null],['Skyly','Test','1/2'],['Redria','Test','1/2'],['Whitill','Test','1/4']]]]}]}]);
assert(!grouped.hidden);
assert.equal(grouped.test.length,2);
assert.deepEqual(grouped.test[0].sections,['Skyly','Redria']);
const render = name => renderAcquisition(data,{name,obtain:[]});
assert.match(render('Dark Flow'),/재료 획득 경로/);
assert.match(render('V802'),/difficulty=Ultimate/);
assert.match(render('V802'),/rate=1/);
assert.match(render('V802'),/Whitill/);
assert.match(render('CHRISTMAS SPIRIT'),/이벤트 기간 한정/);
assert.match(render('MATRIX SCOPE'),/일부 재료/);
assert.match(render('Phantasmal Ore Syncesta'),/아직 획득 불가/);
const original = 'A specific drop or crafting route is not listed on the current card.';
assert(!renderAcquisition(data,{name:'V802',obtain:[original]},['경로가 없습니다']).includes('경로가 없습니다'));
assert.match(render('unknown'),/아직 확인하지 못한/);
// Cyclic Lavis recipes stop; data is escaped before becoming HTML.
assert(render('Lavis Cannon').length < 100000);
const synthetic = {schemaVersion:1,items:{test:{name:'Test',drops:[],recipes:[],notes:[{en:'<script>alert(1)</script>',source:'./safe'}]}}};
assert(!renderAcquisition(synthetic,{name:'Test',obtain:[]}).includes('<script>'));
console.log('PASS: full drop coverage, aliases, exact ingredients, partial/planned recipes, deep links, cycle guards and escaping');
