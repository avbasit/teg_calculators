/** Shared shapes used by every country calculator. */
import type { Currency } from "@/lib/format";

export interface LineItem {
  id: string;
  label: string;
  /** Secondary text, e.g. which family member the row applies to. */
  detail?: string;
  /** When the fee is paid, e.g. "On submission". */
  timeline?: string;
  unit: number;
  qty: number;
  total: number;
}

export interface PaymentStage {
  id: string;
  title: string;
  /** Subtotal label without its letter, e.g. "First Payment" → shown as "First Payment (A)". */
  subtotalLabel: string;
  /** Short name for the summary panel, e.g. "At file submission". */
  short: string;
  lines: LineItem[];
  subtotal: number;
}

export interface Quote {
  currency: Currency;
  stages: PaymentStage[];
  total: number;
  familySize: number;
}

export type CalculatorCategory = "citizenship" | "residency";
export type CalculatorStatus = "live" | "soon" | "paused" | "discontinued";
export type CalculatorRegion = "Caribbean" | "Europe" | "Americas" | "Asia-Pacific" | "Middle East & Africa";

export interface CalculatorMeta {
  slug: string;
  category: CalculatorCategory;
  country: string;
  /** Programme name when the country has more than one card or a named scheme. */
  programme?: string;
  /** Two-letter code for the monogram tile. */
  shortName: string;
  region: CalculatorRegion;
  /** Chips on the card: investment routes or the minimum investment. */
  tags: string[];
  status: CalculatorStatus;
  /** One-line summary shown on the dashboard card. */
  blurb: string;
}

/** Letters used to name payment stages: A, B, C… */
export const stageLetter = (i: number) => String.fromCharCode(65 + i);
