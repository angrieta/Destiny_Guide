/**
 * 헤더 검색용 인덱스를 만든다.
 *
 * 왜 미리 만들어 두는가
 * ─────────────────────────────────────────────────────────────────────────
 * 검색창은 모든 페이지의 헤더에 있으므로 열자마자 결과가 나와야 한다.
 * DB 설명, 아이템 카탈로그, 드랍 표와 다국어 키워드를 하나의 색인으로 만든다.
 * 브라우저에서는 검색을 열 때 한 번만 받아 공통 검색 엔진으로 조회한다.
 *
 * 세 곳에서 검색 데이터를 모은다
 * ─────────────────────────────────────────────────────────────────────────
 *   1. data/database-*.json  — PlayPSO 미러. 원작 PSOBB 아이템 전부.
 *   2. scripts/destiny_catalog.js — 서버 전용 아이템 안내.
 *   3. data/drop-tables-*.json — 난이도/에피소드/몬스터/섹션/기본 드랍률.
 * 같은 이름이어도 DB 상세와 전용 가이드는 둘 다 보존한다.
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
import { readDestinyCatalog } from "./lib/catalog-data.mjs";
import { withVerifiedRows } from "./lib/verified-database.mjs";
import { expandSearchText } from "./search-engine.mjs";

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
  const cleanInitials = normalize(name).split(/\s+/).map(word=>word[0]).join("");
  if (cleanInitials.length >= 2) matched.push(cleanInitials);
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
    const stat = row["Stat Type"] !== "N/A" ? joinMeta(row["Stat Type"], row["Stat Amount"]).replace(" · ", " ") : "";
    const effect = row.Boosts && row.Boosts !== "None" ? row.Boosts : row.Notes || "";
    return joinMeta(stat,effect,variant).slice(0,170);
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
  { u: "start_here.html", g: "guide", t: "First 30 minutes", k: "start.title", d: "install launcher beginner first steps returning new player 설치 시작 복귀" },
  { u: "starlight_raid.html", g: "guide", t: "The Starlight Tower", k: "starlight.title", d: "Administrator raid Divine Field Divine Blade Thunder Labyrinth Sigma Cyclonic Wave Divine Reckoning starlight 타워 관리자 레이드" },
  { u: "help_page.html", g: "guide", t: "Commands & FAQ", k: "help.title", d: "commands help Excalibur Hit TJS Lame unseal MAG invincibility bank roominfo daily hh lobby HP material reset 명령어 해방 강화 실패" },
  { u: "recipe_page.html?target=phantasmal-ore-syncesta#planner", g: "guide", t: "Phantasmal Ore Syncesta → Alternative Cannon", d: "planned recipe Millennium Photon Core chaos engine Syncesta Double Cannon materials 광석 조합 예정" },
  { u: "recipe_page.html?target=astral-ore-iritista#planner", g: "guide", t: "Astral Ore Iritista → Astral Blade", d: "planned recipe Millennium Photon Core Iritista Last Emperor materials 광석 조합 예정" },
  { u: "index.html", g: "guide", t: "Home", k: "search.page.home", d: "End-game items, beginner route, character cards" },
  { u: "beginner_page.html", g: "guide", t: "Beginner", k: "header.nav.beginner", d: "Levelling route and first steps for new players" },
  { u: "item_page.html", g: "guide", t: "Destiny Items", k: "header.nav.items", d: "Destiny-only item catalog with filters" },
  { u: "class_builds.html", g: "guide", t: "Class Builds", k: "header.nav.builds", d: "Gear and unit setups for every class" },
  { u: "pb_guide.html", g: "guide", t: "PB Management", k: "header.nav.pb", d: "PB Flow MAG invincibility juggling 97 99 Berdysh Dragon Sword TJS weapon swap" },
  { u: "event_page.html", g: "guide", t: "Events", k: "header.nav.events", d: "Seasonal event archive: periods, new items, event quests, drop rates, shop trades, anniversary easter valentine halloween xmas summer" },
  { u: "updates_page.html", g: "guide", t: "Latest Updates", d: "Current patch 0.944 September roadmap Soul Eraser Miracle Chain Aegis of Isolation Madam's Bracelet Lightning Garment" },
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
 * DOM 코드 직전의 데이터와 헬퍼 함수만 분리하여 제한된 컨텍스트에서 평가한다.
 * 배열 경계나 필수 필드가 달라지면 누락된 색인을 만들지 않고 빌드를 중단한다.
 */
