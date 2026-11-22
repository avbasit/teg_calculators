/**
 * Türkiye — Citizenship by Investment: Real Estate and Bank Deposit routes.
 *
 * Ported from "Turkey CBI.xlsx" (Sheet1). Column D is the Real Estate route, column G the Bank Deposit route.
 */
import type { InfoSection, LineItem, PaymentStage, Quote } from "./types";

export type TrRoute = "RE" | "BD";

export const TR_ROUTES: Record<TrRoute, { short: string; name: string; description: string }> = {
  RE: {
    short: "Real Estate",
    name: "Property from US$400,000",
    description:
      "Purchase of qualifying property from US$400,000. The property price can be edited; title deed transfer (4%) and VAT (1%) follow the final property value.",
  },
  BD: {
    short: "Bank Deposit",
    name: "US$500,000 deposit",
    description:
      "US$500,000 deposited in a Turkish bank. Turkish Lira conversion is required. No title deed, appraisal or property VAT applies.",
  },
};

export type TrMemberKey = "main" | "spouse" | "child";

export const TR_MEMBERS: { key: TrMemberKey; label: string; hint?: string; adult: boolean; max: number }[] = [
  { key: "main", label: "Main Applicant", adult: true, max: 1 },
  { key: "spouse", label: "Spouse", adult: true, max: 1 },
  {
    key: "child",
    label: "Dependent Child",
    hint: "Under 18. Adult children with qualifying dependency, particularly due to disability, may have an exception under Article 12(1) of Turkish Citizenship Law No. 5901.",
    adult: false,
    max: 10,
  },
];

export type TrFamily = Record<TrMemberKey, number>;

export const TR_RATES = {
  /** D6 — minimum property price; editable above this */
  minPropertyPrice: 400000,
  /** G6 — bank deposit */
  bankDeposit: 500000,
  /** D8 — title deed transfer, 4% of the final property value (government) */
  titleDeedRate: 0.04,
  /** D10 — appraisal report fee (private), real estate only */
  appraisal: 1000,
  /** D12 / G12 */
  notary: 1000,
  /** D14 / G14 — lawyer fee defaults (editable; real estate $5,000 – $8,000 depending on project) */
  lawyer: { RE: 5000, BD: 10000 } as Record<TrRoute, number>,
  /** D16 — VAT, 1% of the final property value */
  vatRate: 0.01,
  /** D18 — per adult */
  taxId: 20,
  /** D20 — per person */
  residencyApplication: 200,
  /** D22 — per person */
  residencyCard: 50,
  /** D24 — per person */
  passport: 350,
  /** D26 — per application */
  courier: 200,
  /** D4 / D30 — TEG professional fee defaults (editable) */
  tegFee: { onSigning: 5000, afterApproval: 5000 },
} as const;

export interface TrInput {
  route: TrRoute;
  family: TrFamily;
  /** Property price as entered; the quote never uses less than US$400,000. */
  propertyPrice: number;
  /** Lawyer fee override; `null` uses the route default. */
  lawyerFee: number | null;
  retainerOnSigning: number;
  retainerAfterApproval: number;
}

export const DEFAULT_TR_INPUT: TrInput = {
  route: "RE",
  family: { main: 1, spouse: 0, child: 0 },
  propertyPrice: TR_RATES.minPropertyPrice,
  lawyerFee: null,
  retainerOnSigning: TR_RATES.tegFee.onSigning,
  retainerAfterApproval: TR_RATES.tegFee.afterApproval,
};

export function trFamilySize(f: TrFamily): number {
  return TR_MEMBERS.reduce((n, m) => n + f[m.key], 0);
}

export function trAdults(f: TrFamily): number {
  return TR_MEMBERS.filter((m) => m.adult).reduce((n, m) => n + f[m.key], 0);
}

/** Property price used in the quote. */
export function trPropertyPrice(input: TrInput): number {
  return Math.max(input.propertyPrice, TR_RATES.minPropertyPrice);
}

export function trLawyerFee(input: TrInput): number {
  return input.lawyerFee ?? TR_RATES.lawyer[input.route];
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

export function computeTrQuote(input: TrInput): Quote {
  const R = TR_RATES;
  const n = trFamilySize(input.family);
  const adults = trAdults(input.family);
  const re = input.route === "RE";
  const price = trPropertyPrice(input);
  const perPerson = `${n} × person`;

  const investment = re
    ? [
        line("property", "Property", price, 1, "Final property value"),
        line("title-deed", "Title Deed Transfer (4%) — Govt.", Math.round(price * R.titleDeedRate), 1, "4% of final property value"),
        line("appraisal", "Appraisal Report Fee — Pvt.", R.appraisal, 1),
        line("notary", "Notary", R.notary, 1),
        line("lawyer", "Lawyer Fee", trLawyerFee(input), 1, "Depending on project"),
        line("vat", "VAT (1%)", Math.round(price * R.vatRate), 1, "1% of final property value"),
      ]
    : [
        line("deposit", "Bank Deposit", R.bankDeposit, 1, "Turkish Lira conversion required"),
        line("notary", "Notary", R.notary, 1),
        line("lawyer", "Lawyer Fee", trLawyerFee(input), 1),
      ];

  const stages = [
    stage("signing", "Upon signing", "Upon Signing", "Upon signing", [
      line("retainer-signing", "Retainer of Professional Fees", input.retainerOnSigning, 1, undefined, "Upon signing"),
    ]),
    stage("investment", re ? "Property & purchase costs" : "Bank deposit & legal", "Investment Total", "Investment", investment),
    stage("submission", "Upon submission", "Upon Submission", "Upon submission", [
      line("tax-id", "Tax ID", R.taxId, adults, `${adults} × adult`),
      line("residency-application", "Residency Application", R.residencyApplication, n, perPerson),
      line("residency-card", "Residency Card", R.residencyCard, n, perPerson),
      line("passport", "Passport Fee", R.passport, n, perPerson),
      line("courier", "Courier Charge", R.courier, 1, "Per application"),
    ]),
    stage("approval", "After approval", "After Approval", "After approval", [
      line("retainer-approval", "Balance of Professional Fees", input.retainerAfterApproval, 1, undefined, "After approval"),
    ]),
  ].filter((s) => s.lines.length > 0);

  return { currency: "USD", stages, total: stages.reduce((s, st) => s + st.subtotal, 0), familySize: n };
}

/** D38:D48 — shown (and printed) for information only, not part of the calculation. */
export const TR_OTHER_DETAILS: InfoSection = {
  title: "Other details (information only)",
  note: "Not part of the main calculation and not included in the total.",
  rows: [
    { label: "Annual Property Tax", value: "0.1% – 0.2%" },
    { label: "Annual Maintenance Charge", value: "TBD" },
    { label: "DASK Earthquake Insurance", value: "US$50 – US$150 / year" },
    { label: "Utility Connection Cost", value: "US$100 – US$300" },
    { label: "ROI / Year (depending on investment)", value: "3% – 5%" },
    { label: "Buyback after 3 Years", value: "Depending on project" },
  ],
};

export function trNotes(route: TrRoute): string[] {
  return [
    "All transactions will take place in US Dollars or AED, to be transferred to the company bank account in Dubai, UAE.",
    ...(route === "BD" ? ["Bank deposit requires Turkish Lira conversion."] : []),
    "Final amounts may vary.",
    "Health insurance charges are not included.",
    "TEG is not responsible for any changes in government fee.",
    "The client is responsible for the exchange rate difference.",
    "All amounts mentioned are exclusive of VAT.",
    "This quotation is valid for 30 days from the date of issuance.",
  ];
}
