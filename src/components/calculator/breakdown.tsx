"use client";

import { AnimatePresence, motion } from "motion/react";
import { Clock } from "lucide-react";
import type { PaymentStage } from "@/lib/calculators/types";
import { money, num, type Currency } from "@/lib/format";
import { AnimatedNumber } from "./controls";

export function StageCard({
  stage,
  letter,
  index,
  currency,
}: {
  stage: PaymentStage;
  letter: string;
  index: number;
  currency: Currency;
}) {
  return (
    <motion.section
      layout="position"
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ delay: index * 0.06 }}
      className="overflow-hidden rounded-2xl bg-white shadow-card ring-1 ring-line"
    >
      <header className="flex items-center justify-between gap-4 border-b border-line bg-gradient-to-r from-royal-soft to-white px-5 py-4 sm:px-6">
        <div className="flex items-center gap-3">
          <span className="flex size-9 items-center justify-center rounded-xl bg-brand font-display text-sm font-bold text-white">
            {letter}
          </span>
          <h3 className="font-bold uppercase tracking-wide text-ink">{stage.title}</h3>
        </div>
      </header>

      <div className="hidden grid-cols-[1fr_110px_56px_120px] gap-3 px-6 pt-4 font-display text-[11px] font-medium uppercase tracking-[0.14em] text-muted sm:grid">
        <span>Particulars</span>
        <span className="text-right">Fee</span>
        <span className="text-center">×</span>
        <span className="text-right">Total</span>
      </div>

      <motion.ul layout className="divide-y divide-line/70 px-5 pb-2 sm:px-6">
        <AnimatePresence initial={false}>
          {stage.lines.map((l) => (
            <motion.li
              key={l.id}
              layout
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ type: "spring", stiffness: 380, damping: 36 }}
              className="overflow-hidden"
            >
              <div className="grid grid-cols-[1fr_auto] gap-x-3 gap-y-0.5 py-3 text-sm sm:grid-cols-[1fr_110px_56px_120px] sm:items-center">
                <div>
                  <p className="font-semibold text-ink">{l.label}</p>
                  {(l.detail || l.timeline) && (
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
                      {l.detail && <span>{l.detail}</span>}
                      {l.timeline && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-royal-soft px-2 py-0.5 text-[11px] font-medium text-royal">
                          <Clock className="size-3" />
                          {l.timeline}
                        </span>
                      )}
                    </p>
                  )}
                </div>
                <span className="hidden text-right text-muted tabular sm:block">{money(l.unit, currency)}</span>
                <span className="hidden text-center text-muted tabular sm:block">{num(l.qty)}</span>
                <span className="text-right font-semibold text-ink tabular">
                  <span className="mr-2 text-xs font-normal text-muted sm:hidden">
                    {money(l.unit, currency)} × {l.qty}
                  </span>
                  {money(l.total, currency)}
                </span>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>

      <footer className="flex items-center justify-between border-t border-line bg-canvas px-5 py-4 sm:px-6">
        <span className="font-display text-xs font-bold uppercase tracking-[0.14em] text-ink">
          {stage.subtotalLabel} ({letter})
        </span>
        <span className="text-lg font-bold text-brand">
          <AnimatedNumber value={stage.subtotal} currency={currency} />
        </span>
      </footer>
    </motion.section>
  );
}
