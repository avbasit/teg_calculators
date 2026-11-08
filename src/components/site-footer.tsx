import Image from "next/image";
import { Mail, MapPin, Phone } from "lucide-react";
import { TEG } from "@/lib/brand";

export function SiteFooter() {
  return (
    <footer className="mt-24 bg-brand-night text-white/70 print:hidden">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.2fr_1fr_1fr] lg:px-8">
        <div>
          <Image src="/brand/teg-logo-white.webp" alt="TEG" width={120} height={80} className="h-14 w-auto" />
          <p className="mt-4 max-w-xs text-sm leading-relaxed">
            The most reliable &amp; transparent investment immigration consultancy.
          </p>
        </div>
        <div className="space-y-3 text-sm">
          <h3 className="font-display text-xs font-medium uppercase tracking-[0.18em] text-white">Offices</h3>
          {TEG.offices.map((o) => (
            <p key={o} className="flex gap-2.5">
              <MapPin className="mt-0.5 size-4 shrink-0 text-royal" />
              {o}
            </p>
          ))}
        </div>
        <div className="space-y-3 text-sm">
          <h3 className="font-display text-xs font-medium uppercase tracking-[0.18em] text-white">Contact</h3>
          {TEG.phones.map((p) => (
            <p key={p} className="flex gap-2.5">
              <Phone className="mt-0.5 size-4 shrink-0 text-royal" />
              {p}
            </p>
          ))}
          <p className="flex gap-2.5">
            <Mail className="mt-0.5 size-4 shrink-0 text-royal" />
            {TEG.email}
          </p>
        </div>
      </div>
      <div className="border-t border-white/10">
        <p className="mx-auto max-w-7xl px-4 py-5 text-xs text-white/50 sm:px-6 lg:px-8">
          Internal pricing tool · TEG Consultancy
        </p>
      </div>
    </footer>
  );
}
