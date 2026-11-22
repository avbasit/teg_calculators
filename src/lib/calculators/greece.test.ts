import { describe, expect, it } from "vitest";
import { computeGrQuote, DEFAULT_GR_INPUT, grLandRegistry, type GrFamily } from "./greece";

/** Literal port of the sheet's E5:E9 (E10) and E12:E18 (E19), with D12/D13/D15/D16 from the family. */
function sheet(b3: number, deps: number) {
  const e5 = 0.01 * b3 + 0.24 * (0.01 * b3);
  const e10 = e5 + 0.015 * b3 + 0.006 * b3 + 0.03 * b3 + 5000;
  const e19 = 1000 + 500 * deps + 2016 + 166 * deps + 150 * (1 + deps) + 2000 + 5000;
  return { e10, e19, e20: e10 + e19 };
}

const fam = (spouse: number, child: number, parent: number): GrFamily => ({ main: 1, spouse, child, parent });

describe("Greece calculator", () => {
  it("matches the sheet's saved sample (€250,000, main applicant + 3 dependants)", () => {
    const q = computeGrQuote({ ...DEFAULT_GR_INPUT, family: fam(1, 2, 0) });
    expect(q.stages.map((s) => s.subtotal)).toEqual([20850, 12614]);
    expect(q.total).toBe(33464);
    expect(q.currency).toBe("EUR");
  });

  it("matches the sheet for every family and several property prices", () => {
    for (const price of [250000, 300000, 475000, 1000000])
      for (const spouse of [0, 1])
        for (let child = 0; child <= 10; child++)
          for (let parent = 0; parent <= 4; parent++) {
            const x = sheet(price, spouse + child + parent);
            const q = computeGrQuote({ ...DEFAULT_GR_INPUT, propertyPrice: price, family: fam(spouse, child, parent) });
            expect(q.stages.map((s) => s.subtotal)).toEqual([x.e10, x.e19]);
            expect(q.total).toBe(x.e20);
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

  it("TEG professional fee is editable", () => {
    const q = computeGrQuote({ ...DEFAULT_GR_INPUT, retainerOnSigning: 2000, retainerAfterApproval: 0 });
    expect(q.stages.map((s) => s.subtotal)).toEqual([17850, 1000 + 2016 + 150 + 2000]);
  });
});
