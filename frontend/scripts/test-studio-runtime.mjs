/** Real local Form + Quiz engine smoke tests with zero provider/API calls. */
import { createRequire } from "node:module";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { webcrypto } from "node:crypto";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"../");
const ts=createRequire(resolve(root,"package.json"))("typescript");
const modules=new Map();
function load(file){
  const filename=resolve(file.endsWith(".ts")?file:file+".ts");
  if(modules.has(filename))return modules.get(filename).exports;
  const output=ts.transpileModule(readFileSync(filename,"utf8"),{
    compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}
  }).outputText;
  const mod={exports:{}};
  modules.set(filename,mod);
  const localRequire=(name)=>{
    if(name.startsWith("@/"))return load(resolve(root,"src",name.slice(2)));
    if(name.startsWith("."))return load(resolve(dirname(filename),name));
    throw Error("Unapproved external test import: "+name);
  };
  new Function("require","module","exports","crypto",output)(localRequire,mod,mod.exports,webcrypto);
  return mod.exports;
}
function assert(condition,problem){if(!condition)throw Error(problem);}
const engine=load(resolve(root,"src/lib/studio/local-engine"));
const {evaluateQuiz}=load(resolve(root,"src/lib/quizzes/schema"));
for(const module of ["forms","quizzes","ebooks","apps","systems"])
  assert(engine.STUDIO_PAID_AI_ENABLED[module]===false,module+" must not silently call a paid AI provider");
const form=engine.localForm("Crie um formulário de inscrição para mentoria em marketing com nome, email, WhatsApp, Instagram e faturamento",null);
assert(form.fields.length>=4,"Form generator missing expected fields");
assert(new Set(form.fields.map(f=>f.id)).size===form.fields.length,"Duplicate form field IDs");
assert(form.fields.some(f=>f.type==="email"),"Form lost email field");
const quiz=engine.localQuiz("Crie um quiz com 15 perguntas para captar leads sobre marketing",null);
assert(quiz.questions.length===15,"Quiz generated fewer than 15 requested questions");
assert(quiz.collectLeads===true,"Quiz must enable lead capture for lead briefing");
assert(new Set(quiz.questions.map(q=>q.title)).size===15,"Quiz questions repeated");
assert(quiz.questions.every(q=>q.options.length>=2),"Quiz contains unanswered question");
const answers=Object.fromEntries(quiz.questions.map(q=>[q.id,q.options[0].id]));
const outcome=evaluateQuiz(quiz,answers);
assert(quiz.outcomes.some(x=>x.id===outcome.id),"Quiz scoring produced unknown result");
let invalidRejected=false;
try{evaluateQuiz(quiz,{...answers,[quiz.questions[0].id]:"invalid"});}catch{invalidRejected=true;}
assert(invalidRejected,"Scoring accepted answer not belonging to quiz");
console.log("Studio runtime PASS: local forms, 15-question quiz, lead intent, scoring and paid-provider policy.");
