/**
 * United Kingdom — Innovator Founder Visa.
 *
 * Ported from "UK IFV - Calculation.xlsx" (Sheet1). Cell references are noted next to each rate.
 * - The TEG professional fee (£10,000 in four instalments) is fixed, whatever the family size.
 * - Immigration Health Surcharge and the Home Office fee are per family member.
 * - Endorsement costs are per applicant, and the "applicant" is the whole family — charged once.
 * - Whether the family applies from inside or outside the UK changes the Home Office and endorsement fees.
 * - Later endorsement reviews (C27:C29) are shown for information only and are not in the total.
 */
import type { InfoSection, LineItem, PaymentStage, Quote } from "./types";

export type UkLocation = "outside" | "inside";

export const UK_LOCATIONS: Record<UkLocation, { short: string; name: string }> = {
  outside: { short: "Outside UK", name: "Applying from outside the UK" },
  inside: { short: "Inside UK", name: "Switching from within the UK" },
};

export type UkMemberKey = "main" | "spouse" | "child";

export const UK_MEMBERS: { key: UkMemberKey; label: string; hint?: string; adult: boolean; max: number }[] = [
  { key: "main", label: "Main Applicant", adult: true, max: 1 },
  { key: "spouse", label: "Spouse / Partner", adult: true, max: 1 },
  { key: "child", label: "Dependent Child", hint: "Maximum age 18.", adult: false, max: 10 },
];

export type UkFamily = Record<UkMemberKey, number>;

export const UK_RATES = {
  /** C7:C10 — TEG professional fee instalments (total £10,000), fixed for any family size */
  tegFee: { signing: 4000, businessPlan: 1500, endorsement: 1500, submission: 3000 },
  /** C14:C15 — Immigration Health Surcharge for 3 years, per family member */
  ihs: { adult: 3105, child: 2604, adultPerYear: 1035, childPerYear: 868 },
  /** C19:C20 — Home Office application fee, per family member */
  applicationFee: { outside: 1357, inside: 1693 } as Record<UkLocation, number>,
  /** C25:C26 — endorsement application, once per application (inside UK includes 20% VAT) */
  endorsementApplication: { outside: 1000, inside: 1200 } as Record<UkLocation, number>,
  /** C27:C29 — later endorsement reviews, once per application (inclusive of 20% VAT) — information only */
  checkpoint1: 600,
  checkpoint2: 600,
  ilrReview: 1200,
} as const;

export interface UkInput {
  location: UkLocation;
  family: UkFamily;
  feeSigning: number;
  feeBusinessPlan: number;
  feeEndorsement: number;
  feeSubmission: number;
}

export const DEFAULT_UK_INPUT: UkInput = {
  location: "outside",
  family: { main: 1, spouse: 0, child: 0 },
  feeSigning: UK_RATES.tegFee.signing,
  feeBusinessPlan: UK_RATES.tegFee.businessPlan,
  feeEndorsement: UK_RATES.tegFee.endorsement,
  feeSubmission: UK_RATES.tegFee.submission,
};

export function ukFamilySize(f: UkFamily): number {
  return UK_MEMBERS.reduce((n, m) => n + f[m.key], 0);
}

