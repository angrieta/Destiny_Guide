/**
 * 헤더 검색용 인덱스를 만든다.
 *
 * 왜 미리 만들어 두는가
 * ─────────────────────────────────────────────────────────────────────────
 * 검색창은 모든 페이지의 헤더에 있으므로 열자마자 결과가 나와야 한다.
 * database-*.json 다섯 개(약 360KB)를 매번 받아 파싱하면 첫 타이핑이 늦다.
 * 검색에 필요한 필드만 뽑아 하나로 합치면 90KB 정도로 줄고, 파싱도 한 번이면 끝난다.
 *
 * 두 곳에서 아이템을 모은다
 * ─────────────────────────────────────────────────────────────────────────
 *   1. data/database-*.json  — PlayPSO 미러. 원작 PSOBB 아이템 전부.
 *   2. scripts/destiny_catalog.js — 이 서버 전용 아이템. PlayPSO 에는 없다.
 * 플레이어가 실제로 찾는 건 2번 쪽이 많아서(ASTRAL SABER 등) 같은 이름이 겹치면
 * 2번을 남기고, 점수도 조금 올려 위에 뜨게 한다.
 *
 * id 는 반드시 app/database/data.ts 와 같아야 한다
 * ─────────────────────────────────────────────────────────────────────────
 * 결과를 /database/?item=<id> 로 보내 상세를 바로 연다. 그 id 를 만드는 규칙
 * (normalize -> slugify -> 중복 시 -2, -3)이 한 글자라도 어긋나면 링크가 조용히
 * 빈 화면이 된다. 아래 normalize/slugify/ALIASES 와 카테고리 순서는 data.ts 에서
 * 그대로 옮겨온 것이다. 한쪽을 고치면 반대쪽도 고친다.
 */

import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const projectRoot = process.cwd();
const OUTPUT = resolve(projectRoot, "data/search-index.json");

/** app/database/data.ts 의 sources 와 같은 순서여야 id 가 일치한다. */
const DATABASE_FILES = [
  "data/database-1.json",
  "data/database-2.json",
  "data/database-3.json",
  "data/database-4.json",
  "data/database-5.json",
];

const CATALOG_FILE = "scripts/destiny_catalog.js";

/** app/database/data.ts 의 ALIASES 와 동일. */
const ALIASES = [
  [/^s.?rank/i, "srank"],
  [/^dark flow$/i, "darkflow"],
  [/^dark meteor$/i, "darkmeteor"],
  [/^dark bridge$/i, "darkbridge"],
  [/^parasitic armor/i, "predator"],
];

const normalize = (value) =>
  String(value ?? "")
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const slugify = (value) => normalize(value).replace(/\s+/g, "-");

function buildAliases(name) {
  const matched = ALIASES.filter(([pattern]) => pattern.test(name)).map(([, alias]) => alias);
  // 약칭으로 부르는 무기가 많다. DARK FLOW -> df, MILLE MARTEAUX -> mm.
  const initials = name
    .split(/\s+/)
    .filter((word) => word.length > 1)
    .map((word) => word[0])
    .join("");
  if (initials.length >= 2) matched.push(initials.toLowerCase());
  return matched.join(" ");
}

const joinMeta = (...parts) => parts.filter((part) => part && part !== "-" && part !== "None").join(" · ");

/**
 * 결과 줄 아래에 붙는 한 줄. 카테고리마다 알아볼 수 있는 값이 다르다.
 * app/database/data.ts 의 PRIMARY_FIELDS 와 같은 필드를 고른다.
 * 무기만 Type/Special 로 충분하고, 방어구는 DFP/EVP, 유닛은 무엇을 얼마나 올리는지가 핵심이다.
 */
