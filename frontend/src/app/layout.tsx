import type { Metadata } from "next";
import { headers } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { MetaPixel } from "@/components/meta-pixel";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "PageNova AI",
  description: "Crie, clone e personalize landing pages profissionais com inteligência artificial.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const requestHeaders = await headers();
  const requestedLanguage = requestHeaders.get("x-pagenova-html-lang");
  const requestHost = (requestHeaders.get("host") ?? "").split(":")[0].toLowerCase();
  const isLandingProduction = requestHost === "pagenova-landing-teste-production.up.railway.app";
  const language=requestedLanguage==="en"||requestedLanguage==="es"?requestedLanguage:"pt-BR";
  return (
    <html
      lang={language}
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col"><MetaPixel landing={isLandingProduction} />{children}</body>
    </html>
  );
}
