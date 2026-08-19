export type ItemCategory = "Weapons" | "Armor" | "Shields" | "Units" | "Mags";

export type StatEntry = {
  label: string;
  value: string;
};

export type DatabaseItem = {
  /** Stable slug, unique across the whole database. Ready to become /database/<id>/ later. */
  id: string;
  name: string;
  category: ItemCategory;
  /** Weapon class such as Sword or Rifle. Null for categories without a type column. */
  type: string | null;
  /** Distinguishes same-name entries, e.g. the Section ID colour of an anniversary item. */
  variant: string | null;
  /** Headline stats shown on the result row, already ordered for display. */
  primaryStats: StatEntry[];
  /** Every PlayPSO column for this item, in source order, for the detail panel. */
  allStats: StatEntry[];
  special: string | null;
  requiredLevel: number | null;
  requiredText: string | null;
  classes: string[];
  description: string;
  notes: string;
  boosts: string;
  /** Parsed numbers used for sorting and range filters. Null when not applicable. */
  atp: number | null;
  ata: number | null;
  mst: number | null;
  dfp: number | null;
  evp: number | null;
  /** Unit stat channel, e.g. ATP or All Resistances. */
  statType: string | null;
  searchText: string;
};

export type CategoryMeta = {
  name: ItemCategory;
  type: number;
  count: number;
  source: string;
  syncedAt: string;
};

export type SyncStatus = {
  lastCheckedAt: string | null;
  lastChangedAt: string | null;
  status: string;
  itemCount?: number;
};

export type DatabasePayload = {
  items: DatabaseItem[];
  categories: CategoryMeta[];
  weaponTypes: string[];
  specials: string[];
  unitStatTypes: string[];
  classes: string[];
  syncStatus: SyncStatus;
  sourceUrl: string;
};
