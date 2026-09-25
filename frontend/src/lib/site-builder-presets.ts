export type SitePreset = {
  id: string;
  title: string;
  icon: string;
  description: string;
  brief: string;
  modules: string[];
};

export const SITE_PRESETS: SitePreset[] = [
  {
    id: "institucional", title: "Site Institucional", icon: "🏢", description: "Presença profissional para empresas.",
    brief: "Crie um site institucional para [nome da empresa], que atua em [segmento] na região de [cidade]. Público: [perfil dos clientes]. Proposta de valor: [diferencial real]. Estruture uma home de autoridade, apresentação da empresa, serviços ou soluções com benefícios concretos, processo de atendimento, dúvidas frequentes e contato. Use apenas fatos que eu fornecer; deixe dados ausentes claramente pendentes de preenchimento. Tom profissional, claro e específico ao setor.",
    modules: ["Home de autoridade", "Sobre e diferenciais", "Serviços", "Contato"],
  },
  {
    id: "imobiliaria", title: "Imobiliária", icon: "🏠", description: "Busca, vitrine e detalhe de imóveis.",
    brief: "Crie um site profissional para a imobiliária [nome], que atende [cidade/região] e trabalha com [venda, locação ou ambos]. Público: [perfil dos clientes]. Priorize busca de imóveis com filtros de tipo, bairro, dormitórios e preço; grade de imóveis com preço, metragem, quartos e localização; detalhe com descrição e informações completas; contato com o corretor. Use imóveis demonstrativos identificados como exemplo até eu fornecer o catálogo real. Visual editorial imobiliário, hierarquia clara e navegação simples. Não invente CRECI, avaliações, telefone ou endereços reais.",
    modules: ["Busca e filtros", "Vitrine de imóveis", "Detalhe do imóvel", "Contato com corretor"],
  },
  {
    id: "clinica", title: "Clínica", icon: "✚", description: "Especialidades, equipe e agendamento.",
    brief: "Crie um site para a clínica [nome], em [cidade], com especialidades [listar]. Público: [perfil]. Apresente especialidades com explicações acessíveis, profissionais apenas se eu fornecer nomes e credenciais, jornada de atendimento, estrutura, perguntas frequentes e caminhos de contato/agendamento. Não invente resultados clínicos, depoimentos, registro profissional, preços ou convênios. Linguagem acolhedora, confiável e sem promessas de cura.",
    modules: ["Especialidades", "Equipe", "Como funciona", "Agendamento"],
  },
  {
    id: "advocacia", title: "Escritório Jurídico", icon: "⚖", description: "Áreas de atuação e contato profissional.",
    brief: "Crie um site institucional para o escritório [nome] em [cidade], com áreas de atuação [listar]. Público: [perfil]. Apresente o escritório, as áreas atendidas, o processo de consulta, conteúdos informativos e contato. Não prometa resultado, não invente números de processos, OAB, prêmios, depoimentos ou especializações. Tom sóbrio, preciso e adequado à comunicação profissional.",
    modules: ["Áreas de atuação", "Equipe", "Consulta", "Contato"],
  },
  {
    id: "restaurante", title: "Restaurante", icon: "🍽", description: "Cardápio, ambiente e reservas.",
    brief: "Crie um site para o restaurante [nome] em [cidade]. Tipo de cozinha: [descrever]. Público: [perfil]. Inclua apresentação visual, cardápio organizado por categorias com preços apenas se fornecidos, ambiente, horários, localização e caminhos de reserva/pedido. Não invente pratos, preços, avaliações, endereço ou telefone; sinalize campos pendentes. Visual convidativo e fácil de usar no celular.",
    modules: ["Cardápio", "Ambiente", "Reservas", "Localização"],
  },
  {
    id: "servicos", title: "Prestador de Serviços", icon: "🛠", description: "Serviços, cobertura e orçamento.",
    brief: "Crie um site para [nome do profissional/empresa], que presta [serviços] em [cidades atendidas]. Público: [perfil]. Explique serviços e situações atendidas, processo de orçamento, diferenciais comprováveis, área de atendimento, dúvidas comuns e contato. Não invente certificações, tempo de mercado, avaliações, preços ou disponibilidade. Chamada principal para solicitar orçamento.",
    modules: ["Serviços", "Área atendida", "Como contratar", "Orçamento"],
  },
  {
    id: "portfolio", title: "Portfólio", icon: "🎨", description: "Projetos, trajetória e contato.",
    brief: "Crie um portfólio profissional para [nome], que atua em [área]. Público-alvo: [clientes desejados]. Apresente posicionamento, projetos ou cases com objetivo, papel desempenhado e resultados somente se eu fornecer, serviços oferecidos, trajetória e contato. Se não houver cases, crie uma estrutura pronta para cadastrá-los, sem inventar clientes ou números. Visual editorial que destaque o trabalho.",
    modules: ["Projetos", "Cases", "Sobre", "Contato"],
  },
  {
    id: "agencia", title: "Agência", icon: "✦", description: "Soluções, cases e proposta comercial.",
    brief: "Crie um site para a agência [nome], especializada em [serviços] para [segmento]. Mostre posicionamento, soluções e entregáveis, metodologia de trabalho, portfólio/cases reais fornecidos, equipe e formulário de briefing. Não invente clientes, resultados ou depoimentos. Visual forte e profissional, orientado a conversão sem exageros.",
    modules: ["Soluções", "Método", "Cases", "Briefing"],
  },
  {
    id: "industria", title: "Indústria", icon: "⚙", description: "Capacidade, soluções e contato B2B.",
    brief: "Crie um site institucional para a indústria [nome], fabricante de [produtos/soluções] em [região]. Público B2B: [compradores]. Inclua linhas de produtos, aplicações, diferenciais técnicos comprováveis, processo de fornecimento, documentos/certificações somente se fornecidos e contato comercial. Não invente normas atendidas, capacidade produtiva ou clientes. Visual técnico, sólido e fácil de consultar.",
    modules: ["Produtos", "Aplicações", "Capacidade", "Comercial"],
  },
  {
    id: "comercio", title: "Comércio Local", icon: "🛒", description: "Produtos, horários e contato.",
    brief: "Crie um site para o comércio [nome] em [cidade]. Produtos ou categorias: [listar]. Destaque catálogo de apresentação, benefícios de comprar na loja, horários, localização e contato. Não invente estoque, preços, endereço ou promoções. Não inclua checkout enquanto não houver integração de pagamentos; priorize consulta e atendimento.",
    modules: ["Categorias", "Vitrine", "Localização", "Atendimento"],
  },
];

export function getSitePreset(id: string): SitePreset {
  return SITE_PRESETS.find((item) => item.id === id) ?? SITE_PRESETS[0];
}
