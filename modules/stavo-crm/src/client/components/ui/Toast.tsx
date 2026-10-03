/**
 * Toasts com acao opcional de "Desfazer".
 *
 * Movimentos comuns do CRM sao concluidos com um toast curto e reversivel.
 * Acoes criticas nunca usam toast: elas exigem formulario ou confirmacao.
 */
import * as ToastPrimitive from '@radix-ui/react-toast';
import { AlertCircle, CheckCircle2, Info, TriangleAlert, X } from 'lucide-react';
import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { cn } from '../../lib/utils';

export type ToastTone = 'success' | 'error' | 'warning' | 'info';

export interface ToastOptions {
  title: string;
  description?: string;
  tone?: ToastTone;
  durationMs?: number;
  /** Exibe "Desfazer" apenas quando reverter for tecnicamente seguro. */
  undo?: { label?: string; onUndo: () => void | Promise<void> };
}

interface ToastEntry extends ToastOptions {
  id: string;
  open: boolean;
}

interface ToastContextValue {
  toast: (options: ToastOptions) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const TONE_ICON = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: TriangleAlert,
  info: Info,
} as const;

const TONE_CLASS = {
  success: 'border-success/25 bg-success-soft',
  error: 'border-destructive/25 bg-destructive-soft',
  warning: 'border-warning/30 bg-warning-soft',
  info: 'border-border bg-surface',
} as const;

const TONE_ICON_CLASS = {
  success: 'text-success',
  error: 'text-destructive',
  warning: 'text-warning',
  info: 'text-primary',
} as const;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [entries, setEntries] = useState<ToastEntry[]>([]);

  const toast = useCallback((options: ToastOptions) => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setEntries((current) => [...current.slice(-3), { ...options, id, open: true }]);
  }, []);

  const value = useMemo<ToastContextValue>(
    () => ({
      toast,
      success: (title, description) =>
        toast({ title, tone: 'success', ...(description ? { description } : {}) }),
      error: (title, description) =>
        toast({
          title,
          tone: 'error',
          // Erro fica mais tempo: o usuario precisa ler o que fazer.
          durationMs: 8000,
          ...(description ? { description } : {}),
        }),
    }),
    [toast],
  );

  return (
    <ToastContext.Provider value={value}>
      <ToastPrimitive.Provider swipeDirection="right">
        {children}

        {entries.map((entry) => {
          const tone = entry.tone ?? 'info';
          const Icon = TONE_ICON[tone];

          return (
            <ToastPrimitive.Root
              key={entry.id}
              open={entry.open}
              duration={entry.durationMs ?? (entry.undo ? 8000 : 4500)}
              onOpenChange={(open) => {
                if (!open) {
                  setEntries((current) => current.filter((item) => item.id !== entry.id));
                }
              }}
              className={cn(
                'pointer-events-auto flex w-full items-start gap-3 rounded-lg border p-3 shadow-lg animate-slide-up',
                TONE_CLASS[tone],
              )}
            >
              <Icon
                className={cn('mt-0.5 h-5 w-5 shrink-0', TONE_ICON_CLASS[tone])}
                aria-hidden="true"
              />

              <div className="min-w-0 flex-1">
                <ToastPrimitive.Title className="text-sm font-medium text-foreground">
                  {entry.title}
                </ToastPrimitive.Title>
                {entry.description ? (
                  <ToastPrimitive.Description className="mt-0.5 text-sm text-muted-foreground">
                    {entry.description}
                  </ToastPrimitive.Description>
                ) : null}
              </div>

              {entry.undo ? (
                <ToastPrimitive.Action
                  altText="Desfazer a ultima acao"
                  onClick={() => void entry.undo?.onUndo()}
                  className="shrink-0 rounded-md border border-border bg-surface px-2.5 py-1 text-xs font-medium hover:bg-muted"
                >
                  {entry.undo.label ?? 'Desfazer'}
                </ToastPrimitive.Action>
              ) : null}

              <ToastPrimitive.Close
                aria-label="Fechar aviso"
                className="shrink-0 rounded p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </ToastPrimitive.Close>
            </ToastPrimitive.Root>
          );
        })}

        <ToastPrimitive.Viewport className="pointer-events-none fixed bottom-0 right-0 z-[60] flex w-full max-w-sm flex-col gap-2 p-4" />
      </ToastPrimitive.Provider>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const context = useContext(ToastContext);
  if (!context) throw new Error('useToast precisa estar dentro de ToastProvider.');
  return context;
}
