"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useSpring, useTransform } from "motion/react";
import { Lock, Minus, Plus } from "lucide-react";
import { num, usd } from "@/lib/format";

/** A number that springs smoothly to each new value. Counts up from 0 on first render. */
export function AnimatedNumber({ value, currency = true }: { value: number; currency?: boolean }) {
  const spring = useSpring(0, { stiffness: 90, damping: 22, mass: 0.7 });
  const text = useTransform(spring, (v) => (currency ? usd(Math.round(v)) : num(Math.round(v))));
  useEffect(() => {
    spring.set(value);
  }, [spring, value]);
  return <motion.span className="tabular">{text}</motion.span>;
}

export function Stepper({
  value,
  onChange,
  min = 0,
  max = 10,
  locked = false,
  label,
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  max?: number;
  locked?: boolean;
  label: string;
}) {
  const [dir, setDir] = useState(1);
  const step = (d: number) => {
    setDir(d);
    onChange(value + d);
  };

  if (locked) {
    return (
      <div className="flex h-10 w-[124px] items-center justify-center gap-2 rounded-full bg-canvas text-sm font-semibold text-ink ring-1 ring-line">
        <Lock className="size-3.5 text-muted" /> {value}
      </div>
    );
  }

  const btn =
    "flex size-8 items-center justify-center rounded-full text-ink transition hover:bg-royal hover:text-white active:scale-90 disabled:pointer-events-none disabled:opacity-30";
  return (
    <div className="flex h-10 w-[124px] items-center justify-between rounded-full bg-white px-1 ring-1 ring-line transition focus-within:ring-2 focus-within:ring-royal/40">
      <button type="button" className={btn} onClick={() => step(-1)} disabled={value <= min} aria-label={`Fewer: ${label}`}>
        <Minus className="size-4" />
      </button>
      <div className="relative h-6 w-8 overflow-hidden text-center" aria-live="polite" aria-label={`${label}: ${value}`}>
        <AnimatePresence mode="popLayout" initial={false} custom={dir}>
          <motion.span
            key={value}
            custom={dir}
            variants={{
              enter: (d: number) => ({ y: d * 18, opacity: 0 }),
              center: { y: 0, opacity: 1 },
              exit: (d: number) => ({ y: d * -18, opacity: 0 }),
            }}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring", stiffness: 500, damping: 34 }}
            className={`absolute inset-0 text-base font-bold leading-6 tabular ${value > 0 ? "text-ink" : "text-muted/60"}`}
          >
            {value}
          </motion.span>
        </AnimatePresence>
      </div>
      <button type="button" className={btn} onClick={() => step(1)} disabled={value >= max} aria-label={`More: ${label}`}>
        <Plus className="size-4" />
      </button>
    </div>
  );
}

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  id,
}: {
  options: { value: T; label: string; sub?: string }[];
  value: T;
  onChange: (v: T) => void;
  id: string;
}) {
  return (
    <div role="radiogroup" className="grid grid-cols-2 gap-1 rounded-2xl bg-canvas p-1 ring-1 ring-line">
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            className="relative rounded-xl px-4 py-3 text-left transition-colors"
          >
            {active && (
              <motion.span
                layoutId={`seg-${id}`}
                className="absolute inset-0 rounded-xl bg-white shadow-card ring-1 ring-royal/25"
                transition={{ type: "spring", stiffness: 420, damping: 34 }}
              />
            )}
            <span className="relative block">
              <span className={`block text-base font-bold ${active ? "text-royal" : "text-ink/70"}`}>{o.label}</span>
              {o.sub && <span className="mt-0.5 block text-xs text-muted">{o.sub}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}

export function Switch({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={`flex h-7 w-12 shrink-0 items-center rounded-full p-1 transition-colors ${checked ? "justify-end bg-royal" : "justify-start bg-line"}`}
    >
      <motion.span layout transition={{ type: "spring", stiffness: 600, damping: 32 }} className="size-5 rounded-full bg-white shadow" />
    </button>
  );
}

export function MoneyInput({
  value,
  onChange,
  label,
  hint,
}: {
  value: number;
  onChange: (v: number) => void;
  label: string;
  hint?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-semibold text-ink">{label}</span>
      {hint && <span className="mt-0.5 block text-xs text-muted">{hint}</span>}
      <span className="mt-2 flex h-11 items-center rounded-xl bg-white ring-1 ring-line transition focus-within:ring-2 focus-within:ring-royal/50">
        <span className="pl-3.5 pr-1 text-sm font-semibold text-muted">US$</span>
        <input
          type="text"
          inputMode="numeric"
          value={value ? num(value) : ""}
          placeholder="0"
          onChange={(e) => {
            const digits = e.target.value.replace(/[^\d]/g, "").slice(0, 9);
            onChange(digits ? Number(digits) : 0);
          }}
          className="h-full w-full rounded-xl bg-transparent pr-3.5 text-sm font-semibold text-ink tabular outline-none placeholder:text-muted/50"
        />
      </span>
    </label>
  );
}
