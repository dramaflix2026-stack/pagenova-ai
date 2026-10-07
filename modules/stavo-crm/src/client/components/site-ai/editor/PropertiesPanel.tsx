/**
 * Painel de propriedades (secao 15.5 da especificacao).
 *
 * Formulario GENERICO: em vez de um componente por tipo de secao (16 tipos,
 * a maioria com formas parecidas), este painel INSPECIONA os campos da
 * secao selecionada e escolhe o controle certo por convencao de nome e tipo.
 * Um campo marcado como fato confirmado (`fieldPolicy`) sai somente leitura,
 * nunca digitavel -- e a mesma regra que o assembler aplica no servidor,
 * repetida aqui para a interface nunca prometer algo que o backend recusa.
 *
 * Nao expoe CSS, JavaScript, HTML nem classes livres (secao 15.5): cada
 * controle e datilografado para o campo que edita.
 */
import { ImagePlus, Plus, Trash2, X } from 'lucide-react';
import { useRef } from 'react';

import type { ActionLink, AssetRef, SiteSection } from '@site-kit/schemas/site-schema';
import { fieldPolicy, READONLY_EXPLANATION } from '../../../lib/site-editor-fields';
import { useSiteAssets, useUploadSiteAsset, type SiteAssetSummary } from '../../../hooks/useSiteAi';
import { useToast } from '../../ui/Toast';
import {
  Badge,
  Field,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Switch,
  Textarea,
} from '../../ui';

interface PropertiesPanelProps {
  projectId: string;
  section: SiteSection;
  anchors: string[];
  onChange: (next: SiteSection) => void;
}

/** Textos de uma linha: titulo, rotulo de botao, legenda curta. */
const LINE_FIELDS = new Set([
  'headline',
  'subheadline',
  'eyebrow',
  'tagline',
  'submitLabel',
  'address',
  'personRole',
  'personName',
  'legalNote',
  'businessName',
]);

/** Textos longos: paragrafo, resposta de FAQ. */
const TEXT_FIELDS = new Set(['body']);

/** Listas de texto simples: destaques, marcadores. */
const STRING_LIST_FIELDS = new Set(['highlights', 'bullets']);

export function PropertiesPanel({ projectId, section, anchors, onChange }: PropertiesPanelProps) {
  const record = section as unknown as Record<string, unknown>;

  const patch = (field: string, value: unknown) => {
    onChange({ ...section, [field]: value } as SiteSection);
  };

  const editableKeys = Object.keys(record).filter(
    (key) => !['id', 'type', 'anchor', 'style'].includes(key),
  );

  return (
    <div className="h-full overflow-y-auto p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold capitalize">{section.type}</p>
          <p className="text-xs text-muted-foreground">id: {section.id}</p>
        </div>
        <Field label="Visivel" className="flex-row items-center gap-2">
          <Switch checked={section.visible} onCheckedChange={(checked) => patch('visible', checked)} />
        </Field>
      </div>

      <div className="space-y-4">

        {editableKeys.map((key) => {
          if (key === 'visible' || key === 'variant' || key === 'motionPreset') return null;

          const policy = fieldPolicy(section.type, key);
          const value = record[key];

          if (policy === 'readonly-fact') {
            return <ReadOnlyField key={key} label={key} value={value} />;
          }

          if (LINE_FIELDS.has(key) && typeof value === 'string') {
            return (
              <Field key={key} label={labelFor(key)}>
                <Input value={value} onChange={(e) => patch(key, e.target.value)} />
              </Field>
            );
          }

          if (TEXT_FIELDS.has(key)) {
            if (typeof value === 'string') {
              return (
                <Field key={key} label={labelFor(key)}>
                  <Textarea rows={4} value={value} onChange={(e) => patch(key, e.target.value)} />
                </Field>
              );
            }
            if (Array.isArray(value)) {
              return <ParagraphListField key={key} label={labelFor(key)} values={value as string[]} onChange={(v) => patch(key, v)} />;
            }
          }

          if (STRING_LIST_FIELDS.has(key) && Array.isArray(value)) {
            return <StringListField key={key} label={labelFor(key)} values={value as string[]} onChange={(v) => patch(key, v)} />;
          }

          if ((key === 'items' || key === 'steps') && Array.isArray(value)) {
            return <ItemListField key={key} label={labelFor(key)} items={value as Record<string, unknown>[]} onChange={(v) => patch(key, v)} />;
          }

          if (key === 'image') {
            return (
              <ImageField
                key={key}
                projectId={projectId}
                value={value as AssetRef | undefined}
                onChange={(next) => patch('image', next)}
              />
            );
          }

          if (key === 'fields' && Array.isArray(value)) {
            // Campos do formulario de WhatsApp: estrutura propria demais para
            // o editor generico. Mantido somente leitura nesta etapa.
            return <ReadOnlyField key={key} label="Campos do formulario" value={`${value.length} campo(s)`} />;
          }

          if (isActionLink(value)) {
            return (
              <ActionLinkField
                key={key}
                label={labelFor(key)}
                link={value}
                anchors={anchors}
                onChange={(next) => patch(key, next)}
              />
            );
          }

          if (typeof value === 'boolean') {
            return (
              <Field key={key} label={labelFor(key)} className="flex-row items-center gap-2">
                <Switch checked={value} onCheckedChange={(checked) => patch(key, checked)} />
              </Field>
            );
          }

          return null;
        })}
      </div>
    </div>
  );
}

