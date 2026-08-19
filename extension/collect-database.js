/**
 * Injected into a real playpso.net tab to read the item database.
 *
 * Mirrors scripts/collect-in-browser.js. It runs inside a genuine browser tab
 * that cleared the Cloudflare check on its own, which is the only context where
 * these pages are readable at all.
 *
 * The final expression is the injection result, so it must stay last.
 */
(async () => {
  const CATEGORIES = [
    { type: 1, name: "Weapons" },
    { type: 2, name: "Armor" },
    { type: 3, name: "Shields" },
    { type: 4, name: "Units" },
    { type: 5, name: "Mags" },
  ];

  const text = (cell) => (cell.textContent ?? "").replace(/\s+/g, " ").trim();

  /**
   * Reads the category table without assuming thead/tbody exist. PlayPSO renders
   * the drop tables as bare <tr> rows, so the database table may well do the same,
   * and a tbody-only selector silently finds nothing.
   */
  function parseTable(table) {
    const rows = Array.from(table.rows);
    if (rows.length === 0) return { fields: [], rows: [] };

    // Header rows are the leading rows made entirely of <th> cells.
    let headerCount = 0;
    while (headerCount < rows.length) {
      const cells = Array.from(rows[headerCount].cells);
      if (cells.length === 0 || !cells.every((cell) => cell.tagName === "TH")) break;
      headerCount += 1;
    }
    if (headerCount === 0) headerCount = 1; // No <th> at all: treat row 0 as the header.

    let fields = [];
    if (headerCount >= 2) {
      // Grouped header: "DFP" spanning min/max becomes min-DFP / max-DFP.
      const groups = Array.from(rows[0].cells).map((cell) => ({
        label: text(cell),
        span: cell.colSpan || 1,
        spansBothRows: (cell.rowSpan || 1) > 1,
      }));
      const subLabels = Array.from(rows[1].cells).map(text);
      let subIndex = 0;
      for (const group of groups) {
        if (group.spansBothRows) {
          fields.push(group.label);
          continue;
        }
        for (let offset = 0; offset < group.span; offset += 1) {
          const sub = subLabels[subIndex++] ?? "";
          fields.push(sub ? `${sub}-${group.label}` : group.label);
        }
      }
    } else {
      fields = Array.from(rows[0].cells).map(text);
    }

    const body = rows.slice(headerCount).map((row) => {
      const cells = Array.from(row.cells);
      if (cells.length === 0) return null;
      const record = {};
      fields.forEach((field, index) => {
        record[field] = cells[index] ? text(cells[index]) : "";
      });
      return record;
    });

    return { fields, rows: body.filter((row) => row && Object.values(row).some((value) => value !== "")) };
  }

  /** Picks the table whose header carries a Name column and has real data rows. */
  function parseDocument(doc) {
    const candidates = Array.from(doc.querySelectorAll("table"))
      .map(parseTable)
      .filter((parsed) => parsed.fields.includes("Name") && parsed.rows.length > 0);
    if (candidates.length === 0) return { fields: [], rows: [] };
    // The item table is the biggest one; anything else is navigation or a legend.
    return candidates.sort((a, b) => b.rows.length - a.rows.length)[0];
  }

  function build(category, parsed) {
    return {
      type: category.type,
      name: category.name,
      source: `https://playpso.net/database?type=${category.type}`,
      fields: parsed.fields,
      emptyFields: parsed.fields.filter((field) => parsed.rows.every((row) => (row[field] ?? "") === "")),
      rows: parsed.rows,
    };
  }

  const collected = [];
  const failures = [];
  const currentType = Number(new URLSearchParams(location.search).get("type") ?? 1);

  for (const category of CATEGORIES) {
    try {
      let parsed;
      if (category.type === currentType) {
        parsed = parseDocument(document);
      } else {
        // Same-origin request that reuses this tab's cleared session.
        const response = await fetch(`/database?type=${category.type}`, { credentials: "include" });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        parsed = parseDocument(new DOMParser().parseFromString(await response.text(), "text/html"));
      }
      if (parsed.rows.length === 0) throw new Error("no rows parsed");
      collected.push(build(category, parsed));
    } catch (error) {
      failures.push(`${category.name}: ${error.message}`);
    }
  }

  return { kind: "database", collectedAt: new Date().toISOString(), categories: collected, failures };
})();
