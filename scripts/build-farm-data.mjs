/**
 * 두 가지 파생 데이터를 만든다.
 *
 *   data/item-recipes.json   조합 레시피 (scripts/destiny_catalog.js 에서 추출)
 *   data/section-id.json     Section ID 별 파밍 추천 (data/drop-tables-*.json 에서 계산)
 *
 * 둘 다 원본이 따로 있고 여기서는 뽑아 정리만 한다. 원본이 갱신되면 다시 돌리면 된다.
 * build/prepare-static.mjs 가 매 빌드마다 호출한다.
 */

import { readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { FORUM_COMBO_GROUPS } from "./forum-combos.data.mjs";

const projectRoot = process.cwd();

const normalize = (value) =>
  String(value ?? "")
    .normalize("NFKD")
    .toLowerCase()
    .replace(/[’']/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

/* ── 1. 조합 레시피 ───────────────────────────────────────────────────── */

/** `key: [ ... ]` 의 대괄호 안쪽을 통째로 잘라낸다. 중첩 대괄호도 센다. */
function bracketBody(text, key) {
  const at = text.indexOf(key);
  if (at < 0) return "";
  const tail = text.slice(at);
  const open = tail.indexOf("[");
  if (open < 0) return "";
  let depth = 0;
  for (let i = open; i < tail.length; i += 1) {
    if (tail[i] === "[") depth += 1;
    else if (tail[i] === "]") {
      depth -= 1;
      if (depth === 0) return tail.slice(open + 1, i);
    }
  }
  return "";
}

const STRINGS = /"([^"]*)"/g;

/** "Millennium Photon Core x25" -> { item, qty } */
function parseIngredient(raw) {
  const text = raw.replace(/\\u2014/g, "—").trim();
  const match = text.match(/^(.*?)\s*[x×]\s*(\d+)\s*$/i);
  if (match) return { item: match[1].trim(), qty: Number(match[2]) };
  return { item: text, qty: 1 };
}

async function buildRecipes() {
  const source = await readFile(resolve(projectRoot, "scripts/destiny_catalog.js"), "utf8");
  const region = source.slice(source.indexOf("const catalogItems = ["), source.indexOf("const normalizeName"));
  const idPattern = /id:\s*"([^"]+)"/g;

  const recipes = [];
  const obtainNotes = [];
  let match;

  while ((match = idPattern.exec(region))) {
    // 항목 하나가 stats/combat/obtain/required 까지 포함해 길다. 넉넉히 잘라 읽는다.
    const block = region.slice(match.index, match.index + 2600);
    const name = block.match(/\n\s*name:\s*"([^"]*)"/)?.[1];
    if (!name) continue;

    const id = match[1];
    const category = block.match(/\n\s*category:\s*"([^"]*)"/)?.[1] ?? "";
    const type = block.match(/\n\s*type:\s*"([^"]*)"/)?.[1] ?? "";
    const required = [...bracketBody(block, "required:").matchAll(STRINGS)].map((x) => x[1]);
    const obtain = [...bracketBody(block, "obtain:").matchAll(STRINGS)].map((x) => x[1].replace(/\\u2014/g, "—"));

    if (required.length) {
      recipes.push({ id, name, category, type, ingredients: required.map(parseIngredient), obtain });
    } else if (obtain.some((line) => /combin|trade|exchange|blueprint|craft|redeem/i.test(line))) {
      obtainNotes.push({ id, name, category, type, obtain });
    }
  }

  // 역검색: 재료 이름 -> 그것을 쓰는 결과물들.
  // "이 재료로 뭘 만들 수 있나" 가 실제로 더 자주 나오는 질문이라 미리 만들어 둔다.
  const usedIn = {};
  for (const recipe of recipes) {
    for (const ingredient of recipe.ingredients) {
      const key = normalize(ingredient.item);
      (usedIn[key] = usedIn[key] || { label: ingredient.item, results: [] }).results.push({
        name: recipe.name,
        qty: ingredient.qty,
      });
    }
  }

  // Discord #item-combination 에서 확인한 조합. 출처와 모양이 달라서(수량이 없고 항상 2개짜리다) 따로 담는다.
  const forumGroups = FORUM_COMBO_GROUPS.map((group) => ({
    key: group.key,
    label: group.label,
    serverOnly: Boolean(group.serverOnly),
    combos: group.combos,
  }));

  // 여기서도 핵심 질문은 같다: 이 재료가 어디에 쓰이나.
  // Orb of Illusions 나 Dark Matter 처럼 여러 곳에 들어가는 것을 먼저 보여주려는 것이다.
  const forumUsedIn = {};
  for (const group of forumGroups) {
    for (const combo of group.combos) {
      for (const part of combo.parts) {
        const key = normalize(part);
        (forumUsedIn[key] = forumUsedIn[key] || { label: part, results: [] }).results.push(combo.result);
      }
    }
  }

  return {
    schemaVersion: 2,
    note:
      "서버 자체 아이템은 scripts/destiny_catalog.js 의 required / obtain 필드에서 뽑았다. 원본이 " +
      "서버 공지 이미지라 재료 목록이 잘려 있는 항목이 있다(IGNIS ENGINE 등). 원작 PSOBB 와 서버 " +
      "조합은 Destiny Discord #item-combination 에서 2026-09-04 확인했으며, 기존 playpso 포럼 topic/804 출처와 함께 scripts/forum-combos.data.mjs 에 두었다.",
    recipes,
    obtainNotes,
    usedIn,
    forumGroups,
    forumUsedIn,
  };
}

