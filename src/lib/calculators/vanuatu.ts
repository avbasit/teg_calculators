/**
 * Vanuatu — Citizenship by Investment, DSP (Development Support Program) donation route.
 *
 * Ported from "Vanuatu Pricing Sheet.xlsx" (Sheet1). Cell references are noted next to each rate.
 */
import type { LineItem, PaymentStage, Quote } from "./types";

export type VuMemberKey = "main" | "spouse" | "child" | "parent";

export const VU_MEMBERS: { key: VuMemberKey; label: string; max: number }[] = [
  { key: "main", label: "Main Applicant", max: 1 },
  { key: "spouse", label: "Spouse", max: 1 },
  { key: "child", label: "Dependent Child", max: 10 },
  { key: "parent", label: "Dependent Parent", max: 4 },
];

export type VuFamily = Record<VuMemberKey, number>;

export const VU_RATES = {
  /** C5 — once per application */
  dueDiligence: 5000,
  /** C6 — once per application */
  applicationFee: 250,
  /** C10:C13 — DSP donation by family size (1 to 4 persons) */
  donationBySize: [130000, 150000, 165000, 180000] as const,
  /** C14 — each dependant beyond a family of 4 */
  extraDependant: 25000,
  /** C15 — per person */
  idAndBirthRegistration: 1000,
  /** C19 / C20 — paid directly to the biometrics unit */
  biometrics: { main: 2000, perDependant: 1800 },
  /** C7 / C16 — TEG professional fee defaults (editable) */
  tegFee: { onSigning: 5000, onApproval: 5000 },
} as const;

export interface VuInput {
  family: VuFamily;
  retainerOnSigning: number;
  retainerOnApproval: number;
}

export const DEFAULT_VU_INPUT: VuInput = {
  family: { main: 1, spouse: 0, child: 0, parent: 0 },
  retainerOnSigning: VU_RATES.tegFee.onSigning,
  retainerOnApproval: VU_RATES.tegFee.onApproval,
};

export function vuFamilySize(f: VuFamily): number {
  return VU_MEMBERS.reduce((n, m) => n + f[m.key], 0);
}

const DONATION_LABELS = ["Single Applicant", "Married Couple", "Family of 3", "Family of 4"];

/** DSP donation for the whole family: table price up to 4 persons, then $25,000 per extra dependant. */
export function vuDonation(n: number): { base: number; label: string; extra: number } {
  const t = VU_RATES.donationBySize;
  const idx = Math.min(n, t.length) - 1;
  return { base: t[idx], label: DONATION_LABELS[idx], extra: Math.max(0, n - t.length) };
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

export function computeVuQuote(input: VuInput): Quote {
  const R = VU_RATES;
  const n = vuFamilySize(input.family);
  const d = vuDonation(n);

  const stages = [
    stage("signing", "Upon signing", "Upon Signing", "Upon signing", [
      line("due-diligence", "Due Diligence", R.dueDiligence, 1),
      line("application-fee", "Application Fee", R.applicationFee, 1),
      line("retainer-signing", "TEG Professional Fee (Upon Signing)", input.retainerOnSigning, 1),
    ]),
    stage("approval", "After approval", "After Approval", "After approval", [
      line("donation", "DSP Donation", d.base, 1, d.label),
      line("extra-dependants", "Each Additional Dependant", R.extraDependant, d.extra, "Beyond a family of 4"),
      line("id-birth", "ID & Birth Registration", R.idAndBirthRegistration, n, `${n} × person`),
      line("retainer-approval", "TEG Professional Fee (Upon Approval)", input.retainerOnApproval, 1),
    ]),
    stage("biometrics", "Biometrics", "Biometrics", "Biometrics (paid to unit)", [
      line("bio-main", "Biometrics", R.biometrics.main, 1, "Main Applicant"),
      line("bio-dep", "Biometrics", R.biometrics.perDependant, n - 1, "Each dependant"),
    ]),
  ];

  return { currency: "USD", stages, total: stages.reduce((s, st) => s + st.subtotal, 0), familySize: n };
}

export const VU_NOTES = [
  "All transactions will take place in USD or AED, to be transferred to the company bank account in Dubai, UAE.",
  "The client is responsible for the exchange rate difference.",
  "All amounts mentioned are exclusive of VAT.",
  "Biometric fee to be paid directly to unit.",
  "This quotation is valid for 30 days from the date of quotation.",
];
