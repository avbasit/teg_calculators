"use client";

import { useMemo, useState } from "react";
import {
  computeSknQuote,
  DEFAULT_SKN_INPUT,
  familySize,
  SKN_MEMBERS,
  sknNotes,
  SKN_PROGRAMS,
  type SknInput,
  type SknProgram,
} from "@/lib/calculators/skn";
import { SknFlag } from "@/components/flags";
import { MoneyInput, Segmented, Stepper, Switch } from "./controls";
import { CalculatorPage, InfoBox, PersonCount, PlanDescription, StepCard } from "./shell";

export function SknCalculator() {
  const [input, setInput] = useState<SknInput>(DEFAULT_SKN_INPUT);
  const quote = useMemo(() => computeSknQuote(input), [input]);
  const size = familySize(input.family);
  const program = SKN_PROGRAMS[input.program];
  const set = <K extends keyof SknInput>(k: K, v: SknInput[K]) => setInput((s) => ({ ...s, [k]: v }));

  const family = SKN_MEMBERS.filter((m) => input.family[m.key] > 0).map((m) => ({
    label: m.label,
    count: input.family[m.key],
  }));

  return (
    <CalculatorPage
      code="SKN"
      title="St. Kitts & Nevis"
      subtitle="Citizenship by Investment · Payment schedule calculator"
      flag={<SknFlag className="h-14 w-[84px]" />}
      quote={quote}
      totalLabel="Total cost"
      caption={`${program.short} · ${size} ${size === 1 ? "person" : "persons"}`}
      footnote={`Figures follow the TEG SKN ${program.workbook}. Amounts in USD, exclusive of VAT.`}
      notes={sknNotes(input.program)}
      documentTitle="Payment Schedule — St. Kitts & Nevis (SKN)"
      planLabel={program.label}
      family={family}
      onReset={() => setInput(DEFAULT_SKN_INPUT)}
    >
      <StepCard step={2} title="Investment plan">
        <Segmented<SknProgram>
          id="skn-program"
          value={input.program}
          onChange={(v) => set("program", v)}
          options={(Object.keys(SKN_PROGRAMS) as SknProgram[]).map((k) => ({
            value: k,
            label: SKN_PROGRAMS[k].short,
            sub: SKN_PROGRAMS[k].name,
          }))}
        />
        <PlanDescription id={input.program}>{program.description}</PlanDescription>
      </StepCard>

      <StepCard step={3} title="Family composition" aside={<PersonCount size={size} />}>
        <ul className="divide-y divide-line/70">
          {SKN_MEMBERS.map((m) => (
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
        <InfoBox id={input.program === "RE" ? "re" : "contribution"}>
          {input.program === "RE" ? (
            <>
              Government processing fee at approval, per person: main applicant{" "}
              <strong className="text-ink">US$25,000</strong>, spouse <strong className="text-ink">US$15,000</strong>, children
              under 18 <strong className="text-ink">US$10,000</strong>, dependants 18+{" "}
              <strong className="text-ink">US$15,000</strong>.
            </>
          ) : (
            <>
              The base contribution of <strong className="text-ink">US$250,000</strong> covers up to 4 persons. Each additional
              dependant under 18 adds <strong className="text-ink">US$25,000</strong>; each additional dependant 18+ adds{" "}
              <strong className="text-ink">US$50,000</strong>.
            </>
          )}
        </InfoBox>
      </StepCard>

      <StepCard step={4} title="Fees & options">
        <div className="grid gap-5 sm:grid-cols-3">
          <MoneyInput label="Authorized agent fee" hint="At submission" value={input.authorizedAgentFee} onChange={(v) => set("authorizedAgentFee", v)} />
          <MoneyInput label="TEG retainer" hint="Upon signing" value={input.retainerOnSigning} onChange={(v) => set("retainerOnSigning", v)} />
          <MoneyInput label="TEG retainer" hint="Upon approval" value={input.retainerOnApproval} onChange={(v) => set("retainerOnApproval", v)} />
        </div>
        <div className="mt-6 flex items-center justify-between gap-4 rounded-xl bg-canvas px-4 py-3.5">
          <div>
            <p className="text-sm font-semibold text-ink">Application includes a benefactor</p>
            <p className="text-xs text-muted">Adds US$10,000 CIU due diligence, US$300 bank due diligence and US$250 processing.</p>
          </div>
          <Switch label="Includes benefactor" checked={input.includesBenefactor} onChange={(v) => set("includesBenefactor", v)} />
        </div>
      </StepCard>
    </CalculatorPage>
  );
}
