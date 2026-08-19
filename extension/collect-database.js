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
