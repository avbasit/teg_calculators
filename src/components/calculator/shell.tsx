"use client";

import { Children, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Check, ChevronRight, Copy, Info, Pencil, Printer, RotateCcw, Users } from "lucide-react";
import { stageLetter, type Quote } from "@/lib/calculators/types";
import { money } from "@/lib/format";
import { AnimatedNumber, MoneyInput, type FeeField } from "./controls";
import { StageCard } from "./breakdown";
import { QuoteDocument } from "./quote-document";

/* ---------- Quote date & reference (created in the browser, never during prerender) ---------- */

const stamps = new Map<string, { date: string; reference: string }>();
const noopSubscribe = () => () => {};
const SERVER_STAMP = { date: "", reference: "" };

function getStamp(code: string) {
  let s = stamps.get(code);
  if (!s) {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    s = {
      date: d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
      reference: `TEG-${code}-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`,
    };
    stamps.set(code, s);
  }
  return s;
}

function useQuoteStamp(code: string) {
  return useSyncExternalStore(noopSubscribe, () => getStamp(code), () => SERVER_STAMP);
}

/* ---------- Building blocks ---------- */

/** Colours for payment-stage segments on the navy summary card. */
const STAGE_COLORS = ["#7dd3fc", "#3b82f6", "#a5b4fc", "#5eead4", "#fcd34d"];

export function StepCard({
  step,
  title,
  children,
  aside,
}: {
  step: number;
  title: string;
  children: React.ReactNode;
  aside?: React.ReactNode;
}) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.05 * step }}
      className="rounded-2xl bg-white p-5 shadow-card ring-1 ring-line sm:p-6"
    >
      <div className="mb-5 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <span className="flex size-7 items-center justify-center rounded-full bg-royal-soft font-display text-xs font-bold text-royal">
            {step}
          </span>
          <h2 className="text-base font-bold text-ink">{title}</h2>
        </div>
        {aside}
      </div>
      {children}
    </motion.section>
  );
}

export function PersonCount({ size }: { size: number }) {
  return (
    <span className="flex items-center gap-1.5 rounded-full bg-brand px-3 py-1 text-xs font-bold text-white">
      <Users className="size-3.5" />
      <AnimatedNumber value={size} currency={null} /> {size === 1 ? "person" : "persons"}
    </span>
  );
}

/** Description under a plan switch that cross-fades when the plan changes. */
export function PlanDescription({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.p
        key={id}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -6 }}
        transition={{ duration: 0.18 }}
        className="mt-4 flex gap-2 text-sm leading-relaxed text-muted"
      >
        <Info className="mt-0.5 size-4 shrink-0 text-royal" />
        <span>{children}</span>
      </motion.p>
    </AnimatePresence>
  );
}

/** Small grey explainer box that cross-fades between variants. */
export function InfoBox({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.p
        key={id}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="mt-5 rounded-xl bg-canvas px-4 py-3 text-xs leading-relaxed text-muted"
      >
        {children}
      </motion.p>
    </AnimatePresence>
  );
}

/* ---------- Page ---------- */

export interface CalculatorPageProps {
  /** Short code used in the quote reference, e.g. "SKN". */
  code: string;
  /** Breadcrumb + heading, e.g. "St. Kitts & Nevis". */
  title: string;
  subtitle: string;
  flag: React.ReactNode;
  quote: Quote;
  /** "Total cost" / "Grand total" — letters are appended automatically. */
  totalLabel: string;
  /** Line under the total, e.g. "PBO · 2 persons". */
  caption: string;
  footnote: string;
  notes: string[];
  documentTitle: string;
  planLabel: string;
  family: { label: string; count: number }[];
  onReset: () => void;
  /**
   * TEG professional fee — REQUIRED for every calculator so it can always be
   * edited. Each field's `id` must match the quote line it controls.
   */
  tegFee: FeeField[];
  /** Other negotiable fees (legal, authorized agent…), shown in their own groups. */
  otherFees?: { title: string; fields: FeeField[] }[];
  /** Input cards, numbered from step 2 (step 1 is the client card). The fees card follows them. */
  children: React.ReactNode;
}

