import { chromium } from "playwright";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const projectRoot = process.cwd();
const outputDir = resolve(projectRoot, "data");
const difficultyNames = ["Normal", "Hard", "Very Hard", "Ultimate"];

async function extractDifficulty(page, difficulty) {
  const source = `https://playpso.net/drop-tables?diff=${difficulty}`;
  await page.goto(source, { waitUntil: "domcontentloaded", timeout: 90_000 });
  await page.waitForFunction(
    () => document.title !== "Just a moment..." && document.querySelectorAll("table").length > 1,
    undefined,
    { timeout: 90_000 },
  );

  const episodes = await page.evaluate(() => {
    const tables = Array.from(document.querySelectorAll("table")).filter((table) => {
      const firstRow = table.querySelector("tr");
      return firstRow && Array.from(firstRow.children).some((cell) => cell.textContent?.trim() === "Monster");
    });

    const parsed = tables.map((table) => {
      const heading = table.previousElementSibling?.textContent?.trim() ?? "";
      const episode = Number(heading.match(/Episode\s+(\d+)/i)?.[1] ?? 0);
      const rows = Array.from(table.querySelectorAll("tr"));
      const sectionIds = Array.from(rows[0].children)
        .slice(1)
        .map((cell) => cell.textContent?.trim() ?? "");

      return {
        episode,
        rows: rows.slice(1).map((row) => {
          const cells = Array.from(row.children).map((cell) =>
            cell.innerText.split("\n").map((part) => part.trim()).filter(Boolean),
          );
          const enemy = cells[0]?.[0] ?? "";
          const dar = Number(cells[0]?.find((part) => /^DAR:/i.test(part))?.match(/[\d.]+/)?.[0] ?? 0);
          const drops = cells.slice(1).map((parts, index) => {
            const rate = parts.find((part) => /^1\//.test(part)) ?? null;
            const item = parts.filter((part) => part !== rate).join(" ").trim() || "No Item";
            return [sectionIds[index] ?? "", item, rate];
          });
          return [enemy, dar, drops];
        }),
      };
    });

    return Array.from(new Map(parsed.map((episode) => [episode.episode, episode])).values());
  });

  return { source, difficulty, name: difficultyNames[difficulty], episodes };
}

async function writeIfChanged(difficulty, table) {
  const path = resolve(outputDir, `drop-tables-${difficulty}.json`);
  let previous = null;

  try {
    previous = JSON.parse(await readFile(path, "utf8"));
  } catch {
    // The first sync creates the snapshot.
  }

  const previousComparable = previous ? JSON.stringify({ ...previous, syncedAt: undefined }) : null;
  const nextComparable = JSON.stringify({ ...table, syncedAt: undefined });
  if (previousComparable === nextComparable) {
    console.log(`${table.name}: no changes`);
    return false;
  }

  const next = { ...table, syncedAt: new Date().toISOString() };
  await writeFile(path, `${JSON.stringify(next)}\n`, "utf8");
  console.log(`${table.name}: updated ${path}`);
  return true;
}

await mkdir(outputDir, { recursive: true });
const browser = await chromium.launch({ headless: true });

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
  let changed = 0;

  for (let difficulty = 0; difficulty < difficultyNames.length; difficulty += 1) {
    const table = await extractDifficulty(page, difficulty);
    if (await writeIfChanged(difficulty, table)) changed += 1;
  }

  console.log(changed === 0 ? "Drop tables are already current." : `Updated ${changed} drop table snapshot(s).`);
} finally {
  await browser.close();
}