/* ── 2. Section ID 별 파밍 추천 ───────────────────────────────────────── */

const DIFFICULTY_FILES = [
  ["Normal", "data/drop-tables-0.json"],
  ["Hard", "data/drop-tables-1.json"],
  ["Very Hard", "data/drop-tables-2.json"],
  ["Ultimate", "data/drop-tables-3.json"],
];

/** app/drop-tables/data.ts 의 areaGroups 와 같은 표. 한쪽을 고치면 반대쪽도 고친다. */
const AREA_GROUPS = {
  1: [
    ["Forest", ["hilde", "moth", "monest", "rappy", "wolf", "gulgus", "booma", "bartle", "barble", "tollaw", "dragon"]],
    ["Caves", ["assassin", "lily", "nano dragon", "shark", "vulmer", "melqueek", "slime", "pan arms", "migium", "hidoom", "de rol", "dal ra"]],
    ["Mines", ["dubch", "garanz", "baranz", "canadine", "canane", "sinow beat", "sinow gold", "sinow blue", "sinow red", "gillch", "vol opt"]],
    ["Ruins", ["delsaber", "sorcerer", "belra", "bringer", "claw", "bulk", "bulclaw", "dimenian", "dark falz"]],
  ],
  2: [
    ["VR Temple", ["hilde", "rappy", "wolf", "lily", "assassin", "pan arms", "migium", "hidoom", "barba ray"]],
    ["VR Spaceship", ["dubch", "garanz", "delsaber", "sorcerer", "belra", "dimenian", "gilch", "gol dragon"]],
    ["Central Control Area", ["merill", "gee", "gi gue", "mericarol", "merikle", "mericus", "gibbon", "gibbles", "gal gryphon"]],
    ["Seabed", ["sinow berill", "sinow spigell", "sinow zoa", "sinow zele", "dolmolm", "dolmdarl", "morfos", "recon", "deldepth", "delbiter", "olga flow"]],
    ["Control Tower", ["ill gill", "del lily", "epsilon"]],
  ],
  4: [
    ["Crater", ["astark", "yowie", "satellite lizard", "merissa", "girtablulu", "zu", "pazuzu"]],
    ["Subterranean Desert", ["boota", "dorphon", "goran", "sand rappy", "del rappy", "saint million", "shambertin", "kondrieu"]],
  ],
};

function areaOf(episode, enemy) {
  const value = normalize(enemy);
  const match = AREA_GROUPS[episode]?.find(([, names]) => names.some((name) => value.includes(name)));
  return match?.[0] ?? "Custom / Raid";
}

/** "1/475" -> 475. 값이 없거나 읽을 수 없으면 null. */
function denominatorOf(rate) {
  if (!rate) return null;
  const match = String(rate).match(/1\s*\/\s*([\d.]+)/);
  if (!match) return null;
  const value = Number(match[1]);
  return Number.isFinite(value) ? value : null;
}

