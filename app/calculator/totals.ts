import type { Equipment, MagStats, Modifiers, ResistKey, StatKey } from "./types";
import { RESIST_KEYS, STAT_KEYS } from "./types";

/**
 * What a mag hands the character per level, as documented on the Ephinea wiki:
 * DEF gives 1 DFP, POW gives 2 ATP, DEX gives 0.5 ATA, MIND gives 2 MST.
 * These are core mechanics rather than item tuning, so they hold on this server.
 */
export const MAG_RATES = { DEF: 1, POW: 2, DEX: 0.5, MIND: 2 } as const;

export function magContribution(mag: MagStats): Partial<Record<StatKey, number>> {
  const stats: Partial<Record<StatKey, number>> = {};
  if (mag.DEF) stats.DFP = mag.DEF * MAG_RATES.DEF;
  if (mag.POW) stats.ATP = mag.POW * MAG_RATES.POW;
  // Half a point per level, and the game does not hand out fractional ATA.
  if (mag.DEX) stats.ATA = Math.floor(mag.DEX * MAG_RATES.DEX);
  if (mag.MIND) stats.MST = mag.MIND * MAG_RATES.MIND;
  return stats;
}

export type Loadout = {
  weapon: Equipment | null;
  armor: Equipment | null;
  shield: Equipment | null;
  units: Array<Equipment | null>;
  /** Extra grind applied to the weapon on top of what the source recorded. */
  grind: number;
};

export type BaseStats = Partial<Record<StatKey, number>>;

export type Contribution = {
  label: string;
  slot: string;
  stats: Partial<Record<StatKey, number>>;
};

export type Warning = {
  item: string;
  reason: string;
};

export type Totals = {
  stats: Record<StatKey, number>;
  resists: Record<ResistKey, number>;
  contributions: Contribution[];
  /** Technique modifiers gathered from equipment, e.g. resta +300%. */
  tech: Record<string, { percent?: number; level?: number; power?: number }>;
  techLevel: number;
  speed: { attack: number; cast: number };
  tpCost: number;
  regen: Record<string, { amount: number; intervalSec: number }>;
  /** Effects present on the gear that are not part of any number above. */
  uncounted: Array<{ item: string; effect: string }>;
  warnings: Warning[];
  /** Weapon facts that matter for damage but are not stats. */
  weapon: { targets: number | null; range: number | null; special: string | null; atpMin: number | null; atpMax: number | null } | null;
};

const zeroStats = () => Object.fromEntries(STAT_KEYS.map((key) => [key, 0])) as Record<StatKey, number>;
const zeroResists = () => Object.fromEntries(RESIST_KEYS.map((key) => [key, 0])) as Record<ResistKey, number>;

function addModifiers(target: Totals, mods: Modifiers, label: string, into: Partial<Record<StatKey, number>>) {
  for (const [stat, value] of Object.entries(mods.flat)) {
    target.stats[stat as StatKey] += value;
    into[stat as StatKey] = (into[stat as StatKey] ?? 0) + value;
  }
  for (const [stat, value] of Object.entries(mods.resist)) {
    target.resists[stat as ResistKey] += value;
  }
  for (const [tech, mod] of Object.entries(mods.tech)) {
    target.tech[tech] = { ...(target.tech[tech] ?? {}) };
    if (mod.percent !== undefined) {
      target.tech[tech].percent = (target.tech[tech].percent ?? 0) + mod.percent;
    }
    if (mod.level !== undefined) target.tech[tech].level = (target.tech[tech].level ?? 0) + mod.level;
    if (mod.power !== undefined) target.tech[tech].power = (target.tech[tech].power ?? 0) + mod.power;
  }
  if (mods.speed.attack !== undefined) target.speed.attack += mods.speed.attack;
  if (mods.speed.cast !== undefined) target.speed.cast += mods.speed.cast;
  if (mods.cost.tp !== undefined) target.tpCost += mods.cost.tp;
  if (mods.techLevel !== undefined) target.techLevel += mods.techLevel;
  for (const [track, rate] of Object.entries(mods.regen)) {
    // Keeping the fastest track is the observable behaviour of stacking regen units.
    const current = target.regen[track];
    if (!current || rate.intervalSec / rate.amount < current.intervalSec / current.amount) {
      target.regen[track] = rate;
    }
  }
  for (const flag of mods.flags) target.uncounted.push({ item: label, effect: flag });
}

