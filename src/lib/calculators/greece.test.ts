import { describe, expect, it } from "vitest";
import { computeGrQuote, DEFAULT_GR_INPUT, grLandRegistry, grLawyerFee, type GrFamily } from "./greece";

/**
 * Port of the sheet with the agreed changes: A = property (E3) + E5:E9, B = E12:E17 (before submission),
 * C = E18 (TEG fee after approval). D12/D13/D15/D16 come from the family.
 */
function sheet(b3: number, deps: number) {
  const e5 = 0.01 * b3 + 0.24 * (0.01 * b3);
  const a = b3 + e5 + 0.015 * b3 + 0.006 * b3 + 0.03 * b3 + 5000;
  const b = 1000 + 500 * deps + 2016 + 166 * deps + 150 * (1 + deps) + 2000;
  return { a, b, c: 5000, total: a + b + 5000 };
}

const fam = (spouse: number, child: number, parent: number): GrFamily => ({ main: 1, spouse, child, parent });

describe("Greece calculator", () => {
  it("matches the sheet's saved sample (€250,000, main applicant + 3 dependants) plus the property price", () => {
    const q = computeGrQuote({ ...DEFAULT_GR_INPUT, family: fam(1, 2, 0) });
    expect(q.stages.map((s) => s.subtotal)).toEqual([250000 + 20850, 12614 - 5000, 5000]);
    expect(q.total).toBe(250000 + 33464);
    expect(q.currency).toBe("EUR");
  });

  it("matches the sheet for every family and several property prices", () => {
    for (const price of [250000, 300000, 475000, 1000000])
      for (const spouse of [0, 1])
        for (let child = 0; child <= 10; child++)
          for (let parent = 0; parent <= 4; parent++) {
            const x = sheet(price, spouse + child + parent);
            const q = computeGrQuote({ ...DEFAULT_GR_INPUT, propertyPrice: price, family: fam(spouse, child, parent) });
            expect(q.stages.map((s) => s.subtotal)).toEqual([x.a, x.b, x.c]);
            expect(q.total).toBe(x.total);
          }
  });

  it("never prices the property below €250,000", () => {
    expect(computeGrQuote({ ...DEFAULT_GR_INPUT, propertyPrice: 100000 }).total).toBe(computeGrQuote(DEFAULT_GR_INPUT).total);
  });

  it("land registry is editable but never below 0.6% of the price", () => {
    expect(grLandRegistry(DEFAULT_GR_INPUT)).toEqual({ amount: 1500, min: 1500, max: 2250 });
    expect(grLandRegistry({ ...DEFAULT_GR_INPUT, landRegistry: 2000 }).amount).toBe(2000);
    expect(grLandRegistry({ ...DEFAULT_GR_INPUT, landRegistry: 900 }).amount).toBe(1500);
    expect(grLandRegistry({ ...DEFAULT_GR_INPUT, propertyPrice: 500000 }).amount).toBe(3000);
  });

  it("lawyer's fee is editable but never below 1%, with 24% VAT on the amount charged", () => {
    expect(grLawyerFee(DEFAULT_GR_INPUT)).toEqual({ amount: 2500, min: 2500 });
    expect(grLawyerFee({ ...DEFAULT_GR_INPUT, lawyerFee: 1000 }).amount).toBe(2500);
    const q = computeGrQuote({ ...DEFAULT_GR_INPUT, lawyerFee: 4000 });
    const by = (id: string) => q.stages[0].lines.find((l) => l.id === id)?.total;
    expect([by("lawyer"), by("lawyer-vat")]).toEqual([4000, 960]);
  });

  it("residency application fees are paid before submission; TEG after-approval fee is its own stage", () => {
    const q = computeGrQuote(DEFAULT_GR_INPUT);
    expect(q.stages.map((s) => s.id)).toEqual(["purchase", "residency", "approval"]);
    expect(new Set(q.stages[1].lines.map((l) => l.timeline))).toEqual(new Set(["Before application submission"]));
    expect(q.stages[2].lines.map((l) => l.id)).toEqual(["retainer-approval"]);
  });

  it("TEG professional fee is editable", () => {
    const q = computeGrQuote({ ...DEFAULT_GR_INPUT, retainerOnSigning: 2000, retainerAfterApproval: 0 });
    expect(q.stages.map((s) => s.subtotal)).toEqual([250000 + 17850, 1000 + 2016 + 150 + 2000]);
  });
});
