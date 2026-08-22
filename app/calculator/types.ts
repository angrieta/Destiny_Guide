export type Slot = "weapon" | "armor" | "shield" | "unit";

export const STAT_KEYS = ["ATP", "ATA", "DFP", "EVP", "MST", "LCK", "HP", "TP"] as const;
export type StatKey = (typeof STAT_KEYS)[number];

export const RESIST_KEYS = ["EFR", "ETH", "EIC", "EDK", "ELT"] as const;
export type ResistKey = (typeof RESIST_KEYS)[number];

export type TechModifier = {
  percent?: number;
  level?: number;
  power?: number;
};

export type Modifiers = {
  flat: Partial<Record<StatKey, number>>;
  resist: Partial<Record<ResistKey, number>>;
  tech: Record<string, TechModifier>;
  speed: { attack?: number; cast?: number };
  cost: { tp?: number };
  regen: Record<string, { amount: number; intervalSec: number }>;
  techLevel?: number;
  /** Effects the parser could not turn into numbers. Shown, never counted. */
  flags: string[];
};

export type Equipment = {
  id: string;
  name: string;
  slot: Slot;
  /** Weapon type such as Sword, or the unit stat channel. */
  kind: string | null;
  /** Stats the item itself provides, before any Boosts text. */
  base: Partial<Record<StatKey, number>>;
  resist: Partial<Record<ResistKey, number>>;
  modifiers: Modifiers;
  /** Classes able to equip this. Empty means unrestricted in the source data. */
  classes: string[];
  requiredLevel: number | null;
  /** Raw requirement text such as "ATP 950". */
  requiredText: string | null;
  requirement: { stat: StatKey; value: number } | null;
  special: string | null;
  /** Weapons only. */
  targets: number | null;
  range: number | null;
  maxGrind: number;
  atpMin: number | null;
  atpMax: number | null;
  searchText: string;
};

export type CalculatorPayload = {
  equipment: Equipment[];
  classes: Array<{ id: string; name: string; family: "HU" | "RA" | "FO" }>;
  weaponKinds: string[];
  syncedAt: string;
};
