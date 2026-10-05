/**
 * Raiz da aplicacao: rotas, providers e o guarda de autenticacao.
 *
 * Todas as rotas exigem sessao, exceto /entrar e as paginas legais.
 * O redirecionamento nunca entra em loop: enquanto a sessao carrega, a tela
 * mostra um estado de carregamento em vez de decidir para onde ir.
 */
import { TooltipProvider } from '@radix-ui/react-tooltip';
import { QueryClientProvider } from '@tanstack/react-query';
import { Suspense, lazy, type ReactNode } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation } from 'react-router-dom';

import { AppLayout } from './components/layout/AppLayout';
import { LoadingBlock } from './components/ui';
import { ToastProvider } from './components/ui/Toast';
import { AuthProvider, useAuth } from './hooks/useAuth';
import { queryClient } from './lib/queryClient';
import { LoginPage } from './pages/LoginPage';

// Areas pesadas carregam sob demanda, deixando a primeira tela util mais rapida.
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const SearchPage = lazy(() => import('./pages/SearchPage'));
const CrmPage = lazy(() => import('./pages/CrmPage'));
const ImportPage = lazy(() => import('./pages/ImportPage'));
const ServicesPage = lazy(() => import('./pages/ServicesPage'));
const FinancePage = lazy(() => import('./pages/FinancePage'));
const GoalsPage = lazy(() => import('./pages/GoalsPage'));
const SettingsPage = lazy(() => import('./pages/SettingsPage'));
const TeamPage = lazy(() => import('./pages/TeamPage'));
const MeetingsPage = lazy(() => import('./pages/MeetingsPage'));
const SiteAiPage = lazy(() => import('./pages/SiteAiPage'));
const SiteProjectPage = lazy(() => import('./pages/SiteProjectPage'));
const LegalPage = lazy(() => import('./pages/LegalPage'));

function RequireAuth({ children }: { children: ReactNode }) {
  /*
   * PageNova embedded mode:
   * /app/crm is already protected by Supabase authentication
   * and the active PageNova entitlement in the parent application.
   *
   * Do not show Stavo's second login screen inside PageNova.
   */
  return <>{children}</>;
}

function PublicOnly({ children }: { children: ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <LoadingBlock label="Carregando..." />
      </div>
    );
  }

  return user ? <Navigate to="/" replace /> : <>{children}</>;
}

const pageFallback = (
  <div className="p-10">
    <LoadingBlock />
  </div>
);

function AppRoutes() {
  return (
    <Routes>
      <Route path="/entrar" element={<Navigate to="/" replace />} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <TooltipProvider delayDuration={200}>
            <ToastProvider>
              <AppRoutes />
            </ToastProvider>
          </TooltipProvider>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
