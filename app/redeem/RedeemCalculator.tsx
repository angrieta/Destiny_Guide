"use client";

import { useEffect, useMemo, useState } from "react";
import { LanguageSwitcher, useI18n } from "../i18n/i18n";
import { HappyHourHeader } from "../components/HappyHourHeader";
import { useHeaderHeight } from "../components/useHeaderHeight";
import {
  ATTRIBUTE_BLOCK,
  BLOCK_TOKENS,
  HIT_BLOCK,
  MAX_ATTRIBUTE,
  MAX_HIT,
  MAX_SLOTS,
  PERCENT_KEYS,
  PERCENT_LABELS,
  PERCENT_SHORT,
  SWAP_TOKENS,
  buildMessage,
  emptyPercents,
  isBlank,
  leftoverTargets,
  parsePercents,
  planOrder,
} from "./order";
import type { OrderRow, PercentKey, Percents } from "./order";

import styles from "./redeem.module.css";

const THEME_KEY = "destiny-guide-theme";
const SIDES = ["before", "after"] as const;
type Side = (typeof SIDES)[number];

let nextId = 0;
function newRow(): OrderRow {
  nextId += 1;
  return { id: `row-${nextId}`, name: "", before: emptyPercents(), after: emptyPercents() };
}

export default function RedeemCalculator({ weaponNames }: { weaponNames: string[] }) {
  useHeaderHeight();
  const { t } = useI18n();
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [rows, setRows] = useState<OrderRow[]>(() => [newRow()]);
  const [guildCard, setGuildCard] = useState("");
  const [copied, setCopied] = useState(false);

  // Same storage key as every other page, so the choice survives moving between them.
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

  const applyTheme = (next: "light" | "dark") => {
    setTheme(next);
    window.localStorage.setItem(THEME_KEY, next);
    document.documentElement.dataset.theme = next;
    document.documentElement.style.colorScheme = next;
  };

  const plan = useMemo(() => planOrder(rows), [rows]);
  const message = useMemo(() => buildMessage(plan, guildCard), [plan, guildCard]);
  const targets = useMemo(
    () => [
      ...leftoverTargets(plan, plan.leftoverAttribute, "attribute"),
      ...leftoverTargets(plan, plan.leftoverHit, "hit"),
    ],
    [plan],
  );

  const rename = (id: string, name: string) => {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, name } : row)));
    setCopied(false);
  };

  const setSide = (id: string, side: Side, percents: Percents) => {
    setRows((current) => current.map((row) => (row.id === id ? { ...row, [side]: percents } : row)));
    setCopied(false);
  };

  // Every writer goes through the updater form. Reading `rows` from the render
  // closure loses edits when two boxes change before React re-renders, which is
  // easy to hit by tabbing through ten inputs quickly.
  const setCell = (id: string, side: Side, key: PercentKey, value: number) => {
    setRows((current) =>
      current.map((row) => (row.id === id ? { ...row, [side]: { ...row[side], [key]: value } } : row)),
    );
    setCopied(false);
  };

  const addLeftoverTo = (index: number, key: PercentKey, amount: number) => {
    setRows((current) =>
      current.map((row, position) =>
        position === index ? { ...row, after: { ...row.after, [key]: row.after[key] + amount } } : row,
      ),
    );
    setCopied(false);
  };

  const issueText: Record<string, { level: "error" | "warning"; text: string }> = {
    negative: {
      level: "error",
      text: t("redeem.issue.negative", "Percentages cannot be negative."),
    },
    slots: {
      level: "error",
      text: t(
        "redeem.issue.slots",
        `A weapon holds only ${MAX_SLOTS} percentages at once, hit included. Clear one before adding another.`,
      ),
    },
    attributeCap: {
      level: "error",
      text: t("redeem.issue.attributeCap", `No single attribute can go past ${MAX_ATTRIBUTE}%.`),
    },
    hitCap: {
      level: "error",
      text: t(
        "redeem.issue.hitCap",
        `Redeeming adds hit up to ${MAX_HIT}%. Higher hit only comes from a drop or a crate.`,
      ),
    },
    hitToAttribute: {
      level: "error",
      text: t(
        "redeem.issue.hitToAttribute",
        "Hit cannot be turned into attribute. Losing hit while gaining attribute is refused.",
      ),
    },
    deleteForHit: {
      level: "warning",
      text: t(
        "redeem.issue.deleteForHit",
        "Attribute is being deleted to free a slot for hit. That percentage is gone and cannot move to another weapon.",
      ),
    },
    deleteAttribute: {
      level: "warning",
      text: t(
        "redeem.issue.deleteAttribute",
        "Attribute is being deleted. It is gone and cannot move to another weapon.",
      ),
    },
    deleteHit: {
      level: "warning",
      text: t(
        "redeem.issue.deleteHit",
        "Hit is being deleted. It cannot move to attribute or to another weapon.",
      ),
    },
  };

  const issues = plan.rows.flatMap((row) =>
    row.issues.map((issue) => ({ row: row.display, ...issueText[issue.message] })),
  );
  const blocked = plan.errorCount > 0;
  const empty = plan.changedRows.length === 0;

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message);
      setCopied(true);
    } catch {
      setCopied(false);
    }
  };

  const renderSide = (row: OrderRow, side: Side) => (
    <div className={side === "before" ? styles.sideNow : styles.sideGoal}>
      <span>{side === "before" ? t("redeem.now", "Now") : t("redeem.goal", "Goal")}</span>
      <div className={styles.cells}>
        {PERCENT_KEYS.map((key) => (
          <label key={key} className={`${styles.cell} ${key === "hit" ? styles.cellHit : ""}`}>
            <span title={PERCENT_LABELS[key]}>{PERCENT_SHORT[key]}</span>
            <input
              type="number"
              min={0}
              max={key === "hit" ? MAX_HIT : MAX_ATTRIBUTE}
              step={5}
              value={row[side][key]}
              onFocus={(event) => event.currentTarget.select()}
              onPaste={(event) => {
                // A pasted "0/45/20/25" fills the whole group rather than one box.
                const parsed = parsePercents(event.clipboardData.getData("text"));
                if (!parsed) return;
                event.preventDefault();
                setSide(row.id, side, parsed);
              }}
              onChange={(event) => setCell(row.id, side, key, Math.trunc(Number(event.target.value) || 0))}
            />
          </label>
        ))}
      </div>
    </div>
  );

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
            <button
              className={styles.themeButton}
              type="button"
              onClick={() => applyTheme(theme === "dark" ? "light" : "dark")}
              aria-pressed={theme === "dark"}
            >
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
        <p className={styles.eyebrow}>{t("redeem.eyebrow", "REDEEM CALCULATOR")}</p>
        <h2>{t("redeem.title", "Count the tokens, then send the order.")}</h2>
        <p className={styles.heroCopy}>
          {t(
            "redeem.lead",
            "Staff ask you to do the arithmetic yourself and to write the order in one exact format, and they can refuse it if either is wrong. Enter what your weapons carry now and what you want them to carry, and this counts the blocks, catches the rules that get orders refused, and writes the message for you.",
          )}
        </p>
      </section>

      <main className={styles.grid}>
        <div className={styles.panel}>
          <h3>{t("redeem.weapons", "Weapons")}</h3>
          <p className={styles.hint}>
            {t(
              "redeem.weaponsHint",
              "Percentages read Native / A.Beast / Machine / Dark / Hit. You can paste a whole line such as 0/45/20/25 into any box and it fills the group.",
            )}
          </p>

          <div className={styles.rows}>
            {plan.rows.map((entry) => {
              const row = entry.row;
              const overSlots = entry.slots > MAX_SLOTS;
              const hasError = entry.issues.some((issue) => issue.level === "error");
              return (
                <div key={row.id} className={`${styles.row} ${hasError ? styles.rowInvalid : ""}`}>
                  <div className={styles.rowHead}>
                    <span className={styles.rowTag}>{entry.label}</span>
                    <label className={styles.rowName}>
                      <input
                        list="redeem-weapons"
                        placeholder={t("redeem.namePlaceholder", "Weapon name (optional)")}
                        value={row.name}
                        onChange={(event) => rename(row.id, event.target.value)}
                        aria-label={t("redeem.nameLabel", "Weapon name")}
                      />
                    </label>
                    <button
                      className={styles.rowDrop}
                      type="button"
                      onClick={() => {
                        setRows((current) => current.filter((item) => item.id !== row.id));
                        setCopied(false);
                      }}
                      disabled={rows.length === 1}
                      aria-label={t("redeem.removeRow", "Remove this weapon")}
                    >
                      ×
                    </button>
                  </div>

                  <div className={styles.pair}>
                    {renderSide(row, "before")}
                    <div className={styles.arrow} aria-hidden="true">
                      →
                    </div>
                    {renderSide(row, "after")}
                  </div>

                  <div className={styles.rowFoot}>
                    <span>
                      {t("redeem.attribute", "Attribute")}{" "}
                      <b>{entry.attributeAdded > 0 ? `+${entry.attributeAdded}%` : "—"}</b>
                    </span>
                    <span>
                      {t("redeem.hit", "Hit")} <b>{entry.hitAdded > 0 ? `+${entry.hitAdded}%` : "—"}</b>
                    </span>
                    <span
                      className={
                        overSlots ? styles.slotsOver : entry.slots === MAX_SLOTS ? styles.slotsFull : ""
                      }
                    >
                      {t("redeem.slots", "Slots")}{" "}
                      <b>
                        {entry.slots}/{MAX_SLOTS}
                      </b>
                    </span>
                    {entry.attributeFromLeftover > 0 && (
                      <span>
                        {t("redeem.usesLeftover", "Uses leftover")} <b>{entry.attributeFromLeftover}%</b>
                      </span>
                    )}
                    <span className={styles.rowCost}>
                      {entry.tokens > 0 ? `${entry.tokens} DT` : isBlank(row.after) ? "" : "0 DT"}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <button
            className={styles.addRow}
            type="button"
            onClick={() => {
              setRows((current) => [...current, newRow()]);
              setCopied(false);
            }}
          >
            + {t("redeem.addWeapon", "Add another weapon")}
          </button>

          <datalist id="redeem-weapons">
            {weaponNames.map((name) => (
              <option key={name} value={name} />
            ))}
          </datalist>

          <h3 className={styles.subhead}>{t("redeem.rules", "The rules this checks")}</h3>
          <ul className={styles.ruleList}>
            <li>
              {t(
                "redeem.rule.slots",
                `A weapon carries ${MAX_SLOTS} percentages at once and hit takes one of them, so a weapon already at 100/100/100 has no room for hit until you delete one.`,
              )}
            </li>
            <li>
              {t(
                "redeem.rule.convert",
                "Attribute and hit are separate purchases. Neither can be converted into the other.",
              )}
            </li>
            <li>
              {t(
                "redeem.rule.deleted",
                "Percentage you delete is gone. It cannot move to another weapon — unlike percentage left over from a block you paid for.",
              )}
            </li>
            <li>
              {t(
                "redeem.rule.caps",
                `Redeeming reaches ${MAX_ATTRIBUTE}% on an attribute and ${MAX_HIT}% on hit.`,
              )}
            </li>
          </ul>
        </div>

        <div className={styles.results}>
          <h3>{t("redeem.cost", "Cost")}</h3>
          <dl className={styles.costTable}>
            <div>
              <dt>{t("redeem.attribute", "Attribute")}</dt>
              <dd className={styles.blocks}>
                +{plan.attributeAdded}% · {plan.attributeBlocks}
                {t("redeem.blocksShort", " blk")} = {plan.attributeBought}%
              </dd>
              <dd className={styles.tokens}>{plan.attributeBlocks * BLOCK_TOKENS} DT</dd>
            </div>
            <div>
              <dt>{t("redeem.hit", "Hit")}</dt>
              <dd className={styles.blocks}>
                +{plan.hitAdded}% · {plan.hitBlocks}
                {t("redeem.blocksShort", " blk")} = {plan.hitBought}%
              </dd>
              <dd className={styles.tokens}>{plan.hitBlocks * BLOCK_TOKENS} DT</dd>
            </div>
            {plan.swapTokens > 0 && (
              <div>
                <dt>{t("redeem.swapOnly", "Swap only")}</dt>
                <dd className={styles.blocks}>
                  {plan.swapTokens / SWAP_TOKENS} × {SWAP_TOKENS} DT
                </dd>
                <dd className={styles.tokens}>{plan.swapTokens} DT</dd>
              </div>
            )}
            <div className={styles.costTotal}>
              <dt>{t("redeem.total", "Total")}</dt>
              <dd className={styles.blocks} />
              <dd className={styles.tokens}>{plan.tokens} DT</dd>
            </div>
          </dl>

          {plan.leftoverAttribute > 0 || plan.leftoverHit > 0 ? (
            <div className={styles.leftover}>
              <strong>
                {t("redeem.leftoverTitle", "Leftover")}{" "}
                {plan.leftoverAttribute > 0 &&
                  `${plan.leftoverAttribute}% ${t("redeem.attribute", "Attribute")}`}
                {plan.leftoverAttribute > 0 && plan.leftoverHit > 0 && " · "}
                {plan.leftoverHit > 0 && `${plan.leftoverHit}% ${t("redeem.hit", "Hit")}`}
              </strong>
              {t(
                "redeem.leftoverBody",
                "You are paying for this either way, so put it on another weapon in the same order rather than throwing it away.",
              )}
              {targets.length > 0 && (
                <div className={styles.leftoverList}>
                  {targets.map((target) => (
                    <button
                      key={`${target.index}-${target.key}`}
                      type="button"
                      onClick={() => addLeftoverTo(target.index, target.key, target.room)}
                    >
                      {target.display} · {PERCENT_LABELS[target.key]} +{target.room}%
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <p className={styles.leftoverOk}>
              {empty
                ? t("redeem.nothingYet", "Nothing to order yet.")
                : t("redeem.noWaste", "No leftover — every block you buy lands on a weapon.")}
            </p>
          )}

          {issues.length > 0 && (
            <ul className={styles.issueList}>
              {issues.map((issue, index) => (
                <li key={index} className={issue.level === "error" ? styles.issueError : styles.issueWarn}>
                  <b>{issue.row}</b> — {issue.text}
                </li>
              ))}
            </ul>
          )}

          <label className={styles.gcField}>
            <span>{t("redeem.gc", "Guild card number")}</span>
            <input
              inputMode="numeric"
              placeholder="42000000"
              value={guildCard}
              onChange={(event) => {
                setGuildCard(event.target.value.replace(/\D/g, ""));
                setCopied(false);
              }}
            />
          </label>
          <p className={styles.magNote}>
            {t(
              "redeem.gcNote",
              "Staff ask for this in the order. It stays in your browser — this page has no server and never puts it in the address bar.",
            )}
          </p>

          <div className={styles.outputHead}>
            <h4>{t("redeem.order", "Order to send")}</h4>
            <button className={styles.copy} type="button" onClick={copy} disabled={empty || blocked}>
              {copied ? t("redeem.copied", "Copied") : t("redeem.copy", "Copy")}
            </button>
          </div>
          {empty ? (
            <p className={styles.leftoverOk}>
              {t("redeem.orderEmpty", "Fill in a weapon and its goal to get the message.")}
            </p>
          ) : blocked ? (
            <p className={styles.leftoverOk}>
              {t("redeem.orderBlocked", "Fix the errors above and the message appears here.")}
            </p>
          ) : (
            <pre className={styles.output}>{message}</pre>
          )}

          <p className={styles.disclaimer}>
            {t(
              "redeem.disclaimer",
              `Blocks are ${ATTRIBUTE_BLOCK}% attribute or ${HIT_BLOCK}% hit for ${BLOCK_TOKENS} tokens, and one block can be split across weapons in the same order — that is how the staff example reaches +150% attribute and +80% hit for 90 tokens. Staff have the final say on any order.`,
            )}
          </p>
        </div>
      </main>
    </div>
  );
}
