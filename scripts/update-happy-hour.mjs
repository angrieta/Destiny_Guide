import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const DEFAULT_OUTPUT = "data/happy-hour.json";
const DURATION_MINUTES = 180;
const CYCLE_MINUTES = 930;

function readArguments(argv) {
  const options = {};
  for (let index = 0; index < argv.length; index += 1) {
    const argument = argv[index];
    if (!argument.startsWith("--")) continue;
    const key = argument.slice(2);
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) throw new Error(`Missing value for --${key}`);
    options[key] = value;
    index += 1;
  }
  return options;
}

function parseAnnouncementTime(value) {
  if (!value) throw new Error("--at is required (example: 2026-08-21 15:00)");
  const trimmed = value.trim();
  const kstDateTime = /^\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(?::\d{2})?$/;
  const normalized = kstDateTime.test(trimmed)
    ? `${trimmed.replace(" ", "T")}${trimmed.length === 16 ? ":00" : ""}+09:00`
    : trimmed;
  const timestamp = Date.parse(normalized);
  if (!Number.isFinite(timestamp)) throw new Error(`Invalid announcement time: ${value}`);
  return timestamp;
}

function parseRemainingMinutes(options) {
  if (options.remaining != null) return Number(options.remaining);
  if (!options.message) throw new Error("--message or --remaining is required");
  const match = options.message.match(/(\d+)\s*minutes?\s+remaining/i);
  if (!match) throw new Error("Could not find 'N minutes remaining' in the Discord message");
  return Number(match[1]);
}

const options = readArguments(process.argv.slice(2));
const observedAt = parseAnnouncementTime(options.at);
const remainingMinutes = parseRemainingMinutes(options);

if (!Number.isInteger(remainingMinutes) || remainingMinutes < 1 || remainingMinutes > DURATION_MINUTES) {
  throw new Error(`Remaining minutes must be between 1 and ${DURATION_MINUTES}`);
}

const windowEnd = observedAt + remainingMinutes * 60_000;
const windowStart = windowEnd - DURATION_MINUTES * 60_000;
const announcement = options.message || `Scheduled Happy Hours active! ${remainingMinutes} minutes remaining.`;
const payload = {
  schemaVersion: 1,
  source: "Destiny Discord app",
  announcement,
  observedAt: new Date(observedAt).toISOString(),
  remainingMinutes,
  windowStart: new Date(windowStart).toISOString(),
  windowEnd: new Date(windowEnd).toISOString(),
  cycleMinutes: CYCLE_MINUTES,
  durationMinutes: DURATION_MINUTES,
  updatedAt: new Date().toISOString()
};

const outputPath = resolve(process.cwd(), options.output || DEFAULT_OUTPUT);
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

console.log(`Happy Hour schedule updated: ${outputPath}`);
console.log(`Observed ${payload.observedAt}, window ${payload.windowStart} - ${payload.windowEnd}`);
