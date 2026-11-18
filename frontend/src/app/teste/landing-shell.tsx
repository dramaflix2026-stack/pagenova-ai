import type { ReactNode } from "react";
import { Poppins } from "next/font/google";
import "./mobile-polish.css";

// Used by both /teste and the official '/'/EN/ES pages so a route switch
// cannot silently change typography or the approved mobile styles.
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export function LandingShell({ children }: { children: ReactNode }) {
  return (
    <div
      className={`${poppins.className} pn-test-root`}
      style={{ minHeight: "100vh", position: "relative", isolation: "isolate", background: "#08130c" }}
    >
      {children}
    </div>
  );
}
