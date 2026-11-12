import { describe, expect, it } from "vitest";
import { computeVuQuote, DEFAULT_VU_INPUT, type VuFamily } from "./vanuatu";

/** Straight reading of the pricing sheet (C5–C20), TEG fees at their sheet defaults. */
function sheet(n: number) {
  const table = [130000, 150000, 165000, 180000];
  const donation = n <= 4 ? table[n - 1] : 180000 + (n - 4) * 25000;
  return {
    signing: 5000 + 250 + 5000,
    approval: donation + 1000 * n + 5000,
    biometrics: 2000 + 1800 * (n - 1),
  };
}

const fam = (spouse: number, child: number, parent: number): VuFamily => ({ main: 1, spouse, child, parent });

describe("Vanuatu calculator", () => {
  it("single applicant", () => {
    const q = computeVuQuote(DEFAULT_VU_INPUT);
    expect(q.stages.map((s) => s.subtotal)).toEqual([10250, 136000, 2000]);
    expect(q.total).toBe(148250);
  });

  it("uses the married-couple and family-of-3/4 donation tiers", () => {
    expect(computeVuQuote({ ...DEFAULT_VU_INPUT, family: fam(1, 0, 0) }).stages[1].lines[0].unit).toBe(150000);
    expect(computeVuQuote({ ...DEFAULT_VU_INPUT, family: fam(1, 1, 0) }).stages[1].lines[0].unit).toBe(165000);
    expect(computeVuQuote({ ...DEFAULT_VU_INPUT, family: fam(1, 2, 0) }).stages[1].lines[0].unit).toBe(180000);
  });

  it("adds $25,000 per dependant beyond a family of 4", () => {
    const q = computeVuQuote({ ...DEFAULT_VU_INPUT, family: fam(1, 3, 2) }); // 7 persons
    expect(q.stages[1].lines.find((l) => l.id === "extra-dependants")?.total).toBe(75000);
  });

  it("matches the sheet for every family composition", () => {
    for (const spouse of [0, 1])
      for (let child = 0; child <= 10; child++)
        for (let parent = 0; parent <= 4; parent++) {
          const x = sheet(1 + spouse + child + parent);
          const q = computeVuQuote({ ...DEFAULT_VU_INPUT, family: fam(spouse, child, parent) });
          expect(q.stages.map((s) => s.subtotal)).toEqual([x.signing, x.approval, x.biometrics]);
        }
  });

  it("TEG professional fee is editable", () => {
    const q = computeVuQuote({ ...DEFAULT_VU_INPUT, retainerOnSigning: 2500, retainerOnApproval: 0 });
    expect(q.stages[0].subtotal).toBe(5250 + 2500);
    expect(q.stages[1].subtotal).toBe(131000);
  });
});
