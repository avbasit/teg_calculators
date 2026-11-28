import type { Metadata } from "next";
import { MaltaCalculator } from "@/components/calculator/malta-calculator";

export const metadata: Metadata = {
  title: "Malta",
  description: "Malta Permanent Residence Programme (MPRP) payment schedule calculator for the rental and purchase routes.",
};

export default function Page() {
  return <MaltaCalculator />;
}
