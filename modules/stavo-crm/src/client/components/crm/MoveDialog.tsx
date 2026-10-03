/**
 * Formulario de movimentacao.
 *
 * Movimentos comuns concluem direto (com toast e "Desfazer" na tela do CRM).
 * Movimentos criticos exigem este formulario:
 *   NEGOTIATION      -> servicos e valores propostos
 *   AWAITING_PAYMENT -> venda, vencimento e valor a receber
 *   WON              -> confirmacao do recebimento
 *   LOST             -> motivo obrigatorio
 */
import { Plus, Trash2 } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';

import { formatMoney } from '@shared/format';
import type { MoveLeadInput } from '@shared/schemas';
import {
  Button,
  Callout,
  Field,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '../ui';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/Dialog';
import type { LeadDetailResponse, LossReasonOption, ServiceOption, StageOption } from '../../hooks/useCrm';

const today = () => new Date().toISOString().slice(0, 10);
const inDays = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

interface ItemDraft {
  serviceId: string;
  unitPrice: string;
  quantity: number;
}

export interface MoveDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadName: string;
  destination: StageOption | null;
  services: ServiceOption[];
  lossReasons: LossReasonOption[];
  detail: LeadDetailResponse | null | undefined;
  loading?: boolean;
  onConfirm: (payload: Partial<MoveLeadInput>) => void;
}

