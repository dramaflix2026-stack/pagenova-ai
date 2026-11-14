import {normalizeQuiz,type QuizInput,type QuizQuestion,type QuizOutcome} from "@/lib/quizzes/schema";
import {localQuiz} from "@/lib/studio/local-engine";

/** Quiz-only generation: never turn presentation instructions into user-facing copy. */
const tidy=(value:string)=>value.replace(/\*\*|__|[“”"]/g,"").replace(/\s+/g," ").replace(/\s+([?!,.])/g,"$1").trim();
const normalized=(value:string)=>tidy(value).normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
const option=(id:string,label:string,outcomeId:string)=>({id,label,outcomeId});
export function generatePremiumQuiz(prompt:string,existing?:QuizInput|null):QuizInput{
  if(existing)return localQuiz(prompt,existing);
  const plain=normalized(prompt);
  const entrepreneur=/empreendedor|empreender|empreendedorismo|negocio proprio|perfil de negocio/.test(plain);
  const explicit=/\b(?:chamad[oa]|t[ií]tulo(?:\s+do\s+quiz)?\s*(?:é|:|ser[aá])?)\s*["“]?([^\n.!?]{8,110}\??)/i.exec(prompt);
  const quoted=/["“]([^"”\n]{8,110})["”]/.exec(prompt);
  let title=tidy((quoted?.[1]||explicit?.[1]||"").replace(/\s*(?:,?\s*(?:moderno|responsivo|premium|interativo))\s*$/gi,""));
  if(entrepreneur)title="Qual é o seu perfil empreendedor?";
  if(!title||/\b(?:quiz|moderno|responsivo|chamado|crie|faca|monte)\b/i.test(title)&&title.length>65)
    title="Descubra seu perfil";
  const count=Math.max(3,Math.min(15,Number(/\b(\d{1,2})\s+perguntas?\b/i.exec(prompt)?.[1]||"7")));
  if(!entrepreneur){
    const baseline=localQuiz(prompt);
    return normalizeQuiz({...baseline,title,subtitle:"Responda a algumas perguntas e descubra o resultado que mais combina com você.",
      questions:baseline.questions.slice(0,count).map(q=>({...q,title:tidy(q.title).replace(/\s+\?/g,"?")})),
      layout:"conversational",theme:/claro|bege|creme|minimalista/i.test(plain)?"cream":"midnight",
      prompt});
  }
  const outcomes:QuizOutcome[]=[
    {id:"visionario",title:"Visionário criativo",description:"Você enxerga oportunidades e gosta de transformar ideias em possibilidades. Seu próximo passo é validar uma proposta com clientes reais.",ctaLabel:"Conhecer próximos passos",ctaUrl:""},
    {id:"executor",title:"Executor estratégico",description:"Você aprende fazendo e transforma planos em ação. Foque em processos simples, testes rápidos e acompanhamento de resultados.",ctaLabel:"Conhecer próximos passos",ctaUrl:""},
    {id:"gestor",title:"Gestor analítico",description:"Você prefere decisões embasadas e crescimento sustentável. Use indicadores, planejamento e análise de riscos para orientar seus próximos movimentos.",ctaLabel:"Conhecer próximos passos",ctaUrl:""},
  ];
  const bank:Array<[string,string,string,string]>=[
    ["O que mais motiva você a empreender?","Criar algo que ainda não existe","Construir um negócio na prática","Ter autonomia e estabilidade financeira"],
    ["Como você reage quando surge uma boa ideia?","Imagino novas possibilidades","Faço um teste o quanto antes","Avalio custos, riscos e retorno"],
    ["Qual atividade mais combina com você?","Criar produtos e experiências","Organizar e executar projetos","Analisar números e otimizar processos"],
    ["Diante de um desafio inesperado, você prefere...","Buscar soluções diferentes","Agir e ajustar durante o caminho","Investigar as causas antes de decidir"],
    ["O que define um negócio bem-sucedido para você?","Uma proposta original e relevante","Clientes satisfeitos e entregas consistentes","Crescimento previsível e sustentável"],
    ["Como você prefere trabalhar em equipe?","Inspirando pessoas com novas ideias","Coordenando a execução das tarefas","Definindo metas e acompanhando indicadores"],
    ["Qual seria seu primeiro passo ao abrir uma empresa?","Desenhar uma proposta inovadora","Conversar com clientes e testar uma oferta","Montar um planejamento financeiro"],
    ["O que você mais valoriza ao tomar decisões?","Potencial de transformação","Velocidade para aprender e executar","Dados confiáveis e controle de riscos"],
    ["Como você imagina seu negócio daqui a cinco anos?","Reconhecido por inovar","Com operações fortes e clientes fiéis","Lucrativo, organizado e escalável"],
    ["Qual habilidade você gostaria de desenvolver?","Criatividade e visão de mercado","Vendas e liderança operacional","Finanças e gestão estratégica"],
    ["Quando um plano não funciona, você...","Repensa o conceito","Experimenta outra abordagem","Revisa os indicadores"],
    ["O que mais desperta seu interesse?","Identificar tendências","Construir soluções concretas","Estruturar um modelo sustentável"],
    ["Qual tipo de meta mais motiva você?","Lançar uma ideia original","Conquistar os primeiros clientes","Alcançar margem e crescimento"],
    ["Como você prefere aprender?","Explorando referências","Praticando com projetos reais","Estudando casos e resultados"],
    ["Que papel você assumiria em uma startup?","Produto e inovação","Operações e crescimento","Estratégia e finanças"],
  ];
  const questions:QuizQuestion[]=bank.slice(0,count).map(([question,...labels],i)=>({
    id:"q"+(i+1),title:question,options:labels.map((label,j)=>option("o"+(j+1),label,outcomes[j].id))
  }));
  return normalizeQuiz({title,subtitle:"Descubra seus pontos fortes, seu estilo de decisão e o caminho para evoluir como empreendedor.",
    prompt,theme:/claro|bege|creme/i.test(plain)?"cream":"midnight",
    layout:"conversational",motion:true,collectLeads:/captar|captura|leads|coletar\s+(?:nome|e-?mail)|contatos/i.test(plain),
    questions,outcomes});
}
