/**
 * Turns the free-text Boosts column into structured modifiers a calculator can add up.
 *
 *   node scripts/build-item-modifiers.mjs
 *
 * Reads data/database-1..5.json and writes data/item-modifiers.json.
 * Base stats are NOT copied here - they already live in the database files, and
 * duplicating them would let the two drift apart. This file only holds the
 * interpretation of text fields: Boosts, plus the Units Stat Type / Stat Amount pair.
 *
 * Every phrase it cannot interpret is listed under `unparsed`, so a new PlayPSO
 * boost wording shows up for review instead of being silently dropped.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";

const DATA_DIR = resolve(process.cwd(), "data");
const CATEGORIES = [
  { type: 1, name: "Weapons" },
  { type: 2, name: "Armor" },
  { type: 3, name: "Shields" },
  { type: 4, name: "Units" },
  { type: 5, name: "Mags" },
];

const FLAT_STATS = new Set(["ATP", "ATA", "DFP", "EVP", "MST", "HP", "TP", "LCK"]);
const RESISTS = ["EFR", "ETH", "EIC", "EDK", "ELT"];
/** "All Stats" in PSO covers the six character stats, not HP/TP. */
const ALL_STATS = ["ATP", "ATA", "DFP", "EVP", "MST", "LCK"];

const TECHS = [
  "foie", "gifoie", "rafoie",
  "barta", "gibarta", "rabarta",
  "zonde", "gizonde", "razonde",
  "grants", "megid", "resta", "deband", "shifta", "zalure", "jellen", "anti", "reverser",
];

const num = (sign, value) => (sign === "-" ? -Number(value) : Number(value));

/**
 * Interprets one phrase. Returns false when the phrase is not a computable
 * modifier, which sends it to the flags list and the review report.
 *
 * Patterns are anchored on purpose: "ATA +30 if used with Kusanagi" is
 * conditional, so it must not be mistaken for a flat "ATA +30".
 */
function applyPhrase(phrase, out) {
  let match;

  // ATP +100 / EVP -30 / ATA +1.5
  match = phrase.match(/^(ATP|ATA|DFP|EVP|MST|HP|TP|LCK|EFR|ETH|EIC|EDK|ELT)\s*([+-])\s*([\d.]+)$/i);
  if (match) {
    const stat = match[1].toUpperCase();
    const value = num(match[2], match[3]);
    if (FLAT_STATS.has(stat)) out.flat[stat] = (out.flat[stat] ?? 0) + value;
    else out.resist[stat] = (out.resist[stat] ?? 0) + value;
    return true;
  }

  // All Stats +20
  match = phrase.match(/^All Stats\s*([+-])\s*([\d.]+)$/i);
  if (match) {
    const value = num(match[1], match[2]);
    for (const stat of ALL_STATS) out.flat[stat] = (out.flat[stat] ?? 0) + value;
    return true;
  }

  // All Resistances +5
  match = phrase.match(/^All Resistances\s*([+-])\s*([\d.]+)$/i);
  if (match) {
    const value = num(match[1], match[2]);
    for (const stat of RESISTS) out.resist[stat] = (out.resist[stat] ?? 0) + value;
    return true;
  }

  // Resta +300% / Gifoie +60% / Zalure +100%
  match = phrase.match(/^([A-Za-z]+)\s*([+-])\s*([\d.]+)%$/);
  if (match && TECHS.includes(match[1].toLowerCase())) {
    const tech = match[1].toLowerCase();
    out.tech[tech] = { ...(out.tech[tech] ?? {}), percent: num(match[2], match[3]) };
    return true;
  }

  // Shifta and Deband lv +5
  match = phrase.match(/^([A-Za-z]+)(?:\s+and\s+([A-Za-z]+))?\s+lv\s*([+-])\s*([\d.]+)$/i);
  if (match) {
    const names = [match[1], match[2]].filter(Boolean).map((n) => n.toLowerCase());
    if (names.every((n) => TECHS.includes(n))) {
      const value = num(match[3], match[4]);
      for (const tech of names) out.tech[tech] = { ...(out.tech[tech] ?? {}), level: value };
      return true;
    }
  }

  // Resta Power +800
  match = phrase.match(/^([A-Za-z]+)\s+Power\s*([+-])\s*([\d.]+)$/i);
  if (match && TECHS.includes(match[1].toLowerCase())) {
    const tech = match[1].toLowerCase();
    out.tech[tech] = { ...(out.tech[tech] ?? {}), power: num(match[2], match[3]) };
    return true;
  }

  // Attack Speed +40% / Technique cast speed +30%
  match = phrase.match(/^Attack Speed\s*([+-])\s*([\d.]+)%$/i);
  if (match) {
    out.speed.attack = num(match[1], match[2]);
    return true;
  }
  match = phrase.match(/^Technique cast speed\s*([+-])\s*([\d.]+)%$/i);
  if (match) {
    out.speed.cast = num(match[1], match[2]);
    return true;
  }

  // TP Cost -50%
  match = phrase.match(/^TP Cost\s*([+-])\s*([\d.]+)%$/i);
  if (match) {
    out.cost.tp = num(match[1], match[2]);
    return true;
  }

  // All Offensive Techs +30%
  match = phrase.match(/^All Offensive Techs\s*([+-])\s*([\d.]+)%$/i);
  if (match) {
    out.tech.allOffensive = { percent: num(match[1], match[2]) };
    return true;
  }

  return false;
}

