import type { Metadata } from "next";
import { StpCalculator } from "@/components/calculator/stp-calculator";

export const metadata: Metadata = {
  title: "São Tomé and Príncipe",
  description: "Donation route payment schedule calculator for São Tomé and Príncipe citizenship by investment.",
};

export default function Page() {
  return <StpCalculator />;
}
