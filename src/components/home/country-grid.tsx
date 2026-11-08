"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { ArrowUpRight, Clock } from "lucide-react";
import type { CalculatorMeta } from "@/lib/calculators/types";
import { CountryMonogram, SknFlag } from "@/components/flags";

const FLAGS: Record<string, React.ComponentType<{ className?: string }>> = {
  "st-kitts-nevis": SknFlag,
};

export function CountryGrid({ items }: { items: CalculatorMeta[] }) {
  return (
    <motion.ul
      className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3"
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, margin: "-60px" }}
      transition={{ staggerChildren: 0.07 }}
    >
      {items.map((c) => (
        <motion.li
          key={c.slug}
          variants={{ hidden: { opacity: 0, y: 28, scale: 0.98 }, show: { opacity: 1, y: 0, scale: 1 } }}
        >
          {c.status === "live" ? <LiveCard c={c} /> : <SoonCard c={c} />}
        </motion.li>
      ))}
    </motion.ul>
  );
}

function Programs({ c }: { c: CalculatorMeta }) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {c.programs.map((p) => (
        <span key={p} className="rounded-md bg-canvas px-2 py-0.5 font-display text-[11px] font-medium text-ink/70 ring-1 ring-line">
          {p}
        </span>
      ))}
    </div>
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
        <p className="mt-6 font-display text-xs uppercase tracking-[0.16em] text-muted">{c.region}</p>
        <h3 className="mt-1 text-xl font-bold text-ink">{c.country}</h3>
        <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{c.blurb}</p>
        <div className="mt-6 flex items-end justify-between gap-3">
          <Programs c={c} />
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-royal text-white transition-transform duration-300 group-hover:rotate-45">
            <ArrowUpRight className="size-5" />
          </span>
        </div>
      </Link>
    </motion.div>
  );
}

function SoonCard({ c }: { c: CalculatorMeta }) {
  return (
    <div className="flex h-full flex-col rounded-2xl border border-dashed border-line bg-white/60 p-6">
      <div className="flex items-start justify-between">
        <CountryMonogram code={c.shortName} className="h-12 w-[72px] rounded-lg opacity-60" />
        <span className="flex items-center gap-1 rounded-full bg-canvas px-2.5 py-1 text-[11px] font-semibold text-muted ring-1 ring-line">
          <Clock className="size-3" /> Coming soon
        </span>
      </div>
      <p className="mt-6 font-display text-xs uppercase tracking-[0.16em] text-muted">{c.region}</p>
      <h3 className="mt-1 text-xl font-bold text-ink/60">{c.country}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{c.blurb}</p>
      <div className="mt-6 opacity-70">
        <Programs c={c} />
      </div>
    </div>
  );
}
