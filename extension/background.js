import { fetchCurrentFiles, publishFiles, verifyToken } from "./lib/github.js";
import { buildStatusFile, reviewSnapshot, toSeoulIso } from "./lib/validate.js";

/**
 * The machine running this is often switched off, so a fixed daily time would
 * simply be missed. Sync when the browser starts instead, and treat the alarm as
 * a top-up for machines that stay on for days.
 */
const MIN_HOURS_BETWEEN_RUNS = 20;
const ALARM_NAME = "destiny-guide-sync";
const TAB_READY_TIMEOUT_MS = 90_000;

const DATASETS = [
  {
    kind: "database",
    url: "https://www.playpso.net/database",
    inject: "collect-database.js",
    paths: [1, 2, 3, 4, 5].map((type) => `data/database-${type}.json`),
    statusPath: "data/database-sync-status.json",
    label: "item database",
  },
  {
    kind: "drop-tables",
    url: "https://playpso.net/drop-tables",
    inject: "collect-drops.js",
    paths: [0, 1, 2, 3].map((difficulty) => `data/drop-tables-${difficulty}.json`),
    statusPath: "data/drop-sync-status.json",
    label: "drop tables",
  },
];

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function readSettings() {
  // sync storage rides along with the browser profile, so a reinstalled machine
  // gets its token back without the user digging it out again.
  const synced = await chrome.storage.sync.get(["token", "enabled"]);
  const local = await chrome.storage.local.get(["lastRunAt", "lastResult"]);
  return { token: synced.token ?? "", enabled: synced.enabled !== false, ...local };
}

async function setResult(result) {
  await chrome.storage.local.set({ lastRunAt: new Date().toISOString(), lastResult: result });
}

/** Opens PlayPSO in a background tab and waits for the real table to appear. */
async function collect(dataset) {
  const tab = await chrome.tabs.create({ url: dataset.url, active: false });
  try {
    const deadline = Date.now() + TAB_READY_TIMEOUT_MS;
    let lastState = "waiting";

    while (Date.now() < deadline) {
      await sleep(2000);
      let probe;
      try {
        [probe] = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => ({
            title: document.title,
            tables: document.querySelectorAll("table").length,
            rows: document.querySelectorAll("tbody tr, table tr").length,
          }),
        });
      } catch {
        continue; // The tab is still navigating.
      }

      const state = probe?.result;
      if (!state) continue;
      if (/just a moment|잠시만/i.test(state.title)) {
        lastState = "cloudflare challenge";
        continue;
      }
      if (state.tables > 0 && state.rows > 5) {
        const [injected] = await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: [dataset.inject],
        });
        return injected?.result ?? null;
      }
      lastState = `no table yet (tables=${state.tables})`;
    }

    throw new Error(`timed out: ${lastState}`);
  } finally {
    await chrome.tabs.remove(tab.id).catch(() => {});
  }
}

async function syncDataset(dataset, token) {
  const snapshot = await collect(dataset);
  if (!snapshot) throw new Error("nothing was collected");
  if (snapshot.failures?.length) console.warn(`${dataset.label}:`, snapshot.failures.join("; "));

  const current = await fetchCurrentFiles([...dataset.paths, dataset.statusPath]);
  const review = reviewSnapshot(snapshot, current);

  if (!review.complete) {
    throw new Error(`only ${review.entries.length}/${review.expectedCount} parts were readable`);
  }
  if (review.problemCount > 0) {
    const detail = review.entries
      .filter((entry) => entry.problems.length > 0)
      .map((entry) => `${entry.label}: ${entry.problems.join(", ")}`)
      .join(" | ");
    throw new Error(`validation failed, nothing published (${detail})`);
  }

  const files = review.entries
    .filter((entry) => entry.changed && entry.content)
    .map((entry) => ({ path: entry.path, content: entry.content }));
  files.push(buildStatusFile(dataset.kind, review, current.get(dataset.statusPath) ?? null));

  const message =
    review.changedCount > 0
      ? `chore: sync PlayPSO ${dataset.label}`
      : `chore: record ${dataset.label} check [skip deploy]`;

  const commit = await publishFiles(token, files, message);
  return { changed: review.changedCount, commit: commit.url };
}

let running = false;

export async function runSync(force = false) {
  if (running) return { skipped: "already running" };
  const { token, enabled, lastRunAt } = await readSettings();

  if (!force) {
    if (!enabled) return { skipped: "disabled" };
    if (lastRunAt) {
      const hours = (Date.now() - new Date(lastRunAt).getTime()) / 3_600_000;
      if (hours < MIN_HOURS_BETWEEN_RUNS) return { skipped: `checked ${hours.toFixed(1)}h ago` };
    }
  }
  if (!token) return { skipped: "no GitHub token saved" };

  running = true;
  const summary = { at: toSeoulIso(), datasets: {} };
  try {
    await verifyToken(token);
    for (const dataset of DATASETS) {
      try {
        const result = await syncDataset(dataset, token);
        summary.datasets[dataset.label] =
          result.changed > 0 ? `updated ${result.changed}` : "no changes";
      } catch (error) {
        summary.datasets[dataset.label] = `failed: ${error.message}`;
      }
    }
  } catch (error) {
    summary.error = error.message;
  } finally {
    running = false;
  }

  await setResult(summary);
  return summary;
}

chrome.runtime.onStartup.addListener(() => {
  // Give the network and any restored session cookies a moment to settle.
  setTimeout(() => runSync(), 30_000);
});

chrome.runtime.onInstalled.addListener(() => {
  chrome.alarms.create(ALARM_NAME, { periodInMinutes: 360 });
});

chrome.alarms.onAlarm.addListener((alarm) => {
  if (alarm.name === ALARM_NAME) runSync();
});

chrome.runtime.onMessage.addListener((message, _sender, sendResponse) => {
  if (message?.type === "run-now") {
    runSync(true).then(sendResponse);
    return true;
  }
  if (message?.type === "status") {
    readSettings().then(sendResponse);
    return true;
  }
  return false;
});
