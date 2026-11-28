import { describe, expect, it } from "vitest";
import { computeMtQuote, DEFAULT_MT_INPUT, mtConditions, type MtAgeBand, type MtInput, type MtRoute } from "./malta";

const INSURANCE: Record<MtAgeBand, number> = { under18: 300, "18-25": 525, "26-50": 675, "50-70": 2000, "70+": 2250 };

/** Straight reading of the sheet (D6:D34 / F6:F34) with I24:J28 health insurance. */
function sheet(i: MtInput) {
  const n = 1 + i.spouse + i.children;
  const property = i.route === "rent" ? 0 : Math.max(i.purchasePrice, 375000);
  const insurance = INSURANCE[i.mainAge] + INSURANCE[i.spouseAge] * i.spouse + 300 * i.children;
  return [
    5000 + 10000,
    15000,
    45000 + 37000 + 2000 + 500 * n + insurance + 10000 + 5000,
    ...(property ? [property] : []),
    2000,
  ];
}

describe("Malta MPRP calculator", () => {
  it("rental route, main applicant only (age 26–50) — rent is not in the total", () => {
    const q = computeMtQuote(DEFAULT_MT_INPUT);
    expect(q.stages.map((s) => s.id)).toEqual(["signing", "submission", "approval", "compliance"]);
    expect(q.stages.map((s) => s.subtotal)).toEqual([15000, 15000, 100175, 2000]);
    expect(q.total).toBe(132175);
    expect(q.currency).toBe("EUR");
  });

  it("purchase route includes the €375,000 property", () => {
    const q = computeMtQuote({ ...DEFAULT_MT_INPUT, route: "purchase" });
    expect(q.stages[3].subtotal).toBe(375000);
    expect(q.total).toBe(132175 + 375000);
  });

  it("legal & admin fee is paid 50% in advance and 50% on approval", () => {
    const q = computeMtQuote(DEFAULT_MT_INPUT);
    expect(q.stages[0].lines.find((l) => l.id === "legal-advance")?.total).toBe(10000);
    expect(q.stages[2].lines.find((l) => l.id === "legal-approval")?.total).toBe(10000);
  });

  it("charges residency card and health insurance after approval", () => {
    const after = computeMtQuote({ ...DEFAULT_MT_INPUT, spouse: 1, children: 2 }).stages[2].lines.map((l) => l.id);
    expect(after).toEqual(expect.arrayContaining(["residency-card", "insurance-main", "insurance-spouse", "insurance-child"]));
  });

  it.each<MtRoute>(["rent", "purchase"])("matches the sheet for every family and age (%s)", (route) => {
    for (const spouse of [0, 1] as const)
      for (let children = 0; children <= 10; children++)
        for (const mainAge of Object.keys(INSURANCE) as MtAgeBand[]) {
          const input: MtInput = { ...DEFAULT_MT_INPUT, route, spouse, children, mainAge, spouseAge: "50-70" };
          const x = sheet(input);
          const q = computeMtQuote(input);
          expect(q.stages.map((s) => s.subtotal)).toEqual(x);
          expect(q.total).toBe(x.reduce((a, b) => a + b, 0));
        }
  });

  it("government fees do not change with family size (spouse and children free)", () => {
    const gov = (i: MtInput) =>
      computeMtQuote(i)
        .stages.flatMap((s) => s.lines)
        .filter((l) => ["admin-fee-submission", "admin-fee-balance", "contribution", "ngo"].includes(l.id))
        .reduce((s, l) => s + l.total, 0);
    expect(gov({ ...DEFAULT_MT_INPUT, spouse: 1, children: 4 })).toBe(gov(DEFAULT_MT_INPUT));
    expect(gov(DEFAULT_MT_INPUT)).toBe(60000 + 37000 + 2000);
  });

  it("never uses less than the minimum rent or purchase price", () => {
    const rentRow = (rent: number) => mtConditions({ ...DEFAULT_MT_INPUT, rent }).rows[0].value;
    expect(rentRow(9000)).toBe("€14,000 per year");
    expect(rentRow(18000)).toBe("€18,000 per year");
    expect(computeMtQuote({ ...DEFAULT_MT_INPUT, rent: 18000 }).total).toBe(132175);
    expect(computeMtQuote({ ...DEFAULT_MT_INPUT, route: "purchase", purchasePrice: 200000 }).stages[3].subtotal).toBe(375000);
  });

  it("legal & admin and TEG fees are editable", () => {
    const q = computeMtQuote({ ...DEFAULT_MT_INPUT, legalAdvance: 7500, legalOnApproval: 7500, retainerAdvance: 6000, retainerAfterApproval: 0 });
    expect(q.stages[0].subtotal).toBe(13500);
    expect(q.stages[2].subtotal).toBe(100175 - 2500 - 5000);
  });

  it("lists the key conditions for the selected route", () => {
    expect(mtConditions(DEFAULT_MT_INPUT).rows).toHaveLength(6);
    expect(mtConditions({ ...DEFAULT_MT_INPUT, route: "purchase" }).rows[1].label).toBe("Minimum purchase value is €375,000.");
  });
});
