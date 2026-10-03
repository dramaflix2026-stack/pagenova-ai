/**
 * CRM Kanban.
 *
 * Desktop: arrastar e soltar (dnd-kit, com suporte a teclado).
 * Celular: o seletor "Mover para..." faz exatamente a mesma coisa -- nenhuma
 * funcao critica depende de arrastar.
 *
 * A atualizacao e otimista apenas porque existe rollback seguro: se a API
 * recusar o movimento, o card volta para a coluna original.
 */
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { Filter, Plus, Search, X } from 'lucide-react';
import { useMemo, useState } from 'react';

import { formatMoney } from '@shared/format';
import type { MoveLeadInput } from '@shared/schemas';
import { LeadCard, type BoardCardData } from '../components/crm/LeadCard';
import { LeadDrawer } from '../components/crm/LeadDrawer';
import { MoveDialog } from '../components/crm/MoveDialog';
import { NewLeadDialog } from '../components/crm/NewLeadDialog';
import { PageBody, PageHeader } from '../components/layout/AppLayout';
import {
  Badge,
  Button,
  EmptyState,
  ErrorState,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
} from '../components/ui';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '../components/ui/Dialog';
import { useToast } from '../components/ui/Toast';
import { ApiError } from '../lib/api';
import {
  useBoard,
  useFilterOptions,
  useLeadDetail,
  useLossReasons,
  useMoveLead,
  useServices,
  useSources,
  useStages,
  type BoardFilters,
  type StageOption,
} from '../hooks/useCrm';

/** Etapas que exigem formulario antes de concluir a movimentacao. */
const CRITICAL_SEMANTICS = new Set(['NEGOTIATION', 'AWAITING_PAYMENT', 'WON', 'LOST']);

