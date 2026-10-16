/** Landing generation + consent smoke tests. No API calls or customer data. */
import {createRequire} from "node:module";
import {readFileSync} from "node:fs";
import {dirname,resolve} from "node:path";
import {fileURLToPath} from "node:url";
import {webcrypto} from "node:crypto";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"../");
const ts=createRequire(resolve(root,"package.json"))("typescript");
const filename=resolve(root,"src/lib/landing/engine.ts");
const cache=new Map();
function loadTs(file){
 if(cache.has(file))return cache.get(file).exports;
 const module={exports:{}};cache.set(file,module);
 const code=ts.transpileModule(readFileSync(file,"utf8"),{
   compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}
 }).outputText;
 const localRequire=(specifier)=>{
   if(!specifier.startsWith("."))throw Error("Unexpected runtime dependency: "+specifier);
   return loadTs(resolve(dirname(file),specifier+".ts"));
 };
 new Function("module","exports","require","crypto",code)(
  module,module.exports,localRequire,webcrypto);
 return module.exports;
}
const loaded={exports:loadTs(filename)};
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
assert(funnel.headline.includes("5000 projetos de serralheria")&&
 funnel.offer.includes("5000 projetos de serralheria"),
 "Headline and main offer must use confirmed quantity and niche");
assert(!funnel.headline.includes("conheça a coleção e o que ela oferece")&&
 !funnel.subtitle.includes("Explore a proposta de "),
 "Infoproduct copy must not regress to generic placeholder text");
assert(funnelHtml.includes('data-cta-target="contact"')&&funnelHtml.includes('href="#contato"')&&
 funnelHtml.includes("Tirar dúvidas sobre a oferta")&&
 !funnelHtml.includes('data-cta-target="checkout"'),
 "No checkout may be presented as an immediate purchase");
assert(funnelHtml.includes("ip-product-stack")&&
 funnelHtml.includes("ip-cover-back")&&
 funnelHtml.includes("ip-product-pill")&&
 funnelHtml.includes("Serralheria"),
 "Default mockup must show the real product facts without fabricated imagery");
const withCheckout=normalizeLanding({...funnel,
 ctaUrl:"https://checkout.example.org/compra",ctaLabel:"Quero comprar o pacote"});
const checkoutHtml=renderLandingHtml(withCheckout,false);
assert(checkoutHtml.includes('data-cta-target="checkout"')&&
 checkoutHtml.includes('href="https://checkout.example.org/compra"')&&
 checkoutHtml.includes("Quero comprar o pacote")&&
 checkoutHtml.includes('rel="noopener noreferrer"'),
 "A configured checkout must be honored as the real purchase destination");
const withRealImage=normalizeLanding({...funnel,
 heroImage:"https://assets.example.org/mockup-autorizado.webp"});
const imageHtml=renderLandingHtml(withRealImage,false);
assert(imageHtml.includes("ip-product-image")&&
 imageHtml.includes("mockup-autorizado.webp")&&
 !imageHtml.includes('class="ip-product-stack"'),
 "The uploaded mockup must override the placeholder illustration");
assert(!funnelHtml.includes("Depoimentos reais e autorizados")&&
 !funnelHtml.includes("id=\"depoimentos\""),"Should not invent testimonials");
assert(!funnelHtml.includes("id=\"bonus\""),"Should not invent bonuses");
assert(funnelHtml.includes("max-width:570px"),"Responsive smartphone layout missing");
assert(funnelHtml.includes("position:sticky"),"Fixed top offer ribbon missing");
const photo="https://example.org/portrait-with-permission.jpg";
const updated=normalizeLanding({...funnel,ribbonAnimated:true,ribbonSpeed:24,bonuses:["Arquivo de referências adicionais"],
 testimonials:[{author:"Pessoa de Teste",city:"Campinas",state:"SP",photo,quote:"Relato autorizado sobre o material.",confirmed:true}]});
const filledHtml=renderLandingHtml(updated,false);
assert(filledHtml.includes('id="bonus"')&&filledHtml.includes('id="depoimentos"'),
 "Real bonuses and testimonials must be editable and visible");
assert(filledHtml.includes("Pessoa de Teste")&&filledHtml.includes("Campinas, SP")&&
 filledHtml.includes("portrait-with-permission.jpg"),"Full reviewer photo, name, location or quote missing");
assert(filledHtml.includes("ip-top-motion")&&filledHtml.includes("ip-ticker-track")&&
 filledHtml.includes("animation:ip-marquee")&&filledHtml.includes("prefers-reduced-motion:reduce"),
 "Configurable accessible animated marquee is missing");
