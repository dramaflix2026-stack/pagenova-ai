/**
 * PageNova eBook editorial planner (local / deterministic).
 *
 * Specialized *editorial structure*, not fictitious independent knowledge.
 * It turns a specific briefing into separate deliverable pages and makes
 * the author-review requirement explicit. No outside paid API calls.
 */
import {normalizeEbook,type EbookProject,type EbookTheme,type EbookImageMode,type EbookPage} from "./schema";
import {planEbookPages} from "./blueprint";
type Topic="manual"|"workbook"|"business"|"education"|"wellness"|"guide";
type Section={heading:string;focus:string;body:(subject:string,brief:string)=>string;bullets:string[]};
const section=(heading:string,focus:string,body:(subject:string,brief:string)=>string,bullets:string[]):Section=>({heading,focus,body,bullets});
const normalized=(s:string)=>s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
function classify(text:string):Topic{
 const t=normalized(text);
 if(/\b(passo a passo|manual|tutorial|como fazer|procedimento|instrucoes)\b/.test(t))return "manual";
 if(/\b(exercicios|apostila|atividades|caderno de atividades|workbook|pratica guiada)\b/.test(t))return "workbook";
 if(/\b(marketing|vendas|negocio|empreender|clientes|prospeccao|gestao|empresa)\b/.test(t))return "business";
 if(/\b(aula|curso|estudo|ensino|aluno|educacao|formacao)\b/.test(t))return "education";
 if(/\b(saude|nutricao|bem-estar|atividade fisica|pele|cuidado pessoal)\b/.test(t))return "wellness";
 return "guide";
}
const common:Section[]=[
 section("Objetivo e escopo","o que o leitor irá fazer",(s,b)=>"Este material organiza o tema "+s+" a partir do objetivo descrito no briefing: "+b+".\n\nAntes de usar as orientações, defina o resultado esperado e o que está fora do escopo. Essa delimitação evita etapas sem relação com o tema e facilita a revisão do conteúdo pelo responsável.",["Definir um resultado observável","Identificar para quem o material é indicado","Listar o que deve ser verificado"]),
 section("Contexto e ponto de partida","identificação da situação inicial",(s)=>"Antes de executar qualquer ação sobre "+s+", registre a situação de partida. Anote recursos já disponíveis, limitações de tempo e informações que faltam.\n\nUma boa referência inicial torna possível perceber se os próximos passos ajudaram ou se precisam ser ajustados.",["O que já está pronto?","O que precisa ser levantado?","Qual o primeiro impedimento?"]),
 section("Critérios de escolha","como comparar alternativas",(s)=>"Compare as alternativas que fazem sentido para "+s+" usando critérios explícitos: aplicabilidade, recursos necessários, riscos e facilidade de implementação.\n\nNão conclua que uma opção é melhor apenas porque parece mais rápida. Registre a justificativa e valide os fatos antes de recomendar algo ao leitor.",["Aplicabilidade","Recursos e esforço","Limitações e riscos","Critério de sucesso"]),
 section("Plano de execução","sequência de tarefas",(s)=>"Transforme "+s+" em um plano de ações pequenas e verificáveis.\n\nComece por uma preparação simples, defina o que deve ser concluído antes da próxima etapa e estabeleça uma forma de registrar cada tentativa. O objetivo é evitar etapas vagas que não possam ser executadas.",["Preparar materiais e informações","Executar uma etapa por vez","Registrar o que foi feito","Revisar antes de avançar"]),
 section("Exemplo de aplicação","simulação supervisionada",(s)=>"Exemplo de exercício para "+s+": descreva uma situação real do seu público, escolha um objetivo, defina duas alternativas e anote os critérios de comparação.\n\nPreencha o exercício com informações verificadas ou com um caso autorizado. Não invente depoimentos, resultados ou números de clientes.",["Situação inicial: ______","Objetivo: ______","Decisão: ______","Resultado observado: ______"]),
 section("Cuidados e erros comuns","revisão de riscos",(s)=>"Em qualquer atividade relacionada a "+s+", erros podem ocorrer ao pular a preparação, trabalhar com informações incompletas ou confundir uma hipótese com um fato.\n\nCrie um momento de revisão e mantenha atenção aos limites do método. Quando houver implicações legais, financeiras ou de saúde, procure avaliação especializada.",["Informações sem confirmação","Etapas executadas fora de ordem","Ausência de validação","Expectativas não fundamentadas"]),
 section("Indicadores de acompanhamento","acompanhamento sem dados inventados",(s)=>"Para acompanhar "+s+", escolha indicadores relevantes ao objetivo definido no começo. Registre os dados efetivamente observados, compare períodos equivalentes e evite atribuir causalidade sem evidências.\n\nA melhoria contínua depende de observação consistente e ajustes documentados.",["O que será medido?","Como os dados serão obtidos?","Quando revisar?","Qual mudança será testada?"]),
 section("Checklist operacional","conferência antes da entrega",(s)=>"Use este checklist antes de considerar a atividade sobre "+s+" concluída.\n\nConfira cada item de acordo com as condições do seu caso. Itens não aplicáveis devem ser identificados, em vez de marcados automaticamente.",["Objetivo definido","Dados conferidos","Etapas registradas","Resultado revisado","Próximos passos indicados"]),
 section("Perguntas para aprofundamento","reflexão orientada",(s)=>"Estas perguntas ajudam a transformar uma leitura sobre "+s+" em uma aplicação útil.\n\nResponda com exemplos concretos e, quando possível, inclua referências verificáveis. Não use respostas genéricas que possam servir para qualquer situação.",["Qual problema específico resolver?","Quais evidências sustentam a escolha?","O que pode ser testado em escala pequena?","Quem revisará os resultados?"]),
 section("Plano de melhoria","ajustes baseados em observação",(s)=>"Depois de experimentar uma abordagem sobre "+s+", revise o que aconteceu e destaque os pontos que não funcionaram como previsto.\n\nEscolha apenas uma melhoria por vez e documente a decisão. Isso facilita a comparação e evita mudanças simultâneas sem controle.",["Observação","Hipótese","Ajuste proposto","Prazo para revisão"]),
 section("Materiais e referências","fontes e ferramentas",(s)=>"Organize os materiais necessários ao trabalho com "+s+" e registre a origem das informações utilizadas.\n\nInclua somente fontes realmente consultadas; referências inventadas ou afirmações sem origem devem ser retiradas antes da publicação.",["Materiais que já possui","Ferramentas opcionais","Fontes conferidas","Autor responsável pela revisão"]),
 section("Próximos passos","aplicação contínua",(s)=>"O próximo passo sobre "+s+" é transformar o aprendizado em uma ação pequena, realista e documentada.\n\nEscolha um objetivo, determine um prazo e revise o resultado usando critérios claros. Atualize este material quando houver novas informações verificáveis.",["Escolher uma ação prioritária","Definir prazo e responsável","Registrar resultados","Atualizar o plano"])
];
const byTopic:Record<Topic,{label:string;order:number[];opening:string}>={
 manual:{label:"Manual prático",order:[0,1,3,2,4,5,7,6,8,9,10,11],opening:"A sequência privilegia preparação, execução, validação e solução de dúvidas."},
 workbook:{label:"Caderno de atividades",order:[0,1,8,4,3,7,2,6,5,9,10,11],opening:"As páginas têm perguntas e exercícios para o leitor preencher com dados reais."},
 business:{label:"Guia de execução de negócios",order:[0,1,2,3,4,6,5,7,9,8,10,11],opening:"O roteiro organiza hipóteses, execução e medição sem inventar resultados."},
 education:{label:"Apostila estruturada",order:[0,1,8,2,4,3,7,6,5,9,10,11],opening:"A apostila prioriza objetivos de aprendizagem, exemplos e revisão."},
 wellness:{label:"Guia informativo",order:[0,1,2,5,3,4,7,6,8,9,10,11],opening:"O conteúdo é educativo e não substitui orientação profissional ou fornece promessas de saúde."},
 guide:{label:"Guia de orientação",order:[0,1,2,4,3,5,6,7,8,9,10,11],opening:"O conteúdo organiza um caminho de análise e aplicação."}
};
function titleFromPrompt(prompt:string):string{
 const first=prompt.trim().split(/[\n.!?]/)[0]||"";
 return (first.replace(/^(?:(?:crie|quero|faca|faça|gere|escreva|monte|elabore|produza)\s+)+(?:um|uma|o|a)?\s*(?:e-?book|livro|guia|apostila|manual)\s*(?:sobre|de|para|com)?\s*/i,"")
   .replace(/^\s*(?:sobre|de|para|com)\s+/i,"").trim().slice(0,100)||"Seu tema").replace(/<|>/g,"");
}
export function editorialEbook(input:{prompt:string;pageCount:number;author:string;theme:EbookTheme;imageMode:"web"|"none"}):EbookProject{
 const subject=titleFromPrompt(input.prompt);
 const type=classify(input.prompt),profile=byTopic[type];
 const total=Math.max(4,Math.min(16,input.pageCount));
 const sanitizedBrief=input.prompt.replace(/\s+/g," ").trim().slice(0,420);
 const interior=total-2;
 const rows=profile.order.slice(0,interior).map(index=>common[index]);
 const layouts=planEbookPages(input.prompt,total,input.imageMode);
 const page=(i:number,kind:EbookPage["kind"],title:string,lead:string,body:string,bullets:string[],eyebrow:string):EbookPage=>({
  id:"page-"+String(i+1),kind,title,lead,body,bullets,eyebrow,imagePrompt:subject+" "+title,imageUrl:"",imageCredit:""
 });
 const pages:EbookPage[]=[page(0,"cover",subject,profile.label+" · roteiro para uso e personalização",
   profile.opening+" Revise os fatos, inclua exemplos e referências próprias antes de publicar.",[],profile.label.toUpperCase())];
 rows.forEach((s,index)=>{
   const kind: EbookPage["kind"]=index%4===1?"steps":index%4===2?"checklist":layouts[index+1]?.kind||"feature";
   pages.push(page(index+1,kind,s.heading+" — "+subject,s.focus,
     s.body(subject,sanitizedBrief),[...s.bullets],"CAPÍTULO "+String(index+1).padStart(2,"0")));
 });
 pages.push(page(total-1,"back","Fechamento e revisão editorial",
   "Os dados precisam ser conferidos antes da publicação.",
   "Você concluiu a estrutura editorial sobre "+subject+". Revise informações, acrescente exemplos autorizados, inclua referências realmente consultadas e confira se cada ação está adequada ao público.\n\nO modelo gratuito não produz conhecimento original nem pesquisa fontes automaticamente.",
   ["Revisar fatos","Adicionar fontes e exemplos próprios","Validar o conteúdo","Publicar após a revisão"],"CONCLUSÃO"));
 return normalizeEbook({
  id:crypto.randomUUID(),title:subject,subtitle:profile.label+" — edição para revisão",author:input.author||"Seu nome ou marca",
  audience:"Leitores interessados em "+subject,prompt:input.prompt,theme:input.theme,
  imageMode:input.imageMode,pages,updatedAt:new Date().toISOString()
 });
}
