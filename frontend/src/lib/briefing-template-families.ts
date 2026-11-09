/** Ten visual families nested exclusively within Estático 03 (briefing personalizado).
 * Estático 01 and 02 must never be re-routed by this registry.
 */
export const BRIEFING_TEMPLATE_FAMILIES = [
  {
    "id": 1,
    "name": "Beleza e Serviços Premium",
    "niches": [
      "Barbearia",
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
      "Saúde integrada",
      "Radiologia",
      "Ginecologia e obstetrícia",
      "Dermatologia clínica",
      "Centro de diagnóstico por imagem",
      "Clínica oftalmológica"
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
  {id:8,name:"Hotelaria, Turismo e Experiências",niches:["Hotéis","Pousadas","Resorts","Hotéis boutique","Chalés e cabanas","Casas de temporada","Agências de viagens","Turismo de luxo","Operadoras de turismo","Passeios e excursões","Experiências turísticas","Ecoturismo"]},
  {id:9,name:"Automotivo e Mobilidade",niches:["Oficinas mecânicas","Auto centers","Estética automotiva","Detalhamento automotivo","Funilaria e pintura","Lava-rápidos","Autoelétricas","Lojas de pneus","Centros de alinhamento","Oficinas de motos","Concessionárias de veículos","Locadoras de veículos"]},
  {id:10,name:"Educação e Formação",niches:["Escolas particulares","Escolas de idiomas","Cursos profissionalizantes","Escolas técnicas","Escolas de música","Escolas de dança","Escolas de artes","Cursos preparatórios","Reforço escolar","Escolas de programação","Escolas de gastronomia","Centros de treinamento corporativo"]}
] as const;
export type BriefingFamilyId = 1|2|3|4|5|6|7|8|9|10;
const norm=(v:string)=>v.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
const aliases:Record<string,string>={
 "barbearia premium masculina":"Barbearia","barbearia premium":"Barbearia","barbershop":"Barbearia","barber shop":"Barbearia",
 "salao de beleza":"Salão de beleza premium","salao de beleza feminino":"Salão de beleza premium","salao de beleza masculino":"Salão de beleza premium",
 "moda feminina":"Loja de roupas","moda masculina":"Loja de roupas","moda e acessorios premium":"Loja de roupas","moda e acessorios":"Loja de roupas","moda e acessorios de luxo":"Loja de roupas","marca de moda":"Loja de roupas","marca de moda e acessorios":"Loja de roupas","boutique de moda":"Loja de roupas","boutique feminina":"Loja de roupas",
 "calcados":"Loja de calçados","joalheria":"Joalheria e semijoias","semijoias":"Joalheria e semijoias",
 "cosmeticos":"Perfumaria e cosméticos","perfumaria":"Perfumaria e cosméticos",
 "eletronicos":"Loja de eletrônicos","celulares":"Loja de celulares e acessórios",
 "moveis e decoracao":"Loja de móveis e decoração","brinquedos":"Loja de brinquedos",
 "artigos esportivos":"Loja de artigos esportivos","presentes":"Loja de presentes e personalizados",
 "ecommerce multimarcas":"E-commerce multimarcas",
 "imobiliaria":"Imobiliárias","imobiliarias":"Imobiliárias","corretor de imoveis":"Corretores de imóveis","corretora de imoveis":"Corretores de imóveis","imoveis de alto padrao":"Imóveis de luxo","imoveis de luxo":"Imóveis de luxo","lancamento imobiliario":"Lançamentos imobiliários","incorporadora":"Incorporadoras","condominio residencial":"Condomínios residenciais","imoveis comerciais":"Imóveis comerciais","locacao de imoveis":"Locação de imóveis","administracao de imoveis":"Administração de imóveis","consultoria imobiliaria":"Consultoria imobiliária","casas de luxo":"Casas de alto padrão","empreendimento residencial":"Empreendimentos residenciais",
 "oficina mecanica":"Oficinas mecânicas","mecanica automotiva":"Oficinas mecânicas","auto center":"Auto centers","autocenter":"Auto centers","estetica automotiva":"Estética automotiva","detailing automotivo":"Detalhamento automotivo","detalhamento automotivo":"Detalhamento automotivo","funilaria":"Funilaria e pintura","lava rapido":"Lava-rápidos","lava jato":"Lava-rápidos","autoeletrica":"Autoelétricas","auto eletrica":"Autoelétricas","loja de pneus":"Lojas de pneus","alinhamento e balanceamento":"Centros de alinhamento","oficina de motos":"Oficinas de motos","concessionaria":"Concessionárias de veículos","concessionaria de veiculos":"Concessionárias de veículos","locadora de carros":"Locadoras de veículos","locadora de veiculos":"Locadoras de veículos",
 "escola particular":"Escolas particulares","escola de idiomas":"Escolas de idiomas","curso profissionalizante":"Cursos profissionalizantes","escola tecnica":"Escolas técnicas","escola de musica":"Escolas de música","escola de danca":"Escolas de dança","escola de artes":"Escolas de artes","curso preparatorio":"Cursos preparatórios","cursinho preparatorio":"Cursos preparatórios","reforco escolar":"Reforço escolar","escola de programacao":"Escolas de programação","escola de gastronomia":"Escolas de gastronomia","treinamento corporativo":"Centros de treinamento corporativo",
 "hotel":"Hotéis","hoteis":"Hotéis","pousada":"Pousadas","resort":"Resorts","hotel boutique":"Hotéis boutique","chale":"Chalés e cabanas","chales":"Chalés e cabanas","cabanas":"Chalés e cabanas","casa de temporada":"Casas de temporada","aluguel por temporada":"Casas de temporada","agencia de viagens":"Agências de viagens","agencia de turismo":"Agências de viagens","operadora de turismo":"Operadoras de turismo","passeios turisticos":"Passeios e excursões","excursao":"Passeios e excursões","experiencias de viagem":"Experiências turísticas","turismo ecologico":"Ecoturismo"
};
export function resolveBriefingFamily(niche:string):BriefingFamilyId|undefined{
 const v=norm(niche||"");if(!v)return undefined;
 const canonical=aliases[v]||niche;
 const exact=BRIEFING_TEMPLATE_FAMILIES.find(f=>f.niches.some(n=>norm(n)===norm(canonical)));
 if(exact)return exact.id;
 // Composite AI/technology niches in long-form briefings must resolve to family 5.
 // Prefer exact canonical matches above; do not hijack health, education or other families.
 if(/(?:^| )(?:barbearia|barbeiro|barbershop|barber shop)(?: |$)/.test(v))return 1;
 // AI-generated projects often retain the business name (e.g. "Atlas Engenharia")
 // instead of an exact catalog niche. Recognize engineering without changing the stored niche.
 if(/(?:^| )(?:engenharia|engenheiro|engenheira|projetos? estruturais?|consultoria tecnica de engenharia|gerenciamento de obras)(?: |$)/.test(v))return 2;
 const technology=/(?:^| )(?:inteligencia artificial|agentes? de ia|automacao empresarial|automacao de processos|empresa de tecnologia|empresas de tecnologia|tecnologia e inovacao|desenvolvimento de software|desenvolvimento de aplicativos|agencia de marketing digital|agencias de marketing digital|consultoria empresarial|negocios digitais|saas|startup|startups)(?: |$)/;
 if(technology.test(v))return 5;
 const retail=/(?:^| )(?:boutique|loja) de (?:moda|roupas|calcados|sapatos|celulares|eletronicos|moveis|brinquedos|artigos esportivos|presentes|cosmeticos)(?: |$)|(?:^| )(?:moda feminina|moda masculina|joalheria|semijoias|perfumaria|pet shop|floricultura|papelaria|otica|e commerce multimarcas)(?: |$)/;
 if(retail.test(v))return 6;
 const realEstate=/(?:^| )(?:imobiliaria|imobiliarias|corretor de imoveis|corretora de imoveis|imoveis de luxo|imoveis de alto padrao|lancamentos imobiliarios|incorporadora|incorporadoras|condominios residenciais|imoveis comerciais|locacao de imoveis|administracao de imoveis|consultoria imobiliaria|casas de alto padrao|empreendimentos residenciais)(?: |$)/;
 if(realEstate.test(v))return 7;
 const hospitality=/(?:^| )(?:hotel|hoteis|pousada|pousadas|resort|resorts|hotel boutique|hoteis boutique|chale|chales|cabana|cabanas|casas de temporada|agencia de viagens|agencia de turismo|turismo de luxo|operadora de turismo|passeios e excursoes|experiencias turisticas|ecoturismo)(?: |$)/;
 if(hospitality.test(v))return 8;
 const automotive=/(?:^| )(?:oficina mecanica|oficinas mecanicas|auto center|auto centers|estetica automotiva|detalhamento automotivo|funilaria|lava rapido|lava rapidos|autoeletrica|autoeletricas|loja de pneus|lojas de pneus|alinhamento e balanceamento|centros de alinhamento|oficina de motos|oficinas de motos|concessionaria de veiculos|concessionarias de veiculos|locadora de veiculos|locadoras de veiculos)(?: |$)/;
 if(automotive.test(v))return 9;
 const education=/(?:^| )(?:escola particular|escolas particulares|escola de idiomas|escolas de idiomas|curso profissionalizante|cursos profissionalizantes|escola tecnica|escolas tecnicas|escola de musica|escolas de musica|escola de danca|escolas de danca|escola de artes|escolas de artes|curso preparatorio|cursos preparatorios|reforco escolar|escola de programacao|escolas de programacao|escola de gastronomia|escolas de gastronomia|centro de treinamento corporativo|centros de treinamento corporativo)(?: |$)/;
 if(education.test(v))return 10;
 return undefined;
}
export function resolveBriefingFamilyFromExplicitNiche(brief:string):BriefingFamilyId|undefined{
 const line=brief.split(/\r?\n/).find(l=>/^\s*(?:\*\*)?\s*(?:nicho|segmento)\s*(?:\*\*)?\s*:/i.test(l));
 if(!line)return undefined;
 return resolveBriefingFamily(line.replace(/^.*?:/,"").replace(/\*\*/g,"").trim());
}


/**
 * Recognize the BUSINESS described by a creation brief, not the industries
 * mentioned in exclusions ("não usar fotos de maquiagem", etc.).
 *
 * Canonical matches cover the full registry; aliases cover natural phrasing.
 * Keep this shared across the Studio and the API so the two cannot disagree.
 */
const primaryBriefAliases:Record<string,string>={
  "maquiagem":"Estúdio de maquiagem",
  "maquiagem profissional":"Estúdio de maquiagem",
  "maquiadora":"Estúdio de maquiagem",
  "maquiador":"Estúdio de maquiagem",
  "make up":"Estúdio de maquiagem",
  "flores":"Floricultura",
  "loja de flores":"Floricultura",
  "arranjos florais":"Floricultura",
  "buques personalizados":"Floricultura",
  "floricultura boutique":"Floricultura",
  "petshop":"Pet shop",
  "loja de perfumes":"Perfumaria e cosméticos",
  "moda feminina":"Loja de roupas",
  "moda masculina":"Loja de roupas",
  "boutique de moda":"Loja de roupas",
  "sushi":"Comida japonesa",
  "sushibar":"Comida japonesa",
  "hamburguer":"Hamburgueria",
  "hamburgueres":"Hamburgueria",
  "pizza":"Pizzaria",
  "pizzas":"Pizzaria",
  "cafe especial":"Cafeteria",
  "cafe artesanal":"Cafeteria",
};
const primaryBriefCandidates=[
 ...BRIEFING_TEMPLATE_FAMILIES.flatMap(f=>f.niches.map(n=>({needle:norm(n),niche:String(n)}))),
 ...Object.entries(aliases).map(([needle,niche])=>({needle,niche})),
 ...Object.entries(primaryBriefAliases).map(([needle,niche])=>({needle:norm(needle),niche})),
].filter(item=>item.needle.length>=4);
const negativeBriefStart=/^(?:nao|nunca|jamais|sem|evite|evitar|proibido|proibida|exclua|remova|retire|nao incluir|nao usar)\b/;
const negativeBriefTail=/\b(?:nao|nunca|jamais|sem|evite|evitar|proibido|proibida)\s+(?:usar|use|utilizar|utilize|colocar|coloque|incluir|inclua|inserir|insira|misturar|misture|mostrar|mostre|ter|apresentar|apresente|gerar|gere|repetir|repita|inventar|invente|imagens?|fotos?|fotografias?)\b.*$/;

/** Positive business declarations only. Never use the entire raw brief to classify. */
export function positiveBusinessBrief(brief:string):string {
 return (brief||"").split(/\r?\n|(?<=[.!?;])\s+/u).map(raw=>{
  const line=norm(raw.replace(/^\s*(?:(?:[-*•]|\d+[.)])\s*)+/u,""));
  if(negativeBriefStart.test(line))return "";
  return line.replace(negativeBriefTail,"").trim();
 }).filter(Boolean).join(" ");
}

export function resolvePrimaryBriefingNiche(brief:string):string|undefined {
 const explicitLine=(brief||"").split(/\r?\n/u).find(line=>/^\s*(?:[-*]\s*)?(?:\*\*)?\s*(?:nicho|segmento|ramo(?:\s+de\s+atividade)?|tipo\s+de\s+neg[oó]cio)\s*(?:\*\*)?\s*:/i.test(line));
 const normalizedExplicit=explicitLine?norm(explicitLine.slice(explicitLine.indexOf(":")+1).replace(/\*\*/g,"")):"";
 if(normalizedExplicit){
  const exact=primaryBriefCandidates.find(item=>item.needle===normalizedExplicit);
  if(exact)return exact.niche;
  const scoped=primaryBriefCandidates.filter(item=>(" "+normalizedExplicit+" ").includes(" "+item.needle+" ")).sort((a,b)=>b.needle.length-a.needle.length)[0];
  if(scoped)return scoped.niche;
 }
 const statements=(brief||"").split(/\r?\n|(?<=[.!?;])\s+/u);
 for(const raw of statements){
  const cleaned=norm(raw.replace(/^\s*(?:(?:[-*•]|\d+[.)])\s*)+/u,""));
  if(!cleaned||negativeBriefStart.test(cleaned))continue;
  const positive=cleaned.replace(negativeBriefTail,"").trim();
  const padded=" "+positive+" ";
  const matches=primaryBriefCandidates.map(item=>({item,index:padded.indexOf(" "+item.needle+" ")})).filter(hit=>hit.index>=0);
  if(matches.length){
   matches.sort((a,b)=>a.index-b.index||b.item.needle.length-a.item.needle.length);
   return matches[0].item.niche;
  }
 }
 return undefined;
}
