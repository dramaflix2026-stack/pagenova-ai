/** Eight visual families nested exclusively within Estático 03 (briefing personalizado).
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
  },
  {
    id: 7,
    name: "Imobiliário e Alto Padrão",
    niches: ["Imobiliárias","Corretores de imóveis","Imóveis de luxo","Lançamentos imobiliários","Incorporadoras","Condomínios residenciais","Imóveis comerciais","Locação de imóveis","Administração de imóveis","Consultoria imobiliária","Casas de alto padrão","Empreendimentos residenciais"]
  },
  {id:8,name:"Hotelaria, Turismo e Experiências",niches:["Hotéis","Pousadas","Resorts","Hotéis boutique","Chalés e cabanas","Casas de temporada","Agências de viagens","Turismo de luxo","Operadoras de turismo","Passeios e excursões","Experiências turísticas","Ecoturismo"]}
] as const;
export type BriefingFamilyId = 1|2|3|4|5|6|7|8;
const norm=(v:string)=>v.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
const aliases:Record<string,string>={
 "moda feminina":"Loja de roupas","moda masculina":"Loja de roupas","boutique de moda":"Loja de roupas","boutique feminina":"Loja de roupas",
 "calcados":"Loja de calçados","joalheria":"Joalheria e semijoias","semijoias":"Joalheria e semijoias",
 "cosmeticos":"Perfumaria e cosméticos","perfumaria":"Perfumaria e cosméticos",
 "eletronicos":"Loja de eletrônicos","celulares":"Loja de celulares e acessórios",
 "moveis e decoracao":"Loja de móveis e decoração","brinquedos":"Loja de brinquedos",
 "artigos esportivos":"Loja de artigos esportivos","presentes":"Loja de presentes e personalizados",
 "ecommerce multimarcas":"E-commerce multimarcas",
 "imobiliaria":"Imobiliárias","imobiliarias":"Imobiliárias","corretor de imoveis":"Corretores de imóveis","corretora de imoveis":"Corretores de imóveis","imoveis de alto padrao":"Imóveis de luxo","imoveis de luxo":"Imóveis de luxo","lancamento imobiliario":"Lançamentos imobiliários","incorporadora":"Incorporadoras","condominio residencial":"Condomínios residenciais","imoveis comerciais":"Imóveis comerciais","locacao de imoveis":"Locação de imóveis","administracao de imoveis":"Administração de imóveis","consultoria imobiliaria":"Consultoria imobiliária","casas de luxo":"Casas de alto padrão","empreendimento residencial":"Empreendimentos residenciais",
 "hotel":"Hotéis","hoteis":"Hotéis","pousada":"Pousadas","resort":"Resorts","hotel boutique":"Hotéis boutique","chale":"Chalés e cabanas","chales":"Chalés e cabanas","cabanas":"Chalés e cabanas","casa de temporada":"Casas de temporada","aluguel por temporada":"Casas de temporada","agencia de viagens":"Agências de viagens","agencia de turismo":"Agências de viagens","operadora de turismo":"Operadoras de turismo","passeios turisticos":"Passeios e excursões","excursao":"Passeios e excursões","experiencias de viagem":"Experiências turísticas","turismo ecologico":"Ecoturismo"
};
export function resolveBriefingFamily(niche:string):BriefingFamilyId|undefined{
 const v=norm(niche||"");if(!v)return undefined;
 const canonical=aliases[v]||niche;
 const exact=BRIEFING_TEMPLATE_FAMILIES.find(f=>f.niches.some(n=>norm(n)===norm(canonical)));
 if(exact)return exact.id;
 const retail=/(?:^| )(?:boutique|loja) de (?:moda|roupas|calcados|sapatos|celulares|eletronicos|moveis|brinquedos|artigos esportivos|presentes|cosmeticos)(?: |$)|(?:^| )(?:moda feminina|moda masculina|joalheria|semijoias|perfumaria|pet shop|floricultura|papelaria|otica|e commerce multimarcas)(?: |$)/;
 if(retail.test(v))return 6;
 const realEstate=/(?:^| )(?:imobiliaria|imobiliarias|corretor de imoveis|corretora de imoveis|imoveis de luxo|imoveis de alto padrao|lancamentos imobiliarios|incorporadora|incorporadoras|condominios residenciais|imoveis comerciais|locacao de imoveis|administracao de imoveis|consultoria imobiliaria|casas de alto padrao|empreendimentos residenciais)(?: |$)/;
 if(realEstate.test(v))return 7;
 const hospitality=/(?:^| )(?:hotel|hoteis|pousada|pousadas|resort|resorts|hotel boutique|hoteis boutique|chale|chales|cabana|cabanas|casas de temporada|agencia de viagens|agencia de turismo|turismo de luxo|operadora de turismo|passeios e excursoes|experiencias turisticas|ecoturismo)(?: |$)/;
 if(hospitality.test(v))return 8;
 return undefined;
}
export function resolveBriefingFamilyFromExplicitNiche(brief:string):BriefingFamilyId|undefined{
 const line=brief.split(/\r?\n/).find(l=>/^\s*(?:\*\*)?\s*(?:nicho|segmento)\s*(?:\*\*)?\s*:/i.test(l));
 if(!line)return undefined;
 return resolveBriefingFamily(line.replace(/^.*?:/,"").replace(/\*\*/g,"").trim());
}
