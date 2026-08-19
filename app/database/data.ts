import weapons from "@/data/database-1.json";
import armor from "@/data/database-2.json";
import shields from "@/data/database-3.json";
import units from "@/data/database-4.json";
import mags from "@/data/database-5.json";
import syncStatus from "@/data/database-sync-status.json";
import type { CategoryMeta, DatabaseItem, DatabasePayload, ItemCategory, StatEntry } from "./types";

type SourceCategory = {
  type: number;
  name: string;
  source: string;
  fields: string[];
  emptyFields: string[];
  rows: Array<Record<string, string>>;
  syncedAt: string;
};

const sources = [weapons, armor, shields, units, mags] as SourceCategory[];

/** Columns rendered by dedicated UI, so the generic stat list must not repeat them. */
const HANDLED_FIELDS = new Set(["Name", "Description", "Notes", "Class", "Boosts"]);

/** Headline stats per category, in the order they should appear on a result row. */
const PRIMARY_FIELDS: Record<ItemCategory, string[]> = {
  Weapons: ["ATP", "ATA", "Special"],
  Armor: ["max-DFP", "max-EVP", "Req Lv"],
  Shields: ["max-DFP", "max-EVP", "Req Lv"],
  Units: ["Stat Type", "Stat Amount"],
  Mags: ["100PB Trigger", "Activation Chance"],
};

const PRIMARY_LABELS: Record<string, string> = {
  "max-DFP": "DFP",
  "max-EVP": "EVP",
  "Req Lv": "Lv",
};

/**
 * Well-known community shorthand. PlayPSO stores only the full name, so these let
 * players search the way they actually talk. Add a line to extend it.
 */
const ALIASES: Array<[RegExp, string]> = [
  [/^s.?rank/i, "srank"],
  [/^dark flow$/i, "darkflow"],
  [/^dark meteor$/i, "darkmeteor"],
  [/^dark bridge$/i, "darkbridge"],
  [/^parasitic armor/i, "predator"],
];

const normalize = (value: string) =>
  value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const slugify = (value: string) => normalize(value).replace(/\s+/g, "-");

/**
 * A handful of PlayPSO descriptions start with a "CG" badge that sits inside the
 * description cell, so reading the cell text glues it onto the first word
 * ("CGSword eroded by..."). Strip it for display only; the JSON keeps the raw value.
 */
const cleanDescription = (value: string) => value.replace(/^CG(?=[A-Z])/, "").trim();

/** "640 - 750" and "+15" both need to become a sortable number. */
function toNumber(value: string | undefined): number | null {
  if (!value) return null;
  const match = value.replace(/,/g, "").match(/-?\d+(\.\d+)?/g);
  if (!match) return null;
  // Ranges show the ceiling, which is what players compare on.
  const parsed = match.map(Number).filter(Number.isFinite);
  if (parsed.length === 0) return null;
  return Math.max(...parsed);
}

function buildAliases(name: string) {
  const matched = ALIASES.filter(([pattern]) => pattern.test(name)).map(([, alias]) => alias);
  const initials = name
    .split(/\s+/)
    .filter((word) => word.length > 1)
    .map((word) => word[0])
    .join("");
  if (initials.length >= 2) matched.push(initials.toLowerCase());
  return matched.join(" ");
}

function buildItem(row: Record<string, string>, category: SourceCategory, seen: Map<string, number>): DatabaseItem {
  const name = (row.Name ?? "").trim();
  const categoryName = category.name as ItemCategory;

  const baseSlug = slugify(name) || `item-${category.type}`;
  const occurrence = (seen.get(baseSlug) ?? 0) + 1;
  seen.set(baseSlug, occurrence);
  const id = occurrence === 1 ? baseSlug : `${baseSlug}-${occurrence}`;

  const allStats: StatEntry[] = category.fields
    .filter((field) => !HANDLED_FIELDS.has(field) && !category.emptyFields.includes(field))
    .map((field) => ({ label: PRIMARY_LABELS[field] ?? field, value: row[field] ?? "" }))
    .filter((entry) => entry.value !== "");

  const primaryStats: StatEntry[] = (PRIMARY_FIELDS[categoryName] ?? [])
    .filter((field) => category.fields.includes(field))
    .map((field) => ({ label: PRIMARY_LABELS[field] ?? field, value: row[field] ?? "" }))
    .filter((entry) => entry.value !== "" && entry.value !== "-");

  const classes = (row.Class ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter(Boolean);

  const requiredText = row.Required && row.Required !== "-" ? row.Required : null;
  const special = row.Special && row.Special !== "None" && row.Special !== "-" ? row.Special : null;

  // PlayPSO lists one row per Section ID colour for anniversary gear, and the only
  // thing that separates them is the trailing "<name> version." in the description.
  const variant = cleanDescription(row.Description ?? "").match(/([A-Za-z0-9'! -]+?)\s+version\.?\s*$/)?.[1]?.trim() ?? null;

  return {
    id,
    name,
    category: categoryName,
    type: row.Type ?? null,
    variant,
    primaryStats,
    allStats,
    special,
    requiredLevel: toNumber(row["Req Lv"]),
    requiredText,
    classes,
    description: cleanDescription(row.Description ?? ""),
    notes: row.Notes ?? "",
    boosts: row.Boosts && row.Boosts !== "None" ? row.Boosts : "",
    atp: toNumber(row["Total ATP"] ?? row.ATP),
    ata: toNumber(row.ATA),
    mst: toNumber(row.MST),
    dfp: toNumber(row["max-DFP"]),
    evp: toNumber(row["max-EVP"]),
    statType: row["Stat Type"] ?? null,
    searchText: `${normalize(name)} ${buildAliases(name)} ${normalize(row.Type ?? "")} ${normalize(
      row.Special ?? "",
    )} ${normalize(row["Stat Type"] ?? "")} ${normalize(variant ?? "")}`.trim(),
  };
}

const sortUnique = (values: Array<string | null | undefined>) =>
  Array.from(new Set(values.filter((value): value is string => Boolean(value) && value !== "-" && value !== "None"))).sort(
    (a, b) => a.localeCompare(b),
  );

export function getDatabasePayload(): DatabasePayload {
  const seen = new Map<string, number>();
  const items: DatabaseItem[] = [];
  const categories: CategoryMeta[] = [];

  for (const category of sources) {
    for (const row of category.rows) items.push(buildItem(row, category, seen));
    categories.push({
      name: category.name as ItemCategory,
      type: category.type,
      count: category.rows.length,
      source: category.source,
      syncedAt: category.syncedAt,
    });
  }

  items.sort((a, b) => a.name.localeCompare(b.name));

  return {
    items,
    categories,
    weaponTypes: sortUnique(items.map((item) => item.type)),
    specials: sortUnique(items.map((item) => item.special)),
    unitStatTypes: sortUnique(items.filter((item) => item.category === "Units").map((item) => item.statType)),
    classes: sortUnique(items.flatMap((item) => item.classes)),
    syncStatus: syncStatus,
    sourceUrl: "https://playpso.net/database",
  };
}
