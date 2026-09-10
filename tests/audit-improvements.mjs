import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import ts from 'typescript';
import { readDestinyCatalog } from '../scripts/lib/catalog-data.mjs';
import { withVerifiedRows } from '../scripts/lib/verified-database.mjs';
import { searchIndex } from '../scripts/search-engine.mjs';

const json = file => JSON.parse(fs.readFileSync(file, 'utf8'));
const verified = json('data/verified-content.json');
const catalog = await readDestinyCatalog();
const recipes = json('data/item-recipes.json');
const matrix = recipes.recipes.find(item => item.id === 'matrix-scope');
assert(matrix.ingredients.some(item => item.item === 'Photon Booster' && item.qty === 1));
assert(!matrix.ingredients.some(item => /Weapon Crystal Badge|^Rare (Tool|Unit|item)/.test(item.item)));
assert.equal(matrix.recipeComplete, false);
for (const recipe of recipes.recipes.filter(item => !verified.recipes.some(ore => ore.id === item.id))) {
  const original = catalog.find(item => item.id === recipe.id);
  assert(original?.required?.length, `${recipe.id} borrowed another item's recipe`);
  assert.equal(recipe.ingredients.length, original.required.length);
}
assert(!recipes.obtainNotes.some(item => item.id === 'profound-darkness'));
for (const ore of verified.recipes) {
  const recipe = recipes.recipes.find(item => item.id === ore.id);
  assert.equal(recipe.status, 'planned');
  assert.equal(recipe.ingredients.length, 7);
  assert.equal(recipe.ingredients.find(item => item.item === 'Millennium Photon Core').qty, 20);
  assert(recipe.baseItem && recipe.resultItem && recipe.scheduleSource);
}
const rows = withVerifiedRows(json('data/database-1.json'), verified).rows;
assert.equal(rows.filter(row => row.Name === 'SOUL ERASER').length, 1);
assert(rows.find(row => row.Name === 'MIRACLE CHAIN').Class.includes('fomarl'));
assert(!rows.find(row => row.Name === 'MIRACLE CHAIN').Class.split(', ').includes('fomar'));
assert(!rows.some(row => row.Name === 'AEGIS OF ISOLATION'));
const lightning = withVerifiedRows(json('data/database-2.json'), verified).rows.find(row => row.Name === 'LIGHTNING GARMENT');
assert.equal(lightning.Boosts, 'ATA +20');
assert(lightning.Notes.includes('not working'));
console.log('PASS: exact recipe boundaries, corrected MATRIX, future ores and released database items');

// Exercise real TS arithmetic without running a browser or touching a server.
const modules = new Map();
function loadTs(file) {
  file = path.resolve(file);
  if (modules.has(file)) return modules.get(file);
  const exports = {}, module = { exports };
  const code = ts.transpileModule(fs.readFileSync(file, 'utf8'), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 } }).outputText;
  vm.runInNewContext(code, { exports, module, require: name => loadTs(path.resolve(path.dirname(file), name + '.ts')) }, { filename: file });
  modules.set(file, module.exports); return module.exports;
}
const { computeTotals } = loadTs('app/calculator/totals.ts');
const empty = { weapon: null, armor: null, shield: null, units: [], grind: null };
const classStats = json('data/class-stats.json').classes.humar;
const max = computeTotals(classStats.max, empty, 'humar', 200, undefined, undefined, undefined);
assert.equal(max.stats.ATP, 1600); assert.equal(max.stats.ATA, 210); assert.equal(max.stats.HP, 2194);
const base = computeTotals({ ATP: 100 }, empty, 'humar', 200, { DEF: 0, POW: 129, DEX: 71, MIND: 0 }, undefined, { power: 5 });
assert.equal(base.stats.ATP, 368); assert.equal(base.stats.ATA, 35);
const weapon = { name: 'Test weapon', base: { ATP: 160 }, resist: {}, modifiers: { flat: {}, resist: {}, tech: {}, speed: {}, cost: {}, regen: {}, flags: [] },
  classes: ['humar'], requiredLevel: null, requirement: null, maxGrind: 30, grindPerLevel: 2, atpMin: 80, atpMax: 100, targets: 1, range: 14, special: null };
for (const [grind, min, max] of [[null,140,160],[10,100,120],[0,80,100]]) {
  const result = computeTotals({}, { ...empty, weapon, grind }, 'humar', 200);
  assert.equal(result.weapon.atpMin, min); assert.equal(result.weapon.atpMax, max); assert.equal(result.stats.ATP, max);
}
console.log('PASS: complete stats, separate training inputs and grind range arithmetic');

const copy = json('i18n/improvements.json');
for (const [key, values] of Object.entries(copy)) assert(values.length === 5 && values.every(value => typeof value === 'string' && value.trim()), key);
for (const [i, lang] of ['en','ko','ja','es','fr'].entries()) {
  if (lang === 'en') continue;
  const built = json('.sites-static/i18n/' + lang + '.json');
  for (const [key, values] of Object.entries(copy)) assert.equal(built[key], values[i], key + '/' + lang);
}
const calc = fs.readFileSync('app/calculator/Calculator.tsx','utf8');
for (const [, key] of calc.matchAll(/t\(\s*"(calc\.[^"]+)"/g)) assert(copy[key], key + ' translation missing');
const nav = json('data/navigation.json');
const header = fs.readFileSync('header.html','utf8');
for (const group of nav) for (const link of group.links) {
  assert(header.includes('href="./'+link.href+'"'));
  assert(copy[link.key]);
  if (link.href.endsWith('.html')) assert(fs.existsSync(link.href));
}
for (const file of fs.readdirSync('.').filter(file => file.endsWith('.html'))) {
  const html = fs.readFileSync(file,'utf8');
  assert(!/maximum-scale\s*=\s*1|user-scalable\s*=\s*no/.test(html), file + ' blocks zoom');
}
const dmc = fs.readFileSync('dmc_page.html','utf8');
assert(!/<br[^>]*data-i18n/.test(dmc));
for (let n = 2; n <= 32; n++) assert(dmc.includes(`data-i18n="dmc.t${String(n).padStart(3,'0')}"`));
const builtCatalog = fs.readFileSync('.sites-static/item_page.html','utf8');
assert(builtCatalog.indexOf('scripts/verified-content.js') < builtCatalog.indexOf('scripts/destiny_catalog.js'));
const index = json('data/search-index.json');
assert(index.items.some(row => row[0] === 'MIRACLE CHAIN' && row[1] === 'item_page.html?item=miracle-chain'));
assert(index.pages.some(page => page.u.startsWith('recipe_page.html?target=phantasmal-ore')));
for (const query of ['Miracle Chain','미라클 체인']) assert.equal(searchIndex(index,query)[0]?.url, 'item_page.html?item=miracle-chain');
for (const file of ['start_here.html','starlight_raid.html','help_page.html']) assert(index.pages.some(page => page.u === file));
console.log('PASS: five languages, navigation parity, zoom, DMC content, catalog load order and new search entries');
