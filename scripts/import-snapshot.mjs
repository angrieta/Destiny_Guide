/**
 * Turns a snapshot collected in the browser into data/*.json.
 *
 *   node scripts/import-snapshot.mjs ~/Downloads/playpso-database-snapshot.json
 *   node scripts/import-snapshot.mjs ~/Downloads/playpso-drops-snapshot.json
 *
 * Accepts either collector output and applies the same validation the automated
 * sync would, so a bad capture is rejected instead of overwriting a good snapshot.
 */
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { homedir } from "node:os";
import { DATA_DIR, readJson, writeJsonIfChanged, writeSyncStatus } from "./lib/playpso.mjs";

const MIN_ROW_RETENTION = 0.8;
const DATABASE_CATEGORIES = new Map([
  [1, "Weapons"],
  [2, "Armor"],
  [3, "Shields"],
  [4, "Units"],
  [5, "Mags"],
]);
const DIFFICULTY_NAMES = ["Normal", "Hard", "Very Hard", "Ultimate"];
const EXPECTED_EPISODES = [1, 2, 4];

function validateCategory(payload, previous) {
  const problems = [];
  const rows = payload.rows ?? [];
  const fields = payload.fields ?? [];
  const expected = DATABASE_CATEGORIES.get(Number(payload.type));

  if (!expected) problems.push(`unknown category type ${payload.type}`);
  else if (expected !== payload.name) problems.push(`expected "${expected}" but got "${payload.name}"`);
  if (rows.length === 0) problems.push("zero rows");
  if (!fields.includes("Name")) problems.push("no Name column");

  const named = rows.filter((row) => (row.Name ?? "").trim().length > 0);
  if (rows.length > 0 && named.length / rows.length < 0.95) {
    problems.push(`only ${named.length}/${rows.length} rows carry a Name`);
  }

  if (previous) {
    const previousRows = previous.rows ?? [];
    if (previousRows.length > 0 && rows.length < previousRows.length * MIN_ROW_RETENTION) {
      problems.push(`row count collapsed from ${previousRows.length} to ${rows.length}`);
    }
    const lost = (previous.fields ?? []).filter((field) => !fields.includes(field));
    if (lost.length > 0) problems.push(`columns disappeared: ${lost.join(", ")}`);
  }

  return problems;
}

function validateDifficulty(payload, previous) {
  const problems = [];
  const episodes = payload.episodes ?? [];
  const expected = DIFFICULTY_NAMES[Number(payload.difficulty)];
  const rowCount = episodes.reduce((total, entry) => total + entry.rows.length, 0);

  if (!expected) problems.push(`unknown difficulty ${payload.difficulty}`);
  else if (expected !== payload.name) problems.push(`expected "${expected}" but got "${payload.name}"`);
  if (episodes.length === 0) problems.push("no episode tables");
  if (rowCount === 0) problems.push("no enemy rows");

  const missing = EXPECTED_EPISODES.filter((episode) => !episodes.some((entry) => entry.episode === episode));
  if (missing.length > 0) problems.push(`missing episode(s): ${missing.join(", ")}`);

  const allRows = episodes.flatMap((episode) => episode.rows);
  const named = allRows.filter(([enemy]) => String(enemy ?? "").trim().length > 0);
  if (rowCount > 0 && named.length / rowCount < 0.95) {
    problems.push(`only ${named.length}/${rowCount} rows carry an enemy name`);
  }
  const withDrops = allRows.filter(([, , drops]) =>
    (drops ?? []).some(([, item]) => item && item.toLowerCase() !== "no item"),
  );
  if (rowCount > 0 && withDrops.length === 0) problems.push("no row contains a real drop");

  if (previous) {
    const previousRows = (previous.episodes ?? []).reduce((total, entry) => total + entry.rows.length, 0);
    if (previousRows > 0 && rowCount < previousRows * MIN_ROW_RETENTION) {
      problems.push(`row count collapsed from ${previousRows} to ${rowCount}`);
    }
  }

  return problems;
}

