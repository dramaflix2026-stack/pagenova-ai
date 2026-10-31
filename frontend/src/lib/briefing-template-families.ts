/** Six visual families nested exclusively within Estático 03 (briefing personalizado).
 * Estático 01 and 02 must never be re-routed by this registry.
 */
export const BRIEFING_TEMPLATE_FAMILIES = [
  {
    "id": 1,
    "name": "Beleza e Serviços Premium",
    "niches": [
      "Clínica de estética",
      "Dermatologia",
      "SPA e bem-estar",
      "Odontologia estética",
      "Fisioterapia",
      "Psicologia e terapias",
      "Salão de beleza premium",
      "Estúdio de maquiagem",
      "Fotografia profissional",
      "Consultoria de imagem"
    ]
  },
  {
    "id": 2,
    "name": "Engenharia e Corporativo",
    "niches": [
      "Engenharia",
      "Construtora",
      "Reformas",
      "Arquitetura",
      "Energia solar",
      "Eletricista",
      "Encanador",
      "Serralheria",
      "Vidraçaria",
      "Pintura",
      "Marcenaria",
      "Móveis planejados",
      "Paisagismo",
      "Materiais de construção",
      "Segurança eletrônica"
    ]
  },
  {
    "id": 3,
    "name": "Gastronomia Premium",
    "niches": [
      "Restaurante",
      "Pizzaria",
      "Hamburgueria",
      "Cafeteria",
      "Padaria",
      "Confeitaria",
      "Marmitaria",
      "Sorveteria",
      "Churrascaria",
      "Buffet",
      "Comida japonesa",
      "Açaí",
      "Doceria",
      "Food truck"
    ]
  },
  {
    "id": 4,
    "name": "Saúde Integrada",
    "niches": [
      "Clínica médica",
      "Consultório médico",
      "Clínica odontológica",
      "Clínica de fisioterapia",
      "Clínica de psicologia",
      "Clínica de nutrição",
      "Fonoaudiologia",
      "Terapia ocupacional",
      "Clínica de exames",
      "Laboratório de análises clínicas",
      "Oftalmologia",
      "Ortopedia",
      "Cardiologia",
      "Pediatria",
      "Neurologia",
      "Saúde integrada"
    ]
  },
  {
    "id": 5,
    "name": "Tecnologia e Negócios Digitais",
    "niches": [
      "Inteligência artificial",
      "SaaS",
      "Startups",
      "Empresas de tecnologia",
      "Desenvolvimento de software",
      "Desenvolvimento de aplicativos",
      "Automação empresarial",
      "Agências de marketing digital",
      "Agências de publicidade",
      "Consultoria empresarial",
      "Consultoria financeira",
      "Contabilidade",
      "Recursos humanos",
      "Corretora de seguros",
      "Educação online"
    ]
  },
  {
    "id": 6,
    "name": "Comércio, Varejo e E-commerce",
    "niches": [
      "Loja de roupas",
      "Loja de calçados",
      "Joalheria e semijoias",
      "Ótica",
      "Perfumaria e cosméticos",
      "Pet shop",
      "Loja de eletrônicos",
      "Loja de celulares e acessórios",
      "Loja de móveis e decoração",
      "Floricultura",
      "Papelaria",
      "Loja de brinquedos",
      "Loja de artigos esportivos",
      "Loja de presentes e personalizados",
      "E-commerce multimarcas"
    ]
  }
] as const;
export type BriefingFamilyId = 1|2|3|4|5|6;
const norm=(v:string)=>v.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
const aliases:Record<string,string>={
 "moda feminina":"Loja de roupas","moda masculina":"Loja de roupas","boutique de moda":"Loja de roupas","boutique feminina":"Loja de roupas",
 "calcados":"Loja de calçados","joalheria":"Joalheria e semijoias","semijoias":"Joalheria e semijoias",
 "cosmeticos":"Perfumaria e cosméticos","perfumaria":"Perfumaria e cosméticos",
 "eletronicos":"Loja de eletrônicos","celulares":"Loja de celulares e acessórios",
 "moveis e decoracao":"Loja de móveis e decoração","brinquedos":"Loja de brinquedos",
 "artigos esportivos":"Loja de artigos esportivos","presentes":"Loja de presentes e personalizados",
 "ecommerce multimarcas":"E-commerce multimarcas"
};
export function resolveBriefingFamily(niche:string):BriefingFamilyId|undefined{
 const v=norm(niche||"");if(!v)return;
 const canonical=aliases[v]||niche;
 const found=BRIEFING_TEMPLATE_FAMILIES.find(f=>f.niches.some(n=>norm(n)===norm(canonical)));
 return found?.id;
}
export function resolveBriefingFamilyFromExplicitNiche(brief:string):BriefingFamilyId|undefined{
 const match=brief.match(/(?:^|\n)\s*(?:\*\*)?\s*(?:nicho|segmento)\s*(?:\*\*)?\s*:\s*([^\n]+)/i);
 return match?resolveBriefingFamily(match[1].replace(/\*\*/g,"").trim()):undefined;
}
