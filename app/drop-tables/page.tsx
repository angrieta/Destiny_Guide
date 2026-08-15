import type { Metadata } from "next";
import DropTableExplorer from "./DropTableExplorer";
import { getDropTablePayload } from "./data";
import styles from "./drop-tables.module.css";

export const metadata: Metadata = {
  title: "Drop Table Search | PSOBB Destiny Guide",
  description: "Search Destiny PSOBB drops by difficulty, Section ID, episode, area, enemy, item type, and drop rate.",
};

export default function DropTablesPage() {
  const payload = getDropTablePayload();

  return (
    <main className={styles.pageShell}>
      <DropTableExplorer payload={payload} />
    </main>
  );
}
