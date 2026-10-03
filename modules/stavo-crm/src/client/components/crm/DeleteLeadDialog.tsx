/**
 * Confirmacao da exclusao definitiva de um lead.
 *
 * Diferente de arquivar, aqui nada sobra. Por isso a janela nao se contenta
 * em avisar "nao tem volta": ela consulta o servidor e lista os numeros que
 * vao sumir do painel -- valor aguardando pagamento, valor ja recebido,
 * assinaturas, historico.
 *
 * O botao so libera depois de marcar a caixa de confirmacao. E um clique a
 * mais de proposito: exclusao de dinheiro nao pode acontecer por engano.
 */
import { useQuery } from '@tanstack/react-query';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import { formatMoney } from '@shared/format';
import { api } from '../../lib/api';
import { Button, Checkbox, LoadingBlock } from '../ui';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/Dialog';

export interface LeadDeletionImpact {
  leadName: string;
  archived: boolean;
  sales: number;
  activeSubscriptions: number;
  activities: number;
  events: number;
  meetings: number;
  futureMeetings: number;
  openReceivables: { count: number; total: string };
  receivedPayments: { count: number; total: string };
}

export interface DeleteLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  leadId: string;
  leadName: string;
  loading?: boolean;
  onConfirm: () => void;
}

/** Monta a lista do que sera perdido, ja em portugues e sem item vazio. */
function itensPerdidos(impacto: LeadDeletionImpact): { texto: string; dinheiro: boolean }[] {
  const itens: { texto: string; dinheiro: boolean }[] = [];

  if (impacto.receivedPayments.count > 0) {
    itens.push({
      texto: `${formatMoney(impacto.receivedPayments.total)} ja recebidos sairao da receita do painel`,
      dinheiro: true,
    });
  }
  if (impacto.openReceivables.count > 0) {
    itens.push({
      texto: `${formatMoney(impacto.openReceivables.total)} aguardando pagamento deixarao de ser cobrados`,
      dinheiro: true,
    });
  }
  if (impacto.activeSubscriptions > 0) {
    itens.push({
      texto:
        impacto.activeSubscriptions === 1
          ? '1 assinatura ativa sera encerrada e apagada'
          : `${impacto.activeSubscriptions} assinaturas ativas serao encerradas e apagadas`,
      dinheiro: true,
    });
  }
  if (impacto.sales > 0) {
    itens.push({
      texto: impacto.sales === 1 ? '1 venda registrada' : `${impacto.sales} vendas registradas`,
      dinheiro: false,
    });
  }
  if (impacto.meetings > 0) {
    const futuras =
      impacto.futureMeetings > 0
        ? impacto.futureMeetings === 1
          ? ', incluindo 1 ainda agendada'
          : `, incluindo ${impacto.futureMeetings} ainda agendadas`
        : '';
    itens.push({
      texto:
        (impacto.meetings === 1
          ? '1 reuniao sera apagada da agenda'
          : `${impacto.meetings} reunioes serao apagadas da agenda`) + futuras,
      dinheiro: false,
    });
  }
  if (impacto.activities > 0) {
    itens.push({
      texto:
        impacto.activities === 1
          ? '1 anotacao ou tentativa de contato'
          : `${impacto.activities} anotacoes e tentativas de contato`,
      dinheiro: false,
    });
  }
  if (impacto.events > 0) {
    itens.push({
      texto: `${impacto.events} registros de historico (contatos, respostas, movimentacoes)`,
      dinheiro: false,
    });
  }

  return itens;
}

export function DeleteLeadDialog({
  open,
  onOpenChange,
  leadId,
  leadName,
  loading,
  onConfirm,
}: DeleteLeadDialogProps) {
  const [confirmado, setConfirmado] = useState(false);

  // Cada abertura recomeca desmarcada: a decisao anterior nao vale para esta.
  useEffect(() => {
    if (open) setConfirmado(false);
  }, [open]);

  const impacto = useQuery({
    queryKey: ['lead-deletion-impact', leadId],
    queryFn: () => api.get<{ impact: LeadDeletionImpact }>(`/leads/${leadId}/deletion-impact`),
    enabled: open,
    // Numero velho aqui seria pior que numero nenhum.
    staleTime: 0,
    gcTime: 0,
  });

  const dados = impacto.data?.impact ?? null;
  const itens = dados ? itensPerdidos(dados) : [];
  const temDinheiro = itens.some((item) => item.dinheiro);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent size="sm">
        <DialogHeader>
          <div className="flex items-start gap-3">
            <span className="mt-0.5 rounded-full bg-destructive-soft p-1.5 text-destructive">
              <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            </span>
            <div>
              <DialogTitle>Excluir lead definitivamente</DialogTitle>
              <DialogDescription>
                &ldquo;{leadName}&rdquo; sera apagado do sistema. Nao existe desfazer, nem lixeira.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <DialogBody className="space-y-4">
          {impacto.isLoading ? (
            <LoadingBlock label="Conferindo o que sera apagado..." />
          ) : impacto.isError ? (
            <p className="text-sm text-destructive" role="alert">
              Nao foi possivel conferir o que sera apagado. Feche e tente de novo -- excluir sem
              saber o que se perde nao e uma boa ideia.
            </p>
          ) : (
            <>
              {itens.length > 0 ? (
                <div className="rounded-md border border-destructive/30 bg-destructive-soft/40 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wide text-destructive">
                    Sera apagado junto
                  </p>
                  <ul className="mt-2 space-y-1.5 text-sm">
                    {itens.map((item) => (
                      <li key={item.texto} className="flex gap-2">
                        <span aria-hidden="true" className="text-destructive">
                          &bull;
                        </span>
                        <span className={item.dinheiro ? 'font-medium' : undefined}>
                          {item.texto}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  Este lead nao tem venda, cobranca nem historico registrado. Nada alem do proprio
                  card sera perdido.
                </p>
              )}

              {temDinheiro ? (
                <p className="text-sm text-muted-foreground">
                  O painel sera recalculado sem esses valores assim que voce confirmar.
                </p>
              ) : null}

              <label className="flex cursor-pointer items-start gap-2 text-sm">
                <Checkbox
                  checked={confirmado}
                  onCheckedChange={(valor) => setConfirmado(valor === true)}
                  aria-label="Confirmo que entendi que a exclusao e definitiva"
                />
                <span>Entendi que isso nao tem volta e quero excluir mesmo assim.</span>
              </label>
            </>
          )}
        </DialogBody>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={loading}>
            Cancelar
          </Button>
          <Button
            variant="destructive"
            onClick={onConfirm}
            disabled={!confirmado || loading || impacto.isLoading || impacto.isError}
            loading={loading}
          >
            <Trash2 className="h-4 w-4" aria-hidden="true" />
            Excluir definitivamente
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
