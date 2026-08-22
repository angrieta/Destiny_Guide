"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DatabaseItem, DatabasePayload, ItemCategory } from "./types";
import styles from "./database.module.css";
import { LanguageSwitcher, useI18n } from "../i18n/i18n";
import { HappyHourHeader } from "../components/HappyHourHeader";
import { useHeaderHeight } from "../components/useHeaderHeight";

const THEME_KEY = "destiny-guide-theme";
const PAGE_SIZE = 60;
const CATEGORIES: Array<"All" | ItemCategory> = ["All", "Weapons", "Armor", "Shields", "Units", "Mags"];
const LEVEL_CAPS = ["All", "20", "40", "60", "80", "100", "120", "150", "180", "200"];
const CATEGORY_LABELS: Record<string, string> = {
  All: "All",
  Weapons: "Weapons",
  Armor: "Armor",
  Shields: "Shields",
  Units: "Units",
  Mags: "Mags",
};

/** Kept live so the page can show today's check without a Pages rebuild. */
const STATUS_URL =
  "https://raw.githubusercontent.com/angrieta/Destiny_Guide/landing/data/database-sync-status.json";

type SortKey =
  | "name-asc"
  | "name-desc"
  | "level-asc"
  | "level-desc"
  | "atp-desc"
  | "ata-desc"
  | "dfp-desc"
  | "evp-desc";

const SORT_OPTIONS: Array<{ value: SortKey; label: string; categories?: ItemCategory[] }> = [
  { value: "name-asc", label: "Name A to Z" },
  { value: "name-desc", label: "Name Z to A" },
  { value: "level-asc", label: "Required Lv, low to high", categories: ["Armor", "Shields"] },
  { value: "level-desc", label: "Required Lv, high to low", categories: ["Armor", "Shields"] },
  { value: "atp-desc", label: "ATP, high to low", categories: ["Weapons"] },
  { value: "ata-desc", label: "ATA, high to low", categories: ["Weapons"] },
  { value: "dfp-desc", label: "DFP, high to low", categories: ["Armor", "Shields"] },
  { value: "evp-desc", label: "EVP, high to low", categories: ["Armor", "Shields"] },
];

const normalize = (value: string) =>
  value
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const CLASS_LABELS: Record<string, string> = {
  humar: "HUmar",
  hunewearl: "HUnewearl",
  hucast: "HUcast",
  hucaseal: "HUcaseal",
  ramar: "RAmar",
  ramarl: "RAmarl",
  racast: "RAcast",
  racaseal: "RAcaseal",
  fomar: "FOmar",
  fomarl: "FOmarl",
  fonewm: "FOnewm",
  fonewearl: "FOnewearl",
};

const formatClass = (value: string) => CLASS_LABELS[value.toLowerCase()] ?? value;

function formatTimestamp(value: string | null | undefined) {
  if (!value) return "unknown";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "unknown";
  return `${parsed.toISOString().slice(0, 10)} ${parsed.toISOString().slice(11, 16)} UTC`;
}

const DEFAULTS = {
  q: "",
  cat: "All" as "All" | ItemCategory,
  type: "All",
  special: "All",
  cls: "All",
  stat: "All",
  maxLv: "All",
  sort: "name-asc" as SortKey,
};

function canonicalOption(value: string | null, options: readonly string[]) {
  if (!value) return null;
  const normalized = value.toLocaleLowerCase("en-US");
  return options.find((option) => option.toLocaleLowerCase("en-US") === normalized) ?? null;
}

function supportsWeaponFilters(category: "All" | ItemCategory) {
  return category === "All" || category === "Weapons";
}

function supportsDefenceFilters(category: "All" | ItemCategory) {
  return category === "All" || category === "Armor" || category === "Shields";
}

function supportsUnitFilters(category: "All" | ItemCategory) {
  return category === "All" || category === "Units";
}

function supportsClassFilter(category: "All" | ItemCategory) {
  return category !== "Units";
}

function supportsSort(category: "All" | ItemCategory, sort: SortKey) {
  const option = SORT_OPTIONS.find((entry) => entry.value === sort);
  return Boolean(option && (!option.categories || category === "All" || option.categories.includes(category)));
}

