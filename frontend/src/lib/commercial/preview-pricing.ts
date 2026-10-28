/** Frente 3 — TABELA PROPOSTA para simulação visual.
 * Não usar em checkout, webhook, cobrança, assinatura ou produção.
 * Valores informados pelo proprietário; não habilitam cobrança.
 */
import {normalizeSelection} from "./modular-catalog";

export const PREVIEW_PRICES_CENTS: Readonly<Record<string,number>>={
 "studio.sites":7900,
 "studio.landing":3900,
 "studio.cloner":4900,
 "studio.forms":2900,
 "studio.quizzes":2900,
 "studio.ebooks":3900,
 "crm.search":5900,
 "crm.leads":4900,
 "crm.operations":4900,
 "bundle.studio":20700,
 "bundle.crm":24700,
 "bundle.development":39700,
 "bundle.all":59700
};

export type PreviewQuote=Readonly<{
 subtotalCents:number;
 discountPercent:number;
 discountCents:number;
 totalCents:number;
 selection:readonly string[];
}>;

export function calculatePreviewQuote(selected:readonly string[]):PreviewQuote {
 const selection=normalizeSelection(selected,true);
 const subtotalCents=selection.reduce((sum,code)=>{
   const price=PREVIEW_PRICES_CENTS[code];
   if(!Number.isSafeInteger(price)||price<=0)throw new Error("Preço de demonstração indisponível");
   return sum+price;
 },0);
 // Somente o pacote completo possui desconto aprovado; sem descontos progressivos fictícios.
 const discountCents=selection.includes("bundle.all")?25400:0;
 const discountPercent=selection.includes("bundle.all")?Math.round(25400/85100*10000)/100:0;
 return {selection,subtotalCents,discountPercent,discountCents,totalCents:subtotalCents};
}