export default function CrmPage() {
  const [filters, setFilters] = useState<BoardFilters>({ archived: 'EXCLUDE' });
  const [searchInput, setSearchInput] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [openLeadId, setOpenLeadId] = useState<string | null>(null);
  const [newLeadOpen, setNewLeadOpen] = useState(false);

  const [moveTarget, setMoveTarget] = useState<{ card: BoardCardData; stage: StageOption } | null>(
    null,
  );
  const [mobilePicker, setMobilePicker] = useState<BoardCardData | null>(null);

  const board = useBoard(filters);
  const stages = useStages();
  const services = useServices();
  const sources = useSources();
  const lossReasons = useLossReasons();
  const options = useFilterOptions();
  const moveLead = useMoveLead();
  const toast = useToast();

  const detailForMove = useLeadDetail(moveTarget?.card.id ?? null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
    useSensor(KeyboardSensor),
  );

  const stageList = useMemo(() => stages.data?.stages ?? [], [stages.data]);
  const activeFilterCount = Object.entries(filters).filter(
    ([key, value]) => value && !(key === 'archived' && value === 'EXCLUDE'),
  ).length;

  const applyMove = async (
    card: BoardCardData,
    stage: StageOption,
    extra: Partial<MoveLeadInput> = {},
  ) => {
    const input = {
      destinationStageId: stage.id,
      expectedCurrentStageId: card.stageId,
      ...extra,
    } as Omit<MoveLeadInput, 'idempotencyKey'>;

    try {
      await moveLead.mutateAsync({ leadId: card.id, input });

      toast.toast({
        title: `${card.internalName} movido para ${stage.name}`,
        tone: 'success',
        // "Desfazer" so aparece em movimentos comuns, onde reverter e seguro.
        ...(CRITICAL_SEMANTICS.has(stage.semanticKey)
          ? {}
          : {
              undo: {
                onUndo: async () => {
                  try {
                    await moveLead.mutateAsync({
                      leadId: card.id,
                      input: {
                        destinationStageId: card.stageId,
                        expectedCurrentStageId: stage.id,
                      } as Omit<MoveLeadInput, 'idempotencyKey'>,
                    });
                    toast.success('Movimento desfeito');
                  } catch {
                    toast.error('Nao foi possivel desfazer', 'A tela foi atualizada.');
                  }
                },
              },
            }),
      });

      setMoveTarget(null);
      setMobilePicker(null);
    } catch (error) {
      // Conflito de etapa: a tela estava desatualizada. Recarrega a posicao real.
      if (error instanceof ApiError && error.code === 'STAGE_CONFLICT') {
        toast.error('Este lead ja foi movido', error.message);
        void board.refetch();
        setMoveTarget(null);
        setMobilePicker(null);
        return;
      }
      toast.error(
        'Nao foi possivel mover o lead',
        error instanceof ApiError ? error.message : 'Tente novamente em instantes.',
      );
      void board.refetch();
    }
  };

  const requestMove = (card: BoardCardData, stage: StageOption) => {
    if (stage.id === card.stageId) return;

    // O servidor recusaria de qualquer forma; avisar aqui evita o erro seco.
    if (!card.canEdit) {
      toast.error(
        'Este lead nao e seu',
        card.owner
          ? `${card.owner.name} esta trabalhando este lead. Peca ao dono da conta para transferir.`
          : 'Voce nao tem permissao para mover este lead.',
      );
      return;
    }

    if (CRITICAL_SEMANTICS.has(stage.semanticKey)) {
      setMoveTarget({ card, stage });
      setMobilePicker(null);
      return;
    }

    void applyMove(card, stage);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const stageId = event.over?.id;
    if (!stageId || typeof stageId !== 'string') return;

    const card = board.data?.columns
      .flatMap((column) => column.cards)
      .find((item) => item.id === event.active.id);
    const stage = stageList.find((item) => item.id === stageId);
    if (!card || !stage) return;

    requestMove(card, stage);
  };

  const submitSearch = () => {
    setFilters((current) => ({ ...current, search: searchInput.trim() || undefined }));
  };

  return (
    <>
      <PageHeader
        title="CRM"
        description="Cada coluna representa uma etapa do processo comercial."
        actions={
          <>
            <Button variant="secondary" onClick={() => setShowFilters((value) => !value)}>
              <Filter className="h-4 w-4" aria-hidden="true" />
              Filtros
              {activeFilterCount > 0 ? <Badge tone="primary">{activeFilterCount}</Badge> : null}
            </Button>
            <Button onClick={() => setNewLeadOpen(true)}>
              <Plus className="h-4 w-4" aria-hidden="true" />
              Novo lead
            </Button>
          </>
        }
      />

      <div className="border-b border-border bg-surface px-4 py-3 sm:px-6">
        <div className="flex flex-wrap items-center gap-2">
          <div className="relative min-w-[200px] flex-1">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') submitSearch();
              }}
              placeholder="Buscar por nome, cidade ou nicho"
              aria-label="Buscar leads"
              className="pl-9"
            />
          </div>
          <Button variant="secondary" onClick={submitSearch}>
            Buscar
          </Button>

          {activeFilterCount > 0 ? (
            <Button
              variant="ghost"
              onClick={() => {
                setFilters({ archived: 'EXCLUDE' });
                setSearchInput('');
              }}
            >
              <X className="h-4 w-4" aria-hidden="true" />
              Limpar filtros
            </Button>
          ) : null}
        </div>

        {showFilters ? (
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <FilterSelect
              label="Origem"
              value={filters.sourceId}
              onChange={(value) => setFilters((current) => ({ ...current, sourceId: value }))}
              options={(sources.data?.sources ?? []).map((source) => ({
                value: source.id,
                label: source.name,
              }))}
            />
            <FilterSelect
              label="Servico"
              value={filters.serviceId}
              onChange={(value) => setFilters((current) => ({ ...current, serviceId: value }))}
              options={(services.data?.services ?? []).map((service) => ({
                value: service.id,
                label: service.name,
              }))}
            />
            <FilterSelect
              label="Cidade"
              value={filters.city}
              onChange={(value) => setFilters((current) => ({ ...current, city: value }))}
              options={(options.data?.cities ?? []).map((city) => ({ value: city, label: city }))}
            />
            <FilterSelect
              label="Nicho"
              value={filters.niche}
              onChange={(value) => setFilters((current) => ({ ...current, niche: value }))}
              options={(options.data?.niches ?? []).map((niche) => ({
                value: niche,
                label: niche,
              }))}
            />
            <FilterSelect
              label="Follow-up"
              value={filters.followUpStatus}
              onChange={(value) => setFilters((current) => ({ ...current, followUpStatus: value }))}
              options={[
                { value: 'OVERDUE', label: 'Atrasado' },
                { value: 'TODAY', label: 'Para hoje' },
                { value: 'UPCOMING', label: 'Futuro' },
                { value: 'NONE', label: 'Sem follow-up' },
              ]}
            />
            <FilterSelect
              label="Financeiro"
              value={filters.financialStatus}
              onChange={(value) =>
                setFilters((current) => ({ ...current, financialStatus: value }))
              }
              options={[
                { value: 'PENDING', label: 'Com valor pendente' },
                { value: 'OVERDUE', label: 'Com valor vencido' },
                { value: 'PAID', label: 'Com valor recebido' },
                { value: 'NONE', label: 'Sem financeiro' },
              ]}
            />
            <FilterSelect
              label="Dados"
              value={filters.completeness}
              onChange={(value) => setFilters((current) => ({ ...current, completeness: value }))}
              options={[
                { value: 'COMPLETE', label: 'Completos' },
                { value: 'INCOMPLETE', label: 'Incompletos' },
                { value: 'CRITICAL', label: 'Criticos' },
              ]}
            />
            <FilterSelect
              label="Arquivados"
              value={filters.archived}
              onChange={(value) =>
                setFilters((current) => ({ ...current, archived: value ?? 'EXCLUDE' }))
              }
              options={[
                { value: 'EXCLUDE', label: 'Ocultar arquivados' },
                { value: 'INCLUDE', label: 'Incluir arquivados' },
                { value: 'ONLY', label: 'Somente arquivados' },
              ]}
              allowEmpty={false}
            />
          </div>
        ) : null}
      </div>

      <PageBody className="px-0 py-0 sm:px-0 sm:py-0">
        {board.isLoading || stages.isLoading ? (
          <div className="scroll-thin flex gap-3 overflow-x-auto p-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-72 w-72 shrink-0" />
            ))}
          </div>
        ) : board.isError ? (
          <div className="p-6">
            <ErrorState
              message="Nao foi possivel carregar o quadro. Verifique sua conexao e tente novamente."
              onRetry={() => void board.refetch()}
            />
          </div>
        ) : (board.data?.totalCards ?? 0) === 0 && activeFilterCount === 0 ? (
          <EmptyState
            title="Nenhum lead ainda"
            description="Pesquise empresas no Google, importe uma planilha ou cadastre um lead manualmente."
            action={
              <Button onClick={() => setNewLeadOpen(true)}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                Cadastrar primeiro lead
              </Button>
            }
          />
        ) : (
          <DndContext sensors={sensors} onDragEnd={handleDragEnd}>
            <div className="scroll-thin flex gap-3 overflow-x-auto p-4">
              {(board.data?.columns ?? [])
                .filter((column) => column.active)
                .map((column) => (
                  <BoardColumn
                    key={column.id}
                    column={column}
                    onOpen={setOpenLeadId}
                    onRequestMove={(leadId) => {
                      const card = column.cards.find((item) => item.id === leadId);
                      if (card) setMobilePicker(card);
                    }}
                  />
                ))}
            </div>
          </DndContext>
        )}
      </PageBody>

      {/* Seletor "Mover para..." — funciona em qualquer tela. */}
      <Dialog open={Boolean(mobilePicker)} onOpenChange={() => setMobilePicker(null)}>
        <DialogContent size="sm">
          <DialogHeader>
            <DialogTitle>Mover para...</DialogTitle>
            <DialogDescription>
              {mobilePicker?.internalName} · escolha a nova etapa.
            </DialogDescription>
          </DialogHeader>
          <DialogBody className="space-y-1">
            {stageList
              .filter((stage) => stage.active && stage.id !== mobilePicker?.stageId)
              .map((stage) => (
                <button
                  key={stage.id}
                  type="button"
                  onClick={() => mobilePicker && requestMove(mobilePicker, stage)}
                  className="flex w-full items-center gap-3 rounded-md border border-border px-3 py-2.5 text-left text-sm hover:bg-muted"
                >
                  <span
                    className="h-2.5 w-2.5 shrink-0 rounded-full"
                    style={{ backgroundColor: stage.color }}
                    aria-hidden="true"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block font-medium">{stage.name}</span>
                    {stage.meaning ? (
                      <span className="block text-xs text-muted-foreground">{stage.meaning}</span>
                    ) : null}
                  </span>
                  {CRITICAL_SEMANTICS.has(stage.semanticKey) ? (
                    <Badge tone="warning">Pede confirmacao</Badge>
                  ) : null}
                </button>
              ))}
          </DialogBody>
        </DialogContent>
      </Dialog>

      <MoveDialog
        open={Boolean(moveTarget)}
        onOpenChange={(open) => {
          if (!open) setMoveTarget(null);
        }}
        leadName={moveTarget?.card.internalName ?? ''}
        destination={moveTarget?.stage ?? null}
        services={services.data?.services ?? []}
        lossReasons={lossReasons.data?.lossReasons ?? []}
        detail={detailForMove.data}
        loading={moveLead.isPending}
        onConfirm={(payload) => {
          if (moveTarget) void applyMove(moveTarget.card, moveTarget.stage, payload);
        }}
      />

      <LeadDrawer leadId={openLeadId} onOpenChange={() => setOpenLeadId(null)} />

      <NewLeadDialog
        open={newLeadOpen}
        onOpenChange={setNewLeadOpen}
        onCreated={(leadId) => {
          void board.refetch();
          setOpenLeadId(leadId);
        }}
      />
    </>
  );
}

