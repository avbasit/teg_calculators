/**
 * St. Kitts & Nevis (SKN) — pricing engine.
 *
 * Ported from "_20261018 Pricing Computation - St. Kitts & Nevis (SKN) SISC and PBO.xlsx".
 * Every rate below maps to a cell on the workbook's "Dropdown and charges" sheet;
 * the cell reference is noted next to each value so the two can be kept in sync.
 */
import type { LineItem, PaymentStage, Quote } from "./types";

export type SknProgram = "SISC" | "PBO";

export const SKN_PROGRAMS: Record<SknProgram, { name: string; short: string; description: string }> = {
  SISC: {
    short: "SISC",
    name: "Sustainable Island State Contribution",
    description:
      "Non-refundable contribution that scales with family size. Additional dependants are priced into the contribution itself.",
  },
  PBO: {
    short: "PBO",
    name: "Public Benefit Option",
    description:
      "Fixed US$250,000 contribution. Additional dependants are charged as a separate government processing fee at approval.",
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

export const SKN_RATES = {
  /** 'Dropdown and charges'!B6 — per person */
  govProcessingFee: 250,
  /** B9:B15 — per person, by member type */
  govDueDiligence: {
    main: 10000,
    spouse: 7500,
    child0_10: 0,
    child11_15: 0,
    child16_17: 7500,
    child18_30: 7500,
    parent55: 7500,
  } satisfies Record<MemberKey, number>,
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
  /** From the workbook notes: added when the application includes a benefactor. */
  benefactor: {
    ciuDueDiligence: 10000,
    bankDueDiligence: 300,
    govProcessingFee: 250,
  },
} as const;

export interface SknInput {
  program: SknProgram;
  family: Family;
  /** Manual fee cells on the workbook (C36, C37, C52). */
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
 * Charge for family members beyond the 4 covered by the base contribution.
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

function stage(id: string, title: string, subtotalLabel: string, lines: LineItem[]): PaymentStage {
  return { id, title, subtotalLabel, lines, subtotal: lines.reduce((s, l) => s + l.total, 0) };
}

export function computeSknQuote(input: SknInput): Quote {
  const f = input.family;
  const n = familySize(f);
  const R = SKN_RATES;
  const extras = additionalDependantCharge(f);

  const first: LineItem[] = [
    line("gov-processing", "Government Processing Fee", R.govProcessingFee, n, `${n} × person`),
    ...perMemberLines("gov-dd", "Government Due Diligence Fee", R.govDueDiligence, f),
    ...perMemberLines("bank-dd-1", "Bank Due Diligence Fee & Wire Transfer", R.bankDueDiligence, f),
  ];
  if (input.includesBenefactor) {
    first.push(
      line("benefactor-ciu", "Benefactor — CIU Due Diligence Fee", R.benefactor.ciuDueDiligence, 1),
      line("benefactor-bank", "Benefactor — Bank Due Diligence Fee", R.benefactor.bankDueDiligence, 1),
      line("benefactor-gov", "Benefactor — Government Processing Fee", R.benefactor.govProcessingFee, 1),
    );
  }
  first.push(
    line("agent-fee", "Authorized Agent Fee", input.authorizedAgentFee, 1),
    line("retainer-signing", "TEG Retainer (Upon Signing)", input.retainerOnSigning, 1),
  );

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
    ...perMemberLines("bank-dd-2", "Bank Due Diligence Fee & Wire Transfer", R.bankDueDiligence, f),
    line("retainer-approval", "TEG Retainer (Upon Approval)", input.retainerOnApproval, 1),
  );

  const stages = [
    stage("first", "First payment at file submission", "First Payment (A)", first.filter(keepLine)),
    stage("final", "Final payment after approval", "Final Payment (B)", final.filter(keepLine)),
  ];
  return { stages, total: stages.reduce((s, st) => s + st.subtotal, 0), familySize: n };
}

/** Optional manual fees are hidden from the quote while they are zero. */
function keepLine(l: LineItem): boolean {
  const optional = ["agent-fee", "retainer-signing", "retainer-approval"];
  return !(optional.includes(l.id) && l.total === 0);
}

export const SKN_NOTES = [
  "All transactions will take place in USD or AED, to be transferred to the company bank account in Dubai, UAE.",
  "Investment/Contribution to be made directly with the authorities.",
  "The client is responsible for the exchange rate difference.",
  "All amounts mentioned are exclusive of VAT.",
  "New biometric passport fee is not included in the quotation.",
  "If the application includes a benefactor, add $10,000 for the CIU's due diligence fee, $300 for the bank's due diligence fee and US$250 for the Government Processing Fee.",
  "This quotation is valid for 30 days from the date of quotation.",
];
