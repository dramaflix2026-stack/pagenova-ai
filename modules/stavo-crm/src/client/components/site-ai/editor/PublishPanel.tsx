/**
 * Publicacao (secao 16 da especificacao).
 *
 * Publicar so acontece com acao explicita. Quando o linter tem apenas
 * avisos, a segunda tentativa carrega a confirmacao consciente exigida pelo
 * servidor (`acknowledgedWarnings`) -- nunca publica um aviso em silencio.
 */
import { Check, Copy, ExternalLink, Loader2, MessageCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

import { buildWhatsAppUrl } from '@site-kit/utils/sanitize';

import { ApiError } from '../../../lib/api';
import {
  useConfirmOutreachSent,
  useEditOutreach,
  useExportSiteZip,
  useGenerateOutreach,
  useMarkOutreachOpened,
  useOutreachMessages,
  usePublishSite,
  useRollbackPublication,
  useSitePublications,
  useUnpublishSite,
} from '../../../hooks/useSiteAi';
import { Badge, Button, Callout, Textarea } from '../../ui';
import { useToast } from '../../ui/Toast';

interface PublishPanelProps {
  projectId: string;
  currentSlug: string | null;
  onClose: () => void;
}

interface LintFindingLike {
  code: string;
  message: string;
}

export function PublishPanel({ projectId, currentSlug, onClose }: PublishPanelProps) {
  const toast = useToast();
  const publications = useSitePublications(projectId);
  const publish = usePublishSite(projectId);
  const unpublish = useUnpublishSite(projectId);
  const rollback = useRollbackPublication(projectId);
  const exportZip = useExportSiteZip(projectId);

  const outreach = useOutreachMessages(projectId);
  const generateOutreach = useGenerateOutreach(projectId);
  const editOutreach = useEditOutreach(projectId);
  const markOpened = useMarkOutreachOpened(projectId);
  const confirmSent = useConfirmOutreachSent(projectId);

  const [warnings, setWarnings] = useState<LintFindingLike[] | null>(null);
  const [publishedUrl, setPublishedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [draftText, setDraftText] = useState('');

  const active = publications.data?.find((p) => p.status === 'ACTIVE');
  const latestOutreach = outreach.data?.[0] ?? null;

  useEffect(() => {
    setDraftText(latestOutreach?.messageText ?? '');
  }, [latestOutreach?.id, latestOutreach?.messageText]);

  const doPublish = (acknowledgedWarnings: boolean) => {
    publish.mutate(
      { acknowledgedWarnings, desiredSlug: currentSlug ?? undefined },
      {
        onSuccess: (result) => {
          setPublishedUrl(result.url);
          setWarnings(null);
          toast.success('Site publicado.');
        },
        onError: (error: unknown) => {
          if (error instanceof ApiError && error.code === 'SITE_LINT_WARNINGS') {
            setWarnings((error.details?.warnings as LintFindingLike[]) ?? []);
            return;
          }
          if (error instanceof ApiError && error.code === 'SITE_LINT_BLOCKED') {
            const errors = (error.details?.errors as LintFindingLike[]) ?? [];
            toast.error(`Bloqueado por ${errors.length} erro(s). Corrija no editor antes de publicar.`);
            return;
          }
          toast.error(error instanceof ApiError ? error.message : 'Nao foi possivel publicar.');
        },
      },
    );
  };

  const copyLink = async () => {
    if (!publishedUrl && !active) return;
    const url = publishedUrl ?? `${window.location.origin}`; // fallback improvavel
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Nao foi possivel copiar. Copie manualmente.');
    }
  };

  return (
    <div className="w-96 border-l border-border bg-surface p-4">
      <div className="mb-3 flex items-center justify-between">
        <p className="text-sm font-semibold">Publicacao</p>
        <Button size="sm" variant="secondary" onClick={onClose}>
          Fechar
        </Button>
      </div>

      {active || publishedUrl ? (
        <div className="mb-4 space-y-2 rounded-md border border-border p-3">
          <Badge tone="success">No ar</Badge>
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate text-xs">{publishedUrl ?? `.../p/${active?.slug}`}</code>
            <Button size="sm" variant="ghost" onClick={() => void copyLink()} aria-label="Copiar link">
              {copied ? <Check className="h-4 w-4" aria-hidden="true" /> : <Copy className="h-4 w-4" aria-hidden="true" />}
            </Button>
            {publishedUrl ? (
              <a href={publishedUrl} target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="ghost" aria-label="Abrir site">
                  <ExternalLink className="h-4 w-4" aria-hidden="true" />
                </Button>
              </a>
            ) : null}
          </div>
          <Button
            size="sm"
            variant="secondary"
            className="w-full"
            onClick={() => unpublish.mutate(undefined, { onSuccess: () => { setPublishedUrl(null); toast.success('Site despublicado.'); } })}
            disabled={unpublish.isPending}
          >
            Despublicar
          </Button>
        </div>
      ) : null}

      {warnings && warnings.length > 0 ? (
        <Callout tone="warning" title={`${warnings.length} aviso(s) de qualidade`}>
          <ul className="mb-2 list-disc space-y-1 pl-4 text-xs">
            {warnings.slice(0, 6).map((w) => (
              <li key={w.code}>{w.message}</li>
            ))}
          </ul>
          <Button size="sm" onClick={() => doPublish(true)} disabled={publish.isPending}>
            Publicar mesmo assim
          </Button>
        </Callout>
      ) : (
        <Button className="w-full" onClick={() => doPublish(false)} disabled={publish.isPending}>
          {publish.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
          {active ? 'Atualizar publicacao' : 'Publicar'}
        </Button>
      )}

      <div className="mt-4 border-t border-border pt-4">
        <p className="mb-2 text-xs font-semibold text-muted-foreground">
          Exportar para implantacao manual
        </p>
        <Button
          variant="secondary"
          size="sm"
          className="w-full"
          onClick={() => exportZip.mutate({ allowIndexing: false })}
          disabled={exportZip.isPending}
        >
          {exportZip.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
          Baixar ZIP (Netlify/Hostinger)
        </Button>
        <p className="mt-1 text-xs text-muted-foreground">
          Pacote estatico, sem backend. Gerado com noindex; ajuste ao publicar de verdade.
        </p>
      </div>

      {active ? (
        <div className="mt-4 border-t border-border pt-4">
          <p className="mb-2 text-xs font-semibold text-muted-foreground">Abordagem por WhatsApp</p>

          {!latestOutreach ? (
            <Button
              size="sm"
              variant="secondary"
              className="w-full"
              onClick={() =>
                generateOutreach.mutate(undefined, {
                  onError: (error) => toast.error(error instanceof ApiError ? error.message : 'Nao foi possivel gerar a mensagem.'),
                })
              }
              disabled={generateOutreach.isPending}
            >
              {generateOutreach.isPending ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
              Gerar mensagem de abordagem
            </Button>
          ) : (
            <div className="space-y-2">
              <Textarea
                value={draftText}
                onChange={(e) => setDraftText(e.target.value)}
                rows={4}
                className="text-xs"
                maxLength={2000}
              />
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    editOutreach.mutate(
                      { messageId: latestOutreach.id, messageText: draftText },
                      { onSuccess: () => toast.success('Mensagem salva.') },
                    )
                  }
                  disabled={editOutreach.isPending || draftText.trim() === latestOutreach.messageText.trim()}
                >
                  Salvar edicao
                </Button>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() =>
                    generateOutreach.mutate(undefined, {
                      onError: (error) => toast.error(error instanceof ApiError ? error.message : 'Nao foi possivel gerar a mensagem.'),
                    })
                  }
                  disabled={generateOutreach.isPending}
                >
                  Gerar outra
                </Button>
              </div>

              {(() => {
                const waUrl = latestOutreach.phoneSnapshot ? buildWhatsAppUrl(latestOutreach.phoneSnapshot, draftText) : null;
                return waUrl ? (
                  <a href={waUrl} target="_blank" rel="noopener noreferrer" onClick={() => markOpened.mutate(latestOutreach.id)}>
                    <Button size="sm" className="w-full">
                      <MessageCircle className="h-4 w-4" aria-hidden="true" />
                      Abrir no WhatsApp
                    </Button>
                  </a>
                ) : (
                  <p className="text-xs text-muted-foreground">
                    Nenhum WhatsApp valido confirmado para este negocio. Preencha o telefone nos dados do lead.
                  </p>
                );
              })()}

              {latestOutreach.confirmedSentAt ? (
                <Badge tone="success">Envio confirmado</Badge>
              ) : (
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-full"
                  onClick={() =>
                    confirmSent.mutate(latestOutreach.id, {
                      onSuccess: () => toast.success('Envio registrado no historico do lead.'),
                    })
                  }
                  disabled={confirmSent.isPending || !latestOutreach.openedAt}
                >
                  A mensagem foi enviada de verdade?
                </Button>
              )}
            </div>
          )}
        </div>
      ) : null}

      <div className="mt-4">
        <p className="mb-2 text-xs font-semibold text-muted-foreground">Historico de publicacoes</p>
        <ul className="max-h-40 space-y-1 overflow-y-auto text-xs">
          {(publications.data ?? []).map((pub) => (
            <li key={pub.id} className="flex items-center justify-between gap-2 rounded px-1 py-1 hover:bg-muted">
              <span>
                #{pub.publicationNumber} · {pub.status}
              </span>
              {pub.status === 'SUPERSEDED' ? (
                <Button size="sm" variant="ghost" onClick={() => rollback.mutate(pub.id, { onSuccess: () => toast.success('Rollback feito.') })}>
                  Reverter
                </Button>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
