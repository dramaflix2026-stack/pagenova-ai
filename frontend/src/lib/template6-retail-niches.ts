/** Official Template 6 — Commerce, Retail and E-commerce. */
export const TEMPLATE_6_CATEGORY = "Comércio e Varejo" as const;
export const TEMPLATE_6_NICHES = [
 "Loja de roupas","Loja de calçados","Joalheria e semijoias","Ótica",
 "Perfumaria e cosméticos","Pet shop","Loja de eletrônicos",
 "Loja de celulares e acessórios","Loja de móveis e decoração",
 "Floricultura","Papelaria","Loja de brinquedos",
 "Loja de artigos esportivos","Loja de presentes e personalizados",
 "E-commerce multimarcas"
] as const;
export type Template6Niche = (typeof TEMPLATE_6_NICHES)[number];
const normalized=(s:string)=>s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
const aliases:Record<string,string[]>={
 "Loja de roupas":["moda feminina","moda masculina","boutique de moda","boutique feminina","loja de moda","vestuario"],
 "Loja de calçados":["calcados","loja de sapatos","sapatos"],
 "Joalheria e semijoias":["joalheria","semijoias","semi joias","joias"],
 "Ótica":["otica","oculos","loja de oculos"],
 "Perfumaria e cosméticos":["cosmeticos","perfumaria","loja de perfumes","loja de cosmeticos"],
 "Pet shop":["petshop","loja pet"],
 "Loja de eletrônicos":["eletronicos","loja de eletronicos"],
 "Loja de celulares e acessórios":["celulares","loja de celulares","acessorios para celular"],
 "Loja de móveis e decoração":["loja de moveis","moveis e decoracao","loja de decoracao"],
 "Floricultura":["flores","loja de flores"],
 "Papelaria":["loja de papelaria"],
 "Loja de brinquedos":["brinquedos","loja de brinquedos"],
 "Loja de artigos esportivos":["artigos esportivos","loja esportiva"],
 "Loja de presentes e personalizados":["presentes","presentes personalizados","loja de presentes"],
 "E-commerce multimarcas":["ecommerce multimarcas","e commerce multimarcas","loja virtual multimarcas"]
};
export function resolveTemplate6Niche(value:string):Template6Niche|undefined{
 const v=normalized(value||"");
 if(!v)return undefined;
 return TEMPLATE_6_NICHES.find(n=>[n,...(aliases[n]||[])].some(a=>normalized(a)===v));
}
export function isTemplate6Niche(value:string):value is Template6Niche{
 return TEMPLATE_6_NICHES.some(n=>normalized(n)===normalized(value));
}
export function inferTemplate6NicheFromBrief(value:string):Template6Niche|undefined{
 const v=normalized(value||"");
 if(!v)return undefined;
 return TEMPLATE_6_NICHES.find(n=>[n,...(aliases[n]||[])].some(a=>{
  const needle=normalized(a);
  return needle.length>=6&&new RegExp("(^| )"+needle+"( |$)").test(v);
 }));
}
