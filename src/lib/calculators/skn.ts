/**
 * St. Kitts & Nevis (SKN) — pricing engine.
 *
 * Ported from two TEG workbooks (cell references are noted next to each rate):
 *   SISC / PBO   — "_20261018 Pricing Computation - St. Kitts & Nevis (SKN) SISC and PBO.xlsx"
 *   Real Estate  — "20260217 Pricing Computation - St. Kitts & Nevis (SKN) Real Estate.xlsx"
 * All cell references point at each workbook's "Dropdown and charges" sheet.
 */
import type { LineItem, PaymentStage, Quote } from "./types";

export type SknProgram = "SISC" | "PBO" | "RE";

export interface SknProgramInfo {
  /** Label on the plan switch and summary. */
  short: string;
  /** Secondary line on the plan switch. */
  name: string;
  /** Full name used on the quotation. */
  label: string;
  description: string;
  /** Which workbook the figures come from. */
  workbook: string;
}

export const SKN_PROGRAMS: Record<SknProgram, SknProgramInfo> = {
  SISC: {
    short: "SISC",
    name: "Sustainable Island State Contribution",
    label: "Sustainable Island State Contribution (SISC)",
    description:
      "Non-refundable contribution that scales with family size. Additional dependants are priced into the contribution itself.",
    workbook: "SISC & PBO workbook (18 Oct 2026)",
  },
  PBO: {
    short: "PBO",
    name: "Public Benefit Option",
    label: "Public Benefit Option (PBO)",
    description:
      "Fixed US$250,000 contribution. Additional dependants are charged as a separate government processing fee at approval.",
    workbook: "SISC & PBO workbook (18 Oct 2026)",
  },
  RE: {
    short: "Real Estate",
    name: "Approved Real Estate Investment",
    label: "Real Estate Investment",
    description:
      "US$325,000 investment in approved real estate, resaleable after 7 years. A government processing fee is charged for every family member at approval.",
    workbook: "Real Estate workbook (17 Feb 2026)",
  },
};

export type MemberKey =
  | "main"
  | "spouse"
  | "child0_10"
  | "child11_15"
  | "child16_17"
  | "child18_30"
  | "parent55";

export interface MemberDef {
  key: MemberKey;
  label: string;
  hint?: string;
  /** Members filled into the base contribution first and charged the lower rate when extra (sheet rows B9:B13). */
  minorRate: boolean;
  max: number;
}

export const SKN_MEMBERS: MemberDef[] = [
  { key: "main", label: "Main Applicant", minorRate: true, max: 1 },
  { key: "spouse", label: "Spouse", minorRate: true, max: 1 },
  { key: "child0_10", label: "Dependent Child 0–10", minorRate: true, max: 10 },
  { key: "child11_15", label: "Dependent Child 11–15", minorRate: true, max: 10 },
  {
    key: "child16_17",
    label: "Dependent Child 16–17",
    hint: "A child aged 15.5 or older counts as 16.",
    minorRate: true,
    max: 10,
  },
  { key: "child18_30", label: "Dependent Child 18–30", minorRate: false, max: 10 },
  { key: "parent55", label: "Dependent Parent 55+", minorRate: false, max: 4 },
];

export type Family = Record<MemberKey, number>;

export const EMPTY_FAMILY: Family = {
  main: 1,
  spouse: 0,
  child0_10: 0,
  child11_15: 0,
  child16_17: 0,
  child18_30: 0,
  parent55: 0,
};

/** Government due diligence — identical in both workbooks (B9:B15 / B7:B13). */
const GOV_DUE_DILIGENCE: Record<MemberKey, number> = {
  main: 10000,
  spouse: 7500,
  child0_10: 0,
  child11_15: 0,
  child16_17: 7500,
  child18_30: 7500,
  parent55: 7500,
};

/** From the workbook notes: added when the application includes a benefactor. */
const BENEFACTOR = { ciuDueDiligence: 10000, bankDueDiligence: 300, govProcessingFee: 250 };

/** SISC & PBO workbook. */
export const SKN_RATES = {
  /** B6 — per person */
  govProcessingFee: 250,
  govDueDiligence: GOV_DUE_DILIGENCE,
  /** C9:C15 — per person, charged at submission AND again at approval */
  bankDueDiligence: {
    main: 585,
    spouse: 350,
    child0_10: 150,
    child11_15: 200,
    child16_17: 200,
    child18_30: 300,
    parent55: 300,
  } satisfies Record<MemberKey, number>,
  bankDueDiligenceLabel: "Bank Due Diligence Fee & Wire Transfer",
  /** B27 — per person */
  passportFee: 356,
  /** B29 — once per application */
  courierFee: 200,
  contribution: {
    /** Covers up to `baseCovers` persons */
    base: 250000,
    baseCovers: 4,
    /** Each additional main/spouse/child under 18 */
    extraMinor: 25000,
    /** Each additional dependant 18+ */
    extraAdult: 50000,
  },
  benefactor: BENEFACTOR,
} as const;

