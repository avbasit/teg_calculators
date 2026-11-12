"use client";

import { useMemo, useState } from "react";
import {
  computeVuQuote,
  DEFAULT_VU_INPUT,
  VU_MEMBERS,
  VU_NOTES,
  VU_RATES,
  vuFamilySize,
  type VuInput,
} from "@/lib/calculators/vanuatu";
import { usd } from "@/lib/format";
import { VanuatuFlag } from "@/components/flags";
import { Stepper } from "./controls";
import { CalculatorPage, InfoBox, PersonCount, StepCard } from "./shell";

const TIERS = ["Single applicant", "Married couple", "Family of 3", "Family of 4"];

export function VanuatuCalculator() {
  const [input, setInput] = useState<VuInput>(DEFAULT_VU_INPUT);
  const quote = useMemo(() => computeVuQuote(input), [input]);
  const size = vuFamilySize(input.family);
  const set = <K extends keyof VuInput>(k: K, v: VuInput[K]) => setInput((s) => ({ ...s, [k]: v }));

  const family = VU_MEMBERS.filter((m) => input.family[m.key] > 0).map((m) => ({
    label: m.label,
    count: input.family[m.key],
  }));

  return (
    <CalculatorPage
      code="VU"
      title="Vanuatu"
      subtitle="Citizenship by Investment · Payment schedule calculator"
      flag={<VanuatuFlag className="h-14 w-[84px]" />}
      quote={quote}
      totalLabel="Total cost"
      caption={`DSP Donation · ${size} ${size === 1 ? "person" : "persons"}`}
      footnote="Figures follow the TEG Vanuatu pricing sheet. Amounts in USD, exclusive of VAT."
      notes={VU_NOTES}
      documentTitle="Payment Schedule — Vanuatu"
      planLabel="DSP (Development Support Program) Donation"
      family={family}
      onReset={() => setInput(DEFAULT_VU_INPUT)}
      tegFee={[
        { id: "retainer-signing", label: "TEG professional fee", hint: "Upon signing", value: input.retainerOnSigning, onChange: (v) => set("retainerOnSigning", v) },
        { id: "retainer-approval", label: "TEG professional fee", hint: "After approval", value: input.retainerOnApproval, onChange: (v) => set("retainerOnApproval", v) },
      ]}
    >
      <StepCard step={2} title="Investment plan">
        <div className="flex items-center justify-between gap-4 rounded-2xl bg-white px-4 py-3 shadow-card ring-1 ring-royal/25">
          <div>
            <p className="text-base font-bold text-royal">DSP Donation</p>
            <p className="text-xs text-muted">Development Support Program</p>
          </div>
          <span className="rounded-full bg-royal-soft px-3 py-1 text-xs font-semibold text-royal">Only route</span>
        </div>
        <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-5">
          {VU_RATES.donationBySize.map((amount, i) => {
            const active = Math.min(size, 4) === i + 1;
            return (
              <div
                key={TIERS[i]}
                className={`rounded-xl px-3 py-2.5 text-center ring-1 transition-colors ${active ? "bg-royal text-white ring-royal" : "bg-canvas text-ink ring-line"}`}
              >
                <p className={`text-[11px] ${active ? "text-white/80" : "text-muted"}`}>{TIERS[i]}</p>
                <p className="text-sm font-bold tabular">{usd(amount)}</p>
              </div>
            );
          })}
          <div className={`col-span-2 rounded-xl px-3 py-2.5 text-center ring-1 transition-colors sm:col-span-1 ${size > 4 ? "bg-royal text-white ring-royal" : "bg-canvas text-ink ring-line"}`}>
            <p className={`text-[11px] ${size > 4 ? "text-white/80" : "text-muted"}`}>Each extra dependant</p>
            <p className="text-sm font-bold tabular">+{usd(VU_RATES.extraDependant)}</p>
          </div>
        </div>
      </StepCard>

      <StepCard step={3} title="Family composition" aside={<PersonCount size={size} />}>
        <ul className="divide-y divide-line/70">
          {VU_MEMBERS.map((m) => (
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
        <InfoBox id="vu-family">
          ID &amp; birth registration is <strong className="text-ink">{usd(VU_RATES.idAndBirthRegistration)}</strong> per person.
          Biometrics cost <strong className="text-ink">{usd(VU_RATES.biometrics.main)}</strong> for the main applicant and{" "}
          <strong className="text-ink">{usd(VU_RATES.biometrics.perDependant)}</strong> per dependant, paid directly to the unit.
        </InfoBox>
      </StepCard>
    </CalculatorPage>
  );
}
