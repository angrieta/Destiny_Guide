import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import {
  DATA_DIR,
  SyncError,
  createPage,
  launchBrowser,
  loadPage,
  logDiagnostics,
  readJson,
  writeJsonIfChanged,
  writeSyncStatus,
} from "./lib/playpso.mjs";

/** PlayPSO category ids, taken straight from /database?type=N. */
const CATEGORIES = [
  { type: 1, name: "Weapons" },
  { type: 2, name: "Armor" },
  { type: 3, name: "Shields" },
  { type: 4, name: "Units" },
  { type: 5, name: "Mags" },
];

const MIN_ROW_RETENTION = 0.8;

const readyPredicate = () => {
  if (document.title === "Just a moment...") return false;
  const tables = Array.from(document.querySelectorAll("table"));
  return tables.some((table) => {
    const headings = Array.from(table.querySelectorAll("th")).map((cell) => cell.textContent?.trim());
    return headings.includes("Name") && table.querySelectorAll("tbody tr").length > 0;
  });
};

/**
 * Reads the category table generically instead of hard-coding columns, so a new
 * PlayPSO stat column shows up in our JSON rather than being silently dropped.
 * Grouped headers (DFP spanning min/max) collapse into `min-DFP` / `max-DFP`.
 */
function extractTable() {
  const table = Array.from(document.querySelectorAll("table")).find((candidate) => {
    const headings = Array.from(candidate.querySelectorAll("th")).map((cell) => cell.textContent?.trim());
    return headings.includes("Name") && candidate.querySelectorAll("tbody tr").length > 0;
  });
  if (!table) return { fields: [], rows: [] };

  const headerRows = Array.from(table.querySelectorAll("thead tr"));
  const bodyRows = Array.from(table.querySelectorAll("tbody tr"));
  const text = (cell) => (cell.textContent ?? "").replace(/\s+/g, " ").trim();

  // Resolve the header into one flat label per body column.
  let fields = [];
  if (headerRows.length >= 2) {
    const groups = Array.from(headerRows[0].children).map((cell) => ({
      label: text(cell),
      span: Number(cell.getAttribute("colspan") ?? 1),
      spansBothRows: Number(cell.getAttribute("rowspan") ?? 1) > 1,
    }));
    const subLabels = Array.from(headerRows[1].children).map(text);
    let subIndex = 0;
    for (const group of groups) {
      if (group.spansBothRows) {
        fields.push(group.label);
        continue;
      }
      for (let offset = 0; offset < group.span; offset += 1) {
        const sub = subLabels[subIndex++] ?? "";
        fields.push(sub ? `${sub}-${group.label}` : group.label);
      }
    }
  } else if (headerRows.length === 1) {
    fields = Array.from(headerRows[0].children).map(text);
  } else {
    const firstRow = table.querySelector("tr");
    fields = firstRow ? Array.from(firstRow.children).map(text) : [];
  }

  const rows = bodyRows
    .map((row) => {
      const cells = Array.from(row.children);
      if (cells.length === 0) return null;
      const record = {};
      fields.forEach((field, index) => {
        record[field] = cells[index] ? text(cells[index]) : "";
      });
      return record;
    })
    .filter((row) => row && Object.values(row).some((value) => value !== ""));

  return { fields, rows };
}

async function extractCategory(page, category) {
  const source = `https://playpso.net/database?type=${category.type}`;
  const label = `database-type-${category.type}`;

  await loadPage(page, source, { label, readyPredicate });

  // Some categories stream rows in; wait until the count stops growing.
  let stableFor = 0;
  let lastCount = -1;
  for (let attempt = 0; attempt < 20 && stableFor < 3; attempt += 1) {
    const count = await page.evaluate(() => document.querySelectorAll("tbody tr").length);
    stableFor = count === lastCount ? stableFor + 1 : 0;
    lastCount = count;
    await page.waitForTimeout(250);
  }

  const { fields, rows } = await page.evaluate(extractTable);
  const emptyFields = fields.filter((field) => rows.every((row) => (row[field] ?? "") === ""));

  return { type: category.type, name: category.name, source, fields, emptyFields, rows };
}

