/**
 * What a Donation Token order costs, and whether staff will accept it.
 *
 * The arithmetic is written down in exactly one place - the worked example in
 * the staff guide - so this module is built to reproduce it:
 *
 *   Wep A 0/0/0/70   --> 100/0/0/0      (Attribute+30 and swap%) 10DTs
 *   Wep B 0/45/20/25 --> 0/0/100/100/80 (Attribute+110% hit+80%) 80DTs
 *   Wep C 90/0/0/0   --> 0/100/0/0      (Leftover+10% from wep B)
 *   Total Attribute:+150% | Total Hit:+80% | Total DTs:90
 *
 * Percentages come in blocks: thirty attribute or twenty hit for ten tokens.
 * A block does not have to land on one weapon. Wep B needs 110, which is four
 * blocks and therefore 120 bought, so ten percent is spare and Wep C takes it
 * for nothing. Walking the order in sequence and carrying that remainder
 * forward is what planOrder does, and it lands on the guide's 90 tokens.
 *
 * Carrying the remainder in full means the sequential total always equals
 * ceil(total percentage / block size), so the summary can show either view
 * without them disagreeing.
 */

export const ATTR_KEYS = ["native", "abeast", "machine", "dark"] as const;
export type AttrKey = (typeof ATTR_KEYS)[number];

export const PERCENT_KEYS = ["native", "abeast", "machine", "dark", "hit"] as const;
export type PercentKey = (typeof PERCENT_KEYS)[number];
export type Percents = Record<PercentKey, number>;

export const PERCENT_LABELS: Record<PercentKey, string> = {
  native: "Native",
  abeast: "A.Beast",
  machine: "Machine",
  dark: "Dark",
  hit: "Hit",
};

/** Captions over the boxes. Five full names do not fit a phone-width row. */
export const PERCENT_SHORT: Record<PercentKey, string> = {
  native: "Nat",
  abeast: "A.B",
  machine: "Mac",
  dark: "Dark",
  hit: "Hit",
};

export const ATTRIBUTE_BLOCK = 30;
export const HIT_BLOCK = 20;
export const BLOCK_TOKENS = 10;
/** Waived when the same weapon also gains percentage, per the donation list. */
export const SWAP_TOKENS = 5;
export const MAX_ATTRIBUTE = 100;
/** Crates roll higher, but redeeming tops out here. */
export const MAX_HIT = 80;
/** A weapon carries three percentages, whichever types they happen to be. */
export const MAX_SLOTS = 3;

export function emptyPercents(): Percents {
  return { native: 0, abeast: 0, machine: 0, dark: 0, hit: 0 };
}

export function attributeSum(percents: Percents) {
  return ATTR_KEYS.reduce((sum, key) => sum + percents[key], 0);
}

export function slotCount(percents: Percents) {
  return PERCENT_KEYS.filter((key) => percents[key] !== 0).length;
}

export function samePercents(a: Percents, b: Percents) {
  return PERCENT_KEYS.every((key) => a[key] === b[key]);
}

export function isBlank(percents: Percents) {
  return PERCENT_KEYS.every((key) => percents[key] === 0);
}

/**
 * Reads the notation players actually type. Four numbers are the attributes
 * with no hit; five put hit last. The staff guide itself mixes both, so a
 * pasted line has to be accepted either way.
 */
export function parsePercents(text: string): Percents | null {
  const parts = text.split(/[^\d-]+/).filter((part) => part !== "" && part !== "-");
  if (parts.length !== 4 && parts.length !== 5) return null;
  const numbers = parts.map(Number);
  if (numbers.some((value) => !Number.isFinite(value))) return null;
  return {
    native: numbers[0],
    abeast: numbers[1],
    machine: numbers[2],
    dark: numbers[3],
    hit: numbers[4] ?? 0,
  };
}

/** Hit is written only when it is there, which is how the guide writes it. */
export function formatPercents(percents: Percents) {
  const attributes = ATTR_KEYS.map((key) => percents[key]);
  return percents.hit !== 0 ? [...attributes, percents.hit].join("/") : attributes.join("/");
}

export type OrderRow = {
  id: string;
  name: string;
  before: Percents;
  after: Percents;
};

export type Issue = { level: "error" | "warning"; message: string };

export type RowPlan = {
  row: OrderRow;
  index: number;
  /** Fallback name used in the order text when the weapon is left unnamed. */
  label: string;
  display: string;
  changed: boolean;
  attributeBefore: number;
  attributeAfter: number;
  attributeAdded: number;
  attributeDeleted: number;
  hitAdded: number;
  hitDeleted: number;
  /** A percentage moved between types rather than only growing in place. */
  moved: boolean;
  swapOnly: boolean;
  slots: number;
  attributeBlocks: number;
  hitBlocks: number;
  attributeFromLeftover: number;
  hitFromLeftover: number;
  leftoverFrom: string | null;
  tokens: number;
  annotation: string;
  issues: Issue[];
};

