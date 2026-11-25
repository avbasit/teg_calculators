/**
 * Greece — Golden Visa (permanent residency through real estate).
 *
 * Ported from "Greece - Pricing Sample.xlsx" (Лист1). Cell references are noted next to each rate.
 * Unlike the sheet's E10, the property price is part of the property purchase stage (A).
 */
import type { LineItem, PaymentStage, Quote } from "./types";

export type GrMemberKey = "main" | "spouse" | "child" | "parent";

export const GR_MEMBERS: { key: GrMemberKey; label: string; max: number }[] = [
  { key: "main", label: "Main Applicant", max: 1 },
  { key: "spouse", label: "Spouse", max: 1 },
  { key: "child", label: "Dependent Child", max: 10 },
  { key: "parent", label: "Dependent Parent", max: 4 },
];

export type GrFamily = Record<GrMemberKey, number>;

export const GR_RATES = {
  /** B3 — contract price; editable but never below €250,000 */
  minPropertyPrice: 250000,
  /** B5:C5 — lawyer's fee, minimum 1% of the contract price (editable above), plus 24% VAT */
  lawyer: { rate: 0.01, vat: 0.24 },
  /** B6 — public notary fee 1.5% */
  notaryRate: 0.015,
  /** B7 — land registry fee 0.6–0.9% depending on area; 0.6% is the automatic minimum */
  landRegistry: { minRate: 0.006, maxRate: 0.009 },
  /** B8 — title deed transfer fee 3.09% (sheet showed 3%; corrected rate) */
  titleDeedRate: 0.0309,
  /** B12:B13 — PR application */
  prApplication: { main: 1000, perDependant: 500 },
  /** B14:B15 — government fee for PR application */
  governmentFee: { main: 2016, perDependant: 166 },
  /** B16 — insurance, per year per person */
  insurance: 150,
  /** B17 — accountant, courier, admin; once per application */
  miscellaneous: 2000,
  /** B9 / B18 — TEG professional fee defaults (editable) */
  tegFee: { onSigning: 5000, afterApproval: 5000 },
} as const;

export interface GrInput {
  family: GrFamily;
  /** Contract price as entered; the quote never uses less than the €250,000 minimum. */
  propertyPrice: number;
  /** Land registry fee override; `null` uses the 0.6% minimum. Never below that minimum. */
  landRegistry: number | null;
  /** Lawyer's fee override; `null` uses the 1% minimum. Never below that minimum. */
  lawyerFee: number | null;
  retainerOnSigning: number;
  retainerAfterApproval: number;
}

export const DEFAULT_GR_INPUT: GrInput = {
  family: { main: 1, spouse: 0, child: 0, parent: 0 },
  propertyPrice: GR_RATES.minPropertyPrice,
  landRegistry: null,
  lawyerFee: null,
  retainerOnSigning: GR_RATES.tegFee.onSigning,
  retainerAfterApproval: GR_RATES.tegFee.afterApproval,
};

export const GR_MAX_PROPERTY_PRICE = 999_999_999;

export function grFamilySize(f: GrFamily): number {
  return GR_MEMBERS.reduce((n, m) => n + f[m.key], 0);
}

/** Contract price used in the quote. */
export function grPropertyPrice(input: GrInput): number {
  return Math.max(input.propertyPrice, GR_RATES.minPropertyPrice);
}

/** Land registry fee: the entered amount, but never below 0.6% of the contract price. */
export function grLandRegistry(input: GrInput): { amount: number; min: number; max: number } {
  const price = grPropertyPrice(input);
  const min = Math.round(price * GR_RATES.landRegistry.minRate);
  const max = Math.round(price * GR_RATES.landRegistry.maxRate);
  return { amount: Math.max(input.landRegistry ?? min, min), min, max };
}

/** Lawyer's fee before VAT: the entered amount, but never below 1% of the contract price. */
export function grLawyerFee(input: GrInput): { amount: number; min: number } {
  const min = Math.round(grPropertyPrice(input) * GR_RATES.lawyer.rate);
  return { amount: Math.max(input.lawyerFee ?? min, min), min };
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

const BEFORE_SUBMISSION = "Before application submission";

export function computeGrQuote(input: GrInput): Quote {
  const R = GR_RATES;
  const n = grFamilySize(input.family);
  const deps = n - 1;
  const price = grPropertyPrice(input);
  const lawyer = grLawyerFee(input).amount;
  const lawyerVat = Math.round(lawyer * R.lawyer.vat);

  const stages = [
    stage("purchase", "Property purchase", "Property Purchase Total", "Property purchase", [
      line("property", "Property (Contract Price)", price, 1, "Paid directly to the developer / seller"),
      line("lawyer", "Lawyer's Fee (min. 1%)", lawyer, 1),
      line("lawyer-vat", "VAT on Lawyer's Fee (24%)", lawyerVat, 1),
      line("notary", "Public Notary Fee (1.5%)", Math.round(price * R.notaryRate), 1),
      line("land-registry", "Land Registry Fee (0.6–0.9%)", grLandRegistry(input).amount, 1, "Depends on area"),
      line("title-deed", "Title Deed Transfer Fee (3.09%)", Math.round(price * R.titleDeedRate), 1),
      line("retainer-signing", "TEG Professional Fee (Upon Signing)", input.retainerOnSigning, 1, undefined, "Upon signing"),
    ]),
    stage("residency", "Residency application fee", "Residency Application Fee", "Residency application", [
      line("pr-main", "PR Application", R.prApplication.main, 1, "Main Applicant", BEFORE_SUBMISSION),
      line("pr-dep", "PR Application", R.prApplication.perDependant, deps, "Each dependant", BEFORE_SUBMISSION),
      line("gov-main", "Government Fee for PR Application", R.governmentFee.main, 1, "Main Applicant", BEFORE_SUBMISSION),
      line("gov-dep", "Government Fee for PR Application", R.governmentFee.perDependant, deps, "Each dependant", BEFORE_SUBMISSION),
      line("insurance", "Insurance (per year per person)", R.insurance, n, `${n} × person`, BEFORE_SUBMISSION),
      line("misc", "Miscellaneous", R.miscellaneous, 1, "Accountant, courier, admin", BEFORE_SUBMISSION),
    ]),
    stage("approval", "TEG professional fee (after approval)", "After Approval", "After approval", [
      line("retainer-approval", "TEG Professional Fee (After Approval)", input.retainerAfterApproval, 1, undefined, "After approval"),
    ]),
  ].filter((s) => s.lines.length > 0);

  return { currency: "EUR", stages, total: stages.reduce((s, st) => s + st.subtotal, 0), familySize: n };
}

export const GR_NOTES = [
  "All transactions will take place in EUR or AED, to be transferred to the company bank account in Dubai, UAE.",
  "Investment to be made directly with the Developer/Seller.",
  "Final cost may vary depending on the developer/property selected.",
  "The client is responsible for the exchange rate difference.",
  "All amounts mentioned are exclusive of VAT.",
  "This quotation is valid for 30 days from the date of quotation.",
];
