/** Shared shapes used by every country calculator. */

export interface LineItem {
  id: string;
  label: string;
  /** Secondary text, e.g. which family member the row applies to. */
  detail?: string;
  unit: number;
  qty: number;
  total: number;
}

export interface PaymentStage {
  id: string;
  title: string;
  /** Short label used for the subtotal, e.g. "First payment (A)". */
  subtotalLabel: string;
  lines: LineItem[];
  subtotal: number;
}

export interface Quote {
  stages: PaymentStage[];
  total: number;
  familySize: number;
}

export interface CalculatorMeta {
  slug: string;
  country: string;
  shortName: string;
  region: string;
  programs: string[];
  status: "live" | "soon";
  /** One-line summary shown on the dashboard card. */
  blurb: string;
}
