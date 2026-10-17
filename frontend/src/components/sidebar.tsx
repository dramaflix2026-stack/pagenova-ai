"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { LogoutButton } from "@/components/auth/logout-button";
import { createClient } from "@/lib/supabase/client";
import {
  ArrowRight,
  BarChart3,
  Blocks,
  Building2,
  History,
  CalendarDays,
  ClipboardList,
  BookOpen,
  ListChecks,
  CircleHelp,
  Copy,
  FileSpreadsheet,
  Files,
  Globe,
  KanbanSquare,
  LayoutDashboard,
  Menu,
  Settings,
  Smartphone,
  Sparkles,
  Target,
  Users,
  Wallet,
  X,
} from "lucide-react";

type MenuItem = { href: string; label: string; icon: typeof Menu; crmView?: string };

// Studio is the PageNova entry point; CRM and Development remain separate.
 // Keep routes intact and change only the navigation presentation.
const crmItems: MenuItem[] = [
  { href: "/app/crm?view=crm", label: "CRM", icon: KanbanSquare, crmView: "crm" },
  { href: "/app/crm?view=dashboard", label: "Dashboard comercial", icon: LayoutDashboard, crmView: "dashboard" },
  { href: "/app/crm?view=buscar", label: "Buscar empresas", icon: Building2, crmView: "buscar" },
  { href: "/app/crm?view=pesquisadas", label: "Empresas pesquisadas", icon: History, crmView: "pesquisadas" },
  { href: "/app/crm?view=reunioes", label: "Reuniões", icon: CalendarDays, crmView: "reunioes" },
  { href: "/app/crm?view=sites-ia", label: "Sites com IA do CRM", icon: Globe, crmView: "sites-ia" },
  { href: "/app/crm?view=importar", label: "Importar leads", icon: FileSpreadsheet, crmView: "importar" },
  { href: "/app/crm?view=servicos", label: "Serviços", icon: BarChart3, crmView: "servicos" },
  { href: "/app/crm?view=financeiro", label: "Financeiro", icon: Wallet, crmView: "financeiro" },
  { href: "/app/crm?view=metas", label: "Metas", icon: Target, crmView: "metas" },
  { href: "/app/crm?view=equipe", label: "Equipe", icon: Users, crmView: "equipe" },
  { href: "/app/crm?view=configuracoes", label: "Configurações do CRM", icon: Settings, crmView: "configuracoes" },
];

const studioItems: MenuItem[] = [
  { href: "/app/builder", label: "Gerar site com IA", icon: Sparkles },
  { href: "/app/landing", label: "Criar Landing Page com IA", icon: Files },
  { href: "/app/cloner", label: "Clonar site", icon: Copy },
  { href: "/app/formularios", label: "Gerar Formulário", icon: ClipboardList },
  { href: "/app/quizzes", label: "Gerar Quiz", icon: ListChecks },
  { href: "/app/ebooks", label: "Gerar Ebooks", icon: BookOpen },
  { href: "/app/paginas", label: "Meus sites", icon: Files },
  { href: "/app/como-usar", label: "Como usar", icon: CircleHelp },
  { href: "/app/dominios", label: "Domínio profissional", icon: Globe },
];

const developmentItems: MenuItem[] = [
  { href: "/app/aplicativos", label: "Protótipos de Aplicativos", icon: Smartphone },
  { href: "/app/sistemas", label: "Protótipos de Sistemas", icon: Blocks },
];

