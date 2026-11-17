import type { ReactNode } from "react";
import { LandingShell } from "./landing-shell";

export default function TesteLayout({ children }: { children: ReactNode }) {
  return <LandingShell>{children}</LandingShell>;
}