async function readDropIndex() {
  const drops = [];
  let sourceRows = 0;
  for (const difficulty of [0,1,2,3]) {
    const table = JSON.parse(await readFile(resolve(projectRoot, "data/drop-tables-"+difficulty+".json"),"utf8"));
    for (const episode of table.episodes) for (const [enemy, dar, cells] of episode.rows) {
      const groups = new Map();
      for (const [section, item, rate] of cells) {
        if (!item || item.toLowerCase() === "no item") continue;
        sourceRows++;
        const key = JSON.stringify([item,rate]);
        if (!groups.has(key)) groups.set(key,{item,rate,sections:[]});
        groups.get(key).sections.push(section);
      }
      for (const {item,rate,sections} of groups.values()) {
        const params = new URLSearchParams({item,enemy,difficulty:table.name,episode:String(episode.episode)});
        if (sections.length===1) params.set("section",sections[0]);
        const aliases = buildAliases(item);
        const meta = table.name+" · EP"+episode.episode+" · "+enemy+" · "+sections.join(" / ")+" · "+(rate || "—");
        drops.push([item,"drop-tables/?"+params.toString(),"Drops",meta,
          expandSearchText(item+" "+aliases+" "+meta+" drops monster section id dar "+dar+" "+(difficulty===2?"vh":"")+" episode "+episode.episode),
          0,aliases,sections]);
      }
    }
  }
  return {drops,sourceRows};
}

export async function buildSearchIndex() {
  const items = [];
  const verified = JSON.parse(await readFile(resolve(projectRoot, 'data/verified-content.json'), 'utf8'));
  const guideNotes = JSON.parse(await readFile(resolve(projectRoot,"data/item-notes.json"),"utf8")).notes || {};

  // 1) Destiny 전용 아이템 안내. 같은 이름의 DB 항목도 아래에서 보존한다.
  const catalog = await readDestinyCatalog();
  for (const entry of catalog) {
    const aliases = [buildAliases(entry.name), ...(entry.aliases || [])].join(" ");
    const badge = entry.category || "Destiny";
    items.push([
      entry.name,
      "item_page.html?item=" + entry.id,
      badge,
      // 방어구·실드는 category 와 type 이 같은 말이다("Shield · Shield"). 한 번만 보인다.
      entry.type === badge ? "" : joinMeta(entry.type),
      expandSearchText([entry.name,aliases,entry.type,entry.category,"destiny",
        entry.summary,...(entry.stats || []).flat(),...(entry.combat || []),...(entry.obtain || []),...(entry.required || [])].join(" ")),
      1,
      aliases,
    ]);
  }

  // 2) PlayPSO 미러. id 규칙은 app/database/data.ts 와 동일해야 한다.
  const seen = new Map();
  for (const file of DATABASE_FILES) {
    const category = withVerifiedRows(JSON.parse(await readFile(resolve(projectRoot, file), "utf8")), verified);

    for (const row of category.rows) {
      const name = (row.Name ?? "").trim();

      // 중복 번호는 모든 행을 같은 순서로 세야 data.ts 와 일치한다.
      const baseSlug = slugify(name) || "item-" + category.type;
      const occurrence = (seen.get(baseSlug) ?? 0) + 1;
      seen.set(baseSlug, occurrence);
      const id = occurrence === 1 ? baseSlug : baseSlug + "-" + occurrence;

      const patch = verified.items.find(item => item.database?.row.Name === name);
      const aliases = [buildAliases(name), ...(patch?.aliases || [])].join(" ");

      items.push([
        name,
        "database/?item=" + id,
        category.name,
        itemMeta(category.name, row),
        // 이름 외에 타입/스페셜/약칭까지 넣어 "charge dagger" 같은 질문도 걸리게 한다.
        expandSearchText([name,aliases,category.name,"database db",...Object.keys(row),...Object.values(row),
          ...Object.values(guideNotes[category.name+":"+name] || {})].join(" ")),
        0,
        aliases,
      ]);
    }
  }

  const {drops,sourceRows} = await readDropIndex();
  const revision = { ...JSON.parse(await readFile(resolve(projectRoot,"i18n/revision.json"),"utf8")), ...JSON.parse(await readFile(resolve(projectRoot,"i18n/improvements.json"),"utf8")) };
  const dictionaries = await Promise.all(["ko","ja","es","fr"].map(async lang => JSON.parse(await readFile(resolve(projectRoot,"i18n",lang+".json"),"utf8"))));
  const pages = PAGES.map(page=>({...page,s:expandSearchText([page.t,page.d,
    ...dictionaries.map(dict=>dict[page.k] || ""),...(revision[page.k] || [])].join(" "))}));
  const payload = {
    schemaVersion: 3,
    // 원본이 갱신되면 같이 다시 만들어야 한다. build/prepare-static.mjs 가 매
    // 빌드마다 호출하므로 손으로 챙길 일은 없다.
    generatedAt: new Date().toISOString(),
    pages,
    items,
    drops,
    dropSourceRows:sourceRows,
  };

  await writeFile(OUTPUT, JSON.stringify(payload), "utf8");
  return { pages: PAGES.length, items: items.length, destinyItems: catalog.length, dropRoutes:drops.length, dropSourceRows:sourceRows };
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
