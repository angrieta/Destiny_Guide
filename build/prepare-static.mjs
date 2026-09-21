import { cp, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname, resolve } from "node:path";
import { buildSearchIndex } from "../scripts/build-search-index.mjs";
import { buildFarmData } from "../scripts/build-farm-data.mjs";
import { buildItemAcquisition } from "../scripts/build-item-acquisition.mjs";

const projectRoot = process.cwd();
const outputDir = resolve(projectRoot, ".sites-static");
// i18n: 번역 사전. 빠지면 런타임에 404 가 나고 영어로만 표시된다.
const directories = ["images", "scripts", "styles", "i18n"];
const publicFiles = [
  "data/verified-content.json",
  "data/happy-hour.json",
  // 헤더 검색 인덱스. 아래에서 매번 다시 만든 뒤 복사한다.
  "data/search-index.json",
  // 퀘스트 난이도 표. endgame_page.html 이 런타임에 받아 그린다.
  "data/quest-difficulty.json",
  // 커뮤니티 영상 색인.
  "data/quest-videos.json",
  // 조합 레시피 / Section ID 추천. 아래에서 매번 다시 만든다.
  "data/item-recipes.json",
  "data/item-acquisition.json",
  "data/analytics-items.json",
  "data/analytics-elements.json",
  "data/section-id.json",
  // 모드·스킨 목록. mods_page.html 이 런타임에 받아 그린다.
  "data/mods.json",
  "data/database-1.json",
  "data/database-2.json",
  "data/database-3.json",
  "data/database-4.json",
  "data/database-5.json",
];
const excludedHtml = new Set(["test.html"]);

// 검색 인덱스는 database-*.json 과 destiny_catalog.js 에서 파생된다.
// 손으로 갱신하는 걸 잊으면 검색 결과가 조용히 낡으므로 매 빌드마다 다시 만든다.
const searchIndex = await buildSearchIndex();
console.log(`search index: ${searchIndex.items} items, ${searchIndex.dropRoutes} drop routes (${searchIndex.dropSourceRows} source cells), ${searchIndex.pages} pages`);

const farmData = await buildFarmData();
console.log(`farm data: recipes ${farmData.recipes}, section buckets ${farmData.sectionBuckets}`);
const acquisition = await buildItemAcquisition();
console.log(`item acquisition: ${acquisition.covered}/${acquisition.items} cards with routes or source notes`);

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });
await mkdir(resolve(outputDir, "data"), {recursive:true});
const searchPayload = JSON.parse(await readFile(resolve(projectRoot, "data/search-index.json"), "utf8"));
const normalizeContentPath = (url) => "/" + url.split("#")[0].replace(/index\.html$/, "").replace(/\.html$/, "").replace(/\/$/, "");
const contentPages = searchPayload.pages.filter((page) => !page.u.includes("#"))
  .map((page) => ({path:normalizeContentPath(page.u), href:page.u, title:page.t, titleKey:page.k || ""}));
// Include new standalone guides even before they are added to the search menu.
for (const entry of await readdir(projectRoot, {withFileTypes:true})) {
  if (!entry.isFile() || !entry.name.endsWith(".html") || excludedHtml.has(entry.name) || entry.name === "analytics_page.html") continue;
  const html = await readFile(resolve(projectRoot,entry.name),"utf8");
  if (!/<html\b/i.test(html)) continue; // Header/carousel fragments are not pages.
  const path = normalizeContentPath(entry.name);
  if (contentPages.some(page => page.path === path)) continue;
  const title = html.match(/<title[^>]*>([^<]+)<\/title>/i)?.[1] || entry.name;
  const titleKey = html.match(/<title[^>]*data-i18n="([^"]+)"/i)?.[1] || "";
  contentPages.push({path,href:entry.name,title,titleKey});
}
for (const [path, href, title, titleKey] of [
  ["/calculator","calculator/","Damage Calculator","header.link.calculator"],
  ["/mods_page","mods_page.html","Mods and Skins","header.nav.mods"],
  ["/roster_page","roster_page.html","Name Directory","header.nav.roster"]
]) {
  const existing = contentPages.find((page) => page.path === path);
  if (existing) Object.assign(existing,{href,title,titleKey});
  else contentPages.push({path,href,title,titleKey});
}
const contentSections = [
  ["/class_builds","class-roadmap","b2.next"], ["/class_builds","class-endgame","usage.endgame"],
  ["/player_tools","monster-counter","lab.t006"], ["/player_tools","happy-schedule","lab.t007"],
  ["/pb_guide","pb-basics","pb.basics"], ["/pb_guide","pb-cycle","pb.cycle"],
  ["/pb_guide","pb-spend","pb.spend"], ["/pb_guide","pb-troubleshoot","pb.troubleshoot"],
  ["/drop-tables","drop-explorer","header.link.dropTables"],
  ["/database","item-explorer","header.link.database"],
  ["/calculator","damage-calculator","header.link.calculator"]
].map(([path,id,titleKey]) => ({path,id,titleKey,title:({
  "class-roadmap":"Beginner farming roadmap","class-endgame":"Endgame builds",
  "monster-counter":"Monster count search","happy-schedule":"Happy Hour schedule",
  "pb-basics":"Before you start","pb-cycle":"PB cycle","pb-spend":"Lower PB","pb-troubleshoot":"PB troubleshooting",
  "drop-explorer":"Drop explorer","item-explorer":"Item explorer","damage-calculator":"Damage calculator"
})[id]}));
// 버튼·카드 목록은 마크업(data-click-id)·워커 검증과 같은 파일에서 읽어 대시보드 라벨로 쓴다.
const contentElements = JSON.parse(await readFile(resolve(projectRoot,"data/analytics-elements.json"),"utf8"));
await writeFile(resolve(outputDir,"data/content-catalog.json"), JSON.stringify({pages:contentPages,sections:contentSections,elements:contentElements}),"utf8");

