/**
 * Assistente de criacao de site (secao 7 da especificacao).
 *
 * Tres passos curtos, editaveis antes de gerar: negocio e objetivo, tipo e
 * direcao visual, instrucoes livres. Ao confirmar, cria o projeto JA com o
 * briefing completo e dispara a geracao em uma unica sequencia -- o
 * administrador nao precisa entender que sao duas chamadas por baixo.
 */
import { useMemo, useState } from 'react';

import type { SiteBriefingInput } from '@shared/schemas';
import {
  DEFAULT_MOTION_LEVEL,
  MOTION_LEVEL_LABELS,
  MOTION_LEVELS,
  SITE_TYPE_LABELS,
  SITE_TYPES,
  type MotionLevel,
  type SiteType,
} from '@site-kit/types/site-ai';
import { ApiError } from '../../lib/api';
import { useCreateSiteProject, useGenerateSite } from '../../hooks/useSiteAi';
import { Badge, Button, Callout, Field, Input, Textarea } from '../ui';
import { Dialog, DialogBody, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/Dialog';
import { useToast } from '../ui/Toast';

interface SiteWizardDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Quando vem de um card do CRM, os campos ja chegam pre-preenchidos. */
  leadId?: string | null;
  initialBusinessName?: string;
  initialNiche?: string | null;
  initialCity?: string | null;
  initialPhone?: string | null;
  initialAddress?: string | null;
  initialInstagram?: string | null;
  initialWebsite?: string | null;
  onCreated: (projectId: string) => void;
}

const GOALS = [
  { value: 'WHATSAPP_CONVERSATIONS', label: 'Gerar conversas no WhatsApp' },
  { value: 'QUOTE_REQUESTS', label: 'Receber pedidos de orcamento' },
  { value: 'APPOINTMENTS', label: 'Agendar consulta/avaliacao' },
  { value: 'AUTHORITY', label: 'Apresentar autoridade e servicos' },
  { value: 'OFFER_INTEREST', label: 'Captar interesse em uma oferta' },
  { value: 'CUSTOM', label: 'Outro objetivo' },
] as const;

const STYLE_KEYWORDS = [
  'moderno',
  'elegante',
  'premium',
  'acolhedor',
  'minimalista',
  'editorial',
  'energetico',
  'clinico',
  'organico',
  'tecnologico',
];

const THEMES = [
  { value: 'LIGHT', label: 'Claro' },
  { value: 'DARK', label: 'Escuro' },
  { value: 'MIXED', label: 'Misto' },
  { value: 'AI_DECIDES', label: 'IA decide' },
] as const;

const DENSITIES = [
  { value: 'AIRY', label: 'Arejado' },
  { value: 'BALANCED', label: 'Equilibrado' },
  { value: 'COMPACT', label: 'Compacto' },
] as const;

type Step = 1 | 2 | 3;

interface FormState {
  businessName: string;
  niche: string;
  city: string;
  audience: string;
  goal: SiteBriefingInput['objective']['goal'];
  customGoal: string;
  phoneE164: string;
  address: string;
  instagramUrl: string;
  websiteUrl: string;
  siteType: SiteType;
  theme: SiteBriefingInput['style']['theme'];
  keywords: string[];
  primaryColor: string;
  accentColor: string;
  density: SiteBriefingInput['style']['density'];
  motionLevel: MotionLevel;
  freeformInstructions: string;
}

function initialState(props: SiteWizardDialogProps): FormState {
  return {
    businessName: props.initialBusinessName ?? '',
    niche: props.initialNiche ?? '',
    city: props.initialCity ?? '',
    audience: '',
    goal: 'WHATSAPP_CONVERSATIONS',
    customGoal: '',
    phoneE164: props.initialPhone ?? '',
    address: props.initialAddress ?? '',
    instagramUrl: props.initialInstagram ?? '',
    websiteUrl: props.initialWebsite ?? '',
    siteType: 'ONE_PAGE',
    theme: 'AI_DECIDES',
    keywords: [],
    primaryColor: '',
    accentColor: '',
    density: 'BALANCED',
    motionLevel: DEFAULT_MOTION_LEVEL,
    freeformInstructions: '',
  };
}

