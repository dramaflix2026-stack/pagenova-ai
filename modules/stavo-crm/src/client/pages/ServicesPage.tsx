/**
 * Servicos.
 *
 * Nenhum servico e fixo. Alterar o preco padrao NAO muda propostas, vendas,
 * recebiveis ou assinaturas ja existentes -- todos guardam snapshot proprio.
 * Servico com historico e desativado, nunca apagado.
 */
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, Plus, Power, PowerOff } from 'lucide-react';
import { useState } from 'react';

import { BILLING_TYPE_LABELS } from '@shared/constants';
import { formatMoney } from '@shared/format';
import { PageBody, PageHeader } from '../components/layout/AppLayout';
import {
  Badge,
  Button,
  Callout,
  Card,
  CardContent,
  EmptyState,
  ErrorState,
  Field,
  Input,
  LoadingBlock,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
} from '../components/ui';
import {
  ConfirmDialog,
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../components/ui/Dialog';
import { useToast } from '../components/ui/Toast';
import { ApiError, api } from '../lib/api';
import { useServices, type ServiceOption } from '../hooks/useCrm';

export default function ServicesPage() {
  const services = useServices();
  const queryClient = useQueryClient();
  const toast = useToast();

  const [editing, setEditing] = useState<ServiceOption | null>(null);
  const [creating, setCreating] = useState(false);
  const [deactivating, setDeactivating] = useState<ServiceOption | null>(null);

  const invalidate = () => {
    void queryClient.invalidateQueries({ queryKey: ['services'] });
  };

  const toggle = useMutation({
    mutationFn: (service: ServiceOption) =>
      api.patch(`/services/${service.id}`, { active: !service.active }),
    onSuccess: (_data, service) => {
      toast.success(
        service.active ? 'Servico desativado' : 'Servico reativado',
        service.active ? 'Leads e vendas antigas nao foram alterados.' : undefined,
      );
      invalidate();
      setDeactivating(null);
    },
    onError: () => toast.error('Nao foi possivel alterar o servico'),
  });

  const list = services.data?.services ?? [];
  const active = list.filter((service) => service.active);
  const inactive = list.filter((service) => !service.active);

  return (
    <>
      <PageHeader
        title="Servicos"
        description="Catalogo usado nas propostas e vendas."
        actions={
          <Button onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            Novo servico
          </Button>
        }
      />

      <PageBody className="space-y-4">
        <Callout tone="info" title="Historico protegido">
          Alterar o preco padrao muda apenas as proximas propostas. Vendas, recebiveis e
          assinaturas ja registrados mantem o valor original.
        </Callout>

        {services.isLoading ? (
          <LoadingBlock />
        ) : services.isError ? (
          <ErrorState
            message="Nao foi possivel carregar os servicos."
            onRetry={() => void services.refetch()}
          />
        ) : list.length === 0 ? (
          <EmptyState
            title="Nenhum servico cadastrado"
            description="Cadastre o que voce vende para poder registrar propostas e vendas."
            action={
              <Button onClick={() => setCreating(true)}>
                <Plus className="h-4 w-4" aria-hidden="true" />
                Criar primeiro servico
              </Button>
            }
          />
        ) : (
          <>
            <ServiceList
              title="Ativos"
              services={active}
              onEdit={setEditing}
              onToggle={(service) => setDeactivating(service)}
            />
            {inactive.length > 0 ? (
              <ServiceList
                title="Inativos"
                services={inactive}
                onEdit={setEditing}
                onToggle={(service) => toggle.mutate(service)}
              />
            ) : null}
          </>
        )}
      </PageBody>

      <ServiceDialog
        open={creating || Boolean(editing)}
        service={editing}
        onOpenChange={(open) => {
          if (!open) {
            setCreating(false);
            setEditing(null);
          }
        }}
        onSaved={() => {
          invalidate();
          setCreating(false);
          setEditing(null);
        }}
      />

      <ConfirmDialog
        open={Boolean(deactivating)}
        onOpenChange={(open) => {
          if (!open) setDeactivating(null);
        }}
        title="Desativar servico"
        description={`"${deactivating?.name ?? ''}" deixa de aparecer em novas propostas.`}
        consequence="Leads, vendas, recebiveis e assinaturas ja registrados continuam exatamente como estao. Voce pode reativar o servico depois."
        confirmLabel="Desativar servico"
        tone="destructive"
        loading={toggle.isPending}
        onConfirm={() => deactivating && toggle.mutate(deactivating)}
      />
    </>
  );
}

function ServiceList({
  title,
  services,
  onEdit,
  onToggle,
}: {
  title: string;
  services: ServiceOption[];
  onEdit: (service: ServiceOption) => void;
  onToggle: (service: ServiceOption) => void;
}) {
  if (services.length === 0) return null;

  return (
    <section>
      <h2 className="mb-2 text-sm font-semibold">{title}</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {services.map((service) => (
          <Card key={service.id}>
            <CardContent className="space-y-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{service.name}</p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {BILLING_TYPE_LABELS[service.billingType]}
                  </p>
                </div>
                {service.active ? (
                  <Badge tone="success">Ativo</Badge>
                ) : (
                  <Badge tone="neutral">Inativo</Badge>
                )}
              </div>

              {service.description ? (
                <p className="line-clamp-2 text-xs text-muted-foreground">{service.description}</p>
              ) : null}

              <p className="text-lg font-semibold">
                {formatMoney(service.defaultPrice)}
                {service.billingType === 'RECURRING_MONTHLY' ? (
                  <span className="text-sm font-normal text-muted-foreground">/mes</span>
                ) : null}
              </p>

              <div className="flex gap-2">
                <Button variant="secondary" size="sm" onClick={() => onEdit(service)}>
                  <Pencil className="h-4 w-4" aria-hidden="true" />
                  Editar
                </Button>
                <Button
                  variant={service.active ? 'ghost' : 'secondary'}
                  size="sm"
                  onClick={() => onToggle(service)}
                >
                  {service.active ? (
                    <>
                      <PowerOff className="h-4 w-4" aria-hidden="true" />
                      Desativar
                    </>
                  ) : (
                    <>
                      <Power className="h-4 w-4" aria-hidden="true" />
                      Reativar
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  );
}

function ServiceDialog({
  open,
  service,
  onOpenChange,
  onSaved,
}: {
  open: boolean;
  service: ServiceOption | null;
  onOpenChange: (open: boolean) => void;
  onSaved: () => void;
}) {
  const toast = useToast();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [billingType, setBillingType] = useState<'ONE_TIME' | 'RECURRING_MONTHLY'>('ONE_TIME');
  const [defaultPrice, setDefaultPrice] = useState('0.00');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loadedId, setLoadedId] = useState<string | null>(null);

  // Sincroniza o formulario quando um servico diferente e aberto.
  const currentId = service?.id ?? '__novo__';
  if (open && loadedId !== currentId) {
    setLoadedId(currentId);
    setName(service?.name ?? '');
    setDescription(service?.description ?? '');
    setBillingType(service?.billingType ?? 'ONE_TIME');
    setDefaultPrice(service?.defaultPrice ?? '0.00');
    setError(null);
  }

  const submit = async () => {
    if (!name.trim()) {
      setError('Informe o nome do servico.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload = {
        name: name.trim(),
        description: description.trim() || null,
        billingType,
        defaultPrice: normalizePrice(defaultPrice),
      };

      if (service) await api.patch(`/services/${service.id}`, payload);
      else await api.post('/services', payload);

      toast.success(service ? 'Servico atualizado' : 'Servico criado');
      onSaved();
      setLoadedId(null);
    } catch (caught) {
      setError(caught instanceof ApiError ? caught.message : 'Nao foi possivel salvar o servico.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) setLoadedId(null);
        onOpenChange(next);
      }}
    >
      <DialogContent size="sm">
        <DialogHeader>
          <DialogTitle>{service ? 'Editar servico' : 'Novo servico'}</DialogTitle>
          <DialogDescription>
            O preco padrao preenche propostas e vendas, mas pode ser alterado em cada negocio.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4">
          <Field label="Nome" htmlFor="service-name" required>
            <Input
              id="service-name"
              value={name}
              onChange={(event) => setName(event.target.value)}
              autoFocus
            />
          </Field>

          <Field label="Descricao" htmlFor="service-description">
            <Textarea
              id="service-description"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
            />
          </Field>

          <Field
            label="Tipo de cobranca"
            htmlFor="service-billing"
            hint={
              service
                ? 'Servicos com vendas registradas nao podem trocar de tipo.'
                : 'Recorrente mensal gera uma cobranca por competencia.'
            }
          >
            <Select
              value={billingType}
              onValueChange={(value) => setBillingType(value as typeof billingType)}
            >
              <SelectTrigger id="service-billing">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ONE_TIME">Pagamento unico</SelectItem>
                <SelectItem value="RECURRING_MONTHLY">Recorrente mensal</SelectItem>
              </SelectContent>
            </Select>
          </Field>

          <Field label="Preco padrao" htmlFor="service-price" required>
            <Input
              id="service-price"
              inputMode="decimal"
              value={defaultPrice}
              onChange={(event) => setDefaultPrice(event.target.value)}
            />
          </Field>

          {error ? (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          ) : null}
        </DialogBody>

        <DialogFooter>
          <Button variant="secondary" onClick={() => onOpenChange(false)} disabled={saving}>
            Cancelar
          </Button>
          <Button onClick={submit} loading={saving} loadingText="Salvando...">
            Salvar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function normalizePrice(value: string): string {
  const raw = value.trim().replace(/[R$\s]/gi, '');
  const normalized = raw.includes(',') ? raw.replace(/\./g, '').replace(',', '.') : raw;
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed.toFixed(2) : '0.00';
}