/**
 * 재료·소모품은 "노릴 만한 것"이 아니다. 드랍표에는 머티리얼과 모노메이트가
 * 압도적으로 많아서, 걸러내지 않으면 추천이 전부 Trimate 로 덮인다.
 */
const COMMON = /^(no item|monomate|dimate|trimate|monofluid|difluid|trifluid|sol atomizer|moon atomizer|star atomizer|antidote|antiparalysis|telepipe|trap vision|monogrinder|digrinder|trigrinder|power material|mind material|evade material|hp material|tp material|def material|luck material|photon drop|scape doll)$/i;

/**
 * 아이템 이름 -> 분류(Weapons / Armor / Shields / Units / Mags).
 * 드랍표에는 분류가 없어서 아이템 DB 에서 끌어온다. 매칭은 정규화한 이름으로 한다.
 */
async function buildCategoryMap() {
  const files = [
    ["Weapons", "data/database-1.json"],
    ["Armor", "data/database-2.json"],
    ["Shields", "data/database-3.json"],
    ["Units", "data/database-4.json"],
    ["Mags", "data/database-5.json"],
  ];
  const map = new Map();
  const put = (name, category) => {
    const key = normalize(name);
    if (key && !map.has(key)) map.set(key, category);
  };

  for (const [category, file] of files) {
    const source = JSON.parse(await readFile(resolve(projectRoot, file), "utf8"));
    for (const row of source.rows) put(row.Name, category);
  }

  // 아이템 DB 에 아직 없는 것들이 있다 (M&A85 FURY, RADIANT RING 등).
  // 도감과 우선순위표가 그 빈칸을 메운다.
  const CATALOG_CATEGORIES = { Armor: "Armor", Shield: "Shields", Unit: "Units" };
  const catalog = await readFile(resolve(projectRoot, "scripts/destiny_catalog.js"), "utf8");
  for (const match of catalog.matchAll(/\n\s*name:\s*"([^"]*)"[\s\S]{0,600}?\n\s*category:\s*"([^"]*)"/g)) {
    put(match[1], CATALOG_CATEGORIES[match[2]] ?? "Weapons");
  }

  const IMPORT_CATEGORIES = { Weapon: "Weapons", Armor: "Armor", Shield: "Shields", Unit: "Units", Mag: "Mags" };
  const priority = await readFile(resolve(projectRoot, "scripts/item_priority_data.js"), "utf8");
  const fakeWindow = {};
  new Function("window", priority)(fakeWindow);
  for (const item of fakeWindow.DestinyItemPriorityData?.imports ?? []) {
    put(item.name, IMPORT_CATEGORIES[item.category] ?? "Other");
  }

  // 마지막 수단. 평가표의 분류는 "Armor / Shield" 처럼 뭉뚱그린 것이 있어서
  // 어느 쪽인지 분명한 것만 쓴다. 애매하면 분류를 비워 두는 편이 낫다.
  for (const item of fakeWindow.DestinyItemPriorityData?.items ?? []) {
    for (const entry of item.overall ?? []) {
      if (IMPORT_CATEGORIES[entry.category]) put(item.name, IMPORT_CATEGORIES[entry.category]);
    }
  }

  return map;
}

/**
 * 장비가 아닌 것들. 몬스터 파츠와 이벤트 아이템이 드랍표의 큰 부분을 차지하는데,
 * 이것들을 무기·방어구와 같은 칸에 두면 분류 필터가 쓸모없어진다.
 */
const MATERIAL_LIKE =
  /(['’]s (right |left )?(arm|arms|head|wing|beak|claw|tail|horn|shell|fang|hide|skin)$)|(\b(cell|cells|sphere|crystal|scale|egg|present|lantern|ticket|coin|token|blueprint|addslot|photon drop|photon booster|dark matter|syncesta|matter)\b)|^(parts of|book of|orb of|proof of|magic rock|magic stone|magic water|amplifi|parasitic|heart of|dragon tear|ideya|pandora|a new friend|cladding|kit of )|^(tablet|pioneer parts|liberta kit|amitie['’]s memo|yahoo!?['’]s engine|administrator['’]s core|de rol le shell)$/i;