for (const directory of directories) {
  await cp(resolve(projectRoot, directory), resolve(outputDir, directory), {
    recursive: true,
    filter: (source) =>
      !source.toLowerCase().endsWith(".gif") || source.toLowerCase().includes("sb-video-"),
  });
}

// 정적 헤더가 가져오는 공통 검색 엔진도 내용 변경 시 캐시를 갱신한다.
{
  const engineHash = createHash("sha1").update(await readFile(resolve(outputDir,"scripts/search-engine.mjs"))).digest("hex").slice(0,8);
  const path=resolve(outputDir,"scripts/site_search.js");
  const source=await readFile(path,"utf8");
  await writeFile(path,source.replace('import("./search-engine.mjs")',`import("./search-engine.mjs?v=${engineHash}")`),"utf8");
}
// The modal loads acquisition code lazily; version its module dependencies too.
{
  const core = await readFile(resolve(outputDir, 'scripts/acquisition-core.mjs'), 'utf8');
  const coreHash = createHash('sha1').update(core).digest('hex').slice(0,8);
  const modulePath = resolve(outputDir, 'scripts/item-acquisition.mjs');
  const moduleCode = (await readFile(modulePath, 'utf8')).replace('./acquisition-core.mjs', `./acquisition-core.mjs?v=${coreHash}`);
  await writeFile(modulePath, moduleCode);
  const moduleHash = createHash('sha1').update(moduleCode).digest('hex').slice(0,8);
  const catalogPath = resolve(outputDir, 'scripts/destiny_catalog.js');
  await writeFile(catalogPath, (await readFile(catalogPath, 'utf8')).replace("import('./item-acquisition.mjs')", `import('./item-acquisition.mjs?v=${moduleHash}')`));
}
// 이 개편의 5개 언어 문구는 한 소스에서 관리하고 기존 사전과 병합한다.
const revisionCopy = {
  ...JSON.parse(await readFile(resolve(projectRoot, "i18n/revision.json"), "utf8")),
  ...JSON.parse(await readFile(resolve(projectRoot, "i18n/improvements.json"), "utf8")),
};
await writeFile(resolve(outputDir, 'scripts/verified-content.js'),
  'window.DestinyVerifiedContent = ' + await readFile(resolve(projectRoot, 'data/verified-content.json'), 'utf8') + ';\n');
const revisionEnglish = {};
for (const [key, translations] of Object.entries(revisionCopy)) revisionEnglish[key] = translations[0];
await writeFile(resolve(outputDir, "scripts/guide_revision_copy.js"),
  "window.DESTINY_REVISION_COPY = " + JSON.stringify(revisionEnglish) + ";\n", "utf8");
for (const [index, lang] of ["en", "ko", "ja", "es", "fr"].entries()) {
  if (lang === "en") continue;
  const dictPath = resolve(outputDir, "i18n", lang + ".json");
  const dict = JSON.parse(await readFile(dictPath, "utf8"));
  for (const [key, translations] of Object.entries(revisionCopy)) {
    if (typeof translations[index] !== "string") throw new Error("Missing translation: " + key + "/" + lang);
    dict[key] = translations[index];
  }
  await writeFile(dictPath, JSON.stringify(dict, null, 2) + "\n", "utf8");
}

for (const file of publicFiles) {
  const destination = resolve(outputDir, file);
  await mkdir(dirname(destination), { recursive: true });
  await cp(resolve(projectRoot, file), destination);
}

