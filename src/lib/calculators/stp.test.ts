import { describe, expect, it } from "vitest";
import { computeStpQuote, DEFAULT_STP_INPUT, type StpFamily } from "./stp";

/** Straight reading of the calculation sheet: D6/D7, D10/D11, D13, D15. */
function sheet(n: number): { a: number; b: number } {
  const donation = n === 1 ? 90000 : 95000 + Math.max(0, n - 4) * 5000;
  return { a: 5250, b: donation + 780 * n };
}

const fam = (spouse: number, child: number, parent: number): StpFamily => ({ main: 1, spouse, child, parent });

describe("São Tomé and Príncipe calculator", () => {
  it("single applicant: $5,250 + $90,000 + $780", () => {
    const q = computeStpQuote(DEFAULT_STP_INPUT);
    expect(q.stages.map((s) => s.subtotal)).toEqual([5250, 90780]);
    expect(q.total).toBe(96030);
  });

  it("family of 4 pays the $95,000 family donation, no extras", () => {
    const q = computeStpQuote({ ...DEFAULT_STP_INPUT, family: fam(1, 2, 0) });
    expect(q.total).toBe(5250 + 95000 + 4 * 780);
    expect(q.stages[1].lines.some((l) => l.id === "extra-dependants")).toBe(false);
  });

  it("adds $5,000 for each member from the 5th onwards", () => {
    const q = computeStpQuote({ ...DEFAULT_STP_INPUT, family: fam(1, 3, 2) }); // 7 persons
    expect(q.stages[1].lines.find((l) => l.id === "extra-dependants")?.total).toBe(3 * 5000);
    expect(q.total).toBe(5250 + 95000 + 15000 + 7 * 780);
  });

  it("matches the sheet for every family composition", () => {
    for (const spouse of [0, 1])
      for (let child = 0; child <= 10; child++)
        for (let parent = 0; parent <= 4; parent++) {
          const q = computeStpQuote({ ...DEFAULT_STP_INPUT, family: fam(spouse, child, parent) });
          const x = sheet(1 + spouse + child + parent);
          expect([q.stages[0].subtotal, q.stages[1].subtotal]).toEqual([x.a, x.b]);
        }
  });

  it("TEG professional fee is editable and lands in the right stage", () => {
    const q = computeStpQuote({ ...DEFAULT_STP_INPUT, retainerOnSigning: 5000, retainerOnApproval: 7500 });
    expect(q.stages[0].subtotal).toBe(5250 + 5000);
    expect(q.stages[1].subtotal).toBe(90780 + 7500);
  });
});
