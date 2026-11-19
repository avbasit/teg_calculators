/**
 * Portugal — D2 (entrepreneur / independent professional) visa.
 *
 * Ported from "Portugal D2 Costing.xlsx" (Sheet1). Cell references are noted next to each rate.
 * The sheet's cost is TEG's own fee — no separate professional fee is added on top.
 */
import type { LineItem, PaymentStage, Quote } from "./types";

export type PtMemberKey = "main" | "spouse" | "child";

export const PT_MEMBERS: { key: PtMemberKey; label: string; max: number }[] = [
  { key: "main", label: "Main Applicant", max: 1 },
  { key: "spouse", label: "Spouse", max: 1 },
  { key: "child", label: "Dependent Child", max: 10 },
];

export type PtFamily = Record<PtMemberKey, number>;

export const PT_RATES = {
  /** C3:C5 — TEG fee per member, paid 50% in advance and 50% after the visa is issued (A7:A8) */
  fee: { main: 10000, spouse: 2000, perChild: 1000 },
  /** C10 — per person, approximate */
  embassyFee: 155,
  /** C11 — per person, approximate */
  travelInsurance: 150,
  /** C14:C16 — minimum settlement funds per year (proof of means, not a cost) */
  settlementFunds: { main: 11500, spouse: 5750, perChild: 3450 },
} as const;

export interface PtInput {
  family: PtFamily;
  /** Full TEG fee per member — split 50 / 50 across the two payments. */
  feeMain: number;
  feeSpouse: number;
  feeChild: number;
}

export const DEFAULT_PT_INPUT: PtInput = {
  family: { main: 1, spouse: 0, child: 0 },
  feeMain: PT_RATES.fee.main,
  feeSpouse: PT_RATES.fee.spouse,
  feeChild: PT_RATES.fee.perChild,
};

export function ptFamilySize(f: PtFamily): number {
  return PT_MEMBERS.reduce((n, m) => n + f[m.key], 0);
}

/** Minimum settlement funds the family must show, per year. */
export function ptSettlementFunds(f: PtFamily): number {
  const S = PT_RATES.settlementFunds;
  return S.main * f.main + S.spouse * f.spouse + S.perChild * f.child;
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

export function computePtQuote(input: PtInput): Quote {
  const R = PT_RATES;
  const { spouse, child } = input.family;
  const n = ptFamilySize(input.family);

  const half = (prefix: string, timeline: string) => [
    line(`${prefix}-main`, "TEG Fee (50%)", input.feeMain / 2, 1, "Main Applicant", timeline),
    line(`${prefix}-spouse`, "TEG Fee (50%)", input.feeSpouse / 2, spouse, "Spouse", timeline),
    line(`${prefix}-child`, "TEG Fee (50%)", input.feeChild / 2, child, "Each child", timeline),
  ];

  const stages = [
    stage("advance", "50% advance", "Advance Payment", "50% advance", half("advance", "Upon signing")),
    stage("after-visa", "50% after visa from embassy", "Balance Payment", "50% after visa", half("after-visa", "After visa from embassy")),
    stage("third-party", "Third-party costs (approx.) — paid directly by client", "Third-Party Costs", "Embassy & insurance (direct)", [
      line("embassy", "Embassy Fee (approx.)", R.embassyFee, n, `${n} × person · paid directly to the embassy`, "On visa application"),
      line("travel-insurance", "Travel Insurance (approx.)", R.travelInsurance, n, `${n} × person · paid directly to the insurance company`, "Before embassy appointment"),
    ]),
  ].filter((s) => s.lines.length > 0);

  return { currency: "EUR", stages, total: stages.reduce((s, st) => s + st.subtotal, 0), familySize: n };
}

export const PT_NOTES = [
  "All transactions will take place in EUR or AED, to be transferred to the company bank account in Dubai, UAE.",
  "TEG fee is payable 50% in advance and 50% after the visa is issued by the embassy.",
  "Embassy fee and travel insurance are approximate and are paid directly by the client to the embassy and the insurance company. TEG will not receive this amount in any form.",
  "Minimum settlement funds (€11,500 per year for the main applicant, €5,750 for a spouse and €3,450 per child) must be shown and are not a cost.",
  "The client is responsible for the exchange rate difference.",
  "All amounts mentioned are exclusive of VAT.",
  "This quotation is valid for 30 days from the date of quotation.",
];
