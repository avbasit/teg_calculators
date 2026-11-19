import type { Metadata } from "next";
import { PortugalCalculator } from "@/components/calculator/portugal-calculator";

export const metadata: Metadata = {
  title: "Portugal",
  description: "Portugal residency payment schedule calculators, including the D2 Visa.",
};

export default function Page() {
  return <PortugalCalculator />;
}
