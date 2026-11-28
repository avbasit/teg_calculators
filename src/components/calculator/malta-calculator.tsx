"use client";

import { useMemo, useState } from "react";
import {
  computeMtQuote,
  DEFAULT_MT_INPUT,
  MT_ADULT_CHILD_AGE,
  MT_AGE_BANDS,
  MT_BEDROOMS,
  MT_DEFAULT_ADULT_CHILD_AGE,
  MT_DEFAULT_CHILD_AGE,
  MT_DEFAULT_PARENT_AGE,
  MT_LICENSE,
  MT_MAX_ADULT_CHILDREN,
  MT_MAX_AGE,
  MT_MAX_CHILD_AGE,
  MT_MAX_CHILDREN,
  MT_MAX_PARENTS,
  MT_NOTES,
  MT_RATES,
  MT_ROUTES,
  mtFamilySize,
  mtInfoSections,
  mtInsuranceBand,
  mtPropertyAmount,
  type MtInput,
  type MtRoute,
} from "@/lib/calculators/malta";
import { money } from "@/lib/format";
import { MaltaFlag } from "@/components/flags";
import { MoneyInput, Segmented, Stepper } from "./controls";
import { CalculatorPage, InfoBox, PersonCount, PlanDescription, StepCard } from "./shell";

const eur = (n: number) => money(n, "EUR");

/** Age field for one family member, with the health insurance band it falls in. Below `min` is corrected on blur. */
function AgeInput({
  id,
  label,
  value,
  min = 0,
  max,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  min?: number;
  max: number;
  onChange: (v: number) => void;
}) {
  const band = mtInsuranceBand(value);
  return (
    <label htmlFor={id} className="flex flex-wrap items-center gap-2 text-xs text-muted">
      {label}
      <input
        id={id}
        type="text"
        inputMode="numeric"
        value={String(value)}
        onChange={(e) => {
          const digits = e.target.value.replace(/[^\d]/g, "").slice(0, 3);
          onChange(Math.min(digits ? Number(digits) : 0, max));
        }}
        onBlur={() => value < min && onChange(min)}
        className="h-9 w-16 rounded-lg bg-white px-2 text-center text-sm font-semibold text-ink tabular ring-1 ring-line outline-none focus:ring-2 focus:ring-royal/50"
      />
      <span>
        years · insurance {band.label} <strong className="text-ink">{eur(band.rate)}</strong>/yr
      </span>
    </label>
  );
}

type AgeListKey = "childAges" | "adultChildAges" | "parentAges";

/** A family group counted with a stepper, with one age field per member. */
function MemberGroup({
  label,
  hint,
  ages,
  max,
  defaultAge,
  minAge,
  maxAge,
  idPrefix,
  onChange,
}: {
  label: string;
  hint: string;
  ages: number[];
  max: number;
  defaultAge: number;
  minAge?: number;
  maxAge: number;
  idPrefix: string;
  onChange: (ages: number[]) => void;
}) {
  return (
    <li className="py-3 last:pb-0">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-ink">{label}</p>
          <p className="text-xs text-muted">{hint}</p>
        </div>
        <Stepper
          label={label}
          value={ages.length}
          max={max}
          onChange={(v) => onChange(v > ages.length ? [...ages, ...Array(v - ages.length).fill(defaultAge)] : ages.slice(0, v))}
        />
      </div>
      {ages.length > 0 && (
        <div className="mt-3 space-y-2 rounded-xl bg-canvas px-3 py-3">
          {ages.map((age, i) => (
            <AgeInput
              key={i}
              id={`${idPrefix}-${i + 1}`}
              label={`${label} ${i + 1} age`}
              value={age}
              min={minAge}
              max={maxAge}
              onChange={(v) => onChange(ages.map((a, j) => (j === i ? v : a)))}
            />
          ))}
        </div>
      )}
    </li>
  );
}

