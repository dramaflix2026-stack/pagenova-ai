/**
 * Public-facing product change log.
 * Keep entries factual, dated by the shipped release and linked to a real
 * PageNova route. Edit here to publish future platform patch notes.
 */
export type PageNovaUpdate={
  id:string;date:string;category:"Novidade"|"Melhoria"|"Correção";
  title:string;summary:string;details:readonly string[];href:string;linkLabel:string;
};

export const pagenovaUpdates:readonly PageNovaUpdate[]=[
  {
    id:"2026-10-26-builder",
    date:"2026-10-26",category:"Novidade",
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
    date:"2026-10-26",category:"Melhoria",
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
