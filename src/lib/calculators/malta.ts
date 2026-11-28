/**
 * Malta — Permanent Residence Programme (MPRP): property rental and property purchase routes.
 *
 * Ported from "Malta Residency Programme.xlsx" (Sheet1). Column D is the rental route, column F the purchase route.
 * The purchase price is part of the total (as on Greece); annual rent is shown for information only.
 */
import type { InfoSection, LineItem, PaymentStage, Quote } from "./types";

export type MtRoute = "rent" | "purchase";

export const MT_ROUTES: Record<MtRoute, { short: string; name: string; description: string; conditions: string[] }> = {
  rent: {
    short: "Renting of Property",
    name: "From €14,000 annual rent",
    description:
      "Rent a residential property in Malta or Gozo from €14,000 a year, registered with the Malta Housing Authority and kept for at least five years. Rent is paid to the landlord and shown for information only — it is not part of the total.",
    conditions: [
      "The property must be located in Malta or Gozo.",
      "It must be a residential property suitable for the applicant and family.",
      "The rental agreement must be registered with the Malta Housing Authority.",
      "The property must be maintained for a minimum of five years from the date the residence certificate is issued. Property for lesser rent can be rented after 5th year to maintain address.",
      "Hotel rooms and non-residential properties do not qualify.",
    ],
  },
  purchase: {
    short: "Purchase of Property",
    name: "From €375,000",
    description:
      "Buy a residential property in Malta or Gozo from €375,000 and keep it for at least five years from the issuance of the residence certificate.",
    conditions: [
      "Property must be residential.",
      "Minimum purchase value is €375,000.",
      "The property must be retained for at least five years from the issuance of the residence certificate.",
      "After five years, the applicant can sell the property but must continue to maintain a residential property in Malta or Gozo to retain MPRP status.",
      "The property must meet applicable health and safety standards and be suitable for the family.",
    ],
  },
};

/** I24:J28 — health insurance per person per year (approximate). */
export type MtAgeBand = "under18" | "18-25" | "26-50" | "50-70" | "70+";

export const MT_AGE_BANDS: { key: MtAgeBand; label: string; rate: number }[] = [
  { key: "under18", label: "Under 18", rate: 300 },
  { key: "18-25", label: "18–25", rate: 525 },
  { key: "26-50", label: "26–50", rate: 675 },
  { key: "50-70", label: "50–70", rate: 2000 },
  { key: "70+", label: "70+", rate: 2250 },
];

export const MT_ADULT_BANDS = MT_AGE_BANDS.filter((b) => b.key !== "under18");

export const MT_RATES = {
  /** D6 — government administration fee: €15,000 with the application, the rest after approval */
  adminFee: { total: 60000, onSubmission: 15000 },
  /** D8 — after approval */
  contribution: 37000,
  /** D10 / D12 — spouse and children under 18 are free */
  /** D14 — after approval */
  ngoDonation: 2000,
  /** D16 / F16 — minimum annual rent and minimum purchase price */
  minRent: 14000,
  minPurchase: 375000,
  /** D30 — per applicant, covers 5 years */
  residencyCard: 500,
  /** D32 — editable, 50% advance and 50% on approval */
  legalAdmin: { advance: 10000, onApproval: 10000 },
  /** D33 — €400 a year for 5 years */
  annualCompliance: { perYear: 400, years: 5 },
  /** D34 — editable, 50% advance and 50% after approval */
  tegFee: { advance: 5000, afterApproval: 5000 },
} as const;

/** I18:J21 — suggested bedrooms by family size. */
export const MT_BEDROOMS = [
  { members: "1–2", bedrooms: "1–2" },
  { members: "3–4", bedrooms: "2" },
  { members: "5–6", bedrooms: "3" },
  { members: "7–8", bedrooms: "4" },
];

export interface MtInput {
  route: MtRoute;
  spouse: 0 | 1;
  children: number;
  mainAge: MtAgeBand;
  spouseAge: MtAgeBand;
  /** Annual rent / purchase price as entered; the quote never uses less than the route minimum. */
  rent: number;
  purchasePrice: number;
  legalAdvance: number;
  legalOnApproval: number;
  retainerAdvance: number;
  retainerAfterApproval: number;
}

export const DEFAULT_MT_INPUT: MtInput = {
  route: "rent",
  spouse: 0,
  children: 0,
  mainAge: "26-50",
  spouseAge: "26-50",
  rent: MT_RATES.minRent,
  purchasePrice: MT_RATES.minPurchase,
  legalAdvance: MT_RATES.legalAdmin.advance,
  legalOnApproval: MT_RATES.legalAdmin.onApproval,
  retainerAdvance: MT_RATES.tegFee.advance,
  retainerAfterApproval: MT_RATES.tegFee.afterApproval,
};

export const MT_MAX_CHILDREN = 10;

export function mtFamilySize(input: MtInput): number {
  return 1 + input.spouse + input.children;
}

/** Annual rent (information only) or purchase price (in the total) for the selected route. */
export function mtPropertyAmount(input: MtInput): number {
  return input.route === "rent" ? Math.max(input.rent, MT_RATES.minRent) : Math.max(input.purchasePrice, MT_RATES.minPurchase);
}