assert(filledHtml.includes("grid-template-columns:minmax(0,1fr)")&&
 filledHtml.includes("ip-hero-grid>div:first-child")&&filledHtml.includes("text-align:center"),
 "Central hero axis must work on desktop and mobile");
const staticHtml=renderLandingHtml(normalizeLanding({...updated,ribbonAnimated:false}),false);
assert(!staticHtml.includes('class="ip-top ip-top-motion"'),"Static marquee option ignored");
for(const fragment of [
 {confirmed:false},{author:"Pessoa"},{city:""},{state:""},{photo:""}
]){
 const tampered=normalizeLanding({...updated,testimonials:[{...updated.testimonials[0],...fragment}]});
 assert(!renderLandingHtml(tampered,false).includes('id="depoimentos"'),
  "Published page disclosed unconfirmed or incomplete fake social proof");
}
const nicheInfo=loaded.exports.analyzeLandingBrief("Projetos para Serralheria",
 "Pacote com 5000 projetos de serralheria por 19,90");
assert(nicheInfo.niche==="Serralheria"&&nicheInfo.testimonialAngles.some(x=>/serralheria/.test(x)),
 "Niche intelligence failed to identify metalwork-specific review themes");
const marketing=loaded.exports.analyzeLandingBrief("Treinamento Meta Ads",
 "Curso de marketing digital e tráfego pago para lojas online");
assert(marketing.niche==="Marketing digital"&&marketing.benefits.join().toLowerCase().includes("marketing"),
 "Marketing niche must produce different content than metalwork niche");
const gastronomy=loaded.exports.analyzeLandingBrief("Receitas da Semana","Coleção de 50 receitas de confeitaria");
assert(gastronomy.niche==="Gastronomia"&&gastronomy.testimonialAngles.join().includes("receitas"),
 "Culinary niche needs cooking-specific testimonial prompts");
const legacy=normalizeLanding({...funnel,salesPage:false});
assert(renderLandingHtml(legacy).includes('data-kind="course"'),
 "Old course landing layout must remain backward compatible");
const universal=loaded.exports.newUniversalLanding(
 "5000 Projetos de Serralheria","Pacote com 5000 projetos de serralheria em arquivos digitais", "19,90");
assert(universal.templateVersion==="universal-v1","New three-field landing did not select original ZIP template");
assert(universal.price==="R$ 19,90","User price was not normalized");
const universalHtml=renderLandingHtml(universal,true);
assert(universalHtml.includes('landing-universal/hero.webp')&&
 universalHtml.includes('landing-universal/offer.webp')&&
 universalHtml.includes('landing-universal/people.webp'),
 "Supplied template assets are missing");
assert(universalHtml.includes("Bricolage Grotesque")&&
 universalHtml.includes("DM Sans")&&
 universalHtml.includes('id="oferta"')&&
 universalHtml.includes("5000 Projetos de Serralheria"),
 "Original design typography, offer and personalized headline missing");
assert(!universalHtml.includes("Mariana Souza")&&!universalHtml.includes("87% das vagas ocupadas")&&
 !universalHtml.includes("R$ 497"),
 "The original template's fictitious testimonials/discounts leaked into the new page");
assert(universalHtml.includes('href="/landing-universal/complete-utilities.css"'),
 "Universal landing must load the complete original Tailwind layout classes");
const utilities=readFileSync(resolve(root,"public/landing-universal/complete-utilities.css"),"utf8");
for(const selector of [".size-4 {",".size-5 {",".size-12 {",".flex {",".grid {",".gap-4 {",".px-5 {",".max-w-6xl {",".rounded-3xl {"]){
 assert(utilities.includes(selector),"Missing compiled Tailwind utility for mobile and SVG layout: "+selector);
}
assert(utilities.includes('@media (width >= 40rem)')&&utilities.includes('@media (width >= 48rem)'),
 "Original desktop/tablet responsive breakpoints not compiled");
assert(!universalHtml.includes("Bônus a confirmar 03")&&!universalHtml.includes("Cliente ilustrativo 04"),
 "Demo bonus and review cards must not flood the mobile preview");
assert(universalHtml.includes("Adicione fotos e depoimentos verdadeiros autorizados"),
 "Preview must explain why verified customer images are missing");
assert(!renderLandingHtml(universal,false).includes("Quem aplicou, conta"),
 "Published page must not invent testimonials");
console.log("Landing runtime PASS: 6 presets, 3 niches, truthful offer copy, checkout vs contact CTAs, layered mockup, responsive layout, verified reviews and legacy pages.");
