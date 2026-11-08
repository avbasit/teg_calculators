import { Hero } from "@/components/home/hero";
import { CountryGrid } from "@/components/home/country-grid";
import { CALCULATORS } from "@/lib/calculators/registry";

export default function Home() {
  const live = CALCULATORS.filter((c) => c.status === "live").length;
  return (
    <>
      <Hero live={live} soon={CALCULATORS.length - live} />
      <section id="calculators" className="mx-auto max-w-7xl scroll-mt-20 px-4 pt-16 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="font-display text-xs font-medium uppercase tracking-[0.2em] text-royal">Calculators</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-ink">Citizenship programmes</h2>
          </div>
          <p className="max-w-md text-sm text-muted">
            Each calculator mirrors its TEG pricing workbook — government fees, due diligence, contributions and
            payment stages.
          </p>
        </div>
        <CountryGrid items={CALCULATORS} />
      </section>
    </>
  );
}