const labelFor = (key: string): string =>
  ({
    headline: 'Titulo',
    subheadline: 'Subtitulo',
    eyebrow: 'Sobrescrito',
    body: 'Texto',
    tagline: 'Frase de apoio',
    submitLabel: 'Rotulo do botao de envio',
    highlights: 'Destaques',
    bullets: 'Marcadores',
    items: 'Itens',
    steps: 'Passos',
    primaryCta: 'Botao principal',
    secondaryCta: 'Botao secundario',
    cta: 'Botao',
  })[key] ?? key;

function ReadOnlyField({ label, value }: { label: string; value: unknown }) {
  const display = Array.isArray(value) ? `${value.length} item(ns)` : String(value ?? '—');
  return (
    <Field label={labelFor(label)} hint={READONLY_EXPLANATION}>
      <div className="flex items-center justify-between rounded-md border border-dashed border-border bg-muted px-3 py-2 text-sm text-muted-foreground">
        <span className="truncate">{display}</span>
        <Badge tone="neutral">fato confirmado</Badge>
      </div>
    </Field>
  );
}

function ParagraphListField({
  label,
  values,
  onChange,
}: {
  label: string;
  values: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <Field label={label}>
      <div className="space-y-2">
        {values.map((paragraph, index) => (
          <div key={index} className="flex gap-2">
            <Textarea
              rows={3}
              value={paragraph}
              onChange={(e) => onChange(values.map((p, i) => (i === index ? e.target.value : p)))}
            />
            <button
              type="button"
              className="text-muted-foreground hover:text-destructive"
              onClick={() => onChange(values.filter((_, i) => i !== index))}
              aria-label="Remover paragrafo"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        ))}
        <button
          type="button"
          className="flex items-center gap-1 text-xs text-primary hover:underline"
          onClick={() => onChange([...values, ''])}
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          Adicionar paragrafo
        </button>
      </div>
    </Field>
  );
}

