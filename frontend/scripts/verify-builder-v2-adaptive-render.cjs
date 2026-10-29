// Run after npm run build. Exercises the actual renderer with chat-produced data.
const assert=require("node:assert/strict");
const fs=require("node:fs");
const path=require("node:path");
const Module=require("node:module");
const ts=require("typescript");
const React=require("react");
const {renderToStaticMarkup}=require("react-dom/server");
const {execFileSync}=require("node:child_process");
const root=path.resolve(__dirname,"..");
const originalResolve=Module._resolveFilename;
Module._resolveFilename=function(request,parent,...rest){
  return originalResolve.call(this,request.startsWith("@/")?path.join(root,"src",request.slice(2)):request,parent,...rest);
};
for(const extension of [".ts",".tsx"])require.extensions[extension]=(module,filename)=>{
  const output=ts.transpileModule(fs.readFileSync(filename,"utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText;
  module._compile(output,filename);
};
require.extensions[".css"]=()=>{};
const {BuilderV2Site}=require("../src/components/builder-v2-site.tsx");
const {applyInstitutionalEdit}=require("../src/lib/builder-v2-institutional-edits.ts");
const make=(type,section,id,text,extra={})=>({id,type,section,text,color:"#123b2a",align:"center",...extra});
const site={title:"Horizonte QA",niche:"Psicologia",templateId:"prompt-adaptive",background:"#f7f2e8",design:{surface:"#ffffff",accent:"#123b2a"},motion:{preset:"none"},blocks:[
  make("heading","inicio","hero-title","Um espaço para você",{layout:"hero"}),
  make("paragraph","inicio","hero-copy","Atendimento com escuta e acolhimento, respeitando cada pessoa."),
  make("button","inicio","hero-cta","Conhecer serviços",{href:"#servicos"}),
  make("heading","servicos","services-title","Nossos Serviços",{layout:"grid",background:"#f7f2e8"}),
  ...Array.from({length:4},(_,i)=>make("paragraph","servicos","service-"+i,"Serviço "+(i+1)+": Descrição objetiva para apresentar esta opção de atendimento.")),
  make("heading","sobre","about-title","Sobre nós",{layout:"split"}),
  make("paragraph","sobre","about-copy","Um espaço dedicado ao acolhimento e à reflexão sobre caminhos e possibilidades."),
  make("heading","faq","faq-title","Perguntas frequentes",{layout:"faq"}),
  ...Array.from({length:4},(_,i)=>make("paragraph","faq","faq-"+i,"Como funciona a etapa "+(i+1)+"? Entre em contato para confirmar os detalhes.")),
  make("heading","contato","contact-title","Entre em contato",{layout:"banner"}),
  make("paragraph","contato","contact-copy","Conheça os canais de atendimento e envie sua mensagem.")
]};
const render=(data,component=BuilderV2Site)=>renderToStaticMarkup(React.createElement(component,{site:data,templateId:data.templateId,publishedMode:true}));
const original=structuredClone(site);
const baseHtml=render(site);
let changed=applyInstitutionalEdit(site,"Adicione à seção de Serviços um novo card chamado 'Orientação de Carreira', com a descrição 'Reflexão sobre escolhas profissionais.' Preserve os demais cards.");
assert.ok(changed&&changed.site,changed?.error);
assert.equal(changed.site.blocks.filter(b=>b.section==="servicos"&&b.type==="paragraph").length,5);
changed=applyInstitutionalEdit(changed.site,"Execute somente estas três mudanças: 1) Centralize o título da seção de Serviços. 2) Altere a cor do botão principal da capa para #C9A66B. 3) Aumente levemente as sombras dos cards de Serviços. Preserve todo o restante do site.");
assert.ok(changed?.site,changed?.error);
const edited=JSON.parse(JSON.stringify(changed.site));
edited.blocks.find(b=>b.id==="services-title").color="#0066cc";
edited.blocks.find(b=>b.id==="services-title").colorExplicit=true;
const editedHtml=render(edited);
assert.equal(require("cheerio").load(editedHtml)('div[data-pn-composition="services"]').length,1);
assert.ok(editedHtml.includes("Orientação de Carreira"));
assert.equal((editedHtml.match(/<details/g)||[]).length,4);
assert.ok(editedHtml.includes("color:#0066cc"));
assert.ok(editedHtml.includes("box-shadow:0 14px 34px"));
assert.ok(editedHtml.includes("background-color:#f7f2e8"));
assert.deepEqual(site,original);
// Compare T1 output to the exact main baseline, rather than a hand-written approximation.
const oldModule=new Module(path.join(root,"src/components/builder-v2-site-baseline.tsx"),module);
oldModule.filename=path.join(root,"src/components/builder-v2-site-baseline.tsx");
oldModule.paths=Module._nodeModulePaths(path.dirname(oldModule.filename));
const oldSource=execFileSync("git",["show","24bb373cd667f894a71388d868843c34351ba0a3:frontend/src/components/builder-v2-site.tsx"],{cwd:root,encoding:"utf8"});
oldModule._compile(ts.transpileModule(oldSource,{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,oldModule.filename);
const t1={...site,templateId:"institutional-complete"};
assert.equal(render(t1),render(t1,oldModule.exports.BuilderV2Site),"T1 rendered HTML must remain unchanged");
const output=process.env.BUILDER_QA_OUTPUT;
if(output){
  fs.mkdirSync(output,{recursive:true});
  const cssDir=path.join(root,".next/static/chunks");
  const css=fs.existsSync(cssDir)?fs.readdirSync(cssDir).filter(name=>name.endsWith(".css")).map(name=>fs.readFileSync(path.join(cssDir,name),"utf8")).join("\n"):"";
  for(const [name,html] of [["initial",baseHtml],["edited",editedHtml]])fs.writeFileSync(path.join(output,name+".html"),'<!doctype html><meta name="viewport" content="width=device-width,initial-scale=1"><style>'+css+'</style>'+html);
}
console.log("PASS: real T5 renderer, 5 cards after chat, 4 FAQ, explicit colors/shadows, JSON round trip, and byte-identical T1 baseline.");
if(output)(async()=>{
  const chromium=require("@sparticuz/chromium").default;
  const browser=await require("playwright-core").chromium.launch({executablePath:await chromium.executablePath(),args:chromium.args,headless:true});
  try{
    const page=await browser.newPage();
    for(const width of [1440,390]){
      await page.setViewportSize({width,height:1000});
      await page.setContent(fs.readFileSync(path.join(output,"edited.html"),"utf8"));
      const metrics=await page.evaluate(()=>{
        const services=document.querySelector('[data-section-id="servicos"]');
        const heading=services.querySelector("h2");
        const card=services.querySelector("article");
        return {background:getComputedStyle(services).backgroundColor,heading:getComputedStyle(heading).color,align:getComputedStyle(heading).textAlign,card:getComputedStyle(card).backgroundColor,shadow:getComputedStyle(card).boxShadow,cards:services.querySelectorAll("article").length,faq:document.querySelectorAll("details").length,overflow:document.documentElement.scrollWidth>innerWidth+1};
      });
      assert.equal(metrics.background,"rgb(247, 242, 232)");
      assert.equal(metrics.heading,"rgb(0, 102, 204)");
      assert.equal(metrics.card,"rgb(255, 255, 255)");
      assert.equal(metrics.align,"center");
      assert.match(metrics.shadow,/14px 34px/);
      assert.equal(metrics.cards,5);
      assert.equal(metrics.faq,4);
      assert.equal(metrics.overflow,false);
      await page.locator("details summary").first().click();
      assert.equal(await page.locator("details[open]").count(),1);
      await page.locator("details summary").first().click();
      assert.equal(await page.locator("details[open]").count(),0);
      await page.screenshot({path:path.join(output,"t5-"+width+".png"),fullPage:true});
      console.log("PASS browser "+width+"px:",JSON.stringify(metrics));

    }
  }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