export default function ItemDatabase({ payload }: { payload: DatabasePayload }) {
  useHeaderHeight();
  const { t } = useI18n();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [query, setQuery] = useState(DEFAULTS.q);
  const [category, setCategory] = useState<"All" | ItemCategory>(DEFAULTS.cat);
  const [weaponType, setWeaponType] = useState(DEFAULTS.type);
  const [special, setSpecial] = useState(DEFAULTS.special);
  const [playerClass, setPlayerClass] = useState(DEFAULTS.cls);
  const [statType, setStatType] = useState(DEFAULTS.stat);
  const [maxLevel, setMaxLevel] = useState(DEFAULTS.maxLv);
  const [sort, setSort] = useState<SortKey>(DEFAULTS.sort);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [liveCheckedAt, setLiveCheckedAt] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  const resultsRef = useRef<HTMLDivElement>(null);

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

  const restoreFromUrl = useCallback(() => {
    const params = new URLSearchParams(window.location.search);
    const readCategory = canonicalOption(params.get("cat"), CATEGORIES) as "All" | ItemCategory | null;
    const nextCategory = readCategory ?? DEFAULTS.cat;

    setQuery(params.get("q") ?? DEFAULTS.q);
    setCategory(nextCategory);
    setWeaponType(
      supportsWeaponFilters(nextCategory)
        ? (canonicalOption(params.get("type"), payload.weaponTypes) ?? DEFAULTS.type)
        : DEFAULTS.type,
    );
    setSpecial(
      supportsWeaponFilters(nextCategory)
        ? (canonicalOption(params.get("special"), payload.specials) ?? DEFAULTS.special)
        : DEFAULTS.special,
    );
    setPlayerClass(
      supportsClassFilter(nextCategory)
        ? (canonicalOption(params.get("class"), payload.classes) ?? DEFAULTS.cls)
        : DEFAULTS.cls,
    );
    setStatType(
      supportsUnitFilters(nextCategory)
        ? (canonicalOption(params.get("stat"), payload.unitStatTypes) ?? DEFAULTS.stat)
        : DEFAULTS.stat,
    );
    setMaxLevel(
      supportsDefenceFilters(nextCategory)
        ? (canonicalOption(params.get("lv"), LEVEL_CAPS) ?? DEFAULTS.maxLv)
        : DEFAULTS.maxLv,
    );

    const readSort = canonicalOption(
      params.get("sort"),
      SORT_OPTIONS.map((option) => option.value),
    ) as SortKey | null;
    setSort(readSort && supportsSort(nextCategory, readSort) ? readSort : DEFAULTS.sort);

    const readItem = params.get("item");
    setSelectedId(readItem && payload.items.some((item) => item.id === readItem) ? readItem : null);
  }, [payload.classes, payload.items, payload.specials, payload.unitStatTypes, payload.weaponTypes]);

  // Restore shared URLs and keep browser Back/Forward navigation in sync.
  useEffect(() => {
    restoreFromUrl();
    setHydrated(true);
    window.addEventListener("popstate", restoreFromUrl);
    return () => window.removeEventListener("popstate", restoreFromUrl);
  }, [restoreFromUrl]);

  // A no-change sync run only commits its status file, which never rebuilds Pages,
  // so read the current stamp straight from the branch.
  useEffect(() => {
    let cancelled = false;
    fetch(STATUS_URL, { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (!cancelled && data?.lastCheckedAt) setLiveCheckedAt(data.lastCheckedAt);
      })
      .catch(() => {
        // Offline or rate limited: the build-time stamp below stays visible.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const activeFilterCount =
    (query !== DEFAULTS.q ? 1 : 0) +
    (category !== DEFAULTS.cat ? 1 : 0) +
    (weaponType !== DEFAULTS.type ? 1 : 0) +
    (special !== DEFAULTS.special ? 1 : 0) +
    (playerClass !== DEFAULTS.cls ? 1 : 0) +
    (statType !== DEFAULTS.stat ? 1 : 0) +
    (maxLevel !== DEFAULTS.maxLv ? 1 : 0);

  // Mirror state into the URL so any view can be shared verbatim.
  useEffect(() => {
    if (!hydrated) return;
    const params = new URLSearchParams();
    if (query !== DEFAULTS.q) params.set("q", query);
    if (category !== DEFAULTS.cat) params.set("cat", category);
    if (weaponType !== DEFAULTS.type) params.set("type", weaponType);
    if (special !== DEFAULTS.special) params.set("special", special);
    if (playerClass !== DEFAULTS.cls) params.set("class", playerClass);
    if (statType !== DEFAULTS.stat) params.set("stat", statType);
    if (maxLevel !== DEFAULTS.maxLv) params.set("lv", maxLevel);
    if (sort !== DEFAULTS.sort) params.set("sort", sort);
    if (selectedId) params.set("item", selectedId);
    const search = params.toString();
    const nextUrl = `${window.location.pathname}${search ? `?${search}` : ""}${window.location.hash}`;
    window.history.replaceState(window.history.state, "", nextUrl);
  }, [hydrated, query, category, weaponType, special, playerClass, statType, maxLevel, sort, selectedId]);

  const searchTokens = useMemo(() => normalize(query).split(" ").filter(Boolean), [query]);

  const results = useMemo(() => {
    const filtered = payload.items.filter((item) => {
      if (category !== "All" && item.category !== category) return false;
      if (weaponType !== "All" && item.type !== weaponType) return false;
      if (special !== "All" && item.special !== special) return false;
      if (statType !== "All" && item.statType !== statType) return false;
      // A blank Class column means the item has no class restriction (all Units use this).
      if (playerClass !== "All" && item.classes.length > 0 && !item.classes.includes(playerClass)) return false;
      if (maxLevel !== "All") {
        const cap = Number(maxLevel);
        if (item.requiredLevel !== null && item.requiredLevel > cap) return false;
      }
      if (searchTokens.length > 0 && !searchTokens.every((token) => item.searchText.includes(token))) return false;
      return true;
    });

    const byNumber = (value: number | null) => (value === null ? Number.NEGATIVE_INFINITY : value);
    const sorted = [...filtered];
    switch (sort) {
      case "name-desc":
        sorted.sort((a, b) => b.name.localeCompare(a.name));
        break;
      case "level-asc":
        sorted.sort((a, b) => (a.requiredLevel ?? 0) - (b.requiredLevel ?? 0) || a.name.localeCompare(b.name));
        break;
      case "level-desc":
        sorted.sort((a, b) => (b.requiredLevel ?? 0) - (a.requiredLevel ?? 0) || a.name.localeCompare(b.name));
        break;
      case "atp-desc":
        sorted.sort((a, b) => byNumber(b.atp) - byNumber(a.atp) || a.name.localeCompare(b.name));
        break;
      case "ata-desc":
        sorted.sort((a, b) => byNumber(b.ata) - byNumber(a.ata) || a.name.localeCompare(b.name));
        break;
      case "dfp-desc":
        sorted.sort((a, b) => byNumber(b.dfp) - byNumber(a.dfp) || a.name.localeCompare(b.name));
        break;
      case "evp-desc":
        sorted.sort((a, b) => byNumber(b.evp) - byNumber(a.evp) || a.name.localeCompare(b.name));
        break;
      default:
        sorted.sort((a, b) => a.name.localeCompare(b.name));
    }
    return sorted;
  }, [payload.items, category, weaponType, special, statType, playerClass, maxLevel, searchTokens, sort]);

  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [category, weaponType, special, statType, playerClass, maxLevel, searchTokens, sort]);

  const selected = useMemo(
    () => payload.items.find((item) => item.id === selectedId) ?? null,
    [payload.items, selectedId],
  );

  useEffect(() => {
    if (!selected) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setSelectedId(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected]);

  const resetFilters = useCallback(() => {
    setQuery(DEFAULTS.q);
    setCategory(DEFAULTS.cat);
    setWeaponType(DEFAULTS.type);
    setSpecial(DEFAULTS.special);
    setPlayerClass(DEFAULTS.cls);
    setStatType(DEFAULTS.stat);
    setMaxLevel(DEFAULTS.maxLv);
    setSort(DEFAULTS.sort);
  }, []);

  const selectCategory = useCallback((nextCategory: "All" | ItemCategory) => {
    setCategory(nextCategory);

    // Never leave a filter active after its control disappears from the new category.
    if (!supportsWeaponFilters(nextCategory)) {
      setWeaponType(DEFAULTS.type);
      setSpecial(DEFAULTS.special);
    }
    if (!supportsDefenceFilters(nextCategory)) setMaxLevel(DEFAULTS.maxLv);
    if (!supportsUnitFilters(nextCategory)) setStatType(DEFAULTS.stat);
    if (!supportsClassFilter(nextCategory)) setPlayerClass(DEFAULTS.cls);
    setSort((current) => (supportsSort(nextCategory, current) ? current : DEFAULTS.sort));
  }, []);

  // Only offer filters that mean something for the current category.
  const showWeaponFilters = supportsWeaponFilters(category);
  const showDefenceFilters = supportsDefenceFilters(category);
  const showUnitFilters = supportsUnitFilters(category);
  const showClassFilter = supportsClassFilter(category);
  const showLevelSortShortcuts = category === "Armor" || category === "Shields";

  const availableSorts = useMemo(
    () => SORT_OPTIONS.filter((option) => supportsSort(category, option.value)),
    [category],
  );

  useEffect(() => {
    if (!availableSorts.some((option) => option.value === sort)) setSort(DEFAULTS.sort);
  }, [availableSorts, sort]);

  const checkedAt = liveCheckedAt ?? payload.syncStatus.lastCheckedAt;

  // A guard rather than a real state: the payload is baked in at build time, so an
  // empty one means the committed JSON is broken and every filter below would lie.
  if (payload.items.length === 0) {
    return (
      <div className={styles.pageShell}>
        <main className={styles.explorer}>
          <div className={styles.emptyState}>
            <strong>{t("db.error.title", "Unable to load database.")}</strong>
            <p>
              {t("db.error.note", "The item data could not be read. Please try again later, or check the")}{" "}
              <a href={payload.sourceUrl} target="_blank" rel="noreferrer">
                {t("db.error.source", "original source")}
              </a>
              .
            </p>
          </div>
        </main>
      </div>
    );
  }

  const filterControls = (
    <>
      {showWeaponFilters && (
        <label>
          <span>{t("db.filter.weaponType", "Weapon type")}</span>
          <select value={weaponType} onChange={(event) => setWeaponType(event.target.value)}>
            <option value="All">{t("db.filter.allTypes", "All types")}</option>
            {payload.weaponTypes.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
      )}
      {showWeaponFilters && (
        <label>
          <span>{t("db.filter.special", "Special")}</span>
          <select value={special} onChange={(event) => setSpecial(event.target.value)}>
            <option value="All">{t("db.filter.anySpecial", "Any special")}</option>
            {payload.specials.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
      )}
      {showUnitFilters && (
        <label>
          <span>{t("db.filter.unitStat", "Unit stat")}</span>
          <select value={statType} onChange={(event) => setStatType(event.target.value)}>
            <option value="All">{t("db.filter.anyStat", "Any stat")}</option>
            {payload.unitStatTypes.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
        </label>
      )}
      {showDefenceFilters && (
        <label>
          <span>{t("db.filter.levelCap", "Required Lv up to")}</span>
          <select value={maxLevel} onChange={(event) => setMaxLevel(event.target.value)}>
            {LEVEL_CAPS.map((value) => (
              <option key={value} value={value}>
                {value === "All"
                  ? t("db.filter.anyLevel", "Any level")
                  : t("db.filter.levelUpTo", "Up to Lv {n}").replace("{n}", value)}
              </option>
            ))}
          </select>
        </label>
      )}
      {showClassFilter && (
        <label>
          <span>{t("db.filter.class", "Class")}</span>
          <select value={playerClass} onChange={(event) => setPlayerClass(event.target.value)}>
            <option value="All">{t("db.filter.anyClass", "Any class")}</option>
            {payload.classes.map((value) => (
              <option key={value} value={value}>
                {formatClass(value)}
              </option>
            ))}
          </select>
        </label>
      )}
      <label>
        <span>{t("db.filter.sort", "Sort by")}</span>
        <select value={sort} onChange={(event) => setSort(event.target.value as SortKey)}>
          {availableSorts.map((option) => (
            <option key={option.value} value={option.value}>
              {t(`db.sort.${option.value}`, option.label)}
            </option>
          ))}
        </select>
      </label>
    </>
  );

  return (
    <div className={styles.pageShell}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <h1 className={styles.siteLogo}>
            <a href="../index.html" aria-label={t("header.logo.alt", "Destiny Guide")}>
              <img src="../images/common/rogo.png" alt="Destiny Guide" />
            </a>
          </h1>
          <nav className={styles.headerMenus} aria-label={t("db.nav.aria", "Main navigation")}>
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
            </div>
            <div className={styles.raidMenu}>
              <a href="../dn.html">Distorted Nightmare [RAID]</a>
              <a href="../discontrolled_tower_raid.html">The Discontrolled Tower [RAID]</a>
              <a href="../predator_raid.html">The Ravenous Predator [RAID]</a>
              <a href="../tpd_page.html">The Phantasmal Dimension</a>
            </div>
          </nav>
          <div className={styles.headerActions}>
            <button
              className={styles.themeButton}
              type="button"
              onClick={updateTheme}
              aria-label={theme === "dark" ? t("header.theme.light", "Light mode") : t("header.theme.dark", "Dark mode")}
              aria-pressed={theme === "dark"}
            >
              <span className={styles.themeIcon} aria-hidden="true" />
              <span className={styles.themeLabel}>
                {theme === "dark" ? t("header.theme.lightShort", "Light") : t("header.theme.darkShort", "Dark")}
              </span>
            </button>
            <a
              className={styles.discordLink}
              href="https://discord.gg/FesaarwjFn"
              target="_blank"
              rel="noreferrer"
              aria-label="Destiny Discord"
            />
            <a className={styles.navLink} href="../drop-tables/">
              {t("header.link.dropTables", "Drop Tables")}
            </a>
            <a className={styles.navLinkActive} href="../database/" aria-current="page">
              {t("header.link.database", "Database")}
            </a>
            <a className={styles.navLink} href="../calculator/">
              {t("header.link.calculator", "Calculator")}
            </a>
            <LanguageSwitcher />
            <HappyHourHeader />
          </div>
        </div>
      </header>

      <section className={styles.hero}>
        <div>
          <p className={styles.eyebrow}>{t("db.hero.eyebrow", "ITEM DATABASE")}</p>
          <h2>{t("db.hero.title", "Every Destiny item, one search away.")}</h2>
          <p className={styles.heroCopy}>
            {t("db.hero.lead", "Weapons, armor, shields, units, and mags mirrored from PlayPSO and rebuilt for fast lookup. Filter by what you actually care about, then share the exact view you are looking at.")}
          </p>
        </div>
        <div className={styles.heroStats}>
          <div>
            <strong>{payload.items.length.toLocaleString("en-US")}</strong>
            <span>{t("db.stat.items", "Items")}</span>
          </div>
          <div>
            <strong>{payload.categories.length}</strong>
            <span>{t("db.stat.categories", "Categories")}</span>
          </div>
          <div>
            <strong>{formatTimestamp(checkedAt).slice(0, 10)}</strong>
            <span>{t("db.stat.checked", "Last checked")}</span>
          </div>
        </div>
      </section>

      <main className={styles.explorer}>
        <div className={styles.searchBar}>
          <div className={styles.searchInput}>
            <span aria-hidden="true">⌕</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("db.search.hint", "Search items... try dark flow, DF, or Katana")}
              aria-label={t("db.search.aria", "Search items")}
            />
            {query && (
              <button type="button" onClick={() => setQuery("")} aria-label={t("db.search.clear", "Clear search")}>
                ×
              </button>
            )}
          </div>
          <button
            className={styles.filterToggle}
            type="button"
            onClick={() => setFiltersOpen(true)}
            aria-label={t("db.filters.open", "Open filters")}
          >
            {t("db.filters.label", "Filters")}
            {activeFilterCount > 0 && <em>{activeFilterCount}</em>}
          </button>
        </div>

        <div className={styles.categoryTabs} role="tablist" aria-label={t("db.category.aria", "Item category")}>
          {CATEGORIES.map((value) => {
            const count =
              value === "All"
                ? payload.items.length
                : (payload.categories.find((entry) => entry.name === value)?.count ?? 0);
            return (
              <button
                key={value}
                type="button"
                role="tab"
                aria-selected={category === value}
                className={category === value ? styles.categoryActive : undefined}
                onClick={() => selectCategory(value)}
              >
                {value === "All" ? t("db.category.all", "All") : CATEGORY_LABELS[value]}
                <em>{count.toLocaleString("en-US")}</em>
              </button>
            );
          })}
        </div>

        <div className={styles.filterPanel}>{filterControls}</div>

        <div className={styles.resultBar} ref={resultsRef}>
          <p>
            <strong>{results.length.toLocaleString("en-US")}</strong>
            {results.length === payload.items.length ? ` ${t("db.stat.items", "Items")}` : ` ${t("db.results.label", "Results")}`}
          </p>
          <div className={styles.resultActions}>
            {showLevelSortShortcuts && (
              <div className={styles.levelSort} role="group" aria-label={t("db.sort.levelGroup", "Level sorting")}>
                <button
                  type="button"
                  className={sort === "level-asc" ? styles.levelSortActive : undefined}
                  aria-pressed={sort === "level-asc"}
                  onClick={() => setSort("level-asc")}
                >
                  {t("db.sort.level-asc-short", "Lv low to high")}
                </button>
                <button
                  type="button"
                  className={sort === "level-desc" ? styles.levelSortActive : undefined}
                  aria-pressed={sort === "level-desc"}
                  onClick={() => setSort("level-desc")}
                >
                  {t("db.sort.level-desc-short", "Lv high to low")}
                </button>
              </div>
            )}
            <button
              type="button"
              className={activeFilterCount > 0 ? styles.resetActive : styles.reset}
              onClick={resetFilters}
              disabled={activeFilterCount === 0}
            >
              {t("db.filters.reset", "Reset Filters")}
            </button>
          </div>
        </div>

        {results.length === 0 ? (
          <div className={styles.emptyState}>
            <strong>{t("db.empty.title", "No items found")}</strong>
            <p>{t("db.empty.note", "Try changing your search or filters.")}</p>
            <button type="button" onClick={resetFilters}>
              {t("db.filters.reset", "Reset Filters")}
            </button>
          </div>
        ) : (
          <>
            <ul className={styles.itemList}>
              {results.slice(0, visible).map((item) => (
                <li key={item.id}>
                  <button type="button" onClick={() => setSelectedId(item.id)}>
                    <div className={styles.itemHead}>
                      <strong>{item.name}</strong>
                      <div className={styles.itemMeta}>
                        <span className={styles.categoryChip}>{item.type ?? item.category}</span>
                        {item.variant && <span className={styles.variantChip}>{item.variant}</span>}
                        {item.requiredLevel !== null && item.requiredLevel > 1 && (
                          <span>{t("db.item.requiredLv", "Required Lv.")} {item.requiredLevel}</span>
                        )}
                        {item.requiredText && <span>{item.requiredText}</span>}
                      </div>
                    </div>
                    <dl className={styles.itemStats}>
                      {item.primaryStats.map((stat) => (
                        <div key={stat.label}>
                          <dt>{stat.label}</dt>
                          <dd>{stat.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </button>
                </li>
              ))}
            </ul>
            {visible < results.length && (
              <button
                className={styles.loadMore}
                type="button"
                onClick={() => setVisible((current) => current + PAGE_SIZE)}
              >
                {t("db.more", "Show {n} more").replace("{n}", String(Math.min(PAGE_SIZE, results.length - visible)))}
                <em>
                  {t("db.more.count", "{a} of {b}").replace("{a}", visible.toLocaleString("en-US")).replace("{b}", results.length.toLocaleString("en-US"))}
                </em>
              </button>
            )}
          </>
        )}

        <footer className={styles.sourceNote}>
          <p>
            {t("db.footer.mirrored", "Data mirrored from")}{" "}
            <a href={payload.sourceUrl} target="_blank" rel="noreferrer">
              playpso.net/database
            </a>
            .
          </p>
          <p>
            {t("db.footer.lastCheck", "Last automatic check:")} <strong>{formatTimestamp(checkedAt)}</strong>
            {payload.syncStatus.lastChangedAt && (
              <> · {t("db.footer.lastChange", "last content change:")} {formatTimestamp(payload.syncStatus.lastChangedAt)}</>
            )}
          </p>
        </footer>
      </main>

      {filtersOpen && (
        <div className={styles.sheetBackdrop} onClick={() => setFiltersOpen(false)} role="presentation">
          <div
            className={styles.sheet}
            role="dialog"
            aria-modal="true"
            aria-label={t("db.filters.label", "Filters")}
            onClick={(event) => event.stopPropagation()}
          >
            <header>
              <h3>{t("db.filters.label", "Filters")}</h3>
              <button type="button" onClick={() => setFiltersOpen(false)} aria-label={t("db.filters.close", "Close filters")}>
                ×
              </button>
            </header>
            <div className={styles.sheetBody}>{filterControls}</div>
            <div className={styles.sheetActions}>
              <button type="button" onClick={resetFilters} disabled={activeFilterCount === 0}>
                {t("db.filters.resetShort", "Reset")}
              </button>
              <button type="button" className={styles.sheetPrimary} onClick={() => setFiltersOpen(false)}>
                {t("db.filters.show", "Show {n} results").replace("{n}", results.length.toLocaleString("en-US"))}
              </button>
            </div>
          </div>
        </div>
      )}

      {selected && <ItemDetail item={selected} onClose={() => setSelectedId(null)} />}
    </div>
  );
}

function ItemDetail({ item, onClose }: { item: DatabaseItem; onClose: () => void }) {
  const { t } = useI18n();
  return (
    <div className={styles.detailBackdrop} onClick={onClose} role="presentation">
      <aside
        className={styles.detail}
        role="dialog"
        aria-modal="true"
        aria-label={item.name}
        onClick={(event) => event.stopPropagation()}
      >
        <header>
          <div>
            <p className={styles.detailCategory}>
              {item.category}
              {item.type ? ` · ${item.type}` : ""}
              {item.variant ? ` · ${item.variant}` : ""}
            </p>
            <h3>{item.name}</h3>
          </div>
          <button type="button" onClick={onClose} aria-label={t("db.detail.close", "Close item details")}>
            ×
          </button>
        </header>

        <div className={styles.detailBody}>
          {item.description && <p className={styles.detailDescription}>{item.description}</p>}

          {item.allStats.length > 0 && (
            <section>
              <h4>{t("db.detail.stats", "Stats")}</h4>
              <dl className={styles.detailStats}>
                {item.allStats.map((stat) => (
                  <div key={stat.label}>
                    <dt>{stat.label}</dt>
                    <dd>{stat.value}</dd>
                  </div>
                ))}
              </dl>
            </section>
          )}

          {item.boosts && (
            <section>
              <h4>{t("db.detail.boosts", "Boosts")}</h4>
              <p>{item.boosts}</p>
            </section>
          )}

          {item.notes && (
            <section>
              <h4>{t("db.detail.notes", "Notes")}</h4>
              <p>{item.notes}</p>
            </section>
          )}

          {item.classes.length > 0 && (
            <section>
              <h4>{t("db.detail.classes", "Equippable by")}</h4>
              <div className={styles.classList}>
                {item.classes.map((entry) => (
                  <span key={entry}>{formatClass(entry)}</span>
                ))}
              </div>
            </section>
          )}
        </div>
      </aside>
    </div>
  );
}
