"use client";

import { useMemo, useState } from "react";
import {
  computePtQuote,
  DEFAULT_PT_INPUT,
  PT_INCLUDED,
  PT_MEMBERS,
  PT_NOTES,
  PT_RATES,
  ptFamilySize,
  ptSettlementFunds,
  type PtInput,
} from "@/lib/calculators/portugal-d2";
import { money } from "@/lib/format";
import { PortugalFlag } from "@/components/flags";
import { Stepper } from "./controls";
import { CalculatorPage, InfoBox, PersonCount, StepCard } from "./shell";

const eur = (n: number) => money(n, "EUR");

export const PT_D2_DESCRIPTION = (
  <>
    <strong className="text-ink">
      This cost includes {PT_INCLUDED.slice(0, -1).join(", ")} and {PT_INCLUDED[PT_INCLUDED.length - 1]}.
    </strong>{" "}
    TEG fee of {eur(PT_RATES.fee.main)} for the main applicant, {eur(PT_RATES.fee.spouse)} for a spouse and{" "}
    {eur(PT_RATES.fee.perChild)} per child — 50% upon signing, {eur(PT_RATES.tenancyContract)} before the embassy
    appointment for the tenancy contract (irrespective of family size) and the remainder after the visa is issued. No
    other professional fee applies.
  </>
);

/** Portugal D2 Visa. `programme` is the country page's programme card (step 2). */
export function PortugalD2Calculator({ programme }: { programme: React.ReactNode }) {
  const [input, setInput] = useState<PtInput>(DEFAULT_PT_INPUT);
  const quote = useMemo(() => computePtQuote(input), [input]);
  const size = ptFamilySize(input.family);
  const funds = ptSettlementFunds(input.family);
  const set = <K extends keyof PtInput>(k: K, v: PtInput[K]) => setInput((s) => ({ ...s, [k]: v }));
  const S = PT_RATES.settlementFunds;

  const family = PT_MEMBERS.filter((m) => input.family[m.key] > 0).map((m) => ({
    label: m.label,
    count: input.family[m.key],
  }));

  return (
    <CalculatorPage
      code="PT"
      title="Portugal"
      subtitle="D2 Visa · Payment schedule calculator"
      flag={<PortugalFlag className="h-14 w-[84px]" />}
      quote={quote}
      totalLabel="Total cost"
      caption={`D2 Visa · ${size} ${size === 1 ? "person" : "persons"}`}
      footnote="Figures follow the TEG Portugal D2 costing sheet. Amounts in EUR, exclusive of VAT."
      notes={PT_NOTES}
      documentTitle="Payment Schedule — Portugal D2 Visa"
      planLabel="D2 Visa"
      family={family}
      onReset={() => setInput(DEFAULT_PT_INPUT)}
      tegFee={[
        { id: "fee-main", label: "Main applicant", hint: "Full fee", value: input.feeMain, onChange: (v) => set("feeMain", v) },
        { id: "fee-spouse", label: "Spouse", hint: "Full fee", value: input.feeSpouse, onChange: (v) => set("feeSpouse", v) },
        { id: "fee-child", label: "Each child", hint: "Full fee", value: input.feeChild, onChange: (v) => set("feeChild", v) },
      ]}
    >
      {programme}

      <StepCard step={3} title="Family composition" aside={<PersonCount size={size} />}>
        <ul className="divide-y divide-line/70">
          {PT_MEMBERS.map((m) => (
            <li key={m.key} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
              <p className="text-sm font-semibold text-ink">{m.label}</p>
              <Stepper
                label={m.label}
                value={input.family[m.key]}
                max={m.max}
                min={m.key === "main" ? 1 : 0}
                locked={m.key === "main"}
                onChange={(v) => set("family", { ...input.family, [m.key]: v })}
              />
            </li>
          ))}
        </ul>
        <InfoBox id={`pt-funds-${funds}`}>
          Minimum settlement funds for this family: <strong className="text-ink">{eur(funds)} per year</strong> (
          {eur(S.main)} main applicant, {eur(S.spouse)} spouse, {eur(S.perChild)} per child). This is proof of means, not a
          cost, and is not included in the total.
        </InfoBox>
        <InfoBox id="pt-direct">
          Embassy fee (~{eur(PT_RATES.embassyFee)} per person) and travel insurance (~{eur(PT_RATES.travelInsurance)} per
          person) are approximate and are <strong className="text-ink">paid directly by the client</strong> to the embassy
          and the insurance company. TEG will not receive this amount in any form.
        </InfoBox>
      </StepCard>
    </CalculatorPage>
  );
}
