/**
 * Layout da area autenticada.
 *
 * Desktop: navegacao lateral fixa.
 * Celular: cabecalho com menu deslizante e navegacao inferior com as areas
 * mais usadas. Nenhuma funcao depende de tela grande.
 */
import {
  BarChart3,
  Building2,
  CalendarDays,
  FileSpreadsheet,
  Globe,
  KanbanSquare,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Target,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { NavLink, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../lib/utils';
import { Button } from '../ui';

interface NavItem {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
  /** Aparece na barra inferior do celular. */
  primary?: boolean;
}

const NAV_ITEMS: NavItem[] = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, primary: true },
  { to: '/buscar', label: 'Buscar empresas', icon: Building2, primary: true },
  { to: '/crm', label: 'CRM', icon: KanbanSquare, primary: true },
  { to: '/reunioes', label: 'Reunioes', icon: CalendarDays, primary: true },
  { to: '/sites-ia', label: 'Sites com IA', icon: Globe },
  { to: '/importar', label: 'Importar leads', icon: FileSpreadsheet },
  { to: '/servicos', label: 'Servicos', icon: BarChart3 },
  { to: '/financeiro', label: 'Financeiro', icon: Wallet, primary: true },
  { to: '/metas', label: 'Metas', icon: Target },
  { to: '/equipe', label: 'Equipe', icon: Users },
  { to: '/configuracoes', label: 'Configuracoes', icon: Settings },
];

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <nav className="flex flex-col gap-0.5" aria-label="Navegacao principal">
      {NAV_ITEMS.map((item) => (
        <NavLink
          key={item.to}
          to={item.to}
          end={item.to === '/'}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors',
              isActive
                ? 'bg-primary-soft text-primary'
                : 'text-muted-foreground hover:bg-muted hover:text-foreground',
            )
          }
        >
          {({ isActive }) => (
            <>
              <item.icon className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>{item.label}</span>
              {isActive ? <span className="sr-only">(pagina atual)</span> : null}
            </>
          )}
        </NavLink>
      ))}
    </nav>
  );
}

function UserArea({ compact }: { compact?: boolean }) {
  const { user, logout } = useAuth();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className={cn('border-t border-border p-3', compact && 'mt-auto')}>
      <p className="truncate px-1 text-xs text-muted-foreground" title={user?.email ?? ''}>
        {user?.email}
      </p>
      <Button
        variant="ghost"
        size="sm"
        block
        className="mt-1 justify-start text-muted-foreground"
        onClick={handleLogout}
        loading={loggingOut}
        loadingText="Saindo..."
      >
        <LogOut className="h-4 w-4" aria-hidden="true" />
        Sair
      </Button>
    </div>
  );
}

export function AppLayout({ children }: { children?: ReactNode }) {
  const { app } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  const appName = app?.name ?? 'Stavo Digital';
  const currentTitle =
    NAV_ITEMS.find((item) =>
      item.to === '/' ? location.pathname === '/' : location.pathname.startsWith(item.to),
    )?.label ?? appName;

  return (
    <div className="flex min-h-screen flex-col bg-background lg:flex-row">
      <a
        href="#conteudo"
        className="sr-only-focusable absolute left-3 top-3 z-50 rounded-md bg-primary px-3 py-2 text-sm text-primary-foreground"
      >
        Ir para o conteudo
      </a>

      {/* --- Barra lateral (desktop) --------------------------------------- */}
      <aside className="hidden w-60 shrink-0 flex-col border-r border-border bg-surface lg:flex">
        <div className="border-b border-border px-4 py-4">
          <p className="text-sm font-semibold text-foreground">{appName}</p>
          <p className="text-xs text-muted-foreground">Central comercial</p>
        </div>
        <div className="scroll-thin flex-1 overflow-y-auto p-2">
          <NavLinks />
        </div>
        <UserArea compact />
      </aside>

      {/* --- Cabecalho (celular) ------------------------------------------- */}
      <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border bg-surface px-3 lg:hidden">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{currentTitle}</p>
          <p className="truncate text-[11px] text-muted-foreground">{appName}</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setMenuOpen(true)}
          aria-label="Abrir menu de navegacao"
        >
          <Menu className="h-5 w-5" aria-hidden="true" />
        </Button>
      </header>

      {menuOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-foreground/40"
            aria-label="Fechar menu"
            onClick={() => setMenuOpen(false)}
          />
          <div className="absolute inset-y-0 right-0 flex w-72 animate-slide-in-right flex-col bg-surface shadow-xl">
            <div className="flex items-center justify-between border-b border-border px-4 py-3">
              <p className="text-sm font-semibold">{appName}</p>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setMenuOpen(false)}
                aria-label="Fechar menu"
              >
                <X className="h-5 w-5" aria-hidden="true" />
              </Button>
            </div>
            <div className="scroll-thin flex-1 overflow-y-auto p-2">
              <NavLinks onNavigate={() => setMenuOpen(false)} />
            </div>
            <UserArea />
          </div>
        </div>
      ) : null}

      {/* --- Conteudo ------------------------------------------------------ */}
      <main id="conteudo" className="min-w-0 flex-1 pb-16 lg:pb-0">
        {children ?? <Outlet />}
      </main>

      {/* --- Navegacao inferior (celular) ---------------------------------- */}
      <nav
        className="fixed inset-x-0 bottom-0 z-30 flex border-t border-border bg-surface lg:hidden"
        aria-label="Navegacao rapida"
      >
        {NAV_ITEMS.filter((item) => item.primary).map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-medium',
                isActive ? 'text-primary' : 'text-muted-foreground',
              )
            }
          >
            <item.icon className="h-5 w-5" aria-hidden="true" />
            <span className="truncate px-1">{item.label.split(' ')[0]}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}

/** Cabecalho padrao das paginas. */
export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3 border-b border-border bg-surface px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
      <div className="min-w-0">
        <h1 className="text-lg font-semibold text-foreground">{title}</h1>
        {description ? <p className="mt-0.5 text-sm text-muted-foreground">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </div>
  );
}

export function PageBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('px-4 py-4 sm:px-6 sm:py-6', className)}>{children}</div>;
}