const rateOf = (band: MtAgeBand) => MT_AGE_BANDS.find((b) => b.key === band)!.rate;
const labelOf = (band: MtAgeBand) => MT_AGE_BANDS.find((b) => b.key === band)!.label;

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

export function computeMtQuote(input: MtInput): Quote {
  const R = MT_RATES;
  const n = mtFamilySize(input);
  const rent = input.route === "rent";
  const SIGNING = "Upon signing";
  const SUBMISSION = "With submission of application";
  const APPROVAL = "After approval";
  const approx = "approx. · final amount quoted by Maltese insurer";

  const stages = [
    stage("signing", "Upon signing", "Upon Signing", "Upon signing", [
      line("retainer-advance", "TEG Professional Fee (50% Advance)", input.retainerAdvance, 1, undefined, SIGNING),
      line("legal-advance", "Legal & Admin Fee (50% Advance)", input.legalAdvance, 1, undefined, SIGNING),
    ]),
    stage("submission", "With submission of application", "On Submission", "On submission", [
      line("admin-fee-submission", "Government Administration Fee", R.adminFee.onSubmission, 1, "Main Applicant · paid with application", SUBMISSION),
    ]),
    stage("approval", "After approval", "After Approval", "After approval", [
      line("admin-fee-balance", "Government Administration Fee (Balance)", R.adminFee.total - R.adminFee.onSubmission, 1, "Main Applicant", APPROVAL),
      line("contribution", "Government Contribution", R.contribution, 1, "Spouse and children under 18 free", APPROVAL),
      line("ngo", "Donation to an NGO", R.ngoDonation, 1, undefined, APPROVAL),
      line("residency-card", "Residency Card", R.residencyCard, n, `${n} × applicant · valid 5 years`, APPROVAL),
      line("insurance-main", "Health Insurance (per year)", rateOf(input.mainAge), 1, `Main Applicant, age ${labelOf(input.mainAge)} · ${approx}`, APPROVAL),
      line("insurance-spouse", "Health Insurance (per year)", rateOf(input.spouseAge), input.spouse, `Spouse, age ${labelOf(input.spouseAge)} · ${approx}`, APPROVAL),
      line("insurance-child", "Health Insurance (per year)", rateOf("under18"), input.children, `${input.children} × child under 18 · ${approx}`, APPROVAL),
      line("legal-approval", "Legal & Admin Fee (50% On Approval)", input.legalOnApproval, 1, undefined, APPROVAL),
      line("retainer-approval", "TEG Professional Fee (50% After Approval)", input.retainerAfterApproval, 1, undefined, APPROVAL),
    ]),
    stage("property", "Property purchase", "Property Purchase", "Property", [
      line("property", "Property Purchase", rent ? 0 : mtPropertyAmount(input), 1, "Minimum €375,000 · retained for 5 years"),
    ]),
    stage("compliance", "Annual compliance (5 years)", "Annual Compliance", "Annual compliance", [
      line("compliance", "Annual Compliance", R.annualCompliance.perYear, R.annualCompliance.years, "€400 per annum × 5 years", "Annually for 5 years"),
    ]),
  ].filter((s) => s.lines.length > 0);

  return { currency: "EUR", stages, total: stages.reduce((s, st) => s + st.subtotal, 0), familySize: n };
}

/**
 * Key conditions for the selected route — shown on the page and printed before the notes.
 * On the rental route it also carries the annual rent, which is information only.
 */
export function mtConditions(input: MtInput): InfoSection {
  const route = MT_ROUTES[input.route];
  const rent =
    input.route === "rent"
      ? [{ label: "Annual rent (paid to the landlord, not included in the total)", value: `€${mtPropertyAmount(input).toLocaleString("en-US")} per year` }]
      : [];
  return {
    title: `Key conditions — ${route.short}`,
    rows: [...rent, ...route.conditions.map((c) => ({ label: c, value: "" }))],
  };
}

export const MT_NOTES = [
  "All transactions will take place in EUR or AED, to be transferred to the company bank account in Dubai, UAE.",
  "Government administration fee: €15,000 to be paid with submission of application, the rest after approval.",
  "TEG professional fee and legal & admin fee are paid 50% in advance and 50% on approval.",
  "Residency card and health insurance are paid after approval.",
  "On the rental route, the annual rent is paid to the landlord and is shown for information only; it is not included in the total.",
  "Spouse and children under 18 are free — no charges by the Authority.",
  "Health insurance amounts are approximate; the final amount will be quoted by the Maltese insurance company.",
  "Clean police conduct is required.",
  "This is not a tax-related programme, so no taxes are associated with it.",
  "To be eligible to apply, the main applicant should possess a minimum of €500,000 (€350,000 property/other assets & €150,000 liquidity/financial assets) or €650,000 of which €575,000 in assets and €75,000 in liquidity/financial assets arising outside of Malta. This will not be retained by the Residency Malta Agency; it is only to show that the applicant/s are financially sound.",
  "Processing time 5–6 months, unless the option for issuance of card within a month is chosen.",
  "No minimum stay requirements. Applicants are required to travel for biometrics only.",
  "The client is responsible for the exchange rate difference.",
  "All amounts mentioned are exclusive of VAT.",
  "This quotation is valid for 30 days from the date of quotation.",
];
