import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";
import { resolve } from "node:path";
import {
  DATA_DIR,
  SyncError,
  createPage,
  isExpectedBlock,
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
  // Counts every row, not just tbody rows: PlayPSO writes bare <tr> without a tbody.
  return Array.from(document.querySelectorAll("table")).some((table) => {
    const headings = Array.from(table.rows[0]?.cells ?? []).map((cell) => cell.textContent?.trim());
    return headings.includes("Name") && table.rows.length > 1;
  });
};

/**
 * Runs inside the page, so every helper has to live in here: page.evaluate only
 * serialises this one function. Columns are read generically so a new PlayPSO
 * stat shows up in our JSON instead of being silently dropped.
 */
function extractTable() {
  const text = (cell) => (cell.textContent ?? "").replace(/\s+/g, " ").trim();

  /**
   * Reads the category table without assuming thead/tbody exist. PlayPSO renders
   * the drop tables as bare <tr> rows, so the database table may well do the same,
   * and a tbody-only selector silently finds nothing.
   */
  function parseTable(table) {
    const rows = Array.from(table.rows);
    if (rows.length === 0) return { fields: [], rows: [] };

    // Header rows are the leading rows made entirely of <th> cells.
    let headerCount = 0;
    while (headerCount < rows.length) {
      const cells = Array.from(rows[headerCount].cells);
      if (cells.length === 0 || !cells.every((cell) => cell.tagName === "TH")) break;
      headerCount += 1;
    }
    if (headerCount === 0) headerCount = 1; // No <th> at all: treat row 0 as the header.

    let fields = [];
    if (headerCount >= 2) {
      // Grouped header: "DFP" spanning min/max becomes min-DFP / max-DFP.
      const groups = Array.from(rows[0].cells).map((cell) => ({
        label: text(cell),
        span: cell.colSpan || 1,
        spansBothRows: (cell.rowSpan || 1) > 1,
      }));
      const subLabels = Array.from(rows[1].cells).map(text);
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
    } else {
      fields = Array.from(rows[0].cells).map(text);
    }

    const body = rows.slice(headerCount).map((row) => {
      const cells = Array.from(row.cells);
      if (cells.length === 0) return null;
      const record = {};
      fields.forEach((field, index) => {
        record[field] = cells[index] ? text(cells[index]) : "";
      });
      return record;
    });

    return { fields, rows: body.filter((row) => row && Object.values(row).some((value) => value !== "")) };
  }

  /** Picks the table whose header carries a Name column and has real data rows. */
  function parseDocument(doc) {
    const candidates = Array.from(doc.querySelectorAll("table"))
      .map(parseTable)
      .filter((parsed) => parsed.fields.includes("Name") && parsed.rows.length > 0);
    if (candidates.length === 0) return { fields: [], rows: [] };
    // The item table is the biggest one; anything else is navigation or a legend.
    return candidates.sort((a, b) => b.rows.length - a.rows.length)[0];
  }

  return parseDocument(document);
}

async function extractCategory(page, category) {
  const source = `https://playpso.net/database?type=${category.type}`;
  const label = `database-type-${category.type}`;

  await loadPage(page, source, { label, readyPredicate });

  // Some categories stream rows in; wait until the count stops growing.
  let stableFor = 0;
  let lastCount = -1;
  for (let attempt = 0; attempt < 20 && stableFor < 3; attempt += 1) {
    const count = await page.evaluate(() =>
      Array.from(document.querySelectorAll("table")).reduce((total, table) => total + table.rows.length, 0),
    );
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
  const blocked = isExpectedBlock(error);
  await writeSyncStatus("database-sync-status.json", {
    status: blocked ? "blocked" : "failed",
    changed: false,
    error: error instanceof SyncError ? `${error.diagnostics.reason}: ${error.message}` : error.message,
  });
  console.error(`\nItem database sync failed: ${error.message}`);
  console.error("Existing database JSON was left untouched.");

  if (blocked) {
    console.log("");
    console.log("::warning title=PlayPSO blocked the sync::Refresh manually with scripts/collect-in-browser.js");
    console.log("PlayPSO serves a Cloudflare challenge to automated browsers, so this is expected.");
    console.log("See docs/playpso-sync.md for the manual refresh steps.");
    process.exitCode = 0;
  } else {
    process.exitCode = 1;
  }
}
