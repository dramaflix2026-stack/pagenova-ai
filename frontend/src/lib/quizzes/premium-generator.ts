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
    const skincare=/skincare|pele|cosmetico|cosmeticos|beleza|cuidados faciais/.test(plain);
    const realestate=/imovel|imoveis|apartamento|casa propria|moradia/.test(plain);
    const marketing=/marketing|leads|publicidade|trafego|divulgacao/.test(plain);
    const fashion=/estilo pessoal|moda|roupas|vestuario|look/.test(plain);
    const category=skincare?"skincare":realestate?"imoveis":marketing?"marketing":fashion?"estilo":"geral";
    const profiles:Record<string,[string,string,string,string,string,string]>={
      skincare:["Rotina essencial","Você valoriza praticidade e uma rotina de cuidados simples.","Cuidado equilibrado","Você busca uma rotina consistente e adaptável.","Ritual completo","Você gosta de explorar produtos e técnicas com atenção aos detalhes."],
      imoveis:["Prático urbano","Você prioriza mobilidade e conveniência no dia a dia.","Conforto familiar","Você valoriza espaço, acolhimento e uma rotina confortável.","Investidor estratégico","Você considera valorização, planejamento e retorno no longo prazo."],
      marketing:["Explorador digital","Você está descobrindo oportunidades de divulgação.","Criador de conexões","Você prioriza relacionamento e conteúdo relevante.","Estrategista de crescimento","Você prefere campanhas orientadas por dados e resultados."],
      estilo:["Minimalista moderno","Você prefere peças versáteis e combinações simples.","Criativo autêntico","Você gosta de experimentar e expressar personalidade.","Clássico sofisticado","Você valoriza elegância e escolhas atemporais."],
      geral:["Explorador","Você gosta de descobrir possibilidades.","Realizador","Você prefere colocar ideias em prática.","Estrategista","Você valoriza planejamento e decisões estruturadas."],
    };
    const titles:Record<string,string>={
      skincare:"Qual rotina de skincare combina com você?",
      imoveis:"Qual é o imóvel ideal para seu estilo de vida?",
      marketing:"Qual é o seu perfil de marketing?",
      estilo:"Qual é o seu estilo pessoal?",
      geral:"Descubra o perfil que mais combina com você",
    };
    const questionsByCategory:Record<string,Array<[string,string,string,string]>>={
      skincare:[
        ["O que você mais valoriza nos cuidados com a pele?","Uma rotina rápida","Equilíbrio e consistência","Uma experiência completa"],
        ["Quanto tempo você dedica aos cuidados diários?","Poucos minutos","De 10 a 20 minutos","Gosto de reservar mais tempo"],
        ["Como você escolhe novos produtos?","Prefiro o essencial","Comparo benefícios e necessidades","Pesquiso ingredientes e novidades"],
        ["Qual resultado você busca na sua rotina?","Praticidade","Bem-estar e regularidade","Uma rotina personalizada"],
        ["Como você reage a uma nova tendência?","Mantenho o que funciona","Avalio antes de experimentar","Gosto de testar novidades"],
        ["Qual frase descreve melhor você?","Menos é mais","Constância faz diferença","Cada detalhe importa"],
        ["O que tornaria sua rotina ideal?","Poucas etapas","Produtos adequados à minha necessidade","Uma experiência de autocuidado"],
      ],
      imoveis:[
        ["O que pesa mais na escolha de um imóvel?","Localização e mobilidade","Espaço e conforto","Potencial de valorização"],
        ["Qual ambiente você mais valoriza?","Espaço funcional","Sala ampla para reunir pessoas","Escritório e ambientes flexíveis"],
        ["Como imagina seu bairro ideal?","Perto de tudo","Tranquilo e acolhedor","Em uma região em desenvolvimento"],
        ["Qual é sua prioridade no momento?","Facilitar a rotina","Melhorar a qualidade de vida","Planejar meu patrimônio"],
        ["O que você observa primeiro em uma visita?","Distribuição dos ambientes","Conforto e iluminação","Conservação e potencial futuro"],
        ["Qual tipo de espaço combina com você?","Compacto e eficiente","Amplo e confortável","Versátil e adaptável"],
        ["Como você decide uma compra importante?","Pela praticidade","Pelo encaixe na minha vida","Comparando custos e perspectivas"],
      ],
      marketing:[
        ["Qual é seu principal objetivo com marketing?","Entender os canais disponíveis","Construir uma audiência engajada","Aumentar conversões mensuráveis"],
        ["Que tipo de ação mais interessa?","Experimentar formatos","Criar conteúdo relevante","Otimizar campanhas"],
        ["Como você mede uma boa campanha?","Pelo aprendizado","Pelas interações","Pelos resultados e retorno"],
        ["Qual desafio mais aparece na sua rotina?","Escolher por onde começar","Manter consistência","Escalar o que já funciona"],
        ["Qual recurso você priorizaria?","Um guia inicial","Um calendário de conteúdo","Um painel de métricas"],
        ["Como prefere testar uma ideia?","Explorando alternativas","Conversando com o público","Comparando indicadores"],
        ["O que faria mais diferença agora?","Clareza de posicionamento","Relacionamento com clientes","Previsibilidade de aquisição"],
      ],
      estilo:[
        ["Como você escolhe uma roupa para sair?","Prefiro combinações simples","Gosto de peças marcantes","Busco um visual elegante"],
        ["Qual peça não pode faltar?","Uma camiseta versátil","Um acessório diferente","Uma peça de corte clássico"],
        ["Como você lida com tendências?","Escolho só o que é prático","Gosto de experimentar","Prefiro o atemporal"],
        ["Qual detalhe importa mais?","Conforto","Originalidade","Acabamento"],
        ["Qual paleta combina com você?","Neutros fáceis de combinar","Cores e contrastes","Tons sóbrios e refinados"],
        ["Como define seu guarda-roupa ideal?","Enxuto e funcional","Expressivo e variado","Coerente e elegante"],
        ["Qual elogio gostaria de ouvir?","Seu visual é descomplicado","Seu estilo é único","Você está muito elegante"],
      ],
      geral:[
        ["Como você costuma começar algo novo?","Pesquiso possibilidades","Faço um primeiro teste","Planejo as etapas"],
        ["O que mais motiva suas decisões?","Descobrir novidades","Ver progresso concreto","Ter segurança nos resultados"],
        ["Diante de um desafio, você...","Busca novas ideias","Experimenta soluções","Analisa as opções"],
        ["Qual ambiente combina mais com você?","Dinâmico e criativo","Prático e colaborativo","Organizado e previsível"],
        ["O que você valoriza em um projeto?","Originalidade","Execução","Consistência"],
        ["Como prefere aprender?","Explorando referências","Praticando","Estudando métodos"],
        ["Qual é seu próximo objetivo?","Descobrir oportunidades","Colocar planos em ação","Aprimorar resultados"],
      ],
    };
    const labels=profiles[category];
    const outcomes:QuizOutcome[]=[0,1,2].map(i=>({
      id:"perfil-"+(i+1),title:labels[i*2],description:labels[i*2+1],
      ctaLabel:"Conhecer próximos passos",ctaUrl:"",
    }));
    const bank=questionsByCategory[category];
    const questions:QuizQuestion[]=Array.from({length:count},(_,i)=>{
      const [question,...answers]=bank[i%bank.length];
      return {id:"q"+(i+1),title:question,options:answers.map((answer,j)=>option("o"+(j+1),answer,outcomes[j].id))};
    });
    return normalizeQuiz({title:category==="geral"&&title!=="Descubra seu perfil"?title:titles[category],
      subtitle:"Responda às perguntas e descubra uma recomendação alinhada às suas preferências.",
      prompt,questions,outcomes,layout:"conversational",motion:true,
      theme:/claro|bege|creme|minimalista/i.test(plain)?"cream":"midnight",
      collectLeads:/captar|captura|leads|coletar\s+(?:nome|e-?mail)|contatos/i.test(plain)});
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
