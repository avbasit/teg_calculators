"use client";

import { useState } from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "motion/react";
import { ArrowUpRight, Ban, Clock, PauseCircle } from "lucide-react";
import type { CalculatorMeta, CalculatorStatus } from "@/lib/calculators/types";
import { CountryMonogram, LatviaFlag, SknFlag, StpFlag } from "@/components/flags";

const FLAGS: Record<string, React.ComponentType<{ className?: string }>> = {
  "st-kitts-nevis": SknFlag,
  latvia: LatviaFlag,
  "sao-tome-and-principe": StpFlag,
};

const ALL = "All";

export function CountryGrid({ items, filterable = false, id }: { items: CalculatorMeta[]; filterable?: boolean; id: string }) {
  const regions = [ALL, ...Array.from(new Set(items.map((c) => c.region)))];
  const [region, setRegion] = useState(ALL);
  const shown = region === ALL ? items : items.filter((c) => c.region === region);

  return (
    <>
      {filterable && (
        <div className="-mx-4 mb-6 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0" role="tablist" aria-label="Filter by region">
          {regions.map((r) => {
            const active = r === region;
            const count = r === ALL ? items.length : items.filter((c) => c.region === r).length;
            return (
              <button
                key={r}
                role="tab"
                aria-selected={active}
                onClick={() => setRegion(r)}
                className={`relative shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                  active ? "text-white" : "text-ink/70 ring-1 ring-line hover:text-royal"
                }`}
              >
                {active && (
                  <motion.span
                    layoutId={`region-pill-${id}`}
                    className="absolute inset-0 rounded-full bg-brand"
                    transition={{ type: "spring", stiffness: 420, damping: 34 }}
                  />
                )}
                <span className="relative">
                  {r} <span className={active ? "text-white/60" : "text-muted"}>{count}</span>
                </span>
              </button>
            );
          })}
        </div>
      )}

      <motion.ul
        layout
        className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, margin: "-60px" }}
        transition={{ staggerChildren: 0.05 }}
      >
        <AnimatePresence mode="popLayout" initial={false}>
          {shown.map((c) => (
            <motion.li
              key={c.slug}
              layout
              variants={{ hidden: { opacity: 0, y: 28, scale: 0.98 }, show: { opacity: 1, y: 0, scale: 1 } }}
              exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.15 } }}
            >
              {c.status === "live" ? <LiveCard c={c} /> : <UpcomingCard c={c} />}
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>
    </>
  );
}

function Tags({ c }: { c: CalculatorMeta }) {
  if (c.tags.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {c.tags.map((p) => (
        <span key={p} className="rounded-md bg-canvas px-2 py-0.5 font-display text-[11px] font-medium text-ink/70 ring-1 ring-line">
          {p}
        </span>
      ))}
    </div>
  );
}

function Heading({ c, muted = false }: { c: CalculatorMeta; muted?: boolean }) {
  return (
    <>
      <p className="mt-6 font-display text-xs uppercase tracking-[0.16em] text-muted">{c.region}</p>
      <h3 className={`mt-1 text-xl font-bold ${muted ? "text-ink/60" : "text-ink"}`}>{c.country}</h3>
      {c.programme && <p className={`text-sm font-semibold ${muted ? "text-royal/60" : "text-royal"}`}>{c.programme}</p>}
    </>
  );
}

function LiveCard({ c }: { c: CalculatorMeta }) {
  const Flag = FLAGS[c.slug];
  return (
    <motion.div whileHover={{ y: -6 }} whileTap={{ scale: 0.99 }} className="h-full">
      <Link
        href={`/calculators/${c.slug}`}
        className="group relative flex h-full flex-col overflow-hidden rounded-2xl bg-white p-6 shadow-card ring-1 ring-line transition-shadow duration-300 hover:shadow-lift"
      >
        <div className="absolute inset-x-0 top-0 h-1 origin-left scale-x-0 bg-gradient-to-r from-royal to-brand transition-transform duration-500 group-hover:scale-x-100" />
        <div className="flex items-start justify-between">
          <div className="overflow-hidden rounded-lg shadow-sm ring-1 ring-black/5">
            {Flag ? <Flag className="h-12 w-[72px]" /> : <CountryMonogram code={c.shortName} className="h-12 w-[72px]" />}
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold text-emerald-700 ring-1 ring-emerald-200">
            <span className="size-1.5 animate-pulse rounded-full bg-emerald-500" /> Live
          </span>
        </div>
        <Heading c={c} />
        <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{c.blurb}</p>
        <div className="mt-6 flex items-end justify-between gap-3">
          <Tags c={c} />
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-royal text-white transition-transform duration-300 group-hover:rotate-45">
            <ArrowUpRight className="size-5" />
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

const STATUS_BADGE: Record<Exclude<CalculatorStatus, "live">, { label: string; icon: React.ComponentType<{ className?: string }>; cls: string }> = {
  soon: { label: "Coming soon", icon: Clock, cls: "bg-canvas text-muted ring-line" },
  paused: { label: "Paused", icon: PauseCircle, cls: "bg-amber-50 text-amber-700 ring-amber-200" },
  discontinued: { label: "Discontinued", icon: Ban, cls: "bg-rose-50 text-rose-700 ring-rose-200" },
};

function UpcomingCard({ c }: { c: CalculatorMeta }) {
  const badge = STATUS_BADGE[c.status as Exclude<CalculatorStatus, "live">];
  const Icon = badge.icon;
  const closed = c.status === "paused" || c.status === "discontinued";
  return (
    <div className={`flex h-full flex-col rounded-2xl border border-dashed border-line bg-white/60 p-6 ${closed ? "opacity-70" : ""}`}>
      <div className="flex items-start justify-between">
        <CountryMonogram code={c.shortName} className="h-12 w-[72px] rounded-lg opacity-60" />
        <span className={`flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${badge.cls}`}>
          <Icon className="size-3" /> {badge.label}
        </span>
      </div>
      <Heading c={c} muted />
      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{c.blurb}</p>
      <div className="mt-6 opacity-70">
        <Tags c={c} />
      </div>
    </div>
  );
}