function emptyModifiers() {
  return { flat: {}, resist: {}, tech: {}, speed: {}, cost: {}, flags: [] };
}

function isEmpty(mods) {
  return (
    Object.keys(mods.flat).length === 0 &&
    Object.keys(mods.resist).length === 0 &&
    Object.keys(mods.tech).length === 0 &&
    Object.keys(mods.speed).length === 0 &&
    Object.keys(mods.cost).length === 0 &&
    mods.flags.length === 0
  );
}

const isBareTech = (phrase) => TECHS.includes(phrase.trim().toLowerCase());
const techPercent = (phrase) => phrase.match(/^([A-Za-z]+)\s*([+-])\s*([\d.]+)%$/);

/**
 * Reads one Boosts cell into `out`, returning the phrases it could not interpret.
 *
 * Two wordings need care:
 *  - "Gifoie, Gizonde, Gibarta +80%" gives all three the same 80%, so a bare
 *    technique name inherits the percentage of the next phrase that carries one.
 *  - "Increases stats, resistances, and cuts TP cost by 25%." is one sentence,
 *    not three effects, so prose is kept whole instead of being split on commas.
 */
function parseBoosts(raw, out) {
  const leftovers = [];

  for (const sentence of raw.split(/(?<=\.)\s+/)) {
    const trimmed = sentence.trim().replace(/\.$/, "").trim();
    if (!trimmed) continue;

    // Prose reads as one unit: "Increases stats, resistances, and cuts TP cost by 25%"
    // is a single sentence, not three effects. Detected by the leading verb rather
    // than by whether the commas parse, so a descriptive tail like
    // "MST +35, Megid Penetration" still yields its MST bonus.
    // "Grants" is deliberately absent - it is a technique name, not a verb here.
    if (/^(Increases|Decreases|Reduces|Cures|Exposes|Empowers|Boosts|Restores|Removes)\b/i.test(trimmed)) {
      if (!applyPhrase(trimmed, out)) leftovers.push(trimmed);
      continue;
    }

    const fragments = trimmed.split(",").map((part) => part.trim()).filter(Boolean);

    let pendingTechs = [];
    for (const fragment of fragments) {
      if (isBareTech(fragment)) {
        pendingTechs.push(fragment.toLowerCase());
        continue;
      }

      const shared = techPercent(fragment);
      if (shared && pendingTechs.length > 0 && TECHS.includes(shared[1].toLowerCase())) {
        const percent = num(shared[2], shared[3]);
        for (const tech of [...pendingTechs, shared[1].toLowerCase()]) {
          out.tech[tech] = { ...(out.tech[tech] ?? {}), percent };
        }
        pendingTechs = [];
        continue;
      }

      if (!applyPhrase(fragment, out)) leftovers.push(fragment);
    }

    // A bare technique with no percentage anywhere after it stays descriptive.
    leftovers.push(...pendingTechs);
  }

  return leftovers;
}

