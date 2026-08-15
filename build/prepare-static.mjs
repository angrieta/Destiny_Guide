import { cp, mkdir, readdir, rm } from "node:fs/promises";
import { resolve } from "node:path";

const projectRoot = process.cwd();
const outputDir = resolve(projectRoot, ".sites-static");
const directories = ["images", "scripts", "styles"];
const excludedHtml = new Set(["test.html"]);

await rm(outputDir, { recursive: true, force: true });
await mkdir(outputDir, { recursive: true });

for (const directory of directories) {
  await cp(resolve(projectRoot, directory), resolve(outputDir, directory), {
    recursive: true,
    filter: (source) => !source.toLowerCase().endsWith(".gif"),
  });
}

for (const entry of await readdir(projectRoot, { withFileTypes: true })) {
  if (!entry.isFile() || !entry.name.endsWith(".html") || excludedHtml.has(entry.name)) continue;
  await cp(resolve(projectRoot, entry.name), resolve(outputDir, entry.name));
}
