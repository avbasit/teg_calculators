/**
 * Malta — Permanent Residence Programme (MPRP): property rental and property purchase routes.
 *
 * Ported from "Malta Residency Programme.xlsx" (Sheet1). Column D is the rental route, column F the purchase route.
 * The purchase price (own stage, as on Greece) and the annual rent (after approval) are both part of the total.
 * Health insurance is priced per member from each member's age (I24:J28).
 * Parents / parents-in-law and adult children (18–28) each add €7,500 after approval (D36:D37).
 */
import type { InfoSection, LineItem, PaymentStage, Quote } from "./types";

export type MtRoute = "rent" | "purchase";

export const MT_ROUTES: Record<MtRoute, { short: string; name: string; description: string; conditions: string[] }> = {
  rent: {
    short: "Renting of Property",
    name: "From €14,000 annual rent",
    description:
      "Rent a residential property in Malta or Gozo from €14,000 a year, registered with the Malta Housing Authority and kept for at least five years. The first year's rent is included after approval.",
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

/**
 * I24:J28 — health insurance per person per year (approximate), by age.
 * The sheet's bands touch at 50 and 70; those ages fall in the lower band (50 → 26–50, 70 → 50–70).
 */
export const MT_AGE_BANDS: { label: string; maxAge: number; rate: number }[] = [
  { label: "Under 18", maxAge: 17, rate: 300 },
  { label: "18–25", maxAge: 25, rate: 525 },
  { label: "26–50", maxAge: 50, rate: 675 },
  { label: "50–70", maxAge: 70, rate: 2000 },
  { label: "70+", maxAge: Infinity, rate: 2250 },
];

/** Health insurance band for an age. */
export function mtInsuranceBand(age: number) {
  return MT_AGE_BANDS.find((b) => age <= b.maxAge)!;
}

export const MT_MAX_AGE = 120;
export const MT_MAX_CHILD_AGE = 17;
export const MT_ADULT_CHILD_AGE = { min: 18, max: 28 };
export const MT_DEFAULT_ADULT_AGE = 40;
export const MT_DEFAULT_CHILD_AGE = 10;
export const MT_DEFAULT_ADULT_CHILD_AGE = 20;
export const MT_DEFAULT_PARENT_AGE = 65;
/** Parents and parents-in-law. */
export const MT_MAX_PARENTS = 4;
export const MT_MAX_ADULT_CHILDREN = 10;

/** A58:A62 — printed when parents are included. */
export const MT_PARENT_CONDITIONS: InfoSection = {
  title: "Conditions for including parents",
  rows: [
    "Parents must be principally financially dependent on the main applicant.",
    "There is no minimum or maximum age requirement.",
    "The main applicant must provide an affidavit confirming financial support.",
    "Supporting evidence must demonstrate that the parents cannot maintain a self-sufficient basic independent life without the applicant's support.",
  ].map((label) => ({ label, value: "" })),
};

/** A64:A68 — printed when adult children are included. */
export const MT_ADULT_CHILD_CONDITIONS: InfoSection = {
  title: "Conditions for adult children",
  note: "The adult child must satisfy all three conditions.",
  rows: [
    "Must be over 18 but under 29 years old at the time of application.",
    "Must be unmarried.",
    "Must be principally financially dependent on the main applicant.",
  ].map((label) => ({ label, value: "" })),
};

export const MT_RATES = {
  /** D6 — government administration fee: €15,000 with the application, the rest after approval */
  adminFee: { total: 60000, onSubmission: 15000 },
  /** D8 — after approval */
  contribution: 37000,
  /** D10 / D12 — spouse and children under 18 are free */
  /** D36 — per parent (parents and parents-in-law), after approval */
  parent: 7500,
  /** D37 — per adult child aged 18–28, after approval */
  adultChild: 7500,
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
  mainAge: number;
  spouseAge: number;
  /** One age per member — the number of members is the length of each list. */
  childAges: number[];
  adultChildAges: number[];
  parentAges: number[];
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
  mainAge: MT_DEFAULT_ADULT_AGE,
  spouseAge: MT_DEFAULT_ADULT_AGE,
  childAges: [],
  adultChildAges: [],
  parentAges: [],
  rent: MT_RATES.minRent,
  purchasePrice: MT_RATES.minPurchase,
  legalAdvance: MT_RATES.legalAdmin.advance,
  legalOnApproval: MT_RATES.legalAdmin.onApproval,
  retainerAdvance: MT_RATES.tegFee.advance,
  retainerAfterApproval: MT_RATES.tegFee.afterApproval,
};

export const MT_MAX_CHILDREN = 10;

export function mtFamilySize(input: MtInput): number {
  return 1 + input.spouse + input.childAges.length + input.adultChildAges.length + input.parentAges.length;
}

/** Annual rent or purchase price for the selected route. */
export function mtPropertyAmount(input: MtInput): number {
  return input.route === "rent" ? Math.max(input.rent, MT_RATES.minRent) : Math.max(input.purchasePrice, MT_RATES.minPurchase);
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

export function computeMtQuote(input: MtInput): Quote {
  const R = MT_RATES;
  const n = mtFamilySize(input);
  const rent = input.route === "rent";
  const SIGNING = "Upon signing";
  const SUBMISSION = "With submission of application";
  const APPROVAL = "After approval";
  const approx = "approx. · final amount quoted by Maltese insurer";
  const insurance = [
    { id: "insurance-main", who: "Main Applicant", age: input.mainAge },
    ...(input.spouse ? [{ id: "insurance-spouse", who: "Spouse", age: input.spouseAge }] : []),
    ...input.childAges.map((age, i) => ({ id: `insurance-child-${i + 1}`, who: `Child ${i + 1}`, age })),
    ...input.adultChildAges.map((age, i) => ({ id: `insurance-adult-child-${i + 1}`, who: `Adult Child ${i + 1}`, age })),
    ...input.parentAges.map((age, i) => ({ id: `insurance-parent-${i + 1}`, who: `Parent ${i + 1}`, age })),
  ];
  const parents = input.parentAges.length;
  const adultChildren = input.adultChildAges.length;

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
      line("parent", "Contribution — Parent", R.parent, parents, `${parents} × parent / parent-in-law`, APPROVAL),
      line("adult-child", "Contribution — Adult Child (18–28)", R.adultChild, adultChildren, `${adultChildren} × adult child`, APPROVAL),
      line("ngo", "Donation to an NGO", R.ngoDonation, 1, undefined, APPROVAL),
      line("residency-card", "Residency Card", R.residencyCard, n, `${n} × applicant · valid 5 years`, APPROVAL),
      ...insurance.map((m) => line(m.id, "Health Insurance (per year)", mtInsuranceBand(m.age).rate, 1, `${m.who}, age ${m.age} (${mtInsuranceBand(m.age).label}) · ${approx}`, APPROVAL)),
      line("rent", "Annual Rent", rent ? mtPropertyAmount(input) : 0, 1, "Minimum €14,000 / year · kept for 5 years", APPROVAL),
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

/** Key conditions for the selected route — shown on the page and printed before the notes. */
export function mtConditions(input: MtInput): InfoSection {
  const route = MT_ROUTES[input.route];
  return {
    title: `Key conditions — ${route.short}`,
    rows: route.conditions.map((c) => ({ label: c, value: "" })),
  };
}

/** Every information section for the quote: property conditions, plus parent / adult child conditions when included. */
export function mtInfoSections(input: MtInput): InfoSection[] {
  return [
    mtConditions(input),
    ...(input.parentAges.length ? [MT_PARENT_CONDITIONS] : []),
    ...(input.adultChildAges.length ? [MT_ADULT_CHILD_CONDITIONS] : []),
  ];
}

export const MT_LICENSE = "RES-IMMV";

export const MT_NOTES = [
  "All transactions will take place in EUR or AED, to be transferred to the company bank account in Dubai, UAE.",
  "Government administration fee: €15,000 to be paid with submission of application, the rest after approval.",
  "TEG professional fee and legal & admin fee are paid 50% in advance and 50% on approval.",
  "Residency card and health insurance are paid after approval.",
  "On the rental route, the first year's rent is included after approval; the property must be kept for at least five years.",
  "Health insurance is priced per member by age (approx. per year: under 18 €300, 18–25 €525, 26–50 €675, 50–70 €2,000, 70+ €2,250).",
  "Spouse and children under 18 are free — no charges by the Authority.",
  "Parents and parents-in-law: €7,500 per parent, to be paid after approval.",
  "Adult children (18–28): €7,500 per child, to be paid after approval.",
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