/** Real Estate workbook. */
export const SKN_RE_RATES = {
  /** B4 — per person */
  govProcessingFee: 250,
  govDueDiligence: GOV_DUE_DILIGENCE,
  /** C7:C13 — per person, charged at submission AND again at approval */
  bankDueDiligence: {
    main: 500,
    spouse: 300,
    child0_10: 100,
    child11_15: 150,
    child16_17: 150,
    child18_30: 250,
    parent55: 250,
  } satisfies Record<MemberKey, number>,
  bankDueDiligenceLabel: "Bank Due Diligence Fee",
  /** B15 — once at submission and once at approval */
  bankFee: 35,
  /** B17 — once per application */
  investment: 325000,
  /** B22:B28 — per person, at approval */
  approvalProcessingFee: {
    main: 25000,
    spouse: 15000,
    child0_10: 10000,
    child11_15: 10000,
    child16_17: 10000,
    child18_30: 15000,
    parent55: 15000,
  } satisfies Record<MemberKey, number>,
  /** B18 — per person */
  passportFee: 361,
  /** B19 — once per application */
  courierFee: 175,
  benefactor: BENEFACTOR,
} as const;

export interface SknInput {
  program: SknProgram;
  family: Family;
  /** Manual fee cells on the workbooks. */
  authorizedAgentFee: number;
  retainerOnSigning: number;
  retainerOnApproval: number;
  includesBenefactor: boolean;
}

export const DEFAULT_SKN_INPUT: SknInput = {
  program: "SISC",
  family: EMPTY_FAMILY,
  authorizedAgentFee: 0,
  retainerOnSigning: 0,
  retainerOnApproval: 0,
  includesBenefactor: false,
};

export function familySize(f: Family): number {
  return SKN_MEMBERS.reduce((n, m) => n + f[m.key], 0);
}

/**
 * SISC/PBO charge for family members beyond the 4 covered by the base contribution.
 *
 * Equivalent to the nested IF in 'Dropdown and charges'!B18 / B24: the base
 * slots are filled by main applicant, spouse and under-18 children first, so
 * the extras are charged at the adult rate only once those are exhausted.
 */
export function additionalDependantCharge(f: Family): number {
  const { baseCovers, extraMinor, extraAdult } = SKN_RATES.contribution;
  const total = familySize(f);
  if (total <= baseCovers) return 0;
  const minors = SKN_MEMBERS.filter((m) => m.minorRate).reduce((n, m) => n + f[m.key], 0);
  const extraMinors = Math.max(0, minors - baseCovers);
  const extraAdults = total - baseCovers - extraMinors;
  return extraMinors * extraMinor + extraAdults * extraAdult;
}

function line(id: string, label: string, unit: number, qty: number, detail?: string): LineItem {
  return { id, label, detail, unit, qty, total: unit * qty };
}

function perMemberLines(prefix: string, label: string, rates: Record<MemberKey, number>, f: Family): LineItem[] {
  return SKN_MEMBERS.filter((m) => f[m.key] > 0).map((m) =>
    line(`${prefix}-${m.key}`, label, rates[m.key], f[m.key], m.label),
  );
}

function stage(id: string, title: string, subtotalLabel: string, short: string, lines: LineItem[]): PaymentStage {
  const kept = lines.filter(keepLine);
  return { id, title, subtotalLabel, short, lines: kept, subtotal: kept.reduce((s, l) => s + l.total, 0) };
}

/** Optional manual fees are hidden from the quote while they are zero. */
function keepLine(l: LineItem): boolean {
  const optional = ["agent-fee", "retainer-signing", "retainer-approval"];
  return !(optional.includes(l.id) && l.total === 0);
}

