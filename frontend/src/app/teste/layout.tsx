import type { ReactNode } from "react";
import { Poppins } from "next/font/google";
import "./mobile-polish.css";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export default function TesteLayout({ children }: { children: ReactNode }) {
  return <div className={`${poppins.className} pn-test-root`} style={{ minHeight: "100vh", position: "relative", isolation: "isolate", background: "#08130c" }}>{children}</div>;
}
