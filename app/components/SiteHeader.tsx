"use client";

import { useEffect, useRef, useState } from "react";
import { LanguageSwitcher, useI18n } from "../i18n/i18n";
import { HappyHourHeader } from "./HappyHourHeader";
import { SiteSearch } from "./SiteSearch";

/**
 * 사이트 헤더 — React 라우트용.
 *
 * 정적 페이지는 header.html 하나를 include.js 가 끼워 넣고, React 라우트(redeem /
 * database / drop-tables / calculator)는 이 파일을 쓴다. 즉 같은 헤더가 두 벌 있다.
 *
 * **이 파일은 header.html 의 사본이다.** 마크업 순서, class, i18n 키까지 그쪽과
 * 1:1 로 맞춰 둔다. 한쪽만 고치면 라우트마다 헤더가 달라 보이는데, 실제로 그렇게
 * 어긋난 적이 있다 — 이 헤더에 Updates · Mods · Data 메뉴가 통째로 빠져 있었고
 * Drop Tables / Database 는 드롭다운 대신 글자 링크로 툭 튀어나와 있었다.
 *
 * 헤더를 바꿀 일이 생기면 header.html 과 이 파일을 **같이** 고쳐야 한다.
 */

type SiteHeaderProps = {
  active?: "drop-tables" | "database" | "redeem" | "calculator";
  theme: "light" | "dark";
  onThemeToggle: () => void;
};

