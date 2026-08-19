/**
 * Injected into a real playpso.net tab to read the drop tables.
 * Mirrors scripts/collect-drops-in-browser.js.
 *
 * The final expression is the injection result, so it must stay last.
 */
(async () => {
  const DIFFICULTY_NAMES = ["Normal", "Hard", "Very Hard", "Ultimate"];

  /**
   * Cell text keeps its line breaks: a monster cell holds the name and its DAR,
   * a drop cell holds the item and its rate. innerText only reflects a rendered
   * page, so rebuild the breaks by hand for fetched documents too.
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

  const collected = [];
  const failures = [];
  const currentDiff = Number(new URLSearchParams(location.search).get("diff") ?? 0);

  for (let difficulty = 0; difficulty < DIFFICULTY_NAMES.length; difficulty += 1) {
    const name = DIFFICULTY_NAMES[difficulty];
    try {
      let episodes;
      if (difficulty === currentDiff) {
        episodes = parseDocument(document);
      } else {
        // Same-origin request that reuses this tab's cleared session.
        const response = await fetch(`/drop-tables?diff=${difficulty}`, { credentials: "include" });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        episodes = parseDocument(new DOMParser().parseFromString(await response.text(), "text/html"));
      }
      if (countRows(episodes) === 0) throw new Error("no rows parsed");
      collected.push({
        source: `https://playpso.net/drop-tables?diff=${difficulty}`,
        difficulty,
        name,
        episodes,
      });
    } catch (error) {
      failures.push(`${name}: ${error.message}`);
    }
  }

  return { kind: "drop-tables", collectedAt: new Date().toISOString(), difficulties: collected, failures };
})();
