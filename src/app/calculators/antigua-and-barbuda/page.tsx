import type { Metadata } from "next";
import { AntiguaCalculator } from "@/components/calculator/antigua-calculator";

export const metadata: Metadata = {
  title: "Antigua & Barbuda",
  description: "Contribution and business investment payment schedule calculator for Antigua & Barbuda citizenship by investment.",
};

export default function Page() {
  return <AntiguaCalculator />;
}
