/**
 * Latvia — Golden Visa (residence by investment) pricing engine.
 *
 * Ported from "_20260921 Pricing Computation - Latvia.xlsx".
 * Cell references point at the workbook's "Dropdown and charges" sheet.
 */
import type { LineItem, PaymentStage, Quote } from "./types";

export type LatviaPlan = 50000 | 100000;

export const LATVIA_PLANS: Record<LatviaPlan, { short: string; name: string; description: string }> = {
  50000: {
    short: "€50,000",
    name: "Equity in a Latvian company",
    description:
      "€50,000 equity investment in a Latvian company. Legal fees of €4,000 on signing and €4,000 on approval apply to this plan.",
  },
  100000: {
    short: "€100,000",
    name: "Investment company shares",
    description:
      "€100,000 invested directly in Latvia into an investment company shares account. No legal fees apply to this plan.",
  },
};

export const LATVIA_RATES = {
  /** B5 — per application */
  stateBudgetPayment: 10000,
  /** B8:B9 — main applicant, and each spouse/child */
  caseNumber: { main: 170, perDependant: 30 },
  /** B11 — per person */
  initialApplication: 160,
  /** B12 — per person */
  embassyFee: 252,
  /** B15:B17 — annual rate × 5 years */
  medicalInsurance: { main: 375, spouse: 375, perChild: 250 },
  /** B19 — per person */
  xRay: 80,
  /** B22:B24 */
  biometrics: { main: 155, spouse: 155, perChild: 80 },
  /** B27:B29 — annual rate × 4 years */
  renewal: { main: 1520, spouse: 320, perChild: 320 },
  /** B32:B35 — once per application */
  misc: { bankAccountOpening: 1000, bankAccountFee: 600, bankDeclaration: 100, shareCapitalIncrease: 175 },
  /** B38:B39 — only for the €50,000 plan */
  legalFee: { onSigning: 4000, onApproval: 4000, plan: 50000 as LatviaPlan },
} as const;

export interface LatviaInput {
  plan: LatviaPlan;
  spouse: 0 | 1;
  children: number;
  /** TEG professional fee — workbook cells C45 / C46. */
  retainerOnSigning: number;
  retainerOnApproval: number;
  /** Legal fee overrides; `null` uses the workbook default for the plan (C50 / C51). */
  legalOnSigning: number | null;
  legalOnApproval: number | null;
}

export const DEFAULT_LATVIA_INPUT: LatviaInput = {
  plan: 100000,
  spouse: 0,
  children: 0,
  retainerOnSigning: 5000,
  retainerOnApproval: 5000,
  legalOnSigning: null,
  legalOnApproval: null,
};

/** Legal fees actually charged: the override if set, otherwise the workbook default (only on the €50,000 plan). */
export function latviaLegalFees(input: LatviaInput): { onSigning: number; onApproval: number } {
  const L = LATVIA_RATES.legalFee;
  const applies = input.plan === L.plan;
  return {
    onSigning: input.legalOnSigning ?? (applies ? L.onSigning : 0),
    onApproval: input.legalOnApproval ?? (applies ? L.onApproval : 0),
  };
}

export const LATVIA_MAX_CHILDREN = 10;

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

export function latviaFamilySize(input: LatviaInput): number {
  return 1 + input.spouse + input.children;
}

