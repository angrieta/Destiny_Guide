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

const CLASSES: CalculatorPayload["classes"] = [
  { id: "humar", name: "HUmar", family: "HU" },
  { id: "hunewearl", name: "HUnewearl", family: "HU" },
  { id: "hucast", name: "HUcast", family: "HU" },
  { id: "hucaseal", name: "HUcaseal", family: "HU" },
  { id: "ramar", name: "RAmar", family: "RA" },
  { id: "ramarl", name: "RAmarl", family: "RA" },
  { id: "racast", name: "RAcast", family: "RA" },
  { id: "racaseal", name: "RAcaseal", family: "RA" },
  { id: "fomar", name: "FOmar", family: "FO" },
  { id: "fomarl", name: "FOmarl", family: "FO" },
  { id: "fonewm", name: "FOnewm", family: "FO" },
  { id: "fonewearl", name: "FOnewearl", family: "FO" },
];

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
    maxGrind: toNumber(row.Grind) ?? 0,
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