function BoardColumn({
  column,
  onOpen,
  onRequestMove,
}: {
  column: {
    id: string;
    name: string;
    semanticKey: string;
    color: string;
    cardCount: number;
    financialTotal: string;
    cards: BoardCardData[];
  };
  onOpen: (leadId: string) => void;
  onRequestMove: (leadId: string) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  const showTotal = ['NEGOTIATION', 'AWAITING_PAYMENT', 'WON'].includes(column.semanticKey);

  return (
    <section
      ref={setNodeRef}
      className={`flex w-72 shrink-0 flex-col rounded-lg border bg-muted/40 ${
        isOver ? 'border-primary bg-primary-soft' : 'border-border'
      }`}
      aria-label={`Coluna ${column.name}`}
    >
      <header className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
        <div className="flex min-w-0 items-center gap-2">
          <span
            className="h-2.5 w-2.5 shrink-0 rounded-full"
            style={{ backgroundColor: column.color }}
            aria-hidden="true"
          />
          <h2 className="truncate text-sm font-semibold">{column.name}</h2>
        </div>
        <Badge tone="outline">{column.cardCount}</Badge>
      </header>

      {showTotal ? (
        <p className="border-b border-border px-3 py-1.5 text-xs text-muted-foreground">
          {column.semanticKey === 'WON'
            ? 'Recebido'
            : column.semanticKey === 'AWAITING_PAYMENT'
              ? 'A receber'
              : 'Em proposta'}
          :{' '}
          <span className="font-medium text-foreground">{formatMoney(column.financialTotal)}</span>
        </p>
      ) : null}

      <div className="scroll-thin flex max-h-[calc(100vh-16rem)] flex-col gap-2 overflow-y-auto p-2">
        {column.cards.length === 0 ? (
          <p className="px-2 py-6 text-center text-xs text-muted-foreground">
            Nenhum lead nesta etapa.
          </p>
        ) : (
          column.cards.map((card) => (
            <LeadCard key={card.id} card={card} onOpen={onOpen} onRequestMove={onRequestMove} />
          ))
        )}
      </div>
    </section>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
  allowEmpty = true,
}: {
  label: string;
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  options: { value: string; label: string }[];
  allowEmpty?: boolean;
}) {
  const EMPTY = '__todos__';

  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-muted-foreground">
      {label}
      <Select
        value={value ?? EMPTY}
        onValueChange={(next) => onChange(next === EMPTY ? undefined : next)}
      >
        <SelectTrigger aria-label={label}>
          <SelectValue placeholder="Todos" />
        </SelectTrigger>
        <SelectContent>
          {allowEmpty ? <SelectItem value={EMPTY}>Todos</SelectItem> : null}
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  );
}
