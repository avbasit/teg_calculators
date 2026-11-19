"use client";

import { useMemo, useState } from "react";
import {
  computeEsQuote,
  DEFAULT_ES_INPUT,
  ES_MEMBERS,
  ES_NOTES,
  ES_RATES,
  esFamilySize,
  esMinIncome,
  type EsInput,
} from "@/lib/calculators/spain-dnv";
import { money } from "@/lib/format";
import { SpainFlag } from "@/components/flags";
import { Stepper } from "./controls";
import { CalculatorPage, InfoBox, PersonCount, StepCard } from "./shell";

const eur = (n: number) => money(n, "EUR");

export const ES_DNV_DESCRIPTION = (
  <>
    TEG fee of {eur(ES_RATES.fee.main)} for the main applicant and {eur(ES_RATES.fee.perDependant)} per dependant — 50%
    upon signing and 50% upon proof of submission. No other professional fee applies. A bank fee of{" "}
    {eur(ES_RATES.bankFee)} per person is collected with the first payment.
  </>
);

/** Spain Digital Nomad Visa. `programme` is the country page's programme card (step 2). */
export function SpainDnvCalculator({ programme }: { programme: React.ReactNode }) {
  const [input, setInput] = useState<EsInput>(DEFAULT_ES_INPUT);
  const quote = useMemo(() => computeEsQuote(input), [input]);
  const size = esFamilySize(input.family);
  const income = esMinIncome(input.family);
  const set = <K extends keyof EsInput>(k: K, v: EsInput[K]) => setInput((s) => ({ ...s, [k]: v }));
  const I = ES_RATES.minIncome;
  const deps = size - 1;

  const family = ES_MEMBERS.filter((m) => input.family[m.key] > 0).map((m) => ({
    label: m.label,
    count: input.family[m.key],
  }));

  return (
    <CalculatorPage
      code="ES"
      title="Spain"
      subtitle="Digital Nomad Visa · Payment schedule calculator"
      flag={<SpainFlag className="h-14 w-[84px]" />}
      quote={quote}
      totalLabel="Total cost"
      caption={`Digital Nomad Visa · ${size} ${size === 1 ? "person" : "persons"}`}
      footnote="Figures follow the TEG Spain Digital Nomad Visa sheet. Amounts in EUR, exclusive of VAT."
      notes={ES_NOTES}
      documentTitle="Payment Schedule — Spain Digital Nomad Visa"
      planLabel="Digital Nomad Visa"
      family={family}
      onReset={() => setInput(DEFAULT_ES_INPUT)}
      tegFee={[
        { id: "fee-main", label: "Main applicant", hint: "Full fee · paid 50 / 50", value: input.feeMain, onChange: (v) => set("feeMain", v) },
        { id: "fee-dependant", label: "Each dependant", hint: "Full fee · paid 50 / 50", value: input.feeDependant, onChange: (v) => set("feeDependant", v) },
      ]}
    >
      {programme}

      <StepCard step={3} title="Family composition" aside={<PersonCount size={size} />}>
        <ul className="divide-y divide-line/70">
          {ES_MEMBERS.map((m) => (
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
        <InfoBox id="es-family">
          TEG fee is <strong className="text-ink">{eur(ES_RATES.fee.main)}</strong> for the main applicant and{" "}
          <strong className="text-ink">{eur(ES_RATES.fee.perDependant)}</strong> per dependant. Bank fee is{" "}
          <strong className="text-ink">{eur(ES_RATES.bankFee)}</strong> per person, collected upon signing.
        </InfoBox>
        <InfoBox id="es-docs">
          Sworn translation, notary attestation and apostille costs are additional and charged as per the number of
          documents. They are not included in this quotation.
        </InfoBox>
      </StepCard>

      <StepCard step={4} title="Minimum income required">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {I.byDependants.map((t, i) => {
            const active = Math.min(deps, I.byDependants.length - 1) === i;
            return (
              <div
                key={t.label}
                className={`rounded-xl px-3 py-2.5 text-center ring-1 transition-colors ${active ? "bg-royal text-white ring-royal" : "bg-canvas text-ink ring-line"}`}
              >
                <p className={`text-[11px] ${active ? "text-white/80" : "text-muted"}`}>{t.label}</p>
                <p className="text-sm font-bold tabular">{eur(t.monthly)}/mo</p>
              </div>
            );
          })}
          <div className={`rounded-xl px-3 py-2.5 text-center ring-1 transition-colors ${deps > 2 ? "bg-royal text-white ring-royal" : "bg-canvas text-ink ring-line"}`}>
            <p className={`text-[11px] ${deps > 2 ? "text-white/80" : "text-muted"}`}>Each additional dependant</p>
            <p className="text-sm font-bold tabular">+{eur(I.extraDependant.monthly)}/mo</p>
          </div>
        </div>
        <p className="mt-4 text-sm leading-relaxed text-muted">
          This family must show at least <strong className="text-ink">{eur(income.monthly)} per month</strong> (
          {eur(income.yearly)} per year). Proof of income only — not a cost and not included in the total.
        </p>
      </StepCard>
    </CalculatorPage>
  );
}
