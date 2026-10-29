import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {stripTypeScriptTypes} from "node:module";

// Execute the real fresh-generation handler. Only auth, billing and the external
// model are replaced; capture the actual model requests, not source patterns.
import {briefCardCounts,briefHeadingAlignment,hexColor} from "../src/lib/builder-v2-brief-contract.ts";

import {applyInstitutionalEdit} from "../src/lib/builder-v2-institutional-edits.ts";
import {applyAnnouncementTextInstruction,referencesTopAnnouncement,DEFAULT_BUILDER_ANNOUNCEMENT} from "../src/lib/builder-v2-announcement.ts";
import {applySocialInstruction} from "../src/lib/site-social-links.ts";
import {isMotionOnlyInstruction,hasMotionIntent,applySiteMotionInstruction} from "../src/lib/site-builder-animation.ts";

const route=readFileSync(new URL("../src/app/api/builder-v2/chat/route.ts",import.meta.url),"utf8");
const executable=stripTypeScriptTypes(route.replace(/^import .*;\r?\n/gm,"").replace(/^export /gm,""));
const reference="data:image/png;base64,iVBORw0KGgo=";

async function generate(image,instruction="Crie um site para uma clínica de psicologia seguindo a referência visual.",options={}){
  const calls=[];
  const settlements=[];
  const handler=new Function("NextResponse","createClient","reserveBuilderV2Generation","initialSiteMotion","socialLinksFromInstruction","briefCardCounts","briefHeadingAlignment","hexColor","applyInstitutionalEdit","applyAnnouncementTextInstruction","referencesTopAnnouncement","DEFAULT_BUILDER_ANNOUNCEMENT","applySocialInstruction","isMotionOnlyInstruction","hasMotionIntent","applySiteMotionInstruction","fetch",executable+"\nreturn POST;")(
    {json:(body,options={})=>({body,status:options.status||200})},
    async()=>({auth:{getUser:async()=>({data:{user:{id:"test-owner"}}})}}),
    async()=>({finish:async success=>settlements.push(success)}),
    ()=>({preset:"professional"}),()=>({}),briefCardCounts,briefHeadingAlignment,hexColor,applyInstitutionalEdit,applyAnnouncementTextInstruction,referencesTopAnnouncement,DEFAULT_BUILDER_ANNOUNCEMENT,applySocialInstruction,isMotionOnlyInstruction,hasMotionIntent,applySiteMotionInstruction,
    async(_url,fetchOptions)=>{
      const payload=JSON.parse(fetchOptions.body);
      calls.push(payload);
      const content=payload.messages[1].content;
      const input=JSON.parse(typeof content==="string"?content:content[0].text);
      let result;
      if(options.editPatch)result=options.editPatch;
      else if(input.missing&&options.repairCards)result={cards:options.repairCards};
      else if(input.existingSections)result={extraSections:[]};
      else if(input.sections){
        result={blocks:input.sections.flatMap(section=>{
          const heading={id:section.id+"-heading",section:section.id,type:"heading",text:section.id==="inicio"?"Clínica de Psicologia":section.id,color:"#234638",align:"center",layout:section.layout};
          if(section.id==="galeria")return [heading,...[0,1,2].map(i=>({id:"gallery-"+i,section:section.id,type:"image",text:"Ambiente "+i,src:""}))];
          const count=section.id==="faq"&&options.faqCount?options.faqCount:section.id==="diferenciais"&&options.differentialsCount?options.differentialsCount:section.id==="servicos"?Number(section.goal.match(/EXATAMENTE (\d+)/)?.[1]||4):["diferenciais","faq"].includes(section.id)?4:section.id==="sobre"||section.id==="contato"||section.id==="inicio"?1:3;
          return [heading,...Array.from({length:count},(_,i)=>({id:section.id+"-card-"+i,section:section.id,type:"paragraph",text:section.id==="faq"?"Como funciona a etapa "+i+"? Entre em contato para saber mais.":"Atendimento "+i+": Conheça nossa proposta de atendimento e orientação.",color:"#234638",align:"left"}))];
        })};
      }else result={title:"Clínica de Psicologia",background:"#ffffff",design:{surface:"#f7f2e8",accent:"#123b2a",text:"#24332e",muted:"#4d5652"}};
      return {ok:true,json:async()=>({choices:[{finish_reason:"stop",message:{content:JSON.stringify(result)}}]})};
    }
  );
  const original=process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY="test-key";
  try{
    const result=await handler({headers:new Headers(),nextUrl:{origin:"https://example.test"},json:async()=>({site:options.site||{id:"reference-test-project",templateId:options.templateId||"institutional-complete",blocks:[]},instruction,...(image===undefined?{}:{image})})});
    return {result,calls,settlements};
  }finally{if(original===undefined)delete process.env.OPENAI_API_KEY;else process.env.OPENAI_API_KEY=original;}
}

