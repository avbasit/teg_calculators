import type { Metadata } from "next";
import { SpainCalculator } from "@/components/calculator/spain-calculator";

export const metadata: Metadata = {
  title: "Spain",
  description: "Spain residency payment schedule calculators, including the Digital Nomad Visa.",
};

export default function Page() {
  return <SpainCalculator />;
}