// 브라우저 캐시 무효화.
// GitHub Pages 는 css/js 를 max-age=600 으로 내보내므로, 손으로 ?v= 를 붙이지 않으면
// 배포 직후 한동안 낡은 파일이 그대로 쓰인다. 실제로 헤더 CSS 가 이 때문에 한 번 깨져
// 보였고, 그 뒤 붙인 키는 다음 수정 때 갱신하는 걸 잊어 또 낡았다.
// 그래서 키를 손으로 관리하지 않는다 — 파일 내용의 해시를 빌드가 매번 붙인다.
// 내용이 그대로면 키도 그대로라 캐시는 계속 살아 있고, 바뀌면 주소가 달라져 즉시 새로 받는다.
const assetHashes = new Map();

async function assetVersion(relativePath) {
  if (assetHashes.has(relativePath)) return assetHashes.get(relativePath);
  let version = null;
  try {
    const contents = await readFile(resolve(outputDir, relativePath));
    version = createHash("sha1").update(contents).digest("hex").slice(0, 8);
  } catch {
    // 없는 파일은 건드리지 않는다. 링크가 깨진 건 캐시가 아니라 별개의 문제다.
    console.warn(`cache key: ${relativePath} 를 찾지 못해 건너뜁니다`);
  }
  assetHashes.set(relativePath, version);
  return version;
}

// 헤더 조각은 링크가 아니라 include.js 안의 fetch 로 들어온다. 같은 해시를 그 주소에도
// 붙여, 헤더를 고쳤을 때 방문자가 옛 헤더를 계속 보지 않게 한다.
const headerVersion = createHash("sha1")
  .update(await readFile(resolve(projectRoot, "header.html")))
  .digest("hex")
  .slice(0, 8);
{
  const includePath = resolve(outputDir, "scripts/include.js");
  const source = await readFile(includePath, "utf8");
  const stamped = source.replace('fetch("./header.html")', `fetch("./header.html?v=${headerVersion}")`);
  if (stamped === source) {
    console.warn("cache key: include.js 의 header.html fetch 를 찾지 못했습니다");
  } else {
    await writeFile(includePath, stamped, "utf8");
    console.log(`cache keys: header.html -> ?v=${headerVersion}`);
  }
}

// 손으로 붙여 둔 ?v= 가 있으면 해시로 갈아끼운다. 두 방식이 섞이면 어느 쪽이 진짜인지 알 수 없다.
const ASSET_REFERENCE = /(href|src)="\.\/((?:styles|scripts)\/[^"?]+\.(?:css|js))(?:\?[^"]*)?"/g;

let stampedPages = 0;
let stampedRefs = 0;

for (const entry of await readdir(projectRoot, { withFileTypes: true })) {
  if (!entry.isFile() || !entry.name.endsWith(".html") || excludedHtml.has(entry.name)) continue;

  let html = await readFile(resolve(projectRoot, entry.name), "utf8");
  if (html.includes('scripts/destiny_catalog.js')) {
    html = html.replace(/<script\s+src="\.\/scripts\/destiny_catalog\.js/, '<script src="./scripts/verified-content.js"></script>\n<script src="./scripts/destiny_catalog.js');
  } else if (html.includes('scripts/item_info.js')) {
    html = html.replace(/<script\s+src="\.\/scripts\/item_info\.js/, '<script src="./scripts/verified-content.js"></script>\n<script src="./scripts/item_info.js');
  }
  if (html.includes("</head>")) {
    html = html.replace("</head>", '    <script src="./scripts/modal-history.js"></script>\n</head>');
  }
  // 정적 페이지 전체에 같은 익명 집계를 붙인다. 소스 HTML마다 태그를 복사하면
  // 새 페이지에서 빠지기 쉬워 빌드 단계에서 한 번만 주입한다.
  if (!html.includes("scripts/analytics.js")) {
    html = html.replace("</head>", '    <script src="./scripts/analytics.js" defer></script>\n</head>');
  }
  const versions = new Map();
  for (const [, , assetPath] of html.matchAll(ASSET_REFERENCE)) {
    versions.set(assetPath, await assetVersion(assetPath));
  }

  const stamped = html.replace(ASSET_REFERENCE, (whole, attribute, assetPath) => {
    const version = versions.get(assetPath);
    if (!version) return whole;
    stampedRefs += 1;
    return `${attribute}="./${assetPath}?v=${version}"`;
  });

  if (stamped !== html) stampedPages += 1;
  await writeFile(resolve(outputDir, entry.name), stamped, "utf8");
}

console.log(`cache keys: ${stampedRefs} refs stamped across ${stampedPages} pages`);
