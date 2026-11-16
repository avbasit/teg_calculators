import { describe, expect, it } from "vitest";
import { computeAbQuote, DEFAULT_AB_INPUT, type AbFamily, type AbProgram } from "./antigua";

/** Literal port of the workbook formulas ('Dropdown and charges' B6/B8/B22/B26/B28, C35:C40; sheet 1 E20:E46). */
function workbook(program: AbProgram, f: AbFamily) {
  const n = f.main + f.spouse + f.child0_11 + f.child12_17 + f.child18 + f.parent55;
  const deps = n - 1;
  const ndf = program === "NDF";

  // B6 / B8
  const proc10 = ndf
    ? n < 6
      ? n === 1
        ? 0.1 * 10000
        : n < 5
          ? 0.1 * 20000
          : 0.1 * 20000 + (n - 4) * 0.1 * 10000
      : 2000 + (n - 6) * 0.1 * 10000
    : deps === 0
      ? 10000 * 0.1
      : deps < 4
        ? 20000 * 0.1
        : 20000 * 0.1 + (deps - 3) * 10000 * 0.1;
  // B26 / B28
  const proc90 = ndf
    ? n < 6
      ? n === 1
        ? 0.9 * 10000
        : n < 5
          ? 0.9 * 20000
          : 0.9 * 20000 + (n - 4) * 0.9 * 10000
      : (n - 6) * 0.9 * 10000
    : deps === 0
      ? 10000 * 0.9
      : deps < 4
        ? 20000 * 0.9
        : 20000 * 0.9 + (deps - 3) * 10000 * 0.9;

  const dd = 8500 * f.main + 5000 * f.spouse + 0 * f.child0_11 + 2000 * f.child12_17 + 4000 * f.child18 + 4000 * f.parent55;
  const first = proc10 + dd + 140 + 0 + 200 + 0; // E20:E30

  const contribution = ndf ? (n < 6 ? 230000 : 258000) : 400000; // B22 / B24
  const bankApproval = ndf
    ? 140 * f.main
    : 640 * f.main + 500 * f.spouse + 0 * f.child0_11 + 500 * f.child12_17 + 500 * f.child18 + 500 * f.parent55;
  const final = contribution + proc90 + 300 * n + bankApproval + 0; // E34:E43

  // Excel shows whole dollars; strip float noise from the 0.1 × / 0.9 × products.
  return { first: Math.round(first), final: Math.round(final), total: Math.round(first + final) };
}

const fam = (p: Partial<AbFamily> = {}): AbFamily => ({ main: 1, spouse: 0, child0_11: 0, child12_17: 0, child18: 0, parent55: 0, ...p });
const quote = (program: AbProgram, f: AbFamily) => computeAbQuote({ ...DEFAULT_AB_INPUT, program, family: f });

function* families() {
  for (const spouse of [0, 1])
    for (let a = 0; a <= 4; a++)
      for (let b = 0; b <= 4; b++)
        for (let c = 0; c <= 3; c++)
          for (let parent = 0; parent <= 2; parent++) yield fam({ spouse, child0_11: a, child12_17: b, child18: c, parent55: parent });
}

describe("Antigua & Barbuda calculator", () => {
  it("matches the workbook's saved result for a single applicant (contribution)", () => {
    const q = computeAbQuote(DEFAULT_AB_INPUT);
    expect(q.stages.map((s) => s.subtotal)).toEqual([9840, 239440]);
    expect(q.total).toBe(249280);
  });

  it("matches the workbook for every family composition — Investment in Business", () => {
    for (const f of families()) {
      const x = workbook("BUSINESS", f);
      expect(quote("BUSINESS", f).stages.map((s) => s.subtotal)).toEqual([x.first, x.final]);
    }
  });

  it("matches the workbook for families of up to 5 — Contribution", () => {
    for (const f of families()) {
      const q = quote("NDF", f);
      if (q.familySize > 5) continue;
      const x = workbook("NDF", f);
      expect(q.stages.map((s) => s.subtotal)).toEqual([x.first, x.final]);
    }
  });

  it("contribution rises to US$258,000 from 6 persons, with processing fee continuing the +US$10,000 per person scale", () => {
    const six = quote("NDF", fam({ spouse: 1, child0_11: 4 }));
    expect(six.stages[1].lines.find((l) => l.id === "contribution")?.unit).toBe(258000);
    const p1 = six.stages[0].lines.find((l) => l.id === "gov-processing-1")!.total;
    const p2 = six.stages[1].lines.find((l) => l.id === "gov-processing-2")!.total;
    expect([p1, p2]).toEqual([4000, 36000]);
  });

  it("charges bank due diligence at approval per member only for business investment", () => {
    const f = fam({ spouse: 1, child12_17: 1 });
    const ndf = quote("NDF", f).stages[1].lines.filter((l) => l.id.startsWith("bank-dd-2"));
    const biz = quote("BUSINESS", f).stages[1].lines.filter((l) => l.id.startsWith("bank-dd-2"));
    expect(ndf.map((l) => l.total)).toEqual([140]);
    expect(biz.map((l) => l.total)).toEqual([640, 500, 500]);
  });

  it("adds benefactor fees and editable manual fees", () => {
    const q = computeAbQuote({
      ...DEFAULT_AB_INPUT,
      includesBenefactor: true,
      authorizedAgentFee: 1500,
      retainerOnSigning: 10000,
      retainerOnApproval: 5000,
    });
    expect(q.stages[0].subtotal).toBe(9840 + 5000 + 500 + 1500 + 10000);
    expect(q.stages[1].subtotal).toBe(239440 + 5000);
  });
});
