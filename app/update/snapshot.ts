import type { FileChange, Json } from "./types";

/**
 * Client-side validation for snapshots collected in the browser.
 * Mirrors scripts/import-snapshot.mjs so the button and the CLI reject the same
 * bad captures - a half-loaded page must never reach the repository.
 */

export const MIN_ROW_RETENTION = 0.8;

export const DATABASE_CATEGORIES = new Map<number, string>([
  [1, "Weapons"],
  [2, "Armor"],
  [3, "Shields"],
  [4, "Units"],
  [5, "Mags"],
]);

export const DIFFICULTY_NAMES = ["Normal", "Hard", "Very Hard", "Ultimate"];
const EXPECTED_EPISODES = [1, 2, 4];

export type SnapshotKind = "database" | "drop-tables";

export type CategoryReview = {
  label: string;
  path: string;
  rowCount: number;
  summary: string;
  problems: string[];
  changed: boolean;
  content: string | null;
};

export type SnapshotReview = {
  kind: SnapshotKind;
  collectedAt: string | null;
  entries: CategoryReview[];
  itemCount: number;
  changedCount: number;
  problemCount: number;
};

const stringify = (value: unknown) => `${JSON.stringify(value)}\n`;

/** Compares payloads while ignoring the volatile syncedAt stamp. */
function isUnchanged(previous: Json | null, next: Json) {
  if (!previous) return false;
  const strip = (value: Json) => JSON.stringify({ ...value, syncedAt: undefined });
  return strip(previous) === strip(next);
}

function describeRowDiff(previousRows: unknown[] | undefined, nextRows: unknown[]) {
  if (!previousRows) return `${nextRows.length} rows (first snapshot)`;
  const key = (row: unknown) => JSON.stringify(row);
  const before = new Set(previousRows.map(key));
  const after = new Set(nextRows.map(key));
  const added = nextRows.filter((row) => !before.has(key(row))).length;
  const removed = previousRows.filter((row) => !after.has(key(row))).length;
  if (added === 0 && removed === 0) return "no changes";
  return `${added} added or changed, ${removed} removed`;
}

export function detectKind(snapshot: Json): SnapshotKind | null {
  if (Array.isArray(snapshot.categories)) return "database";
  if (Array.isArray(snapshot.difficulties)) return "drop-tables";
  return null;
}

function reviewDatabaseCategory(payload: Json, previous: Json | null): CategoryReview {
  const problems: string[] = [];
  const type = Number(payload.type);
  const name = String(payload.name ?? "");
  const fields = (payload.fields as string[]) ?? [];
  const rows = (payload.rows as Array<Record<string, string>>) ?? [];
  const expectedName = DATABASE_CATEGORIES.get(type);

  if (!expectedName) problems.push(`unknown category type ${payload.type}`);
  else if (expectedName !== name) problems.push(`expected "${expectedName}" but got "${name}"`);
  if (rows.length === 0) problems.push("zero rows");
  if (!fields.includes("Name")) problems.push("no Name column");

  const named = rows.filter((row) => (row.Name ?? "").trim().length > 0);
  if (rows.length > 0 && named.length / rows.length < 0.95) {
    problems.push(`only ${named.length}/${rows.length} rows carry a Name`);
  }

  if (previous) {
    const previousRows = (previous.rows as unknown[]) ?? [];
    const previousFields = (previous.fields as string[]) ?? [];
    if (previousRows.length > 0 && rows.length < previousRows.length * MIN_ROW_RETENTION) {
      problems.push(`row count collapsed from ${previousRows.length} to ${rows.length}`);
    }
    const lost = previousFields.filter((field) => !fields.includes(field));
    if (lost.length > 0) problems.push(`columns disappeared: ${lost.join(", ")}`);
  }

  const next = { ...payload, syncedAt: new Date().toISOString() } as Json;
  const changed = problems.length === 0 && !isUnchanged(previous, next);

  return {
    label: expectedName ?? name ?? `type ${payload.type}`,
    path: `data/database-${type}.json`,
    rowCount: rows.length,
    summary: problems.length > 0 ? "rejected" : describeRowDiff(previous?.rows as unknown[], rows),
    problems,
    changed,
    content: changed ? stringify(next) : null,
  };
}

