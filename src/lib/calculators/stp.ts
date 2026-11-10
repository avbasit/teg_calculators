/**
 * São Tomé and Príncipe — Citizenship by Investment (donation route) pricing engine.
 *
 * Ported from "Calculation Sheet.xlsx" (Sheet1). Cell references are noted next to each rate.
 */
import type { LineItem, PaymentStage, Quote } from "./types";

export type StpMemberKey = "main" | "spouse" | "child" | "parent";

export interface StpMemberDef {
  key: StpMemberKey;
  label: string;
  hint?: string;
  max: number;
}

export const STP_MEMBERS: StpMemberDef[] = [
  { key: "main", label: "Main Applicant", max: 1 },
  { key: "spouse", label: "Spouse", max: 1 },
  { key: "child", label: "Dependent Child (up to 30)", hint: "Maximum age for children is 30 years old.", max: 10 },
  { key: "parent", label: "Dependent Parent / Grandparent 55+", hint: "Minimum age for parents and grandparents is 55 years old.", max: 4 },
];

export type StpFamily = Record<StpMemberKey, number>;

export const STP_RATES = {
  /** D6 / D7 — once per application, whatever the family size */
  dueDiligence: 5250,
  donation: {
    /** D10 */
    single: 90000,
    /** D11 — family of up to `familyCovers` persons */
    family: 95000,
    familyCovers: 4,
    /** D15 — each dependant from the 5th person onwards */
    extraDependant: 5000,
  },
  /** D13 — each family member */
  citizenshipDocuments: 780,
} as const;

export interface StpInput {
  family: StpFamily;
  /** TEG professional fee — editable, as on every calculator. */
  retainerOnSigning: number;
  retainerOnApproval: number;
}

export const DEFAULT_STP_INPUT: StpInput = {
  family: { main: 1, spouse: 0, child: 0, parent: 0 },
  retainerOnSigning: 0,
  retainerOnApproval: 0,
};

export function stpFamilySize(f: StpFamily): number {
  return STP_MEMBERS.reduce((n, m) => n + f[m.key], 0);
}

const line = (id: string, label: string, unit: number, qty: number, detail?: string): LineItem => ({
  id,
  label,
  detail,
  unit,
  qty,
  total: unit * qty,
});

function stage(id: string, title: string, subtotalLabel: string, short: string, lines: LineItem[]): PaymentStage {
  const kept = lines.filter((l) => l.qty > 0 && l.unit > 0);
  return { id, title, subtotalLabel, short, lines: kept, subtotal: kept.reduce((s, l) => s + l.total, 0) };
}

export function computeStpQuote(input: StpInput): Quote {
  const R = STP_RATES;
  const n = stpFamilySize(input.family);
  const single = n === 1;
  const extra = Math.max(0, n - R.donation.familyCovers);

  const stages = [
    stage("first", "First payment at file submission", "First Payment", "At file submission", [
      line("due-diligence", "Due Diligence", R.dueDiligence, 1, single ? "Single applicant" : "Family (irrespective of number of members)"),
      line("retainer-signing", "TEG Retainer (Upon Signing)", input.retainerOnSigning, 1),
    ]),
    stage("final", "Final payment after approval", "Final Payment", "After approval", [
      line(
        "donation",
        "Donation",
        single ? R.donation.single : R.donation.family,
        1,
        single ? "Single applicant" : `Family (up to ${R.donation.familyCovers})`,
      ),
      line("extra-dependants", "Additional Dependant", R.donation.extraDependant, extra, "5th member onwards"),
      line("documents", "Citizenship Documents", R.citizenshipDocuments, n, `${n} × member`),
      line("retainer-approval", "TEG Retainer (Upon Approval)", input.retainerOnApproval, 1),
    ]),
  ];

  return { currency: "USD", stages, total: stages.reduce((s, st) => s + st.subtotal, 0), familySize: n };
}

export const STP_NOTES = [
  "All transactions will take place in USD or AED, to be transferred to the company bank account in Dubai, UAE.",
  "Donation to be made directly with the authorities.",
  "The client is responsible for the exchange rate difference.",
  "All amounts mentioned are exclusive of VAT.",
  "Maximum age for children is 30 years old; minimum age for parents/grandparents is 55 years old.",
  "This quotation is valid for 30 days from the date of quotation.",
];