/**
 * PART 6 guard: never let a broken scrape overwrite a good snapshot.
 * A Cloudflare interstitial or a markup change parses into zero/garbage rows,
 * and committing that would empty the live /database page.
 */
function validate(payload, previous) {
  const problems = [];

  if (payload.rows.length === 0) problems.push("zero rows parsed");
  if (!payload.fields.includes("Name")) {
    problems.push(`no Name column (fields: ${payload.fields.join(", ") || "none"})`);
  }

  const named = payload.rows.filter((row) => (row.Name ?? "").trim().length > 0);
  if (payload.rows.length > 0 && named.length / payload.rows.length < 0.95) {
    problems.push(`only ${named.length}/${payload.rows.length} rows carry a Name`);
  }

  if (previous) {
    if (previous.rows.length > 0 && payload.rows.length < previous.rows.length * MIN_ROW_RETENTION) {
      problems.push(`row count collapsed from ${previous.rows.length} to ${payload.rows.length}`);
    }
    const lostFields = previous.fields.filter((field) => !payload.fields.includes(field));
    if (lostFields.length > 0) problems.push(`columns disappeared: ${lostFields.join(", ")}`);
  }

  return { ok: problems.length === 0, problems };
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

async function run() {
  await mkdir(DATA_DIR, { recursive: true });
  const browser = await launchBrowser(chromium);
  const summary = [];
  let changed = 0;
  let itemCount = 0;

  try {
    const page = await createPage(browser);

    for (const category of CATEGORIES) {
      const path = resolve(DATA_DIR, `database-${category.type}.json`);
      const previous = await readJson(path);
      const payload = await extractCategory(page, category);
      const check = validate(payload, previous);

      if (!check.ok) {
        const diagnostics = {
          label: category.name,
          reason: "VALIDATION_FAILED",
          requestedUrl: payload.source,
          currentUrl: page.url(),
          httpStatus: null,
          documentTitle: await page.title().catch(() => "<unavailable>"),
          detectedTableCount: await page
            .evaluate(() => document.querySelectorAll("table").length)
            .catch(() => -1),
          errorMessage: check.problems.join("; "),
          timestamp: new Date().toISOString(),
        };
        logDiagnostics(diagnostics);
        throw new SyncError(`${category.name}: validation failed`, diagnostics);
      }

      itemCount += payload.rows.length;
      const diff = describeDiff(previous, payload);
      const didChange = await writeJsonIfChanged(path, { ...payload, syncedAt: new Date().toISOString() });
      if (didChange) changed += 1;
      summary.push(`${category.name}: ${diff}`);
    }
  } finally {
    await browser.close();
  }

  console.log("Database checked successfully.");
  console.log("");
  for (const line of summary) console.log(`  ${line}`);
  console.log("");

  const status = await writeSyncStatus("database-sync-status.json", {
    status: "success",
    changed: changed > 0,
    extra: { itemCount, changedCategories: changed, source: "https://playpso.net/database" },
  });
  console.log(`Total items: ${itemCount}`);
  console.log(changed === 0 ? "Item database is already current." : `Updated ${changed} categories.`);
  console.log(`Status: lastCheckedAt=${status.lastCheckedAt} lastChangedAt=${status.lastChangedAt}`);
}

try {
  await run();
} catch (error) {
  await writeSyncStatus("database-sync-status.json", {
    status: "failed",
    changed: false,
    error: error instanceof SyncError ? `${error.diagnostics.reason}: ${error.message}` : error.message,
  });
  console.error(`\nItem database sync failed: ${error.message}`);
  console.error("Existing database JSON was left untouched.");
  process.exitCode = 1;
}
