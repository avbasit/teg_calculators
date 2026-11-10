import { Hero } from "@/components/home/hero";
import { CountryGrid } from "@/components/home/country-grid";
import { CALCULATORS, calculatorsFor } from "@/lib/calculators/registry";

function SectionHeading({ eyebrow, title, text }: { eyebrow: string; title: string; text: string }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <p className="font-display text-xs font-medium uppercase tracking-[0.2em] text-royal">{eyebrow}</p>
        <h2 className="mt-2 text-3xl font-bold tracking-tight text-ink">{title}</h2>
      </div>
      <p className="max-w-md text-sm text-muted">{text}</p>
    </div>
  );
}

export default function Home() {
  const live = CALCULATORS.filter((c) => c.status === "live").length;
  const soon = CALCULATORS.filter((c) => c.status === "soon").length;
  const citizenship = calculatorsFor("citizenship");
  const residency = calculatorsFor("residency");

  return (
    <>
      <Hero live={live} soon={soon} />
      <section id="calculators" className="mx-auto max-w-7xl scroll-mt-20 px-4 pt-16 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Calculators"
          title="Citizenship programmes"
          text="Each calculator mirrors its TEG pricing workbook — government fees, due diligence, contributions and payment stages."
        />
        <CountryGrid id="citizenship" items={citizenship} />
      </section>

      <section id="residency" className="mx-auto max-w-7xl scroll-mt-20 px-4 pt-20 sm:px-6 lg:px-8">
        <SectionHeading
          eyebrow="Residence by investment"
          title="Residency programmes"
          text={`${residency.length} programmes from TEG's residence portfolio. Filter by region; calculators go live as their pricing workbooks are added.`}
        />
        <CountryGrid id="residency" items={residency} filterable />
      </section>
    </>
  );
}
