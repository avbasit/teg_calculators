"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, useScroll, useTransform } from "motion/react";
import { ExternalLink } from "lucide-react";

export function SiteHeader() {
  const pathname = usePathname();
  const { scrollY } = useScroll();
  const shadow = useTransform(scrollY, [0, 40], ["0 0 0 rgb(13 26 60 / 0)", "0 8px 24px -16px rgb(13 26 60 / 0.35)"]);

  const nav = [{ href: "/", label: "Calculators" }];

  return (
    <motion.header
      style={{ boxShadow: shadow }}
      className="sticky top-0 z-40 border-b border-line/80 bg-white/85 backdrop-blur-md print:hidden"
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link href="/" className="flex items-center gap-3" aria-label="TEG Pricing Calculators — home">
          <Image src="/brand/teg-logo.webp" alt="TEG" width={96} height={64} priority className="h-11 w-auto" />
          <span className="hidden h-6 w-px bg-line sm:block" />
          <span className="hidden font-display text-[13px] font-medium uppercase tracking-[0.18em] text-ink/70 sm:block">
            Pricing Calculators
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {nav.map((item) => {
            const active = item.href === "/" ? pathname === "/" || pathname.startsWith("/calculators") : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className="relative rounded-full px-4 py-2 text-sm font-semibold text-ink transition-colors hover:text-royal"
              >
                {active && (
                  <motion.span layoutId="nav-pill" className="absolute inset-0 rounded-full bg-royal-soft" />
                )}
                <span className="relative">{item.label}</span>
              </Link>
            );
          })}
          <a
            href="https://tegconsultancy.com"
            target="_blank"
            rel="noreferrer"
            className="hidden items-center gap-1.5 rounded-full px-4 py-2 text-sm font-semibold text-muted transition-colors hover:text-royal md:flex"
          >
            tegconsultancy.com <ExternalLink className="size-3.5" />
          </a>
        </nav>
      </div>
    </motion.header>
  );
}
