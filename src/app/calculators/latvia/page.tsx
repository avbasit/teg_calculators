import type { Metadata } from "next";
import { LatviaCalculator } from "@/components/calculator/latvia-calculator";

export const metadata: Metadata = {
  title: "Latvia",
  description: "Latvia Golden Visa (residence by investment) payment schedule calculator.",
};

export default function Page() {
  return <LatviaCalculator />;
}
