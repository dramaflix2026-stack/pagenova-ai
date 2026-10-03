/**
 * Formatacao especifica de Sites com IA: custo em dolar.
 *
 * `formatMoney` de `@shared/format` e fixo em BRL (moeda do financeiro do
 * CRM); o custo de IA e sempre registrado em USD (secao 23 da
 * especificacao), entao merece o proprio formatador em vez de forcar uma
 * mudanca no compartilhado.
 */
const usdFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 4,
});

export function formatUsd(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return usdFormatter.format(0);
  const parsed = typeof value === 'number' ? value : Number(value);
  return usdFormatter.format(Number.isFinite(parsed) ? parsed : 0);
}
