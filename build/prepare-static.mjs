import { cp, mkdir, readdir, rm } from "node:fs/promises";
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

for (const entry of await readdir(projectRoot, { withFileTypes: true })) {
  if (!entry.isFile() || !entry.name.endsWith(".html") || excludedHtml.has(entry.name)) continue;
  await cp(resolve(projectRoot, entry.name), resolve(outputDir, entry.name));
}