function isItemActive(pathname: string, href: string, crmView: string | undefined, currentCrmView: string | null) {
  if (crmView) {
    return pathname === "/app/crm" && (currentCrmView ?? "dashboard") === crmView;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

type NavigationTheme = "studio" | "crm" | "development";

const navigationTheme: Record<NavigationTheme, {
  container: string;
  indicator: string;
  heading: string;
  activeLink: string;
  activeIcon: string;
  activeDot: string;
  inactiveHover: string;
}> = {
  studio: {
    container: "border-emerald-400/25 bg-emerald-400/[0.045] shadow-[inset_0_0_22px_rgba(143,236,120,0.035)]",
    indicator: "bg-emerald-400 shadow-[0_0_9px_rgba(143,236,120,0.35)]",
    heading: "text-emerald-300",
    activeLink: "border-emerald-400/30 bg-emerald-400/[0.11] text-white",
    activeIcon: "bg-emerald-400/[0.14] text-emerald-200",
    activeDot: "bg-emerald-400",
    inactiveHover: "hover:bg-emerald-400/[0.055] hover:text-white",
  },
  crm: {
    container: "border-emerald-400/25 bg-emerald-400/[0.055] shadow-[inset_0_0_20px_rgba(143,236,120,0.035)]",
    indicator: "bg-emerald-400 shadow-[0_0_9px_rgba(143,236,120,0.35)]",
    heading: "text-emerald-300",
    activeLink: "border-emerald-400/25 bg-emerald-400/[0.14] text-white",
    activeIcon: "bg-emerald-400/[0.13] text-emerald-300",
    activeDot: "bg-emerald-400",
    inactiveHover: "hover:bg-emerald-400/[0.055] hover:text-white",
  },
  development: {
    container: "border-emerald-400/25 bg-emerald-400/[0.045] shadow-[inset_0_0_22px_rgba(143,236,120,0.035)]",
    indicator: "bg-emerald-400 shadow-[0_0_9px_rgba(143,236,120,0.35)]",
    heading: "text-emerald-300",
    activeLink: "border-emerald-400/30 bg-emerald-400/[0.12] text-white",
    activeIcon: "bg-emerald-400/[0.14] text-emerald-200",
    activeDot: "bg-emerald-400",
    inactiveHover: "hover:bg-emerald-400/[0.055] hover:text-white",
  },
};

function NavigationGroup({ title, description, items, theme, pathname, currentCrmView, onNavigate, compact = false }: {
  title: string;
  description?: string;
  items: MenuItem[];
  theme: NavigationTheme;
  pathname: string;
  currentCrmView: string | null;
  onNavigate?: () => void;
  compact?: boolean;
}) {
  const palette = navigationTheme[theme];
  return (
    <section aria-label={title} className={`mt-4 first:mt-0 rounded-2xl border p-2 ${palette.container}`}>
      <div className="px-2.5 pb-2 pt-1.5">
        <div className="flex items-center gap-2">
          <span aria-hidden="true" className={`h-1.5 w-1.5 rounded-full ${palette.indicator}`} />
          <h2 className={`text-[11px] font-bold uppercase tracking-[.17em] ${palette.heading}`}>{title}</h2>
        </div>
        {description ? <p className="mt-1 pl-3.5 text-[11px] leading-4 text-white/45">{description}</p> : null}
      </div>
      <div className="space-y-0.5">
        {items.map((item) => {
          const active = isItemActive(pathname, item.href, item.crmView, currentCrmView);
          return (
            <Link key={item.href} href={item.href} onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`group relative flex min-h-10 items-center gap-2.5 rounded-xl border px-2.5 py-2 text-sm font-medium transition-colors ${
                active ? palette.activeLink : `border-transparent text-white/65 ${palette.inactiveHover}`
              }`}>
              <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg ${
                active ? palette.activeIcon : "bg-white/[0.035] text-white/50"
              }`}>
                <item.icon className={compact ? "h-4 w-4" : "h-[15px] w-[15px]"} strokeWidth={1.9} />
              </span>
              <span className="min-w-0 break-words leading-5">{item.label}</span>
              {active ? <span className={`ml-auto h-1.5 w-1.5 shrink-0 rounded-full ${palette.activeDot}`} aria-hidden="true" /> : null}
            </Link>
          );
        })}
      </div>
    </section>
  );
}

type SidebarCredits={balance?:{sitesRemaining?:number;googleRemaining?:number}};
function AccessCredits({credits,loading}:{credits:SidebarCredits|null;loading:boolean}){
  return <div className="mt-3 rounded-xl border border-white/10 bg-white/[.035] px-3 py-3">
    <div className="flex items-center gap-2 text-xs font-semibold text-white/80"><Wallet className="h-3.5 w-3.5 text-emerald-300"/> Créditos disponíveis</div>
    {loading?<p className="mt-2 text-xs text-white/50">Consultando saldo...</p>:
      credits?.balance?<div className="mt-2 space-y-1.5 text-xs text-white/65">
        <div className="flex justify-between gap-2"><span>Sites com IA</span><strong className="text-emerald-200">{credits.balance.sitesRemaining??"—"}</strong></div>
        <div className="flex justify-between gap-2"><span>Pesquisas Google</span><strong className="text-emerald-200">{credits.balance.googleRemaining??"—"}</strong></div>
      </div>:<p className="mt-2 text-xs text-white/45">Saldo indisponível no momento.</p>}
    <Link href="/app/creditos" className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-300 hover:text-emerald-200">
      Ver detalhes do meu acesso <ArrowRight className="h-3.5 w-3.5"/>
    </Link>
  </div>;
}

export function Sidebar({accessKind="paid"}:{accessKind?:"paid"|"trial"}) {
  const visibleStudioItems=accessKind==="trial"?studioItems.map(item=>
    item.href==="/app/builder"
      ?{...item,href:"/app/crm?view=sites-ia",crmView:"sites-ia",label:"Gerar site com IA · teste"}
      :item
  ):studioItems;
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentCrmView = searchParams.get("view");
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountEmail, setAccountEmail] = useState<string>("");
  const [credits,setCredits]=useState<SidebarCredits|null>(null);
  const [creditsLoading,setCreditsLoading]=useState(true);
  useEffect(()=>{
    let active=true;
    fetch("/api/credits",{cache:"no-store",credentials:"same-origin"})
      .then(async response=>{if(!response.ok)throw new Error("Saldo indisponível");return response.json() as Promise<SidebarCredits>;})
      .then(data=>{if(active)setCredits(data);})
      .catch(()=>{if(active)setCredits(null);})
      .finally(()=>{if(active)setCreditsLoading(false);});
    return ()=>{active=false;};
  },[pathname]);

  useEffect(() => {
    let current = true;
    void createClient().auth.getUser().then(({data}) => {
      if (current && data.user?.email) setAccountEmail(data.user.email);
    }).catch(() => undefined);
    return () => { current = false; };
  }, []);

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
      <header className="fixed inset-x-0 top-0 z-50 flex h-16 items-center border-b border-white/[0.08] bg-[#0b100d]/95 px-4 backdrop-blur-xl lg:hidden">
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
          aria-label="Ir para o início da PageNova AI"
          title="Voltar ao início"
        >
          {/* Keep exactly the original brand mark: crop the wordmark, not a recreated P. */}
          <span aria-hidden="true" className="relative block h-12 w-[40px] overflow-hidden">
            <img
              src="/brand/pagenova-logo.png"
              alt=""
              className="pn-brand-logo absolute left-0 top-0 h-12 w-auto max-w-none object-contain"
            />
          </span>
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
          className={`absolute inset-y-0 left-0 flex w-[min(86vw,320px)] flex-col overflow-hidden border-r border-white/[0.08] bg-[#0b100d] shadow-[24px_0_80px_rgba(0,0,0,0.5)] transition-transform duration-300 ease-out ${
            mobileOpen ? "translate-x-0" : "-translate-x-full"
          }`}
          aria-label="Menu PageNova"
        >
          <div className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_top_left,rgba(143,236,120,0.10),transparent_68%)]" />

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
                className="pn-brand-logo h-[58px] w-auto max-w-[210px] object-contain object-left"
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

          <nav className="relative flex-1 overflow-y-auto overscroll-contain p-3 pb-6" aria-label="Menu principal da PageNova">
            <NavigationGroup title="PageNova Studio" description="Sites, formulários e quizzes com IA" items={visibleStudioItems}
              theme="studio" pathname={pathname} currentCrmView={currentCrmView} onNavigate={() => setMobileOpen(false)} compact />
            <NavigationGroup title="CRM & Vendas" description="Gestão comercial e prospecção" items={crmItems}
              theme="crm" pathname={pathname} currentCrmView={currentCrmView} onNavigate={() => setMobileOpen(false)} compact />
            <NavigationGroup title="Desenvolvimento" description="Modelos iniciais sem API paga" items={developmentItems}
              theme="development" pathname={pathname} currentCrmView={currentCrmView} onNavigate={() => setMobileOpen(false)} compact />
          </nav>

          <div className="relative border-t border-white/[0.07] p-4">
            <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4">
              <div className="flex items-center justify-between">
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/30">
                  Seu acesso
                </p>

                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(143,236,120,0.6)]" />
              </div>

              <p className="mt-2 text-sm font-semibold text-white">
                {accessKind==="trial"?"Teste grátis · 5 dias":"Acesso completo"}
              </p>

              <p className="mt-1 break-all text-xs text-emerald-200/70" title={accountEmail}>
                {accountEmail || "PageNova AI"}
              </p>

              <div className="mt-4 h-px bg-gradient-to-r from-emerald-400/30 via-white/5 to-transparent" />

              <div className="mt-3 flex items-center gap-2 text-xs font-medium text-emerald-400">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                Ativo
              </div>

              <AccessCredits credits={credits} loading={creditsLoading}/>
              <LogoutButton />
            </div>
          </div>
        </aside>
      </div>

      {/* =======================================================
          DESKTOP SIDEBAR
          ======================================================= */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 overflow-hidden border-r border-white/[0.07] bg-[#0b100d] lg:flex lg:flex-col">
        <div className="pointer-events-none absolute inset-x-0 top-0 h-56 bg-[radial-gradient(circle_at_top_left,rgba(143,236,120,0.085),transparent_68%)]" />

        <div className="relative flex h-20 items-center border-b border-white/[0.07] px-6">
          <Link
            href="/app"
            className="group flex min-w-0 items-center"
            aria-label="PageNova AI"
          >
            <img
              src="/brand/pagenova-logo.png"
              alt="PageNova AI"
              className="pn-brand-logo h-[62px] w-auto max-w-[218px] object-contain object-left transition duration-200 group-hover:brightness-110"
            />
          </Link>
        </div>

        <nav className="relative flex-1 space-y-2 overflow-y-auto overscroll-contain p-3 pb-6" aria-label="Menu principal da PageNova">
          <NavigationGroup title="PageNova Studio" description="Sites, formulários e quizzes com IA" items={visibleStudioItems}
            theme="studio" pathname={pathname} currentCrmView={currentCrmView} />
          <NavigationGroup title="CRM & Vendas" description="Gestão comercial e prospecção" items={crmItems}
            theme="crm" pathname={pathname} currentCrmView={currentCrmView} />
          <NavigationGroup title="Desenvolvimento" description="Modelos iniciais sem API paga" items={developmentItems}
            theme="development" pathname={pathname} currentCrmView={currentCrmView} />
        </nav>

        <div className="relative border-t border-white/[0.07] p-4">
          <div className="overflow-hidden rounded-2xl border border-white/[0.08] bg-white/[0.025] p-4">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white/30">
                Seu acesso
              </p>

              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(143,236,120,0.6)]" />
            </div>

            <p className="mt-2 text-sm font-semibold text-white">
              {accessKind==="trial"?"Teste grátis · 5 dias":"Acesso completo"}
            </p>

            <p className="mt-1 break-all text-xs text-emerald-200/70" title={accountEmail}>
                {accountEmail || "PageNova AI"}
              </p>

            <div className="mt-4 h-px bg-gradient-to-r from-emerald-400/30 via-white/5 to-transparent" />

            <div className="mt-3 flex items-center gap-2 text-xs font-medium text-emerald-400">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
              Ativo
            </div>

            {/* PAGENOVA_NAV_EXIT */}
            <AccessCredits credits={credits} loading={creditsLoading}/>
              <LogoutButton />
          </div>
        </div>
      </aside>

      {/* Reserva o espaco do header fixo apenas no mobile. */}
      <div className="h-16 lg:hidden" aria-hidden="true" />
    </>
  );
}