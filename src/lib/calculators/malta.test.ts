import { describe, expect, it } from "vitest";
import { computeMtQuote, DEFAULT_MT_INPUT, mtConditions, mtInfoSections, mtInsuranceBand, type MtInput, type MtRoute } from "./malta";

/** I24:J28 — the sheet's age bands. */
const insurance = (age: number) => (age < 18 ? 300 : age <= 25 ? 525 : age <= 50 ? 675 : age <= 70 ? 2000 : 2250);

/** Straight reading of the sheet (D6:D34 / F6:F34). Rent sits after approval; the purchase is its own stage. */
function sheet(i: MtInput) {
  const n = 1 + i.spouse + i.childAges.length + i.adultChildAges.length + i.parentAges.length;
  const rent = i.route === "rent" ? Math.max(i.rent, 14000) : 0;
  const ins = [i.mainAge, ...(i.spouse ? [i.spouseAge] : []), ...i.childAges, ...i.adultChildAges, ...i.parentAges].reduce((s, a) => s + insurance(a), 0);
  const extra = 7500 * (i.parentAges.length + i.adultChildAges.length);
  return [
    5000 + 10000,
    15000,
    45000 + 37000 + extra + 2000 + 500 * n + ins + rent + 10000 + 5000,
    ...(i.route === "purchase" ? [Math.max(i.purchasePrice, 375000)] : []),
    2000,
  ];
}

describe("Malta MPRP calculator", () => {
  it("rental route, main applicant aged 40 — rent is part of C (after approval)", () => {
    const q = computeMtQuote(DEFAULT_MT_INPUT);
    expect(q.stages.map((s) => s.id)).toEqual(["signing", "submission", "approval", "compliance"]);
    expect(q.stages.map((s) => s.subtotal)).toEqual([15000, 15000, 100175 + 14000, 2000]);
    expect(q.stages[2].lines.find((l) => l.id === "rent")?.total).toBe(14000);
    expect(q.total).toBe(146175);
    expect(q.currency).toBe("EUR");
  });

  it("purchase route includes the €375,000 property as its own stage, with no rent", () => {
    const q = computeMtQuote({ ...DEFAULT_MT_INPUT, route: "purchase" });
    expect(q.stages[3].subtotal).toBe(375000);
    expect(q.stages[2].lines.some((l) => l.id === "rent")).toBe(false);
    expect(q.total).toBe(132175 + 375000);
  });

  it("prices health insurance from each member's age", () => {
    expect([10, 17, 18, 25, 26, 50, 51, 70, 71, 85].map((a) => mtInsuranceBand(a).rate)).toEqual([
      300, 300, 525, 525, 675, 675, 2000, 2000, 2250, 2250,
    ]);
    const q = computeMtQuote({ ...DEFAULT_MT_INPUT, mainAge: 62, spouse: 1, spouseAge: 24, childAges: [16, 4] });
    const ins = q.stages[2].lines.filter((l) => l.id.startsWith("insurance"));
    expect(ins.map((l) => [l.id, l.total])).toEqual([
      ["insurance-main", 2000],
      ["insurance-spouse", 525],
      ["insurance-child-1", 300],
      ["insurance-child-2", 300],
    ]);
    expect(ins[0].detail).toContain("age 62 (50–70)");
  });

  it.each<MtRoute>(["rent", "purchase"])("matches the sheet for every family and age (%s)", (route) => {
    for (const spouse of [0, 1] as const)
      for (let children = 0; children <= 10; children++)
        for (const mainAge of [20, 40, 60, 75]) {
          const childAges = Array.from({ length: children }, (_, k) => k % 18);
          const parentAges = [62, 75].slice(0, children % 3);
          const adultChildAges = [19, 27].slice(0, mainAge % 3);
          const input: MtInput = { ...DEFAULT_MT_INPUT, route, spouse, mainAge, spouseAge: 55, childAges, parentAges, adultChildAges };
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
    expect(gov({ ...DEFAULT_MT_INPUT, spouse: 1, childAges: [3, 7, 12, 15] })).toBe(gov(DEFAULT_MT_INPUT));
    expect(gov(DEFAULT_MT_INPUT)).toBe(60000 + 37000 + 2000);
  });

  it("adds €7,500 per parent and per adult child (18–28) after approval, with card and insurance each", () => {
    const q = computeMtQuote({ ...DEFAULT_MT_INPUT, parentAges: [68, 72], adultChildAges: [22] });
    const after = q.stages[2].lines;
    expect(after.find((l) => l.id === "parent")?.total).toBe(15000);
    expect(after.find((l) => l.id === "adult-child")?.total).toBe(7500);
    expect(after.find((l) => l.id === "residency-card")?.qty).toBe(4);
    expect(after.filter((l) => l.id.startsWith("insurance")).map((l) => l.total)).toEqual([675, 525, 2000, 2250]);
    expect(q.familySize).toBe(4);
  });

  it("prints parent and adult child conditions only when they are included", () => {
    expect(mtInfoSections(DEFAULT_MT_INPUT).map((s) => s.title)).toEqual(["Key conditions — Renting of Property"]);
    expect(mtInfoSections({ ...DEFAULT_MT_INPUT, parentAges: [70], adultChildAges: [20] }).map((s) => s.title)).toEqual([
      "Key conditions — Renting of Property",
      "Conditions for including parents",
      "Conditions for adult children",
    ]);
  });

  it("legal & admin fee is paid 50% in advance and 50% on approval", () => {
    const q = computeMtQuote(DEFAULT_MT_INPUT);
    expect(q.stages[0].lines.find((l) => l.id === "legal-advance")?.total).toBe(10000);
    expect(q.stages[2].lines.find((l) => l.id === "legal-approval")?.total).toBe(10000);
  });

  it("never uses less than the minimum rent or purchase price", () => {
    const rentLine = (rent: number) => computeMtQuote({ ...DEFAULT_MT_INPUT, rent }).stages[2].lines.find((l) => l.id === "rent")?.total;
    expect(rentLine(9000)).toBe(14000);
    expect(rentLine(18000)).toBe(18000);
    expect(computeMtQuote({ ...DEFAULT_MT_INPUT, route: "purchase", purchasePrice: 200000 }).stages[3].subtotal).toBe(375000);
  });

  it("legal & admin and TEG fees are editable", () => {
    const q = computeMtQuote({ ...DEFAULT_MT_INPUT, legalAdvance: 7500, legalOnApproval: 7500, retainerAdvance: 6000, retainerAfterApproval: 0 });
    expect(q.stages[0].subtotal).toBe(13500);
    expect(q.stages[2].subtotal).toBe(114175 - 2500 - 5000);
  });

  it("lists the key conditions for the selected route", () => {
    expect(mtConditions(DEFAULT_MT_INPUT).rows).toHaveLength(5);
    expect(mtConditions({ ...DEFAULT_MT_INPUT, route: "purchase" }).rows[1].label).toBe("Minimum purchase value is €375,000.");
  });
});
