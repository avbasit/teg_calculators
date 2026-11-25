"use client";

import { useMemo, useState } from "react";
import {
  computePtQuote,
  DEFAULT_PT_INPUT,
  PT_MEMBERS,
  PT_NOTES,
  PT_RATES,
  PT_VISAS,
  ptFamilySize,
  ptFeeDefaults,
  type PtInput,
  type PtVisa,
} from "@/lib/calculators/portugal";
import { money } from "@/lib/format";
import { PortugalFlag } from "@/components/flags";
import { Segmented, Stepper, Switch } from "./controls";
import { CalculatorPage, InfoBox, PersonCount, PlanDescription, StepCard } from "./shell";

const eur = (n: number) => money(n, "EUR");

export function PortugalCalculator() {
  const [input, setInput] = useState<PtInput>(DEFAULT_PT_INPUT);
  const quote = useMemo(() => computePtQuote(input), [input]);
  const size = ptFamilySize(input.family);
  const visa = PT_VISAS[input.visa];
  const set = <K extends keyof PtInput>(k: K, v: PtInput[K]) => setInput((s) => ({ ...s, [k]: v }));

  const family = PT_MEMBERS.filter((m) => input.family[m.key] > 0).map((m) => ({
    label: m.label,
    count: input.family[m.key],
  }));

  return (
    <CalculatorPage
      code="PT"
      title="Portugal"
      subtitle={`${visa.short} · Payment schedule calculator`}
      flag={<PortugalFlag className="h-14 w-[84px]" />}
      quote={quote}
      totalLabel="Total cost"
      caption={`${visa.short} · ${size} ${size === 1 ? "person" : "persons"}`}
      footnote="Figures follow the TEG Portugal (D2, D7, D8) calculations, Nov 2026. Amounts in EUR, exclusive of VAT."
      notes={PT_NOTES}
      documentTitle={`Payment Schedule — Portugal ${visa.short}`}
      planLabel={`${visa.short} — ${visa.name}`}
      family={family}
      onReset={() => setInput(DEFAULT_PT_INPUT)}
      tegFee={[
        { id: "retainer-signing", label: "Professional fee", hint: "Upon signing", value: input.retainerOnSigning, onChange: (v) => set("retainerOnSigning", v) },
        { id: "retainer-approval", label: "Professional fee", hint: "After visa approval", value: input.retainerAfterApproval, onChange: (v) => set("retainerAfterApproval", v) },
      ]}
      otherFees={[
        {
          title: "Lawyer fee",
          fields: [
            { id: "lawyer", label: "Lawyer fee", hint: "Upon signing", value: input.lawyerFee, onChange: (v) => set("lawyerFee", v) },
            { id: "lawyer-success", label: "Lawyer success fee", hint: "After visa approval", value: input.lawyerSuccessFee, onChange: (v) => set("lawyerSuccessFee", v) },
          ],
        },
        {
          title: "Additional fee per dependant",
          fields: [
            { id: "dependant-spouse", label: "Spouse", hint: "Full fee · paid 50 / 50", value: input.spouseFee, onChange: (v) => set("spouseFee", v) },
            { id: "dependant-child", label: "Each child", hint: "Full fee · paid 50 / 50", value: input.childFee, onChange: (v) => set("childFee", v) },
          ],
        },
      ]}
    >
      <StepCard step={2} title="Visa type">
        <Segmented<PtVisa>
          id="pt-visa"
          value={input.visa}
          // A new visa brings back that visa's default fees.
          onChange={(v) => setInput((s) => ({ ...s, visa: v, ...ptFeeDefaults(v) }))}
          options={(Object.keys(PT_VISAS) as PtVisa[]).map((k) => ({ value: k, label: PT_VISAS[k].short, sub: PT_VISAS[k].name }))}
        />
        <PlanDescription id={input.visa}>{visa.description}</PlanDescription>
      </StepCard>

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
        <InfoBox id={`pt-family-${input.visa}`}>
          Additional fee of <strong className="text-ink">{eur(visa.dependants.spouse)}</strong> for a spouse and{" "}
          <strong className="text-ink">{eur(visa.dependants.perChild)}</strong> per child, paid 50% on signing and 50% after
          visa approval. A <strong className="text-ink">{eur(PT_RATES.tenancyContract)}</strong> tenancy contract applies to a
          family of 2 or more.
        </InfoBox>
        <InfoBox id="pt-direct">
          Embassy fee ({eur(PT_RATES.embassyFee)} per person) and travel insurance (~{eur(PT_RATES.travelInsurance)} per
          person) are <strong className="text-ink">paid directly by the client</strong> to the embassy and the insurance
          company. TEG will not receive this amount in any form.
        </InfoBox>
      </StepCard>

      <StepCard step={4} title="Optional">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-ink">Appeal (if needed)</p>
            <p className="text-xs text-muted">Adds {eur(PT_RATES.appeal)}.</p>
          </div>
          <Switch label="Include appeal" checked={input.appeal} onChange={(v) => set("appeal", v)} />
        </div>
      </StepCard>
    </CalculatorPage>
  );
}
