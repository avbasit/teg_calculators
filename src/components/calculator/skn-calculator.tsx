"use client";

import { useMemo, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { Check, ChevronRight, Copy, Info, Printer, RotateCcw, Users } from "lucide-react";
import {
  computeSknQuote,
  DEFAULT_SKN_INPUT,
  familySize,
  SKN_MEMBERS,
  SKN_NOTES,
  SKN_PROGRAMS,
  type SknInput,
  type SknProgram,
} from "@/lib/calculators/skn";
import { usd } from "@/lib/format";
import { SknFlag } from "@/components/flags";
import { AnimatedNumber, MoneyInput, Segmented, Stepper, Switch } from "./controls";
import { StageCard } from "./breakdown";
import { QuoteDocument } from "./quote-document";

/* Quote date & reference are created in the browser (never during prerender). */
let quoteStamp: { date: string; reference: string } | null = null;
const noopSubscribe = () => () => {};
function getQuoteStamp() {
  if (!quoteStamp) {
    const d = new Date();
    const pad = (n: number) => String(n).padStart(2, "0");
    quoteStamp = {
      date: d.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }),
      reference: `TEG-SKN-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}`,
    };
  }
  return quoteStamp;
}
const SERVER_STAMP = { date: "", reference: "" };

function Card({ step, title, children, aside }: { step: number; title: string; children: React.ReactNode; aside?: React.ReactNode }) {
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

export function SknCalculator() {
  const [input, setInput] = useState<SknInput>(DEFAULT_SKN_INPUT);
  const [clientName, setClientName] = useState("");
  const [copied, setCopied] = useState(false);
  const stamp = useSyncExternalStore(noopSubscribe, getQuoteStamp, () => SERVER_STAMP);

  const quote = useMemo(() => computeSknQuote(input), [input]);
  const size = familySize(input.family);
  const [first, final] = quote.stages;
  const firstShare = quote.total ? (first.subtotal / quote.total) * 100 : 0;

  const set = <K extends keyof SknInput>(k: K, v: SknInput[K]) => setInput((s) => ({ ...s, [k]: v }));
  const program = SKN_PROGRAMS[input.program];
  const programLabel = `${program.name} (${program.short})`;

  const familyRows = SKN_MEMBERS.filter((m) => input.family[m.key] > 0).map((m) => ({
    label: m.label,
    count: input.family[m.key],
  }));

  async function copySummary() {
    const lines = [
      `St. Kitts & Nevis — ${programLabel}`,
      ...(clientName ? [`Client: ${clientName}`] : []),
      `Family: ${familyRows.map((f) => `${f.count} × ${f.label}`).join(", ")}`,
      "",
      ...quote.stages.flatMap((s) => [
        `${s.title.toUpperCase()}`,
        ...s.lines.map((l) => `  ${l.label}${l.detail ? ` (${l.detail})` : ""}: ${usd(l.total)}`),
        `  ${s.subtotalLabel}: ${usd(s.subtotal)}`,
        "",
      ]),
      `TOTAL COST (A + B): ${usd(quote.total)}`,
    ];
    try {
      await navigator.clipboard.writeText(lines.join("\n"));
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      /* clipboard unavailable — ignore */
    }
  }

  function reset() {
    setInput(DEFAULT_SKN_INPUT);
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
              <span className="text-ink">St. Kitts &amp; Nevis</span>
            </nav>
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <motion.div
                initial={{ opacity: 0, rotate: -8, scale: 0.8 }}
                animate={{ opacity: 1, rotate: 0, scale: 1 }}
                className="overflow-hidden rounded-xl shadow-card ring-1 ring-black/5"
              >
                <SknFlag className="h-14 w-[84px]" />
              </motion.div>
              <div>
                <motion.h1
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="text-2xl font-bold tracking-tight text-ink sm:text-3xl"
                >
                  St. Kitts &amp; Nevis
                </motion.h1>
                <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="text-sm text-muted">
                  Citizenship by Investment · Payment schedule calculator
                </motion.p>
              </div>
            </div>
          </div>
        </div>

        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_380px] lg:px-8">
          {/* Inputs + breakdown */}
          <div className="space-y-6">
            <Card step={1} title="Client">
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
            </Card>

            <Card step={2} title="Investment plan">
              <Segmented<SknProgram>
                id="skn-program"
                value={input.program}
                onChange={(v) => set("program", v)}
                options={(Object.keys(SKN_PROGRAMS) as SknProgram[]).map((k) => ({
                  value: k,
                  label: SKN_PROGRAMS[k].short,
                  sub: SKN_PROGRAMS[k].name,
                }))}
              />
              <AnimatePresence mode="wait" initial={false}>
                <motion.p
                  key={input.program}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18 }}
                  className="mt-4 flex gap-2 text-sm leading-relaxed text-muted"
                >
                  <Info className="mt-0.5 size-4 shrink-0 text-royal" />
                  {program.description}
                </motion.p>
              </AnimatePresence>
            </Card>

            <Card
              step={3}
              title="Family composition"
              aside={
                <span className="flex items-center gap-1.5 rounded-full bg-brand px-3 py-1 text-xs font-bold text-white">
                  <Users className="size-3.5" />
                  <AnimatedNumber value={size} currency={false} /> {size === 1 ? "person" : "persons"}
                </span>
              }
            >
              <ul className="divide-y divide-line/70">
                {SKN_MEMBERS.map((m) => (
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
              <p className="mt-5 rounded-xl bg-canvas px-4 py-3 text-xs leading-relaxed text-muted">
                The base contribution of <strong className="text-ink">US$250,000</strong> covers up to 4 persons. Each
                additional dependant under 18 adds <strong className="text-ink">US$25,000</strong>; each additional dependant
                18+ adds <strong className="text-ink">US$50,000</strong>.
              </p>
            </Card>

            <Card step={4} title="Fees & options">
              <div className="grid gap-5 sm:grid-cols-3">
                <MoneyInput label="Authorized agent fee" hint="At submission" value={input.authorizedAgentFee} onChange={(v) => set("authorizedAgentFee", v)} />
                <MoneyInput label="TEG retainer" hint="Upon signing" value={input.retainerOnSigning} onChange={(v) => set("retainerOnSigning", v)} />
                <MoneyInput label="TEG retainer" hint="Upon approval" value={input.retainerOnApproval} onChange={(v) => set("retainerOnApproval", v)} />
              </div>
              <div className="mt-6 flex items-center justify-between gap-4 rounded-xl bg-canvas px-4 py-3.5">
                <div>
                  <p className="text-sm font-semibold text-ink">Application includes a benefactor</p>
                  <p className="text-xs text-muted">Adds US$10,000 CIU due diligence, US$300 bank due diligence and US$250 processing.</p>
                </div>
                <Switch label="Includes benefactor" checked={input.includesBenefactor} onChange={(v) => set("includesBenefactor", v)} />
              </div>
            </Card>

            <div className="pt-4">
              <p className="font-display text-xs font-medium uppercase tracking-[0.2em] text-royal">Payment schedule</p>
              <h2 className="mt-1 text-2xl font-bold tracking-tight text-ink">Breakdown</h2>
            </div>
            {quote.stages.map((s, i) => (
              <StageCard key={s.id} stage={s} letter={["A", "B"][i]} index={i} />
            ))}

            <section className="rounded-2xl border border-line bg-cream p-5 sm:p-6">
              <h3 className="font-bold text-ink">Notes</h3>
              <ul className="mt-3 space-y-2 text-sm text-muted">
                {SKN_NOTES.map((n) => (
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
                <p className="font-display text-xs font-medium uppercase tracking-[0.2em] text-white/60">Total cost (A + B)</p>
                <p className="mt-2 text-4xl font-bold tracking-tight">
                  <AnimatedNumber value={quote.total} />
                </p>
                <p className="mt-1 text-sm text-white/60">
                  {program.short} · {size} {size === 1 ? "person" : "persons"}
                </p>

                <div className="mt-6 flex h-2.5 overflow-hidden rounded-full bg-white/10">
                  <motion.div className="h-full bg-sky-300" animate={{ width: `${Math.max(firstShare, 2)}%` }} />
                  <motion.div className="h-full flex-1 bg-royal" />
                </div>

                <dl className="mt-5 space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <dt className="flex items-center gap-2 text-white/75">
                      <span className="size-2.5 rounded-sm bg-sky-300" /> A · At file submission
                    </dt>
                    <dd className="font-semibold">
                      <AnimatedNumber value={first.subtotal} />
                    </dd>
                  </div>
                  <div className="flex items-center justify-between">
                    <dt className="flex items-center gap-2 text-white/75">
                      <span className="size-2.5 rounded-sm bg-royal" /> B · After approval
                    </dt>
                    <dd className="font-semibold">
                      <AnimatedNumber value={final.subtotal} />
                    </dd>
                  </div>
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
            <p className="mt-3 px-2 text-xs leading-relaxed text-muted">
              Figures follow the TEG SKN pricing workbook (18 Oct 2026). Amounts in USD, exclusive of VAT.
            </p>
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
              <span className="block font-display text-[10px] uppercase tracking-[0.18em] text-white/60">Total (A + B)</span>
              <span className="text-xl font-bold">
                <AnimatedNumber value={quote.total} />
              </span>
            </span>
            <span className="rounded-full bg-white px-4 py-2 text-xs font-bold text-brand-night">View summary</span>
          </a>
        </motion.div>
        <div className="h-20 lg:hidden" />
      </div>

      <QuoteDocument
        title="Payment Schedule — St. Kitts & Nevis (SKN)"
        programLabel={programLabel}
        clientName={clientName}
        date={stamp.date}
        reference={stamp.reference}
        family={familyRows}
        quote={quote}
        notes={SKN_NOTES}
      />
    </>
  );
}