export type OrderPlan = {
  rows: RowPlan[];
  changedRows: RowPlan[];
  attributeAdded: number;
  hitAdded: number;
  attributeBlocks: number;
  hitBlocks: number;
  attributeBought: number;
  hitBought: number;
  swapTokens: number;
  tokens: number;
  leftoverAttribute: number;
  leftoverHit: number;
  errorCount: number;
  warningCount: number;
};

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

export function rowLabel(index: number) {
  return index < LETTERS.length ? `Wep ${LETTERS[index]}` : `Wep ${index + 1}`;
}

export function planOrder(rows: OrderRow[]): OrderPlan {
  /** Percentage bought but not yet placed. Deleted percentage never lands here. */
  let attributePool = 0;
  let hitPool = 0;
  let attributePoolFrom: string | null = null;
  let hitPoolFrom: string | null = null;

  const plans: RowPlan[] = rows.map((row, index) => {
    const label = rowLabel(index);
    const display = row.name.trim() || label;
    const attributeBefore = attributeSum(row.before);
    const attributeAfter = attributeSum(row.after);
    const attributeAdded = Math.max(0, attributeAfter - attributeBefore);
    const attributeDeleted = Math.max(0, attributeBefore - attributeAfter);
    const hitAdded = Math.max(0, row.after.hit - row.before.hit);
    const hitDeleted = Math.max(0, row.before.hit - row.after.hit);
    const changed = !samePercents(row.before, row.after);
    const slots = slotCount(row.after);

    // A slot losing percentage while the total holds is a swap. When the total
    // drops it is a deletion instead, which reads differently to staff.
    const moved = attributeDeleted === 0 && ATTR_KEYS.some((key) => row.after[key] < row.before[key]);
    const swapOnly =
      changed && attributeAdded === 0 && hitAdded === 0 && attributeDeleted === 0 && hitDeleted === 0;

    const attributeFromLeftover = Math.min(attributePool, attributeAdded);
    const attributeOwed = attributeAdded - attributeFromLeftover;
    const attributeBlocks = Math.ceil(attributeOwed / ATTRIBUTE_BLOCK);
    const attributeLeftoverFrom = attributeFromLeftover > 0 ? attributePoolFrom : null;
    attributePool = attributePool - attributeFromLeftover + attributeBlocks * ATTRIBUTE_BLOCK - attributeOwed;
    if (attributeBlocks > 0) attributePoolFrom = display;

    const hitFromLeftover = Math.min(hitPool, hitAdded);
    const hitOwed = hitAdded - hitFromLeftover;
    const hitBlocks = Math.ceil(hitOwed / HIT_BLOCK);
    const hitLeftoverFrom = hitFromLeftover > 0 ? hitPoolFrom : null;
    hitPool = hitPool - hitFromLeftover + hitBlocks * HIT_BLOCK - hitOwed;
    if (hitBlocks > 0) hitPoolFrom = display;

    const tokens =
      (attributeBlocks + hitBlocks) * BLOCK_TOKENS + (swapOnly ? SWAP_TOKENS : 0);

    const issues: Issue[] = [];
    if (PERCENT_KEYS.some((key) => row.after[key] < 0 || row.before[key] < 0)) {
      issues.push({ level: "error", message: "negative" });
    }
    if (slots > MAX_SLOTS) {
      issues.push({ level: "error", message: "slots" });
    }
    if (ATTR_KEYS.some((key) => row.after[key] > MAX_ATTRIBUTE)) {
      issues.push({ level: "error", message: "attributeCap" });
    }
    if (row.after.hit > MAX_HIT) {
      issues.push({ level: "error", message: "hitCap" });
    }
    // The two conversions the guide rules out outright.
    if (hitDeleted > 0 && attributeAdded > 0) {
      issues.push({ level: "error", message: "hitToAttribute" });
    }
    if (attributeDeleted > 0 && hitAdded > 0) {
      issues.push({ level: "warning", message: "deleteForHit" });
    } else if (attributeDeleted > 0) {
      issues.push({ level: "warning", message: "deleteAttribute" });
    }
    if (hitDeleted > 0 && attributeAdded === 0) {
      issues.push({ level: "warning", message: "deleteHit" });
    }

    const gains: string[] = [];
    if (attributeAdded > 0) gains.push(`Attribute+${attributeAdded}%`);
    if (hitAdded > 0) gains.push(`hit+${hitAdded}%`);
    // A row that only rearranges is the swap on its own, so saying it twice
    // reads like two separate services and invites a wrong quote.
    if (swapOnly) gains.push("swap% only");
    else if (moved) gains.push("and swap%");

    const notes: string[] = [];
    if (attributeFromLeftover > 0) {
      notes.push(`Leftover+${attributeFromLeftover}% from ${attributeLeftoverFrom ?? "previous weapon"}`);
    }
    if (hitFromLeftover > 0) {
      notes.push(`Leftover hit+${hitFromLeftover}% from ${hitLeftoverFrom ?? "previous weapon"}`);
    }
    if (attributeDeleted > 0) notes.push(`delete ${attributeDeleted}% attribute`);
    if (hitDeleted > 0) notes.push(`delete ${hitDeleted}% hit`);

    const annotation = [gains.join(" "), ...notes].filter(Boolean).join(", ");

    return {
      row,
      index,
      label,
      display,
      changed,
      attributeBefore,
      attributeAfter,
      attributeAdded,
      attributeDeleted,
      hitAdded,
      hitDeleted,
      moved,
      swapOnly,
      slots,
      attributeBlocks,
      hitBlocks,
      attributeFromLeftover,
      hitFromLeftover,
      leftoverFrom: attributeLeftoverFrom ?? hitLeftoverFrom,
      tokens,
      annotation,
      issues,
    };
  });

  const changedRows = plans.filter((plan) => plan.changed);
  const attributeBlocks = plans.reduce((sum, plan) => sum + plan.attributeBlocks, 0);
  const hitBlocks = plans.reduce((sum, plan) => sum + plan.hitBlocks, 0);
  const swapTokens = plans.reduce((sum, plan) => sum + (plan.swapOnly ? SWAP_TOKENS : 0), 0);

  return {
    rows: plans,
    changedRows,
    attributeAdded: plans.reduce((sum, plan) => sum + plan.attributeAdded, 0),
    hitAdded: plans.reduce((sum, plan) => sum + plan.hitAdded, 0),
    attributeBlocks,
    hitBlocks,
    attributeBought: attributeBlocks * ATTRIBUTE_BLOCK,
    hitBought: hitBlocks * HIT_BLOCK,
    swapTokens,
    tokens: (attributeBlocks + hitBlocks) * BLOCK_TOKENS + swapTokens,
    leftoverAttribute: attributePool,
    leftoverHit: hitPool,
    errorCount: plans.reduce(
      (sum, plan) => sum + plan.issues.filter((issue) => issue.level === "error").length,
      0,
    ),
    warningCount: plans.reduce(
      (sum, plan) => sum + plan.issues.filter((issue) => issue.level === "warning").length,
      0,
    ),
  };
}

