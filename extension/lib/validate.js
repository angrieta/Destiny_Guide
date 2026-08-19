/**
 * Same rules as scripts/import-snapshot.mjs and app/update/snapshot.ts.
 * A partly loaded or challenged page parses into thin data, and committing that
 * would empty the live site, so anything suspicious is refused outright.
 */

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

const stringify = (value) => `${JSON.stringify(value)}\n`;

/** Sorts keys at every level so property order cannot masquerade as a change. */
function canonical(value) {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.keys(value)
        .sort()
        .map((key) => [key, canonical(value[key])]),
    );
  }
  return value;
}

function isUnchanged(previous, next) {
  if (!previous) return false;
  const strip = (value) => JSON.stringify(canonical({ ...value, syncedAt: undefined }));
  return strip(previous) === strip(next);
}

function describeRowDiff(previousRows, nextRows) {
  if (!previousRows) return `${nextRows.length} rows (first snapshot)`;
  const key = (row) => JSON.stringify(row);
  const before = new Set(previousRows.map(key));
  const after = new Set(nextRows.map(key));
  const added = nextRows.filter((row) => !before.has(key(row))).length;
  const removed = previousRows.filter((row) => !after.has(key(row))).length;
  if (added === 0 && removed === 0) return "no changes";
  return `${added} added or changed, ${removed} removed`;
}

function reviewCategory(payload, previous) {
  const problems = [];
  const type = Number(payload.type);
  const fields = payload.fields ?? [];
  const rows = payload.rows ?? [];
  const expected = DATABASE_CATEGORIES.get(type);

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

  const next = { ...payload, syncedAt: new Date().toISOString() };
  const changed = problems.length === 0 && !isUnchanged(previous, next);

  return {
    label: expected ?? String(payload.name ?? type),
    path: `data/database-${type}.json`,
    rowCount: rows.length,
    summary: problems.length > 0 ? "rejected" : describeRowDiff(previous?.rows, rows),
    problems,
    changed,
    content: changed ? stringify(next) : null,
  };
}

function reviewDifficulty(payload, previous) {
  const problems = [];
  const difficulty = Number(payload.difficulty);
  const episodes = payload.episodes ?? [];
  const expected = DIFFICULTY_NAMES[difficulty];
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

  const next = { ...payload, syncedAt: new Date().toISOString() };
  const changed = problems.length === 0 && !isUnchanged(previous, next);

  return {
    label: expected ?? String(payload.name ?? difficulty),
    path: `data/drop-tables-${difficulty}.json`,
    rowCount,
    summary: problems.length > 0 ? "rejected" : changed ? "updated" : "no changes",
    problems,
    changed,
    content: changed ? stringify(next) : null,
  };
}

export function reviewSnapshot(snapshot, current) {
  const isDatabase = snapshot.kind === "database";
  const payloads = isDatabase ? snapshot.categories : snapshot.difficulties;
  const expectedCount = isDatabase ? DATABASE_CATEGORIES.size : DIFFICULTY_NAMES.length;

  const entries = (payloads ?? []).map((payload) => {
    const path = isDatabase
      ? `data/database-${Number(payload.type)}.json`
      : `data/drop-tables-${Number(payload.difficulty)}.json`;
    const previous = current.get(path) ?? null;
    return isDatabase ? reviewCategory(payload, previous) : reviewDifficulty(payload, previous);
  });

  return {
    kind: snapshot.kind,
    entries,
    complete: entries.length === expectedCount,
    expectedCount,
    itemCount: entries.reduce((total, entry) => total + entry.rowCount, 0),
    changedCount: entries.filter((entry) => entry.changed).length,
    problemCount: entries.filter((entry) => entry.problems.length > 0).length,
  };
}

const SEOUL_OFFSET_MINUTES = 9 * 60;

export function toSeoulIso(date = new Date()) {
  const shifted = new Date(date.getTime() + SEOUL_OFFSET_MINUTES * 60_000);
  return `${shifted.toISOString().slice(0, 19)}+09:00`;
}

export function buildStatusFile(kind, review, previous) {
  const now = toSeoulIso();
  const changed = review.changedCount > 0;
  const payload = {
    lastCheckedAt: now,
    lastChangedAt: changed ? now : (previous?.lastChangedAt ?? null),
    status: "success",
  };

  if (kind === "database") {
    payload.itemCount = review.itemCount;
    payload.changedCategories = review.changedCount;
    payload.source = "https://playpso.net/database";
  } else {
    payload.changedTables = review.changedCount;
    payload.source = "https://playpso.net/drop-tables";
  }

  return {
    path: kind === "database" ? "data/database-sync-status.json" : "data/drop-sync-status.json",
    content: `${JSON.stringify(payload, null, 2)}\n`,
  };
}
