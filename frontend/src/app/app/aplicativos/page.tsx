import type { Metadata } from "next";
import { DevelopmentModuleOverview } from "@/components/development-module-overview";

export const metadata: Metadata = {
  title: "Desenvolver Aplicativos | PageNova AI",
  description: "Espaço para desenvolvimento de aplicativos da PageNova AI.",
};

export default function Page() {
  return <DevelopmentModuleOverview kind="apps" />;
}
