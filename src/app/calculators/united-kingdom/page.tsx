import type { Metadata } from "next";
import { UnitedKingdomCalculator } from "@/components/calculator/united-kingdom-calculator";

export const metadata: Metadata = {
  title: "United Kingdom",
  description: "United Kingdom payment schedule calculators, including the Innovator Founder Visa.",
};

export default function Page() {
  return <UnitedKingdomCalculator />;
}
