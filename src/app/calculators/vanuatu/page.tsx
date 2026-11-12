import type { Metadata } from "next";
import { VanuatuCalculator } from "@/components/calculator/vanuatu-calculator";

export const metadata: Metadata = {
  title: "Vanuatu",
  description: "DSP donation route payment schedule calculator for Vanuatu citizenship by investment.",
};

export default function Page() {
  return <VanuatuCalculator />;
}
