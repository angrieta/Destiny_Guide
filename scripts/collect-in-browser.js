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

  function parseDocument(doc) {
    const table = Array.from(doc.querySelectorAll("table")).find((candidate) => {
      const headings = Array.from(candidate.querySelectorAll("th")).map((cell) => text(cell));
      return headings.includes("Name") && candidate.querySelectorAll("tbody tr").length > 0;
    });
    if (!table) return { fields: [], rows: [] };

    const headerRows = Array.from(table.querySelectorAll("thead tr"));
    const bodyRows = Array.from(table.querySelectorAll("tbody tr"));

    let fields = [];
    if (headerRows.length >= 2) {
      const groups = Array.from(headerRows[0].children).map((cell) => ({
        label: text(cell),
        span: Number(cell.getAttribute("colspan") ?? 1),
        spansBothRows: Number(cell.getAttribute("rowspan") ?? 1) > 1,
      }));
      const subLabels = Array.from(headerRows[1].children).map(text);
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
    } else if (headerRows.length === 1) {
      fields = Array.from(headerRows[0].children).map(text);
    } else {
      const firstRow = table.querySelector("tr");
      fields = firstRow ? Array.from(firstRow.children).map(text) : [];
    }

    const rows = bodyRows
      .map((row) => {
        const cells = Array.from(row.children);
        if (cells.length === 0) return null;
        const record = {};
        fields.forEach((field, index) => {
          record[field] = cells[index] ? text(cells[index]) : "";
        });
        return record;
      })
      .filter((row) => row && Object.values(row).some((value) => value !== ""));

    return { fields, rows };
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

  const collected = [];
  const currentType = Number(new URLSearchParams(location.search).get("type") ?? 1);

  for (const category of CATEGORIES) {
    if (category.type === currentType) {
      collected.push(buildPayload(category, parseDocument(document)));
      console.log(`${category.name}: ${collected.at(-1).rows.length} rows (current page)`);
      continue;
    }
    try {
      // Same-origin request, reusing the session you already opened.
      const response = await fetch(`/database?type=${category.type}`, { credentials: "include" });
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      const html = await response.text();
      const doc = new DOMParser().parseFromString(html, "text/html");
      const parsed = parseDocument(doc);
      if (parsed.rows.length === 0) throw new Error("no rows parsed");
      collected.push(buildPayload(category, parsed));
      console.log(`${category.name}: ${parsed.rows.length} rows`);
    } catch (error) {
      console.warn(
        `${category.name}: could not read automatically (${error.message}). ` +
          `Open https://www.playpso.net/database?type=${category.type} and run this snippet again.`,
      );
    }
  }

  if (collected.length === 0) {
    console.error("Nothing collected. Make sure the item table is visible, then run again.");
    return;
  }

  const total = collected.reduce((sum, entry) => sum + entry.rows.length, 0);
  const blob = new Blob([JSON.stringify({ collectedAt: new Date().toISOString(), categories: collected })], {
    type: "application/json",
  });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = "playpso-database-snapshot.json";
  document.body.appendChild(link);
  link.click();
  link.remove();

  console.log(`Downloaded playpso-database-snapshot.json - ${collected.length} categories, ${total} items.`);
})();