export function ukAdults(f: UkFamily): number {
  return UK_MEMBERS.filter((m) => m.adult).reduce((n, m) => n + f[m.key], 0);
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

export function computeUkQuote(input: UkInput): Quote {
  const R = UK_RATES;
  const n = ukFamilySize(input.family);
  const adults = ukAdults(input.family);
  const children = input.family.child;
  const where = UK_LOCATIONS[input.location].short;
  const toUkvi = "Paid directly to UKVI with or after instalment 4";
  const toBody = "Paid directly to the endorsing body";
  const perApplication = "Per application (whole family)";

  const stages = [
    stage("signing", "Instalment 1 — upon signing", "Instalment 1", "Upon signing", [
      line("fee-signing", "TEG Professional Fee — Instalment 1", input.feeSigning, 1, "Non-refundable", "At the time of signing"),
    ]),
    stage("business-plan", "Instalment 2 — business plan", "Instalment 2", "Business plan", [
      line("fee-business-plan", "TEG Professional Fee — Instalment 2", input.feeBusinessPlan, 1, "Non-refundable", "Upon completion of business plan + financial projections"),
    ]),
    stage("endorsement", "Endorsement application", "Endorsement Application", "Endorsement (direct)", [
      line(
        "endorsement-application",
        `Endorsement Application (${where})`,
        R.endorsementApplication[input.location],
        1,
        `${perApplication} · ${toBody}${input.location === "inside" ? " · incl. 20% VAT" : ""}`,
        "After instalment 2, before instalment 3",
      ),
    ]),
    stage("endorsed", "Instalment 3 — after endorsement", "Instalment 3", "After endorsement", [
      line("fee-endorsement", "TEG Professional Fee — Instalment 3", input.feeEndorsement, 1, "Non-refundable", "After endorsing body approval"),
    ]),
    stage("submission", "Instalment 4 — immigration application", "Immigration Application", "Immigration application", [
      line("fee-submission", "TEG Professional Fee — Instalment 4", input.feeSubmission, 1, "Refundable in case of rejection", "At immigration application submission"),
      line("ihs-adult", "Immigration Health Surcharge — Adult", R.ihs.adult, adults, `${adults} × adult · ${toUkvi}`),
      line("ihs-child", "Immigration Health Surcharge — Child", R.ihs.child, children, `${children} × child · ${toUkvi}`),
      line("application-fee", `Home Office Application Fee (${where})`, R.applicationFee[input.location], n, `${n} × family member · ${toUkvi}`),
    ]),
  ].filter((s) => s.lines.length > 0);

  return { currency: "GBP", stages, total: stages.reduce((s, st) => s + st.subtotal, 0), familySize: n };
}

const gbp = (n: number) => `£${n.toLocaleString("en-GB")}`;

/** Endorsement costs after the visa — printed before the notes, not part of the total. */
export function ukEndorsementInfo(location: UkLocation): InfoSection {
  const R = UK_RATES;
  return {
    title: "Endorsement reviews & resubmission (information only)",
    note: "Paid directly to the endorsing body, once per application (whole family). Not included in the total.",
    rows: [
      { label: "Endorsement Checkpoint 1 (12 months)", value: `${gbp(R.checkpoint1)} incl. 20% VAT · after 1 year in the UK` },
      { label: "Endorsement Checkpoint 2 (24 months)", value: `${gbp(R.checkpoint2)} incl. 20% VAT · after 2 years in the UK` },
      { label: "ILR Endorsement Review (34–35 months)", value: `${gbp(R.ilrReview)} incl. 20% VAT · after 3 years in the UK` },
      {
        label: "Endorsement resubmission",
        value: `${gbp(R.endorsementApplication[location])} (${UK_LOCATIONS[location].short}) every time`,
      },
    ],
  };
}

export const UK_NOTES = [
  "All transactions will take place in GBP or AED, to be transferred to the company bank account in Dubai, UAE.",
  "TEG professional fee is £10,000 in four instalments, whatever the family size. Instalments 1–3 are non-refundable; instalment 4 is refundable in case of rejection.",
  "All Government Fee to be paid directly. Immigration Health Surcharge and the Home Office fee are paid directly to UKVI with or after instalment 4.",
  "Endorsement costs are paid directly to the endorsing body and are charged per application, irrespective of the number of family members.",
  "Endorsement Body will charge £1,000 (outside UK) / £1,200 (inside UK) for resubmission every time.",
  "Endorsement checkpoints and ILR endorsement review are shown for information only and are not included in the total.",
  "Maximum age for children is 18.",
  "The client is responsible for the exchange rate difference.",
  "All amounts mentioned are exclusive of VAT.",
  "This quotation is valid for 30 days from the date of quotation.",
];
