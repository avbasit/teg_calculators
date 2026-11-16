/**
 * Antigua & Barbuda — Citizenship by Investment pricing engine.
 *
 * Ported from "_20261116 Pricing Computation - Antigua & Barbuda.xlsx".
 * Cell references point at its "Dropdown and charges" sheet unless noted.
 */
import type { LineItem, PaymentStage, Quote } from "./types";

export type AbProgram = "NDF" | "BUSINESS";

export interface AbProgramInfo {
  short: string;
  name: string;
  /** Full name used on the quotation. */
  label: string;
  description: string;
}

export const AB_PROGRAMS: Record<AbProgram, AbProgramInfo> = {
  NDF: {
    short: "Contribution",
    name: "Non-refundable Contribution",
    label: "Non-refundable Contribution",
    description:
      "Non-refundable contribution of US$230,000 for a family of up to 5, or US$258,000 for 6 or more. Bank due diligence at approval is charged once.",
  },
  BUSINESS: {
    short: "Business",
    name: "Investment in Business",
    label: "Investment in Business",
    description:
      "US$400,000 investment in an approved business. Bank due diligence at approval is charged for each family member.",
  },
};

export type AbMemberKey = "main" | "spouse" | "child0_11" | "child12_17" | "child18" | "parent55";

export interface AbMemberDef {
  key: AbMemberKey;
  label: string;
  hint?: string;
  max: number;
}

export const AB_MEMBERS: AbMemberDef[] = [
  { key: "main", label: "Main Applicant", max: 1 },
  { key: "spouse", label: "Spouse", max: 1 },
  { key: "child0_11", label: "Dependent Child 0–11", max: 10 },
  { key: "child12_17", label: "Dependent Child 12–17", hint: "A child aged 11.5 or older counts as 12.", max: 10 },
  { key: "child18", label: "Dependent Child 18+", max: 10 },
  { key: "parent55", label: "Dependent Parent 55+", max: 4 },
];

export type AbFamily = Record<AbMemberKey, number>;

export const EMPTY_AB_FAMILY: AbFamily = { main: 1, spouse: 0, child0_11: 0, child12_17: 0, child18: 0, parent55: 0 };

export const AB_RATES = {
  /**
   * B6/B8 (10%) and B26/B28 (90%): total processing fee by family size —
   * single applicant, family of 2–4, then each additional person.
   */
  processingFee: { single: 10000, upTo4: 20000, extraPerson: 10000, firstShare: 0.1 },
  /** B11:B16 — per person */
  govDueDiligence: {
    main: 8500,
    spouse: 5000,
    child0_11: 0,
    child12_17: 2000,
    child18: 4000,
    parent55: 4000,
  } satisfies Record<AbMemberKey, number>,
  /** B18 — once at submission */
  bankDueDiligenceSubmission: 140,
  /** B20 — once per application */
  courierFee: 200,
  /** B22 — up to 5 persons / 6 or more */
  contribution: { base: 230000, large: 258000, largeFrom: 6 },
  /** B24 */
  businessInvestment: 400000,
  /** B30 — per person */
  passportFee: 300,
  /** Bank due diligence at approval: B32 (contribution, main applicant only) / C35:C40 (business, per person) */
  bankDueDiligenceApproval: {
    NDF: { main: 140, spouse: 0, child0_11: 0, child12_17: 0, child18: 0, parent55: 0 },
    BUSINESS: { main: 640, spouse: 500, child0_11: 0, child12_17: 500, child18: 500, parent55: 500 },
  } satisfies Record<AbProgram, Record<AbMemberKey, number>>,
  /** Workbook note A54 */
  benefactor: { ciuDueDiligence: 5000, bankDueDiligence: 500 },
} as const;

export interface AbInput {
  program: AbProgram;
  family: AbFamily;
  /** Manual fee cells on the workbook (C28, C30, C43). */
  authorizedAgentFee: number;
  retainerOnSigning: number;
  retainerOnApproval: number;
  includesBenefactor: boolean;
}

export const DEFAULT_AB_INPUT: AbInput = {
  program: "NDF",
  family: EMPTY_AB_FAMILY,
  authorizedAgentFee: 0,
  retainerOnSigning: 0,
  retainerOnApproval: 0,
  includesBenefactor: false,
};

export function abFamilySize(f: AbFamily): number {
  return AB_MEMBERS.reduce((n, m) => n + f[m.key], 0);
}

