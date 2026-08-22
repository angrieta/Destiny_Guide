"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { LanguageSwitcher, useI18n } from "../i18n/i18n";
import { HappyHourHeader } from "../components/HappyHourHeader";
import { useHeaderHeight } from "../components/useHeaderHeight";
import { MAX_BUFF_LEVEL, buffPercent, computeTotals } from "./totals";
import type { BaseStats, Buffs, Loadout } from "./totals";
import type { CalculatorPayload, Equipment, MagStats, StatKey } from "./types";
import { RESIST_KEYS, STAT_KEYS } from "./types";

import styles from "./calculator.module.css";

const MAG_KEYS: Array<keyof MagStats> = ["DEF", "POW", "DEX", "MIND"];
const THEME_KEY = "destiny-guide-theme";
const UNIT_SLOTS = [0, 1, 2, 3];

const STAT_LABELS: Record<StatKey, string> = {
  ATP: "ATP",
  ATA: "ATA",
  DFP: "DFP",
  EVP: "EVP",
  MST: "MST",
  LCK: "LCK",
  HP: "HP",
  TP: "TP",
};

type SlotKey = "weapon" | "armor" | "shield" | "unit0" | "unit1" | "unit2" | "unit3";

const SLOT_PARAM: Record<SlotKey, string> = {
  weapon: "w",
  armor: "a",
  shield: "s",
  unit0: "u1",
  unit1: "u2",
  unit2: "u3",
  unit3: "u4",
};

