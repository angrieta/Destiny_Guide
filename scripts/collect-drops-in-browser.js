/**
 * Paste this into the DevTools console on https://playpso.net/drop-tables
 * (F12 -> Console). It reads the tables your browser has already loaded and
 * downloads playpso-drops-snapshot.json, which `pnpm import:snapshot` turns
 * into data/drop-tables-*.json.
 *
 * Why a console snippet: PlayPSO sits behind a Cloudflare challenge that refuses
 * automated browsers, so a scraper cannot fetch these pages. This runs inside the
 * session you already opened by hand, and only reads what is on screen.
 */
(async () => {
  const DIFFICULTY_NAMES = ["Normal", "Hard", "Very Hard", "Ultimate"];

  /**
   * Cell text keeps its line breaks: a monster cell holds the name and its DAR,
   * a drop cell holds the item and its rate. innerText only works for the page
   * that is actually rendered, so rebuild the breaks manually instead.
   */
  function cellLines(cell) {
    const clone = cell.cloneNode(true);
    for (const br of clone.querySelectorAll("br")) br.replaceWith("\n");
    for (const block of clone.querySelectorAll("div, p, li, tr, span")) {
      block.insertAdjacentText("beforeend", "\n");
    }
    return (clone.textContent ?? "")
      .split("\n")
      .map((part) => part.trim())
      .filter(Boolean);
  }

  function parseDocument(doc) {
    const tables = Array.from(doc.querySelectorAll("table")).filter((table) => {
      const firstRow = table.querySelector("tr");
      return firstRow && Array.from(firstRow.children).some((cell) => (cell.textContent ?? "").trim() === "Monster");
    });

    const parsed = tables.map((table) => {
      const heading = table.previousElementSibling?.textContent?.trim() ?? "";
      const episode = Number(heading.match(/Episode\s+(\d+)/i)?.[1] ?? 0);
      const rows = Array.from(table.querySelectorAll("tr"));
      const sectionIds = Array.from(rows[0].children)
        .slice(1)
        .map((cell) => (cell.textContent ?? "").trim());

      return {
        episode,
        rows: rows.slice(1).map((row) => {
          const cells = Array.from(row.children).map(cellLines);
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
  }

  const countRows = (episodes) => episodes.reduce((total, entry) => total + entry.rows.length, 0);

  // Results accumulate across runs, so difficulties you have to open by hand
  // can be collected one page at a time.
  const STORE_KEY = "destiny-guide-drops-snapshot";
  const collected = new Map();
  try {
    for (const entry of JSON.parse(sessionStorage.getItem(STORE_KEY) ?? "[]")) {
      collected.set(entry.difficulty, entry);
    }
  } catch {
    // A corrupt store just means starting over.
  }

  const currentDiff = Number(new URLSearchParams(location.search).get("diff") ?? 0);
  const missing = [];

  for (let difficulty = 0; difficulty < DIFFICULTY_NAMES.length; difficulty += 1) {
    const name = DIFFICULTY_NAMES[difficulty];
    const source = `https://playpso.net/drop-tables?diff=${difficulty}`;

    try {
      let episodes;
      if (difficulty === currentDiff) {
        episodes = parseDocument(document);
        if (countRows(episodes) === 0) throw new Error("no table on this page yet, wait for it to load");
      } else {
        // Same-origin request, reusing the session you already opened.
        const response = await fetch(`/drop-tables?diff=${difficulty}`, { credentials: "include" });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const html = await response.text();
        episodes = parseDocument(new DOMParser().parseFromString(html, "text/html"));
        if (countRows(episodes) === 0) throw new Error("table is rendered by script, not in the HTML");
      }

      collected.set(difficulty, { source, difficulty, name, episodes });
      console.log(`${name}: ${countRows(episodes)} rows across ${episodes.length} episodes`);
      const sample = episodes[0]?.rows[0];
      if (sample) console.log("   first row:", sample[0], "DAR", sample[1]);
    } catch (error) {
      if (!collected.has(difficulty)) missing.push({ difficulty, name });
      console.warn(`${name}: not readable from here (${error.message})`);
    }
  }

  sessionStorage.setItem(STORE_KEY, JSON.stringify([...collected.values()]));

  if (collected.size === 0) {
    console.error("Nothing collected yet. Make sure the drop table is visible, then run again.");
    return;
  }

  if (missing.length > 0) {
    console.log("");
    console.log(`Collected ${collected.size} of ${DIFFICULTY_NAMES.length}. Open each of these and re-run:`);
    for (const entry of missing) {
      console.log(`  ${entry.name}: https://playpso.net/drop-tables?diff=${entry.difficulty}`);
    }
    console.log("Progress is kept in this tab, so the download happens once all four are in.");
    return;
  }

  const difficulties = [...collected.values()].sort((a, b) => a.difficulty - b.difficulty);
  const total = difficulties.reduce((sum, entry) => sum + countRows(entry.episodes), 0);
  const blob = new Blob([JSON.stringify({ collectedAt: new Date().toISOString(), difficulties })], {
    type: "application/json",
  });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "playpso-drops-snapshot.json";
  document.body.appendChild(link);
  link.click();
  link.remove();
  sessionStorage.removeItem(STORE_KEY);

  console.log("");
  console.log(`Downloaded playpso-drops-snapshot.json - ${difficulties.length} difficulties, ${total} rows.`);
})();
