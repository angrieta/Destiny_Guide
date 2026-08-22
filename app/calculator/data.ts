import weapons from "@/data/database-1.json";
import armor from "@/data/database-2.json";
import shields from "@/data/database-3.json";
import units from "@/data/database-4.json";
import modifierFile from "@/data/item-modifiers.json";
import type { CalculatorPayload, Equipment, Modifiers, ResistKey, Slot, StatKey } from "./types";
import { RESIST_KEYS } from "./types";

type Row = Record<string, string>;
type Source = { name: string; rows: Row[]; syncedAt: string };

/** Mags are excluded: their contribution comes from the level a player raised, not the type. */
const SOURCES: Array<{ source: Source; slot: Slot }> = [
  { source: weapons as Source, slot: "weapon" },
  { source: armor as Source, slot: "armor" },
  { source: shields as Source, slot: "shield" },
  { source: units as Source, slot: "unit" },
];

/**
 * Starting mag plans, taken from the `plan` field of each class in
 * scripts/class_builds.js (DEF/POW/DEX/MIND, always totalling 200). The first
 * variant of each class is used. Kept as literals because that file is a browser
 * script rather than a module; if the guide changes a plan, update it here too.
 */
const MAG_PLANS: Record<string, [number, number, number, number]> = {
  humar: [0, 129, 71, 0],
  hunewearl: [0, 137, 63, 0],
  hucast: [0, 115, 85, 0],
  hucaseal: [0, 133, 67, 0],
  ramar: [0, 142, 58, 0],
  ramarl: [0, 131, 69, 0],
  racast: [0, 130, 70, 0],
  racaseal: [5, 139, 56, 0],
  fomar: [5, 122, 73, 0],
  fomarl: [0, 129, 71, 0],
  fonewm: [0, 82, 94, 24],
  fonewearl: [0, 103, 97, 0],
};

const CLASS_LIST: Array<[string, string, "HU" | "RA" | "FO"]> = [
  ["humar", "HUmar", "HU"],
  ["hunewearl", "HUnewearl", "HU"],
  ["hucast", "HUcast", "HU"],
  ["hucaseal", "HUcaseal", "HU"],
  ["ramar", "RAmar", "RA"],
  ["ramarl", "RAmarl", "RA"],
  ["racast", "RAcast", "RA"],
  ["racaseal", "RAcaseal", "RA"],
  ["fomar", "FOmar", "FO"],
  ["fomarl", "FOmarl", "FO"],
  ["fonewm", "FOnewm", "FO"],
  ["fonewearl", "FOnewearl", "FO"],
];

const CLASSES: CalculatorPayload["classes"] = CLASS_LIST.map(([id, name, family]) => {
  const [DEF, POW, DEX, MIND] = MAG_PLANS[id];
  return { id, name, family, mag: { DEF, POW, DEX, MIND } };
});

const EMPTY_MODIFIERS: Modifiers = {
  flat: {},
  resist: {},
  tech: {},
  speed: {},
  cost: {},
  regen: {},
  flags: [],
};

const modifiers = (modifierFile as { items: Record<string, { modifiers: Modifiers }> }).items;

const normalize = (value: string) =>
  value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const slugify = (value: string) => normalize(value).replace(/\s+/g, "-");

function toNumber(value: string | undefined): number | null {
  if (!value) return null;
  const found = value.replace(/,/g, "").match(/-?\d+(\.\d+)?/g);
  if (!found) return null;
  const parsed = found.map(Number).filter(Number.isFinite);
  return parsed.length > 0 ? Math.max(...parsed) : null;
}

/** "ATP 950" gates equipping. Anything else in that column is not a numeric gate. */
function parseRequirement(text: string | null) {
  if (!text) return null;
  const match = text.match(/^(ATP|ATA|DFP|EVP|MST|LCK)\s+(\d+)$/i);
  if (!match) return null;
  return { stat: match[1].toUpperCase() as StatKey, value: Number(match[2]) };
}