/**
 * 아이템 이름 -> 평가 { score, hit, endgame }.
 *
 * scripts/item_priority_data.js 는 브라우저용 IIFE 라서 window 만 흉내내면 그대로 돌아간다.
 * 같은 표를 정규식으로 다시 읽으면 원본이 바뀔 때 조용히 어긋난다.
 */
async function buildPriorityMap() {
  const source = await readFile(resolve(projectRoot, "scripts/item_priority_data.js"), "utf8");
  const fakeWindow = {};
  new Function("window", source)(fakeWindow);
  const data = fakeWindow.DestinyItemPriorityData;

  const map = new Map();
  for (const item of data?.items ?? []) {
    // 같은 아이템이 조건별로 여러 점수를 갖는다 (예: "+IGNIS ENGINE 이면 10/10").
    // 필터용으로는 가장 높은 쪽을 쓴다. 조건은 아이템 도감 쪽에서 이미 보여준다.
    let score = null;
    for (const entry of item.overall ?? []) {
      const value = Number(String(entry.score).split("/")[0]);
      if (Number.isFinite(value) && (score === null || value > score)) score = value;
    }
    if (score === null && !item.hit && !item.endgameUnit) continue;

    const value = {};
    if (score !== null) value.score = score;
    if (item.hit) value.hit = item.hit;
    if (item.endgameUnit) value.endgame = true;

    for (const name of [item.name, ...(item.aliases ?? [])]) {
      const key = normalize(name);
      if (key) map.set(key, value);
    }
  }
  return map;
}

/** 재료 이름 -> 그것으로 만들 수 있는 것. 서버 레시피와 포럼 조합을 합친다. */
function buildMakesMap(recipeData) {
  const map = new Map();

  const add = (part, result) => {
    const key = normalize(part);
    if (!key) return;
    const list = map.get(key) ?? [];
    if (!list.includes(result)) list.push(result);
    map.set(key, list);
  };

  for (const recipe of recipeData.recipes) {
    for (const ingredient of recipe.ingredients) add(ingredient.item, recipe.name);
  }
  for (const group of recipeData.forumGroups) {
    for (const combo of group.combos) {
      for (const part of combo.parts) add(part, combo.result);
    }
  }
  return map;
}

/**
 * 한 칸(난이도 × Section ID)에 남기는 최대 줄 수.
 * 확률순으로 자르면 "확률은 나쁘지만 꼭 필요한 것"이 잘려나가서, 평가가 있거나 조합
 * 재료인 줄은 개수와 무관하게 남기고 나머지만 이 수까지 채운다.
 */
const ROWS_PER_SECTION = 60;

/** 확률이 나빠도 남겨야 하는 줄인가. */
const isNotable = (row) => Boolean(row.score || row.hit || row.endgame || row.makes || row.exclusive);