function itemMeta(categoryName, row) {
  const special = row.Special && row.Special !== "None" && row.Special !== "-" ? row.Special : "";
  const variant = (row.Description ?? "").match(/([A-Za-z0-9'! -]+?)\s+version\.?\s*$/)?.[1]?.trim() ?? "";

  if (categoryName === "Armor" || categoryName === "Shields") {
    const dfp = row["max-DFP"] ? "DFP " + row["max-DFP"] : "";
    const evp = row["max-EVP"] ? "EVP " + row["max-EVP"] : "";
    const level = row["Req Lv"] && row["Req Lv"] !== "-" ? "Lv " + row["Req Lv"] : "";
    return joinMeta(dfp, evp, level, variant);
  }

  if (categoryName === "Units") {
    return joinMeta(joinMeta(row["Stat Type"], row["Stat Amount"]).replace(" · ", " "), variant);
  }

  if (categoryName === "Mags") {
    return joinMeta(row["100PB Trigger"], row["Activation Chance"], variant);
  }

  return joinMeta(row.Type, special, variant);
}

/**
 * 사이트 안의 페이지 목록.
 *
 * 헤더 내비와 같은 i18n 키를 쓴다. 그래야 언어를 바꿨을 때 검색 결과의 제목이
 * 내비게이션에 적힌 이름과 어긋나지 않는다.
 *
 * /calculator 는 일부러 뺐다. app/calculator/page.tsx 가 robots noindex 이고
 * 내비에도 링크가 없는 비공개 페이지다. 검색으로 들어가는 길도 만들지 않는다.
 */
const PAGES = [
  { u: "index.html", g: "guide", t: "Home", k: "search.page.home", d: "End-game items, beginner route, character cards" },
  { u: "beginner_page.html", g: "guide", t: "Beginner", k: "header.nav.beginner", d: "Levelling route and first steps for new players" },
  { u: "item_page.html", g: "guide", t: "Destiny Items", k: "header.nav.items", d: "Destiny-only item catalog with filters" },
  { u: "class_builds.html", g: "guide", t: "Class Builds", k: "header.nav.builds", d: "Gear and unit setups for every class" },
  { u: "event_page.html", g: "guide", t: "Events", k: "header.nav.events", d: "Seasonal event archive: periods, new items, event quests, drop rates, shop trades, anniversary easter valentine halloween xmas summer" },
  { u: "endgame_page.html", g: "guide", t: "Quest Difficulty", k: "header.nav.endgame", d: "Quest difficulty list star rating raid VR test episode event, endgame contents" },
  { u: "quest_data_page.html", g: "guide", t: "Quest Data", k: "header.nav.questData", d: "Quest rewards, monster counts, and layouts" },
  { u: "enhance_page.html", g: "guide", t: "Enhancement", k: "header.nav.enhance", d: "Grinding, attributes, and weapon upgrades" },
  { u: "recipe_page.html", g: "guide", t: "Item Combinations", k: "header.nav.recipes", d: "Crafting recipes material lists combine ingredients reverse lookup what is this material for" },
  { u: "sectionid_page.html", g: "guide", t: "Section ID Hunting", k: "header.nav.sectionid", d: "What to farm for your Section ID exclusive drops best rates Viridia Greenill Skyly Bluefull Purplenum Pinkal Redria Oran Yellowboze Whitill" },
  { u: "economy_page.html", g: "guide", t: "Shops", k: "header.nav.economy", d: "Shop stock, currency, and trading" },
  { u: "system_page.html", g: "guide", t: "Systems", k: "header.nav.systems", d: "Server systems and rules unique to Destiny" },
  { u: "dmc_page.html", g: "guide", t: "DMC Guide", k: "header.nav.dmc", d: "Dark Matter Collection guide" },
  { u: "Psobb_tool.html", g: "tool", t: "Tools", k: "header.nav.tools", d: "Calculators and helper tools" },
  { u: "player_tools.html", g: "tool", t: "Farming tools", k: "lab.t092", d: "Monster counter and Happy Hour schedule" },
  { u: "player_tools.html#happy-schedule", g: "tool", t: "Happy Hour schedule", k: "search.page.happyHour", d: "Next Happy Hour window and countdown" },
  { u: "dn.html", g: "raid", t: "Distorted Nightmare [RAID]", k: "header.nav.dn", d: "Raid guide" },
  { u: "discontrolled_tower_raid.html", g: "raid", t: "The Discontrolled Tower [RAID]", k: "header.nav.tower", d: "Raid guide" },
  { u: "predator_raid.html", g: "raid", t: "The Ravenous Predator [RAID]", k: "header.nav.predator", d: "Raid guide" },
  { u: "tpd_page.html", g: "raid", t: "The Phantasmal Dimension", k: "header.nav.tpd", d: "Raid guide" },
  { u: "drop-tables/", g: "data", t: "Drop Tables", k: "header.link.dropTables", d: "Search drops by difficulty, Section ID, and area" },
  { u: "database/", g: "data", t: "Database", k: "header.link.database", d: "Every weapon, armor, shield, unit, and mag" },
  { u: "redeem/", g: "data", t: "Token Redeem", k: "header.nav.redeem", d: "Token cost calculator for redeemable weapons" },
];

/**
 * destiny_catalog.js 안의 아이템을 읽는다.
 *
 * 파일이 IIFE 라서 불러다 실행할 수 없다(즉시 DOM 을 건드린다). 대신 배열 리터럴
 * 구간만 잘라 id/name/type/category 를 훑는다. 항목 모양이 일정해서 이걸로 충분하다.
 * 형태가 바뀌어 개수가 뚝 떨어지면 실행부에서 경고를 낸다.
 */
async function readDestinyCatalog() {
  const source = await readFile(resolve(projectRoot, CATALOG_FILE), "utf8");
  const start = source.indexOf("const catalogItems = [");
  const end = source.indexOf("const normalizeName");
  if (start < 0 || end < 0 || end <= start) return [];

  const region = source.slice(start, end);
  const idPattern = /id:\s*"([^"]+)"/g;
  const entries = [];
  let match;

  while ((match = idPattern.exec(region))) {
    // 한 항목이 stats/combat/obtain 까지 포함해 길어서 넉넉히 잘라 읽는다.
    const block = region.slice(match.index, match.index + 1400);
    const name = block.match(/\n\s*name:\s*"([^"]*)"/)?.[1];
    if (!name) continue;
    entries.push({
      id: match[1],
      name,
      type: block.match(/\n\s*type:\s*"([^"]*)"/)?.[1] ?? "",
      category: block.match(/\n\s*category:\s*"([^"]*)"/)?.[1] ?? "",
    });
  }

  return entries;
}

