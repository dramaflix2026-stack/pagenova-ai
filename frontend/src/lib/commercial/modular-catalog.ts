/** Frente 3 — catálogo preliminar do configurador modular.
 * NÃO vincular a pagamentos ou permissões em produção antes da homologação.
 * O catálogo legado permanece separado e inalterado.
 */
export type ModuleFamily = "studio" | "crm" | "development";
export type ModuleStatus = "candidate" | "needs_validation" | "coming_soon";
export type CommercialModule = Readonly<{
  code: string;
  family: ModuleFamily;
  title: string;
  status: ModuleStatus;
  includedIn?: readonly string[];
}>;
export const MODULAR_CATALOG: readonly CommercialModule[] = [
  {code:"studio.sites",family:"studio",title:"Criador de sites com IA",status:"candidate"},
  {code:"studio.landing",family:"studio",title:"Landing pages",status:"candidate"},
  {code:"studio.cloner",family:"studio",title:"Clonador de páginas",status:"needs_validation"},
  {code:"studio.forms",family:"studio",title:"Formulários",status:"candidate"},
  {code:"studio.quizzes",family:"studio",title:"Quizzes",status:"candidate"},
  {code:"studio.ebooks",family:"studio",title:"Ebooks",status:"candidate"},
  {code:"crm.search",family:"crm",title:"Busca de empresas",status:"needs_validation"},
  {code:"crm.leads",family:"crm",title:"Gestão de leads",status:"needs_validation"},
  {code:"crm.operations",family:"crm",title:"Operação comercial",status:"needs_validation"},
  {code:"development.apps",family:"development",title:"Aplicativos",status:"coming_soon"},
  {code:"development.systems",family:"development",title:"Sistemas",status:"coming_soon"},
  {code:"bundle.studio",family:"studio",title:"Estúdio completo",status:"needs_validation",includedIn:["studio.sites","studio.landing","studio.cloner","studio.forms","studio.quizzes","studio.ebooks"]},
  {code:"bundle.crm",family:"crm",title:"CRM completo",status:"needs_validation",includedIn:["crm.search","crm.leads","crm.operations"]},
  {code:"bundle.development",family:"development",title:"Apps e Sistemas completo",status:"coming_soon",includedIn:["development.apps","development.systems"]},
  {code:"bundle.all",family:"studio",title:"PageNova Completa",status:"coming_soon",includedIn:["studio.sites","studio.landing","studio.cloner","studio.forms","studio.quizzes","studio.ebooks","crm.search","crm.leads","crm.operations","development.apps","development.systems"]},
] as const;

export function normalizeSelection(selected: readonly string[], allowComingSoon=false): string[] {
  const catalog = new Map(MODULAR_CATALOG.map(item=>[item.code,item]));
  const unique = [...new Set(selected)];
  if (unique.some(code=>!catalog.has(code))) throw new Error("Módulo desconhecido");
  if (!allowComingSoon && unique.some(code=>catalog.get(code)?.status==="coming_soon")) throw new Error("Módulo indisponível");
  const included = new Set(unique.flatMap(code=>catalog.get(code)?.includedIn??[]));
  return unique.filter(code=>!included.has(code));
}

export function expandEntitlements(selected: readonly string[], allowComingSoon=false): string[] {
  const catalog = new Map(MODULAR_CATALOG.map(item=>[item.code,item]));
  const normalized = normalizeSelection(selected,allowComingSoon);
  return [...new Set(normalized.flatMap(code=>[code,...(catalog.get(code)?.includedIn??[])]))];
}

export type QuotedOffer = Readonly<{
  selection: readonly string[];
  currency: "BRL";
  amountCents: number;
  checkoutUrl: string;
  active: boolean;
}>;
/** Só uma oferta exata, ativa e precificada no servidor pode abrir checkout. */
export function resolveConfiguredOffer(
  selected: readonly string[],
  offers: readonly QuotedOffer[],
): QuotedOffer | null {
  const normalized = normalizeSelection(selected);
  if (!normalized.length) return null;
  const key = [...normalized].sort().join("|");
  const matches = offers.filter(offer=>
    offer.active && offer.currency==="BRL" &&
    Number.isSafeInteger(offer.amountCents) && offer.amountCents>0 &&
    /^https:\/\//.test(offer.checkoutUrl) &&
    [...normalizeSelection(offer.selection)].sort().join("|")===key
  );
  return matches.length===1?matches[0]:null;
}