export default function Calculator({ payload }: { payload: CalculatorPayload }) {
  useHeaderHeight();
  const { t } = useI18n();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [playerClass, setPlayerClass] = useState("humar");
  const [level, setLevel] = useState(200);
  const [base, setBase] = useState<BaseStats>({});
  const [picked, setPicked] = useState<Partial<Record<SlotKey, string>>>({});
  const [grind, setGrind] = useState<number | null>(null);
  const [mag, setMag] = useState<MagStats>(payload.classes[0].mag);
  /** Left alone once the player edits the plan, so changing class does not wipe it. */
  const [magTouched, setMagTouched] = useState(false);
  const [buffs, setBuffs] = useState<Buffs>({ shifta: 0, deband: 0 });
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem(THEME_KEY);
    const preferred =
      saved === "dark" || saved === "light"
        ? saved
        : window.matchMedia("(prefers-color-scheme: dark)").matches
          ? "dark"
          : "light";
    setTheme(preferred);
    document.documentElement.dataset.theme = preferred;
    document.documentElement.style.colorScheme = preferred;
  }, []);

  const updateTheme = () => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    window.localStorage.setItem(THEME_KEY, next);
    document.documentElement.dataset.theme = next;
    document.documentElement.style.colorScheme = next;
  };

  const byId = useMemo(() => new Map(payload.equipment.map((item) => [item.id, item])), [payload.equipment]);
  const bySlot = useMemo(() => {
    const groups: Record<string, Equipment[]> = { weapon: [], armor: [], shield: [], unit: [] };
    for (const item of payload.equipment) groups[item.slot].push(item);
    return groups;
  }, [payload.equipment]);

  // Restore a shared URL, then keep it in step with the form.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const readClass = params.get("class");
    const startClass = readClass && payload.classes.some((entry) => entry.id === readClass) ? readClass : "humar";
    if (readClass) setPlayerClass(startClass);

    const readMag = params.get("mag");
    const parts = readMag?.split("/").map(Number);
    if (parts && parts.length === 4 && parts.every((value) => Number.isFinite(value))) {
      setMag({ DEF: parts[0], POW: parts[1], DEX: parts[2], MIND: parts[3] });
      setMagTouched(true);
    } else {
      setMag(payload.classes.find((entry) => entry.id === startClass)?.mag ?? payload.classes[0].mag);
    }
    const readShifta = Number(params.get("sh")) || 0;
    const readDeband = Number(params.get("db")) || 0;
    setBuffs({ shifta: Math.min(MAX_BUFF_LEVEL, Math.max(0, readShifta)), deband: Math.min(MAX_BUFF_LEVEL, Math.max(0, readDeband)) });
    const readLevel = Number(params.get("lv"));
    if (Number.isFinite(readLevel) && readLevel > 0) setLevel(readLevel);
    const rawGrind = params.get("g");
    if (rawGrind !== null && Number.isFinite(Number(rawGrind))) setGrind(Math.max(0, Number(rawGrind)));

    const nextPicked: Partial<Record<SlotKey, string>> = {};
    for (const [slot, param] of Object.entries(SLOT_PARAM) as Array<[SlotKey, string]>) {
      const value = params.get(param);
      if (value && byId.has(value)) nextPicked[slot] = value;
    }
    setPicked(nextPicked);

    const nextBase: BaseStats = {};
    for (const stat of STAT_KEYS) {
      const value = Number(params.get(stat.toLowerCase()));
      if (Number.isFinite(value) && value !== 0) nextBase[stat] = value;
    }
    setBase(nextBase);
    setHydrated(true);
  }, [byId, payload.classes]);

  useEffect(() => {
    if (!hydrated) return;
    const params = new URLSearchParams();
    if (playerClass !== "humar") params.set("class", playerClass);
    if (level !== 200) params.set("lv", String(level));
    if (grind !== null) params.set("g", String(grind));
    if (magTouched) params.set("mag", `${mag.DEF}/${mag.POW}/${mag.DEX}/${mag.MIND}`);
    if (buffs.shifta > 0) params.set("sh", String(buffs.shifta));
    if (buffs.deband > 0) params.set("db", String(buffs.deband));
    for (const [slot, param] of Object.entries(SLOT_PARAM) as Array<[SlotKey, string]>) {
      const value = picked[slot];
      if (value) params.set(param, value);
    }
    for (const stat of STAT_KEYS) {
      const value = base[stat];
      if (value) params.set(stat.toLowerCase(), String(value));
    }
    const search = params.toString();
    window.history.replaceState(null, "", search ? `?${search}` : window.location.pathname);
  }, [hydrated, playerClass, level, grind, picked, base, mag, magTouched, buffs]);

  const changeClass = (next: string) => {
    setPlayerClass(next);
    if (!magTouched) {
      setMag(payload.classes.find((entry) => entry.id === next)?.mag ?? payload.classes[0].mag);
    }
  };

  const loadout: Loadout = useMemo(
    () => ({
      weapon: picked.weapon ? (byId.get(picked.weapon) ?? null) : null,
      armor: picked.armor ? (byId.get(picked.armor) ?? null) : null,
      shield: picked.shield ? (byId.get(picked.shield) ?? null) : null,
      units: UNIT_SLOTS.map((index) => {
        const id = picked[`unit${index}` as SlotKey];
        return id ? (byId.get(id) ?? null) : null;
      }),
      grind,
    }),
    [picked, byId, grind],
  );

  const totals = useMemo(() => computeTotals(base, loadout, playerClass, level, mag, buffs), [base, loadout, playerClass, level, mag, buffs]);

  const reset = useCallback(() => {
    setPicked({});
    setBase({});
    setGrind(null);
    setLevel(200);
    setPlayerClass("humar");
    setMag(payload.classes[0].mag);
    setMagTouched(false);
    setBuffs({ shifta: 0, deband: 0 });
  }, [payload.classes]);

  const hasSelection = Object.values(picked).some(Boolean) || Object.values(base).some(Boolean);

  const equipped = [
    { key: "weapon" as SlotKey, label: t("calc.slot.weapon", "Weapon"), pool: bySlot.weapon },
    { key: "armor" as SlotKey, label: t("calc.slot.armor", "Armor"), pool: bySlot.armor },
    { key: "shield" as SlotKey, label: t("calc.slot.shield", "Shield"), pool: bySlot.shield },
    ...UNIT_SLOTS.map((index) => ({
      key: `unit${index}` as SlotKey,
      label: `${t("calc.slot.unit", "Unit")} ${index + 1}`,
      pool: bySlot.unit,
    })),
  ];

  return (
    <div className={styles.pageShell}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <h1 className={styles.siteLogo}>
            <a href="../index.html" aria-label="Destiny Guide">
              <img src="../images/common/rogo.png" alt="Destiny Guide" />
            </a>
          </h1>
          <nav className={styles.headerMenus} aria-label="Main navigation">
            <div>
              <a href="../beginner_page.html">{t("nav.beginner", "Beginner")}</a>
              <a href="../item_page.html">{t("nav.items", "Destiny Items")}</a>
              <a href="../class_builds.html">{t("nav.builds", "Class Builds")}</a>
              <a href="../Psobb_tool.html">{t("nav.tools", "Tools")}</a>
            </div>
          </nav>
          <div className={styles.headerActions}>
            <button className={styles.themeButton} type="button" onClick={updateTheme} aria-pressed={theme === "dark"}>
              <span className={styles.themeIcon} aria-hidden="true" />
              {theme === "dark" ? t("theme.light", "Light") : t("theme.dark", "Dark")}
            </button>
            <a className={styles.navLink} href="../drop-tables/">
              {t("nav.dropTables", "Drop Tables")}
            </a>
            <a className={styles.navLink} href="../database/">
              {t("nav.database", "Item DB")}
            </a>
            <LanguageSwitcher />
            <HappyHourHeader />
          </div>
        </div>
      </header>

      <section className={styles.hero}>
        <p className={styles.eyebrow}>{t("calc.eyebrow", "STAT CALCULATOR")}</p>
        <h2>{t("calc.title", "Build a loadout, see the numbers.")}</h2>
        <p className={styles.heroCopy}>
          {t(
            "calc.lead",
            "Pick equipment and this adds up what it gives you, including the boost effects written on each item. Enter your character stats to see absolute totals, or leave them blank to compare gear on its own.",
          )}
        </p>
      </section>

      <main className={styles.grid}>
        <div className={styles.panel}>
          <h3>{t("calc.character", "Character")}</h3>
          <div className={styles.fieldRow}>
            <label>
              <span>{t("calc.class", "Class")}</span>
              <select value={playerClass} onChange={(event) => changeClass(event.target.value)}>
                {payload.classes.map((entry) => (
                  <option key={entry.id} value={entry.id}>
                    {entry.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              <span>{t("calc.level", "Level")}</span>
              <input
                type="number"
                min={1}
                max={200}
                value={level}
                onChange={(event) => setLevel(Number(event.target.value))}
              />
            </label>
          </div>

          <h3 className={styles.subhead}>{t("calc.mag", "Mag")}</h3>
          <p className={styles.hint}>
            {t(
              "calc.magHint",
              "Pre-filled with the plan the class build guide recommends. If your mag is raised differently, change it here.",
            )}
          </p>
          <div className={styles.magInputs}>
            {MAG_KEYS.map((key) => (
              <label key={key}>
                <span>{key}</span>
                <input
                  type="number"
                  min={0}
                  max={200}
                  value={mag[key]}
                  onChange={(event) => {
                    const value = Math.max(0, Number(event.target.value) || 0);
                    setMag((current) => ({ ...current, [key]: value }));
                    setMagTouched(true);
                  }}
                />
              </label>
            ))}
          </div>
          <p className={styles.magNote}>
            {t("calc.magTotal", "Total")} {MAG_KEYS.reduce((sum, key) => sum + mag[key], 0)} / 200
            {" · "}
            {t("calc.magRates", "DEF 1 DFP, POW 2 ATP, DEX 0.5 ATA, MIND 2 MST per level")}
          </p>

          <h3 className={styles.subhead}>{t("calc.buffs", "Shifta / Deband")}</h3>
          <p className={styles.hint}>
            {t(
              "calc.buffHint",
              "Each level gives 10 + 1.3 x (level - 1) percent. Androids cast Lv3 on their own and Lv21 from a Photon Blast, HUmar Lv15, Forces Lv30, and PARAGON FRAME raises the cap to 35.",
            )}
          </p>
          <div className={styles.fieldRow}>
            {(["shifta", "deband"] as const).map((key) => (
              <label key={key}>
                <span>
                  {key === "shifta" ? t("calc.shifta", "Shifta Lv") : t("calc.deband", "Deband Lv")}
                  {buffs[key] > 0 && ` (+${buffPercent(buffs[key]).toFixed(1)}%)`}
                </span>
                <input
                  type="number"
                  min={0}
                  max={MAX_BUFF_LEVEL}
                  value={buffs[key]}
                  onChange={(event) => {
                    const value = Math.min(MAX_BUFF_LEVEL, Math.max(0, Number(event.target.value) || 0));
                    setBuffs((current) => ({ ...current, [key]: value }));
                  }}
                />
              </label>
            ))}
          </div>

          <h3 className={styles.subhead}>{t("calc.baseStats", "Your stats, unequipped")}</h3>
          <p className={styles.hint}>
            {t(
              "calc.baseHint",
              "Optional, and without the mag since that is counted above. Read these off the character screen with gear removed. Leave blank to see only what the equipment contributes.",
            )}
          </p>
          <div className={styles.statInputs}>
            {STAT_KEYS.map((stat) => (
              <label key={stat}>
                <span>{STAT_LABELS[stat]}</span>
                <input
                  type="number"
                  value={base[stat] ?? ""}
                  placeholder="0"
                  onChange={(event) => {
                    const value = Number(event.target.value);
                    setBase((current) => ({ ...current, [stat]: Number.isFinite(value) ? value : 0 }));
                  }}
                />
              </label>
            ))}
          </div>
        </div>

        <div className={styles.panel}>
          <h3>{t("calc.equipment", "Equipment")}</h3>
          {equipped.map(({ key, label, pool }) => (
            <label key={key} className={styles.picker}>
              <span>{label}</span>
              <input
                list={`pool-${key}`}
                value={picked[key] ? (byId.get(picked[key] as string)?.name ?? "") : ""}
                placeholder={t("calc.pickPlaceholder", "Type to search...")}
                onChange={(event) => {
                  const typed = event.target.value.trim().toLowerCase();
                  const match = pool.find((item) => item.name.toLowerCase() === typed);
                  setPicked((current) => {
                    const next = { ...current };
                    if (match) next[key] = match.id;
                    else delete next[key];
                    return next;
                  });
                }}
              />
              <datalist id={`pool-${key}`}>
                {pool.map((item) => (
                  <option key={item.id} value={item.name} />
                ))}
              </datalist>
            </label>
          ))}
          {loadout.weapon && loadout.weapon.maxGrind > 0 && (
            <label className={styles.picker}>
              <span>
                {t("calc.grind", "Extra grind")} (max {loadout.weapon.maxGrind})
              </span>
              <input
                type="number"
                min={0}
                max={loadout.weapon.maxGrind}
                value={grind}
                onChange={(event) => setGrind(Math.max(0, Number(event.target.value) || 0))}
              />
            </label>
          )}
          <button
            type="button"
            className={hasSelection ? styles.resetActive : styles.reset}
            onClick={reset}
            disabled={!hasSelection}
          >
            {t("calc.reset", "Reset")}
          </button>
        </div>

        <div className={styles.results}>
          <h3>{t("calc.totals", "Totals")}</h3>
          <dl className={styles.statGrid}>
            {STAT_KEYS.map((stat) => (
              <div key={stat}>
                <dt>{STAT_LABELS[stat]}</dt>
                <dd>{totals.stats[stat].toLocaleString("en-US")}</dd>
              </div>
            ))}
          </dl>

          {totals.buffed && (
            <>
              <h4>
                {t("calc.withBuffs", "With Shifta")} {totals.buffed.shifta} / {t("calc.debandShort", "Deband")}{" "}
                {totals.buffed.deband}
              </h4>
              <dl className={styles.factList}>
                <div>
                  <dt>ATP</dt>
                  <dd>
                    {totals.stats.ATP.toLocaleString("en-US")} →{" "}
                    <strong>{totals.buffed.ATP.toLocaleString("en-US")}</strong>
                  </dd>
                </div>
                <div>
                  <dt>DFP</dt>
                  <dd>
                    {totals.stats.DFP.toLocaleString("en-US")} →{" "}
                    <strong>{totals.buffed.DFP.toLocaleString("en-US")}</strong>
                  </dd>
                </div>
              </dl>
              {totals.buffed.atpWeapon > 0 && (
                <p className={styles.magNote}>
                  {t("calc.shiftaSkipsWeapon", "Shifta scales the character's")} {totals.buffed.atpCharacter} ATP,{" "}
                  {t("calc.shiftaSkipsWeaponTail", "not the weapon's")} {totals.buffed.atpWeapon}.{" "}
                  {t("calc.debandWhole", "Deband scales the whole DFP.")}
                </p>
              )}
            </>
          )}

          <h4>{t("calc.resists", "Resistances")}</h4>
          <dl className={styles.statGrid}>
            {RESIST_KEYS.map((key) => (
              <div key={key}>
                <dt>{key}</dt>
                <dd>{totals.resists[key]}</dd>
              </div>
            ))}
          </dl>

          {totals.weapon && (
            <>
              <h4>{t("calc.weaponFacts", "Weapon")}</h4>
              <dl className={styles.factList}>
                {totals.weapon.atpMin !== null && (
                  <div>
                    <dt>{t("calc.atpRange", "ATP range")}</dt>
                    <dd>
                      {totals.weapon.atpMin} - {totals.weapon.atpMax}
                    </dd>
                  </div>
                )}
                {totals.weapon.targets !== null && (
                  <div>
                    <dt>{t("calc.targets", "Targets")}</dt>
                    <dd>{totals.weapon.targets}</dd>
                  </div>
                )}
                {totals.weapon.range !== null && (
                  <div>
                    <dt>{t("calc.range", "Range")}</dt>
                    <dd>{totals.weapon.range}</dd>
                  </div>
                )}
                {totals.weapon.special && (
                  <div>
                    <dt>{t("calc.special", "Special")}</dt>
                    <dd>{totals.weapon.special}</dd>
                  </div>
                )}
              </dl>
            </>
          )}

          {(Object.keys(totals.tech).length > 0 ||
            totals.techLevel !== 0 ||
            totals.speed.attack !== 0 ||
            totals.speed.cast !== 0 ||
            totals.tpCost !== 0 ||
            Object.keys(totals.regen).length > 0) && (
            <>
              <h4>{t("calc.otherEffects", "Other effects")}</h4>
              <ul className={styles.effectList}>
                {totals.techLevel !== 0 && (
                  <li>
                    {t("calc.techLevel", "Technique level")} +{totals.techLevel}
                  </li>
                )}
                {totals.speed.attack !== 0 && <li>{t("calc.attackSpeed", "Attack speed")} +{totals.speed.attack}%</li>}
                {totals.speed.cast !== 0 && <li>{t("calc.castSpeed", "Cast speed")} +{totals.speed.cast}%</li>}
                {totals.tpCost !== 0 && <li>{t("calc.tpCost", "TP cost")} {totals.tpCost}%</li>}
                {Object.entries(totals.regen).map(([track, rate]) => (
                  <li key={track}>
                    {track.toUpperCase()} {t("calc.regen", "regen")} {rate.amount} / {rate.intervalSec}s
                  </li>
                ))}
                {Object.entries(totals.tech).map(([tech, mod]) => (
                  <li key={tech}>
                    <strong>{tech}</strong>
                    {mod.percent !== undefined && ` +${mod.percent}%`}
                    {mod.level !== undefined && ` lv +${mod.level}`}
                    {mod.power !== undefined && ` power +${mod.power}`}
                  </li>
                ))}
              </ul>
            </>
          )}

          {totals.warnings.length > 0 && (
            <div className={styles.warning}>
              <strong>{t("calc.cannotEquip", "Equip problems")}</strong>
              <ul>
                {totals.warnings.map((warning, index) => (
                  <li key={index}>
                    {warning.item}: {warning.reason}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {totals.uncounted.length > 0 && (
            <div className={styles.notice}>
              <strong>{t("calc.notCounted", "Not included in the numbers above")}</strong>
              <p>
                {t(
                  "calc.notCountedHint",
                  "These effects are written as descriptions, so they cannot be turned into a stat.",
                )}
              </p>
              <ul>
                {totals.uncounted.map((entry, index) => (
                  <li key={index}>
                    <strong>{entry.item}</strong> — {entry.effect}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className={styles.disclaimer}>
            {t(
              "calc.disclaimer",
              "Shifta, Deband and Zalure are left out on purpose: their scaling is set by the server and is not published, so including a guess would make these totals look more precise than they are.",
            )}
          </p>
        </div>
      </main>
    </div>
  );
}