/**
 * Adds a loadout up.
 *
 * Deliberately excludes Shifta / Deband / Zalure multipliers: their scaling is
 * server-tuned and this server is heavily customised, so guessing them would
 * produce confident but wrong totals. Equipment-provided technique percentages
 * are reported separately instead of being folded into a stat.
 */
export function computeTotals(
  base: BaseStats,
  loadout: Loadout,
  playerClass: string,
  level: number,
  mag?: MagStats,
): Totals {
  const totals: Totals = {
    stats: zeroStats(),
    resists: zeroResists(),
    contributions: [],
    tech: {},
    techLevel: 0,
    speed: { attack: 0, cast: 0 },
    tpCost: 0,
    regen: {},
    uncounted: [],
    warnings: [],
    weapon: null,
  };

  for (const key of STAT_KEYS) totals.stats[key] += base[key] ?? 0;
  if (Object.values(base).some((value) => (value ?? 0) > 0)) {
    totals.contributions.push({ label: "Character", slot: "base", stats: { ...base } });
  }

  if (mag) {
    const fromMag = magContribution(mag);
    for (const [stat, value] of Object.entries(fromMag)) totals.stats[stat as StatKey] += value;
    if (Object.keys(fromMag).length > 0) {
      totals.contributions.push({ label: "Mag", slot: "mag", stats: fromMag });
    }
  }

  const pieces: Array<{ item: Equipment | null; slotLabel: string }> = [
    { item: loadout.armor, slotLabel: "armor" },
    { item: loadout.shield, slotLabel: "shield" },
    ...loadout.units.map((unit, index) => ({ item: unit, slotLabel: `unit ${index + 1}` })),
  ];

  // Gear other than the weapon is summed first: an "ATP 950" gate is checked
  // against the stats you have without that weapon on.
  for (const { item, slotLabel } of pieces) {
    if (!item) continue;
    const stats: Partial<Record<StatKey, number>> = {};
    for (const [stat, value] of Object.entries(item.base)) {
      totals.stats[stat as StatKey] += value;
      stats[stat as StatKey] = value;
    }
    for (const [stat, value] of Object.entries(item.resist)) totals.resists[stat as ResistKey] += value;
    addModifiers(totals, item.modifiers, item.name, stats);
    totals.contributions.push({ label: item.name, slot: slotLabel, stats });
    collectWarnings(totals, item, playerClass, level);
  }

  const weapon = loadout.weapon;
  if (weapon) {
    const stats: Partial<Record<StatKey, number>> = {};
    for (const [stat, value] of Object.entries(weapon.base)) {
      totals.stats[stat as StatKey] += value;
      stats[stat as StatKey] = value;
    }
    if (loadout.grind > 0) {
      totals.stats.ATP += loadout.grind;
      stats.ATP = (stats.ATP ?? 0) + loadout.grind;
    }
    addModifiers(totals, weapon.modifiers, weapon.name, stats);
    totals.contributions.push({ label: weapon.name, slot: "weapon", stats });
    collectWarnings(totals, weapon, playerClass, level);

    // Only meaningful once the player has told us their own stats. Warning that a
    // blank form "reaches 0" would just read as a bug.
    const hasBase = Object.values(base).some((value) => (value ?? 0) > 0);
    if (weapon.requirement && hasBase) {
      const available = totals.stats[weapon.requirement.stat] - (stats[weapon.requirement.stat] ?? 0);
      if (available < weapon.requirement.value) {
        totals.warnings.push({
          item: weapon.name,
          reason: `needs ${weapon.requirement.stat} ${weapon.requirement.value}, this loadout reaches ${available}`,
        });
      }
    }

    totals.weapon = {
      targets: weapon.targets,
      range: weapon.range,
      special: weapon.special,
      atpMin: weapon.atpMin === null ? null : weapon.atpMin + loadout.grind,
      atpMax: weapon.atpMax === null ? null : weapon.atpMax + loadout.grind,
    };
  }

  return totals;
}

function collectWarnings(totals: Totals, item: Equipment, playerClass: string, level: number) {
  if (item.classes.length > 0 && !item.classes.includes(playerClass)) {
    totals.warnings.push({ item: item.name, reason: `cannot be equipped by ${playerClass}` });
  }
  if (item.requiredLevel !== null && level > 0 && level < item.requiredLevel) {
    totals.warnings.push({ item: item.name, reason: `requires level ${item.requiredLevel}` });
  }
}
