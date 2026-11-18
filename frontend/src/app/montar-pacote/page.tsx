import type { Metadata } from "next";
import { redirect } from "next/navigation";
import MontarPacote from "../teste/montar-pacote/page";

export const metadata: Metadata = {
  title: "Monte seu pacote | PageNova AI",
  description: "Escolha um pacote PageNova de acordo com as ferramentas de que você precisa.",
  robots: { index: false, follow: false },
};

// Until the commercial provisioning gate is approved, the existing public
// homepage remains the default and this alias is not advertised.
export default function OfficialPackagePage() {
  if (process.env.PAGENOVA_PUBLIC_LP !== "v2") {
    redirect("/teste/montar-pacote");
  }
  return <MontarPacote official />;
}
