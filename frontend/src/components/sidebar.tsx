"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/auth/logout-button";

const items = [
  {
    href: "/app",
    label: "Início",
    icon: "⌂",
  },
  {
    href: "/app/cloner",
    label: "Clonador",
    icon: "◇",
  },
  {
    href: "/app/gerador",
    label: "Gerador",
    icon: "✦",
  },
  {
    href: "/app/paginas",
    label: "Minhas páginas",
    icon: "▤",
  },
  {
    href: "/app/como-usar",
    label: "Como usar",
    icon: "?",
  },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 overflow-hidden border-r border-white/[0.07] bg-[#090613] lg:flex lg:flex-col">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(circle_at_top_left,rgba(108,59,255,0.17),transparent_68%)]" />

      <div className="relative flex h-20 items-center border-b border-white/[0.07] px-6">
        <Link
          href="/app"
          className="group flex min-w-0 items-center"
          aria-label="PageNova AI"
        >
          <img
            src="/brand/pagenova-logo.png"
            alt="PageNova AI"
            className="h-[54px] w-auto max-w-[190px] object-contain object-left transition duration-200 group-hover:brightness-110"
          />
        </Link>
      </div>

      <nav className="relative flex-1 space-y-1.5 p-4">
        <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/25">
          Workspace
        </p>

        {items.map((item) => {
          const active =
            item.href === "/app"
              ? pathname === "/app"
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`group relative flex items-center gap-3 overflow-hidden rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                active
                  ? "border border-violet-400/20 bg-violet-500/[0.13] text-white shadow-[inset_0_0_24px_rgba(108,59,255,0.07)]"
                  : "border border-transparent text-white/45 hover:bg-white/[0.04] hover:text-white"
              }`}
            >
              {active && (
                <span className="absolute inset-y-2 left-0 w-[2px] rounded-full bg-violet-400 shadow-[0_0_12px_rgba(139,92,246,0.9)]" />
              )}

              <span
                className={`flex h-7 w-7 items-center justify-center rounded-lg text-base transition ${
                  active
                    ? "bg-violet-500/15 text-violet-300"
                    : "bg-white/[0.03] text-white/40 group-hover:text-white/80"
                }`}
              >
                {item.icon}
              </span>

              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="relative border-t border-white/[0.07] p-4">
        <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4">
          <div className="flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/30">
              Seu acesso
            </p>

            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.7)]" />
          </div>

          <p className="mt-2 text-sm font-semibold text-white">
            Acesso completo
          </p>

          <p className="mt-1 text-xs text-white/35">
            PageNova AI
          </p>

          <div className="mt-4 h-px bg-gradient-to-r from-violet-500/30 via-white/5 to-transparent" />

          <div className="mt-3 flex items-center gap-2 text-xs font-medium text-emerald-400">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
            Ativo
          </div>
          {/* PAGENOVA_NAV_EXIT */}
          <LogoutButton />
        </div>
      </div>
    </aside>
  );
}