function StringListField({
  label,
  values,
  onChange,
}: {
  label: string;
  values: string[];
  onChange: (next: string[]) => void;
}) {
  return (
    <Field label={label}>
      <div className="space-y-2">
        {values.map((item, index) => (
          <div key={index} className="flex gap-2">
            <Input value={item} onChange={(e) => onChange(values.map((v, i) => (i === index ? e.target.value : v)))} />
            <button
              type="button"
              className="text-muted-foreground hover:text-destructive"
              onClick={() => onChange(values.filter((_, i) => i !== index))}
              aria-label="Remover item"
            >
              <Trash2 className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        ))}
        <button
          type="button"
          className="flex items-center gap-1 text-xs text-primary hover:underline"
          onClick={() => onChange([...values, ''])}
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          Adicionar
        </button>
      </div>
    </Field>
  );
}

/** Descobre se os itens sao {title,body}, {question,answer} ou {value,label}. */
function itemShape(items: Record<string, unknown>[]): [string, string] {
  const sample = items[0] ?? {};
  if ('question' in sample) return ['question', 'answer'];
  if ('value' in sample) return ['value', 'label'];
  return ['title', 'body'];
}

function ItemListField({
  label,
  items,
  onChange,
}: {
  label: string;
  items: Record<string, unknown>[];
  onChange: (next: Record<string, unknown>[]) => void;
}) {
  const [primaryKey, secondaryKey] = itemShape(items);

  const updateItem = (index: number, key: string, value: string) => {
    onChange(items.map((item, i) => (i === index ? { ...item, [key]: value } : item)));
  };

  return (
    <Field label={label}>
      <div className="space-y-3">
        {items.map((item, index) => (
          <div key={index} className="space-y-1.5 rounded-md border border-border p-2">
            <div className="flex items-start gap-2">
              <div className="flex-1 space-y-1.5">
                <Input
                  value={String(item[primaryKey] ?? '')}
                  onChange={(e) => updateItem(index, primaryKey, e.target.value)}
                  placeholder={primaryKey}
                />
                <Textarea
                  rows={2}
                  value={String(item[secondaryKey] ?? '')}
                  onChange={(e) => updateItem(index, secondaryKey, e.target.value)}
                  placeholder={secondaryKey}
                />
              </div>
              <button
                type="button"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => onChange(items.filter((_, i) => i !== index))}
                aria-label="Remover"
              >
                <Trash2 className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>
          </div>
        ))}
        <button
          type="button"
          className="flex items-center gap-1 text-xs text-primary hover:underline"
          onClick={() => onChange([...items, { [primaryKey]: '', [secondaryKey]: '' }])}
        >
          <Plus className="h-3.5 w-3.5" aria-hidden="true" />
          Adicionar
        </button>
      </div>
    </Field>
  );
}

/**
 * Campo de imagem (secao 13.3 da especificacao).
 *
 * Nao e um editor fotografico: so o essencial para uma prospeccao --
 * escolher o arquivo, ajustar o ponto focal (o que fica visivel quando a
 * secao encolhe no celular) e o texto alternativo. Recorte de verdade fica
 * fora do escopo desta etapa.
 */