function FeesCard({
  step,
  currency,
  groups,
}: {
  step: number;
  currency: Quote["currency"];
  groups: { title: string; fields: FeeField[] }[];
}) {
  return (
    <StepCard step={step} title="Fees">
      <div className="space-y-6">
        {groups.map((g) => (
          <div key={g.title}>
            <p className="mb-3 font-display text-[11px] font-medium uppercase tracking-[0.16em] text-muted">{g.title}</p>
            <div className="grid gap-5 sm:grid-cols-2">
              {g.fields.map((f) => (
                <MoneyInput key={f.id} currency={currency} label={f.label} hint={f.hint} value={f.value} onChange={f.onChange} />
              ))}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-5 flex items-center gap-2 text-xs text-muted">
        <Pencil className="size-3.5 text-royal" />
        These fees can also be edited directly in the breakdown below.
      </p>
    </StepCard>
  );
}

export function CalculatorPage(p: CalculatorPageProps) {
  const [clientName, setClientName] = useState("");
  const [copied, setCopied] = useState(false);
  const stamp = useQuoteStamp(p.code);
  const { quote } = p;
  const fmt = (n: number) => money(n, quote.currency);
  const letters = quote.stages.map((_, i) => stageLetter(i));
  const totalTitle = `${p.totalLabel} (${letters.join(" + ")})`;
  const feeGroups = [{ title: "TEG professional fee", fields: p.tegFee }, ...(p.otherFees ?? [])];
  const feeMap = Object.fromEntries(feeGroups.flatMap((g) => g.fields).map((f) => [f.id, f]));
  const feesStep = Children.toArray(p.children).length + 2;

  async function copySummary() {
    const text = [
      `${p.title} — ${p.planLabel}`,
      ...(clientName ? [`Client: ${clientName}`] : []),
      `Family: ${p.family.map((f) => `${f.count} × ${f.label}`).join(", ")}`,
      "",
      ...quote.stages.flatMap((s, i) => [
        `${letters[i]}. ${s.title.toUpperCase()}`,
        ...s.lines.map((l) => `  ${l.label}${l.detail ? ` (${l.detail})` : ""}: ${fmt(l.total)}`),
        `  ${s.subtotalLabel} (${letters[i]}): ${fmt(s.subtotal)}`,
        "",
      ]),
      `${totalTitle.toUpperCase()}: ${fmt(quote.total)}`,
    ].join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable — ignore */
    }
  }

  function reset() {
    p.onReset();
    setClientName("");
  }

  return (
    <>
      <div className="print:hidden">
        {/* Page heading */}
        <div className="relative overflow-hidden border-b border-line bg-white">
          <div className="absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l from-royal-soft/70 to-transparent" />
          <div className="relative mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
            <nav className="flex items-center gap-1.5 text-xs font-semibold text-muted">
              <Link href="/" className="hover:text-royal">
                Calculators
              </Link>
              <ChevronRight className="size-3.5" />
              <span className="text-ink">{p.title}</span>
            </nav>
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <motion.div
                initial={{ opacity: 0, rotate: -8, scale: 0.8 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                className="overflow-hidden rounded-xl shadow-card ring-1 ring-black/5"
              >
                {p.flag}
              </motion.div>
              <div>
                <motion.h1
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-2xl font-bold tracking-tight text-ink sm:text-3xl"
                >
                  {p.title}
                </motion.h1>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="text-sm text-muted">
                  {p.subtitle}
                </motion.p>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:px-8">
          {/* Inputs + breakdown */}
          <div className="space-y-6">
            <StepCard step={1} title="Client">
              <div className="grid gap-4 sm:grid-cols-[1fr_auto]">
                <label className="block">
                  <span className="text-sm font-semibold text-ink">Client name</span>
                  <input
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    placeholder="e.g. Mr. Ahmed Khan"
                    className="mt-2 h-11 w-full rounded-xl px-3.5 text-sm font-semibold text-ink ring-1 ring-line outline-none transition placeholder:font-normal placeholder:text-muted/60 focus:ring-2 focus:ring-royal/50"
                  />
                </label>
                <div className="text-sm sm:text-right">
                  <span className="font-semibold text-ink">Quote</span>
                  <p className="mt-2 font-mono text-xs leading-5 text-muted">
                    {stamp.reference}
                    <br />
                    {stamp.date}
                  </p>
                </div>
              </div>
            </StepCard>

            {p.children}

            <FeesCard step={feesStep} currency={quote.currency} groups={feeGroups} />

            <div className="pt-4">
              <p className="font-display text-xs font-medium uppercase tracking-[0.2em] text-royal">Payment schedule</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-ink">Breakdown</h2>
            </div>
            <AnimatePresence initial={false}>
              {quote.stages.map((s, i) => (
                <motion.div key={s.id} layout exit={{ opacity: 0, scale: 0.98 }}>
                  <StageCard stage={s} letter={letters[i]} index={i} currency={quote.currency} fees={feeMap} />
                </motion.div>
              ))}
            </AnimatePresence>

            <section className="rounded-2xl border border-line bg-cream p-5 sm:p-6">
              <h3 className="font-bold text-ink">Notes</h3>
              <ul className="mt-3 space-y-2 text-sm text-muted">
                {p.notes.map((n) => (
                  <li key={n} className="flex gap-2">
                    <span className="mt-2 size-1 shrink-0 rounded-full bg-royal" />
                    {n}
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* Sticky summary */}
          <aside id="summary" className="scroll-mt-20 lg:sticky lg:top-24 lg:self-start">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              className="relative overflow-hidden rounded-3xl bg-brand-night p-6 text-white shadow-lift"
            >
              <div className="absolute -right-16 -top-16 size-48 rounded-full bg-royal/40 blur-3xl" />
              <div className="relative">
                <p className="font-display text-xs font-medium uppercase tracking-[0.2em] text-white/60">{totalTitle}</p>
                <p className="mt-2 text-4xl font-bold tracking-tight">
                  <AnimatedNumber value={quote.total} currency={quote.currency} />
                </p>
                <p className="mt-1 text-sm text-white/60">{p.caption}</p>

                <div className="mt-6 flex h-2.5 gap-0.5 overflow-hidden rounded-full bg-white/10">
                  {quote.stages.map((s, i) => (
                    <motion.div
                      key={s.id}
                      className="h-full first:rounded-l-full last:rounded-r-full"
                      style={{ backgroundColor: STAGE_COLORS[i % STAGE_COLORS.length] }}
                      initial={false}
                      animate={{ width: `${Math.max(quote.total ? (s.subtotal / quote.total) * 100 : 0, 1.5)}%` }}
                    />
                  ))}
                </div>

                <dl className="mt-5 space-y-3 text-sm">
                  <AnimatePresence initial={false}>
                    {quote.stages.map((s, i) => (
                      <motion.div
                        key={s.id}
                        layout
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center justify-between gap-3"
                      >
                        <dt className="flex items-center gap-2 text-white/75">
                          <span className="size-2.5 rounded-sm" style={{ backgroundColor: STAGE_COLORS[i % STAGE_COLORS.length] }} />
                          {letters[i]} · {s.short}
                        </dt>
                        <dd className="font-semibold">
                          <AnimatedNumber value={s.subtotal} currency={quote.currency} />
                        </dd>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </dl>

                <div className="mt-6 grid grid-cols-2 gap-2">
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={() => window.print()}
                    className="col-span-2 flex h-11 items-center justify-center gap-2 rounded-xl bg-white text-sm font-bold text-brand-night transition hover:bg-royal-soft"
                  >
                    <Printer className="size-4" /> Print / Save as PDF
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={copySummary}
                    className="flex h-10 items-center justify-center gap-2 rounded-xl bg-white/10 text-sm font-semibold transition hover:bg-white/15"
                  >
                    <AnimatePresence mode="wait" initial={false}>
                      <motion.span
                        key={copied ? "y" : "n"}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="flex items-center gap-2"
                      >
                        {copied ? <Check className="size-4 text-emerald-300" /> : <Copy className="size-4" />}
                        {copied ? "Copied" : "Copy"}
                      </motion.span>
                    </AnimatePresence>
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.97 }}
                    onClick={reset}
                    className="flex h-10 items-center justify-center gap-2 rounded-xl bg-white/10 text-sm font-semibold transition hover:bg-white/15"
                  >
                    <RotateCcw className="size-4" /> Reset
                  </motion.button>
                </div>
              </div>
            </motion.div>
            <p className="mt-3 px-2 text-xs leading-relaxed text-muted">{p.footnote}</p>
          </aside>
        </div>

        {/* Mobile: keep the running total in view while editing */}
        <motion.div
          initial={{ y: 80 }}
          animate={{ y: 0 }}
          transition={{ delay: 0.4 }}
          className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-brand-night/95 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] text-white backdrop-blur lg:hidden"
        >
          <a href="#summary" className="mx-auto flex max-w-xl items-center justify-between gap-4">
            <span>
              <span className="block font-display text-[10px] uppercase tracking-[0.18em] text-white/60">{totalTitle}</span>
              <span className="text-xl font-bold">
                <AnimatedNumber value={quote.total} currency={quote.currency} />
              </span>
            </span>
            <span className="rounded-full bg-white px-4 py-2 text-xs font-bold text-brand-night">View summary</span>
          </a>
        </motion.div>
        <div className="h-20 lg:hidden" />
      </div>

      <QuoteDocument
        title={p.documentTitle}
        programLabel={p.planLabel}
        clientName={clientName}
        date={stamp.date}
        reference={stamp.reference}
        family={p.family}
        quote={quote}
        notes={p.notes}
        totalLabel={p.totalLabel}
      />
    </>
  );
}
