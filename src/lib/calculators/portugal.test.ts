import { describe, expect, it } from "vitest";
import { computePtQuote, DEFAULT_PT_INPUT, ptFeeDefaults, type PtFamily, type PtInput, type PtVisa } from "./portugal";

/** Straight reading of each sheet ("D2 Visa", "D7 Visa", "D8 Visa"). */
const SHEET = {
  D2: { signing: 1500 + 1500 + 220 + 330 + 50 + 200 + 1000, after: 1500 + 100 + 100 + 1500, spouse: 1800, child: 800 },
  D7: { signing: 1500 + 800 + 1000, after: 1000 + 100 + 100 + 1000, spouse: 1600, child: 800 },
  D8: { signing: 1200 + 800 + 1000, after: 1000 + 100 + 100 + 1000, spouse: 1400, child: 600 },
} as const;

function sheet(visa: PtVisa, spouse: number, child: number) {
  const x = SHEET[visa];
  const n = 1 + spouse + child;
  const deps = (x.spouse * spouse + x.child * child) / 2;
  return [x.signing + deps, (n >= 2 ? 1000 : 0) + (155 + 75) * n, x.after + deps];
}

const fam = (spouse: number, child: number): PtFamily => ({ main: 1, spouse, child });
const input = (visa: PtVisa, rest: Partial<PtInput> = {}): PtInput => ({ ...DEFAULT_PT_INPUT, visa, ...ptFeeDefaults(visa), ...rest });

describe("Portugal calculator (D2 / D7 / D8)", () => {
  it("D2 main applicant only", () => {
    const q = computePtQuote(DEFAULT_PT_INPUT);
    expect(q.stages.map((s) => s.subtotal)).toEqual([4800, 230, 3200]);
    expect(q.total).toBe(8230);
    expect(q.currency).toBe("EUR");
  });

  it.each<PtVisa>(["D2", "D7", "D8"])("matches the %s sheet for every family", (visa) => {
    for (const spouse of [0, 1])
      for (let child = 0; child <= 10; child++) {
        const q = computePtQuote(input(visa, { family: fam(spouse, child) }));
        const x = sheet(visa, spouse, child);
        expect(q.stages.map((s) => s.subtotal)).toEqual(x);
        expect(q.total).toBe(x.reduce((a, b) => a + b, 0));
      }
  });

  it("charges the tenancy contract only for a family of 2 or more", () => {
    const ids = (f: PtFamily) => computePtQuote({ ...DEFAULT_PT_INPUT, family: f }).stages.flatMap((s) => s.lines.map((l) => l.id));
    expect(ids(fam(0, 0))).not.toContain("tenancy-contract");
    expect(ids(fam(1, 0))).toContain("tenancy-contract");
    expect(ids(fam(0, 1))).toContain("tenancy-contract");
  });

  it("adds the optional appeal only when selected", () => {
    expect(computePtQuote(DEFAULT_PT_INPUT).stages.some((s) => s.id === "optional")).toBe(false);
    const q = computePtQuote({ ...DEFAULT_PT_INPUT, appeal: true });
    expect(q.stages.find((s) => s.id === "optional")?.subtotal).toBe(1000);
    expect(q.total).toBe(8230 + 1000);
  });

  it("D7 and D8 have no company items", () => {
    const ids = computePtQuote(input("D7")).stages[0].lines.map((l) => l.id);
    expect(ids).toEqual(["lawyer", "nif-bank", "retainer-signing"]);
  });

  it("professional, lawyer and dependant fees are editable", () => {
    const q = computePtQuote({
      ...DEFAULT_PT_INPUT,
      family: fam(1, 1),
      retainerOnSigning: 0,
      lawyerSuccessFee: 2000,
      spouseFee: 1000,
      childFee: 0,
    });
    expect(q.stages[0].subtotal).toBe(4800 - 1000 + 500);
    expect(q.stages[2].subtotal).toBe(2000 + 100 + 100 + 1500 + 500);
  });
});
