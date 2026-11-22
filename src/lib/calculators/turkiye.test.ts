import { describe, expect, it } from "vitest";
import { computeTrQuote, DEFAULT_TR_INPUT, type TrFamily, type TrRoute } from "./turkiye";

/** Straight reading of the sheet: column D (Real Estate) and column G (Bank Deposit). */
function sheet(route: TrRoute, spouse: number, child: number, price = 400000, lawyer?: number) {
  const n = 1 + spouse + child;
  const adults = 1 + spouse;
  const investment =
    route === "RE" ? price + 0.04 * price + 1000 + 1000 + (lawyer ?? 5000) + 0.01 * price : 500000 + 1000 + (lawyer ?? 10000);
  const submission = 20 * adults + (200 + 50 + 350) * n + 200;
  return [5000, investment, submission, 5000];
}

const fam = (spouse: number, child: number): TrFamily => ({ main: 1, spouse, child });

describe("Türkiye calculator", () => {
  it("real estate, main applicant only", () => {
    const q = computeTrQuote(DEFAULT_TR_INPUT);
    expect(q.stages.map((s) => s.subtotal)).toEqual([5000, 400000 + 16000 + 1000 + 1000 + 5000 + 4000, 820, 5000]);
    expect(q.currency).toBe("USD");
  });

  it("bank deposit, main applicant only", () => {
    const q = computeTrQuote({ ...DEFAULT_TR_INPUT, route: "BD" });
    expect(q.stages.map((s) => s.subtotal)).toEqual([5000, 511000, 820, 5000]);
    expect(q.stages[1].lines.map((l) => l.id)).toEqual(["deposit", "notary", "lawyer"]);
  });

  it.each<TrRoute>(["RE", "BD"])("matches the sheet for every family (%s)", (route) => {
    for (const spouse of [0, 1])
      for (let child = 0; child <= 10; child++) {
        const q = computeTrQuote({ ...DEFAULT_TR_INPUT, route, family: fam(spouse, child) });
        const x = sheet(route, spouse, child);
        expect(q.stages.map((s) => s.subtotal)).toEqual(x);
        expect(q.total).toBe(x.reduce((a, b) => a + b, 0));
      }
  });

  it("title deed and VAT follow the final property value, never below US$400,000", () => {
    const q = computeTrQuote({ ...DEFAULT_TR_INPUT, propertyPrice: 650000 });
    expect(q.stages[1].subtotal).toBe(sheet("RE", 0, 0, 650000)[1]);
    expect(computeTrQuote({ ...DEFAULT_TR_INPUT, propertyPrice: 300000 }).total).toBe(computeTrQuote(DEFAULT_TR_INPUT).total);
  });

  it("charges tax ID per adult only", () => {
    const q = computeTrQuote({ ...DEFAULT_TR_INPUT, family: fam(1, 3) });
    expect(q.stages[2].lines.find((l) => l.id === "tax-id")?.qty).toBe(2);
  });

  it("lawyer and TEG fees are editable", () => {
    const q = computeTrQuote({ ...DEFAULT_TR_INPUT, lawyerFee: 8000, retainerOnSigning: 0, retainerAfterApproval: 7500 });
    expect(q.stages.map((s) => s.id)).toEqual(["investment", "submission", "approval"]);
    expect(q.stages[0].subtotal).toBe(sheet("RE", 0, 0, 400000, 8000)[1]);
    expect(q.stages[2].subtotal).toBe(7500);
  });
});
