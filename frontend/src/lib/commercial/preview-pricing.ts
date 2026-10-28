/** Frente 3 — PREÇOS FICTÍCIOS para simulação visual.
 * Não usar em checkout, webhook, cobrança, assinatura ou produção.
 * Preços e regras dependem de aprovação comercial.
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
 "bundle.studio":14700,
 "bundle.crm":11700
};

export type PreviewQuote=Readonly<{
 subtotalCents:number;
 discountPercent:number;
 discountCents:number;
 totalCents:number;
 selection:readonly string[];
}>;

export function calculatePreviewQuote(selected:readonly string[]):PreviewQuote {
 const selection=normalizeSelection(selected);
 const subtotalCents=selection.reduce((sum,code)=>{
   const price=PREVIEW_PRICES_CENTS[code];
   if(!Number.isSafeInteger(price)||price<=0)throw new Error("Preço de demonstração indisponível");
   return sum+price;
 },0);
 // Descontos demonstrativos por número de itens contratados; nunca cumulativos.
 const discountPercent=selection.length>=5?20:selection.length===4?15:selection.length===3?10:selection.length===2?5:0;
 const discountCents=Math.round(subtotalCents*discountPercent/100);
 return {selection,subtotalCents,discountPercent,discountCents,totalCents:subtotalCents-discountCents};
}
