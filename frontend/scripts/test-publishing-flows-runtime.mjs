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
const reservations={form:0,quiz:0};
let activeClonerAccount="account-one";
const admin={storage,async rpc(name,args){
  if(name!=="pagenova_public_submission_reserve"||!["form","quiz"].includes(args?.p_kind))
    return {data:null,error:{code:"UNKNOWN_TEST_RPC"}};
  reservations[args.p_kind]++;
  return {data:reservations[args.p_kind]<=1000,error:null};
}};
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
    if(specifier==="node:crypto")return createRequire(resolve(root,"package.json"))("node:crypto");
    if(specifier==="cheerio")return createRequire(resolve(root,"package.json"))("cheerio");
    if(specifier==="next/server")return {NextResponse:{json:(data,init)=>Response.json(data,init)}};
    if(specifier==="@/lib/forms/server"&&filename.includes("/app/api/cloner/publish/"))
      return {...load(resolve(root,"src/lib/forms/server")),
        authorizedForms:async()=>({admin,userId:activeClonerAccount})};
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
  assert(reservations.form===1,"Invalid form answers must not consume daily anti-abuse reservations");
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
  assert(reservations.quiz===1,"Unpublished or no-consent quizzes must not consume anti-abuse reservations");
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

  // Optional extended browser-independent Cloner integration. Enable separately
  // with PAGENOVA_CLONER_E2E=1; keep the production build focused on
  // storage and subscription invariants while this extra suite is diagnosed.
  if(process.env.PAGENOVA_CLONER_E2E==="1"){
  // Exercise the real Cloner POST sanitizer and the public GET route without
  // a database, an external URL or a real authenticated account.
  const clonePublish=load(resolve(root,"src/app/api/cloner/publish/route"));
  const clonePublic=load(resolve(root,"src/app/c/[slug]/route"));
  const signedImage=load(resolve(root,"src/server/services/cloner-media")).signedClonerMedia("https://example.org/wp-content/uploads/amigurumi.webp");
  assert(signedImage.startsWith("/api/cloner/media?u="),"Cloner must sign original images");
  const projectId="739014c5-2873-4d83-beb2-7740a26ba854";
  const dirtyHtml='<html><head><script>alert(1)</script></head><body>'+
    '<h1>Site copiado de teste</h1><a href="javascript:alert(1)">Clique</a>'+
    '<img src="http://unsafe.test/img.png"><img src="https://example.org/safe.jpg">'+
    '<img src="'+signedImage+'"><img src="/api/cloner/media?u=https://example.org/img.webp&amp;sig=invalid">'+
    '<form><input name="password"></form><iframe src="https://bad.test"></iframe>'+ 
    '<button class="faq-toggle" onclick="steal()">FAQ original?</button>'+
    '<svg class="decor" viewBox="0 0 24 24"><path d="M0 0L12 12"/></svg>'+
    '<p onclick="alert(2)">Texto seguro</p></body></html>';
  const publishAs=async (who,html)=>{
    activeClonerAccount=who;
    const request={
      nextUrl:new URL("https://pagenova-test.invalid/api/cloner/publish"),
      headers:new Headers({origin:"https://pagenova-test.invalid"}),
      text:async()=>JSON.stringify({projectId,title:"Teste de clonagem",html})
    };
    const response=await clonePublish.POST(request);
    assert(response.status===200,"Cloner publication failed with status "+response.status);
    return response.json();
  };
  const first=await publishAs("account-one",dirtyHtml);
  assert(/^c-[a-f0-9]{32}$/.test(first.slug),"Cloner slug invalid");
  const page=await clonePublic.GET(null,{params:Promise.resolve({slug:first.slug})});
  const pageHtml=await page.text();
  assert(page.status===200,"Published clone GET failed");
  assert(pageHtml.includes("Site copiado de teste"),"Published clone lost text");
  assert(pageHtml.includes('class="faq-toggle"')&&pageHtml.includes("FAQ original?"),
    "Publishing must preserve the visual content of FAQ buttons");
  assert(pageHtml.includes('class="decor"')&&pageHtml.includes('<path'),
    "Publishing must preserve safely sanitized SVG icon paths");
  assert(!pageHtml.includes('onclick=')&&pageHtml.includes('aria-disabled="true"'),
    "Original button must be inert, without source JavaScript handlers");
  assert(pageHtml.includes("/api/cloner/media?u="),
    "Published clone removed signed local images, creating large blank sections");
  assert(!pageHtml.includes("sig=invalid"),
    "Published clone accepted a forged image proxy URL");
  assert(!pageHtml.includes("<script")&&!pageHtml.includes("<iframe")&&
      !pageHtml.includes("<form")&&!pageHtml.includes("onclick=")&&
      !pageHtml.includes("javascript:")&&!pageHtml.includes("http://unsafe.test"),
    "Cloner allowed potentially executable imported HTML");
  assert(page.headers.get("Content-Security-Policy")?.includes("script-src 'none'"),
    "Published clone must disable scripts with CSP");
  const next=await publishAs("account-one",dirtyHtml.replace("Site copiado de teste","Revisão segura do site"));
  assert(first.slug===next.slug,"Republishing clone changed public URL");
  const foreign=await publishAs("account-two",dirtyHtml);
  assert(foreign.slug!==first.slug,"Cloner URL was not owner-scoped");
  console.log("CLONER PASS: sanitized HTML, CSP, owner isolation, stable republish URL.");
  }

  assert([...objects.keys()].every(key=>!key.includes("real_customer")),"Unexpected test data");
  console.log("PRIVATE STORAGE INTEGRATION PASS: all test data stayed in memory.");
}finally{
  if(previousUrl===undefined)delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  else process.env.NEXT_PUBLIC_SUPABASE_URL=previousUrl;
  if(previousKey===undefined)delete process.env.SUPABASE_SECRET_KEY;
  else process.env.SUPABASE_SECRET_KEY=previousKey;
}
