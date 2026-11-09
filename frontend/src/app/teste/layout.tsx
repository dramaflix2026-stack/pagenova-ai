import type { ReactNode } from "react";
import { Poppins } from "next/font/google";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  display: "swap",
});

export default function TesteLayout({ children }: { children: ReactNode }) {
  return <div className={poppins.className} style={{ minHeight: "100vh" }}>{children}</div>;
}