/**
 * Total government processing fee (both instalments) for `n` persons.
 *
 * Follows the Investment in Business formula (B8 / B28) for both plans. The
 * contribution formula (B6 / B26) agrees with it up to 5 persons, but its
 * 6+ branch drops back to US$2,000 + US$0 and is treated as a workbook error.
 */
export function abProcessingFee(n: number): number {
  const P = AB_RATES.processingFee;
  if (n <= 1) return P.single;
  if (n <= 4) return P.upTo4;
  return P.upTo4 + (n - 4) * P.extraPerson;
}

export function abContribution(n: number): number {
  const C = AB_RATES.contribution;
  return n < C.largeFrom ? C.base : C.large;
}

function line(id: string, label: string, unit: number, qty: number, detail?: string): LineItem {
  return { id, label, detail, unit, qty, total: unit * qty };
}

function perMemberLines(prefix: string, label: string, rates: Record<AbMemberKey, number>, f: AbFamily): LineItem[] {
  return AB_MEMBERS.filter((m) => f[m.key] > 0).map((m) => line(`${prefix}-${m.key}`, label, rates[m.key], f[m.key], m.label));
}

/** Optional manual fees are hidden from the quote while they are zero. */
function keepLine(l: LineItem): boolean {
  const optional = ["agent-fee", "retainer-signing", "retainer-approval", "bank-dd-2"];
  return !(optional.some((id) => l.id === id || l.id.startsWith(`${id}-`)) && l.total === 0);
}

function stage(id: string, title: string, subtotalLabel: string, short: string, lines: LineItem[]): PaymentStage {
  const kept = lines.filter(keepLine);
  return { id, title, subtotalLabel, short, lines: kept, subtotal: kept.reduce((s, l) => s + l.total, 0) };
}

export function computeAbQuote(input: AbInput): Quote {
  const R = AB_RATES;
  const f = input.family;
  const n = abFamilySize(f);
  const processing = abProcessingFee(n);
  const firstProcessing = Math.round(processing * R.processingFee.firstShare);
  const isNdf = input.program === "NDF";

  const first: LineItem[] = [
    line("gov-processing-1", "Government Processing Fee", firstProcessing, 1, "10% at submission"),
    ...perMemberLines("gov-dd", "Government Due Diligence Fee", R.govDueDiligence, f),
    line("bank-dd-1", "Bank Due Diligence Fee and Wire Transfer", R.bankDueDiligenceSubmission, 1),
  ];
  if (input.includesBenefactor) {
    first.push(
      line("benefactor-ciu", "Benefactor — CIU Due Diligence Fee", R.benefactor.ciuDueDiligence, 1),
      line("benefactor-bank", "Benefactor — Bank Due Diligence Fee", R.benefactor.bankDueDiligence, 1),
    );
  }
  first.push(
    line("agent-fee", "Authorized Agent Fee", input.authorizedAgentFee, 1),
    line("courier", "Courier Fee", R.courierFee, 1),
    line("retainer-signing", "TEG Retainer (Upon Signing)", input.retainerOnSigning, 1),
  );

  const final: LineItem[] = [
    isNdf
      ? line("contribution", "Non-Refundable Contribution", abContribution(n), 1, n < R.contribution.largeFrom ? "Family of up to 5" : "Family of 6 or more")
      : line("investment", "Investment in Business", R.businessInvestment, 1),
    line("gov-processing-2", "Government Processing Fee", processing - firstProcessing, 1, "90% balance after approval"),
    line("passport", "Government Passport Fee", R.passportFee, n, `${n} × person`),
    ...perMemberLines("bank-dd-2", "Bank Due Diligence Fee and Wire Transfer", R.bankDueDiligenceApproval[input.program], f),
    line("retainer-approval", "TEG Retainer (Upon Approval)", input.retainerOnApproval, 1),
  ];

  const stages = [
    stage("first", "First payment at file submission", "First Payment", "At file submission", first),
    stage("final", "Final payment after approval", "Final Payment", "After approval", final),
  ];
  return { currency: "USD", stages, total: stages.reduce((s, st) => s + st.subtotal, 0), familySize: n };
}

export const AB_NOTES = [
  "All transactions will take place in USD or AED, to be transferred to the company bank account in Dubai, UAE.",
  "Investment/Contribution to be made directly with the authorities.",
  "The client is responsible for the exchange rate difference.",
  "All amounts mentioned are exclusive of VAT.",
  "If the application includes a benefactor, add $5,000 for the CIU's due diligence fee, $500 for the bank's due diligence fee.",
  "This quotation is valid for 30 days from the date of quotation.",
];
