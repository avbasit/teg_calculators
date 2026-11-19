/**
 * Spain — Digital Nomad Visa.
 *
 * Ported from "Spain - Digital Nomad Visa.xlsx" (Sheet1). Cell references are noted next to each rate.
 * The sheet's cost is TEG's own fee — no separate professional fee is added on top.
 */
import type { LineItem, PaymentStage, Quote } from "./types";

export type EsMemberKey = "main" | "spouse" | "child" | "parent";

export const ES_MEMBERS: { key: EsMemberKey; label: string; hint?: string; max: number }[] = [
  { key: "main", label: "Main Applicant", max: 1 },
  { key: "spouse", label: "Spouse", max: 1 },
  { key: "child", label: "Dependent Child", hint: "No maximum age — dependency must be proved.", max: 10 },
  { key: "parent", label: "Parent of Main Applicant", max: 2 },
];

export type EsFamily = Record<EsMemberKey, number>;

export const ES_RATES = {
  /** C4:C5 — TEG fee, paid 50% in advance and 50% upon proof of submission (A7:A8) */
  fee: { main: 2500, perDependant: 1000 },
  /** C12:D15 — minimum income required (proof of means, not a cost) */
  minIncome: {
    byDependants: [
      { label: "Single applicant", monthly: 3001, yearly: 36008 },
      { label: "Applicant with 1 dependant", monthly: 4126, yearly: 49511 },
      { label: "Applicant with 2 dependants", monthly: 4501, yearly: 54012 },
    ],
    extraDependant: { monthly: 375, yearly: 4501 },
  },
  /** Bank fee, per person — collected with the first payment (upon signing) */
  bankFee: 74,
} as const;

export interface EsInput {
  family: EsFamily;
  /** Full TEG fee — split 50 / 50 across the two payments. */
  feeMain: number;
  feeDependant: number;
}

export const DEFAULT_ES_INPUT: EsInput = {
  family: { main: 1, spouse: 0, child: 0, parent: 0 },
  feeMain: ES_RATES.fee.main,
  feeDependant: ES_RATES.fee.perDependant,
};

export function esFamilySize(f: EsFamily): number {
  return ES_MEMBERS.reduce((n, m) => n + f[m.key], 0);
}

/** Minimum income the family must show (C12:D15). */
export function esMinIncome(f: EsFamily): { monthly: number; yearly: number } {
  const { byDependants, extraDependant } = ES_RATES.minIncome;
  const deps = esFamilySize(f) - 1;
  const base = byDependants[Math.min(deps, byDependants.length - 1)];
  const extra = Math.max(0, deps - (byDependants.length - 1));
  return { monthly: base.monthly + extra * extraDependant.monthly, yearly: base.yearly + extra * extraDependant.yearly };
}

const line = (id: string, label: string, unit: number, qty: number, detail?: string, timeline?: string): LineItem => ({
  id,
  label,
  detail,
  timeline,
  unit,
  qty,
  total: unit * qty,
});

function stage(id: string, title: string, subtotalLabel: string, short: string, lines: LineItem[]): PaymentStage {
  const kept = lines.filter((l) => l.qty > 0 && l.unit > 0);
  return { id, title, subtotalLabel, short, lines: kept, subtotal: kept.reduce((s, l) => s + l.total, 0) };
}

export function computeEsQuote(input: EsInput): Quote {
  const n = esFamilySize(input.family);
  const deps = n - 1;

  const half = (prefix: string, timeline: string) => [
    line(`${prefix}-main`, "TEG Fee (50%)", input.feeMain / 2, 1, "Main Applicant", timeline),
    line(`${prefix}-dep`, "TEG Fee (50%)", input.feeDependant / 2, deps, "Each dependant", timeline),
  ];

  const stages = [
    stage("advance", "Upon signing", "First Payment", "Upon signing", [
      ...half("advance", "Upon signing"),
      line("bank-fee", "Bank Fee", ES_RATES.bankFee, n, `${n} × person`, "Upon signing"),
    ]),
    stage("submission", "50% upon proof of submission", "Balance Payment", "50% upon submission", half("submission", "Upon proof of submission")),
  ].filter((s) => s.lines.length > 0);

  return { currency: "EUR", stages, total: stages.reduce((s, st) => s + st.subtotal, 0), familySize: n };
}

export const ES_NOTES = [
  "All transactions will take place in EUR or AED, to be transferred to the company bank account in Dubai, UAE.",
  "TEG fee is payable 50% upon signing and 50% upon proof of submission.",
  "No maximum age limit for dependant children. Dependency needs to be proved.",
  "Parents of the main applicant are also eligible.",
  "Minimum income required is shown for guidance and is not a cost.",
  "Bank fee of €74 per person is collected with the first payment (upon signing).",
  "Sworn translation, notary attestation and apostille costs are additional and charged as per the number of documents; they are not included in this quotation.",
  "The client is responsible for the exchange rate difference.",
  "All amounts mentioned are exclusive of VAT.",
  "This quotation is valid for 30 days from the date of quotation.",
];
