"use client";

import { useMemo, useState } from "react";
import {
  computeGrQuote,
  DEFAULT_GR_INPUT,
  GR_MEMBERS,
  GR_NOTES,
  GR_RATES,
  grFamilySize,
  grLandRegistry,
  grLawyerFee,
  grPropertyPrice,
  type GrInput,
} from "@/lib/calculators/greece";
import { money } from "@/lib/format";
import { GreeceFlag } from "@/components/flags";
import { MoneyInput, Stepper } from "./controls";
import { CalculatorPage, InfoBox, PersonCount, StepCard } from "./shell";

const eur = (n: number) => money(n, "EUR");

export function GreeceCalculator() {
  const [input, setInput] = useState<GrInput>(DEFAULT_GR_INPUT);
  const quote = useMemo(() => computeGrQuote(input), [input]);
  const size = grFamilySize(input.family);
  const price = grPropertyPrice(input);
  const land = grLandRegistry(input);
  const lawyer = grLawyerFee(input);
  const set = <K extends keyof GrInput>(k: K, v: GrInput[K]) => setInput((s) => ({ ...s, [k]: v }));
  const belowMin = input.propertyPrice < GR_RATES.minPropertyPrice;

  const family = GR_MEMBERS.filter((m) => input.family[m.key] > 0).map((m) => ({
    label: m.label,
    count: input.family[m.key],
  }));

  return (
    <CalculatorPage
      code="GR"
      title="Greece"
      subtitle="Golden Visa · Payment schedule calculator"
      flag={<GreeceFlag className="h-14 w-[84px]" />}
      quote={quote}
      totalLabel="Total cost"
      caption={`Property ${eur(price)} · ${size} ${size === 1 ? "person" : "persons"}`}
      footnote="Figures follow the TEG Greece pricing sample. Amounts in EUR. Final cost may vary depending on the developer / property selected."
      notes={GR_NOTES}
      documentTitle="Payment Schedule — Greece Golden Visa"
      planLabel={`Golden Visa — Real Estate (${eur(price)})`}
      family={family}
      onReset={() => setInput(DEFAULT_GR_INPUT)}
      tegFee={[
        { id: "retainer-signing", label: "TEG professional fee", hint: "Upon signing", value: input.retainerOnSigning, onChange: (v) => set("retainerOnSigning", v) },
        { id: "retainer-approval", label: "TEG professional fee", hint: "After approval", value: input.retainerAfterApproval, onChange: (v) => set("retainerAfterApproval", v) },
      ]}
      otherFees={[
        {
          title: "Lawyer's fee",
          fields: [
            {
              id: "lawyer",
              label: "Lawyer's fee (before VAT)",
              hint: `Minimum 1% of the contract price · ${eur(lawyer.min)}`,
              value: input.lawyerFee ?? lawyer.min,
              onChange: (v) => set("lawyerFee", v),
            },
          ],
        },
        {
          title: "Land registry fee",
          fields: [
            {
              id: "land-registry",
              label: "Land registry fee",
              hint: `0.6–0.9% depending on area · minimum ${eur(land.min)}`,
              value: input.landRegistry ?? land.min,
              onChange: (v) => set("landRegistry", v),
            },
          ],
        },
      ]}
    >
      <StepCard step={2} title="Property">
        <MoneyInput
          currency="EUR"
          label="Contract price"
          hint={`Minimum ${eur(GR_RATES.minPropertyPrice)}`}
          value={input.propertyPrice}
          onChange={(v) => set("propertyPrice", v)}
        />
        {belowMin && (
          <p className="mt-2 text-xs font-semibold text-red-600">
            Below the {eur(GR_RATES.minPropertyPrice)} minimum — the quote uses {eur(GR_RATES.minPropertyPrice)}.
          </p>
        )}
        <InfoBox id="gr-property">
          The property is paid <strong className="text-ink">directly to the developer / seller</strong> and is included in the
          property purchase total (A). Notary (1.5%) and title deed transfer (3.09%) fees follow the contract price. The
          lawyer&apos;s fee starts at the 1% minimum ({eur(lawyer.min)}) plus 24% VAT, and land registry at the 0.6% minimum
          ({eur(land.min)}, up to about {eur(land.max)} depending on area). Both can be raised in the Fees card.
        </InfoBox>
      </StepCard>

      <StepCard step={3} title="Family composition" aside={<PersonCount size={size} />}>
        <ul className="divide-y divide-line/70">
          {GR_MEMBERS.map((m) => (
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
        <InfoBox id="gr-family">
          PR application is <strong className="text-ink">{eur(GR_RATES.prApplication.main)}</strong> for the main applicant
          and <strong className="text-ink">{eur(GR_RATES.prApplication.perDependant)}</strong> per dependant; the government
          fee is <strong className="text-ink">{eur(GR_RATES.governmentFee.main)}</strong> and{" "}
          <strong className="text-ink">{eur(GR_RATES.governmentFee.perDependant)}</strong>. Insurance is{" "}
          <strong className="text-ink">{eur(GR_RATES.insurance)}</strong> per person per year.
        </InfoBox>
      </StepCard>
    </CalculatorPage>
  );
}
