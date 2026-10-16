/**
 * Zero-network integration regression against real production server functions.
 * Simulates Supabase's private object storage, without credentials/real clients.
 * Covers create -> draft -> publish -> public response -> owner read and
 * cross-account protection for forms/quizzes, plus ebook cloud CRUD.
 */
import {createRequire} from "node:module";
import {readFileSync} from "node:fs";
import {dirname,resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {webcrypto} from "node:crypto";

const root=resolve(dirname(fileURLToPath(import.meta.url)),"../");
const ts=createRequire(resolve(root,"package.json"))("typescript");
const previousUrl=process.env.NEXT_PUBLIC_SUPABASE_URL,previousKey=process.env.SUPABASE_SECRET_KEY;
process.env.NEXT_PUBLIC_SUPABASE_URL="https://pagenova-test.invalid";
process.env.SUPABASE_SECRET_KEY="LOCAL_IN_MEMORY_ONLY_NOT_A_REAL_SECRET";
const buckets=new Set();
const objects=new Map();
const token=(bucket,path)=>bucket+"\0"+path;

const storage={
  async getBucket(bucket){return buckets.has(bucket)?{data:{id:bucket},error:null}:{data:null,error:{message:"not found"}};},
  async createBucket(bucket){buckets.add(bucket);return {data:{id:bucket},error:null};},
  from(bucket){
    return {
      async upload(path,blob,opts={}){
        const key=token(bucket,path);
        if(objects.has(key)&&!opts.upsert)return {error:{message:"already exists"}};
        objects.set(key,{data:await blob.text(),updatedAt:new Date().toISOString()});
        return {error:null};
      },
      async download(path){
        const entry=objects.get(token(bucket,path));
        return entry?{data:new Blob([entry.data],{type:"application/json"}),error:null}
          :{data:null,error:{message:"Object not found"}};
      },
      async list(prefix,opts={}){
        const start=prefix.replace(/\/+$/,"")+"/";
        const files=[];
        for(const [key,value] of objects){
          if(!key.startsWith(token(bucket,start)))continue;
          const name=key.slice(token(bucket,start).length);
          if(name.includes("/"))continue;
          files.push({name,updated_at:value.updatedAt,created_at:value.updatedAt});
        }
        if(opts.sortBy?.order==="desc")files.sort((a,b)=>b.updated_at.localeCompare(a.updated_at));
        return {data:files.slice(0,opts.limit||100),error:null};
      },
      async remove(paths){
        paths.forEach(path=>objects.delete(token(bucket,path)));
        return {error:null};
      }
    };
  }
};
const admin={storage};
const cache=new Map();
function load(path){
  const filename=resolve(path.endsWith(".ts")?path:path+".ts");
  if(cache.has(filename))return cache.get(filename).exports;
  const code=ts.transpileModule(readFileSync(filename,"utf8"),{
    fileName:filename,compilerOptions:{
      module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,
      esModuleInterop:true
    }
  }).outputText;
  const mod={exports:{}};
  cache.set(filename,mod);
  const localRequire=(specifier)=>{
    if(specifier==="@supabase/supabase-js")return {createClient:()=>admin};
    if(specifier==="@/lib/supabase/server")return {createClient:async()=>({
      auth:{getUser:async()=>({data:{user:null}})}
    })};
    if(specifier.startsWith("@/"))return load(resolve(root,"src",specifier.slice(2)));
    if(specifier.startsWith("."))return load(resolve(dirname(filename),specifier));
    throw Error("Unexpected test dependency: "+specifier);
  };
  new Function("require","module","exports","crypto","process","Blob",code)(
    localRequire,mod,mod.exports,webcrypto,process,Blob
  );
  return mod.exports;
}
function assert(test,message){if(!test)throw Error(message);}
async function rejects(action,message){
  let rejected=false;
  try{await action();}catch{rejected=true;}
  assert(rejected,message);
}
try{
  const forms=load(resolve(root,"src/lib/forms/server"));
  await rejects(()=>forms.authorizedForms(),"Unauthenticated browser session got creation rights");
  let validationError=null;
  try{await forms.saveOwnedForm(admin,"account-one",{title:"X",fields:[]});}
  catch(error){validationError=error;}
  assert(validationError?.status===422,"Invalid form must return validation status 422");
  const unexpected=await forms.errorsAsResponse(new Error("DATABASE_SECRET_INTERNAL")).json();
  assert(!JSON.stringify(unexpected).includes("DATABASE_SECRET_INTERNAL"),
    "Unhandled server exception leaked provider internals to API caller");
  const form=await forms.saveOwnedForm(admin,"account-one",{
    title:"Contato e interesse comercial",description:"Entre em contato",
    kind:"leads",fields:[
      {id:"nome",label:"Nome completo",type:"text",required:true,options:[]},
      {id:"email",label:"Email de contato",type:"email",required:true,options:[]},
      {id:"interesse",label:"Qual o serviço?",type:"select",required:true,options:["Site","Loja"]},
    ]
  });
  assert(form.id && !form.publishedAt,"Draft form must not be published");
  await rejects(()=>forms.getOwnedForm(admin,"account-two",form.id),"Another account can read form draft");
  const published=await forms.publishOwnedForm(admin,"account-one",form.id);
  assert(published.publishedAt,"Form publish timestamp missing");
  const publicForm=await forms.getPublishedForm(form.id);
  assert(publicForm?.fields.length===3,"Published form snapshot missing");
  await rejects(()=>forms.recordPublicSubmission(form.id,{
    nome:"Alice",email:"invalid",interesse:"Site"
  }),"Invalid email was accepted");
  await rejects(()=>forms.recordPublicSubmission(form.id,{
    nome:"Alice",email:"alice@example.org",interesse:"Unknown"
  }),"Unknown selected option was accepted");
  const response=await forms.recordPublicSubmission(form.id,{
    nome:"Alice",email:"alice@example.org",interesse:"Site"
  });
  assert(response.formId===form.id&&response.answers.length===3,"Form response persistence failed");
  const ownerResponses=await forms.listOwnedSubmissions(admin,"account-one",form.id);
  assert(ownerResponses.some(x=>x.id===response.id),"Owner cannot retrieve form lead");
  await rejects(()=>forms.listOwnedSubmissions(admin,"account-two",form.id),"Another account can read form leads");
  const changed=await forms.saveOwnedForm(admin,"account-one",{
    ...form,title:"New unpublished title"
  },form.id);
  assert(changed.title==="New unpublished title","Form draft edit failed");
  assert((await forms.getPublishedForm(form.id)).title==="Contato e interesse comercial",
    "Updating a draft modified the public snapshot without publishing");
  console.log("FORM PASS: draft, publish, field validation, immutable response, owner isolation, snapshot.");

  const quizzes=load(resolve(root,"src/lib/quizzes/server"));
  const questions=Array.from({length:3},(_,i)=>({
    id:"q-"+i,title:"Pergunta numero "+(i+1),
    options:[
      {id:"yes-"+i,label:"Sim",outcomeId:"out-a"},
      {id:"no-"+i,label:"Não",outcomeId:"out-b"}
    ]
  }));
  const quiz=await quizzes.saveOwnedQuiz(admin,"account-one",{
    title:"Diagnóstico do seu negócio",subtitle:"Responda e descubra",
    theme:"emerald",questions,collectLeads:true,
    outcomes:[
      {id:"out-a",title:"Momento de crescer",description:"Avance seu negócio"},
      {id:"out-b",title:"Momento de planejar",description:"Prepare seu negócio"}
    ]
  });
  await rejects(()=>quizzes.getOwnedQuiz(admin,"account-two",quiz.id),"Another account can read quiz");
  await rejects(()=>quizzes.submitPublicQuiz(admin,quiz.id,{}),"Unpublished quiz accepted responses");
  await quizzes.publishOwnedQuiz(admin,"account-one",quiz.id);
  const publicQuiz=await quizzes.getPublicQuiz(admin,quiz.id);
  assert(publicQuiz?.questions.length===3,"Public quiz missing questions");
  assert(!JSON.stringify(publicQuiz).includes("outcomeId"),"Public quiz leaked scoring rubric");
  const answers=Object.fromEntries(questions.map(q=>[q.id,q.options[0].id]));
  await rejects(()=>quizzes.submitPublicQuiz(admin,quiz.id,{
    answers,name:"Alice",email:"alice@example.org"
  }),"Lead was accepted without explicit consent");
  const submission=await quizzes.submitPublicQuiz(admin,quiz.id,{
    answers,name:"Alice",email:"alice@example.org",consent:true
  });
  assert(submission.outcome.id==="out-a"&&submission.submissionId,"Quiz scoring/response failed");
  const submissions=await quizzes.listQuizResponses(admin,"account-one",quiz.id);
  assert(submissions.some(x=>x.id===submission.submissionId && x.lead?.consent),
    "Owner cannot retrieve quiz lead and consent");
  await rejects(()=>quizzes.listQuizResponses(admin,"account-two",quiz.id),
    "Another account can read quiz submissions");
  console.log("QUIZ PASS: published-only, hidden scoring, consent, scoring, responses, owner isolation.");

  const {buildCookbook}=load(resolve(root,"src/lib/ebooks/cookbook-engine"));
  const book=buildCookbook({
    prompt:"Crie 3 receitas saudáveis para o dia a dia",count:3,
    author:"Editora Teste",theme:"editorial",imageMode:"none"
  });
  const cloud=load(resolve(root,"src/lib/ebooks/cloud"));
  const summary=await cloud.saveCloudEbook(admin,"account-one",book);
  assert(summary.id===book.id&&summary.pageCount===book.pages.length,
    "Ebook cloud save failed");
  const readBack=await cloud.getCloudEbook(admin,"account-one",book.id);
  assert(readBack.pages.length===book.pages.length,"Ebook cloud lost pages");
  const list=await cloud.listCloudEbooks(admin,"account-one");
  assert(list.some(x=>x.id===book.id),"Cloud ebook list missing saved project");
  await rejects(()=>cloud.getCloudEbook(admin,"account-two",book.id),
    "Another account can read ebook");
  await cloud.deleteCloudEbook(admin,"account-one",book.id);
  await rejects(()=>cloud.getCloudEbook(admin,"account-one",book.id),
    "Deleted ebook remains readable");
  console.log("EBOOK CLOUD PASS: save, list, reopen, tenant isolation, delete.");

  assert([...objects.keys()].every(key=>!key.includes("real_customer")),"Unexpected test data");
  console.log("PRIVATE STORAGE INTEGRATION PASS: all test data stayed in memory.");
}finally{
  if(previousUrl===undefined)delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  else process.env.NEXT_PUBLIC_SUPABASE_URL=previousUrl;
  if(previousKey===undefined)delete process.env.SUPABASE_SECRET_KEY;
  else process.env.SUPABASE_SECRET_KEY=previousKey;
}