async function buildSectionIds(recipeData) {
  const categoryOf = await buildCategoryMap();
  const priorityOf = await buildPriorityMap();
  const makesOf = buildMakesMap(recipeData);

  /** item -> { sid -> 최선 확률(분모) } */
  const byItem = new Map();
  /** sid -> 후보 목록 */
  const bySection = new Map();
  const difficulties = [];

  for (const [difficulty, file] of DIFFICULTY_FILES) {
    const table = JSON.parse(await readFile(resolve(projectRoot, file), "utf8"));
    difficulties.push(difficulty);

    for (const episode of table.episodes) {
      for (const [enemy, dar, drops] of episode.rows) {
        for (const [sectionId, item, rate] of drops) {
          if (!item || COMMON.test(item)) continue;
          const denominator = denominatorOf(rate);
          if (denominator === null) continue;

          const key = difficulty + "|" + item;
          if (!byItem.has(key)) byItem.set(key, new Map());
          const perSection = byItem.get(key);
          const previous = perSection.get(sectionId);
          if (previous === undefined || denominator < previous) perSection.set(sectionId, denominator);

          const listKey = difficulty + "|" + sectionId;
          if (!bySection.has(listKey)) bySection.set(listKey, []);
          bySection.get(listKey).push({
            item,
            enemy,
            episode: episode.episode,
            area: areaOf(episode.episode, enemy),
            dar,
            denominator,
          });
        }
      }
    }
  }

  const sections = {};
  for (const [listKey, rows] of bySection) {
    const [difficulty, sectionId] = listKey.split("|");

    // 같은 아이템이 여러 몬스터에게서 나오면 가장 확률 좋은 하나만 남긴다.
    const best = new Map();
    for (const row of rows) {
      const previous = best.get(row.item);
      if (!previous || row.denominator < previous.denominator) best.set(row.item, row);
    }

    const enriched = [...best.values()].map((row) => {
      const perSection = byItem.get(difficulty + "|" + row.item);
      const sectionCount = perSection ? perSection.size : 1;
      // 이 ID 에서만 나오는가. "내 ID 로만 나오는 것"이 가장 알고 싶은 정보다.
      const exclusive = sectionCount === 1;
      // 여러 ID 에서 나온다면, 이 ID 가 가장 좋은 확률인가.
      let bestAnywhere = row.denominator;
      if (perSection) for (const value of perSection.values()) if (value < bestAnywhere) bestAnywhere = value;
      const key = normalize(row.item);
      const priority = priorityOf.get(key);
      const makes = makesOf.get(key);

      return {
        ...row,
        cat: categoryOf.get(key) || (makes || MATERIAL_LIKE.test(row.item) ? "Materials" : "Other"),
        exclusive,
        bestForItem: row.denominator <= bestAnywhere,
        sectionCount,
        ...(priority ?? {}),
        ...(makes ? { makes } : {}),
      };
    });

    enriched.sort((a, b) => {
      if (a.exclusive !== b.exclusive) return a.exclusive ? -1 : 1;
      return a.denominator - b.denominator;
    });

    const notable = enriched.filter(isNotable);
    const keep = new Set(notable);
    for (const row of enriched.filter((row) => !isNotable(row)).slice(0, Math.max(0, ROWS_PER_SECTION - notable.length))) {
      keep.add(row);
    }
    sections[listKey] = enriched.filter((row) => keep.has(row));
  }

  return {
    schemaVersion: 2,
    note:
      "data/drop-tables-*.json 에서 계산했다. 재료·소모품은 제외하고, 같은 아이템이 여러 몬스터에게서 " +
      "나오면 확률이 가장 좋은 곳만 남겼다. exclusive 는 그 난이도에서 이 Section ID 로만 나온다는 뜻이다. " +
      "score / hit / endgame 은 scripts/item_priority_data.js 의 평가, makes 는 그 아이템이 재료로 " +
      "들어가는 조합, cat 은 아이템 DB 에서 끌어온 분류다.",
    difficulties,
    sectionIds: [
      "Viridia", "Greenill", "Skyly", "Bluefull", "Purplenum",
      "Pinkal", "Redria", "Oran", "Yellowboze", "Whitill",
    ],
    sections,
  };
}

/* ── 실행 ─────────────────────────────────────────────────────────────── */

export async function buildFarmData() {
  const recipes = await buildRecipes();
  await writeFile(resolve(projectRoot, "data/item-recipes.json"), JSON.stringify(recipes), "utf8");

  const sectionIds = await buildSectionIds(recipes);
  await writeFile(resolve(projectRoot, "data/section-id.json"), JSON.stringify(sectionIds), "utf8");

  return {
    recipes: recipes.recipes.length,
    obtainNotes: recipes.obtainNotes.length,
    ingredients: Object.keys(recipes.usedIn).length,
    forumCombos: recipes.forumGroups.reduce((sum, group) => sum + group.combos.length, 0),
    forumIngredients: Object.keys(recipes.forumUsedIn).length,
    sectionBuckets: Object.keys(sectionIds.sections).length,
  };
}

if (process.argv[1]?.endsWith("build-farm-data.mjs")) {
  const result = await buildFarmData();
  console.log(
    `item-recipes.json: 레시피 ${result.recipes}개, 획득 안내 ${result.obtainNotes}개, 재료 ${result.ingredients}종`,
  );
  console.log(`  포럼 조합 ${result.forumCombos}개, 그 재료 ${result.forumIngredients}종`);
  console.log(`section-id.json: ${result.sectionBuckets}개 (난이도 × Section ID)`);
}
