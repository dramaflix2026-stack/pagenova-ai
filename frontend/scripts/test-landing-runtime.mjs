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
  assert(html.includes("consent:data.get('consent')==='yes'"),"Consent must be sent on lead submission for "+kind);
  assert(html.includes('id="landing-lead-form"'),"Missing landing lead form for "+kind);
  assert(!html.includes("<script>alert(1)</script>"),"Untrusted company name rendered as HTML for "+kind);
  assert(html.includes("&lt;script&gt;"),"Escaping of company name missing");
  const normalized=normalizeLanding({...project,ctaUrl:"javascript:alert(1)"});
  assert(!normalized.ctaUrl,"Unsafe CTA protocol accepted");
  assert(!renderLandingHtml(project,true).includes("paidApiCalls"),"Preview should be local");
}
console.log("Landing runtime PASS: six presets, consent, lead payload, XSS escaping, safe links.");
