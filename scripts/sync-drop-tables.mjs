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

const DIFFICULTY_NAMES = ["Normal", "Hard", "Very Hard", "Ultimate"];
const EXPECTED_EPISODES = [1, 2, 4];
const MIN_ROW_RETENTION = 0.8;

const readyPredicate = () =>
  document.title !== "Just a moment..." && document.querySelectorAll("table").length > 1;

async function extractDifficulty(page, difficulty) {
  const source = `https://playpso.net/drop-tables?diff=${difficulty}`;
  const label = `drop-tables-diff-${difficulty}`;

  await loadPage(page, source, { label, readyPredicate });

  const episodes = await page.evaluate(() => {
    const tables = Array.from(document.querySelectorAll("table")).filter((table) => {
      const firstRow = table.querySelector("tr");
      return firstRow && Array.from(firstRow.children).some((cell) => cell.textContent?.trim() === "Monster");
    });

    const parsed = tables.map((table) => {
      const heading = table.previousElementSibling?.textContent?.trim() ?? "";
      const episode = Number(heading.match(/Episode\s+(\d+)/i)?.[1] ?? 0);
      const rows = Array.from(table.querySelectorAll("tr"));
      const sectionIds = Array.from(rows[0].children)
        .slice(1)
        .map((cell) => cell.textContent?.trim() ?? "");

      return {
        episode,
        rows: rows.slice(1).map((row) => {
          const cells = Array.from(row.children).map((cell) =>
            cell.innerText.split("\n").map((part) => part.trim()).filter(Boolean),
          );
          const enemy = cells[0]?.[0] ?? "";
          const dar = Number(cells[0]?.find((part) => /^DAR:/i.test(part))?.match(/[\d.]+/)?.[0] ?? 0);
          const drops = cells.slice(1).map((parts, index) => {
            const rate = parts.find((part) => /^1\//.test(part)) ?? null;
            const item = parts.filter((part) => part !== rate).join(" ").trim() || "No Item";
            return [sectionIds[index] ?? "", item, rate];
          });
          return [enemy, dar, drops];
        }),
      };
    });

    return Array.from(new Map(parsed.map((episode) => [episode.episode, episode])).values());
  });

  return { source, difficulty, name: DIFFICULTY_NAMES[difficulty], episodes };
}

/**
 * Refuses to hand back a payload that would visibly damage the live site.
 * A half-rendered Cloudflare page parses into zero rows, and silently committing
 * that would blank out /drop-tables until someone noticed.
 */
function validate(table, previous) {
  const problems = [];
  const rowCount = table.episodes.reduce((total, episode) => total + episode.rows.length, 0);

  if (table.episodes.length === 0) problems.push("no episode tables were parsed");
  if (rowCount === 0) problems.push("no enemy rows were parsed");

  const missingEpisodes = EXPECTED_EPISODES.filter(
    (episode) => !table.episodes.some((entry) => entry.episode === episode),
  );
  if (missingEpisodes.length > 0) problems.push(`missing episode(s): ${missingEpisodes.join(", ")}`);

  const namedRows = table.episodes.flatMap((episode) => episode.rows).filter(([enemy]) => enemy.trim().length > 0);
  if (rowCount > 0 && namedRows.length / rowCount < 0.95) {
    problems.push(`only ${namedRows.length}/${rowCount} rows carry an enemy name`);
  }

  const withDrops = table.episodes
    .flatMap((episode) => episode.rows)
    .filter(([, , drops]) => drops.some(([, item]) => item && item.toLowerCase() !== "no item"));
  if (rowCount > 0 && withDrops.length === 0) problems.push("no row contains a single real drop");

  if (previous) {
    const previousRows = previous.episodes.reduce((total, episode) => total + episode.rows.length, 0);
    if (previousRows > 0 && rowCount < previousRows * MIN_ROW_RETENTION) {
      problems.push(`row count collapsed from ${previousRows} to ${rowCount}`);
    }
  }

  return { ok: problems.length === 0, problems, rowCount };
}

async function run() {
  await mkdir(DATA_DIR, { recursive: true });
  const browser = await launchBrowser(chromium);
  const summary = [];
  let changed = 0;

  try {
    const page = await createPage(browser);

    for (let difficulty = 0; difficulty < DIFFICULTY_NAMES.length; difficulty += 1) {
      const path = resolve(DATA_DIR, `drop-tables-${difficulty}.json`);
      const previous = await readJson(path);
      const table = await extractDifficulty(page, difficulty);
      const check = validate(table, previous);

      if (!check.ok) {
        const diagnostics = {
          label: table.name,
          reason: "VALIDATION_FAILED",
          requestedUrl: table.source,
          currentUrl: page.url(),
          httpStatus: null,
          documentTitle: await page.title().catch(() => "<unavailable>"),
          detectedTableCount: table.episodes.length,
          errorMessage: check.problems.join("; "),
          timestamp: new Date().toISOString(),
        };
        logDiagnostics(diagnostics);
        throw new SyncError(`${table.name}: validation failed`, diagnostics);
      }

      const didChange = await writeJsonIfChanged(path, { ...table, syncedAt: new Date().toISOString() });
      if (didChange) changed += 1;
      summary.push(`${table.name}: ${didChange ? "updated" : "no changes"} (${check.rowCount} rows)`);
    }
  } finally {
    await browser.close();
  }

  console.log("Drop tables checked successfully.");
  console.log("");
  for (const line of summary) console.log(`  ${line}`);
  console.log("");

  const status = await writeSyncStatus("drop-sync-status.json", {
    status: "success",
    changed: changed > 0,
    extra: { changedTables: changed, source: "https://playpso.net/drop-tables" },
  });
  console.log(changed === 0 ? "Drop tables are already current." : `Updated ${changed} drop table snapshot(s).`);
  console.log(`Status: lastCheckedAt=${status.lastCheckedAt} lastChangedAt=${status.lastChangedAt}`);
}

try {
  await run();
} catch (error) {
  const blocked = isExpectedBlock(error);
  await writeSyncStatus("drop-sync-status.json", {
    status: blocked ? "blocked" : "failed",
    changed: false,
    error: error instanceof SyncError ? `${error.diagnostics.reason}: ${error.message}` : error.message,
  });
  console.error(`\nDrop table sync failed: ${error.message}`);
  console.error("Existing drop table JSON was left untouched.");

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
