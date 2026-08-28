"use client";

import { useEffect, useRef, useState } from "react";
import { LanguageSwitcher, useI18n } from "../i18n/i18n";
import { HappyHourHeader } from "./HappyHourHeader";
import { SiteSearch } from "./SiteSearch";

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

  return (
    <header ref={headerRef} className="site-header site_header_shell" data-menu-open={menuOpen ? "true" : "false"}>
      <div className="inner site_header_inner">
        <h1 className="logo site_header_logo">
          <a href="../index.html" aria-label={t("header.logo.alt", "Destiny Guide home")}>
            <img src="../images/common/rogo.png" alt="Destiny Guide" />
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
          <a href="../endgame_page.html" className="site_nav_link">{t("header.nav.endgame", "Endgame")}</a>

          <details className="site_nav_group" data-current={active === "redeem" ? "true" : undefined} onClick={(event) => event.stopPropagation()} onToggle={(event) => {
            if (!event.currentTarget.open) return;
            headerRef.current?.querySelectorAll(".site_nav_group[open]").forEach((details) => {
              if (details !== event.currentTarget) details.removeAttribute("open");
            });
          }}>
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
              <a href="../redeem/" aria-current={active === "redeem" ? "page" : undefined}>{t("header.nav.redeem", "Token Redeem")}</a>
            </div>
          </details>

          <details className="site_nav_group" onClick={(event) => event.stopPropagation()} onToggle={(event) => {
            if (!event.currentTarget.open) return;
            headerRef.current?.querySelectorAll(".site_nav_group[open]").forEach((details) => {
              if (details !== event.currentTarget) details.removeAttribute("open");
            });
          }}>
            <summary>{t("header.nav.raids", "Raids")}</summary>
            <div className="site_nav_menu" onClick={() => setMenuOpen(false)}>
              <a href="../dn.html">{t("header.nav.dn", "Distorted Nightmare [RAID]")}</a>
              <a href="../discontrolled_tower_raid.html">{t("header.nav.tower", "The Discontrolled Tower [RAID]")}</a>
              <a href="../predator_raid.html">{t("header.nav.predator", "The Ravenous Predator [RAID]")}</a>
              <a href="../tpd_page.html">{t("header.nav.tpd", "The Phantasmal Dimension")}</a>
            </div>
          </details>

          <div className="site_header_mobile_links">
            <a href="../drop-tables/" className="site_nav_link" aria-current={active === "drop-tables" ? "page" : undefined}>{t("header.link.dropTables", "Drop Tables")}</a>
            <a href="../database/" className="site_nav_link" aria-current={active === "database" ? "page" : undefined}>{t("header.link.database", "Database")}</a>
            <a href="../redeem/" className="site_nav_link" aria-current={active === "redeem" ? "page" : undefined}>{t("header.nav.redeem", "Token Redeem")}</a>
            <a href="https://discord.gg/FesaarwjFn" target="_blank" rel="noreferrer" className="site_nav_link">Discord</a>
          </div>
        </nav>

        <div className="site_header_actions">
          {/* 정적 페이지의 header.html 과 같은 자리. 순서도 맞춰 둔다. */}
          <SiteSearch />
          <HappyHourHeader />
          <a href="../drop-tables/" className="site_header_data_link site_header_external" aria-current={active === "drop-tables" ? "page" : undefined}>{t("header.link.dropTables", "Drop Tables")}</a>
          <a href="../database/" className="site_header_data_link site_header_external" aria-current={active === "database" ? "page" : undefined}>{t("header.link.database", "Database")}</a>
          <LanguageSwitcher />
          <button className="theme_toggle" type="button" onClick={onThemeToggle} aria-label={theme === "dark" ? t("header.theme.light", "Light mode") : t("header.theme.dark", "Dark mode")} aria-pressed={theme === "dark"}>
            <span className="theme_toggle_label">{theme === "dark" ? t("header.theme.lightShort", "Light") : t("header.theme.darkShort", "Dark")}</span>
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