export function MaltaCalculator() {
  const [input, setInput] = useState<MtInput>(DEFAULT_MT_INPUT);
  const quote = useMemo(() => computeMtQuote(input), [input]);
  const size = mtFamilySize(input);
  const route = MT_ROUTES[input.route];
  const rent = input.route === "rent";
  const amount = mtPropertyAmount(input);
  const info = mtInfoSections(input);
  const setAges = (k: AgeListKey) => (ages: number[]) => setInput((s) => ({ ...s, [k]: ages }));
  const set = <K extends keyof MtInput>(k: K, v: MtInput[K]) => setInput((s) => ({ ...s, [k]: v }));
  const min = rent ? MT_RATES.minRent : MT_RATES.minPurchase;
  const entered = rent ? input.rent : input.purchasePrice;

  const family = [
    { label: "Main Applicant", count: 1 },
    { label: "Spouse", count: input.spouse },
    { label: "Child under 18", count: input.childAges.length },
    { label: "Adult Child (18–28)", count: input.adultChildAges.length },
    { label: "Parent / Parent-in-law", count: input.parentAges.length },
  ].filter((f) => f.count > 0);

  return (
    <CalculatorPage
      code="MT"
      title="Malta"
      subtitle={`Permanent Residence Programme (MPRP) · License No. ${MT_LICENSE} · Payment schedule calculator`}
      flag={<MaltaFlag className="h-14 w-[84px]" />}
      quote={quote}
      totalLabel="Total cost"
      caption={`${route.short} ${eur(amount)}${rent ? "/yr" : ""} · ${size} ${size === 1 ? "person" : "persons"}`}
      footnote="Figures follow the TEG Malta Residency Programme sheet. Amounts in EUR. Health insurance is approximate."
      notes={MT_NOTES}
      info={info}
      documentTitle={`Payment Schedule — Malta Permanent Residence Programme (License No. ${MT_LICENSE})`}
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
            <p className="mt-2 text-xs text-muted">The first year&apos;s rent is included in section C (after approval).</p>
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
              <AgeInput id="mt-main-age" label="Age" value={input.mainAge} max={MT_MAX_AGE} onChange={(v) => set("mainAge", v)} />
            </div>
            <Stepper label="Main Applicant" value={1} locked onChange={() => {}} />
          </li>
          <li className="flex flex-wrap items-center justify-between gap-4 py-3">
            <div className="space-y-2">
              <p className="text-sm font-semibold text-ink">Spouse</p>
              {input.spouse > 0 && <AgeInput id="mt-spouse-age" label="Age" value={input.spouseAge} max={MT_MAX_AGE} onChange={(v) => set("spouseAge", v)} />}
            </div>
            <Stepper label="Spouse" value={input.spouse} max={1} onChange={(v) => set("spouse", v as 0 | 1)} />
          </li>
          <MemberGroup
            label="Child"
            hint="Under 18 · free — no charges by the Authority."
            ages={input.childAges}
            max={MT_MAX_CHILDREN}
            defaultAge={MT_DEFAULT_CHILD_AGE}
            maxAge={MT_MAX_CHILD_AGE}
            idPrefix="mt-child-age"
            onChange={setAges("childAges")}
          />
          <MemberGroup
            label="Adult Child"
            hint={`18–28, unmarried and financially dependent · ${eur(MT_RATES.adultChild)} each after approval.`}
            ages={input.adultChildAges}
            max={MT_MAX_ADULT_CHILDREN}
            defaultAge={MT_DEFAULT_ADULT_CHILD_AGE}
            minAge={MT_ADULT_CHILD_AGE.min}
            maxAge={MT_ADULT_CHILD_AGE.max}
            idPrefix="mt-adult-child-age"
            onChange={setAges("adultChildAges")}
          />
          <MemberGroup
            label="Parent"
            hint={`Parents and parents-in-law, financially dependent · ${eur(MT_RATES.parent)} each after approval.`}
            ages={input.parentAges}
            max={MT_MAX_PARENTS}
            defaultAge={MT_DEFAULT_PARENT_AGE}
            maxAge={MT_MAX_AGE}
            idPrefix="mt-parent-age"
            onChange={setAges("parentAges")}
          />
        </ul>
        <InfoBox id="mt-family">
          Spouse and children under 18 add no government fees; parents and adult children add{" "}
          <strong className="text-ink">{eur(MT_RATES.parent)}</strong> each. Per person: residency card{" "}
          <strong className="text-ink">{eur(MT_RATES.residencyCard)}</strong> (5 years) and health insurance by each
          member&apos;s age, approx. per year — {MT_AGE_BANDS.map((b) => `${b.label} ${eur(b.rate)}`).join(", ")}. The final
          insurance amount will be quoted by the Maltese insurance company.
        </InfoBox>
      </StepCard>

      <StepCard step={4} title="Conditions">
        <div className="space-y-5">
          {info.map((section) => (
            <div key={section.title}>
              <p className="mb-2 text-sm font-semibold text-ink">{section.title}</p>
              {section.note && <p className="mb-2 text-xs text-muted">{section.note}</p>}
              <ul className="space-y-2 text-sm text-muted">
                {section.rows.map((r) => (
                  <li key={r.label} className="flex gap-2">
                    <span className="mt-2 size-1 shrink-0 rounded-full bg-royal" />
                    {r.label}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </StepCard>
    </CalculatorPage>
  );
}
