/**
 * Portugal — D2, D7 and D8 residence visas.
 *
 * Ported from "Portugal (D2, D7, D8) - Calculations Nov26.xlsx" (sheets "D2 Visa", "D7 Visa", "D8 Visa").
 * Cell references below are for the D2 sheet; D7 / D8 use the same layout with fewer signing items.
 */
import type { LineItem, PaymentStage, Quote } from "./types";

export type PtVisa = "D2" | "D7" | "D8";

interface PtVisaRates {
  short: string;
  name: string;
  description: string;
  /** B8:B14 (D2) / B8:B10 (D7, D8) — paid upon signing; the professional fee is listed separately */
  signing: { id: string; label: string; amount: number }[];
  lawyerFee: number;
  professionalFeeOnSigning: number;
  /** C22 / C18 */
  lawyerSuccessFee: number;
  /** C25 / C21 */
  professionalFeeAfterApproval: number;
  /** B30:B31 / B26:B27 — each paid 50% on signing and 50% after visa approval */
  dependants: { spouse: number; perChild: number };
}

export const PT_VISAS: Record<PtVisa, PtVisaRates> = {
  D2: {
    short: "D2 Visa",
    name: "Entrepreneur & independent professional",
    description:
      "For entrepreneurs and independent professionals setting up a business in Portugal. Includes company formation, NIF, personal & business bank accounts, company address, COI renewal and business plan.",
    signing: [
      { id: "company-formation", label: "Company Formation, NIF, Personal & Business Bank Account, and Filing", amount: 1500 },
      { id: "incorporation-fee", label: "Company Incorporation Government Fee", amount: 220 },
      { id: "company-address", label: "Company Address", amount: 330 },
      { id: "coi-renewal", label: "COI Renewal", amount: 50 },
      { id: "business-plan", label: "Business Plan", amount: 200 },
    ],
    lawyerFee: 1500,
    professionalFeeOnSigning: 1000,
    lawyerSuccessFee: 1500,
    professionalFeeAfterApproval: 1500,
    dependants: { spouse: 1800, perChild: 800 },
  },
  D7: {
    short: "D7 Visa",
    name: "Passive income & retirement",
    description: "For applicants with passive income such as pensions, rental or investment income. Includes NIF, personal bank account and filing.",
    signing: [{ id: "nif-bank", label: "NIF, Personal Bank Account, and Filing", amount: 800 }],
    lawyerFee: 1500,
    professionalFeeOnSigning: 1000,
    lawyerSuccessFee: 1000,
    professionalFeeAfterApproval: 1000,
    dependants: { spouse: 1600, perChild: 800 },
  },
  D8: {
    short: "D8 Visa",
    name: "Digital nomad",
    description: "For remote workers employed by or serving clients outside Portugal. Includes NIF, personal bank account and filing.",
    signing: [{ id: "nif-bank", label: "NIF, Personal Bank Account, and Filing", amount: 800 }],
    lawyerFee: 1200,
    professionalFeeOnSigning: 1000,
    lawyerSuccessFee: 1000,
    professionalFeeAfterApproval: 1000,
    dependants: { spouse: 1400, perChild: 600 },
  },
};

export const PT_RATES = {
  /** B17 — tenancy contract, only for a family of 2 or more, paid before submission */
  tenancyContract: 1000,
  /** B18 — per person, paid directly at the embassy */
  embassyFee: 155,
  /** B19 — per person, approximate, paid directly to the insurance company */
  travelInsurance: 75,
  /** C23 / C24 — after visa approval */
  niss: 100,
  sns: 100,
  /** B35 — optional */
  appeal: 1000,
} as const;

export type PtMemberKey = "main" | "spouse" | "child";

export const PT_MEMBERS: { key: PtMemberKey; label: string; max: number }[] = [
  { key: "main", label: "Main Applicant", max: 1 },
  { key: "spouse", label: "Spouse", max: 1 },
  { key: "child", label: "Dependent Child", max: 10 },
];

export type PtFamily = Record<PtMemberKey, number>;

export interface PtFees {
  retainerOnSigning: number;
  retainerAfterApproval: number;
  lawyerFee: number;
  lawyerSuccessFee: number;
  /** Full additional fee per dependant — paid 50 / 50. */
  spouseFee: number;
  childFee: number;
}

