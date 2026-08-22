import type { Equipment, MagStats, Modifiers, ResistKey, StatKey } from "./types";
import { RESIST_KEYS, STAT_KEYS } from "./types";

/**
 * What a mag hands the character per level, as documented on the Ephinea wiki:
 * DEF gives 1 DFP, POW gives 2 ATP, DEX gives 0.5 ATA, MIND gives 2 MST.
 * These are core mechanics rather than item tuning, so they hold on this server.
 */
export const MAG_RATES = { DEF: 1, POW: 2, DEX: 0.5, MIND: 2 } as const;

export const MAX_BUFF_LEVEL = 35;

/**
 * Shifta and Deband both grant `10 + 1.3 * (level - 1)` percent, the vanilla
 * progression (Lv1 10%, Lv30 47.7%) which this server kept while raising the cap
 * to 35. Measured on a FOmar at Lv35, where the formula gives 54.2%:
 *
 *   mag only    ATP 1350 -> 2081   (1350 * 1.542 = 2081.7)
 *               DFP  501 ->  772   ( 501 * 1.542 =  772.4)
 *   with gear   ATP 1730 -> 2461   (1350 * 1.542 = 2081, + 380 weapon)
 *               DFP  877 -> 1352   ( 877 * 1.542 = 1352.3)
 *
 * Deband scales the whole DFP including armour and shield. Shifta reaches the
 * character's ATP and the weapon's ATP range, but not the weapon's floor and not
 * the grind - the measured weapon was Celestial Fusion +30, a fixed 320-320, so
 * its range was 0 and it read as if untouched. That part is still unconfirmed on
 * this server; a variable-ATP weapon such as AGITO 200-500 would settle it.
 */
export function buffPercent(level: number) {
  if (level <= 0) return 0;
  return 10 + 1.3 * (level - 1);
}

const applyBuff = (value: number, percent: number) => Math.floor(value * (1 + percent / 100));

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
  /** The weapon's grind level. Null means "fully ground", which is what Total ATP assumes. */
  grind: number | null;
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
  /** Totals with Shifta and Deband applied. Null when neither is set. */
  buffed: {
    shifta: number;
    deband: number;
    shiftaPercent: number;
    debandPercent: number;
    ATP: number;
    DFP: number;
    /** The part of ATP Shifta acts on, i.e. everything but the weapon. */
    atpCharacter: number;
    atpWeapon: number;
    /** The scaled slice of the weapon: max minus min. */
    atpWeaponRange: number;
    grindBonus: number;
  } | null;
};

export type Buffs = { shifta: number; deband: number };

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
 * Zalure and Jellen are left out: they act on the target, so a character sheet
 * cannot measure them. Equipment-provided technique percentages are reported
 * separately rather than folded into a stat.
 */
export function computeTotals(
  base: BaseStats,
  loadout: Loadout,
  playerClass: string,
  level: number,
  mag?: MagStats,
  buffs?: Buffs,
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
    buffed: null,
  };
  let atpFromWeapon = 0;
  /** max - min of the weapon's ATP. Shifta scales this part, unlike the rest of the weapon. */
  let weaponRange = 0;
  let grindBonus = 0;

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
    const grind = loadout.grind === null ? weapon.maxGrind : Math.min(loadout.grind, weapon.maxGrind);
    grindBonus = Math.floor(weapon.grindPerLevel * grind);

    for (const [stat, value] of Object.entries(weapon.base)) {
      // Total ATP is the fully ground figure; rebuild it from the chosen grind.
      const amount =
        stat === "ATP" && weapon.atpMax !== null ? weapon.atpMax + grindBonus : value;
      totals.stats[stat as StatKey] += amount;
      stats[stat as StatKey] = amount;
      // Kept apart because Shifta treats the weapon differently from the character.
      if (stat === "ATP") atpFromWeapon += amount;
    }
    weaponRange = weapon.atpMax !== null && weapon.atpMin !== null ? weapon.atpMax - weapon.atpMin : 0;
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

  if (buffs && (buffs.shifta > 0 || buffs.deband > 0)) {
    const shiftaPercent = buffPercent(buffs.shifta);
    const debandPercent = buffPercent(buffs.deband);
    const atpCharacter = totals.stats.ATP - atpFromWeapon;
    // Shifta reaches the character's ATP and the weapon's ATP range, but not the
    // weapon's floor and not the grind. With a fixed-ATP weapon the range is 0,
    // which is why Celestial Fusion +30 measured as if the weapon were untouched.
    const weaponFloor = atpFromWeapon - weaponRange;
    totals.buffed = {
      shifta: buffs.shifta,
      deband: buffs.deband,
      shiftaPercent,
      debandPercent,
      atpCharacter,
      atpWeapon: atpFromWeapon,
      atpWeaponRange: weaponRange,
      grindBonus,
      ATP:
        applyBuff(atpCharacter, shiftaPercent) + weaponFloor + applyBuff(weaponRange, shiftaPercent),
      DFP: applyBuff(totals.stats.DFP, debandPercent),
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