function buildEquipment(row: Row, slot: Slot, categoryName: string, seen: Map<string, number>): Equipment {
  const name = (row.Name ?? "").trim();
  const baseSlug = slugify(name) || slot;
  const occurrence = (seen.get(baseSlug) ?? 0) + 1;
  seen.set(baseSlug, occurrence);

  const base: Partial<Record<StatKey, number>> = {};
  const resist: Partial<Record<ResistKey, number>> = {};

  if (slot === "weapon") {
    // Total ATP already folds in the grind the source recorded.
    const atp = toNumber(row["Total ATP"] ?? row.ATP);
    if (atp !== null) base.ATP = atp;
    const ata = toNumber(row.ATA);
    if (ata !== null) base.ATA = ata;
    const mst = toNumber(row.MST);
    if (mst !== null) base.MST = mst;
  } else if (slot === "armor" || slot === "shield") {
    const dfp = toNumber(row["max-DFP"]);
    if (dfp !== null) base.DFP = dfp;
    const evp = toNumber(row["max-EVP"]);
    if (evp !== null) base.EVP = evp;
    for (const key of RESIST_KEYS) {
      const value = toNumber(row[key]);
      if (value !== null && value !== 0) resist[key] = value;
    }
  }

  const atpRange = (row.ATP ?? "").match(/(\d+)\s*-\s*(\d+)/);
  const requiredText = row.Required && row.Required !== "-" ? row.Required : null;

  // Total ATP already assumes a fully ground weapon, so the grind bonus is the gap
  // between it and the un-ground maximum. Celestial Fusion reads 320-320 with
  // Grind +30 and Total 380, i.e. 2 ATP per grind.
  const maxGrind = toNumber(row.Grind) ?? 0;
  const ungroundMax = atpRange ? Number(atpRange[2]) : null;
  const totalAtp = toNumber(row["Total ATP"]);
  const grindPerLevel =
    maxGrind > 0 && ungroundMax !== null && totalAtp !== null ? (totalAtp - ungroundMax) / maxGrind : 0;

  return {
    id: occurrence === 1 ? baseSlug : `${baseSlug}-${occurrence}`,
    name,
    slot,
    kind: slot === "weapon" ? (row.Type ?? null) : slot === "unit" ? (row["Stat Type"] ?? null) : null,
    base,
    resist,
    modifiers: modifiers[`${categoryName}:${name}`]?.modifiers ?? EMPTY_MODIFIERS,
    classes: (row.Class ?? "")
      .split(",")
      .map((entry) => entry.trim())
      .filter(Boolean),
    requiredLevel: toNumber(row["Req Lv"]),
    requiredText,
    requirement: parseRequirement(requiredText),
    special: row.Special && row.Special !== "None" && row.Special !== "-" ? row.Special : null,
    targets: toNumber(row.Targets),
    range: toNumber(row.Range),
    maxGrind,
    grindPerLevel,
    atpMin: atpRange ? Number(atpRange[1]) : null,
    atpMax: atpRange ? Number(atpRange[2]) : null,
    searchText: `${normalize(name)} ${normalize(row.Type ?? "")} ${normalize(row.Special ?? "")}`.trim(),
  };
}

export function getCalculatorPayload(): CalculatorPayload {
  const equipment: Equipment[] = [];
  const seen = new Map<string, number>();

  for (const { source, slot } of SOURCES) {
    for (const row of source.rows) equipment.push(buildEquipment(row, slot, source.name, seen));
  }

  equipment.sort((a, b) => a.name.localeCompare(b.name));

  return {
    equipment,
    classes: CLASSES,
    weaponKinds: Array.from(
      new Set(equipment.filter((item) => item.slot === "weapon" && item.kind).map((item) => item.kind as string)),
    ).sort((a, b) => a.localeCompare(b)),
    syncedAt: (weapons as Source).syncedAt,
  };
}
