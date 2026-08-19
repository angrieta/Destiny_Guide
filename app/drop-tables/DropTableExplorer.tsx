"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { DropRecord, DropTablePayload, ItemType, MatrixDrop } from "./types";
import styles from "./drop-tables.module.css";

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
  if (!denominator) return "—";
  const chance = 100 / denominator;
  if (chance >= 1) return `${chance.toFixed(2)}%`;
  if (chance >= 0.01) return `${chance.toFixed(3)}%`;
  return `${chance.toFixed(5)}%`;
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
        const headerOffset = window.innerWidth <= 760 ? 132 : 110;
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

  const activeFilterCount = [sectionId, episode, area, itemType].filter((value) => value !== "All").length + Number(Boolean(itemQuery)) + Number(Boolean(enemyQuery)) + Number(partySize !== 1) + Number(dropRateMultiplier !== 2);

  const resetFilters = () => {
    setSectionId("All");
    setEpisode("All");
    setArea("All");
    setItemType("All");
    setItemQuery("");
    setEnemyQuery("");
    setPartySize(1);
    setDropRateMultiplier(2);
  };

  const partySelector = (compact = false) => (
    <div className={compact ? styles.quickPartyDar : styles.partyDarControl}>
      <div className={styles.partyDarLabel}>
        <span>Party size</span>
        <small>DAR multiplier: {Math.round(partyDarMultiplier * 100)}%</small>
      </div>
      <div className={styles.partyButtons} role="group" aria-label={compact ? "Quick party size" : "Party size for drop rate calculation"}>
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
        <span>Ultimate drop rate</span>
        <small>N/H/VH always x1 · x2 standard · x3 Happy Hour</small>
      </div>
      <div className={`${styles.partyButtons} ${styles.dropRateButtons}`} role="group" aria-label={compact ? "Quick Ultimate drop rate multiplier" : "Ultimate server drop rate multiplier"}>
        {DROP_RATE_MULTIPLIERS.map((value) => (
          <button key={value} type="button" className={dropRateMultiplier === value ? styles.partyActive : ""} aria-pressed={dropRateMultiplier === value} onClick={() => setDropRateMultiplier(value)}>
            x{value}
          </button>
        ))}
      </div>
    </div>
  );

  const quickControls = (mobile = false) => (
    <>
      <div className={styles.quickSearches}>
        <label>
          <span>Item name</span>
          <div className={styles.quickSearchInput}><span aria-hidden="true">⌕</span><input aria-label={mobile ? "Mobile item name" : "Quick item name"} value={itemQuery} onChange={(event) => setItemQuery(event.target.value)} placeholder="Item name" /></div>
        </label>
        <label>
          <span>Monster name</span>
          <div className={styles.quickSearchInput}><span aria-hidden="true">⌕</span><input aria-label={mobile ? "Mobile monster name" : "Quick monster name"} value={enemyQuery} onChange={(event) => setEnemyQuery(event.target.value)} placeholder="Monster name" /></div>
        </label>
      </div>
      <div className={styles.quickFilters}>
        <label><span>Section ID</span><select aria-label={mobile ? "Mobile Section ID" : "Quick Section ID"} value={sectionId} onChange={(event) => setSectionId(event.target.value)}><option>All</option>{SECTION_IDS.map((value) => <option key={value}>{value}</option>)}</select></label>
        <label><span>Episode</span><select aria-label={mobile ? "Mobile episode" : "Quick episode"} value={episode} onChange={(event) => setEpisode(event.target.value)}><option>All</option><option value="1">Episode 1</option><option value="2">Episode 2</option><option value="4">Episode 4</option></select></label>
        <label><span>Area</span><select aria-label={mobile ? "Mobile area" : "Quick area"} value={area} onChange={(event) => setArea(event.target.value)}><option>All</option>{areas.map((value) => <option key={value}>{value}</option>)}</select></label>
        <label><span>Item type</span><select aria-label={mobile ? "Mobile item type" : "Quick item type"} value={itemType} onChange={(event) => setItemType(event.target.value as "All" | ItemType)}>{ITEM_TYPES.map((value) => <option key={value}>{value}</option>)}</select></label>
      </div>
      <div className={styles.quickDifficulty} aria-label={mobile ? "Mobile difficulty" : "Quick difficulty"}>
        <span>Table difficulty</span>
        <div>{DIFFICULTIES.map((value) => <button key={value} type="button" className={difficulty === value ? styles.quickDifficultyActive : ""} onClick={() => setDifficulty(value)}>{value}</button>)}</div>
      </div>
      {partySelector(true)}
      {dropRateSelector(true)}
      <button className={styles.quickReset} type="button" onClick={resetFilters} disabled={activeFilterCount === 0}>Reset filters {activeFilterCount > 0 && <span>{activeFilterCount}</span>}</button>
    </>
  );

  return (
    <>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <h1 className={styles.siteLogo}>
            <a href="../index.html" aria-label="Destiny Guide home"><img src="../images/common/rogo.png" alt="Destiny Guide" /></a>
          </h1>
          <nav className={styles.headerMenus} aria-label="Main navigation">
            <div>
              <a href="../beginner_page.html">Beginner</a>
              <a href="../item_page.html">Destiny Items</a>
              <a href="../dmc_page.html">DMC Guide</a>
              <a href="../Psobb_tool.html">Tools</a>
            </div>
            <div className={styles.raidMenu}>
              <a href="../dn.html">Distorted Nightmare [RAID]</a>
              <a href="../discontrolled_tower_raid.html">The Discontrolled Tower [RAID]</a>
            </div>
          </nav>
          <div className={styles.headerActions}>
            <button className={styles.themeButton} type="button" onClick={updateTheme} aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`} aria-pressed={theme === "dark"}>
              <span className={styles.themeIcon} aria-hidden="true" />
              {theme === "dark" ? "Light" : "Dark"}
            </button>
            <a className={styles.discordLink} href="https://discord.gg/FesaarwjFn" target="_blank" rel="noreferrer" aria-label="Destiny Discord" />
            <a className={styles.dropTableLink} href="../drop-tables/" aria-current="page">Drop Tables</a>
            <a className={styles.dropTableLink} href="../database/">Database</a>
          </div>
        </div>
      </header>

      <section className={styles.matrixHero}>
        <p className={styles.eyebrow}>DESTINY PSOBB DATABASE</p>
        <h1>Drop Tables</h1>
        <p>Choose a difficulty, then read each monster across the ten Section IDs. Search results are highlighted and summarized above the original table layout.</p>
      </section>

      <section className={`${styles.explorer} ${showQuickControls ? styles.explorerQuickOpen : ""}`}>
        <div className={styles.controlsAnchor} ref={controlsAnchorRef}>
          <div className={styles.filterPanel}>
            <div className={styles.searchGrid}>
              <label>
                <span>Item name</span>
                <div className={styles.searchInput}><span aria-hidden="true">⌕</span><input value={itemQuery} onChange={(event) => setItemQuery(event.target.value)} placeholder="e.g. PGF, Heaven Striker" /></div>
              </label>
              <label>
                <span>Monster name</span>
                <div className={styles.searchInput}><span aria-hidden="true">⌕</span><input value={enemyQuery} onChange={(event) => setEnemyQuery(event.target.value)} placeholder="e.g. Olga Flow" /></div>
              </label>
            </div>
            <div className={styles.matrixFilters}>
              <label><span>Section ID</span><select value={sectionId} onChange={(event) => setSectionId(event.target.value)}><option>All</option>{SECTION_IDS.map((value) => <option key={value}>{value}</option>)}</select></label>
              <label><span>Episode</span><select value={episode} onChange={(event) => setEpisode(event.target.value)}><option>All</option><option value="1">Episode 1</option><option value="2">Episode 2</option><option value="4">Episode 4</option></select></label>
              <label><span>Area</span><select value={area} onChange={(event) => setArea(event.target.value)}><option>All</option>{areas.map((value) => <option key={value}>{value}</option>)}</select></label>
              <label><span>Item type</span><select value={itemType} onChange={(event) => setItemType(event.target.value as "All" | ItemType)}>{ITEM_TYPES.map((value) => <option key={value}>{value}</option>)}</select></label>
              <button className={styles.resetButton} type="button" onClick={resetFilters} disabled={activeFilterCount === 0}>Reset filters {activeFilterCount > 0 && <span>{activeFilterCount}</span>}</button>
            </div>
            <div className={styles.rateControls}>
              {partySelector()}
              {dropRateSelector()}
            </div>
          </div>

          <div className={styles.browseDifficulty}>
            <span>Browse original table</span>
            <p>N/H/VH use x1. Ultimate uses the selected x1/x2/x3 rate. Search always covers every difficulty.</p>
          </div>
          <div className={styles.difficultyBar} aria-label="Browse table by difficulty">
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
              <div><span>All difficulties</span><h2 id="drop-search-results">Related item information</h2></div>
              <strong>{searchResults.length.toLocaleString()} drops</strong>
            </header>
            {resultGroups.length > 0 ? (
              <div className={styles.resultItemGrid}>
                {resultGroups.map((group) => (
                  <article className={styles.resultItemCard} key={normalize(group.item)}>
                    <div className={styles.resultItemTitle}>
                      <span className={`${styles.typeIcon} ${styles[`type${group.itemType}`]}`}>{group.itemType.slice(0, 1)}</span>
                      <div><h3>{group.item}</h3><p>{group.itemType} · {group.records.length} location{group.records.length === 1 ? "" : "s"}</p></div>
                    </div>
                    <div className={styles.resultLocations}>
                      {group.records.map((record) => (
                        <div key={record.id}>
                          <span className={`${styles.sectionDot} ${styles[`section${record.sectionId}`]}`} />
                          <strong>{record.difficulty} · {record.sectionId}</strong>
                          <span>{record.enemy} · EP {record.episode} {record.area} · DAR {formatDar(record.dar * partyDarMultiplier)}% · x{serverDropMultiplier(record.difficulty)}</span>
                          <b>{formatRate(record.rate, record.denominator, combinedDropMultiplier(record.difficulty)) ?? "Special"}<small>{formatChance(getAdjustedDenominator(record.denominator, combinedDropMultiplier(record.difficulty)))}</small></b>
                        </div>
                      ))}
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className={styles.empty}><span>⌕</span><h2>No drops found</h2><p>Try a broader item or monster name.</p><button type="button" onClick={resetFilters}>Reset all filters</button></div>
            )}
          </section>
        )}

        <div className={styles.matrixSummary}>
          <span><strong>{visibleRows.length}</strong> monster rows</span>
        </div>

        {EPISODES.filter((value) => selectedEpisode === null || value === selectedEpisode).map((episodeNumber) => {
          const rows = visibleRows.filter((row) => row.episode === episodeNumber);
          if (rows.length === 0) return null;
          return (
            <section className={styles.episodeTable} key={episodeNumber}>
              <h2>{difficulty.toUpperCase()} <span>|</span> EPISODE {episodeNumber}</h2>
              <div className={styles.mobileSwipeHint} aria-label="Swipe left or right to view every Section ID">
                <span aria-hidden="true">←</span>
                <strong>Swipe left or right to view Section IDs</strong>
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
                    <span>Monster</span>
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
                  <thead className={styles.srOnlyTableHead}><tr><th>Monster</th>{displayedSections.map((value) => <th key={value}>{value}</th>)}</tr></thead>
                  <tbody>
                    {rows.map((row) => (
                      <tr key={row.id}>
                        <th scope="row"><strong>{row.enemy}</strong><span>DAR: {formatDar(row.dar * partyDarMultiplier)}%</span><small>Base {row.dar}% · {partySize}P · x{serverDropMultiplier(row.difficulty)} drops</small></th>
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
          <aside className={styles.desktopQuickPanel} aria-label="Quick drop table controls">
            <header><div><span>Quick controls</span><strong>Search & filter</strong></div><small>All difficulties search</small></header>
            <div className={styles.quickPanelBody}>{quickControls()}</div>
          </aside>
          <button className={styles.mobileQuickButton} type="button" onClick={() => setMobileControlsOpen(true)} aria-label="Open search and filters" aria-expanded={mobileControlsOpen}>
            <span aria-hidden="true">⌕</span><strong>Search<br />& Filter</strong>{activeFilterCount > 0 && <b>{activeFilterCount}</b>}
          </button>
        </>
      )}

      {mobileControlsOpen && (
        <div className={styles.mobileQuickBackdrop} role="presentation" onClick={() => setMobileControlsOpen(false)}>
          <aside className={styles.mobileQuickDrawer} role="dialog" aria-modal="true" aria-label="Search, filters and difficulty" onClick={(event) => event.stopPropagation()}>
            <header><div><span>Drop Tables</span><h2>Search & Filter</h2></div><button type="button" onClick={() => setMobileControlsOpen(false)} aria-label="Close search and filters">×</button></header>
            <div className={styles.quickPanelBody}>{quickControls(true)}</div>
          </aside>
        </div>
      )}
    </>
  );
}
