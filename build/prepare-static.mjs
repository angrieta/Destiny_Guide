import { cp, mkdir, readdir, readFile, rm, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname, resolve } from "node:path";
import { buildSearchIndex } from "../scripts/build-search-index.mjs";
import { buildFarmData } from "../scripts/build-farm-data.mjs";

const projectRoot = process.cwd();
const outputDir = resolve(projectRoot, ".sites-static");
// i18n: 번역 사전. 빠지면 런타임에 404 가 나고 영어로만 표시된다.
const directories = ["images", "scripts", "styles", "i18n"];
const publicFiles = [
  "data/happy-hour.json",
  // 헤더 검색 인덱스. 아래에서 매번 다시 만든 뒤 복사한다.
  "data/search-index.json",
  // 퀘스트 난이도 표. endgame_page.html 이 런타임에 받아 그린다.
  "data/quest-difficulty.json",
  // 커뮤니티 영상 색인.
  "data/quest-videos.json",
  // 조합 레시피 / Section ID 추천. 아래에서 매번 다시 만든다.
  "data/item-recipes.json",
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
console.log(`search index: ${searchIndex.items} items, ${searchIndex.pages} pages`);

const farmData = await buildFarmData();
console.log(`farm data: recipes ${farmData.recipes}, section buckets ${farmData.sectionBuckets}`);

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });

for (const directory of directories) {
  await cp(resolve(projectRoot, directory), resolve(outputDir, directory), {
    recursive: true,
    filter: (source) =>
      !source.toLowerCase().endsWith(".gif") || source.toLowerCase().includes("sb-video-"),
  });
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

  const html = await readFile(resolve(projectRoot, entry.name), "utf8");
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
