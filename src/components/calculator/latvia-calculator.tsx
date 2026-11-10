"use client";

import { useMemo, useState } from "react";
import {
  computeLatviaQuote,
  DEFAULT_LATVIA_INPUT,
  LATVIA_MAX_CHILDREN,
  LATVIA_NOTES,
  LATVIA_PLANS,
  latviaFamilySize,
  latviaLegalFees,
  type LatviaInput,
  type LatviaPlan,
} from "@/lib/calculators/latvia";
import { LatviaFlag } from "@/components/flags";
import { Segmented, Stepper } from "./controls";
import { CalculatorPage, InfoBox, PersonCount, PlanDescription, StepCard } from "./shell";

const PLAN_KEYS = Object.keys(LATVIA_PLANS).map(Number) as LatviaPlan[];

export function LatviaCalculator() {
  const [input, setInput] = useState<LatviaInput>(DEFAULT_LATVIA_INPUT);
  const quote = useMemo(() => computeLatviaQuote(input), [input]);
  const size = latviaFamilySize(input);
  const plan = LATVIA_PLANS[input.plan];
  const legal = latviaLegalFees(input);
  const set = <K extends keyof LatviaInput>(k: K, v: LatviaInput[K]) => setInput((s) => ({ ...s, [k]: v }));

  const family = [
    { label: "Main Applicant", count: 1 },
    { label: "Spouse", count: input.spouse },
    { label: "Dependent Child 0–18", count: input.children },
  ].filter((f) => f.count > 0);

  return (
    <CalculatorPage
      code="LV"
      title="Latvia"
      subtitle="Residence by Investment (Golden Visa) · Payment schedule calculator"
      flag={<LatviaFlag className="h-14 w-[84px]" />}
      quote={quote}
      totalLabel="Grand total"
      caption={`${plan.short} plan · ${size} ${size === 1 ? "person" : "persons"}`}
      footnote="Figures follow the TEG Latvia pricing workbook (21 Sep 2026). Amounts in EUR, exclusive of VAT."
      notes={LATVIA_NOTES}
      documentTitle="Payment Schedule — Latvia Golden Visa"
      planLabel={`${plan.short} — ${plan.name}`}
      family={family}
      onReset={() => setInput(DEFAULT_LATVIA_INPUT)}
      tegFee={[
        { id: "retainer-signing", label: "TEG retainer", hint: "Upon signing of agreement", value: input.retainerOnSigning, onChange: (v) => set("retainerOnSigning", v) },
        { id: "retainer-approval", label: "TEG retainer", hint: "After approval", value: input.retainerOnApproval, onChange: (v) => set("retainerOnApproval", v) },
      ]}
      otherFees={[
        {
          title: input.plan === 50000 ? "Legal fee" : "Legal fee (not charged on the €100,000 plan by default)",
          fields: [
            { id: "legal-signing", label: "Legal fee", hint: "Upon signing of agreement", value: legal.onSigning, onChange: (v) => set("legalOnSigning", v) },
            { id: "legal-approval", label: "Legal fee", hint: "After approval", value: legal.onApproval, onChange: (v) => set("legalOnApproval", v) },
          ],
        },
      ]}
    >
      <StepCard step={2} title="Investment plan">
        <Segmented<string>
          id="latvia-plan"
          value={String(input.plan)}
          onChange={(v) =>
            // A new plan brings back that plan's default legal fee.
            setInput((s) => ({ ...s, plan: Number(v) as LatviaPlan, legalOnSigning: null, legalOnApproval: null }))
          }
          options={PLAN_KEYS.map((k) => ({ value: String(k), label: LATVIA_PLANS[k].short, sub: LATVIA_PLANS[k].name }))}
        />
        <PlanDescription id={String(input.plan)}>{plan.description}</PlanDescription>
      </StepCard>

      <StepCard step={3} title="Family composition" aside={<PersonCount size={size} />}>
        <ul className="divide-y divide-line/70">
          <li className="flex items-center justify-between gap-4 pb-3">
            <p className="text-sm font-semibold text-ink">Main Applicant</p>
            <Stepper label="Main Applicant" value={1} locked onChange={() => {}} />
          </li>
          <li className="flex items-center justify-between gap-4 py-3">
            <p className="text-sm font-semibold text-ink">Spouse</p>
            <Stepper label="Spouse" value={input.spouse} max={1} onChange={(v) => set("spouse", v as 0 | 1)} />
          </li>
          <li className="flex items-center justify-between gap-4 pt-3">
            <div>
              <p className="text-sm font-semibold text-ink">Dependent Child 0–18</p>
              <p className="text-xs text-muted">Maximum age for children is 18.</p>
            </div>
            <Stepper label="Dependent Child 0–18" value={input.children} max={LATVIA_MAX_CHILDREN} onChange={(v) => set("children", v)} />
          </li>
        </ul>
        <InfoBox id="latvia-family">
          Per-person fees: initial application <strong className="text-ink">€160</strong>, embassy{" "}
          <strong className="text-ink">€252</strong> and X-ray <strong className="text-ink">€80</strong>. Medical insurance,
          biometrics and renewals are priced per family member; the one-time state budget payment of{" "}
          <strong className="text-ink">€10,000</strong> is charged once.
        </InfoBox>
      </StepCard>
    </CalculatorPage>
  );
}
