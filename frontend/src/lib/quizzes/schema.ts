export type QuizTheme="emerald"|"midnight"|"cream";
export type QuizOption={id:string;label:string;outcomeId:string;imageUrl?:string};
export type QuizQuestion={id:string;title:string;options:QuizOption[];imageUrl?:string};
export type QuizOutcome={id:string;title:string;description:string;ctaLabel:string;ctaUrl:string;imageUrl?:string};
export type QuizInput={
  title:string;subtitle:string;prompt:string;theme:QuizTheme;coverImageUrl?:string;motion?:boolean;layout?:"classic"|"conversational";
  questions:QuizQuestion[];outcomes:QuizOutcome[];
  collectLeads:boolean;
};
export type QuizProject=QuizInput&{id:string;updatedAt:string;publishedAt:string|null};
export type PublicQuiz=Pick<QuizProject,"id"|"title"|"subtitle"|"theme"|"collectLeads"|"publishedAt"|"coverImageUrl"|"motion"|"layout">&{
  questions:Array<{id:string;title:string;imageUrl?:string;options:Array<{id:string;label:string;imageUrl?:string}>}>;
};
export type QuizEntry={id:string;quizId:string;submittedAt:string;outcomeId:string;
  answers:Array<{questionId:string;optionId:string}>;
  lead?:{name:string;email:string;consent:true};
};
export const validQuizId=(id:string)=>/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
const safe=(v:unknown,max:number)=>typeof v==="string"?v.trim().slice(0,max):"";
const safeMedia=(v:unknown)=>{if(typeof v!=="string")return "";try{const u=new URL(v);return u.protocol==="https:"&&!u.username&&!u.password&&v.length<=2000?u.toString():"";}catch{return "";}};
const optionId=(id:unknown,index:number)=>typeof id==="string"&&/^[\w-]{1,50}$/.test(id)?id:"opt-"+index;
export function normalizeQuiz(value:unknown):QuizInput{
  if(!value||typeof value!=="object"||Array.isArray(value))throw new Error("Quiz inválido.");
  const v=value as Record<string,unknown>;
  const title=safe(v.title,130),subtitle=safe(v.subtitle,350);
  if(title.length<4)throw new Error("Informe um título para o quiz.");
  const theme:QuizTheme=v.theme==="midnight"||v.theme==="cream"?v.theme:"emerald";
  if(!Array.isArray(v.outcomes)||v.outcomes.length<2||v.outcomes.length>5)
    throw new Error("Adicione de 2 a 5 resultados possíveis.");
  const outcomes:QuizOutcome[]=v.outcomes.map((o,i)=>{
    const item=o&&typeof o==="object"?o as Record<string,unknown>:{};
    const id=optionId(item.id,i),name=safe(item.title,110);
    if(name.length<3)throw new Error("Revise o título do resultado "+(i+1)+".");
    const rawUrl=safe(item.ctaUrl,500);
    let ctaUrl="";
    if(rawUrl){
      try {const url=new URL(rawUrl);
        if(url.protocol!=="https:"&&url.protocol!=="http:")throw new Error("URL inválida");
        if(url.username||url.password)throw new Error("URL inválida");
        ctaUrl=url.toString();
      }catch{throw new Error("O link do resultado "+(i+1)+" precisa ser HTTP ou HTTPS válido.");}
    }
    return {id,title:name,description:safe(item.description,1600),
      ctaLabel:safe(item.ctaLabel,65)||"Saiba mais",ctaUrl,...(safeMedia(item.imageUrl)?{imageUrl:safeMedia(item.imageUrl)}:{})};
  });
  if(new Set(outcomes.map(o=>o.id)).size!==outcomes.length)throw new Error("IDs de resultados repetidos.");
  if(!Array.isArray(v.questions)||v.questions.length<3||v.questions.length>15)
    throw new Error("O quiz precisa de 3 a 15 perguntas.");
  const outcomeIds=new Set(outcomes.map(o=>o.id));
  const questions:QuizQuestion[]=v.questions.map((q,i)=>{
    const item=q&&typeof q==="object"?q as Record<string,unknown>:{};
    const title=safe(item.title,260);
    if(title.length<5)throw new Error("Revise a pergunta "+(i+1)+".");
    const options=Array.isArray(item.options)?item.options:[];
    if(options.length<2||options.length>6)throw new Error("A pergunta "+(i+1)+" precisa de 2 a 6 respostas.");
    const parsed:QuizOption[]=options.map((o,index)=>{
      const a=o&&typeof o==="object"?o as Record<string,unknown>:{};
      const outcomeId=safe(a.outcomeId,50);
      if(!outcomeIds.has(outcomeId))throw new Error("Uma opção da pergunta "+(i+1)+" aponta para resultado inexistente.");
      const label=safe(a.label,160);
      if(!label)throw new Error("Uma opção da pergunta "+(i+1)+" está vazia.");
      return {id:optionId(a.id,index),label,outcomeId,...(safeMedia(a.imageUrl)?{imageUrl:safeMedia(a.imageUrl)}:{})};
    });
    if(new Set(parsed.map(o=>o.id)).size!==parsed.length ||
      new Set(parsed.map(o=>o.label.toLocaleLowerCase("pt-BR"))).size!==parsed.length)
      throw new Error("Há opções repetidas na pergunta "+(i+1)+".");
    return {id:optionId(item.id,i),title,options:parsed,...(safeMedia(item.imageUrl)?{imageUrl:safeMedia(item.imageUrl)}:{})};
  });
  if(new Set(questions.map(q=>q.id)).size!==questions.length)throw new Error("Perguntas duplicadas.");
  return {title,subtitle,prompt:safe(v.prompt,50000),theme,questions,outcomes,collectLeads:v.collectLeads===true,coverImageUrl:safeMedia(v.coverImageUrl),motion:v.motion!==false,layout:v.layout==="conversational"?"conversational":"classic"};
}
export function publicQuiz(project:QuizProject):PublicQuiz{
  return {id:project.id,title:project.title,subtitle:project.subtitle,theme:project.theme,coverImageUrl:project.coverImageUrl,motion:project.motion,layout:project.layout,
    collectLeads:project.collectLeads,publishedAt:project.publishedAt,
    questions:project.questions.map(q=>({id:q.id,title:q.title,imageUrl:q.imageUrl,
      options:q.options.map(o=>({id:o.id,label:o.label,imageUrl:o.imageUrl}))}))};
}
export function evaluateQuiz(quiz:QuizProject,answers:Record<string,string>):QuizOutcome{
  if(Object.keys(answers).length!==quiz.questions.length)throw new Error("Responda todas as perguntas.");
  const points=new Map(quiz.outcomes.map(o=>[o.id,0]));
  for(const question of quiz.questions){
    const selected=question.options.find(o=>o.id===answers[question.id]);
    if(!selected)throw new Error("Uma resposta não pertence ao quiz. Atualize a página.");
    points.set(selected.outcomeId,(points.get(selected.outcomeId)||0)+1);
  }
  // Stable tie breaking based on author-defined outcome order.
  return quiz.outcomes.reduce((best,next)=>
    (points.get(next.id)||0)>(points.get(best.id)||0)?next:best,quiz.outcomes[0]);
}
