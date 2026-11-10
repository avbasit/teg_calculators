"use client";

import Image from "next/image";
import { motion } from "motion/react";

const rise = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0 },
};

export function Hero({ live, soon }: { live: number; soon: number }) {
  return (
    <section className="relative isolate overflow-hidden bg-brand-night text-white">
      <div className="bg-grid absolute inset-0 -z-10 [mask-image:radial-gradient(ellipse_at_70%_40%,black,transparent_70%)]" />
      <div className="absolute -left-40 -top-40 -z-10 size-[520px] rounded-full bg-royal/30 blur-[120px]" />
      <div className="absolute -bottom-48 right-0 -z-10 size-[420px] rounded-full bg-brand/60 blur-[120px]" />

      {/* Compass rose from the TEG mark, slowly turning */}
      <motion.div
        aria-hidden
        className="pointer-events-none absolute -right-24 top-1/2 -z-10 hidden size-[560px] -translate-y-1/2 opacity-[0.13] md:block"
        animate={{ rotate: 360 }}
        transition={{ duration: 160, ease: "linear", repeat: Infinity }}
      >
        <Image src="/brand/teg-compass.png" alt="" fill className="object-contain brightness-0 invert" />
      </motion.div>

      <motion.div
        className="mx-auto max-w-7xl px-4 pb-24 pt-20 sm:px-6 md:pb-32 md:pt-28 lg:px-8"
        initial="hidden"
        animate="show"
        transition={{ staggerChildren: 0.09, delayChildren: 0.05 }}
      >
        <motion.p
          variants={rise}
          className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/5 px-3.5 py-1.5 font-display text-xs font-medium uppercase tracking-[0.2em] text-white/80"
        >
          <span className="size-1.5 rounded-full bg-emerald-400 shadow-[0_0_12px] shadow-emerald-400" />
          Citizenship &amp; Residency by Investment
        </motion.p>
        <motion.h1
          variants={rise}
          className="mt-6 max-w-3xl text-4xl font-bold leading-[1.1] tracking-tight sm:text-5xl md:text-6xl"
        >
          Price any programme in <span className="text-sky-300">seconds</span>, not spreadsheets.
        </motion.h1>
        <motion.p variants={rise} className="mt-6 max-w-xl text-base leading-relaxed text-white/70 sm:text-lg">
          Choose a country, set the family composition and get a complete, client-ready payment schedule —
          calculated exactly the way our pricing workbooks do.
        </motion.p>
        <motion.div variants={rise} className="mt-10 flex flex-wrap gap-3 text-sm">
          <a
            href="#calculators"
            className="rounded-full bg-royal px-6 py-3 font-semibold text-white shadow-lg shadow-royal/30 transition hover:-translate-y-0.5 hover:bg-[#0f52b3]"
          >
            Open a calculator
          </a>
          <span className="rounded-full border border-white/15 px-5 py-3 text-white/70">
            <strong className="text-white">{live}</strong> live · <strong className="text-white">{soon}</strong> coming soon
          </span>
        </motion.div>
      </motion.div>
    </section>
  );
}
