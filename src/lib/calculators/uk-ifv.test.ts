import { describe, expect, it } from "vitest";
import { computeUkQuote, DEFAULT_UK_INPUT, ukEndorsementInfo, type UkFamily, type UkLocation } from "./uk-ifv";

/** Straight reading of the sheet (C7:C29). */
function sheet(location: UkLocation, spouse: number, child: number) {
  const adults = 1 + spouse;
  const n = adults + child;
  const inside = location === "inside";
  return [
    4000,
    1500,
    inside ? 1200 : 1000,
    1500,
    3000 + 3105 * adults + 2604 * child + (inside ? 1693 : 1357) * n,
  ];
}

const fam = (spouse: number, child: number): UkFamily => ({ main: 1, spouse, child });

describe("UK Innovator Founder Visa calculator", () => {
  it("single applicant from outside the UK", () => {
    const q = computeUkQuote(DEFAULT_UK_INPUT);
    expect(q.stages.map((s) => s.subtotal)).toEqual([4000, 1500, 1000, 1500, 3000 + 3105 + 1357]);
    expect(q.total).toBe(15462);
    expect(q.currency).toBe("GBP");
  });

  it.each<UkLocation>(["outside", "inside"])("matches the sheet for every family (%s UK)", (location) => {
    for (const spouse of [0, 1])
      for (let child = 0; child <= 10; child++) {
        const q = computeUkQuote({ ...DEFAULT_UK_INPUT, location, family: fam(spouse, child) });
        const x = sheet(location, spouse, child);
        expect(q.stages.map((s) => s.subtotal)).toEqual(x);
        expect(q.total).toBe(x.reduce((a, b) => a + b, 0));
      }
  });

  it("keeps the TEG fee and endorsement costs fixed whatever the family size", () => {
    const tegAndEndorsement = (f: UkFamily) =>
      computeUkQuote({ ...DEFAULT_UK_INPUT, family: f })
        .stages.flatMap((s) => s.lines)
        .filter((l) => l.id.startsWith("fee-") || l.id.startsWith("endorsement"))
        .reduce((s, l) => s + l.total, 0);
    expect(tegAndEndorsement(fam(1, 4))).toBe(tegAndEndorsement(fam(0, 0)));
    expect(tegAndEndorsement(fam(0, 0))).toBe(10000 + 1000);
  });

  it("shows endorsement reviews and resubmission as information only", () => {
    const ids = computeUkQuote(DEFAULT_UK_INPUT).stages.flatMap((s) => s.lines.map((l) => l.id));
    expect(ids).not.toContain("checkpoint-1");
    expect(ukEndorsementInfo("outside").rows.map((r) => r.value)).toEqual([
      "£600 incl. 20% VAT · after 1 year in the UK",
      "£600 incl. 20% VAT · after 2 years in the UK",
      "£1,200 incl. 20% VAT · after 3 years in the UK",
      "£1,000 (Outside UK) every time",
    ]);
    expect(ukEndorsementInfo("inside").rows[3].value).toBe("£1,200 (Inside UK) every time");
  });

  it("inside vs outside the UK changes the Home Office and endorsement application fees", () => {
    const outside = computeUkQuote({ ...DEFAULT_UK_INPUT, family: fam(1, 1) });
    const inside = computeUkQuote({ ...DEFAULT_UK_INPUT, location: "inside", family: fam(1, 1) });
    expect(inside.total - outside.total).toBe((1693 - 1357) * 3 + (1200 - 1000));
  });

  it("TEG instalments are editable", () => {
    const q = computeUkQuote({ ...DEFAULT_UK_INPUT, feeSigning: 5000, feeBusinessPlan: 0 });
    expect(q.stages.map((s) => s.id)).not.toContain("business-plan");
    expect(q.stages[0].subtotal).toBe(5000);
  });
});