export function computeLatviaQuote(input: LatviaInput): Quote {
  const R = LATVIA_RATES;
  const { spouse, children } = input;
  const n = latviaFamilySize(input);
  const atAppointment = "During appointment in Latvia";
  const legal = latviaLegalFees(input);

  const stages = [
    stage("investment", "Complete investment", "Complete Investment", "Investment", [
      line("investment", "Investment", input.plan, 1, LATVIA_PLANS[input.plan].name, "Upon signing shareholder agreement"),
    ]),
    stage("cost", "Cost", "Cost Total", "Government & processing", [
      line("state-budget", "One-Time State Budget Payment", R.stateBudgetPayment, 1, undefined, "On submission"),
      line("case-main", "Case Number", R.caseNumber.main, 1, "Main Applicant", "Before submission"),
      line("case-dep", "Case Number", R.caseNumber.perDependant, spouse + children, "Per dependant", "Before submission"),
      line("initial-application", "Initial Application", R.initialApplication, n, `${n} × person`, "On submission"),
      line("embassy", "Embassy Fee", R.embassyFee, n, `${n} × person`, "On submission"),
      line("medical-main", "Medical Insurance (Annual Rate × 5 years)", R.medicalInsurance.main, 1, "Main Applicant", atAppointment),
      line("medical-spouse", "Medical Insurance (Annual Rate × 5 years)", R.medicalInsurance.spouse, spouse, "Spouse", atAppointment),
      line("medical-child", "Medical Insurance (Annual Rate × 5 years)", R.medicalInsurance.perChild, children, "Per dependant", atAppointment),
      line("x-ray", "X-Ray", R.xRay, n, `${n} × person`, atAppointment),
      line("biometrics-main", "Biometrics", R.biometrics.main, 1, "Main Applicant", atAppointment),
      line("biometrics-spouse", "Biometrics", R.biometrics.spouse, spouse, "Spouse", atAppointment),
      line("biometrics-child", "Biometrics", R.biometrics.perChild, children, "Per dependant", atAppointment),
      line("renewal-main", "Renewal (Annual Rate × 4 years)", R.renewal.main, 1, "Main Applicant", "Annual payment for renewal for 4 years"),
      line("renewal-spouse", "Renewal (Annual Rate × 4 years)", R.renewal.spouse, spouse, "Spouse", "Annual payment for renewal for 4 years"),
      line("renewal-child", "Renewal (Annual Rate × 4 years)", R.renewal.perChild, children, "Per dependant", "Annual payment for renewal for 4 years"),
    ]),
    stage("misc", "Miscellaneous costs", "Miscellaneous Costs Total", "Miscellaneous", [
      line("bank-opening", "Bank Account Opening Fee", R.misc.bankAccountOpening, 1, undefined, "On application"),
      line("bank-fee", "Bank Account Fee (Annual Rate × 5 years)", R.misc.bankAccountFee, 1, undefined, "Annual payment for 5 years"),
      line("bank-declaration", "Bank Declaration Document", R.misc.bankDeclaration, 1, undefined, "On bank transfer"),
      line("share-capital", "Share Capital Increase in Company", R.misc.shareCapitalIncrease, 1, undefined, "In case of increasing of share capital"),
    ]),
    stage("teg", "TEG professional fee", "TEG Professional Fee Total", "TEG professional fee", [
      line("retainer-signing", "TEG Retainer (Upon Signing)", input.retainerOnSigning, 1, undefined, "Upon signing of agreement"),
      line("retainer-approval", "TEG Retainer (Upon Approval)", input.retainerOnApproval, 1, undefined, "After approval"),
    ]),
    stage("legal", "Legal fee", "Legal Fee Total", "Legal fee", [
      line("legal-signing", "Legal Fee (Upon Signing)", legal.onSigning, 1, undefined, "Upon signing of agreement"),
      line("legal-approval", "Legal Fee (Upon Approval)", legal.onApproval, 1, undefined, "After approval"),
    ]),
  ].filter((s) => s.lines.length > 0);

  return { currency: "EUR", stages, total: stages.reduce((s, st) => s + st.subtotal, 0), familySize: n };
}

export const LATVIA_NOTES = [
  "All transactions will take place in EUR or AED, to be transferred to the company bank account in Dubai, UAE.",
  "Investment to be made directly in Latvia into investment company shares account.",
  "The client is responsible for the exchange rate difference.",
  "All amounts mentioned are exclusive of VAT.",
  "Maximum age for children is 18.",
  "Minimum medical insurance coverage for each individual should be EUR46,000/-.",
  "This quotation is valid for 30 days from the date of quotation.",
];
