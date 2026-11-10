import { describe, expect, it } from "vitest";
import { computeLatviaQuote, DEFAULT_LATVIA_INPUT, type LatviaPlan } from "./latvia";

/** Literal port of the workbook's E17, E35, E42, E47, E52 and E54. B9 = 1 (main applicant). */
function excel(plan: LatviaPlan, b10: number, b11: number, c45 = 5000, c46 = 5000) {
  const b9 = 1;
  const b8 = b9 + b10 + b11;
  const a = plan * b9;
  const b =
    10000 * b9 + 170 * b9 + 30 * (b10 + b11) + 160 * b8 + 252 * b8 +
    375 * b9 + 375 * b10 + 250 * b11 + 80 * b8 +
    155 * b9 + 155 * b10 + 80 * b11 +
    1520 * b9 + 320 * b10 + 320 * b11;
  const c = (1000 + 600 + 100 + 175) * b9;
  const d = (c45 + c46) * b9;
  const e = plan === 50000 ? (4000 + 4000) * b9 : 0;
  return { a, b, c, d, e, total: a + b + c + d + e };
}

describe("Latvia calculator", () => {
  it("matches the workbook's saved result (€100,000, main applicant only)", () => {
    const q = computeLatviaQuote(DEFAULT_LATVIA_INPUT);
    expect(q.stages.map((s) => s.subtotal)).toEqual([100000, 12712, 1875, 10000]);
    expect(q.total).toBe(124587);
    expect(q.currency).toBe("EUR");
  });

  it("adds the legal fee only on the €50,000 plan", () => {
    const q = computeLatviaQuote({ ...DEFAULT_LATVIA_INPUT, plan: 50000 });
    expect(q.stages.find((s) => s.id === "legal")?.subtotal).toBe(8000);
    expect(q.total).toBe(50000 + 12712 + 1875 + 10000 + 8000);
    expect(computeLatviaQuote(DEFAULT_LATVIA_INPUT).stages.some((s) => s.id === "legal")).toBe(false);
  });

  it.each<LatviaPlan>([50000, 100000])("matches the workbook for every family (plan %s)", (plan) => {
    for (const spouse of [0, 1] as const)
      for (let children = 0; children <= 10; children++) {
        const q = computeLatviaQuote({ ...DEFAULT_LATVIA_INPUT, plan, spouse, children });
        const x = excel(plan, spouse, children);
        const by = (id: string) => q.stages.find((s) => s.id === id)?.subtotal ?? 0;
        expect([by("investment"), by("cost"), by("misc"), by("teg"), by("legal"), q.total]).toEqual([x.a, x.b, x.c, x.d, x.e, x.total]);
      }
  });

  it("lets the legal fee be overridden on either plan", () => {
    const q50 = computeLatviaQuote({ ...DEFAULT_LATVIA_INPUT, plan: 50000, legalOnSigning: 2500, legalOnApproval: 0 });
    expect(q50.stages.find((s) => s.id === "legal")?.subtotal).toBe(2500);
    const q100 = computeLatviaQuote({ ...DEFAULT_LATVIA_INPUT, legalOnSigning: 3000, legalOnApproval: 3000 });
    expect(q100.stages.find((s) => s.id === "legal")?.subtotal).toBe(6000);
    expect(q100.total).toBe(124587 + 6000);
  });

  it("lets the TEG professional fee be edited", () => {
    const q = computeLatviaQuote({ ...DEFAULT_LATVIA_INPUT, retainerOnSigning: 7500, retainerOnApproval: 2500 });
    expect(q.stages.find((s) => s.id === "teg")?.subtotal).toBe(10000);
    expect(computeLatviaQuote({ ...DEFAULT_LATVIA_INPUT, retainerOnSigning: 8000 }).total).toBe(124587 + 3000);
  });

  it("drops the TEG fee group when both retainers are zero", () => {
    const q = computeLatviaQuote({ ...DEFAULT_LATVIA_INPUT, retainerOnSigning: 0, retainerOnApproval: 0 });
    expect(q.stages.some((s) => s.id === "teg")).toBe(false);
    expect(q.total).toBe(excel(100000, 0, 0, 0, 0).total);
  });
});