function describeDiff(previousRows, nextRows) {
  if (!previousRows) return `${nextRows.length} rows (first snapshot)`;
  const key = (row) => JSON.stringify(row);
  const before = new Set(previousRows.map(key));
  const after = new Set(nextRows.map(key));
  const added = nextRows.filter((row) => !before.has(key(row))).length;
  const removed = previousRows.filter((row) => !after.has(key(row))).length;
  if (added === 0 && removed === 0) return "no changes";
  return `${added} added/changed, ${removed} removed`;
}

const defaultPath = resolve(homedir(), "Downloads", "playpso-database-snapshot.json");
const input = process.argv[2] ?? defaultPath;

let snapshot;
try {
  snapshot = JSON.parse(await readFile(input, "utf8"));
} catch (error) {
  console.error(`Could not read ${input}`);
  console.error(`  ${error.message}`);
  console.error("");
  console.error("Collect one first: open the PlayPSO page, press F12, and paste");
  console.error("scripts/collect-in-browser.js (or collect-drops-in-browser.js) into the Console.");
  process.exit(1);
}

const isDatabase = Array.isArray(snapshot.categories);
const isDrops = Array.isArray(snapshot.difficulties);
if (!isDatabase && !isDrops) {
  console.error("This file is not a Destiny Guide snapshot.");
  process.exit(1);
}

const payloads = isDatabase ? snapshot.categories : snapshot.difficulties;
const expectedCount = isDatabase ? DATABASE_CATEGORIES.size : DIFFICULTY_NAMES.length;
const label = isDatabase ? "item database" : "drop tables";

console.log(`Importing ${input}`);
if (snapshot.collectedAt) console.log(`Collected at ${snapshot.collectedAt}`);
console.log("");

const failures = [];
let changed = 0;
let itemCount = 0;

for (const payload of payloads) {
  const path = resolve(
    DATA_DIR,
    isDatabase ? `database-${Number(payload.type)}.json` : `drop-tables-${Number(payload.difficulty)}.json`,
  );
  const previous = await readJson(path);
  const problems = isDatabase ? validateCategory(payload, previous) : validateDifficulty(payload, previous);
  const name = payload.name ?? path;

  if (problems.length > 0) {
    failures.push(`${name}: ${problems.join("; ")}`);
    console.log(`  ${name}: REJECTED - ${problems.join("; ")}`);
    continue;
  }

  const rows = isDatabase
    ? payload.rows
    : payload.episodes.flatMap((episode) => episode.rows);
  itemCount += rows.length;

  const previousRows = previous
    ? isDatabase
      ? previous.rows
      : (previous.episodes ?? []).flatMap((episode) => episode.rows)
    : null;

  const diff = describeDiff(previousRows, rows);
  const didChange = await writeJsonIfChanged(path, { ...payload, syncedAt: new Date().toISOString() });
  if (didChange) changed += 1;
  console.log(`  ${name}: ${diff}`);
}

console.log("");

const statusFile = isDatabase ? "database-sync-status.json" : "drop-sync-status.json";

if (failures.length > 0) {
  await writeSyncStatus(statusFile, { status: "failed", changed: false, error: failures.join(" | ") });
  console.error("Import rejected for some parts. Those files were left untouched.");
  process.exit(1);
}

if (payloads.length < expectedCount) {
  console.log(`Note: only ${payloads.length} of ${expectedCount} parts were in this snapshot.`);
}

const extra = isDatabase
  ? { itemCount, changedCategories: changed, source: "https://playpso.net/database" }
  : { changedTables: changed, source: "https://playpso.net/drop-tables" };

const status = await writeSyncStatus(statusFile, { status: "success", changed: changed > 0, extra });

console.log(`Total rows: ${itemCount}`);
console.log(changed === 0 ? "Already current, nothing written." : `Updated ${changed} part(s).`);
console.log(`Status: lastCheckedAt=${status.lastCheckedAt} lastChangedAt=${status.lastChangedAt}`);
console.log("");
console.log(`Next: git add data && git commit -m "chore: sync PlayPSO ${label}" && git push`);
