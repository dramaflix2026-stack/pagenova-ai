import type { Metadata } from "next";
import { HeroModeloUm } from "./hero-modelo-um";
import { LandingGallery } from "./landing-gallery";

export const metadata: Metadata = {
  title: "PageNova AI | O futuro da criação digital",
  description: "Conheça a PageNova AI: criação de sites, landing pages e ferramentas para negócios digitais.",
  robots: { index: false, follow: false },
};

export default function TestePage() {
  return <><HeroModeloUm /><LandingGallery /></>;
}
