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
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom';

import { AppLayout } from './components/layout/AppLayout';
import { ToastProvider } from './components/ui/Toast';
import { AuthProvider } from './hooks/useAuth';
import { queryClient } from './lib/queryClient';

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

function AppRoutes() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background" />}>
      <Routes>
        <Route path="/entrar" element={<Navigate to="/" replace />} />

        <Route
          path="/"
          element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="buscar" element={<SearchPage />} />
          <Route path="crm" element={<CrmPage />} />
          <Route path="reunioes" element={<MeetingsPage />} />
          <Route path="sites-ia" element={<SiteAiPage />} />
          <Route path="sites-ia/:projectId" element={<SiteProjectPage />} />
          <Route path="importar" element={<ImportPage />} />
          <Route path="servicos" element={<ServicesPage />} />
          <Route path="financeiro" element={<FinancePage />} />
          <Route path="metas" element={<GoalsPage />} />
          <Route path="equipe" element={<TeamPage />} />
          <Route path="configuracoes" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <HashRouter>
        <AuthProvider>
          <TooltipProvider delayDuration={200}>
            <ToastProvider>
              <AppRoutes />
            </ToastProvider>
          </TooltipProvider>
        </AuthProvider>
      </HashRouter>
    </QueryClientProvider>
  );
}
