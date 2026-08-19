import type { Metadata } from "next";
import ItemDatabase from "./ItemDatabase";
import { getDatabasePayload } from "./data";

export const metadata: Metadata = {
  title: "Item Database | PSOBB Destiny Guide",
  description:
    "Search every Destiny PSOBB weapon, armor, shield, unit, and mag by name, type, special, class, and stats.",
};

export default function DatabasePage() {
  const payload = getDatabasePayload();

  return <ItemDatabase payload={payload} />;
}
