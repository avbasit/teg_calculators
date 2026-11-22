import type { Metadata } from "next";
import { TurkiyeCalculator } from "@/components/calculator/turkiye-calculator";

export const metadata: Metadata = {
  title: "Türkiye",
  description: "Türkiye citizenship by investment payment schedule calculator for the Real Estate and Bank Deposit routes.",
};

export default function Page() {
  return <TurkiyeCalculator />;
}
