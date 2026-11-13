/**
 * Public-facing product change log.
 * Keep entries factual, dated by the shipped release and linked to a real
 * PageNova route. Edit here to publish future platform patch notes.
 */
export type PageNovaUpdate={
  id:string;date:string;category:"Novidade"|"Melhoria"|"Correção";
  title:string;summary:string;details:readonly string[];href:string;linkLabel:string;
  /** Only major, relevant changes appear on Início. All entries remain in the archive. */
  featuredOnHome?:boolean;
};

export const pagenovaUpdates:readonly PageNovaUpdate[]=[
  {
    id:"2026-11-13-comandos-mais-naturais-e-retorno-de-avaliacoes",
    date:"2026-11-13",category:"Melhoria",featuredOnHome:true,
    title:"Comandos mais naturais e retorno de avaliações",
    summary:"O editor recebeu ajustes na interpretação de cores e na exibição das avaliações após tentativas de edição.",
    details:["Interpretação de nomes de cores e códigos HEX em pedidos de fundo.","Controles de avaliação também em tentativas sem alteração visível.","Recuperação de avaliações diretamente do histórico persistido."],
    href:"/app/builder-v2",linkLabel:"Abrir Studio"
  },
  {
    id:"2026-11-12-edicao-com-validacao-e-historico-de-aprendizado",
    date:"2026-11-12",category:"Melhoria",featuredOnHome:true,
    title:"Edição com validação e histórico de aprendizado",
    summary:"Novas verificações comparam o pedido à alteração realizada, enquanto avaliações anteriores ajudam a priorizar estratégias de edição.",
    details:["Verificações para cinco categorias de edição.","Consulta de padrões aprovados por intenção e elemento.","Registro de resultados para reduzir confirmações incorretas."],
    href:"/app/builder-v2",linkLabel:"Abrir Studio"
  },
  {
    id:"2026-11-11-mais-precisao-ao-editar-cards-imagens-e-secoes",
    date:"2026-11-11",category:"Correção",
    title:"Mais precisão ao editar cards, imagens e seções",
    summary:"Melhorias na identificação de elementos específicos e na preservação de outras partes do site.",
    details:["Comandos de edição de cards por linguagem natural.","Troca direcionada de imagens sem alterar fotografias não relacionadas.","Ajustes em seções, depoimentos e apresentação responsiva."],
    href:"/app/builder-v2",linkLabel:"Abrir Studio"
  },
  {
    id:"2026-11-10-aprimoramentos-na-edicao-visual",
    date:"2026-11-10",category:"Melhoria",
    title:"Aprimoramentos na edição visual",
    summary:"Ajustes no tratamento de cores, depoimentos, imagens principais e inclusão de seções.",
    details:["Reconhecimento de cores em formato hexadecimal.","Melhorias na edição visual de depoimentos e imagem de destaque.","Correções na criação de seções com cards."],
    href:"/app/builder-v2",linkLabel:"Abrir Studio"
  },
  {
    id:"2026-11-08-geracao-pelo-crm-e-revisao-visual",
    date:"2026-11-08",category:"Melhoria",
    title:"Geração pelo CRM e revisão visual",
    summary:"O fluxo de geração recebeu melhorias na verificação de sites dos leads, no uso de fotografias e na revisão de páginas.",
    details:["Verificação mais cuidadosa dos sites associados aos leads.","Aprimoramento da importação de fotografias para projetos.","Novas verificações visuais antes da publicação."],
    href:"/app/builder-v2",linkLabel:"Abrir Studio"
  },
  {
    id:"2026-11-06-experiencias-mais-completas-e-responsivas",
    date:"2026-11-06",category:"Melhoria",
    title:"Experiências mais completas e responsivas",
    summary:"Evolução dos modelos com animações de entrada, melhorias para celular e ajustes na seção de localização.",
    details:["Animações ao rolar a página em modelos compatíveis.","Aprimoramentos de layouts para dispositivos móveis.","Correções de mapa, endereço e contato por WhatsApp."],
    href:"/app/builder-v2",linkLabel:"Abrir Studio"
  },
  {
    id:"2026-11-04-briefings-mais-bem-interpretados",
    date:"2026-11-04",category:"Melhoria",
    title:"Briefings mais bem interpretados",
    summary:"A geração passou por ajustes para reconhecer melhor segmentos de negócio e selecionar experiências adequadas.",
    details:["Reconhecimento de briefings para educação, automotivo e hotelaria.","Aprimoramento de rotas para moda e mercado imobiliário.","Correções de imagens inadequadas em modelos de saúde."],
    href:"/app/builder-v2",linkLabel:"Abrir Studio"
  },
  {
    id:"2026-11-02-evolucao-dos-modelos-de-hotelaria",
    date:"2026-11-02",category:"Novidade",
    title:"Evolução dos modelos de hotelaria",
    summary:"Novas composições para experiências de hospedagem, com galeria, depoimentos e informações de contato.",
    details:["Galerias e depoimentos integrados ao modelo.","FAQ e formulário de contato ajustados.","Melhorias de visualização em desktop e celular."],
    href:"/app/builder-v2",linkLabel:"Abrir Studio"
  },
  {
    id:"2026-10-31-mais-identidade-visual-para-marcas-de-tecnologia",
    date:"2026-10-31",category:"Melhoria",
    title:"Mais identidade visual para marcas de tecnologia",
    summary:"Aprimoramentos de composições, portfólios, perguntas frequentes e contato em experiências de marketing e IA.",
    details:["Novos tratamentos visuais para portfólio e diferenciais.","Melhorias de FAQ e contato.","Ajustes de navegação e responsividade."],
    href:"/app/builder-v2",linkLabel:"Abrir Studio"
  },
  {
    id:"2026-10-29-studio-com-navegacao-e-previas-aprimoradas",
    date:"2026-10-29",category:"Melhoria",
    title:"Studio com navegação e prévias aprimoradas",
    summary:"A interface de criação ganhou mais espaço para edição e opções de visualização responsiva.",
    details:["Prévia em formato tablet além de desktop e celular.","Navegação lateral mais compacta.","Ajustes na seleção de experiências visuais."],
    href:"/app/builder-v2",linkLabel:"Abrir Studio"
  },
  {
    id:"2026-10-27-inicio-da-evolucao-da-arquitetura-visual",
    date:"2026-10-27",category:"Novidade",
    title:"Início da evolução da arquitetura visual",
    summary:"A PageNova começou uma nova etapa de diferenciação dos modelos e organização das experiências de criação.",
    details:["Estruturas visuais mais distintas entre modelos.","Expansão das opções editoriais e 3D para diferentes segmentos.","Correções para evitar conteúdos de um nicho em outro."],
    href:"/app/builder-v2",linkLabel:"Abrir Studio"
  },
  {
    id:"2026-10-26-builder",
    date:"2026-10-26",category:"Novidade",featuredOnHome:false,
    title:"Builder 2.0 no PageNova Studio",
    summary:"A criação e edição de sites institucionais agora acontecem em uma conversa com IA, com prévia responsiva e quatro templates.",
    details:[
      "Crie um site descrevendo seu negócio e personalize textos, imagens e seções pelo chat.",
      "Alternância entre prévias de desktop e mobile.",
      "Quatro modelos institucionais compartilhados entre Studio e CRM."
    ],
    href:"/app/builder-v2",linkLabel:"Abrir Studio"
  },
  {
    id:"2026-10-26-crm",
    date:"2026-10-26",category:"Melhoria",featuredOnHome:false,
    title:"Geração de sites diretamente pelos leads do CRM",
    summary:"O CRM aproveita os dados do lead para iniciar a criação e abre o resultado para edição no Builder 2.0.",
    details:[
      "O lead fornece contexto, nome, segmento e informações de contato.",
      "A criação começa no modelo institucional padrão; o layout pode ser alterado depois.",
      "A prévia e o editor compartilham os quatro modelos institucionais."
    ],
    href:"/app/crm?view=sites-ia",linkLabel:"Gerar a partir de um lead"
  },
  {
    id:"2026-10-26-images",
    date:"2026-10-26",category:"Correção",
    title:"Imagens dos cards sem repetições desnecessárias",
    summary:"Cards de processos podem usar a biblioteca de imagens do nicho já disponível no Studio, sem precisar gerar novas fotos pela API.",
    details:[
      "Distribuição de fotografias distintas nos cards quando há imagens adequadas disponíveis.",
      "Fotos que o usuário vincular a um card continuam tendo prioridade.",
      "A capa original dos projetos do CRM permanece preservada."
    ],
    href:"/app/builder-v2",linkLabel:"Conhecer o editor"
  },
  {
    id:"2026-10-26-mobile",
    date:"2026-10-26",category:"Melhoria",
    title:"Experiência de criação mais simples no celular",
    summary:"Campo do chat adaptável, histórico discreto e acesso à prévia após a criação.",
    details:[
      "Campo de texto que se ajusta ao conteúdo.",
      "Anexos e ditado de voz diretamente na área de conversa, quando compatível com o dispositivo.",
      "Acesso ao histórico sem um painel grande ocupando a primeira tela."
    ],
    href:"/app/builder-v2",linkLabel:"Experimentar"
  }
];

export function updateDatePtBr(date:string){
  const [year,month,day]=date.split("-").map(Number);
  return new Intl.DateTimeFormat("pt-BR",{day:"2-digit",month:"long",year:"numeric",timeZone:"UTC"})
    .format(new Date(Date.UTC(year,month-1,day)));
}

/** New releases can be appended or prepended: archive order is always by date. */
export function getSortedPageNovaUpdates():PageNovaUpdate[]{
  return [...pagenovaUpdates].sort((a,b)=>b.date.localeCompare(a.date));
}

/** Keep the welcome page short; publish every correction in the full archive. */
export function getHomePageNovaUpdates(limit=2):PageNovaUpdate[]{
  return getSortedPageNovaUpdates()
    .filter(update=>update.featuredOnHome===true)
    .slice(0,Math.max(0,limit));
}
