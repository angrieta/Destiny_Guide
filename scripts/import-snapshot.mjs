/**
 * Turns a snapshot collected by scripts/collect-in-browser.js into data/database-*.json.
 *
 *   node scripts/import-snapshot.mjs ~/Downloads/playpso-database-snapshot.json
 *
 * Runs the same validation the automated sync would, so a bad capture is rejected
 * instead of overwriting a good snapshot.
 */
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { homedir } from "node:os";
import { DATA_DIR, readJson, writeJsonIfChanged, writeSyncStatus } from "./lib/playpso.mjs";

const MIN_ROW_RETENTION = 0.8;
const EXPECTED = new Map([
  [1, "Weapons"],
  [2, "Armor"],
  [3, "Shields"],
  [4, "Units"],
  [5, "Mags"],
]);

const input = process.argv[2] ?? resolve(homedir(), "Downloads", "playpso-database-snapshot.json");

function validate(payload, previous) {
  const problems = [];

  if (!EXPECTED.has(payload.type)) problems.push(`unknown category type ${payload.type}`);
  if (EXPECTED.get(payload.type) !== payload.name) {
    problems.push(`expected "${EXPECTED.get(payload.type)}" but got "${payload.name}"`);
  }
  if (!Array.isArray(payload.rows) || payload.rows.length === 0) problems.push("zero rows");
  if (!payload.fields?.includes("Name")) problems.push("no Name column");

  const named = (payload.rows ?? []).filter((row) => (row.Name ?? "").trim().length > 0);
  if (payload.rows?.length > 0 && named.length / payload.rows.length < 0.95) {
    problems.push(`only ${named.length}/${payload.rows.length} rows carry a Name`);
  }

  if (previous) {
    if (previous.rows.length > 0 && payload.rows.length < previous.rows.length * MIN_ROW_RETENTION) {
      problems.push(`row count collapsed from ${previous.rows.length} to ${payload.rows.length}`);
    }
    const lost = previous.fields.filter((field) => !payload.fields.includes(field));
    if (lost.length > 0) problems.push(`columns disappeared: ${lost.join(", ")}`);
  }

  return problems;
}

function describeDiff(previous, next) {
  if (!previous) return `${next.rows.length} items (first snapshot)`;
  const key = (row) => JSON.stringify(row);
  const before = new Set(previous.rows.map(key));
  const after = new Set(next.rows.map(key));
  const added = next.rows.filter((row) => !before.has(key(row))).length;
  const removed = previous.rows.filter((row) => !after.has(key(row))).length;
  if (added === 0 && removed === 0) return "no changes";
  return `${added} added/changed, ${removed} removed/changed`;
}

let snapshot;
try {
  snapshot = JSON.parse(await readFile(input, "utf8"));
} catch (error) {
  console.error(`Could not read ${input}`);
  console.error(`  ${error.message}`);
  console.error("");
  console.error("Collect one first: open https://www.playpso.net/database, press F12,");
  console.error("and paste the contents of scripts/collect-in-browser.js into the Console.");
  process.exit(1);
}

const categories = snapshot.categories ?? [];
if (categories.length === 0) {
  console.error("Snapshot contains no categories.");
  process.exit(1);
}

console.log(`Importing ${input}`);
if (snapshot.collectedAt) console.log(`Collected at ${snapshot.collectedAt}`);
console.log("");

const failures = [];
let changed = 0;
let itemCount = 0;

for (const payload of categories) {
  const path = resolve(DATA_DIR, `database-${payload.type}.json`);
  const previous = await readJson(path);
  const problems = validate(payload, previous);

  if (problems.length > 0) {
    failures.push(`${payload.name ?? payload.type}: ${problems.join("; ")}`);
    console.log(`  ${payload.name ?? payload.type}: REJECTED - ${problems.join("; ")}`);
    continue;
  }

  itemCount += payload.rows.length;
  const diff = describeDiff(previous, payload);
  const didChange = await writeJsonIfChanged(path, { ...payload, syncedAt: new Date().toISOString() });
  if (didChange) changed += 1;
  console.log(`  ${payload.name}: ${diff}`);
}

console.log("");

if (failures.length > 0) {
  await writeSyncStatus("database-sync-status.json", {
    status: "failed",
    changed: false,
    error: failures.join(" | "),
  });
  console.error("Import rejected for some categories. Those files were left untouched.");
  process.exit(1);
}

// Only complete snapshots should advance the "checked" stamp.
if (categories.length < EXPECTED.size) {
  console.log(`Note: only ${categories.length} of ${EXPECTED.size} categories were in this snapshot.`);
}

const status = await writeSyncStatus("database-sync-status.json", {
  status: "success",
  changed: changed > 0,
  extra: { itemCount, changedCategories: changed, source: "https://playpso.net/database" },
});

console.log(`Total items: ${itemCount}`);
console.log(changed === 0 ? "Already current, nothing written." : `Updated ${changed} categories.`);
console.log(`Status: lastCheckedAt=${status.lastCheckedAt} lastChangedAt=${status.lastChangedAt}`);
console.log("");
console.log("Next: git add data && git commit -m \"chore: sync PlayPSO item database\" && git push");
