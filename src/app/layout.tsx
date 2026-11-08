import type { Metadata } from "next";
import { Open_Sans, Roboto } from "next/font/google";
import { MotionProvider } from "@/components/motion-provider";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import "./globals.css";

const openSans = Open_Sans({ variable: "--font-open-sans", subsets: ["latin"] });
const roboto = Roboto({ variable: "--font-roboto", subsets: ["latin"], weight: ["400", "500", "700"] });

export const metadata: Metadata = {
  title: { default: "TEG Pricing Calculators", template: "%s · TEG Pricing" },
  description: "Citizenship by investment pricing calculators for TEG Consultancy.",
  icons: { icon: "/brand/teg-compass.png" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${openSans.variable} ${roboto.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <MotionProvider>
          <SiteHeader />
          <main className="flex-1">{children}</main>
          <SiteFooter />
        </MotionProvider>
      </body>
    </html>
  );
}