function reviewDropTable(payload: Json, previous: Json | null): CategoryReview {
  const problems: string[] = [];
  const difficulty = Number(payload.difficulty);
  const name = String(payload.name ?? "");
  const episodes = (payload.episodes as Array<{ episode: number; rows: unknown[] }>) ?? [];
  const expectedName = DIFFICULTY_NAMES[difficulty];
  const rowCount = episodes.reduce((total, episode) => total + episode.rows.length, 0);

  if (!expectedName) problems.push(`unknown difficulty ${payload.difficulty}`);
  else if (expectedName !== name) problems.push(`expected "${expectedName}" but got "${name}"`);
  if (episodes.length === 0) problems.push("no episode tables");
  if (rowCount === 0) problems.push("no enemy rows");

  const missing = EXPECTED_EPISODES.filter((episode) => !episodes.some((entry) => entry.episode === episode));
  if (missing.length > 0) problems.push(`missing episode(s): ${missing.join(", ")}`);

  const allRows = episodes.flatMap((episode) => episode.rows) as Array<[string, number, unknown[]]>;
  const named = allRows.filter(([enemy]) => String(enemy ?? "").trim().length > 0);
  if (rowCount > 0 && named.length / rowCount < 0.95) {
    problems.push(`only ${named.length}/${rowCount} rows carry an enemy name`);
  }

  const withDrops = allRows.filter(([, , drops]) =>
    (drops as Array<[string, string, string | null]>).some(
      ([, item]) => item && item.toLowerCase() !== "no item",
    ),
  );
  if (rowCount > 0 && withDrops.length === 0) problems.push("no row contains a real drop");

  if (previous) {
    const previousEpisodes = (previous.episodes as Array<{ rows: unknown[] }>) ?? [];
    const previousRows = previousEpisodes.reduce((total, episode) => total + episode.rows.length, 0);
    if (previousRows > 0 && rowCount < previousRows * MIN_ROW_RETENTION) {
      problems.push(`row count collapsed from ${previousRows} to ${rowCount}`);
    }
  }

  const next = { ...payload, syncedAt: new Date().toISOString() } as Json;
  const changed = problems.length === 0 && !isUnchanged(previous, next);

  return {
    label: expectedName ?? name ?? `difficulty ${payload.difficulty}`,
    path: `data/drop-tables-${difficulty}.json`,
    rowCount,
    summary: problems.length > 0 ? "rejected" : changed ? "updated" : "no changes",
    problems,
    changed,
    content: changed ? stringify(next) : null,
  };
}

export function reviewSnapshot(
  snapshot: Json,
  current: Map<string, Json>,
): SnapshotReview {
  const kind = detectKind(snapshot);
  if (!kind) throw new Error("This file is not a Destiny Guide snapshot.");

  const payloads = (kind === "database" ? snapshot.categories : snapshot.difficulties) as Json[];
  if (!Array.isArray(payloads) || payloads.length === 0) {
    throw new Error("The snapshot contains no data.");
  }

  const entries = payloads.map((payload) => {
    const path =
      kind === "database"
        ? `data/database-${Number(payload.type)}.json`
        : `data/drop-tables-${Number(payload.difficulty)}.json`;
    const previous = current.get(path) ?? null;
    return kind === "database"
      ? reviewDatabaseCategory(payload, previous)
      : reviewDropTable(payload, previous);
  });

  return {
    kind,
    collectedAt: typeof snapshot.collectedAt === "string" ? snapshot.collectedAt : null,
    entries,
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

/** Builds the status file so a button-driven update leaves the same trail as the CLI. */
export function buildStatusFile(
  kind: SnapshotKind,
  review: SnapshotReview,
  previous: Json | null,
): FileChange {
  const now = toSeoulIso();
  const changed = review.changedCount > 0;

  const payload: Json = {
    lastCheckedAt: now,
    lastChangedAt: changed ? now : ((previous?.lastChangedAt as string) ?? null),
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