export function SiteWizardDialog(props: SiteWizardDialogProps) {
  const { open, onOpenChange, onCreated } = props;
  const toast = useToast();
  const createProject = useCreateSiteProject();

  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState<FormState>(() => initialState(props));
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Precisa de um projectId antes de poder gerar; guarda a mutacao aqui para
  // reutilizar o mesmo hook depois que o projeto existir.
  const [pendingProjectId, setPendingProjectId] = useState<string | null>(null);
  const generate = useGenerateSite(pendingProjectId ?? '');

  const patch = (values: Partial<FormState>) => setForm((prev) => ({ ...prev, ...values }));

  const canAdvanceFromStep1 = form.businessName.trim().length >= 2;
  const canSubmit = canAdvanceFromStep1;

  const toggleKeyword = (word: string) => {
    patch({
      keywords: form.keywords.includes(word)
        ? form.keywords.filter((k) => k !== word)
        : form.keywords.length >= 4
          ? form.keywords
          : [...form.keywords, word],
    });
  };

  const briefing: SiteBriefingInput = useMemo(
    () => ({
      business: {
        name: form.businessName.trim(),
        niche: form.niche.trim() || undefined,
        city: form.city.trim() || undefined,
        audience: form.audience.trim() || undefined,
        phoneE164: form.phoneE164.trim() || undefined,
        address: form.address.trim() || undefined,
        instagramUrl: form.instagramUrl.trim() || undefined,
        websiteUrl: form.websiteUrl.trim() || undefined,
        services: [],
        differentials: [],
      },
      objective: { goal: form.goal, customGoal: form.customGoal.trim() || undefined },
      style: {
        theme: form.theme,
        keywords: form.keywords,
        primaryColor: form.primaryColor.trim() || undefined,
        accentColor: form.accentColor.trim() || undefined,
        density: form.density,
        motionLevel: form.motionLevel,
      },
      freeformInstructions: form.freeformInstructions.trim() || undefined,
      requiredSections: [],
      forbiddenSections: [],
    }),
    [form],
  );

  async function handleClose(next: boolean) {
    if (!next) {
      setStep(1);
      setForm(initialState(props));
      setError(null);
      setPendingProjectId(null);
    }
    onOpenChange(next);
  }

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);
    try {
      const { project } = await createProject.mutateAsync({
        leadId: props.leadId ?? null,
        businessName: form.businessName.trim(),
        siteType: form.siteType,
        briefing,
      });
      setPendingProjectId(project.id);

      await generate.mutateAsync();

      toast.success('Site em geracao. Acompanhe o andamento na tela do projeto.');
      onCreated(project.id);
      await handleClose(false);
    } catch (err) {
      if (err instanceof ApiError) {
        if (err.code === 'SITE_PROJECT_ALREADY_EXISTS') {
          setError(err.message);
        } else if (err.code === 'SITE_AI_NOT_CONFIGURED') {
          setError(
            'A geracao por IA ainda nao esta configurada neste servidor. O projeto foi criado; ' +
              'configure a OPENAI_API_KEY para continuar.',
          );
        } else {
          setError(err.message);
        }
      } else {
        setError('Nao foi possivel criar o site. Tente novamente.');
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => void handleClose(next)}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>Criar site com IA</DialogTitle>
        </DialogHeader>

        <div className="flex items-center gap-2 px-6 pt-2 text-xs text-muted-foreground">
          {[1, 2, 3].map((n) => (
            <span key={n} className="flex items-center gap-2">
              <span
                className={
                  'flex h-6 w-6 items-center justify-center rounded-full border text-xs font-semibold ' +
                  (n === step
                    ? 'border-primary bg-primary text-primary-foreground'
                    : n < step
                      ? 'border-primary/40 bg-primary-soft text-primary'
                      : 'border-border text-muted-foreground')
                }
              >
                {n}
              </span>
              {n < 3 ? <span className="h-px w-6 bg-border" /> : null}
            </span>
          ))}
          <span className="ml-2">
            {step === 1 ? 'Negocio e objetivo' : step === 2 ? 'Tipo e direcao visual' : 'Instrucoes'}
          </span>
        </div>

        <DialogBody className="space-y-4">
          {error ? (
            <Callout tone="danger" title="Nao foi possivel continuar">
              {error}
            </Callout>
          ) : null}

          {step === 1 ? (
            <div className="space-y-4">
              <Field label="Nome do negocio" required>
                <Input
                  value={form.businessName}
                  onChange={(e) => patch({ businessName: e.target.value })}
                  placeholder="Ex.: Clinica Aurora"
                  autoFocus
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Nicho/categoria">
                  <Input value={form.niche} onChange={(e) => patch({ niche: e.target.value })} placeholder="Ex.: Odontologia" />
                </Field>
                <Field label="Cidade">
                  <Input value={form.city} onChange={(e) => patch({ city: e.target.value })} placeholder="Ex.: Campinas" />
                </Field>
              </div>
              <Field label="Publico-alvo" hint="Opcional, mas ajuda muito a direcao criativa.">
                <Textarea
                  value={form.audience}
                  onChange={(e) => patch({ audience: e.target.value })}
                  rows={2}
                  placeholder="Quem procura este negocio?"
                />
              </Field>
              <Field label="Objetivo principal" required>
                <div className="grid grid-cols-2 gap-2">
                  {GOALS.map((goal) => (
                    <button
                      key={goal.value}
                      type="button"
                      onClick={() => patch({ goal: goal.value })}
                      className={
                        'rounded-md border px-3 py-2 text-left text-sm transition ' +
                        (form.goal === goal.value
                          ? 'border-primary bg-primary-soft text-primary'
                          : 'border-border hover:bg-muted')
                      }
                    >
                      {goal.label}
                    </button>
                  ))}
                </div>
              </Field>
              {form.goal === 'CUSTOM' ? (
                <Field label="Descreva o objetivo">
                  <Input value={form.customGoal} onChange={(e) => patch({ customGoal: e.target.value })} />
                </Field>
              ) : null}
              <div className="grid grid-cols-2 gap-3">
                <Field label="WhatsApp/telefone" hint="Sera revisado antes de publicar.">
                  <Input value={form.phoneE164} onChange={(e) => patch({ phoneE164: e.target.value })} placeholder="+55 19 99999-9999" />
                </Field>
                <Field label="Endereco">
                  <Input value={form.address} onChange={(e) => patch({ address: e.target.value })} />
                </Field>
                <Field label="Instagram">
                  <Input value={form.instagramUrl} onChange={(e) => patch({ instagramUrl: e.target.value })} placeholder="https://instagram.com/..." />
                </Field>
                <Field label="Site atual (se houver)">
                  <Input value={form.websiteUrl} onChange={(e) => patch({ websiteUrl: e.target.value })} placeholder="https://..." />
                </Field>
              </div>
            </div>
          ) : null}

          {step === 2 ? (
            <div className="space-y-4">
              <Field label="Tipo de site" required>
                <div className="grid grid-cols-2 gap-2">
                  {SITE_TYPES.map((type) => (
                    <button
                      key={type}
                      type="button"
                      onClick={() => patch({ siteType: type })}
                      className={
                        'rounded-md border px-3 py-2 text-sm transition ' +
                        (form.siteType === type ? 'border-primary bg-primary-soft text-primary' : 'border-border hover:bg-muted')
                      }
                    >
                      {SITE_TYPE_LABELS[type]}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Tema">
                <div className="grid grid-cols-4 gap-2">
                  {THEMES.map((theme) => (
                    <button
                      key={theme.value}
                      type="button"
                      onClick={() => patch({ theme: theme.value })}
                      className={
                        'rounded-md border px-2 py-2 text-xs transition ' +
                        (form.theme === theme.value ? 'border-primary bg-primary-soft text-primary' : 'border-border hover:bg-muted')
                      }
                    >
                      {theme.label}
                    </button>
                  ))}
                </div>
              </Field>
              <Field label="Estilo" hint="Escolha ate 4, ou deixe em branco para a IA decidir.">
                <div className="flex flex-wrap gap-2">
                  {STYLE_KEYWORDS.map((word) => (
                    <button
                      key={word}
                      type="button"
                      onClick={() => toggleKeyword(word)}
                      className={
                        'rounded-full border px-3 py-1 text-xs transition ' +
                        (form.keywords.includes(word)
                          ? 'border-primary bg-primary-soft text-primary'
                          : 'border-border hover:bg-muted')
                      }
                    >
                      {word}
                    </button>
                  ))}
                </div>
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Cor principal (opcional)" hint="Formato #RRGGBB">
                  <Input value={form.primaryColor} onChange={(e) => patch({ primaryColor: e.target.value })} placeholder="#9c4221" />
                </Field>
                <Field label="Cor de destaque (opcional)">
                  <Input value={form.accentColor} onChange={(e) => patch({ accentColor: e.target.value })} placeholder="#3f4f3a" />
                </Field>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Densidade">
                  <div className="flex gap-2">
                    {DENSITIES.map((d) => (
                      <button
                        key={d.value}
                        type="button"
                        onClick={() => patch({ density: d.value })}
                        className={
                          'flex-1 rounded-md border px-2 py-2 text-xs transition ' +
                          (form.density === d.value ? 'border-primary bg-primary-soft text-primary' : 'border-border hover:bg-muted')
                        }
                      >
                        {d.label}
                      </button>
                    ))}
                  </div>
                </Field>
                <Field label="Movimento" hint="O padrao recomendado e premium equilibrado.">
                  <div className="flex gap-2">
                    {MOTION_LEVELS.map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => patch({ motionLevel: level })}
                        className={
                          'flex-1 rounded-md border px-2 py-2 text-xs transition ' +
                          (form.motionLevel === level ? 'border-primary bg-primary-soft text-primary' : 'border-border hover:bg-muted')
                        }
                      >
                        {MOTION_LEVEL_LABELS[level]}
                      </button>
                    ))}
                  </div>
                </Field>
              </div>
            </div>
          ) : null}

          {step === 3 ? (
            <div className="space-y-4">
              <Field
                label="Instrucoes adicionais para a IA"
                hint="Publico, objecoes, tom, secoes especificas, oferta, restricoes. Use apenas fatos que voce confirma."
              >
                <Textarea
                  value={form.freeformInstructions}
                  onChange={(e) => patch({ freeformInstructions: e.target.value })}
                  rows={5}
                  placeholder="Ex.: tom acolhedor, publico de primeira viagem, nao mencionar preco."
                />
              </Field>
              <Callout tone="neutral" title="Antes de gerar">
                <ul className="list-disc space-y-1 pl-4 text-sm">
                  <li>Uma chamada principal a IA sera feita para montar o site.</li>
                  <li>Nenhuma imagem sera gerada nesta versao (upload chega em breve).</li>
                  <li>Custo estimado depende do modelo configurado; sem chave, o modo de teste e usado.</li>
                </ul>
              </Callout>
              <div className="flex flex-wrap gap-2">
                <Badge tone="outline">{form.businessName || 'Sem nome'}</Badge>
                <Badge tone="outline">{SITE_TYPE_LABELS[form.siteType]}</Badge>
                <Badge tone="outline">{MOTION_LEVEL_LABELS[form.motionLevel]}</Badge>
              </div>
            </div>
          ) : null}
        </DialogBody>

        <DialogFooter>
          {step > 1 ? (
            <Button variant="secondary" onClick={() => setStep((step - 1) as Step)} disabled={submitting}>
              Voltar
            </Button>
          ) : (
            <Button variant="secondary" onClick={() => void handleClose(false)} disabled={submitting}>
              Cancelar
            </Button>
          )}

          {step < 3 ? (
            <Button onClick={() => setStep((step + 1) as Step)} disabled={step === 1 && !canAdvanceFromStep1}>
              Continuar
            </Button>
          ) : (
            <Button onClick={() => void handleSubmit()} disabled={!canSubmit || submitting}>
              {submitting ? 'Criando...' : 'Criar site'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