export function SiteHeader({ active, theme, onThemeToggle }: SiteHeaderProps) {
  const { t } = useI18n();
  const [menuOpen, setMenuOpen] = useState(false);
  const [compactNavigation, setCompactNavigation] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 1160px)");
    const sync = () => {
      setCompactNavigation(media.matches);
      setMenuOpen(false);
    };
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setMenuOpen(false);
      headerRef.current?.querySelectorAll("details[open]").forEach((details) => details.removeAttribute("open"));
    };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, []);

  useEffect(() => {
    const closeOutside = (event: PointerEvent) => {
      if (!(event.target instanceof Node) || headerRef.current?.contains(event.target)) return;
      setMenuOpen(false);
      headerRef.current?.querySelectorAll("details[open]").forEach((details) => details.removeAttribute("open"));
    };
    document.addEventListener("pointerdown", closeOutside);
    return () => document.removeEventListener("pointerdown", closeOutside);
  }, []);

  /** 드롭다운은 한 번에 하나만 열린다. include.js 의 site_nav_group 처리와 같은 규칙. */
  const closeSiblingGroups = (event: { currentTarget: HTMLDetailsElement }) => {
    if (!event.currentTarget.open) return;
    headerRef.current?.querySelectorAll(".site_nav_group[open]").forEach((details) => {
      if (details !== event.currentTarget) details.removeAttribute("open");
    });
  };

  const current = (key: NonNullable<SiteHeaderProps["active"]>) =>
    (active === key ? "page" : undefined);

  // include.js 는 현재 페이지를 담은 details 에 data-current 를 붙인다. 같게 맞춘다.
  const guidesCurrent = active === "redeem" ? "true" : undefined;
  const dataCurrent =
    active === "drop-tables" || active === "database" || active === "calculator" ? "true" : undefined;

  return (
    <header
      ref={headerRef}
      className="site-header"
      data-site-header
      data-menu-open={menuOpen ? "true" : "false"}
    >
      <div className="inner site_header_inner">
        <h1 className="logo site_header_logo">
          <a href="../index.html" className="black">
            <img src="../images/common/rogo.png" alt={t("header.logo.alt", "Destiny Guide home")} />
          </a>
        </h1>

        <nav
          className="site_nav_panel"
          id="site-navigation"
          aria-label={t("db.nav.aria", "Main navigation")}
          aria-hidden={compactNavigation && !menuOpen}
          inert={compactNavigation && !menuOpen}
          onClick={() => setMenuOpen(false)}
        >
          <a href="../beginner_page.html" className="site_nav_link">{t("header.nav.beginner", "Beginner")}</a>
          <a href="../item_page.html" className="site_nav_link">{t("header.nav.items", "Destiny Items")}</a>
          <a href="../class_builds.html" className="site_nav_link">{t("header.nav.builds", "Class Builds")}</a>
          <a href="../event_page.html" className="site_nav_link">{t("header.nav.events", "Events")}</a>
          {/* header.html 과 같이 번역 키를 두지 않는다. 어느 언어에서도 Updates 로 쓴다. */}
          <a href="../updates_page.html" className="site_nav_link">Updates</a>
          <a href="../endgame_page.html" className="site_nav_link">{t("header.nav.endgame", "Endgame")}</a>

          <details
            className="site_nav_group"
            data-current={guidesCurrent}
            onClick={(event) => event.stopPropagation()}
            onToggle={closeSiblingGroups}
          >
            <summary>{t("header.nav.guides", "Guides")}</summary>
            <div className="site_nav_menu" onClick={() => setMenuOpen(false)}>
              <a href="../quest_data_page.html">{t("header.nav.questData", "Quest Data")}</a>
              <a href="../enhance_page.html">{t("header.nav.enhance", "Enhancement")}</a>
              <a href="../recipe_page.html">{t("header.nav.recipes", "Item Combinations")}</a>
              <a href="../sectionid_page.html">{t("header.nav.sectionid", "Section ID Hunting")}</a>
              <a href="../economy_page.html">{t("header.nav.economy", "Shops")}</a>
              <a href="../system_page.html">{t("header.nav.systems", "Systems")}</a>
              <a href="../dmc_page.html">{t("header.nav.dmc", "DMC Guide")}</a>
              <a href="../Psobb_tool.html">{t("header.nav.tools", "Tools")}</a>
              <a href="../player_tools.html">{t("lab.t092", "Farming tools")}</a>
              <a href="../mods_page.html">{t("header.nav.mods", "Mods and Skins")}</a>
              <a href="../redeem/" aria-current={current("redeem")}>{t("header.nav.redeem", "Token Redeem")}</a>
            </div>
          </details>

          <details
            className="site_nav_group"
            onClick={(event) => event.stopPropagation()}
            onToggle={closeSiblingGroups}
          >
            <summary>{t("header.nav.raids", "Raids")}</summary>
            <div className="site_nav_menu" onClick={() => setMenuOpen(false)}>
              <a href="../dn.html">{t("header.nav.dn", "Distorted Nightmare [RAID]")}</a>
              <a href="../discontrolled_tower_raid.html">{t("header.nav.tower", "The Discontrolled Tower [RAID]")}</a>
              <a href="../predator_raid.html">{t("header.nav.predator", "The Ravenous Predator [RAID]")}</a>
              <a href="../tpd_page.html">{t("header.nav.tpd", "The Phantasmal Dimension")}</a>
            </div>
          </details>

          <details
            className="site_nav_group"
            data-current={dataCurrent}
            onClick={(event) => event.stopPropagation()}
            onToggle={closeSiblingGroups}
          >
            <summary>{t("header.nav.data", "Data")}</summary>
            <div className="site_nav_menu" onClick={() => setMenuOpen(false)}>
              <a href="../drop-tables/" aria-current={current("drop-tables")}>{t("header.link.dropTables", "Drop Tables")}</a>
              <a href="../database/" aria-current={current("database")}>{t("header.link.database", "Database")}</a>
              <a href="../calculator/" aria-current={current("calculator")}>{t("header.link.calculator", "Damage Calculator")}</a>
            </div>
          </details>

          <div className="site_header_mobile_links">
            <a href="../redeem/" className="site_nav_link" aria-current={current("redeem")}>{t("header.nav.redeem", "Token Redeem")}</a>
            <a href="https://discord.gg/FesaarwjFn" target="_blank" rel="noreferrer" className="site_nav_link">Discord</a>
          </div>
        </nav>

        <div className="site_header_actions">
          {/* 정적 페이지의 header.html 과 같은 자리. 순서도 맞춰 둔다. */}
          <SiteSearch />
          <HappyHourHeader />
          <LanguageSwitcher />
          <button
            className="theme_toggle"
            type="button"
            onClick={onThemeToggle}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            aria-pressed={theme === "dark"}
          >
            <span className="theme_toggle_label">
              {theme === "dark" ? t("header.theme.light", "Light") : t("header.theme.dark", "Dark")}
            </span>
          </button>
          <a className="discord site_header_external" href="https://discord.gg/FesaarwjFn" target="_blank" rel="noreferrer" aria-label="Destiny Discord" />
          <button className="site_nav_toggle" type="button" aria-controls="site-navigation" aria-expanded={menuOpen} onClick={() => setMenuOpen((open) => !open)}>
            {t("header.nav.menu", "Menu")}
          </button>
        </div>
      </div>
    </header>
  );
}
