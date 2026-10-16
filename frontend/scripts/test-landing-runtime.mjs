/** Landing generation + consent smoke tests. No API calls or customer data. */
import {createRequire} from "node:module";
import {readFileSync} from "node:fs";
import {dirname,resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {webcrypto} from "node:crypto";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"../");
const ts=createRequire(resolve(root,"package.json"))("typescript");
const filename=resolve(root,"src/lib/landing/engine.ts");
const transpiled=ts.transpileModule(readFileSync(filename,"utf8"),{
  compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}
}).outputText;
const loaded={exports:{}};
new Function("module","exports","crypto",transpiled)(loaded,loaded.exports,webcrypto);
const {LANDING_KINDS,newLanding,normalizeLanding,renderLandingHtml}=loaded.exports;
function assert(value,message){if(!value)throw Error(message);}
for(const kind of LANDING_KINDS){
  const project=newLanding(kind,'Empresa "<script>alert(1)</script>"',"Empresa de serviços com atendimento real");
  project.publishedSlug="lp-"+project.id.replaceAll("-","");
  const html=renderLandingHtml(project);
  assert(html.startsWith("<!doctype html>"),"HTML missing doctype for "+kind);
  assert(html.includes('name="consent" type="checkbox"'),"Missing explicit consent UI for "+kind);
  assert(/consent:(?:data\.get\('consent'\)==='yes'|d\.get\("consent"\)==="yes")/.test(html),
    "Consent must be sent on lead submission for "+kind);
  assert(html.includes('id="landing-lead-form"'),"Missing landing lead form for "+kind);
  assert(!html.includes("<script>alert(1)</script>"),"Untrusted company name rendered as HTML for "+kind);
  assert(html.includes("&lt;script&gt;"),"Escaping of company name missing");
  const normalized=normalizeLanding({...project,ctaUrl:"javascript:alert(1)"});
  assert(!normalized.ctaUrl,"Unsafe CTA protocol accepted");
  assert(!renderLandingHtml(project,true).includes("paidApiCalls"),"Preview should be local");
}
const info=loaded.exports.analyzeLandingBrief("Projetos para Serralheria",
 "Eu ofereço um pacote com 5000 projetos de serralheria por apenas 19,90.");
assert(info.subject.toLowerCase().includes("5000 projetos de serralheria"),
 "Local brief parser ignored exact quantity and subject");
assert(info.price==="R$ 19,90","Local brief parser ignored the real price");
const funnel=newLanding("course","Projetos para Serralheria",
 "Eu ofereço um pacote com 5000 projetos de serralheria por apenas 19,90.");
assert(funnel.salesPage&&funnel.price==="R$ 19,90","Infoproduct sales project lost the commercial facts");
const funnelHtml=renderLandingHtml(funnel,false);
for(const section of ["ip-top","ip-cover","id=\"comparacao\"","id=\"beneficios\"",
 "id=\"oferta\"","id=\"garantia\"","id=\"perguntas\"","id=\"contato\""]){
 assert(funnelHtml.includes(section),"Missing infoproduct conversion section: "+section);
}
assert(funnelHtml.includes("5000 projetos de serralheria")&&funnelHtml.includes("R$ 19,90"),
 "Sales headline and price must reflect original briefing");
assert(!funnelHtml.includes("Depoimentos reais e autorizados")&&
 !funnelHtml.includes("id=\"depoimentos\""),"Should not invent testimonials");
assert(!funnelHtml.includes("id=\"bonus\""),"Should not invent bonuses");
assert(funnelHtml.includes("max-width:570px"),"Responsive smartphone layout missing");
assert(funnelHtml.includes("position:sticky"),"Fixed top offer ribbon missing");
const updated=normalizeLanding({...funnel,bonuses:["Arquivo de referências adicionais"],
 testimonials:[{author:"Pessoa autorizada",quote:"Material fácil de consultar."}]});
const filledHtml=renderLandingHtml(updated,false);
assert(filledHtml.includes("id=\"bonus\"")&&filledHtml.includes("id=\"depoimentos\""),
 "Real bonuses and testimonials must be editable and visible");
const legacy=normalizeLanding({...funnel,salesPage:false});
assert(renderLandingHtml(legacy).includes('data-kind="course"'),
 "Old course landing layout must remain backward compatible");
console.log("Landing runtime PASS: all six styles, real infoproduct briefing, full funnel, mobile CSS, historical compatibility.");
