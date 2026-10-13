import type { Metadata } from "next";
import { DevelopmentModuleOverview } from "@/components/development-module-overview";

export const metadata: Metadata = {
  title: "Desenvolver Sistemas | PageNova AI",
  description: "Espaço para desenvolvimento de sistemas da PageNova AI.",
};

export default function Page() {
  return <DevelopmentModuleOverview kind="systems" />;
}
