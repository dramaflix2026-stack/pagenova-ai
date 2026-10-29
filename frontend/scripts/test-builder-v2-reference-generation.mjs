import test from "node:test";
import assert from "node:assert/strict";
import {readFileSync} from "node:fs";
import {stripTypeScriptTypes} from "node:module";

// Execute the real fresh-generation handler. Only auth, billing and the external
// model are replaced; capture the actual model requests, not source patterns.
const route=readFileSync(new URL("../src/app/api/builder-v2/chat/route.ts",import.meta.url),"utf8");
const executable=stripTypeScriptTypes(route.replace(/^import .*;\r?\n/gm,"").replace(/^export /gm,""));
const reference="data:image/png;base64,iVBORw0KGgo=";

async function generate(image,instruction="Crie um site para uma clínica de psicologia seguindo a referência visual."){
  const calls=[];
  const settlements=[];
  const handler=new Function("NextResponse","createClient","reserveBuilderV2Generation","initialSiteMotion","socialLinksFromInstruction","fetch",executable+"\nreturn POST;")(
    {json:(body,options={})=>({body,status:options.status||200})},
    async()=>({auth:{getUser:async()=>({data:{user:{id:"test-owner"}}})}}),
    async()=>({finish:async success=>settlements.push(success)}),
    ()=>({preset:"professional"}),()=>({}),
    async(_url,options)=>{
      const payload=JSON.parse(options.body);
      calls.push(payload);
      const content=payload.messages[1].content;
      const input=JSON.parse(typeof content==="string"?content:content[0].text);
      let result;
      if(input.existingSections)result={extraSections:[]};
      else if(input.sections){
        result={blocks:input.sections.flatMap(section=>{
          const heading={id:section.id+"-heading",section:section.id,type:"heading",text:section.id==="inicio"?"Clínica de Psicologia":section.id,color:"#234638",align:"center",layout:section.layout};
          if(section.id==="galeria")return [heading,...[0,1,2].map(i=>({id:"gallery-"+i,section:section.id,type:"image",text:"Ambiente "+i,src:""}))];
          const count=section.id==="servicos"?Number(section.goal.match(/EXATAMENTE (\d+)/)?.[1]||4):["diferenciais","faq"].includes(section.id)?4:section.id==="sobre"||section.id==="contato"||section.id==="inicio"?1:3;
          return [heading,...Array.from({length:count},(_,i)=>({id:section.id+"-card-"+i,section:section.id,type:"paragraph",text:section.id==="faq"?"Como funciona a etapa "+i+"? Entre em contato para saber mais.":"Atendimento "+i+": Conheça nossa proposta de atendimento e orientação.",color:"#234638",align:"left"}))];
        })};
      }else result={title:"Clínica de Psicologia",background:"#ffffff"};
      return {ok:true,json:async()=>({choices:[{finish_reason:"stop",message:{content:JSON.stringify(result)}}]})};
    }
  );
  const original=process.env.OPENAI_API_KEY;
  process.env.OPENAI_API_KEY="test-key";
  try{
    const result=await handler({headers:new Headers(),nextUrl:{origin:"https://example.test"},json:async()=>({site:{id:"reference-test-project",templateId:"institutional-complete",blocks:[]},instruction,...(image===undefined?{}:{image})})});
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
