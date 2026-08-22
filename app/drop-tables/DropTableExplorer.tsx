"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { DropRecord, DropTablePayload, ItemType, MatrixDrop } from "./types";
import styles from "./drop-tables.module.css";
import { LanguageSwitcher, useI18n } from "../i18n/i18n";
import { HappyHourHeader } from "../components/HappyHourHeader";
import { useHeaderHeight } from "../components/useHeaderHeight";

const THEME_KEY = "destiny-guide-theme";
const DIFFICULTIES = ["Normal", "Hard", "Very Hard", "Ultimate"];
const SECTION_IDS = ["Viridia", "Greenill", "Skyly", "Bluefull", "Purplenum", "Pinkal", "Redria", "Oran", "Yellowboze", "Whitill"];
const ITEM_TYPES: Array<"All" | ItemType> = ["All", "Weapon", "Armor", "Shield", "Unit", "Mag", "Material", "Consumable", "Other"];
const EPISODES = [1, 2, 4];
type PartySize = 1 | 2 | 3 | 4;
const PARTY_SIZES: PartySize[] = [1, 2, 3, 4];
const PARTY_DAR_MULTIPLIERS: Record<PartySize, number> = { 1: 1, 2: 0.8, 3: 0.7, 4: 0.6 };
type DropRateMultiplier = 1 | 2 | 3;
const DROP_RATE_MULTIPLIERS: DropRateMultiplier[] = [1, 2, 3];

const normalize = (value: string) =>
  value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

function itemSearchValue(value: string) {
  return normalize(value) === "pgf" ? "parasitic gene flow" : normalize(value);
}

function getAdjustedDenominator(denominator: number | null, multiplier: number) {
  return denominator ? denominator / multiplier : null;
}

function formatDenominator(value: number) {
  return value.toLocaleString("en-US", { useGrouping: false, maximumFractionDigits: 2 });
}

function formatRate(rate: string | null, denominator: number | null, multiplier: number) {
  if (!rate || !denominator || multiplier === 1) return rate;
  return `1/${formatDenominator(denominator / multiplier)}`;
}

function formatChance(denominator: number | null) {
  if (!denominator) return "-";
  const chance = 100 / denominator;
  if (chance >= 1) return `${chance.toFixed(2)}%`;
  if (chance >= 0.01) return `${chance.toFixed(3)}%`;
  return `${chance.toFixed(5)}%`;
}

function formatCumulativeChance(denominator: number | null, attempts: number) {
  if (!denominator || attempts <= 0) return "-";
  const chance = 1 - Math.pow(1 - 1 / denominator, attempts);
  return `${(chance * 100).toFixed(chance >= 0.1 ? 1 : chance >= 0.01 ? 2 : 3)}%`;
}

function formatDar(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1).replace(/\.0$/, "");
}

