/**
 * Modais, drawers e confirmacoes destrutivas.
 *
 * Toda acao sem volta abre um modal com titulo claro, descricao do que sera
 * afetado, a consequencia, botao vermelho com verbo especifico e "Cancelar"
 * em cinza. O foco inicial fica no botao seguro.
 */
import * as DialogPrimitive from '@radix-ui/react-dialog';
import { AlertTriangle, X } from 'lucide-react';
import {
  forwardRef,
  useRef,
  useState,
  type ComponentPropsWithoutRef,
  type ElementRef,
  type ReactNode,
} from 'react';

import { cn } from '../../lib/utils';
import { Button } from './Button';
import { Field, Textarea } from './index';

export const Dialog = DialogPrimitive.Root;
export const DialogTrigger = DialogPrimitive.Trigger;
export const DialogClose = DialogPrimitive.Close;

const Overlay = forwardRef<
  ElementRef<typeof DialogPrimitive.Overlay>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Overlay>
>(function Overlay({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Overlay
      ref={ref}
      className={cn('fixed inset-0 z-50 bg-foreground/40 animate-fade-in', className)}
      {...props}
    />
  );
});

export interface DialogContentProps
  extends ComponentPropsWithoutRef<typeof DialogPrimitive.Content> {
  /** 'modal' centraliza; 'drawer' desliza pela lateral (vira folha no celular). */
  layout?: 'modal' | 'drawer';
  size?: 'sm' | 'md' | 'lg';
}

export const DialogContent = forwardRef<
  ElementRef<typeof DialogPrimitive.Content>,
  DialogContentProps
>(function DialogContent({ className, children, layout = 'modal', size = 'md', ...props }, ref) {
  const widths = { sm: 'sm:max-w-md', md: 'sm:max-w-lg', lg: 'sm:max-w-3xl' }[size];

  return (
    <DialogPrimitive.Portal>
      <Overlay />
      <DialogPrimitive.Content
        ref={ref}
        className={cn(
          'fixed z-[60] flex flex-col bg-surface shadow-xl focus:outline-none',
          layout === 'drawer'
            ? // Celular: folha inferior. Desktop: painel lateral.
              'inset-x-0 bottom-0 top-16 rounded-t-xl sm:inset-y-0 sm:left-auto sm:right-0 sm:top-0 sm:w-full sm:max-w-xl sm:rounded-none sm:border-l sm:animate-slide-in-right'
            : cn(
                'inset-x-3 top-1/2 max-h-[88vh] -translate-y-1/2 rounded-xl border border-border animate-slide-up',
                'sm:left-1/2 sm:right-auto sm:w-full sm:-translate-x-1/2',
                widths,
              ),
          className,
        )}
        {...props}
      >
        {children}
        <DialogPrimitive.Close
          className="absolute right-3 top-3 rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
          aria-label="Fechar"
        >
          <X className="h-4 w-4" aria-hidden="true" />
        </DialogPrimitive.Close>
      </DialogPrimitive.Content>
    </DialogPrimitive.Portal>
  );
});

export const DialogHeader = ({ className, ...props }: { className?: string; children: ReactNode }) => (
  <div className={cn('shrink-0 border-b border-border p-4 pr-12 sm:p-5 sm:pr-12', className)} {...props} />
);

export const DialogTitle = forwardRef<
  ElementRef<typeof DialogPrimitive.Title>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(function DialogTitle({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Title
      ref={ref}
      className={cn('text-base font-semibold text-foreground', className)}
      {...props}
    />
  );
});

export const DialogDescription = forwardRef<
  ElementRef<typeof DialogPrimitive.Description>,
  ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(function DialogDescription({ className, ...props }, ref) {
  return (
    <DialogPrimitive.Description
      ref={ref}
      className={cn('mt-1 text-sm text-muted-foreground', className)}
      {...props}
    />
  );
});

export const DialogBody = ({ className, ...props }: { className?: string; children: ReactNode }) => (
  <div className={cn('min-h-0 flex-1 overflow-y-auto p-4 sm:p-5 scroll-thin', className)} {...props} />
);

export const DialogFooter = ({
  className,
  ...props
}: {
  className?: string;
  children: ReactNode;
}) => (
  <div
    className={cn(
      'shrink-0 flex flex-col-reverse gap-2 border-t border-border p-4 sm:flex-row sm:justify-end sm:p-5',
      className,
    )}
    {...props}
  />
);

export interface ConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  /** O que sera afetado. */
  description: string;
  /** A consequencia da acao, em uma frase. */
  consequence?: string;
  /** Verbo especifico: "Arquivar lead", "Estornar pagamento". */
  confirmLabel: string;
  cancelLabel?: string;
  tone?: 'destructive' | 'primary';
  loading?: boolean;
  /** Quando true, exige um motivo escrito antes de confirmar. */
  requireReason?: boolean;
  reasonLabel?: string;
  onConfirm: (reason?: string) => void;
}

export function ConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  consequence,
  confirmLabel,
  cancelLabel = 'Cancelar',
  tone = 'destructive',
  loading,
  requireReason,
  reasonLabel = 'Motivo',
  onConfirm,
}: ConfirmDialogProps) {
  const [reason, setReason] = useState('');
  // O foco inicial vai para "Cancelar": nunca para a acao destrutiva.
  const cancelRef = useRef<HTMLButtonElement>(null);
  const reasonMissing = Boolean(requireReason) && reason.trim().length < 3;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setReason('');
        onOpenChange(next);
      }}
    >
      <DialogContent
        size="sm"
        onOpenAutoFocus={(event) => {
          event.preventDefault();
          cancelRef.current?.focus();
        }}
      >
        <DialogHeader>
          <div className="flex items-start gap-3">
            <span
              className={cn(
                'mt-0.5 rounded-full p-1.5',
                tone === 'destructive'
                  ? 'bg-destructive-soft text-destructive'
                  : 'bg-primary-soft text-primary',
              )}
            >
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {(consequence || requireReason) && (
          <DialogBody className="space-y-4">
            {consequence ? (
              <p className="rounded-md border border-border bg-muted p-3 text-sm text-muted-foreground">
                {consequence}
              </p>
            ) : null}

            {requireReason ? (
              <Field
                label={reasonLabel}
                htmlFor="confirm-reason"
                required
                hint="O motivo fica registrado no historico e nao pode ser apagado."
              >
                <Textarea
                  id="confirm-reason"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Descreva o motivo desta acao"
                />
              </Field>
            ) : null}
          </DialogBody>
        )}

        <DialogFooter>
          <Button
            ref={cancelRef}
            variant="secondary"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            variant={tone === 'destructive' ? 'destructive' : 'primary'}
            onClick={() => onConfirm(requireReason ? reason.trim() : undefined)}
            loading={loading}
            disabled={reasonMissing}
          >
            {confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