test("fresh generation sends the reference pixels to identity and every section batch",async()=>{
  const {result,calls,settlements}=await generate(reference);
  assert.equal(result.status,200);
  const visualCalls=calls.filter(call=>{
    const content=call.messages[1].content;
    const data=JSON.parse(typeof content==="string"?content:content[0].text);
    return !data.existingSections;
  });
  assert.equal(visualCalls.length,6); // identity + five batches for nine sections
  for(const call of visualCalls){
    assert.ok(Array.isArray(call.messages[1].content));
    assert.deepEqual(call.messages[1].content[1],{type:"image_url",image_url:{url:reference,detail:"high"}});
  }
  assert.equal(result.body.site.templateId,"institutional-complete");
  assert.ok(result.body.site.blocks.every(block=>block.src!==reference));
  assert.deepEqual(settlements,[true]);
});

test("text-only generation retains the existing string payload and template",async()=>{
  const {result,calls}=await generate();
  assert.equal(result.status,200);
  assert.ok(calls.every(call=>typeof call.messages[1].content==="string"));
  assert.equal(result.body.site.templateId,"institutional-complete");
});

test("external URLs and unsupported or oversized reference payloads never reach vision",async()=>{
  for(const image of ["https://example.test/reference.png","data:image/svg+xml;base64,PHN2Zz4=","data:image/png;base64,"+"A".repeat(3000000)]){
    const {result,calls}=await generate(image);
    assert.equal(result.status,200);
    assert.ok(calls.every(call=>typeof call.messages[1].content==="string"));
  }
});


test("numeric service quantities reach the model and survive fresh-generation validation",async()=>{
  for(const instruction of ["Crie um site de psicologia com 5 serviços.","Crie um site de psicologia. Seção Serviços: exatamente 6 cards.","Crie um site de psicologia com 8 serviços e 4 diferenciais."]){
    const {result}=await generate(undefined,instruction);
    assert.equal(result.status,200);
    const expected=Number(instruction.match(/\b([568])\b/)[1]);
    assert.equal(result.body.site.blocks.filter(block=>block.section==="servicos"&&block.type==="paragraph").length,expected);
  }
});


test("T5 long single-line brief enforces each independent count, including excess FAQ items",async()=>{
  const {result}=await generate(undefined,"Crie um site premium de psicologia com quatro serviços, quatro diferenciais, três etapas de atendimento e FAQ com quatro perguntas. Quero verde-escuro, bege e branco.",{templateId:"prompt-adaptive",faqCount:12,differentialsCount:7});
  assert.equal(result.status,200);
  for(const [section,count] of [["servicos",4],["diferenciais",4],["processo",3],["faq",4]])assert.equal(result.body.site.blocks.filter(block=>block.section===section&&block.type==="paragraph").length,count,section);
  assert.equal(result.body.site.design.accent,"#123b2a");
  assert.equal(result.body.site.background,"#ffffff");
  assert.equal(result.body.site.templateId,"prompt-adaptive");
});


test("a newly generated T5 survives a sequence of real chat handlers and serialization",async()=>{
  const generated=await generate(undefined,"Crie um site de psicologia com 4 serviços, 4 diferenciais, 3 etapas e FAQ com 4 perguntas. Todos os títulos centralizados.",{templateId:"prompt-adaptive",faqCount:12});
  assert.equal(generated.result.status,200);
  let site=generated.result.body.site;
  site.blocks.splice(2,0,{id:"hero-cta",section:"inicio",type:"button",text:"Conhecer serviços",color:"#123b2a",href:"#servicos",align:"center"});
  assert.ok(site.blocks.filter(b=>b.type==="heading").every(b=>b.align==="center"));
  const initial=structuredClone(site);
  const cases=[
    ["Substitua somente a descrição da capa por 'Um espaço de escuta e acolhimento.' Não altere os demais elementos.",s=>assert.equal(s.blocks.find(b=>b.id==="inicio-card-0").text,"Um espaço de escuta e acolhimento.")],
    ["Adicione à seção de Serviços um novo card chamado 'Orientação Profissional', com a descrição 'Reflexão sobre escolhas profissionais.' Preserve os anteriores.",s=>assert.equal(s.blocks.filter(b=>b.section==="servicos"&&b.type==="paragraph").length,5)],
    ["Mova o card 'Orientação Profissional' para a primeira posição da seção de Serviços.",s=>assert.match(s.blocks.find(b=>b.section==="servicos"&&b.type==="paragraph").text,/^Orientação Profissional/)],
    ["Configure o botão principal da capa para levar à seção de Contato do próprio site.",s=>assert.equal(s.blocks.find(b=>b.id==="hero-cta").href,"#contato")],
    ["Altere o link do botão 'Conhecer serviços' da capa para https://example.com/agenda.",s=>assert.equal(s.blocks.find(b=>b.id==="hero-cta").href,"https://example.com/agenda")],
    ["Centralize o título da seção de Serviços.",s=>assert.equal(s.blocks.find(b=>b.id==="servicos-heading").align,"center")],
    ["Altere somente a família tipográfica dos títulos da seção de serviços para Poppins.",s=>assert.ok(s.blocks.filter(b=>b.section==="servicos"&&b.type==="paragraph").every(b=>b.fontFamily==="Poppins"))],
    ["Remova as animações do site inteiro.",s=>assert.equal(s.motion.preset,"none")],
    ["Remova exclusivamente o card 'Orientação Profissional' da seção de Serviços.",s=>assert.equal(s.blocks.filter(b=>b.section==="servicos"&&b.type==="paragraph").length,4)]
  ];
  for(const [instruction,verify] of cases){
    const inputSite=site;
    const previous=structuredClone(site);
    const edited=await generate(undefined,instruction,{site});
    assert.equal(edited.result.status,200,instruction+": "+JSON.stringify(edited.result.body));
    site=JSON.parse(JSON.stringify(edited.result.body.site));
    verify(site);
    assert.deepEqual(site.design,initial.design);
    assert.deepEqual(site.blocks.filter(b=>b.section==="faq"),initial.blocks.filter(b=>b.section==="faq"));
    assert.equal(site.templateId,"prompt-adaptive");
    assert.deepEqual(inputSite,previous); // requests must not mutate their input
  }
  assert.deepEqual(site.blocks.filter(b=>b.section==="diferenciais"),initial.blocks.filter(b=>b.section==="diferenciais"));
});


