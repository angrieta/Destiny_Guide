import type { Metadata } from "next";
import weapons from "@/data/database-1.json";
import RedeemCalculator from "./RedeemCalculator";

export const metadata: Metadata = {
  title: "Redeem Calculator | PSOBB Destiny Guide",
  description:
    "Count the Donation Tokens a percentage order costs, check it against the rules staff refuse orders for, and get the message in the format they ask for.",
};

type Source = { rows: Array<{ Name?: string }> };

/** Names only, for the autocomplete. Section ID variants repeat, so dedupe. */
function weaponNames() {
  const names = new Set<string>();
  for (const row of (weapons as Source).rows) {
    const name = (row.Name ?? "").trim();
    if (name) names.add(name);
  }
  return Array.from(names).sort((a, b) => a.localeCompare(b));
}

export default function RedeemPage() {
  return <RedeemCalculator weaponNames={weaponNames()} />;
}
