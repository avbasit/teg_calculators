"use client";

import { useMemo, useState } from "react";
import {
  computeTrQuote,
  DEFAULT_TR_INPUT,
  TR_MEMBERS,
  TR_OTHER_DETAILS,
  TR_RATES,
  TR_ROUTES,
  trFamilySize,
  trLawyerFee,
  trNotes,
  trPropertyPrice,
  type TrInput,
  type TrRoute,
} from "@/lib/calculators/turkiye";
import { usd } from "@/lib/format";
import { TurkiyeFlag } from "@/components/flags";
import { MoneyInput, Segmented, Stepper } from "./controls";
import { CalculatorPage, InfoBox, PersonCount, PlanDescription, StepCard } from "./shell";

export function TurkiyeCalculator() {
  const [input, setInput] = useState<TrInput>(DEFAULT_TR_INPUT);
  const quote = useMemo(() => computeTrQuote(input), [input]);
  const size = trFamilySize(input.family);
  const route = TR_ROUTES[input.route];
  const re = input.route === "RE";
  const price = trPropertyPrice(input);
  const set = <K extends keyof TrInput>(k: K, v: TrInput[K]) => setInput((s) => ({ ...s, [k]: v }));
  const belowMin = input.propertyPrice < TR_RATES.minPropertyPrice;

  const family = TR_MEMBERS.filter((m) => input.family[m.key] > 0).map((m) => ({
    label: m.label,
    count: input.family[m.key],
  }));

  return (
    <CalculatorPage
      code="TR"
      title="Türkiye"
      subtitle="Citizenship by Investment · Payment schedule calculator"
      flag={<TurkiyeFlag className="h-14 w-[84px]" />}
      quote={quote}
      totalLabel="Total cost"
      caption={`${route.short}${re ? ` ${usd(price)}` : ""} · ${size} ${size === 1 ? "person" : "persons"}`}
      footnote="Figures follow the TEG Türkiye CBI sheet. Amounts in USD, exclusive of VAT. Final amounts may vary."
      notes={trNotes(input.route)}
      info={re ? TR_OTHER_DETAILS : undefined}
      documentTitle="Payment Schedule — Türkiye Citizenship by Investment"
      planLabel={re ? `Real Estate (${usd(price)})` : `Bank Deposit (${usd(TR_RATES.bankDeposit)})`}
      family={family}
      onReset={() => setInput(DEFAULT_TR_INPUT)}
      tegFee={[
        { id: "retainer-signing", label: "Retainer of professional fees", hint: "Upon signing", value: input.retainerOnSigning, onChange: (v) => set("retainerOnSigning", v) },
        { id: "retainer-approval", label: "Balance of professional fees", hint: "After approval", value: input.retainerAfterApproval, onChange: (v) => set("retainerAfterApproval", v) },
      ]}
      otherFees={[
        {
          title: "Lawyer fee",
          fields: [
            {
              id: "lawyer",
              label: "Lawyer fee",
              hint: re ? "US$5,000 – US$8,000 depending on project" : "Bank deposit route",
              value: trLawyerFee(input),
              onChange: (v) => set("lawyerFee", v),
            },
          ],
        },
      ]}
    >
      <StepCard step={2} title="Investment plan">
        <Segmented<TrRoute>
          id="tr-route"
          value={input.route}
          // A new route brings back that route's default lawyer fee.
          onChange={(v) => setInput((s) => ({ ...s, route: v, lawyerFee: null }))}
          options={(Object.keys(TR_ROUTES) as TrRoute[]).map((k) => ({ value: k, label: TR_ROUTES[k].short, sub: TR_ROUTES[k].name }))}
        />
        <PlanDescription id={input.route}>{route.description}</PlanDescription>
        {re && (
          <div className="mt-5">
            <MoneyInput
              label="Property price"
              hint={`Minimum ${usd(TR_RATES.minPropertyPrice)}`}
              value={input.propertyPrice}
              onChange={(v) => set("propertyPrice", v)}
            />
            {belowMin && (
              <p className="mt-2 text-xs font-semibold text-red-600">
                Below the {usd(TR_RATES.minPropertyPrice)} minimum — the quote uses {usd(TR_RATES.minPropertyPrice)}.
              </p>
            )}
          </div>
        )}
      </StepCard>

      <StepCard step={3} title="Family composition" aside={<PersonCount size={size} />}>
        <ul className="divide-y divide-line/70">
          {TR_MEMBERS.map((m) => (
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
        <InfoBox id="tr-family">
          Per person: residency application <strong className="text-ink">{usd(TR_RATES.residencyApplication)}</strong>,
          residency card <strong className="text-ink">{usd(TR_RATES.residencyCard)}</strong> and passport{" "}
          <strong className="text-ink">{usd(TR_RATES.passport)}</strong>. Tax ID is{" "}
          <strong className="text-ink">{usd(TR_RATES.taxId)}</strong> per adult; courier is{" "}
          <strong className="text-ink">{usd(TR_RATES.courier)}</strong> per application.
        </InfoBox>
      </StepCard>

      {re && (
        <StepCard step={4} title={TR_OTHER_DETAILS.title}>
          <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-2">
            {TR_OTHER_DETAILS.rows.map((d) => (
              <div key={d.label} className="flex items-center justify-between gap-3 border-b border-line/70 pb-2 text-sm">
                <dt className="text-muted">{d.label}</dt>
                <dd className="font-semibold text-ink">{d.value}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 text-xs text-muted">{TR_OTHER_DETAILS.note}</p>
        </StepCard>
      )}
    </CalculatorPage>
  );
}