const unparsed = new Map();
const items = {};
const conflicts = [];
let withModifiers = 0;
let totalItems = 0;

for (const category of CATEGORIES) {
  const data = JSON.parse(readFileSync(resolve(DATA_DIR, `database-${category.type}.json`), "utf8"));

  for (const row of data.rows) {
    totalItems += 1;
    const mods = emptyModifiers();

    // Units carry their main effect in a dedicated pair of columns.
    if (category.name === "Units") {
      const statType = (row["Stat Type"] ?? "").trim();
      const amount = (row["Stat Amount"] ?? "").trim();
      if (statType && statType !== "N/A" && amount) {
        if (!applyPhrase(`${statType} ${amount}`, mods)) {
          // HP Regen, TP Regen, PB Regen, Technique Lv: real effects, but not a flat stat.
          mods.flags.push(`${statType} ${amount}`);
          const key = `${statType} <n>`;
          const entry = unparsed.get(key) ?? { phrase: key, count: 0, examples: [] };
          entry.count += 1;
          if (entry.examples.length < 3) entry.examples.push(row.Name);
          unparsed.set(key, entry);
        }
      }
    }

    const raw = (row.Boosts ?? "").trim();
    if (raw && raw !== "None") {
      for (const phrase of parseBoosts(raw, mods)) {
        mods.flags.push(phrase);
        const entry = unparsed.get(phrase) ?? { phrase, count: 0, examples: [] };
        entry.count += 1;
        if (entry.examples.length < 3) entry.examples.push(row.Name);
        unparsed.set(phrase, entry);
      }
    }

    if (isEmpty(mods)) continue;

    // Same name can repeat within a category (Section ID variants). They should
    // agree; if they do not, keep the first and record it for review.
    const key = `${category.name}:${row.Name}`;
    const serialised = JSON.stringify(mods);
    if (items[key]) {
      if (JSON.stringify(items[key].modifiers) !== serialised) {
        conflicts.push({ key, kept: items[key].modifiers, ignored: mods });
      }
      continue;
    }
    items[key] = { category: category.name, name: row.Name, modifiers: mods };
    withModifiers += 1;
  }
}

const unparsedList = [...unparsed.values()].sort((a, b) => b.count - a.count);

const payload = {
  version: 1,
  note:
    "Generated by scripts/build-item-modifiers.mjs from data/database-*.json. " +
    "Base stats stay in the database files; this holds only parsed text effects. " +
    "Phrases under `unparsed` are shown as flags and are not part of any total.",
  source: "data/database-1..5.json",
  summary: {
    itemsScanned: totalItems,
    itemsWithModifiers: withModifiers,
    unparsedPhrases: unparsedList.length,
    conflicts: conflicts.length,
  },
  items,
  unparsed: unparsedList,
  conflicts,
};

writeFileSync(resolve(DATA_DIR, "item-modifiers.json"), `${JSON.stringify(payload, null, 1)}\n`, "utf8");

console.log(`Scanned ${totalItems} items, ${withModifiers} carry modifiers.`);
console.log(`Wrote data/item-modifiers.json`);
console.log("");
console.log(`Phrases needing a decision: ${unparsedList.length}`);
for (const entry of unparsedList) {
  console.log(`  x${String(entry.count).padStart(3)}  ${entry.phrase}`);
  console.log(`         e.g. ${entry.examples.join(", ")}`);
}
if (conflicts.length > 0) {
  console.log("");
  console.log(`Same-name items with disagreeing boosts: ${conflicts.length}`);
  for (const c of conflicts) console.log(`  ${c.key}`);
}