export async function buildSearchIndex() {
  const items = [];
  /** 이름이 겹칠 때 Destiny 전용 항목을 남기려고 이미 담은 이름을 기억한다. */
  const takenNames = new Set();

  // 1) Destiny 전용 아이템 먼저. 겹치는 이름은 이쪽이 이긴다.
  const catalog = await readDestinyCatalog();
  for (const entry of catalog) {
    takenNames.add(normalize(entry.name));
    const aliases = buildAliases(entry.name);
    const badge = entry.category || "Destiny";
    items.push([
      entry.name,
      "item_page.html?item=" + entry.id,
      badge,
      // 방어구·실드는 category 와 type 이 같은 말이다("Shield · Shield"). 한 번만 보인다.
      entry.type === badge ? "" : joinMeta(entry.type),
      (normalize(entry.name) + " " + aliases + " " + normalize(entry.type) + " " + normalize(entry.category) + " destiny")
        .replace(/\s+/g, " ")
        .trim(),
      1,
      aliases,
    ]);
  }

  // 2) PlayPSO 미러. id 규칙은 app/database/data.ts 와 동일해야 한다.
  const seen = new Map();
  for (const file of DATABASE_FILES) {
    const category = JSON.parse(await readFile(resolve(projectRoot, file), "utf8"));

    for (const row of category.rows) {
      const name = (row.Name ?? "").trim();

      // 중복 번호는 건너뛴 항목까지 포함해 세야 data.ts 와 어긋나지 않는다.
      // 그래서 이 계산은 takenNames 검사보다 먼저 한다.
      const baseSlug = slugify(name) || "item-" + category.type;
      const occurrence = (seen.get(baseSlug) ?? 0) + 1;
      seen.set(baseSlug, occurrence);
      const id = occurrence === 1 ? baseSlug : baseSlug + "-" + occurrence;

      if (takenNames.has(normalize(name))) continue;

      // 같은 이름이 색만 다른 기념 장비가 있다. 결과 줄에서 구분되도록
      // 설명 끝의 "<name> version." 을 꼬리표로 남긴다. data.ts 의 variant 와 같은 규칙.
      const variant = (row.Description ?? "").match(/([A-Za-z0-9'! -]+?)\s+version\.?\s*$/)?.[1]?.trim() ?? "";
      const special = row.Special && row.Special !== "None" && row.Special !== "-" ? row.Special : "";
      const type = row.Type ?? row["Stat Type"] ?? "";
      const aliases = buildAliases(name);

      items.push([
        name,
        "database/?item=" + id,
        category.name,
        itemMeta(category.name, row),
        // 이름 외에 타입/스페셜/약칭까지 넣어 "charge dagger" 같은 질문도 걸리게 한다.
        (normalize(name) + " " + aliases + " " + normalize(type) + " " + normalize(special) + " " + normalize(variant))
          .replace(/\s+/g, " ")
          .trim(),
        0,
        aliases,
      ]);
    }
  }

  const payload = {
    schemaVersion: 2,
    // 원본이 갱신되면 같이 다시 만들어야 한다. build/prepare-static.mjs 가 매
    // 빌드마다 호출하므로 손으로 챙길 일은 없다.
    generatedAt: new Date().toISOString(),
    pages: PAGES,
    items,
  };

  await writeFile(OUTPUT, JSON.stringify(payload), "utf8");
  return { pages: PAGES.length, items: items.length, destinyItems: catalog.length };
}

if (process.argv[1]?.endsWith("build-search-index.mjs")) {
  const result = await buildSearchIndex();
  if (result.destinyItems < 50) {
    console.warn(
      "경고: destiny_catalog.js 에서 " + result.destinyItems + "개만 읽었습니다. " +
        "파일 구조가 바뀌었는지 readDestinyCatalog() 를 확인하세요.",
    );
  }
  console.log("search-index.json: " + result.items + " items (" + result.destinyItems + " Destiny), " + result.pages + " pages");
}
