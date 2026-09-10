import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { runInNewContext } from 'node:vm';

/** Read actual objects. Text slices can accidentally borrow the next item's recipe. */
export async function readDestinyCatalog(root = process.cwd()) {
  const source = await readFile(resolve(root, 'scripts/destiny_catalog.js'), 'utf8');
  const end = source.indexOf('const normalizeName');
  if (end < 0) throw new Error('Cannot locate catalog data boundary');
  const items = runInNewContext(source.slice(0, end) + '\nreturn catalogItems;\n})();', {}, { timeout: 1000 });
  if (!Array.isArray(items) || items.length < 50 || items.some(item => !item.id || !item.name)) throw new Error('Invalid catalog');
  const verified = JSON.parse(await readFile(resolve(root, 'data/verified-content.json'), 'utf8'));
  for (const patch of verified.items) {
    const found = items.find(item => item.id === patch.id);
    if (found) Object.assign(found, patch);
    else items.push(patch);
  }
  return items;
}
