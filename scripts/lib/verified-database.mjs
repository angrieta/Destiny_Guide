/** Preserve mirror row order/IDs and append only released, verified additions. */
export function withVerifiedRows(source, verified) {
  const rows = source.rows.map(row => ({ ...row }));
  for (const item of verified.items) {
    if (!['live','issue'].includes(item.status) || item.database?.category !== source.name) continue;
    const index = rows.findIndex(row => row.Name.toUpperCase() === item.database.row.Name.toUpperCase());
    if (index < 0) rows.push({ ...item.database.row });
    else Object.assign(rows[index], item.database.row);
  }
  return { ...source, rows };
}
