import { describe, expect, it } from "vitest";
import { computePtQuote, DEFAULT_PT_INPUT, ptSettlementFunds, type PtFamily } from "./portugal-d2";

/** Straight reading of the costing sheet (C3:C11), fees at their sheet defaults. */
function sheet(spouse: number, child: number) {
  const fee = 10000 + 2000 * spouse + 1000 * child;
  const n = 1 + spouse + child;
  return { advance: fee / 2, afterVisa: fee / 2, thirdParty: (155 + 150) * n };
}

const fam = (spouse: number, child: number): PtFamily => ({ main: 1, spouse, child });

describe("Portugal D2 calculator", () => {
  it("main applicant only", () => {
    const q = computePtQuote(DEFAULT_PT_INPUT);
    expect(q.stages.map((s) => s.subtotal)).toEqual([5000, 5000, 305]);
    expect(q.total).toBe(10305);
    expect(q.currency).toBe("EUR");
  });

  it("matches the sheet for every family composition", () => {
    for (const spouse of [0, 1])
      for (let child = 0; child <= 10; child++) {
        const x = sheet(spouse, child);
        const q = computePtQuote({ ...DEFAULT_PT_INPUT, family: fam(spouse, child) });
        expect(q.stages.map((s) => s.subtotal)).toEqual([x.advance, x.afterVisa, x.thirdParty]);
        expect(q.total).toBe(x.advance + x.afterVisa + x.thirdParty);
      }
  });

  it("adds no extra professional fee", () => {
    const q = computePtQuote({ ...DEFAULT_PT_INPUT, family: fam(1, 2) });
    const fees = q.stages.filter((s) => s.id !== "third-party").reduce((s, st) => s + st.subtotal, 0);
    expect(fees).toBe(10000 + 2000 + 2 * 1000);
  });

  it("TEG fees are editable and split 50 / 50", () => {
    const q = computePtQuote({ ...DEFAULT_PT_INPUT, family: fam(1, 1), feeMain: 8000, feeSpouse: 0, feeChild: 600 });
    expect(q.stages[0].subtotal).toBe(4300);
    expect(q.stages[1].subtotal).toBe(4300);
    expect(q.stages[0].lines.some((l) => l.id === "advance-spouse")).toBe(false);
  });

  it("settlement funds follow the sheet and stay out of the total", () => {
    expect(ptSettlementFunds(fam(0, 0))).toBe(11500);
    expect(ptSettlementFunds(fam(1, 2))).toBe(11500 + 5750 + 2 * 3450);
  });
});
