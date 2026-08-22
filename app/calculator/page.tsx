import type { Metadata } from "next";
import Calculator from "./Calculator";
import { getCalculatorPayload } from "./data";

export const metadata: Metadata = {
  title: "Stat Calculator | PSOBB Destiny Guide",
  description:
    "Add up ATP, ATA, DFP, EVP and resistances for any Destiny PSOBB loadout, including the boost effects written on each item.",
};

export default function CalculatorPage() {
  const payload = getCalculatorPayload();

  return <Calculator payload={payload} />;
}
