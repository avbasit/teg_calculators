import type { Metadata } from "next";
import { SknCalculator } from "@/components/calculator/skn-calculator";

export const metadata: Metadata = {
  title: "St. Kitts & Nevis",
  description: "SISC and PBO payment schedule calculator for St. Kitts & Nevis citizenship by investment.",
};

export default function Page() {
  return <SknCalculator />;
}
