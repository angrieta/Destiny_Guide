/**
 * Paste this into the DevTools console on https://www.playpso.net/database
 * (F12 -> Console). It reads the tables your browser has already loaded and
 * downloads one JSON file, which `pnpm import:snapshot` turns into data/*.json.
 *
 * Why a console snippet: PlayPSO sits behind a Cloudflare challenge that refuses
 * automated browsers, so a scraper cannot fetch these pages. This runs inside the
 * session you already opened by hand, and only reads what is on screen.
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

  function buildPayload(category, parsed) {
    const emptyFields = parsed.fields.filter((field) => parsed.rows.every((row) => (row[field] ?? "") === ""));
    return {
      type: category.type,
      name: category.name,
      source: `https://playpso.net/database?type=${category.type}`,
      fields: parsed.fields,
      emptyFields,
      rows: parsed.rows,
    };
  }

  // Results accumulate across runs, so if a category has to be opened by hand
  // you can just re-run this on each page until all five are collected.
  const STORE_KEY = "destiny-guide-snapshot";
  const collected = new Map();
  try {
    for (const entry of JSON.parse(sessionStorage.getItem(STORE_KEY) ?? "[]")) {
      collected.set(entry.type, entry);
    }
  } catch {
    // A corrupt store just means starting over.
  }

  const record = (category, parsed, note) => {
    const payload = buildPayload(category, parsed);
    collected.set(category.type, payload);
    console.log(`${category.name}: ${parsed.rows.length} rows${note ? ` (${note})` : ""}`);
    if (parsed.rows.length > 0) console.log("   first row:", parsed.rows[0]);
  };

  const currentType = Number(new URLSearchParams(location.search).get("type") ?? 1);
  const missing = [];

  for (const category of CATEGORIES) {
    if (category.type === currentType) {
      const parsed = parseDocument(document);
      if (parsed.rows.length === 0) {
        console.error(`${category.name}: no table found on this page. Wait for it to load, then re-run.`);
        missing.push(category);
        continue;
      }
      record(category, parsed, "current page");
      continue;
    }
    try {
      // Same-origin request, reusing the session you already opened.
      const response = await fetch(`/database?type=${category.type}`, { credentials: "include" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const html = await response.text();
      const parsed = parseDocument(new DOMParser().parseFromString(html, "text/html"));
      if (parsed.rows.length === 0) throw new Error("table is rendered by script, not in the HTML");
      record(category, parsed);
    } catch (error) {
      if (!collected.has(category.type)) missing.push(category);
      console.warn(`${category.name}: not readable from here (${error.message})`);
    }
  }

  sessionStorage.setItem(STORE_KEY, JSON.stringify([...collected.values()]));

  if (collected.size === 0) {
    console.error("Nothing collected yet. Make sure the item table is visible, then run again.");
    return;
  }

  if (missing.length > 0) {
    console.log("");
    console.log(`Collected ${collected.size} of ${CATEGORIES.length}. Open each of these and re-run this snippet:`);
    for (const category of missing) {
      console.log(`  ${category.name}: https://www.playpso.net/database?type=${category.type}`);
    }
    console.log("Progress is kept in this tab, so the download happens once all five are in.");
    return;
  }

  const categories = [...collected.values()].sort((a, b) => a.type - b.type);
  const total = categories.reduce((sum, entry) => sum + entry.rows.length, 0);
  const blob = new Blob([JSON.stringify({ collectedAt: new Date().toISOString(), categories })], {
    type: "application/json",
  });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "playpso-database-snapshot.json";
  document.body.appendChild(link);
  link.click();
  link.remove();
  sessionStorage.removeItem(STORE_KEY);

  console.log("");
  console.log(`Downloaded playpso-database-snapshot.json - ${categories.length} categories, ${total} items.`);
})();