test("section moves and brand changes preserve T5 content, IDs and its palette",async()=>{
  const generated=await generate(undefined,"Crie um site de psicologia com quatro serviços e FAQ com quatro perguntas.",{templateId:"prompt-adaptive"});
  const site=generated.result.body.site;
  const moved=await generate(undefined,"Mova a seção sobre para depois da seção galeria.",{site});
  assert.equal(moved.result.status,200,JSON.stringify(moved.result.body));
  const updated=moved.result.body.site;
  assert.ok(updated.blocks.findIndex(b=>b.section==="sobre")>updated.blocks.findLastIndex(b=>b.section==="galeria"));
  for(const block of site.blocks)assert.deepEqual(updated.blocks.find(b=>b.id===block.id),block);
  const branded=await generate(undefined,'Altere o nome da empresa no cabeçalho para "Clínica Nova QA".',{site:updated});
  assert.equal(branded.result.status,200);
  assert.equal(branded.result.body.site.header.brand,"Clínica Nova QA");
  assert.deepEqual(branded.result.body.site.blocks,updated.blocks);
  assert.deepEqual(branded.result.body.site.design,site.design);
});

test("FAQ patch response adds a question without rewriting any existing block",async()=>{
  const generated=await generate(undefined,"Crie um site de psicologia com FAQ com quatro perguntas.",{templateId:"prompt-adaptive"});
  const site=generated.result.body.site;
  const result=await generate(undefined,"Adicione uma pergunta ao FAQ: Como entrar em contato? Resposta: Use os canais disponíveis.",{site,editPatch:{edits:[],insertions:[{afterId:"faq-card-3",block:{type:"paragraph",text:"Como entrar em contato? Use os canais disponíveis.",color:"#123b2a",align:"left"}}],sections:[],deletions:[],moves:[],summary:"Pergunta adicionada."}});
  assert.equal(result.result.status,200,JSON.stringify(result.result.body));
  const after=result.result.body.site;
  assert.equal(after.blocks.filter(b=>b.section==="faq"&&b.type==="paragraph").length,5);
  for(const block of site.blocks)assert.deepEqual(after.blocks.find(b=>b.id===block.id),block);
  assert.deepEqual(after.design,site.design);
});


test("a heading color requested through chat stays explicit and preserves other blocks",async()=>{
  const generated=await generate(undefined,"Crie um site de psicologia com FAQ com quatro perguntas.",{templateId:"prompt-adaptive"});
  const site=generated.result.body.site;
  const result=await generate(undefined,"Altere somente a cor do título da seção de Serviços para #0066CC. Preserve todos os outros elementos.",{site,editPatch:{edits:[{id:"servicos-heading",changes:{color:"#0066CC"}}],insertions:[],deletions:[],moves:[],sections:[],summary:"Cor atualizada."}});
  assert.equal(result.result.status,200,JSON.stringify(result.result.body));
  const after=result.result.body.site;
  assert.equal(after.blocks.find(b=>b.id==="servicos-heading").color,"#0066CC");
  assert.equal(after.blocks.find(b=>b.id==="servicos-heading").colorExplicit,true);
  for(const block of site.blocks.filter(b=>b.id!=="servicos-heading"))assert.deepEqual(after.blocks.find(b=>b.id===block.id),block);
});


test("an underproduced FAQ is repaired to the requested count with question-answer blocks",async()=>{
  const {result,settlements}=await generate(undefined,"Crie um site de psicologia com FAQ com quatro perguntas.",{templateId:"prompt-adaptive",faqCount:1,repairCards:[{title:"Como entrar em contato?",description:"Use os canais disponíveis."},{title:"Como saber mais?",description:"Converse com a equipe."},{title:"Como confirmar o atendimento?",description:"Consulte a disponibilidade."}]});
  assert.equal(result.status,200,JSON.stringify(result.body));
  const faq=result.body.site.blocks.filter(b=>b.section==="faq"&&b.type==="paragraph");
  assert.equal(faq.length,4);
  assert.ok(faq.every(b=>b.text.includes("? ")));
  assert.deepEqual(settlements,[true]);
});
