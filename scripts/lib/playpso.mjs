import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

export const PROJECT_ROOT = process.cwd();
export const DATA_DIR = resolve(PROJECT_ROOT, "data");
export const ARTIFACT_DIR = resolve(PROJECT_ROOT, "sync-artifacts");

/**
 * PlayPSO serves every route behind a Cloudflare managed challenge, so plain HTTP
 * requests (including /robots.txt and any /api path) answer 403 with `cf-mitigated: challenge`.
 * The only supported way in is a real browser that renders the page like any visitor.
 * We use Playwright's bundled Chromium in its regular (non "headless shell") mode, which is
 * a genuine Chrome build — no challenge solving, token forging, or fingerprint spoofing.
 */
export async function launchBrowser(chromium) {
  return chromium.launch({
    headless: true,
    channel: "chromium",
    args: ["--disable-blink-features=AutomationControlled"],
  });
}

export async function createPage(browser) {
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    locale: "en-US",
    timezoneId: "Asia/Seoul",
  });
  return context.newPage();
}

export class SyncError extends Error {
  constructor(message, diagnostics) {
    super(message);
    this.name = "SyncError";
    this.diagnostics = diagnostics;
  }
}

function classifyFailure({ status, title, tableCount, cause }) {
  if (status === 403 || /^just a moment/i.test(title ?? "")) return "CLOUDFLARE_CHALLENGE";
  if (status && status >= 500) return "UPSTREAM_SERVER_ERROR";
  if (status && status >= 400) return `HTTP_${status}`;
  if (cause && /timeout/i.test(cause)) return "TIMEOUT_WAITING_FOR_CONTENT";
  if (tableCount === 0) return "NO_TABLE_FOUND";
  if (cause && /net::|NS_ERROR|ECONN|ENOTFOUND|EAI_AGAIN/i.test(cause)) return "NETWORK_ERROR";
  return "UNEXPECTED_DOM_STRUCTURE";
}

/**
 * Navigates and waits for the page to settle past the Cloudflare interstitial.
 * On failure it captures every diagnostic PART 1.5 asks for and drops a screenshot
 * plus an HTML snapshot into sync-artifacts/ for the workflow to upload.
 */
export async function loadPage(page, url, { label, readyPredicate, timeout = 120_000 }) {
  let response = null;
  let cause = null;

  try {
    response = await page.goto(url, { waitUntil: "domcontentloaded", timeout });
    await page.waitForFunction(readyPredicate, undefined, { timeout });
    return response;
  } catch (error) {
    cause = error?.message ?? String(error);
  }

  const status = response?.status() ?? null;
  const title = await page.title().catch(() => "<unavailable>");
  const currentUrl = page.url();
  const tableCount = await page.evaluate(() => document.querySelectorAll("table").length).catch(() => -1);
  const reason = classifyFailure({ status, title, tableCount, cause });

  const diagnostics = {
    label,
    reason,
    requestedUrl: url,
    currentUrl,
    httpStatus: status,
    documentTitle: title,
    detectedTableCount: tableCount,
    errorMessage: cause,
    timestamp: new Date().toISOString(),
  };

  await captureFailureArtifacts(page, label, diagnostics);
  logDiagnostics(diagnostics);
  throw new SyncError(`${label}: ${reason}`, diagnostics);
}

async function captureFailureArtifacts(page, label, diagnostics) {
  const slug = label.replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  try {
    await mkdir(ARTIFACT_DIR, { recursive: true });
    await page.screenshot({ path: resolve(ARTIFACT_DIR, `${slug}.png`), fullPage: false }).catch(() => {});
    const html = await page.content().catch(() => "<unavailable>");
    await writeFile(resolve(ARTIFACT_DIR, `${slug}.html`), html, "utf8");
    await writeFile(resolve(ARTIFACT_DIR, `${slug}.json`), `${JSON.stringify(diagnostics, null, 2)}\n`, "utf8");
  } catch (error) {
    console.error(`  ! could not write failure artifacts: ${error.message}`);
  }
}

export function logDiagnostics(diagnostics) {
  console.error("");
  console.error(`::error title=PlayPSO sync failed (${diagnostics.reason})::${diagnostics.label}`);
  console.error("  ------------------------------------------------------------");
  console.error(`  Reason              : ${diagnostics.reason}`);
  console.error(`  Requested URL       : ${diagnostics.requestedUrl}`);
  console.error(`  Current URL         : ${diagnostics.currentUrl}`);
  console.error(`  HTTP Status         : ${diagnostics.httpStatus ?? "n/a"}`);
  console.error(`  document.title      : ${diagnostics.documentTitle}`);
  console.error(`  Detected table count: ${diagnostics.detectedTableCount}`);
  console.error(`  Error message       : ${diagnostics.errorMessage ?? "n/a"}`);
  console.error(`  Timestamp           : ${diagnostics.timestamp}`);
  console.error("  ------------------------------------------------------------");
}

/** Compares payloads while ignoring the volatile syncedAt stamp. */
export function isUnchanged(previous, next) {
  if (!previous) return false;
  const strip = (value) => JSON.stringify({ ...value, syncedAt: undefined });
  return strip(previous) === strip(next);
}

export async function readJson(path) {
  try {
    return JSON.parse(await readFile(path, "utf8"));
  } catch {
    return null;
  }
}

/** Writes the payload only when the meaningful content changed. */
export async function writeJsonIfChanged(path, next) {
  const previous = await readJson(path);
  if (isUnchanged(previous, next)) return false;
  await writeFile(path, `${JSON.stringify(next)}\n`, "utf8");
  return true;
}

const SEOUL_OFFSET_MINUTES = 9 * 60;

/** Formats an ISO instant as a KST timestamp, e.g. 2026-08-20T00:05:13+09:00. */
export function toSeoulIso(date = new Date()) {
  const shifted = new Date(date.getTime() + SEOUL_OFFSET_MINUTES * 60_000);
  return `${shifted.toISOString().slice(0, 19)}+09:00`;
}

/**
 * Maintains data/<name>-sync-status.json.
 * lastCheckedAt always advances on a successful check; lastChangedAt only moves
 * when PlayPSO's actual content changed, so a green run with no diff is still visible.
 */
export async function writeSyncStatus(fileName, { status, changed, extra = {}, error = null }) {
  const path = resolve(DATA_DIR, fileName);
  const previous = (await readJson(path)) ?? {};
  const now = toSeoulIso();

  const payload = {
    lastCheckedAt: status === "success" ? now : (previous.lastCheckedAt ?? null),
    lastChangedAt: changed ? now : (previous.lastChangedAt ?? null),
    status,
    ...extra,
  };
  if (status === "failed") {
    payload.lastFailedAt = now;
    payload.lastError = error ?? "unknown error";
  } else if (previous.lastFailedAt) {
    payload.lastFailedAt = previous.lastFailedAt;
  }

  await mkdir(DATA_DIR, { recursive: true });
  await writeFile(path, `${JSON.stringify(payload, null, 2)}\n`, "utf8");
  return payload;
}
