"use client";

import { useMemo, useState } from "react";
import {
  computeUkQuote,
  DEFAULT_UK_INPUT,
  UK_LOCATIONS,
  UK_MEMBERS,
  UK_NOTES,
  UK_RATES,
  ukEndorsementInfo,
  ukFamilySize,
  type UkInput,
  type UkLocation,
} from "@/lib/calculators/uk-ifv";
import { money } from "@/lib/format";
import { UkFlag } from "@/components/flags";
import { Segmented, Stepper } from "./controls";
import { CalculatorPage, InfoBox, PersonCount, StepCard } from "./shell";

const gbp = (n: number) => money(n, "GBP");

export const UK_IFV_DESCRIPTION = (
  <>
    TEG professional fee of <strong className="text-ink">{gbp(10000)}</strong> in four instalments — fixed, whatever the
    family size. Immigration Health Surcharge and the Home Office fee are per family member and paid directly to UKVI;
    the endorsement application is paid directly to the endorsing body, once per application.
  </>
);

/** UK Innovator Founder Visa. `programme` is the country page's programme card (step 2). */
export function UkIfvCalculator({ programme }: { programme: React.ReactNode }) {
  const [input, setInput] = useState<UkInput>(DEFAULT_UK_INPUT);
  const quote = useMemo(() => computeUkQuote(input), [input]);
  const size = ukFamilySize(input.family);
  const set = <K extends keyof UkInput>(k: K, v: UkInput[K]) => setInput((s) => ({ ...s, [k]: v }));
  const loc = input.location;
  const where = UK_LOCATIONS[loc].short;
  const info = ukEndorsementInfo(loc);

  const family = UK_MEMBERS.filter((m) => input.family[m.key] > 0).map((m) => ({
    label: m.label,
    count: input.family[m.key],
  }));

  return (
    <CalculatorPage
      code="UK"
      title="United Kingdom"
      subtitle="Innovator Founder Visa · Payment schedule calculator"
      flag={<UkFlag className="h-14 w-[84px]" />}
      quote={quote}
      totalLabel="Total cost"
      caption={`Innovator Founder · ${where} · ${size} ${size === 1 ? "person" : "persons"}`}
      footnote="Figures follow the TEG UK Innovator Founder Visa sheet. Amounts in GBP."
      notes={UK_NOTES}
      info={info}
      documentTitle="Payment Schedule — UK Innovator Founder Visa"
      planLabel={`Innovator Founder Visa — ${UK_LOCATIONS[loc].name}`}
      family={family}
      onReset={() => setInput(DEFAULT_UK_INPUT)}
      tegFee={[
        { id: "fee-signing", label: "Instalment 1", hint: "At the time of signing · non-refundable", value: input.feeSigning, onChange: (v) => set("feeSigning", v) },
        { id: "fee-business-plan", label: "Instalment 2", hint: "Business plan + financial projections · non-refundable", value: input.feeBusinessPlan, onChange: (v) => set("feeBusinessPlan", v) },
        { id: "fee-endorsement", label: "Instalment 3", hint: "After endorsing body approval · non-refundable", value: input.feeEndorsement, onChange: (v) => set("feeEndorsement", v) },
        { id: "fee-submission", label: "Instalment 4", hint: "At immigration application · refundable on rejection", value: input.feeSubmission, onChange: (v) => set("feeSubmission", v) },
      ]}
    >
      {programme}

      <StepCard step={3} title="Where is the family applying from?">
        <Segmented<UkLocation>
          id="uk-location"
          value={loc}
          onChange={(v) => set("location", v)}
          options={(Object.keys(UK_LOCATIONS) as UkLocation[]).map((k) => ({ value: k, label: UK_LOCATIONS[k].short, sub: UK_LOCATIONS[k].name }))}
        />
        <InfoBox id={`uk-loc-${loc}`}>
          {where}: Home Office application fee <strong className="text-ink">{gbp(UK_RATES.applicationFee[loc])}</strong> per
          family member and endorsement application{" "}
          <strong className="text-ink">{gbp(UK_RATES.endorsementApplication[loc])}</strong> per application
          {loc === "inside" ? " (inclusive of 20% VAT)" : ""}. Please confirm the family&apos;s location — it changes the fees.
        </InfoBox>
      </StepCard>

      <StepCard step={4} title="Family composition" aside={<PersonCount size={size} />}>
        <ul className="divide-y divide-line/70">
          {UK_MEMBERS.map((m) => (
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
        <InfoBox id="uk-family">
          Immigration Health Surcharge: <strong className="text-ink">{gbp(UK_RATES.ihs.adult)}</strong> per adult (
          {gbp(UK_RATES.ihs.adultPerYear)}/year) and <strong className="text-ink">{gbp(UK_RATES.ihs.child)}</strong> per child (
          {gbp(UK_RATES.ihs.childPerYear)}/year). Maximum age for children is 18. The TEG fee and endorsement costs do not
          change with family size — endorsement is charged once for the whole family.
        </InfoBox>
      </StepCard>

      <StepCard step={5} title={info.title}>
        <dl className="space-y-3">
          {info.rows.map((r) => (
            <div key={r.label} className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1 border-b border-line/70 pb-2 text-sm">
              <dt className="text-muted">{r.label}</dt>
              <dd className="font-semibold text-ink">{r.value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-xs text-muted">{info.note}</p>
      </StepCard>
    </CalculatorPage>
  );
}
