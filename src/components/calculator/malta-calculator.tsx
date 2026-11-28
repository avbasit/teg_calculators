"use client";

import { useMemo, useState } from "react";
import {
  computeMtQuote,
  DEFAULT_MT_INPUT,
  MT_ADULT_BANDS,
  MT_AGE_BANDS,
  MT_BEDROOMS,
  MT_MAX_CHILDREN,
  MT_NOTES,
  MT_RATES,
  MT_ROUTES,
  mtConditions,
  mtFamilySize,
  mtPropertyAmount,
  type MtAgeBand,
  type MtInput,
  type MtRoute,
} from "@/lib/calculators/malta";
import { money } from "@/lib/format";
import { MaltaFlag } from "@/components/flags";
import { MoneyInput, Segmented, Stepper } from "./controls";
import { CalculatorPage, InfoBox, PersonCount, PlanDescription, StepCard } from "./shell";

const eur = (n: number) => money(n, "EUR");

function AgeBandSelect({ id, label, value, onChange }: { id: string; label: string; value: MtAgeBand; onChange: (v: MtAgeBand) => void }) {
  return (
    <label htmlFor={id} className="flex items-center gap-2 text-xs text-muted">
      {label}
      <select
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value as MtAgeBand)}
        className="h-9 rounded-lg bg-white px-2 text-sm font-semibold text-ink ring-1 ring-line outline-none focus:ring-2 focus:ring-royal/50"
      >
        {MT_ADULT_BANDS.map((b) => (
          <option key={b.key} value={b.key}>
            {b.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function MaltaCalculator() {
  const [input, setInput] = useState<MtInput>(DEFAULT_MT_INPUT);
  const quote = useMemo(() => computeMtQuote(input), [input]);
  const size = mtFamilySize(input);
  const route = MT_ROUTES[input.route];
  const rent = input.route === "rent";
  const amount = mtPropertyAmount(input);
  const conditions = mtConditions(input);
  const set = <K extends keyof MtInput>(k: K, v: MtInput[K]) => setInput((s) => ({ ...s, [k]: v }));
  const min = rent ? MT_RATES.minRent : MT_RATES.minPurchase;
  const entered = rent ? input.rent : input.purchasePrice;

  const family = [
    { label: "Main Applicant", count: 1 },
    { label: "Spouse", count: input.spouse },
    { label: "Child under 18", count: input.children },
  ].filter((f) => f.count > 0);

  return (
    <CalculatorPage
      code="MT"
      title="Malta"
      subtitle="Permanent Residence Programme (MPRP) · Payment schedule calculator"
      flag={<MaltaFlag className="h-14 w-[84px]" />}
      quote={quote}
      totalLabel="Total cost"
      caption={`${route.short} ${eur(amount)}${rent ? "/yr" : ""} · ${size} ${size === 1 ? "person" : "persons"}`}
      footnote="Figures follow the TEG Malta Residency Programme sheet. Amounts in EUR. Health insurance is approximate."
      notes={MT_NOTES}
      info={conditions}
      documentTitle="Payment Schedule — Malta Permanent Residence Programme"
      planLabel={`MPRP — ${route.short} (${eur(amount)}${rent ? " per year" : ""})`}
      family={family}
      onReset={() => setInput(DEFAULT_MT_INPUT)}
      tegFee={[
        { id: "retainer-advance", label: "TEG professional fee", hint: "50% advance · upon signing", value: input.retainerAdvance, onChange: (v) => set("retainerAdvance", v) },
        { id: "retainer-approval", label: "TEG professional fee", hint: "50% after approval", value: input.retainerAfterApproval, onChange: (v) => set("retainerAfterApproval", v) },
      ]}
      otherFees={[
        {
          title: "Legal & admin fee",
          fields: [
            { id: "legal-advance", label: "Legal & admin fee", hint: "50% advance · upon signing", value: input.legalAdvance, onChange: (v) => set("legalAdvance", v) },
            { id: "legal-approval", label: "Legal & admin fee", hint: "50% on approval", value: input.legalOnApproval, onChange: (v) => set("legalOnApproval", v) },
          ],
        },
      ]}
    >
      <StepCard step={2} title="Investment plan">
        <Segmented<MtRoute>
          id="mt-route"
          value={input.route}
          onChange={(v) => set("route", v)}
          options={(Object.keys(MT_ROUTES) as MtRoute[]).map((k) => ({ value: k, label: MT_ROUTES[k].short, sub: MT_ROUTES[k].name }))}
        />
        <PlanDescription id={input.route}>{route.description}</PlanDescription>
        <div className="mt-5">
          <MoneyInput
            currency="EUR"
            label={rent ? "Annual rent" : "Property price"}
            hint={`Minimum ${eur(min)}${rent ? " per year" : ""}`}
            value={entered}
            onChange={(v) => set(rent ? "rent" : "purchasePrice", v)}
          />
          {entered < min && (
            <p className="mt-2 text-xs font-semibold text-red-600">
              Below the {eur(min)} minimum — the quote uses {eur(min)}.
            </p>
          )}
          {rent && (
            <p className="mt-2 text-xs text-muted">
              Information only — rent is paid to the landlord and is not included in the total.
            </p>
          )}
        </div>
        {rent && (
          <div className="mt-5">
            <p className="mb-2 text-xs font-semibold text-ink">Suggested bedrooms</p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {MT_BEDROOMS.map((b) => {
                const [lo, hi] = b.members.split("–").map(Number);
                const active = size >= lo && size <= hi;
                return (
                  <div
                    key={b.members}
                    className={`rounded-xl px-3 py-2.5 text-center ring-1 transition-colors ${active ? "bg-royal text-white ring-royal" : "bg-canvas text-ink ring-line"}`}
                  >
                    <p className={`text-[11px] ${active ? "text-white/80" : "text-muted"}`}>{b.members} members</p>
                    <p className="text-sm font-bold">{b.bedrooms} bedrooms</p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </StepCard>

      <StepCard step={3} title="Family composition" aside={<PersonCount size={size} />}>
        <ul className="divide-y divide-line/70">
          <li className="flex flex-wrap items-center justify-between gap-4 pb-3">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-ink">Main Applicant</p>
              <AgeBandSelect id="mt-main-age" label="Age" value={input.mainAge} onChange={(v) => set("mainAge", v)} />
            </div>
            <Stepper label="Main Applicant" value={1} locked onChange={() => {}} />
          </li>
          <li className="flex flex-wrap items-center justify-between gap-4 py-3">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-ink">Spouse</p>
              {input.spouse > 0 && <AgeBandSelect id="mt-spouse-age" label="Age" value={input.spouseAge} onChange={(v) => set("spouseAge", v)} />}
            </div>
            <Stepper label="Spouse" value={input.spouse} max={1} onChange={(v) => set("spouse", v as 0 | 1)} />
          </li>
          <li className="flex items-center justify-between gap-4 pt-3">
            <div>
              <p className="text-sm font-semibold text-ink">Child under 18</p>
              <p className="text-xs text-muted">Free — no charges by the Authority.</p>
            </div>
            <Stepper label="Child under 18" value={input.children} max={MT_MAX_CHILDREN} onChange={(v) => set("children", v)} />
          </li>
        </ul>
        <InfoBox id="mt-family">
          Spouse and children under 18 add no government fees. Per person: residency card{" "}
          <strong className="text-ink">{eur(MT_RATES.residencyCard)}</strong> (5 years) and approximate health insurance per
          year — {MT_AGE_BANDS.map((b) => `${b.label} ${eur(b.rate)}`).join(", ")}. The final insurance amount will be quoted
          by the Maltese insurance company.
        </InfoBox>
      </StepCard>

      <StepCard step={4} title={conditions.title}>
        <ul className="space-y-2 text-sm text-muted">
          {conditions.rows.map((r) => (
            <li key={r.label} className="flex gap-2">
              <span className="mt-2 size-1 shrink-0 rounded-full bg-royal" />
              <span>
                {r.label}
                {r.value && <strong className="ml-1 text-ink">{r.value}</strong>}
              </span>
            </li>
          ))}
        </ul>
      </StepCard>
    </CalculatorPage>
  );
}