export interface PtInput extends PtFees {
  visa: PtVisa;
  family: PtFamily;
  appeal: boolean;
}

/** Editable fees at the sheet defaults for a visa — used on load and whenever the visa changes. */
export function ptFeeDefaults(visa: PtVisa): PtFees {
  const v = PT_VISAS[visa];
  return {
    retainerOnSigning: v.professionalFeeOnSigning,
    retainerAfterApproval: v.professionalFeeAfterApproval,
    lawyerFee: v.lawyerFee,
    lawyerSuccessFee: v.lawyerSuccessFee,
    spouseFee: v.dependants.spouse,
    childFee: v.dependants.perChild,
  };
}

export const DEFAULT_PT_INPUT: PtInput = {
  visa: "D2",
  family: { main: 1, spouse: 0, child: 0 },
  appeal: false,
  ...ptFeeDefaults("D2"),
};

export function ptFamilySize(f: PtFamily): number {
  return PT_MEMBERS.reduce((n, m) => n + f[m.key], 0);
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

export function computePtQuote(input: PtInput): Quote {
  const R = PT_RATES;
  const v = PT_VISAS[input.visa];
  const { spouse, child } = input.family;
  const n = ptFamilySize(input.family);
  const SIGNING = "Upon signing";
  const BEFORE = "Before submission";
  const AFTER = "After visa approval from embassy";

  const dependants = (prefix: string, timeline: string) => [
    line(`${prefix}-spouse`, "Additional Fee — Spouse (50%)", input.spouseFee / 2, spouse, "Spouse", timeline),
    line(`${prefix}-child`, "Additional Fee — Each Child (50%)", input.childFee / 2, child, `${child} × child`, timeline),
  ];

  const stages = [
    stage("signing", "Paid upon signing", "Upon Signing", "Upon signing", [
      line("lawyer", "Lawyer Fee", input.lawyerFee, 1, undefined, SIGNING),
      ...v.signing.map((s) => line(s.id, s.label, s.amount, 1, undefined, SIGNING)),
      line("retainer-signing", "Professional Fee", input.retainerOnSigning, 1, undefined, SIGNING),
      ...dependants("signing", SIGNING),
    ]),
    stage("before-submission", "Paid before submission", "Before Submission", "Before submission", [
      line("tenancy-contract", "Tenancy Contract", R.tenancyContract, n >= 2 ? 1 : 0, "Family option — family of 2 or more", BEFORE),
      line("embassy", "Embassy Fee", R.embassyFee, n, `${n} × person · paid directly at the embassy`, BEFORE),
      line("travel-insurance", "Travel Insurance (approx.)", R.travelInsurance, n, `${n} × person · paid directly to the insurance company`, BEFORE),
    ]),
    stage("after-approval", "Paid after visa approval from embassy", "After Visa Approval", "After visa approval", [
      line("lawyer-success", "Lawyer Success Fee", input.lawyerSuccessFee, 1, undefined, AFTER),
      line("niss", "NISS", R.niss, 1, undefined, AFTER),
      line("sns", "SNS (Health Number)", R.sns, 1, undefined, AFTER),
      line("retainer-approval", "Professional Fee", input.retainerAfterApproval, 1, undefined, AFTER),
      ...dependants("after", AFTER),
    ]),
    stage("optional", "Optional", "Optional", "Optional (appeal)", [
      line("appeal", "Appeal (if needed)", R.appeal, input.appeal ? 1 : 0),
    ]),
  ].filter((s) => s.lines.length > 0);

  return { currency: "EUR", stages, total: stages.reduce((s, st) => s + st.subtotal, 0), familySize: n };
}

export const PT_NOTES = [
  "All transactions will take place in EUR or AED, to be transferred to the company bank account in Dubai, UAE.",
  "Additional fees per dependant are paid 50% on signing and 50% after visa approval from the embassy.",
  "Tenancy contract (€1,000) is only needed for a family of 2 or more and is paid before submission.",
  "Embassy fee and travel insurance are approximate and are paid directly by the client to the embassy and the insurance company. TEG will not receive this amount in any form.",
  "Appeal (€1,000) is optional and only charged if needed.",
  "The client is responsible for the exchange rate difference.",
  "All amounts mentioned are exclusive of VAT.",
  "This quotation is valid for 30 days from the date of quotation.",
];
