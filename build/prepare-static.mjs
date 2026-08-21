import { cp, mkdir, readdir, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";

const projectRoot = process.cwd();
const outputDir = resolve(projectRoot, ".sites-static");
// i18n: 번역 사전. 빠지면 런타임에 404 가 나고 영어로만 표시된다.
const directories = ["images", "scripts", "styles", "i18n"];
const publicFiles = [
  "data/happy-hour.json",
  "data/database-1.json",
  "data/database-2.json",
  "data/database-3.json",
  "data/database-4.json",
  "data/database-5.json",
];
const excludedHtml = new Set(["test.html"]);

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