function dropMatches(drop: MatrixDrop, itemNeedle: string, itemType: "All" | ItemType) {
  if (drop.item.toLowerCase() === "no item") return false;
  if (itemType !== "All" && drop.itemType !== itemType) return false;
  if (!itemNeedle) return true;
  const aliases = /parasitic gene\s*["']?flow/i.test(drop.item) ? " pgf parasitic gene flow" : "";
  return `${normalize(drop.item)}${aliases}`.includes(itemNeedle);
}

export default function DropTableExplorer({ payload }: { payload: DropTablePayload }) {
  useHeaderHeight();
  const { t } = useI18n();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [difficulty, setDifficulty] = useState("Normal");
  const [sectionId, setSectionId] = useState("All");
  const [episode, setEpisode] = useState("All");
  const [area, setArea] = useState("All");
  const [itemType, setItemType] = useState<"All" | ItemType>("All");
  const [itemQuery, setItemQuery] = useState("");
  const [enemyQuery, setEnemyQuery] = useState("");
  const [partySize, setPartySize] = useState<PartySize>(1);
  const [dropRateMultiplier, setDropRateMultiplier] = useState<DropRateMultiplier>(2);
  const [farmTargetsPerRun, setFarmTargetsPerRun] = useState(1);
  const [farmRuns, setFarmRuns] = useState(20);
  const [showQuickControls, setShowQuickControls] = useState(false);
  const [mobileControlsOpen, setMobileControlsOpen] = useState(false);
  const controlsAnchorRef = useRef<HTMLDivElement>(null);
  const matrixScrollRefs = useRef<Record<number, HTMLDivElement | null>>({});
  const sectionHeaderRefs = useRef<Record<number, HTMLDivElement | null>>({});

  useEffect(() => {
    const saved = window.localStorage.getItem(THEME_KEY);
    const preferred = saved === "dark" || saved === "light" ? saved : window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
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

  const itemNeedle = itemSearchValue(itemQuery);
  const enemyNeedle = normalize(enemyQuery);
  const selectedEpisode = episode === "All" ? null : Number(episode);
  const displayedSections = sectionId === "All" ? SECTION_IDS : [sectionId];
  const partyDarMultiplier = PARTY_DAR_MULTIPLIERS[partySize];
  const serverDropMultiplier = (targetDifficulty: string) => targetDifficulty === "Ultimate" ? dropRateMultiplier : 1;
  const combinedDropMultiplier = (targetDifficulty: string) => partyDarMultiplier * serverDropMultiplier(targetDifficulty);

  const areas = useMemo(
    () =>
      Array.from(
        new Set(
          payload.matrixRows
            .filter((row) => selectedEpisode === null || row.episode === selectedEpisode)
            .map((row) => row.area),
        ),
      ).sort(),
    [payload.matrixRows, selectedEpisode],
  );

  useEffect(() => {
    if (area !== "All" && !areas.includes(area)) setArea("All");
  }, [area, areas]);

  useEffect(() => {
    const anchor = controlsAnchorRef.current;
    if (!anchor) return;
    let frame = 0;
    const updateQuickControls = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        // 헤더 높이를 실측한다. 언어에 따라 칩이 감겨 헤더가 두 줄이 될 수 있어서
        // 뷰포트 폭으로 추측하면 sticky 판정이 어긋난다.
        const headerOffset = document.querySelector("header")?.getBoundingClientRect().height ?? 110;
        const passedAboveHeader = anchor.getBoundingClientRect().bottom <= headerOffset;
        setShowQuickControls(passedAboveHeader);
        if (!passedAboveHeader) setMobileControlsOpen(false);
      });
    };
    const resizeObserver = new ResizeObserver(updateQuickControls);
    resizeObserver.observe(document.documentElement);
    window.addEventListener("scroll", updateQuickControls, { passive: true });
    window.addEventListener("resize", updateQuickControls);
    updateQuickControls();
    return () => {
      cancelAnimationFrame(frame);
      resizeObserver.disconnect();
      window.removeEventListener("scroll", updateQuickControls);
      window.removeEventListener("resize", updateQuickControls);
    };
  }, []);

  useEffect(() => {
    if (!mobileControlsOpen) return;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMobileControlsOpen(false);
    };
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", closeOnEscape);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener("keydown", closeOnEscape);
    };
  }, [mobileControlsOpen]);

  const visibleRows = useMemo(
    () =>
      payload.matrixRows.filter((row) => {
        if (row.difficulty !== difficulty) return false;
        if (selectedEpisode !== null && row.episode !== selectedEpisode) return false;
        if (area !== "All" && row.area !== area) return false;
        if (enemyNeedle && !normalize(row.enemy).includes(enemyNeedle)) return false;

        if (itemNeedle || itemType !== "All") {
          return row.drops.some(
            (drop) =>
              (sectionId === "All" || drop.sectionId === sectionId) &&
              dropMatches(drop, itemNeedle, itemType),
          );
        }
        return true;
      }),
    [area, difficulty, enemyNeedle, itemNeedle, itemType, payload.matrixRows, sectionId, selectedEpisode],
  );

  const searchResults = useMemo(() => {
    if (!itemNeedle && !enemyNeedle) return [];
    return payload.records.filter((record) => {
      if (sectionId !== "All" && record.sectionId !== sectionId) return false;
      if (selectedEpisode !== null && record.episode !== selectedEpisode) return false;
      if (area !== "All" && record.area !== area) return false;
      if (itemType !== "All" && record.itemType !== itemType) return false;
      if (itemNeedle && !record.searchText.includes(itemNeedle)) return false;
      if (enemyNeedle && !normalize(record.enemy).includes(enemyNeedle)) return false;
      return true;
    });
  }, [area, enemyNeedle, itemNeedle, itemType, payload.records, sectionId, selectedEpisode]);

  const resultGroups = useMemo(() => {
    const groups = new Map<string, { item: string; itemType: ItemType; records: DropRecord[] }>();
    searchResults.forEach((record) => {
      const key = normalize(record.item);
      const group = groups.get(key);
      if (group) group.records.push(record);
      else groups.set(key, { item: record.item, itemType: record.itemType, records: [record] });
    });
    return Array.from(groups.values()).sort((a, b) => a.item.localeCompare(b.item));
  }, [searchResults]);

  const activeFilterCount = [sectionId, episode, area, itemType].filter((value) => value !== "All").length + Number(Boolean(itemQuery)) + Number(Boolean(enemyQuery)) + Number(partySize !== 1) + Number(dropRateMultiplier !== 2) + Number(farmTargetsPerRun !== 1) + Number(farmRuns !== 20);

  const resetFilters = () => {
    setSectionId("All");
    setEpisode("All");
    setArea("All");
    setItemType("All");
    setItemQuery("");
    setEnemyQuery("");
    setPartySize(1);
    setDropRateMultiplier(2);
    setFarmTargetsPerRun(1);
    setFarmRuns(20);
  };

  const partySelector = (compact = false) => (
    <div className={compact ? styles.quickPartyDar : styles.partyDarControl}>
      <div className={styles.partyDarLabel}>
        <span>{t("dt.party.title", "Party size")}</span>
        <small>DAR multiplier: {Math.round(partyDarMultiplier * 100)}%</small>
      </div>
      <div className={styles.partyButtons} role="group" aria-label={compact ? t("dt.party.aria.quick", "Quick party size") : t("dt.party.aria", "Party size for drop rate calculation")}>
        {PARTY_SIZES.map((value) => (
          <button key={value} type="button" className={partySize === value ? styles.partyActive : ""} aria-pressed={partySize === value} onClick={() => setPartySize(value)}>
            {value}P
          </button>
        ))}
      </div>
    </div>
  );

  const dropRateSelector = (compact = false) => (
    <div className={compact ? styles.quickDropRate : styles.dropRateControl}>
      <div className={styles.partyDarLabel}>
        <span>{t("dt.rate.title", "Ultimate drop rate")}</span>
        <small>{t("dt.rate.note", "N/H/VH always x1 · x2 standard · x3 Happy Hour")}</small>
      </div>
      <div className={`${styles.partyButtons} ${styles.dropRateButtons}`} role="group" aria-label={compact ? t("dt.rate.aria.quick", "Quick Ultimate drop rate multiplier") : t("dt.rate.aria", "Ultimate server drop rate multiplier")}>
        {DROP_RATE_MULTIPLIERS.map((value) => (
          <button key={value} type="button" className={dropRateMultiplier === value ? styles.partyActive : ""} aria-pressed={dropRateMultiplier === value} onClick={() => setDropRateMultiplier(value)}>
            {value === 3 ? t("dt.rate.hh", "x3 HH") : `x${value}`}
          </button>
        ))}
      </div>
    </div>
  );

  const farmPlanSelector = (compact = false) => (
    <div className={compact ? styles.quickFarmPlan : styles.farmPlanControl}>
      <div className={styles.partyDarLabel}>
        <span>{t("dt.plan.title", "Farming plan")}</span>
        <small>{t("dt.plan.note", "Cumulative chance in search results")}</small>
      </div>
      <div className={styles.farmPlanInputs}>
        <label>
          <span>{t("dt.plan.targets", "Targets/run")}</span>
          <input type="number" min="1" step="1" value={farmTargetsPerRun} onChange={(event) => setFarmTargetsPerRun(Math.max(1, Math.round(Number(event.target.value) || 1)))} />
        </label>
        <label>
          <span>{t("dt.plan.runs", "Runs")}</span>
          <input type="number" min="1" step="1" value={farmRuns} onChange={(event) => setFarmRuns(Math.max(1, Math.round(Number(event.target.value) || 1)))} />
        </label>
      </div>
    </div>
  );

  const quickControls = (mobile = false) => (
    <>
      <div className={styles.quickSearches}>
        <label>
          <span>{t("dt.filter.item", "Item name")}</span>
          <div className={styles.quickSearchInput}><span aria-hidden="true">⌕</span><input aria-label={mobile ? t("dt.filter.item.aria.mobile", "Mobile item name") : t("dt.filter.item.aria.quick", "Quick item name")} value={itemQuery} onChange={(event) => setItemQuery(event.target.value)} placeholder={t("dt.filter.item", "Item name")} /></div>
        </label>
        <label>
          <span>{t("dt.filter.monster", "Monster name")}</span>
          <div className={styles.quickSearchInput}><span aria-hidden="true">⌕</span><input aria-label={mobile ? t("dt.filter.monster.aria.mobile", "Mobile monster name") : t("dt.filter.monster.aria.quick", "Quick monster name")} value={enemyQuery} onChange={(event) => setEnemyQuery(event.target.value)} placeholder={t("dt.filter.monster", "Monster name")} /></div>
        </label>
      </div>
      <div className={styles.quickFilters}>
        <label><span>{t("dt.filter.section", "Section ID")}</span><select aria-label={mobile ? t("dt.filter.section.aria.mobile", "Mobile Section ID") : t("dt.filter.section.aria.quick", "Quick Section ID")} value={sectionId} onChange={(event) => setSectionId(event.target.value)}><option value="All">{t("dt.filter.all", "All")}</option>{SECTION_IDS.map((value) => <option key={value}>{value}</option>)}</select></label>
        <label><span>{t("dt.filter.episode", "Episode")}</span><select aria-label={mobile ? t("dt.filter.episode.aria.mobile", "Mobile episode") : t("dt.filter.episode.aria.quick", "Quick episode")} value={episode} onChange={(event) => setEpisode(event.target.value)}><option value="All">{t("dt.filter.all", "All")}</option><option value="1">Episode 1</option><option value="2">Episode 2</option><option value="4">Episode 4</option></select></label>
        <label><span>{t("dt.filter.area", "Area")}</span><select aria-label={mobile ? t("dt.filter.area.aria.mobile", "Mobile area") : t("dt.filter.area.aria.quick", "Quick area")} value={area} onChange={(event) => setArea(event.target.value)}><option value="All">{t("dt.filter.all", "All")}</option>{areas.map((value) => <option key={value}>{value}</option>)}</select></label>
        <label><span>{t("dt.filter.type", "Item type")}</span><select aria-label={mobile ? t("dt.filter.type.aria.mobile", "Mobile item type") : t("dt.filter.type.aria.quick", "Quick item type")} value={itemType} onChange={(event) => setItemType(event.target.value as "All" | ItemType)}>{ITEM_TYPES.map((value) => <option key={value} value={value}>{value === "All" ? t("dt.filter.all", "All") : value}</option>)}</select></label>
      </div>
      <div className={styles.quickDifficulty} aria-label={mobile ? t("dt.filter.difficulty.aria.mobile", "Mobile difficulty") : t("dt.filter.difficulty.aria.quick", "Quick difficulty")}>
        <span>{t("dt.filter.difficulty", "Table difficulty")}</span>
        <div>{DIFFICULTIES.map((value) => <button key={value} type="button" className={difficulty === value ? styles.quickDifficultyActive : ""} onClick={() => setDifficulty(value)}>{value}</button>)}</div>
      </div>
      {partySelector(true)}
      {dropRateSelector(true)}
      {farmPlanSelector(true)}
      <button className={styles.quickReset} type="button" onClick={resetFilters} disabled={activeFilterCount === 0}>Reset filters {activeFilterCount > 0 && <span>{activeFilterCount}</span>}</button>
    </>
  );

  return (
    <>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <h1 className={styles.siteLogo}>
            <a href="../index.html" aria-label={t("header.logo.alt", "Destiny Guide")}><img src="../images/common/rogo.png" alt="Destiny Guide" /></a>
          </h1>
          <nav className={styles.headerMenus} aria-label={t("dt.nav.aria", "Main navigation")}>
            <div>
              <a href="../beginner_page.html">{t("header.nav.beginner", "Beginner")}</a>
              <a href="../item_page.html">{t("header.nav.items", "Destiny Items")}</a>
              <a href="../class_builds.html">Class Builds</a>
              <a href="../quest_data_page.html">{t("header.nav.questData", "Quest Data")}</a>
              <a href="../enhance_page.html">{t("header.nav.enhance", "Enhancement")}</a>
              <a href="../economy_page.html">{t("header.nav.economy", "Shops")}</a>
              <a href="../system_page.html">{t("header.nav.systems", "Systems")}</a>
              <a href="../dmc_page.html">{t("header.nav.dmc", "DMC Guide")}</a>
              <a href="../Psobb_tool.html">{t("header.nav.tools", "Tools")}</a>
              <a href="../player_tools.html">{t("lab.t092", "Farming tools")}</a>
              <a href="../redeem/">{t("header.nav.redeem", "Token Redeem")}</a>
            </div>
            <div className={styles.raidMenu}>
              <a href="../dn.html">Distorted Nightmare [RAID]</a>
              <a href="../discontrolled_tower_raid.html">The Discontrolled Tower [RAID]</a>
              <a href="../predator_raid.html">The Ravenous Predator [RAID]</a>
              <a href="../tpd_page.html">The Phantasmal Dimension</a>
            </div>
          </nav>
          <div className={styles.headerActions}>
            <button className={styles.themeButton} type="button" onClick={updateTheme} aria-label={theme === "dark" ? t("header.theme.light", "Light mode") : t("header.theme.dark", "Dark mode")} aria-pressed={theme === "dark"}>
              <span className={styles.themeIcon} aria-hidden="true" />
              {theme === "dark" ? "Light" : "Dark"}
            </button>
            <a className={styles.discordLink} href="https://discord.gg/FesaarwjFn" target="_blank" rel="noreferrer" aria-label="Destiny Discord" />
            <a className={styles.dropTableLink} href="../drop-tables/" aria-current="page">{t("header.link.dropTables", "Drop Tables")}</a>
            <a className={styles.dropTableLink} href="../database/">{t("header.link.database", "Database")}</a>
            {/* /calculator/ stays unlisted until its damage model is verified. */}
            <LanguageSwitcher />
            <HappyHourHeader />
          </div>
        </div>
      </header>

      <section className={styles.matrixHero}>
        <p className={styles.eyebrow}>{t("dt.hero.eyebrow", "DESTINY PSOBB DATABASE")}</p>
        <h1>{t("dt.hero.title", "Drop Tables")}</h1>
        <p>{t("dt.hero.lead", "Choose a difficulty, then read each monster across the ten Section IDs. Search results are highlighted and summarized above the original table layout.")}</p>
      </section>

      <section className={`${styles.explorer} ${showQuickControls ? styles.explorerQuickOpen : ""}`}>
        <div className={styles.controlsAnchor} ref={controlsAnchorRef}>
          <div className={styles.filterPanel}>
            <div className={styles.searchGrid}>
              <label>
                <span>{t("dt.filter.item", "Item name")}</span>
                <div className={styles.searchInput}><span aria-hidden="true">⌕</span><input value={itemQuery} onChange={(event) => setItemQuery(event.target.value)} placeholder={t("dt.filter.item.hint", "e.g. PGF, Heaven Striker")} /></div>
              </label>
              <label>
                <span>{t("dt.filter.monster", "Monster name")}</span>
                <div className={styles.searchInput}><span aria-hidden="true">⌕</span><input value={enemyQuery} onChange={(event) => setEnemyQuery(event.target.value)} placeholder={t("dt.filter.monster.hint", "e.g. Olga Flow")} /></div>
              </label>
            </div>
            <div className={styles.matrixFilters}>
              <label><span>{t("dt.filter.section", "Section ID")}</span><select value={sectionId} onChange={(event) => setSectionId(event.target.value)}><option value="All">{t("dt.filter.all", "All")}</option>{SECTION_IDS.map((value) => <option key={value}>{value}</option>)}</select></label>
              <label><span>{t("dt.filter.episode", "Episode")}</span><select value={episode} onChange={(event) => setEpisode(event.target.value)}><option value="All">{t("dt.filter.all", "All")}</option><option value="1">Episode 1</option><option value="2">Episode 2</option><option value="4">Episode 4</option></select></label>
              <label><span>{t("dt.filter.area", "Area")}</span><select value={area} onChange={(event) => setArea(event.target.value)}><option value="All">{t("dt.filter.all", "All")}</option>{areas.map((value) => <option key={value}>{value}</option>)}</select></label>
              <label><span>{t("dt.filter.type", "Item type")}</span><select value={itemType} onChange={(event) => setItemType(event.target.value as "All" | ItemType)}>{ITEM_TYPES.map((value) => <option key={value} value={value}>{value === "All" ? t("dt.filter.all", "All") : value}</option>)}</select></label>
              <button className={styles.resetButton} type="button" onClick={resetFilters} disabled={activeFilterCount === 0}>Reset filters {activeFilterCount > 0 && <span>{activeFilterCount}</span>}</button>
            </div>
            <div className={styles.rateControls}>
              {partySelector()}
              {dropRateSelector()}
              {farmPlanSelector()}
            </div>
          </div>

          <div className={styles.browseDifficulty}>
            <span>{t("dt.browse.title", "Browse original table")}</span>
            <p>{t("dt.browse.note", "N/H/VH use x1. Ultimate uses the selected x1/x2/x3 rate. Search always covers every difficulty.")}</p>
          </div>
          <div className={styles.difficultyBar} aria-label={t("dt.browse.aria", "Browse table by difficulty")}>
            {DIFFICULTIES.map((value) => (
              <button key={value} type="button" className={difficulty === value ? styles.difficultyActive : ""} onClick={() => setDifficulty(value)}>
                {value}
              </button>
            ))}
          </div>
        </div>

        {(itemNeedle || enemyNeedle) && (
          <section className={styles.searchResults} aria-labelledby="drop-search-results">
            <header>
              <div><span>{t("dt.results.scope", "All difficulties")}</span><h2 id="drop-search-results">{t("dt.results.title", "Related item information")}</h2></div>
              <strong>{t("dt.results.count", "{n} drops").replace("{n}", searchResults.length.toLocaleString())}</strong>
            </header>
            {resultGroups.length > 0 ? (
              <div className={styles.resultItemGrid}>
                {resultGroups.map((group) => (
                  <article className={styles.resultItemCard} key={normalize(group.item)}>
                    <div className={styles.resultItemTitle}>
                      <span className={`${styles.typeIcon} ${styles[`type${group.itemType}`]}`}>{group.itemType.slice(0, 1)}</span>
                      <div><h3>{group.item}</h3><p>{group.itemType} · {(group.records.length === 1 ? t("dt.card.location", "{n} location") : t("dt.card.locations", "{n} locations")).replace("{n}", String(group.records.length))}</p></div>
                    </div>
                    <div className={styles.resultLocations}>
                      {group.records.map((record) => {
                        const multiplier = combinedDropMultiplier(record.difficulty);
                        const adjustedDenominator = getAdjustedDenominator(record.denominator, multiplier);
                        const plannedAttempts = farmTargetsPerRun * farmRuns;
                        return (
                          <div key={record.id}>
                            <span className={`${styles.sectionDot} ${styles[`section${record.sectionId}`]}`} />
                            <strong>{record.difficulty} · {record.sectionId}</strong>
                            <span>{record.enemy} · EP {record.episode} {record.area} · DAR {formatDar(record.dar * partyDarMultiplier)}% · x{serverDropMultiplier(record.difficulty)}</span>
                            <b>
                              {formatRate(record.rate, record.denominator, multiplier) ?? t("dt.rate.special", "Special")}
                              <small>{formatChance(adjustedDenominator)}</small>
                              {adjustedDenominator && <em>{t("dt.plan.chance", "{runs} runs: {chance}").replace("{runs}", farmRuns.toLocaleString()).replace("{chance}", formatCumulativeChance(adjustedDenominator, plannedAttempts))}</em>}
                            </b>
                          </div>
                        );
                      })}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className={styles.empty}><span>⌕</span><h2>{t("dt.empty.title", "No drops found")}</h2><p>{t("dt.empty.note", "Try a broader item or monster name.")}</p><button type="button" onClick={resetFilters}>{t("dt.empty.reset", "Reset all filters")}</button></div>
            )}
          </section>
        )}

        <div className={styles.matrixSummary}>
          <span dangerouslySetInnerHTML={{ __html: t("dt.summary.rows", "<strong>{n}</strong> monster rows").replace("{n}", String(visibleRows.length)) }} />
        </div>

        {EPISODES.filter((value) => selectedEpisode === null || value === selectedEpisode).map((episodeNumber) => {
          const rows = visibleRows.filter((row) => row.episode === episodeNumber);
          if (rows.length === 0) return null;
          return (
            <section className={styles.episodeTable} key={episodeNumber}>
              <h2>{difficulty.toUpperCase()} <span>|</span> EPISODE {episodeNumber}</h2>
              <div className={styles.mobileSwipeHint} aria-label={t("dt.swipe.aria", "Swipe left or right to view every Section ID")}>
                <span aria-hidden="true">←</span>
                <strong>{t("dt.swipe.label", "Swipe left or right to view Section IDs")}</strong>
                <span aria-hidden="true">→</span>
              </div>
              <div className={styles.stickySectionHeader} aria-hidden="true">
                <div
                  className={styles.stickySectionHeaderScroll}
                  ref={(node) => { sectionHeaderRefs.current[episodeNumber] = node; }}
                  onScroll={(event) => {
                    const tableScroller = matrixScrollRefs.current[episodeNumber];
                    if (tableScroller && tableScroller.scrollLeft !== event.currentTarget.scrollLeft) tableScroller.scrollLeft = event.currentTarget.scrollLeft;
                  }}
                >
                  <div className={`${styles.stickySectionHeaderRow} ${displayedSections.length === 1 ? styles.singleSectionHeaderRow : ""}`}>
                    <span>{t("dt.table.monster", "Monster")}</span>
                    {displayedSections.map((value) => <strong className={styles[`column${value}`]} key={value}>{value}</strong>)}
                  </div>
                </div>
              </div>
              <div
                className={styles.matrixScroll}
                ref={(node) => { matrixScrollRefs.current[episodeNumber] = node; }}
                onScroll={(event) => {
                  const headerScroller = sectionHeaderRefs.current[episodeNumber];
                  if (headerScroller && headerScroller.scrollLeft !== event.currentTarget.scrollLeft) headerScroller.scrollLeft = event.currentTarget.scrollLeft;
                }}
              >
                <table className={displayedSections.length === 1 ? styles.singleSectionTable : ""}>
                  <colgroup>
                    <col className={styles.monsterColumn} />
                    {displayedSections.map((value) => <col key={value} />)}
                  </colgroup>
                  <thead className={styles.srOnlyTableHead}><tr><th>{t("dt.table.monster", "Monster")}</th>{displayedSections.map((value) => <th key={value}>{value}</th>)}</tr></thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id}>
                        <th scope="row"><strong>{row.enemy}</strong><span>DAR: {formatDar(row.dar * partyDarMultiplier)}%</span><small>{t("dt.table.base", "Base")} {row.dar}% · {partySize}P · x{serverDropMultiplier(row.difficulty)} {t("dt.table.drops", "drops")}</small></th>
                        {displayedSections.map((value) => {
                          const drop = row.drops.find((candidate) => candidate.sectionId === value)!;
                          const focused = !itemNeedle && itemType === "All" ? true : dropMatches(drop, itemNeedle, itemType);
                          return (
                            <td className={`${styles.dropCell} ${styles[`column${value}`]} ${focused ? styles.dropFocused : styles.dropDimmed}`} key={value}>
                              <strong>{drop.item}</strong>
                              {drop.rate && <span>{formatRate(drop.rate, drop.denominator, combinedDropMultiplier(row.difficulty))}</span>}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          );
        })}
      </section>

      {showQuickControls && (
        <>
          <aside className={styles.desktopQuickPanel} aria-label={t("dt.quick.aria", "Quick drop table controls")}>
            <header><div><span>{t("dt.quick.eyebrow", "Quick controls")}</span><strong>{t("dt.quick.title", "Search & filter")}</strong></div><small>{t("dt.quick.note", "All difficulties search")}</small></header>
            <div className={styles.quickPanelBody}>{quickControls()}</div>
          </aside>
          <button className={styles.mobileQuickButton} type="button" onClick={() => setMobileControlsOpen(true)} aria-label={t("dt.quick.open", "Open search and filters")} aria-expanded={mobileControlsOpen}>
            <span aria-hidden="true">⌕</span><strong dangerouslySetInnerHTML={{ __html: t("dt.quick.button", "Search<br />& Filter") }} />{activeFilterCount > 0 && <b>{activeFilterCount}</b>}
          </button>
        </>
      )}

      {mobileControlsOpen && (
        <div className={styles.mobileQuickBackdrop} role="presentation" onClick={() => setMobileControlsOpen(false)}>
          <aside className={styles.mobileQuickDrawer} role="dialog" aria-modal="true" aria-label={t("dt.drawer.aria", "Search, filters and difficulty")} onClick={(event) => event.stopPropagation()}>
            <header><div><span>{t("dt.hero.title", "Drop Tables")}</span><h2>{t("dt.drawer.title", "Search & Filter")}</h2></div><button type="button" onClick={() => setMobileControlsOpen(false)} aria-label={t("dt.drawer.close", "Close search and filters")}>×</button></header>
            <div className={styles.quickPanelBody}>{quickControls(true)}</div>
          </aside>
        </div>
      )}
    </>
  );
}
