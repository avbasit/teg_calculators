import { describe, expect, it } from "vitest";
import { computeEsQuote, DEFAULT_ES_INPUT, esMinIncome, type EsFamily } from "./spain-dnv";

const fam = (spouse: number, child: number, parent: number): EsFamily => ({ main: 1, spouse, child, parent });

describe("Spain Digital Nomad Visa calculator", () => {
  it("main applicant only", () => {
    const q = computeEsQuote(DEFAULT_ES_INPUT);
    expect(q.stages.map((s) => s.subtotal)).toEqual([1250 + 74, 1250]);
    expect(q.total).toBe(2574);
    expect(q.currency).toBe("EUR");
  });

  it("matches the sheet for every family composition (no extra professional fee)", () => {
    for (const spouse of [0, 1])
      for (let child = 0; child <= 10; child++)
        for (let parent = 0; parent <= 2; parent++) {
          const fee = 2500 + 1000 * (spouse + child + parent);
          const q = computeEsQuote({ ...DEFAULT_ES_INPUT, family: fam(spouse, child, parent) });
          const n = 1 + spouse + child + parent;
          expect(q.stages.map((s) => s.subtotal)).toEqual([fee / 2 + 74 * n, fee / 2]);
          expect(q.total).toBe(fee + 74 * n);
        }
  });

  it("TEG fees are editable", () => {
    const q = computeEsQuote({ ...DEFAULT_ES_INPUT, family: fam(1, 0, 0), feeMain: 3000, feeDependant: 0 });
    expect(q.total).toBe(3000 + 74 * 2);
    expect(q.stages[0].lines.map((l) => l.id)).toEqual(["advance-main", "bank-fee"]);
  });

  it("collects the €74 bank fee per person with the first payment", () => {
    const q = computeEsQuote({ ...DEFAULT_ES_INPUT, family: fam(1, 2, 0) });
    expect(q.stages[0].lines.find((l) => l.id === "bank-fee")?.total).toBe(74 * 4);
    expect(q.stages[1].lines.some((l) => l.id === "bank-fee")).toBe(false);
  });

  it("minimum income follows the sheet table", () => {
    expect(esMinIncome(fam(0, 0, 0))).toEqual({ monthly: 3001, yearly: 36008 });
    expect(esMinIncome(fam(1, 0, 0))).toEqual({ monthly: 4126, yearly: 49511 });
    expect(esMinIncome(fam(1, 1, 0))).toEqual({ monthly: 4501, yearly: 54012 });
    expect(esMinIncome(fam(1, 2, 1))).toEqual({ monthly: 4501 + 2 * 375, yearly: 54012 + 2 * 4501 });
  });
});
