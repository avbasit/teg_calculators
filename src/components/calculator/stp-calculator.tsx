"use client";

import { useMemo, useState } from "react";
import {
  computeStpQuote,
  DEFAULT_STP_INPUT,
  STP_MEMBERS,
  STP_NOTES,
  STP_RATES,
  stpFamilySize,
  type StpInput,
} from "@/lib/calculators/stp";
import { usd } from "@/lib/format";
import { StpFlag } from "@/components/flags";
import { Stepper } from "./controls";
import { CalculatorPage, InfoBox, PersonCount, StepCard } from "./shell";

export function StpCalculator() {
  const [input, setInput] = useState<StpInput>(DEFAULT_STP_INPUT);
  const quote = useMemo(() => computeStpQuote(input), [input]);
  const size = stpFamilySize(input.family);
  const set = <K extends keyof StpInput>(k: K, v: StpInput[K]) => setInput((s) => ({ ...s, [k]: v }));
  const D = STP_RATES.donation;

  const family = STP_MEMBERS.filter((m) => input.family[m.key] > 0).map((m) => ({
    label: m.label,
    count: input.family[m.key],
  }));

  return (
    <CalculatorPage
      code="STP"
      title="São Tomé and Príncipe"
      subtitle="Citizenship by Investment · Payment schedule calculator"
      flag={<StpFlag className="h-14 w-[84px]" />}
      quote={quote}
      totalLabel="Total cost"
      caption={`Donation · ${size} ${size === 1 ? "person" : "persons"}`}
      footnote="Figures follow the TEG São Tomé and Príncipe calculation sheet. Amounts in USD, exclusive of VAT."
      notes={STP_NOTES}
      documentTitle="Payment Schedule — São Tomé and Príncipe"
      planLabel="Donation"
      family={family}
      onReset={() => setInput(DEFAULT_STP_INPUT)}
      tegFee={[
        { id: "retainer-signing", label: "TEG retainer", hint: "Upon signing", value: input.retainerOnSigning, onChange: (v) => set("retainerOnSigning", v) },
        { id: "retainer-approval", label: "TEG retainer", hint: "Upon approval", value: input.retainerOnApproval, onChange: (v) => set("retainerOnApproval", v) },
      ]}
    >
      <StepCard step={2} title="Investment plan">
        <div className="flex items-center justify-between gap-4 rounded-2xl bg-white px-4 py-3 shadow-card ring-1 ring-royal/25">
          <div>
            <p className="text-base font-bold text-royal">Donation</p>
            <p className="text-xs text-muted">Non-refundable contribution to the government</p>
          </div>
          <span className="rounded-full bg-royal-soft px-3 py-1 text-xs font-semibold text-royal">Only route</span>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          {usd(D.single)} for a single applicant or {usd(D.family)} for a family of up to {D.familyCovers}, plus{" "}
          {usd(D.extraDependant)} for each dependant from the 5th member onwards.
        </p>
      </StepCard>

      <StepCard step={3} title="Family composition" aside={<PersonCount size={size} />}>
        <ul className="divide-y divide-line/70">
          {STP_MEMBERS.map((m) => (
            <li key={m.key} className="flex items-center justify-between gap-4 py-3 first:pt-0 last:pb-0">
              <div>
                <p className="text-sm font-semibold text-ink">{m.label}</p>
                {m.hint && <p className="text-xs text-muted">{m.hint}</p>}
              </div>
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
        <InfoBox id="stp-family">
          Due diligence is a flat <strong className="text-ink">{usd(STP_RATES.dueDiligence)}</strong> for any family size.
          Citizenship documents cost <strong className="text-ink">{usd(STP_RATES.citizenshipDocuments)}</strong> per member.
        </InfoBox>
      </StepCard>
    </CalculatorPage>
  );
}
