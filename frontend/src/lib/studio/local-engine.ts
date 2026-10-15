/**
 * PageNova Studio: zero-billable-AI mode.
 * Do not replace this with silent OpenAI fallbacks. Any paid provider must be
 * implemented as a separate opt-in operation with its own credit policy.
 */
import {normalizeForm,type FormInput,type FormQuestion,type FormKind} from "@/lib/forms/schema";
import {normalizeQuiz,type QuizInput,type QuizQuestion,type QuizOutcome} from "@/lib/quizzes/schema";
import {normalizeEbook,type EbookProject,type EbookPageKind,type EbookTheme} from "@/lib/ebooks/schema";
import {planEbookPages} from "@/lib/ebooks/blueprint";

export const STUDIO_PAID_AI_ENABLED = Object.freeze({
  forms:false, quizzes:false, ebooks:false, apps:false, systems:false,
});
export const LOCAL_ENGINE_MODE="templates-and-rules-v1";
const clean=(text:string,max=180)=>text.replace(/\s+/g," ").trim().slice(0,max);
const capitalize=(text:string)=>text?text.charAt(0).toUpperCase()+text.slice(1):text;
function topic(prompt:string,max=72):string{
  const first=prompt.split(/\r?\n|[.!?](?:\s|$)/)[0]||prompt;
  const result=first.replace(/^(quero|preciso|crie|criar|faça|fazer|monte|desenvolva|desenvolver|gere|gerar|um|uma|o|a|formulário|formulario|quiz|ebook|e-book|app|aplicativo|sistema)\s+/gi,"")
    .replace(/^(?:um|uma|o|a|para|sobre|de|do|da|com|meu|minha)\s+/gi,"")
    .replace(/\b(?:com perguntas|interativo|profissional|bem bonito|bonito|completo)\b/gi,"").trim();
  return capitalize(clean(result,max)||"seu projeto");
}
const field=(id:string,label:string,type:FormQuestion["type"]="text",required=true,options:string[]=[]):FormQuestion=>({id,label,type,required,options});
function inferKind(prompt:string):FormKind{
 if(/pesquisa|satisfa[cç][aã]o|avalia[cç][aã]o|feedback|nps/i.test(prompt))return "survey";
 if(/inscri[cç][aã]o|candidatura|vaga|mentoria|aplica[cç][aã]o/i.test(prompt))return "application";
 if(/\bquiz\b|teste de personalidade|question[aá]rio de perfil/i.test(prompt))return "quiz";
 return "leads";
}
function formFields(kind:FormKind,subject:string):FormQuestion[]{
 switch(kind){
  case "survey":return [
   field("q-1","Como você avalia sua experiência com "+subject+"?","select",true,["Excelente","Boa","Regular","Ruim"]),
   field("q-2","O que funcionou melhor na sua experiência?","textarea"),
   field("q-3","O que poderíamos melhorar?","textarea",false),
   field("q-4","Você recomendaria essa experiência?","select",true,["Sim","Talvez","Não"]),
   field("q-5","Deseja acrescentar algo?","textarea",false),
  ];
  case "application":return [
   field("q-1","Qual é seu nome completo?"),field("q-2","Qual seu melhor e-mail?","email"),
   field("q-3","Qual é o seu WhatsApp?","tel"),
   field("q-4","Por que você quer participar de "+subject+"?","textarea"),
   field("q-5","Qual é sua experiência anterior nesse assunto?","textarea",false),
   field("q-6","Quando você gostaria de começar?","select",true,["Imediatamente","Nos próximos 30 dias","Ainda estou avaliando"]),
  ];
  case "quiz":return [
   field("q-1","Qual é o seu principal objetivo em relação a "+subject+"?","textarea"),
   field("q-2","Com qual destas opções você mais se identifica?","select",true,["Estou começando","Tenho alguma experiência","Já tenho experiência"]),
   field("q-3","Qual é sua maior dificuldade nesse assunto?","textarea"),
   field("q-4","Quanto tempo você dedica a isso?","select",true,["Pouco tempo","Algumas horas por semana","Diariamente"]),
  ];
  default:return [
   field("q-1","Qual é seu nome?"),field("q-2","Qual é seu e-mail?","email"),
   field("q-3","Qual é seu telefone ou WhatsApp?","tel"),
   field("q-4","Em que podemos ajudar você com "+subject+"?","textarea"),
   field("q-5","Quando você pretende começar?","select",true,["Agora","Nos próximos 30 dias","Estou pesquisando"]),
   field("q-6","Deseja enviar alguma informação adicional?","textarea",false),
  ];
 }
}
export function localForm(prompt:string,existing?:FormInput|null):FormInput{
 const subject=topic(prompt,64);
 if(existing){
  const updateTitle=/\b(?:trocar|mudar|alterar|atualizar)\s+(?:o\s+)?t[ií]tulo\s+(?:para|por|:)\s*([^.!?\n]+)/i.exec(prompt);
  const explicit=/\b(?:adicion[ae]|inclu[ai]|acrescent[ae])\s+(?:uma?\s+)?(?:pergunta|campo)\s*(?::|sobre|de|para)?\s*([^.!?\n]+)/i.exec(prompt);
  const fields=[...existing.fields];
  if(explicit&&fields.length<20&&explicit[1]?.trim()){
    const label=capitalize(clean(explicit[1],170)).replace(/[.?]+$/,"")+"?";
    if(!fields.some(q=>q.label.toLowerCase()===label.toLowerCase()))
      fields.push(field("q-"+crypto.randomUUID().slice(0,8),label,/\b(comente|explique|descreva|motivo)\b/i.test(label)?"textarea":"text"));
  }
  return normalizeForm({...existing,title:updateTitle?capitalize(clean(updateTitle[1],100)):existing.title,fields});
 }
 const kind=inferKind(prompt);
 return normalizeForm({title:(kind==="survey"?"Pesquisa: ":kind==="application"?"Inscrição: ":kind==="quiz"?"Questionário: ":"Contato: ")+subject,
  description:"Responda às perguntas a seguir sobre "+subject+". Suas respostas serão encaminhadas ao responsável por este formulário.",
  kind,fields:formFields(kind,subject),intent:prompt,whatsapp:"",visualTheme:kind==="survey"?"rose":"emerald",motion:true});
}
const outcome=(id:string,title:string,description:string):QuizOutcome=>({id,title,description,ctaLabel:"Conhecer próximos passos",ctaUrl:""});
export function localQuiz(prompt:string,existing?:QuizInput|null):QuizInput{
 const subject=topic(prompt,75);
 if(existing){
   const add=/\b(?:adicion[ae]|inclu[ai]|acrescent[ae])\s+(?:uma?\s+)?pergunta\s*(?:sobre|:)?\s*([^.!?\n]+)/i.exec(prompt);
   const questions=[...existing.questions];
   if(add&&questions.length<15){
     const id="q"+(questions.length+1);
     const title=capitalize(clean(add[1]||"um aspecto do tema",160))+"?";
     questions.push({id,title,options:optionSet(id,existing.outcomes)});
   }
   return normalizeQuiz({...existing,questions,prompt:existing.prompt});
 }
 const outcomes=[
   outcome("perfil-a","Explorador ✨","Você está conhecendo possibilidades em "+subject+". Comece por um objetivo simples, experimente e registre o que funciona."),
   outcome("perfil-b","Em evolução 🚀","Você já tem uma direção em "+subject+". Escolha uma melhoria por vez e acompanhe seus avanços."),
   outcome("perfil-c","Focado em resultados 🎯","Você demonstra preferência por planejamento em "+subject+". Priorize critérios claros e revise seus próximos passos."),
 ];
 const prompts=[
  "Qual é o seu principal objetivo com "+subject+"?",
  "Como você costuma decidir quando surge uma oportunidade em "+subject+"?",
  "Qual é o seu nível de experiência com "+subject+"?",
  "O que você considera mais importante ao começar?",
  "Quando encontra uma dificuldade, como prefere agir?",
  "Qual resultado você deseja priorizar nos próximos dias?"
 ];
 const count=Math.max(3,Math.min(15,Number(/\b(\d{1,2})\s+perguntas?\b/i.exec(prompt)?.[1]||"6")));
 const questions:QuizQuestion[]=Array.from({length:count},(_,i)=>{
  const id="q"+(i+1),question=prompts[i%prompts.length];
  return {id,title:question,options:optionSet(id,outcomes)};
 });
 return normalizeQuiz({title:"Descubra seu perfil em "+subject,subtitle:"Uma experiência interativa para refletir sobre suas preferências e escolher os próximos passos.",prompt,
  theme:/premium|luxo|escuro|dark/i.test(prompt)?"midnight":"emerald",
  collectLeads:/captar|captura|leads|coletar\s+(?:nome|e-?mail)|contatos/i.test(prompt),outcomes,questions,motion:true});
}
function optionSet(id:string,outcomes:QuizOutcome[]){
 const labels=["✨ Prefiro explorar as possibilidades","🚀 Gosto de aprender enquanto faço","🎯 Quero planejar e medir os resultados"];
 const index=Number(id.match(/\d+/)?.[0]||"1")-1;
 return labels.map((label,i)=>({id:"o"+(i+1),label,outcomeId:outcomes[(i+index)%outcomes.length].id}));
}
function ebookSections(prompt:string){
 const sentences=prompt.split(/[\n.;]+/).map(x=>clean(x,210)).filter(x=>x.length>12);
 return sentences.slice(0,7);
}
export function localEbook(input:{prompt:string;pageCount:number;author:string;theme:EbookTheme;tone:string;imageMode:"web"|"none"}):EbookProject{
 const subject=topic(input.prompt,88);
 const notes=ebookSections(input.prompt);
 const plan=planEbookPages(input.prompt,input.pageCount,input.imageMode);
 const topics=["Por que este assunto importa","Fundamentos essenciais","Como começar na prática","Planejamento de atividades",
   "Critérios para tomar decisões","Exemplos e aplicações","Cuidados e erros comuns","Ferramentas e recursos",
   "Etapas para colocar em prática","Avaliação dos resultados","Próximas ações","Conclusões"];
 const pages=plan.map((bp,i)=>{
  const title=i===0?subject:i===plan.length-1?"Continue sua jornada":topics[(i-1)%topics.length]+" — "+subject;
  const focus=notes.length?notes[(Math.max(0,i-1))%notes.length]:subject;
  const action=["Defina seu objetivo em uma frase.","Liste o que já conhece e o que precisa conferir.",
   "Escolha um primeiro passo que possa ser realizado.","Registre os resultados sem assumir dados não verificados.",
   "Revise o plano e ajuste o que não funcionou."];
  const body=i===0?
   "Um guia de trabalho sobre "+subject+". Organize suas ideias, reúna exemplos próprios e personalize as orientações antes de publicar.":
   i===plan.length-1?
   "Reúna o que aprendeu sobre "+subject+" e transforme em próximos passos concretos.\n\nVerifique os fatos e acrescente suas próprias experiências e referências para finalizar esta obra.":
   "Ponto de partida: "+focus+".\n\nComece identificando como esse aspecto aparece na sua realidade. Descreva um exemplo concreto, separe o que já foi confirmado do que ainda precisa ser pesquisado e escolha uma ação que possa avaliar.\n\nAntes de publicar, complete este capítulo com dados, exercícios e referências originais adequados ao seu público.";
  return {id:"page-"+(i+1),kind:bp.kind as EbookPageKind,
    eyebrow:i===0?"GUIA PRÁTICO":i===plan.length-1?"CONCLUSÃO":"CAPÍTULO "+String(i).padStart(2,"0"),
    title:clean(title,140),lead:i===0?"Um roteiro editorial personalizável para "+subject+".":i===plan.length-1?"Transforme suas ideias em um plano real.":"Explore "+focus+" com objetivos, exemplos e ações verificáveis.",
    body,bullets:i===0?[]:i===plan.length-1?["Revise as informações e fontes.","Personalize os exemplos.","Defina um próximo passo claro."]:action.slice(0,bp.kind==="comparison"?4:5),
    imagePrompt:subject+" "+clean(focus,100),imageUrl:"",imageCredit:""};
 });
 return normalizeEbook({id:crypto.randomUUID(),title:subject,subtitle:"Guia prático e personalizável",author:input.author||"Seu nome ou marca",audience:"Leitores interessados em "+subject,
  prompt:input.prompt,theme:input.theme,imageMode:input.imageMode,pages,updatedAt:new Date().toISOString()});
}
