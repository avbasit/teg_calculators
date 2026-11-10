/* eslint-disable @next/next/no-img-element -- plain <img> keeps the print output simple */
import { stageLetter, type Quote } from "@/lib/calculators/types";
import { TEG } from "@/lib/brand";
import { money, num } from "@/lib/format";

/**
 * Client-facing quotation. Hidden on screen; this is what prints / saves to PDF.
 */
export function QuoteDocument({
  title,
  programLabel,
  clientName,
  date,
  reference,
  family,
  quote,
  notes,
  totalLabel,
}: {
  title: string;
  programLabel: string;
  clientName: string;
  date: string;
  reference: string;
  family: { label: string; count: number }[];
  quote: Quote;
  notes: string[];
  totalLabel: string;
}) {
  const fmt = (n: number) => money(n, quote.currency);
  const letters = quote.stages.map((_, i) => stageLetter(i));
  const hasTimeline = quote.stages.some((s) => s.lines.some((l) => l.timeline));
  return (
    <article className="hidden text-[11px] leading-snug text-body print:block">
      <header className="flex items-start justify-between border-b-4 border-brand pb-4">
        <img src="/brand/teg-logo.webp" alt="TEG" className="h-16 w-auto" />
        <div className="text-right">
          <h1 className="text-lg font-bold text-brand">{title}</h1>
          <p className="mt-1 text-muted">Ref: {reference}</p>
          <p className="text-muted">Date: {date}</p>
        </div>
      </header>

      <section className="mt-5 grid grid-cols-2 gap-6">
        <div>
          <p className="font-bold uppercase tracking-wider text-muted">Prepared for</p>
          <p className="mt-1 text-sm font-bold text-ink">{clientName || "—"}</p>
          <p className="mt-3 font-bold uppercase tracking-wider text-muted">Investment plan</p>
          <p className="mt-1 text-sm font-bold text-ink">{programLabel}</p>
        </div>
        <div>
          <p className="font-bold uppercase tracking-wider text-muted">Family composition</p>
          <table className="mt-1 w-full">
            <tbody>
              {family.map((f) => (
                <tr key={f.label}>
                  <td className="py-0.5">{f.label}</td>
                  <td className="py-0.5 text-right font-semibold">{f.count}</td>
                </tr>
              ))}
              <tr className="border-t border-line font-bold">
                <td className="pt-1">Total persons</td>
                <td className="pt-1 text-right">{quote.familySize}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {quote.stages.map((s, i) => (
        <table key={s.id} className="mt-5 w-full border-collapse break-inside-avoid">
          <thead>
            <tr className="bg-brand text-left text-white">
              <th className="px-2 py-1.5 font-bold uppercase" colSpan={2}>
                {letters[i]}. {s.title}
              </th>
              <th className="px-2 py-1.5 text-right">Fee</th>
              <th className="px-2 py-1.5 text-center">×</th>
              <th className="px-2 py-1.5 text-right">Total</th>
              {hasTimeline && <th className="px-2 py-1.5">Timeline</th>}
            </tr>
          </thead>
          <tbody>
            {s.lines.map((l) => (
              <tr key={l.id} className="border-b border-line">
                <td className="px-2 py-1.5 font-semibold">{l.label}</td>
                <td className="px-2 py-1.5 text-muted">{l.detail}</td>
                <td className="px-2 py-1.5 text-right tabular">{fmt(l.unit)}</td>
                <td className="px-2 py-1.5 text-center tabular">{num(l.qty)}</td>
                <td className="px-2 py-1.5 text-right tabular">{fmt(l.total)}</td>
                {hasTimeline && <td className="px-2 py-1.5 text-muted">{l.timeline}</td>}
              </tr>
            ))}
            <tr className="bg-royal-soft font-bold">
              <td className="px-2 py-1.5 uppercase" colSpan={4}>
                {s.subtotalLabel} ({letters[i]})
              </td>
              <td className="px-2 py-1.5 text-right tabular">{fmt(s.subtotal)}</td>
              {hasTimeline && <td />}
            </tr>
          </tbody>
        </table>
      ))}

      <div className="mt-4 flex items-center justify-between rounded bg-brand-night px-3 py-2.5 text-sm font-bold text-white">
        <span className="uppercase">
          {totalLabel} ({letters.join(" + ")})
        </span>
        <span className="tabular">{fmt(quote.total)}</span>
      </div>

      <section className="mt-6 break-inside-avoid">
        <p className="font-bold uppercase tracking-wider text-ink">Notes</p>
        <ul className="mt-1.5 list-disc space-y-1 pl-4 text-muted">
          {notes.map((n) => (
            <li key={n}>{n}</li>
          ))}
        </ul>
      </section>

      <footer className="mt-8 grid grid-cols-2 gap-4 border-t border-line pt-3 text-muted">
        <div>
          {TEG.offices.map((o) => (
            <p key={o}>{o}</p>
          ))}
        </div>
        <div className="text-right">
          <p>{TEG.phones.join("  ·  ")}</p>
          <p>
            {TEG.email} · {TEG.website.replace("https://", "")}
          </p>
        </div>
      </footer>
    </article>
  );
}
