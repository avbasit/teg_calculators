import type { Metadata } from "next";
import { GreeceCalculator } from "@/components/calculator/greece-calculator";

export const metadata: Metadata = {
  title: "Greece",
  description: "Greece Golden Visa (residency through real estate) payment schedule calculator.",
};

export default function Page() {
  return <GreeceCalculator />;
}