export function MoveDialog({
  open,
  onOpenChange,
  leadName,
  destination,
  services,
  lossReasons,
  detail,
  loading,
  onConfirm,
}: MoveDialogProps) {
  const semantic = destination?.semanticKey ?? '';
  const activeServices = useMemo(() => services.filter((service) => service.active), [services]);

  const [items, setItems] = useState<ItemDraft[]>([]);
  const [agreedAt, setAgreedAt] = useState(today());
  const [dueDate, setDueDate] = useState(inDays(7));
  const [notes, setNotes] = useState('');
  const [lossReasonId, setLossReasonId] = useState('');
  const [lossNote, setLossNote] = useState('');
  const [lossFollowUp, setLossFollowUp] = useState('');
  const [receivableId, setReceivableId] = useState('');
  const [paymentDate, setPaymentDate] = useState(today());
  const [error, setError] = useState<string | null>(null);

  const openReceivables = useMemo(
    () =>
      (detail?.finance.receivables ?? []).filter(
        (item) => item.status === 'PENDING' || item.status === 'OVERDUE',
      ),
    [detail],
  );

  // Ao abrir, parte da proposta ja registrada no lead.
  useEffect(() => {
    if (!open) return;
    setError(null);
    setAgreedAt(today());
    setDueDate(inDays(7));
    setNotes('');
    setLossReasonId(lossReasons.find((reason) => reason.active)?.id ?? '');
    setLossNote('');
    setLossFollowUp('');
    setPaymentDate(today());
    setReceivableId(openReceivables[0]?.id ?? '');

    const fromInterests = (detail?.interests ?? [])
      .filter((interest) => interest.status === 'OPEN')
      .map((interest) => ({
        serviceId: interest.serviceId,
        unitPrice: interest.proposedPrice ?? '0.00',
        quantity: 1,
      }));

    setItems(
      fromInterests.length > 0
        ? fromInterests
        : activeServices[0]
          ? [{ serviceId: activeServices[0].id, unitPrice: activeServices[0].defaultPrice, quantity: 1 }]
          : [],
    );
  }, [open, detail, activeServices, lossReasons, openReceivables]);

  const total = items.reduce(
    (sum, item) => sum + Number(item.unitPrice || 0) * (item.quantity || 1),
    0,
  );

  const updateItem = (index: number, patch: Partial<ItemDraft>) => {
    setItems((current) =>
      current.map((item, position) => (position === index ? { ...item, ...patch } : item)),
    );
  };

  const addItem = () => {
    const service = activeServices[0];
    if (!service) return;
    setItems((current) => [
      ...current,
      { serviceId: service.id, unitPrice: service.defaultPrice, quantity: 1 },
    ]);
  };

  const handleConfirm = () => {
    setError(null);

    if (semantic === 'NEGOTIATION') {
      if (items.length === 0) {
        setError('Selecione pelo menos um servico para registrar a proposta.');
        return;
      }
      onConfirm({
        negotiation: {
          interests: items.map((item) => ({
            serviceId: item.serviceId,
            proposedPrice: normalizePrice(item.unitPrice),
            notes: null,
          })),
          notes: notes || null,
        },
      });
      return;
    }

    if (semantic === 'AWAITING_PAYMENT') {
      // Ja existindo cobranca em aberto, nao e obrigatorio criar outra venda.
      if (items.length === 0 && openReceivables.length === 0) {
        setError('Informe o servico e o valor a receber.');
        return;
      }
      onConfirm({
        sale:
          items.length > 0
            ? {
                items: items.map((item) => ({
                  serviceId: item.serviceId,
                  unitPrice: normalizePrice(item.unitPrice),
                  quantity: item.quantity,
                })),
                agreedAt,
                dueDate,
                notes: notes || null,
                paidNow: false,
                paymentDate: null,
              }
            : null,
      });
      return;
    }

    if (semantic === 'WON') {
      if (receivableId) {
        onConfirm({ won: { receivableId, paymentDate, amount: null, sale: null } });
        return;
      }
      if (items.length === 0) {
        setError('Registre a venda ou selecione uma cobranca em aberto.');
        return;
      }
      onConfirm({
        won: {
          receivableId: null,
          paymentDate,
          amount: null,
          sale: {
            items: items.map((item) => ({
              serviceId: item.serviceId,
              unitPrice: normalizePrice(item.unitPrice),
              quantity: item.quantity,
            })),
            agreedAt,
            dueDate: paymentDate,
            notes: notes || null,
            paidNow: true,
            paymentDate,
          },
        },
      });
      return;
    }

    if (semantic === 'LOST') {
      if (!lossReasonId) {
        setError('Selecione o motivo da perda.');
        return;
      }
      onConfirm({
        loss: {
          lossReasonId,
          note: lossNote || null,
          followUpAt: lossFollowUp || null,
        },
      });
      return;
    }

    onConfirm({});
  };

  const titles: Record<string, string> = {
    NEGOTIATION: 'Registrar negociacao',
    AWAITING_PAYMENT: 'Registrar valor a receber',
    WON: 'Confirmar venda concluida',
    LOST: 'Registrar perda',
  };

  const descriptions: Record<string, string> = {
    NEGOTIATION: 'Escolha os servicos e ajuste o valor proposto. O preco padrao e apenas sugestao.',
    AWAITING_PAYMENT:
      'O valor entra como pendente. Ele NAO conta como receita ate o recebimento ser confirmado.',
    WON: 'Confirme o recebimento. O valor sai de pendente e entra na receita realizada na data informada.',
    LOST: 'O motivo fica registrado no historico. O lead pode ser reaberto depois sem apagar esta perda.',
  };

  const showItems = semantic === 'NEGOTIATION' || semantic === 'AWAITING_PAYMENT' ||
    (semantic === 'WON' && !receivableId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>{titles[semantic] ?? 'Mover lead'}</DialogTitle>
          <DialogDescription>
            {leadName} · {descriptions[semantic] ?? 'Confirme a movimentacao.'}
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4">
          {semantic === 'WON' && openReceivables.length > 0 ? (
            <Field
              label="Cobranca a confirmar"
              htmlFor="move-receivable"
              hint="Selecione a cobranca em aberto que foi recebida."
            >
              <Select value={receivableId} onValueChange={setReceivableId}>
                <SelectTrigger id="move-receivable">
                  <SelectValue placeholder="Registrar uma nova venda" />
                </SelectTrigger>
                <SelectContent>
                  {openReceivables.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.descriptionSnapshot} — {formatMoney(item.amount)} (vence {item.dueDate})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
          ) : null}

          {showItems ? (
            <div className="space-y-2">
              <p className="text-sm font-medium">Servicos</p>

              {activeServices.length === 0 ? (
                <Callout tone="warning" title="Nenhum servico ativo">
                  Cadastre um servico em Servicos antes de registrar valores.
                </Callout>
              ) : null}

              {items.map((item, index) => {
                const service = activeServices.find((option) => option.id === item.serviceId);
                return (
                  <div
                    key={`${item.serviceId}-${index}`}
                    className="grid grid-cols-1 gap-2 rounded-md border border-border p-2 sm:grid-cols-[1fr,120px,80px,40px]"
                  >
                    <Select
                      value={item.serviceId}
                      onValueChange={(value) => {
                        const next = activeServices.find((option) => option.id === value);
                        updateItem(index, {
                          serviceId: value,
                          ...(next ? { unitPrice: next.defaultPrice } : {}),
                        });
                      }}
                    >
                      <SelectTrigger aria-label="Servico">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {activeServices.map((option) => (
                          <SelectItem key={option.id} value={option.id}>
                            {option.name}
                            {option.billingType === 'RECURRING_MONTHLY' ? ' (mensal)' : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>

                    <Input
                      inputMode="decimal"
                      aria-label="Valor negociado"
                      value={item.unitPrice}
                      onChange={(event) => updateItem(index, { unitPrice: event.target.value })}
                    />

                    <Input
                      type="number"
                      min={1}
                      aria-label="Quantidade"
                      value={item.quantity}
                      onChange={(event) =>
                        updateItem(index, { quantity: Math.max(1, Number(event.target.value) || 1) })
                      }
                      disabled={service?.billingType === 'RECURRING_MONTHLY'}
                    />

                    <Button
                      variant="ghost"
                      size="icon"
                      aria-label="Remover servico"
                      onClick={() => setItems((current) => current.filter((_, i) => i !== index))}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" aria-hidden="true" />
                    </Button>
                  </div>
                );
              })}

              <Button variant="secondary" size="sm" onClick={addItem} disabled={activeServices.length === 0}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                Adicionar servico
              </Button>

              <p className="text-sm text-muted-foreground">
                Total: <span className="font-medium text-foreground">{formatMoney(total)}</span>
              </p>
            </div>
          ) : null}

          {semantic === 'AWAITING_PAYMENT' ? (
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Data do acordo" htmlFor="move-agreed">
                <Input
                  id="move-agreed"
                  type="date"
                  value={agreedAt}
                  onChange={(event) => setAgreedAt(event.target.value)}
                />
              </Field>
              <Field
                label="Vencimento"
                htmlFor="move-due"
                hint="Para servicos mensais, esta e a data da primeira cobranca."
              >
                <Input
                  id="move-due"
                  type="date"
                  value={dueDate}
                  onChange={(event) => setDueDate(event.target.value)}
                />
              </Field>
            </div>
          ) : null}

          {semantic === 'WON' ? (
            <Field
              label="Data do recebimento"
              htmlFor="move-payment"
              hint="A receita realizada e contabilizada nesta data."
            >
              <Input
                id="move-payment"
                type="date"
                value={paymentDate}
                onChange={(event) => setPaymentDate(event.target.value)}
              />
            </Field>
          ) : null}

          {semantic === 'LOST' ? (
            <>
              <Field label="Motivo da perda" htmlFor="move-loss-reason" required>
                <Select value={lossReasonId} onValueChange={setLossReasonId}>
                  <SelectTrigger id="move-loss-reason">
                    <SelectValue placeholder="Selecione o motivo" />
                  </SelectTrigger>
                  <SelectContent>
                    {lossReasons
                      .filter((reason) => reason.active)
                      .map((reason) => (
                        <SelectItem key={reason.id} value={reason.id}>
                          {reason.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </Field>

              <Field label="Observacao" htmlFor="move-loss-note">
                <Textarea
                  id="move-loss-note"
                  value={lossNote}
                  onChange={(event) => setLossNote(event.target.value)}
                  placeholder="Opcional"
                />
              </Field>

              <Field
                label="Recontatar futuramente em"
                htmlFor="move-loss-followup"
                hint="Opcional. Cria um follow-up agendado sem precisar de outra coluna."
              >
                <Input
                  id="move-loss-followup"
                  type="date"
                  value={lossFollowUp}
                  onChange={(event) => setLossFollowUp(event.target.value)}
                />
              </Field>
            </>
          ) : null}

          {semantic !== 'LOST' ? (
            <Field label="Observacoes" htmlFor="move-notes">
              <Textarea
                id="move-notes"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Opcional"
              />
            </Field>
          ) : null}

          {semantic === 'AWAITING_PAYMENT' ? (
            <Callout tone="warning" title="Isto ainda nao e receita">
              O valor aparece em &quot;Aguardando pagamento&quot;. A receita so e contabilizada
              quando voce confirmar o recebimento.
            </Callout>
          ) : null}

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </DialogBody>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button
            variant={semantic === 'LOST' ? 'destructive' : 'primary'}
            onClick={handleConfirm}
            loading={loading}
          >
            {semantic === 'LOST' ? 'Registrar perda' : 'Confirmar'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Aceita "1.234,56" e "1234.56"; devolve sempre o formato canonico. */
function normalizePrice(value: string): string {
  const raw = value.trim().replace(/[R$\s]/gi, '');
  const normalized = raw.includes(',') ? raw.replace(/\./g, '').replace(',', '.') : raw;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed.toFixed(2) : '0.00';
}
