"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { LogoutButton } from "@/components/auth/logout-button";
import {
  BriefcaseBusiness,
  CircleHelp,
  Copy,
  Files,
  House,
  Menu,
  Sparkles,
  X,
} from "lucide-react";

const items = [
  {
    href: "/app",
    label: "Início",
    icon: House,
  },
  {
    href: "/app/cloner",
    label: "Clonador",
    icon: Copy,
  },
  {
    href: "/app/gerador",
    label: "Gerador",
    icon: Sparkles,
  },
  {
    href: "/app/builder",
    label: "Criar Site com IA",
    icon: Sparkles,
  },
  {
    href: "/app/crm",
    label: "CRM",
    icon: BriefcaseBusiness,
  },
  {
    href: "/app/paginas",
    label: "Minhas páginas",
    icon: Files,
  },
  {
    href: "/app/como-usar",
    label: "Como usar",
    icon: CircleHelp,
  },
];

function isItemActive(pathname: string, href: string) {
  return href === "/app" ? pathname === "/app" : pathname.startsWith(href);
}

export function Sidebar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobileOpen) {
      document.body.style.overflow = "";
      return;
    }

    document.body.style.overflow = "hidden";

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setMobileOpen(false);
      }
    };

    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", handleEscape);
    };
  }, [mobileOpen]);

  return (
    <>
      {/* =======================================================
          MOBILE HEADER
          ======================================================= */}
      <header className="fixed inset-x-0 top-0 z-50 flex h-16 items-center border-b border-white/[0.08] bg-[#090613]/95 px-4 backdrop-blur-xl lg:hidden">
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="relative z-10 flex h-10 w-10 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-white transition hover:border-emerald-400/20 hover:bg-emerald-400/[0.08]"
          aria-label="Abrir menu"
          aria-expanded={mobileOpen}
          aria-controls="pagenova-mobile-menu"
        >
          <Menu className="h-5 w-5" strokeWidth={1.9} />
        </button>

        <Link
          href="/app"
          className="absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 items-center justify-center"
          aria-label="Ir para o início do PageNova AI"
        >
          <img
            src="/brand/pagenova-logo.png"
            alt="PageNova AI"
            className="h-12 w-auto max-w-[180px] object-contain"
          />
        </Link>

        <div className="ml-auto h-10 w-10" aria-hidden="true" />
      </header>

      {/* =======================================================
          MOBILE DRAWER / OVERLAY
          ======================================================= */}
      <div
        className={`fixed inset-0 z-[60] lg:hidden ${
          mobileOpen ? "pointer-events-auto" : "pointer-events-none"
        }`}
        aria-hidden={!mobileOpen}
      >
        <button
          type="button"
          aria-label="Fechar menu"
          onClick={() => setMobileOpen(false)}
          className={`absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${
            mobileOpen ? "opacity-100" : "opacity-0"
          }`}
          tabIndex={mobileOpen ? 0 : -1}
        />

        <aside
          id="pagenova-mobile-menu"
          className={`absolute inset-y-0 left-0 flex w-[min(86vw,320px)] flex-col overflow-hidden border-r border-white/[0.08] bg-[#090613] shadow-[24px_0_80px_rgba(0,0,0,0.5)] transition-transform duration-300 ease-out ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          aria-label="Menu PageNova"
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_top_left,rgba(0,245,180,0.12),transparent_68%)]" />

          <div className="relative flex h-20 items-center border-b border-white/[0.07] px-5">
            <Link
              href="/app"
              onClick={() => setMobileOpen(false)}
              className="flex min-w-0 items-center"
              aria-label="Ir para o início do PageNova AI"
            >
              <img
                src="/brand/pagenova-logo.png"
                alt="PageNova AI"
                className="h-[58px] w-auto max-w-[210px] object-contain object-left"
              />
            </Link>

            <button
              type="button"
              onClick={() => setMobileOpen(false)}
              className="ml-auto flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-white/[0.04] text-white/70 transition hover:bg-white/[0.08] hover:text-white"
              aria-label="Fechar menu"
            >
              <X className="h-5 w-5" strokeWidth={1.9} />
            </button>
          </div>

          <nav className="relative flex-1 overflow-y-auto p-4">
            <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/25">
              Workspace
            </p>

            <div className="space-y-1.5">
              {items.map((item) => {
                const active = isItemActive(pathname, item.href);

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className={`group relative flex items-center gap-3 overflow-hidden rounded-xl px-4 py-3.5 text-sm font-medium transition-all duration-200 ${
                      active
                        ? "border border-emerald-400/20 bg-emerald-400/[0.09] text-white shadow-[inset_0_0_26px_rgba(16,185,129,0.06),0_0_24px_rgba(16,185,129,0.025)]"
                        : "border border-transparent text-white/55 hover:border-emerald-400/10 hover:bg-emerald-400/[0.045] hover:text-white"
                    }`}
                  >
                    {active && (
                      <span className="absolute inset-y-2 left-0 w-[2px] rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.85)]" />
                    )}

                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-lg transition ${
                        active
                          ? "bg-emerald-400/[0.12] text-emerald-300"
                          : "bg-white/[0.03] text-white/40 group-hover:bg-emerald-400/[0.07] group-hover:text-emerald-300"
                      }`}
                    >
                      <item.icon className="h-4 w-4" strokeWidth={1.8} />
                    </span>

                    {item.label}
                  </Link>
                );
              })}
            </div>
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

              <div className="mt-4 h-px bg-gradient-to-r from-emerald-400/30 via-white/5 to-transparent" />

              <div className="mt-3 flex items-center gap-2 text-xs font-medium text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Ativo
              </div>

              <LogoutButton />
            </div>
          </div>
        </aside>
      </div>

      {/* =======================================================
          DESKTOP SIDEBAR
          ======================================================= */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 overflow-hidden border-r border-white/[0.07] bg-[#090613] lg:flex lg:flex-col">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(circle_at_top_left,rgba(0,245,180,0.10),transparent_68%)]" />

        <div className="relative flex h-20 items-center border-b border-white/[0.07] px-6">
          <Link
            href="/app"
            className="group flex min-w-0 items-center"
            aria-label="PageNova AI"
          >
            <img
              src="/brand/pagenova-logo.png"
              alt="PageNova AI"
              className="h-[62px] w-auto max-w-[218px] object-contain object-left transition duration-200 group-hover:brightness-110"
            />
          </Link>
        </div>

        <nav className="relative flex-1 space-y-1.5 p-4">
          <p className="mb-3 px-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-white/25">
            Workspace
          </p>

          {items.map((item) => {
            const active = isItemActive(pathname, item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`group relative flex items-center gap-3 overflow-hidden rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ${
                  active
                    ? "border border-emerald-400/20 bg-emerald-400/[0.09] text-white shadow-[inset_0_0_26px_rgba(16,185,129,0.06),0_0_24px_rgba(16,185,129,0.025)]"
                    : "border border-transparent text-white/45 hover:border-emerald-400/10 hover:bg-emerald-400/[0.045] hover:text-white"
                }`}
              >
                {active && (
                  <span className="absolute inset-y-2 left-0 w-[2px] rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.85)]" />
                )}

                <span
                  className={`flex h-7 w-7 items-center justify-center rounded-lg text-base transition ${
                    active
                      ? "bg-emerald-400/[0.12] text-emerald-300 shadow-[0_0_18px_rgba(52,211,153,0.08)]"
                      : "bg-white/[0.03] text-white/40 group-hover:bg-emerald-400/[0.07] group-hover:text-emerald-300"
                  }`}
                >
                  <item.icon className="h-[15px] w-[15px]" strokeWidth={1.8} />
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

            <div className="mt-4 h-px bg-gradient-to-r from-emerald-400/30 via-white/5 to-transparent" />

            <div className="mt-3 flex items-center gap-2 text-xs font-medium text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Ativo
            </div>

            {/* PAGENOVA_NAV_EXIT */}
            <LogoutButton />
          </div>
        </div>
      </aside>

      {/* Reserva o espaco do header fixo apenas no mobile. */}
      <div className="h-16 lg:hidden" aria-hidden="true" />
    </>
  );
}