function ImageField({
  projectId,
  value,
  onChange,
}: {
  projectId: string;
  value: AssetRef | undefined;
  onChange: (next: AssetRef | undefined) => void;
}) {
  const toast = useToast();
  const assets = useSiteAssets(projectId);
  const upload = useUploadSiteAsset(projectId);
  const fileInput = useRef<HTMLInputElement>(null);

  const selectedAsset = assets.data?.find((asset) => asset.id === value?.assetId);

  const handleFile = async (file: File) => {
    try {
      const { asset } = await upload.mutateAsync(file);
      onChange({ assetId: asset.id, alt: asset.altText ?? '', focalX: 0.5, focalY: 0.5 });
    } catch {
      toast.error('Nao foi possivel enviar a imagem. Verifique o formato (PNG, JPEG ou WebP).');
    }
  };

  return (
    <Field label="Imagem" hint="PNG, JPEG ou WebP. A imagem original nunca fica salva -- so uma versao otimizada.">
      <div className="space-y-2">
        {value && selectedAsset ? (
          <div className="space-y-2 rounded-md border border-border p-2">
            <div className="relative">
              <img
                src={selectedAsset.url}
                alt={value.alt}
                className="h-28 w-full rounded object-cover"
                style={{ objectPosition: `${value.focalX * 100}% ${value.focalY * 100}%` }}
              />
              <button
                type="button"
                onClick={() => onChange(undefined)}
                className="absolute right-1 top-1 rounded-full bg-surface/90 p-1 text-muted-foreground hover:text-destructive"
                aria-label="Remover imagem"
              >
                <X className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
            <Input
              value={value.alt}
              onChange={(e) => onChange({ ...value, alt: e.target.value })}
              placeholder="Texto alternativo (obrigatorio para acessibilidade)"
            />
            <div className="grid grid-cols-2 gap-2">
              <label className="text-xs text-muted-foreground">
                Foco horizontal
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={value.focalX}
                  onChange={(e) => onChange({ ...value, focalX: Number(e.target.value) })}
                  className="block w-full"
                />
              </label>
              <label className="text-xs text-muted-foreground">
                Foco vertical
                <input
                  type="range"
                  min={0}
                  max={1}
                  step={0.05}
                  value={value.focalY}
                  onChange={(e) => onChange({ ...value, focalY: Number(e.target.value) })}
                  className="block w-full"
                />
              </label>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInput.current?.click()}
            disabled={upload.isPending}
            className="flex w-full flex-col items-center gap-1 rounded-md border border-dashed border-border py-4 text-xs text-muted-foreground hover:bg-muted disabled:opacity-50"
          >
            <ImagePlus className="h-5 w-5" aria-hidden="true" />
            {upload.isPending ? 'Enviando...' : 'Enviar imagem'}
          </button>
        )}

        {!value && (assets.data?.length ?? 0) > 0 ? (
          <ExistingAssetsPicker assets={assets.data!} onPick={(asset) => onChange({ assetId: asset.id, alt: asset.altText ?? '', focalX: 0.5, focalY: 0.5 })} />
        ) : null}

        <input
          ref={fileInput}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) void handleFile(file);
            e.target.value = '';
          }}
        />
      </div>
    </Field>
  );
}

function ExistingAssetsPicker({ assets, onPick }: { assets: SiteAssetSummary[]; onPick: (asset: SiteAssetSummary) => void }) {
  return (
    <details className="text-xs">
      <summary className="cursor-pointer text-primary">Usar uma imagem ja enviada ({assets.length})</summary>
      <div className="mt-2 grid grid-cols-3 gap-1.5">
        {assets.map((asset) => (
          <button key={asset.id} type="button" onClick={() => onPick(asset)} className="overflow-hidden rounded border border-border">
            <img src={asset.url} alt={asset.altText ?? ''} className="h-14 w-full object-cover" />
          </button>
        ))}
      </div>
    </details>
  );
}

const isActionLink = (value: unknown): value is ActionLink =>
  Boolean(value) && typeof value === 'object' && 'kind' in (value as object) && 'label' in (value as object);

function ActionLinkField({
  label,
  link,
  anchors,
  onChange,
}: {
  label: string;
  link: ActionLink;
  anchors: string[];
  onChange: (next: ActionLink) => void;
}) {
  return (
    <Field label={label} hint={`Tipo: ${link.kind}. O destino e resolvido automaticamente pelo sistema.`}>
      <div className="space-y-2">
        <Input value={link.label} onChange={(e) => onChange({ ...link, label: e.target.value })} placeholder="Texto do botao" />
        {link.kind === 'anchor' ? (
          <Select value={link.target} onValueChange={(target) => onChange({ ...link, target })}>
            <SelectTrigger>
              <SelectValue placeholder="Secao de destino" />
            </SelectTrigger>
            <SelectContent>
              {anchors.map((anchor) => (
                <SelectItem key={anchor} value={anchor}>
                  {anchor}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : null}
      </div>
    </Field>
  );
}
