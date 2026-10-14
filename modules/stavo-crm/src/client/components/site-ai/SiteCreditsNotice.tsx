import { useQuery } from '@tanstack/react-query';

/**
 * The PageNova subscription wallet is managed in the parent app (Supabase).
 * It is intentionally different from the CRM's technical Google/OpenAI budgets.
 * The iframe is same-origin, so it can read /api/credits using its auth cookie.
 */
type CreditApiResponse = {
  configured: boolean;
  contract?: { sites?: number; google?: number };
  balance?: {
    active: boolean;
    sitesLimit?: number;
    sitesUsed?: number;
    sitesRemaining: number;
    startedAt?: string;
  };
};

export function usePageNovaSiteCredits() {
  return useQuery({
    queryKey: ['pagenova-site-credits'],
    queryFn: async (): Promise<CreditApiResponse> => {
      const response = await fetch('/api/credits', {
        credentials: 'same-origin',
        headers: { Accept: 'application/json' },
        cache: 'no-store',
      });
      if (!response.ok) throw new Error('Créditos indisponíveis');
      return response.json() as Promise<CreditApiResponse>;
    },
    staleTime: 15_000,
    refetchOnWindowFocus: true,
    retry: 1,
  });
}

export function siteCreditsExhausted(data: CreditApiResponse | undefined): boolean {
  return data?.configured === true
    && data.balance?.active === true
    && typeof data.balance.sitesRemaining === 'number'
    && data.balance.sitesRemaining <= 0;
}

export function SiteCreditsNotice({ compact = false }: { compact?: boolean }) {
  const { data, isLoading, isError } = usePageNovaSiteCredits();
  const balance = data?.configured ? data.balance : undefined;
  const verified = Boolean(balance?.active && Number.isFinite(balance.sitesRemaining));
  const limit = verified && Number.isFinite(balance?.sitesLimit) ? balance!.sitesLimit! : data?.contract?.sites ?? 40;
  const remaining = verified ? Math.max(0, balance!.sitesRemaining) : null;
  const blocked = verified && remaining === 0;

  return (
    <div
      role="status"
      aria-live="polite"
      className={`rounded-xl border p-3 text-sm ${blocked
        ? 'border-red-500/35 bg-red-500/[.07]'
        : 'border-primary/25 bg-primary-soft/40'}`}
    >
      <p className="font-semibold text-foreground">
        {verified
          ? `Seus créditos de sites: ${remaining} de ${limit} disponíveis`
          : `Gerações de sites: até ${limit} por ciclo de assinatura`}
      </p>
      <p className="mt-1 leading-5 text-muted-foreground">
        {blocked
          ? 'Você utilizou os créditos deste ciclo. Aguarde a renovação; editar os sites existentes continua disponível.'
          : isLoading
            ? 'Consultando seu saldo individual...'
            : isError
              ? 'Saldo individual temporariamente indisponível. A geração será validada pelo servidor.'
              : !verified
                ? 'Saldo individual ainda não confirmado. Este número é a franquia contratada, não o saldo disponível.'
                : 'Uma nova geração de site concluída utiliza 1 crédito.'}
      </p>
      {!compact && !blocked && (
        <p className="mt-1 text-xs leading-5 text-muted-foreground">
          Os dois geradores da PageNova compartilham o mesmo saldo. Edição de textos, imagens,
          prévia e publicação não consomem créditos de geração.
        </p>
      )}
    </div>
  );
}