/** Lines shared by every programme at file submission. */
function submissionLines(
  input: SknInput,
  rates: typeof SKN_RATES | typeof SKN_RE_RATES,
  extra: LineItem[] = [],
): LineItem[] {
  const f = input.family;
  const n = familySize(f);
  const lines = [
    line("gov-processing", "Government Processing Fee", rates.govProcessingFee, n, `${n} × person`),
    ...perMemberLines("gov-dd", "Government Due Diligence Fee", rates.govDueDiligence, f),
    ...perMemberLines("bank-dd-1", rates.bankDueDiligenceLabel, rates.bankDueDiligence, f),
  ];
  if (input.includesBenefactor) {
    const b = rates.benefactor;
    lines.push(
      line("benefactor-ciu", "Benefactor — CIU Due Diligence Fee", b.ciuDueDiligence, 1),
      line("benefactor-bank", "Benefactor — Bank Due Diligence Fee", b.bankDueDiligence, 1),
      line("benefactor-gov", "Benefactor — Government Processing Fee", b.govProcessingFee, 1),
    );
  }
  lines.push(line("agent-fee", "Authorized Agent Fee", input.authorizedAgentFee, 1), ...extra);
  lines.push(line("retainer-signing", "TEG Retainer (Upon Signing)", input.retainerOnSigning, 1));
  return lines;
}

function buildQuote(first: LineItem[], final: LineItem[], n: number): Quote {
  const stages = [
    stage("first", "First payment at file submission", "First Payment", "At file submission", first),
    stage("final", "Final payment after approval", "Final Payment", "After approval", final),
  ];
  return { currency: "USD", stages, total: stages.reduce((s, st) => s + st.subtotal, 0), familySize: n };
}

function computeContributionQuote(input: SknInput): Quote {
  const f = input.family;
  const n = familySize(f);
  const R = SKN_RATES;
  const extras = additionalDependantCharge(f);
  const isSisc = input.program === "SISC";

  const final: LineItem[] = [
    line(
      "contribution",
      `${input.program} Contribution (Non-Refundable)`,
      isSisc ? R.contribution.base + extras : R.contribution.base,
      1,
    ),
  ];
  if (!isSisc && extras > 0) {
    final.push(line("pbo-extra", "Government Processing Fee", extras, 1, "Additional dependants"));
  }
  final.push(
    line("passport", "Government Passport Fee", R.passportFee, n, `${n} × person`),
    line("courier", "Courier Fee", R.courierFee, 1),
    ...perMemberLines("bank-dd-2", R.bankDueDiligenceLabel, R.bankDueDiligence, f),
    line("retainer-approval", "TEG Retainer (Upon Approval)", input.retainerOnApproval, 1),
  );

  return buildQuote(submissionLines(input, R), final, n);
}

function computeRealEstateQuote(input: SknInput): Quote {
  const f = input.family;
  const n = familySize(f);
  const R = SKN_RE_RATES;

  const first = submissionLines(input, R, [line("bank-fee-1", "Bank Fee", R.bankFee, 1)]);
  const final: LineItem[] = [
    line("investment", "Real Estate Investment", R.investment, 1),
    ...perMemberLines("re-processing", "Government Processing Fee", R.approvalProcessingFee, f),
    line("passport", "Government Passport Fee", R.passportFee, n, `${n} × person`),
    line("courier", "Courier Fee", R.courierFee, 1),
    ...perMemberLines("bank-dd-2", R.bankDueDiligenceLabel, R.bankDueDiligence, f),
    line("bank-fee-2", "Bank Fee", R.bankFee, 1),
    line("retainer-approval", "TEG Retainer (Upon Approval)", input.retainerOnApproval, 1),
  ];

  return buildQuote(first, final, n);
}

export function computeSknQuote(input: SknInput): Quote {
  return input.program === "RE" ? computeRealEstateQuote(input) : computeContributionQuote(input);
}

const COMMON_NOTES = [
  "All transactions will take place in USD or AED, to be transferred to the company bank account in Dubai, UAE.",
  "Investment/Contribution to be made directly with the authorities.",
  "The client is responsible for the exchange rate difference.",
  "All amounts mentioned are exclusive of VAT.",
];
const BENEFACTOR_NOTE =
  "If the application includes a benefactor, add $10,000 for the CIU's due diligence fee, $300 for the bank's due diligence fee and US$250 for the Government Processing Fee.";
const VALIDITY_NOTE = "This quotation is valid for 30 days from the date of quotation.";

/** Notes printed on each workbook's quotation. */
export function sknNotes(program: SknProgram): string[] {
  if (program === "RE") {
    return [...COMMON_NOTES, BENEFACTOR_NOTE, "Resale of Real Estate Investment is allowed after 7 years.", VALIDITY_NOTE];
  }
  return [...COMMON_NOTES, "New biometric passport fee is not included in the quotation.", BENEFACTOR_NOTE, VALIDITY_NOTE];
}
