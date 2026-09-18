// Explicit aliases only: variants such as GLIDE DIVINE X/S must stay separate.
const aliases = {
  gildedivine: 'glidedivine', gildedivinex: 'glidedivinex', gildedivines: 'glidedivines',
  combustioncanon: 'combustioncannon', crystalizedwings: 'crystallizedwings',
  illgillreaperigr: 'illgillreaper', yamigarisu: 'yamigarasu',
};
export function acquisitionKey(name) {
  const key = String(name ?? '').normalize('NFKD').toLowerCase().replace(/[^a-z0-9]/g, '');
  return aliases[key] || key;
}
export function isAcquisitionPlaceholder(text) {
  return /specific drop or crafting route is not listed|check the current destiny .*?(?:drop table|source)|item data imported from|supplied .*?(?:does not (?:include|list|provide)|do not .*provide)|create .*recipe shown/i.test(text);
}
export function groupDropRoutes(tables) {
  const items = {};
  for (const table of tables) for (const episode of table.episodes) {
    for (const [enemy, dar, cells] of episode.rows) for (const [section, name, rate] of cells) {
      // Null rates and zero DAR are not obtainable drops.
      if (!rate || dar <= 0 || name === 'No Item') continue;
      const key = acquisitionKey(name);
      const routes = items[key] ||= [];
      let route = routes.find(r => r.difficulty === table.difficulty && r.episode === episode.episode && r.enemy === enemy && r.rate === rate && r.dar === dar);
      if (!route) routes.push(route = {name, difficulty: table.difficulty, episode: episode.episode, enemy, dar, rate, sections: [], source: table.source, syncedAt: table.syncedAt});
      if (!route.sections.includes(section)) route.sections.push(section);
    }
  }
  for (const routes of Object.values(items)) routes.sort((a,b) => b.difficulty - a.difficulty || Number(a.rate.slice(2)) - Number(b.rate.slice(2)) || a.episode - b.episode || a.enemy.localeCompare(b.enemy));
  return items;
}
