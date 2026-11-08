import { describe, expect, it } from "vitest";
import {
  additionalDependantCharge,
  computeSknQuote,
  DEFAULT_SKN_INPUT,
  EMPTY_FAMILY,
  type Family,
  type SknProgram,
} from "./skn";

/** Literal port of 'Dropdown and charges'!B18 (SISC contribution). B9..B15 = family rows. */
function excelSiscContribution(b: number[]): number {
  const [b9, b10, b11, b12, b13, b14, b15] = b;
  const all = b9 + b10 + b11 + b12 + b13 + b14 + b15;
  const u = b9 + b10 + b11 + b12 + b13;
  if (all < 5) return 250000;
  if (u > 3) return 250000 + (u - 4) * 25000 + (b14 + b15) * 50000;
  if (u === 3) return 250000 + (b14 + b15 - 1) * 50000;
  if (u === 2) return 250000 + (b14 + b15 - 2) * 50000;
  return 250000 + (all - 4) * 50000;
}

/** Literal port of the workbook's E55 total (TOTAL COST A + B), retainers at 0. */
function excelTotal(program: SknProgram, b: number[]): number {
  const n = b.reduce((s, x) => s + x, 0);
  const dd = [10000, 7500, 0, 0, 7500, 7500, 7500];
  const bank = [585, 350, 150, 200, 200, 300, 300];
  const ddSum = b.reduce((s, x, i) => s + x * dd[i], 0);
  const bankSum = b.reduce((s, x, i) => s + x * bank[i], 0);
  const first = 250 * n + ddSum + bankSum;
  const contribution = program === "SISC" ? excelSiscContribution(b) : 250000;
  const pboExtra = program === "PBO" ? excelSiscContribution(b) - 250000 : 0;
  const final = contribution + pboExtra + 356 * n + 200 + bankSum;
  return first + final;
}

function toFamily(b: number[]): Family {
  const [main, spouse, child0_10, child11_15, child16_17, child18_30, parent55] = b;
  return { main, spouse, child0_10, child11_15, child16_17, child18_30, parent55 };
}

function* families(maxTotal: number): Generator<number[]> {
  for (let spouse = 0; spouse <= 1; spouse++)
    for (let a = 0; a <= 4; a++)
      for (let c = 0; c <= 4; c++)
        for (let d = 0; d <= 4; d++)
          for (let e = 0; e <= 4; e++)
            for (let p = 0; p <= 2; p++) {
              const b = [1, spouse, a, c, d, e, p];
              if (b.reduce((s, x) => s + x, 0) <= maxTotal) yield b;
            }
}

describe("St. Kitts & Nevis calculator", () => {
  it("matches the workbook's saved result for a single applicant (SISC)", () => {
    const q = computeSknQuote(DEFAULT_SKN_INPUT);
    expect(q.stages[0].subtotal).toBe(10835);
    expect(q.stages[1].subtotal).toBe(251141);
    expect(q.total).toBe(261976);
  });

  it("additional dependant charge matches the workbook formula for every family up to 10", () => {
    let checked = 0;
    for (const b of families(10)) {
      expect(250000 + additionalDependantCharge(toFamily(b))).toBe(excelSiscContribution(b));
      checked++;
    }
    expect(checked).toBeGreaterThan(1000);
  });

  it.each<SknProgram>(["SISC", "PBO"])("total matches the workbook for every family up to 10 (%s)", (program) => {
    for (const b of families(10)) {
      const q = computeSknQuote({ ...DEFAULT_SKN_INPUT, program, family: toFamily(b) });
      expect(q.total, JSON.stringify(b)).toBe(excelTotal(program, b));
    }
  });

  it("SISC and PBO cost the same overall; only where the dependant charge sits differs", () => {
    const family = { ...EMPTY_FAMILY, spouse: 1, child18_30: 2, parent55: 2 };
    const sisc = computeSknQuote({ ...DEFAULT_SKN_INPUT, program: "SISC", family });
    const pbo = computeSknQuote({ ...DEFAULT_SKN_INPUT, program: "PBO", family });
    expect(sisc.total).toBe(pbo.total);
    expect(pbo.stages[1].lines.find((l) => l.id === "pbo-extra")?.total).toBe(100000);
  });

  it("adds benefactor fees and TEG retainers to the right payment stage", () => {
    const base = computeSknQuote(DEFAULT_SKN_INPUT);
    const q = computeSknQuote({
      ...DEFAULT_SKN_INPUT,
      includesBenefactor: true,
      retainerOnSigning: 5000,
      retainerOnApproval: 7000,
    });
    expect(q.stages[0].subtotal - base.stages[0].subtotal).toBe(10000 + 300 + 250 + 5000);
    expect(q.stages[1].subtotal - base.stages[1].subtotal).toBe(7000);
  });
});
