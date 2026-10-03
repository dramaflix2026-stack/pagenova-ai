/**
 * Cadastro manual de lead.
 *
 * Passa pela mesma deduplicacao global da importacao e da pesquisa do Google:
 * se ja existir um lead com o mesmo telefone, dominio ou nome+endereco, a
 * criacao e bloqueada e o card existente e apontado.
 */
import { useState } from 'react';

import { api, newIdempotencyKey } from '../../lib/api';
import { ApiError } from '../../lib/api';
import { useServices, useSources } from '../../hooks/useCrm';
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
import { useToast } from '../ui/Toast';

interface NewLeadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (leadId: string) => void;
}

const EMPTY = '__nenhum__';

export function NewLeadDialog({ open, onOpenChange, onCreated }: NewLeadDialogProps) {
  const toast = useToast();
  const services = useServices();
  const sources = useSources();

  const [form, setForm] = useState({
    internalName: '',
    sourceId: '',
    phone: '',
    whatsapp: '',
    email: '',
    instagram: '',
    website: '',
    demoUrl: '',
    mapsUrl: '',
    address: '',
    city: '',
    state: '',
    country: 'Brasil',
    niche: '',
    serviceId: '',
    proposedPrice: '',
    notes: '',
    nextFollowUpAt: '',
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [duplicate, setDuplicate] = useState<{ leadId: string; name: string; stage: string } | null>(
    null,
  );

  const set = (key: keyof typeof form, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  const reset = () => {
    setForm({
      internalName: '',
      sourceId: '',
      phone: '',
      whatsapp: '',
      email: '',
      instagram: '',
      website: '',
      demoUrl: '',
      mapsUrl: '',
      address: '',
      city: '',
      state: '',
      country: 'Brasil',
      niche: '',
      serviceId: '',
      proposedPrice: '',
      notes: '',
      nextFollowUpAt: '',
    });
    setError(null);
    setDuplicate(null);
  };

  const submit = async () => {
    setError(null);
    setDuplicate(null);

    if (!form.internalName.trim()) {
      setError('Informe o nome interno do lead.');
      return;
    }

    const contacts = [
      form.phone ? { type: 'PHONE', value: form.phone, isPrimary: true } : null,
      form.whatsapp ? { type: 'WHATSAPP', value: form.whatsapp, isPrimary: !form.phone } : null,
      form.email ? { type: 'EMAIL', value: form.email, isPrimary: false } : null,
    ].filter(Boolean);

    const links = [
      form.website ? { type: 'WEBSITE', url: form.website, isPrimary: true } : null,
      form.instagram ? { type: 'INSTAGRAM', url: form.instagram, isPrimary: false } : null,
      form.mapsUrl ? { type: 'MAPS', url: form.mapsUrl, isPrimary: false } : null,
      form.demoUrl ? { type: 'DEMO_OR_PROPOSAL', url: form.demoUrl, isPrimary: false } : null,
    ].filter(Boolean);

    setSaving(true);
    try {
      const response = await api.post<{ lead: { id: string }; warning: string | null }>('/leads', {
        internalName: form.internalName.trim(),
        originType: 'MANUAL',
        sourceId: form.sourceId || null,
        niche: form.niche || null,
        country: form.country || null,
        state: form.state || null,
        city: form.city || null,
        address: form.address || null,
        notes: form.notes || null,
        contacts,
        links,
        serviceId: form.serviceId || null,
        proposedPrice: form.proposedPrice || null,
        nextFollowUpAt: form.nextFollowUpAt || null,
        allowSharedIdentity: false,
        idempotencyKey: newIdempotencyKey('lead'),
      });

      toast.success(
        'Lead criado em Selecionados',
        response.warning ?? 'O card ja esta no inicio do funil.',
      );
      onCreated(response.lead.id);
      reset();
      onOpenChange(false);
    } catch (caught) {
      if (caught instanceof ApiError && caught.code === 'DUPLICATE_LEAD') {
        const details = caught.details as
          | { existingLeadId?: string; existingLeadName?: string; existingStageName?: string }
          | undefined;
        setDuplicate({
          leadId: details?.existingLeadId ?? '',
          name: details?.existingLeadName ?? 'lead existente',
          stage: details?.existingStageName ?? '',
        });
        setError(caught.message);
      } else {
        setError(
          caught instanceof ApiError
            ? caught.message
            : 'Nao foi possivel salvar o lead. Tente novamente.',
        );
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>Novo lead</DialogTitle>
          <DialogDescription>
            O lead entra em Selecionados. A verificacao de duplicidade acontece antes de salvar.
          </DialogDescription>
        </DialogHeader>

        <DialogBody className="space-y-4">
          <Field label="Nome interno" htmlFor="lead-name" required>
            <Input
              id="lead-name"
              value={form.internalName}
              onChange={(event) => set('internalName', event.target.value)}
              placeholder="Como voce quer identificar este lead"
              autoFocus
            />
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Origem" htmlFor="lead-source">
              <Select
                value={form.sourceId || EMPTY}
                onValueChange={(value) => set('sourceId', value === EMPTY ? '' : value)}
              >
                <SelectTrigger id="lead-source">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={EMPTY}>Nao definir</SelectItem>
                  {(sources.data?.sources ?? [])
                    .filter((source) => source.active)
                    .map((source) => (
                      <SelectItem key={source.id} value={source.id}>
                        {source.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </Field>

            <Field label="Nicho" htmlFor="lead-niche">
              <Input
                id="lead-niche"
                value={form.niche}
                onChange={(event) => set('niche', event.target.value)}
                placeholder="Ex.: psicologos"
              />
            </Field>

            <Field label="Telefone" htmlFor="lead-phone">
              <Input
                id="lead-phone"
                value={form.phone}
                onChange={(event) => set('phone', event.target.value)}
                inputMode="tel"
                placeholder="(11) 98888-7777"
              />
            </Field>

            <Field label="WhatsApp" htmlFor="lead-whatsapp">
              <Input
                id="lead-whatsapp"
                value={form.whatsapp}
                onChange={(event) => set('whatsapp', event.target.value)}
                inputMode="tel"
              />
            </Field>

            <Field label="E-mail" htmlFor="lead-email">
              <Input
                id="lead-email"
                type="email"
                value={form.email}
                onChange={(event) => set('email', event.target.value)}
              />
            </Field>

            <Field label="Instagram" htmlFor="lead-instagram">
              <Input
                id="lead-instagram"
                value={form.instagram}
                onChange={(event) => set('instagram', event.target.value)}
                placeholder="@perfil ou link"
              />
            </Field>

            <Field label="Site" htmlFor="lead-website">
              <Input
                id="lead-website"
                value={form.website}
                onChange={(event) => set('website', event.target.value)}
              />
            </Field>

            <Field label="Link da demonstracao" htmlFor="lead-demo">
              <Input
                id="lead-demo"
                value={form.demoUrl}
                onChange={(event) => set('demoUrl', event.target.value)}
              />
            </Field>

            <Field label="Google Maps" htmlFor="lead-maps">
              <Input
                id="lead-maps"
                value={form.mapsUrl}
                onChange={(event) => set('mapsUrl', event.target.value)}
              />
            </Field>

            <Field label="Cidade" htmlFor="lead-city">
              <Input
                id="lead-city"
                value={form.city}
                onChange={(event) => set('city', event.target.value)}
              />
            </Field>

            <Field label="Estado" htmlFor="lead-state">
              <Input
                id="lead-state"
                value={form.state}
                onChange={(event) => set('state', event.target.value)}
              />
            </Field>

            <Field label="Pais" htmlFor="lead-country">
              <Input
                id="lead-country"
                value={form.country}
                onChange={(event) => set('country', event.target.value)}
              />
            </Field>
          </div>

          <Field label="Endereco" htmlFor="lead-address">
            <Input
              id="lead-address"
              value={form.address}
              onChange={(event) => set('address', event.target.value)}
            />
          </Field>

          <div className="grid gap-3 sm:grid-cols-2">
            <Field label="Servico" htmlFor="lead-service">
              <Select
                value={form.serviceId || EMPTY}
                onValueChange={(value) => {
                  const next = value === EMPTY ? '' : value;
                  set('serviceId', next);
                  const service = services.data?.services.find((item) => item.id === next);
                  if (service) set('proposedPrice', service.defaultPrice);
                }}
              >
                <SelectTrigger id="lead-service">
                  <SelectValue placeholder="Selecione" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={EMPTY}>Nao associar</SelectItem>
                  {(services.data?.services ?? [])
                    .filter((service) => service.active)
                    .map((service) => (
                      <SelectItem key={service.id} value={service.id}>
                        {service.name}
                      </SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </Field>

            <Field
              label="Valor proposto"
              htmlFor="lead-price"
              hint="O preco padrao do servico e apenas sugestao."
            >
              <Input
                id="lead-price"
                inputMode="decimal"
                value={form.proposedPrice}
                onChange={(event) => set('proposedPrice', event.target.value)}
              />
            </Field>
          </div>

          <Field label="Proximo follow-up" htmlFor="lead-followup">
            <Input
              id="lead-followup"
              type="date"
              value={form.nextFollowUpAt}
              onChange={(event) => set('nextFollowUpAt', event.target.value)}
            />
          </Field>

          <Field label="Observacoes" htmlFor="lead-notes">
            <Textarea
              id="lead-notes"
              value={form.notes}
              onChange={(event) => set('notes', event.target.value)}
            />
          </Field>

          {duplicate ? (
            <Callout tone="warning" title="Este lead ja esta no CRM">
              <p>
                {duplicate.name}
                {duplicate.stage ? ` esta na etapa ${duplicate.stage}.` : '.'} Nenhum card novo foi
                criado e nenhum dado existente foi alterado.
              </p>
              {duplicate.leadId ? (
                <Button
                  size="sm"
                  variant="secondary"
                  className="mt-2"
                  onClick={() => {
                    onCreated(duplicate.leadId);
                    reset();
                    onOpenChange(false);
                  }}
                >
                  Abrir card existente
                </Button>
              ) : null}
            </Callout>
          ) : error ? (
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
            Criar lead
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