/**
 * The order text in the format staff ask for. The total line is only added for
 * three weapons or more, which is where the guide says it becomes required.
 */
export function buildMessage(plan: OrderPlan, guildCard: string) {
  const lines = plan.changedRows.map((row) => {
    const cost = row.tokens > 0 ? ` ${row.tokens}DTs` : "";
    const note = row.annotation ? ` (${row.annotation})` : "";
    return `${row.display} ${formatPercents(row.row.before)} --> ${formatPercents(row.row.after)}${note}${cost}`;
  });

  if (plan.changedRows.length >= 3) {
    lines.push(
      `Total Attribute:+${plan.attributeAdded}% | Total Hit:+${plan.hitAdded}% | Total DTs:${plan.tokens}`,
    );
  }

  const card = guildCard.trim();
  if (card) lines.push(`GC:${card}`);

  return ["```diff", lines.join("\n\n"), "```"].join("\n");
}

export type LeftoverTarget = { index: number; display: string; key: PercentKey; room: number };

/**
 * Where spare percentage could go without breaking a rule. Prefers a type the
 * weapon already carries so the suggestion does not eat a fresh slot, and skips
 * rows the player has not touched - offering those would invent a weapon.
 */
export function leftoverTargets(plan: OrderPlan, leftover: number, kind: "attribute" | "hit") {
  if (leftover <= 0) return [];
  const targets: LeftoverTarget[] = [];

  for (const row of plan.rows) {
    if (!row.row.name.trim() && isBlank(row.row.before) && isBlank(row.row.after)) continue;
    const after = row.row.after;
    const occupied = slotCount(after);

    let key: PercentKey | undefined;
    let cap = MAX_ATTRIBUTE;
    if (kind === "hit") {
      cap = MAX_HIT;
      if (after.hit > 0 || occupied < MAX_SLOTS) key = "hit";
    } else {
      const filled = (ATTR_KEYS as readonly AttrKey[]).filter(
        (attr) => after[attr] > 0 && after[attr] < MAX_ATTRIBUTE,
      );
      const empty = occupied < MAX_SLOTS ? (ATTR_KEYS as readonly AttrKey[]).filter((attr) => after[attr] === 0) : [];
      key = filled[0] ?? empty[0];
    }
    if (!key) continue;

    const room = cap - after[key];
    if (room <= 0) continue;
    targets.push({ index: row.index, display: row.display, key, room: Math.min(room, leftover) });
  }

  return targets;
}
