import type { Metadata } from "next";
import Calculator from "./Calculator";
import { getCalculatorPayload } from "./data";

export const metadata: Metadata = {
  title: "Stat Calculator | PSOBB Destiny Guide",
  description:
    "Add up ATP, ATA, DFP, EVP and resistances for any Destiny PSOBB loadout, including the boost effects written on each item.",
  // Unlisted while the damage model is still being verified: no nav link points
  // here, so keep it out of search results too rather than having players find
  // it that way.
  robots: { index: false, follow: false },
};

export default function CalculatorPage() {
  const payload = getCalculatorPayload();

  return <Calculator payload={payload} />;
}
