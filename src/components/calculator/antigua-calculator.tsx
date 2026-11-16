"use client";

import { useMemo, useState } from "react";
import {
  AB_MEMBERS,
  AB_NOTES,
  AB_PROGRAMS,
  AB_RATES,
  abFamilySize,
  computeAbQuote,
  DEFAULT_AB_INPUT,
  type AbInput,
  type AbProgram,
} from "@/lib/calculators/antigua";
import { usd } from "@/lib/format";
import { AntiguaFlag } from "@/components/flags";
import { Segmented, Stepper, Switch } from "./controls";
import { CalculatorPage, InfoBox, PersonCount, PlanDescription, StepCard } from "./shell";

export function AntiguaCalculator() {
  const [input, setInput] = useState<AbInput>(DEFAULT_AB_INPUT);
  const quote = useMemo(() => computeAbQuote(input), [input]);
  const size = abFamilySize(input.family);
  const program = AB_PROGRAMS[input.program];
  const set = <K extends keyof AbInput>(k: K, v: AbInput[K]) => setInput((s) => ({ ...s, [k]: v }));
  const P = AB_RATES.processingFee;
  const B = AB_RATES.benefactor;

  const family = AB_MEMBERS.filter((m) => input.family[m.key] > 0).map((m) => ({
    label: m.label,
    count: input.family[m.key],
  }));

  return (
    <CalculatorPage
      code="ANT"
      title="Antigua & Barbuda"
      subtitle="Citizenship by Investment · Payment schedule calculator"
      flag={<AntiguaFlag className="h-14 w-[84px]" />}
      quote={quote}
      totalLabel="Total cost"
      caption={`${program.short} · ${size} ${size === 1 ? "person" : "persons"}`}
      footnote="Figures follow the TEG Antigua & Barbuda pricing workbook (16 Nov 2026). Amounts in USD, exclusive of VAT."
      notes={AB_NOTES}
      documentTitle="Payment Schedule — Antigua & Barbuda"
      planLabel={program.label}
      family={family}
      onReset={() => setInput(DEFAULT_AB_INPUT)}
      tegFee={[
        { id: "retainer-signing", label: "TEG retainer", hint: "Upon signing", value: input.retainerOnSigning, onChange: (v) => set("retainerOnSigning", v) },
        { id: "retainer-approval", label: "TEG retainer", hint: "Upon approval", value: input.retainerOnApproval, onChange: (v) => set("retainerOnApproval", v) },
      ]}
      otherFees={[
        {
          title: "Authorized agent fee",
          fields: [{ id: "agent-fee", label: "Authorized agent fee", hint: "At submission", value: input.authorizedAgentFee, onChange: (v) => set("authorizedAgentFee", v) }],
        },
      ]}
    >
      <StepCard step={2} title="Investment plan">
        <Segmented<AbProgram>
          id="ab-program"
          value={input.program}
          onChange={(v) => set("program", v)}
          options={(Object.keys(AB_PROGRAMS) as AbProgram[]).map((k) => ({
            value: k,
            label: AB_PROGRAMS[k].short,
            sub: AB_PROGRAMS[k].name,
          }))}
        />
        <PlanDescription id={input.program}>{program.description}</PlanDescription>
      </StepCard>

      <StepCard step={3} title="Family composition" aside={<PersonCount size={size} />}>
        <ul className="divide-y divide-line/70">
          {AB_MEMBERS.map((m) => (
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
        <InfoBox id="ab-processing">
          The government processing fee is <strong className="text-ink">{usd(P.single)}</strong> for a single applicant,{" "}
          <strong className="text-ink">{usd(P.upTo4)}</strong> for a family of up to 4, plus{" "}
          <strong className="text-ink">{usd(P.extraPerson)}</strong> for each additional person. 10% is paid at submission and
          the balance after approval.
        </InfoBox>
      </StepCard>

      <StepCard step={4} title="Options">
        <div className="flex items-center justify-between gap-4 rounded-xl bg-canvas px-4 py-3.5">
          <div>
            <p className="text-sm font-semibold text-ink">Application includes a benefactor</p>
            <p className="text-xs text-muted">
              Adds {usd(B.ciuDueDiligence)} CIU due diligence and {usd(B.bankDueDiligence)} bank due diligence.
            </p>
          </div>
          <Switch label="Includes benefactor" checked={input.includesBenefactor} onChange={(v) => set("includesBenefactor", v)} />
        </div>
      </StepCard>
    </CalculatorPage>
  );
}
