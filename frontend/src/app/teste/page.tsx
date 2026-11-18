import type { Metadata } from "next";
import { LandingRevamp } from "./landing-revamp";

export const metadata: Metadata = {
  title: "PageNova AI | Criação digital com inteligência artificial",
  description: "Crie sites com IA, organize oportunidades com o CRM e descubra o ecossistema PageNova.",
  robots: { index: false, follow: false },
};

export default function TestePage() {
  return <LandingRevamp />;
}
