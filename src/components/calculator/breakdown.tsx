"use client";

import { AnimatePresence, motion } from "motion/react";
import type { PaymentStage } from "@/lib/calculators/types";
import { num, usd } from "@/lib/format";
import { AnimatedNumber } from "./controls";

export function StageCard({ stage, letter, index }: { stage: PaymentStage; letter: string; index: number }) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ delay: index * 0.08 }}
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
                  {l.detail && <p className="text-xs text-muted">{l.detail}</p>}
                </div>
                <span className="hidden text-right text-muted tabular sm:block">{usd(l.unit)}</span>
                <span className="hidden text-center text-muted tabular sm:block">{num(l.qty)}</span>
                <span className="text-right font-semibold text-ink tabular">
                  <span className="mr-2 text-xs font-normal text-muted sm:hidden">
                    {usd(l.unit)} × {l.qty}
                  </span>
                  {usd(l.total)}
                </span>
              </div>
            </motion.li>
          ))}
        </AnimatePresence>
      </motion.ul>

      <footer className="flex items-center justify-between border-t border-line bg-canvas px-5 py-4 sm:px-6">
        <span className="font-display text-xs font-bold uppercase tracking-[0.14em] text-ink">{stage.subtotalLabel}</span>
        <span className="text-lg font-bold text-brand">
          <AnimatedNumber value={stage.subtotal} />
        </span>
      </footer>
    </motion.section>
  );
}
