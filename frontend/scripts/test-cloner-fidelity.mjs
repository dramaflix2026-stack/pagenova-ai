/** Browser-free faithful clone regression. No network and no customer data. */
import {createRequire} from "node:module";
import {readFileSync} from "node:fs";
import {dirname,resolve} from "node:path";
import {fileURLToPath} from "node:url";
const root=resolve(dirname(fileURLToPath(import.meta.url)),"..");
const require=createRequire(resolve(root,"package.json"));
const ts=require("typescript");
const mod={exports:{}};
const output=ts.transpileModule(readFileSync(resolve(root,"src/server/services/faithful-cloner.ts"),"utf8"),{
 compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022,esModuleInterop:true}
}).outputText;
new Function("require","module","exports","Buffer",output)(require,mod,mod.exports,Buffer);
const {createFaithfulVisual,stylesheetLinks,absolutizeCss}=mod.exports;
function assert(condition,message){if(!condition)throw Error(message);}
const source="https://example.org/amigurumi?utm_source=ads";
const cssUrl="https://example.org/wp-content/uploads/elementor/css/post-18.css";
const raw='<!doctype html><html><head><title>Amigurumi</title>'+
 '<meta name="viewport" content="width=device-width,initial-scale=1">'+
 '<link rel="preload" as="style" href="/wp-content/uploads/elementor/css/post-18.css">'+
 '<link rel="stylesheet" href="/wp-content/themes/theme.css">'+
 '<style>.hero{color:#bc8995;background-image:url("../assets/hero.webp")}</style>'+
 '<script>window.evil=true</script></head><body>'+
 '<main class="landing-original"><section class="hero elementor-invisible" data-aos="fade-up" style="opacity:0;visibility:hidden;min-height:950px">'+
 '<h1>Mais que Artesanato. Um Novo Propósito de Vida.</h1>'+
 '<p>Aprenda amigurumi com um método completo.</p>'+
 '<img src="data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///ywAAAAAAQABAAACAUwAOw==" data-src="/wp-content/uploads/samara-real.jpg" alt="Samara Souza">'+
 '<img src="https://example.org/hero2.jpg" alt="Receitas">'+
 '<a class="cta" href="/checkout">Quero me inscrever</a>'+
 '</section><section class="cards"><h2>O que você vai aprender</h2>'+
 '<div class="card">Módulo 1</div><div class="card">Módulo 2</div></section>'+
 '<span class="__cf_email__" data-cfemail="">'+
 '[email protected]</span>'+
 '<form action="https://example.org/exfil"><input name="email"><button>Enviar</button></form>'+
 '<div style="background-image:url(/assets/footer-bg.webp)">Rodapé</div>'+
 '<iframe src="https://example.org/unsafe"></iframe>'+
 '</main></body></html>';
const links=stylesheetLinks(raw,source);
assert(links.length===2&&links[0]===cssUrl,"Stylesheet/preload discovery failed");
const stylesheet='@media(max-width:720px){.hero{display:grid;grid-template-columns:1fr}}'+
 ' .card{border-radius:15px;background-image:url(../images/card.png)}'+
 '@import url("https://malicious.test/tracker.css");';
const safeCss=absolutizeCss(stylesheet,cssUrl);
assert(safeCss.includes("https://example.org/wp-content/uploads/elementor/images/card.png"),
 "CSS relative image URLs were not rebased");
assert(!safeCss.includes("malicious.test"),"CSS remote imports must be dropped");
const page=createFaithfulVisual(raw,source,[safeCss]);
assert(page.visualHtml.includes('class="landing-original"'),"Original main wrapper was replaced");
assert(page.visualHtml.includes('class="hero"')&&!page.visualHtml.includes('class="hero elementor-invisible"'),
 "Static clone did not reveal animation-hidden content");
assert(!page.visualHtml.includes('style="opacity:0;visibility:hidden'),
 "Inline animation visibility was left hidden");
assert(page.visualHtml.includes("@media (max-width:767px)")&&page.visualHtml.includes("min-height:0!important"),
 "Mobile Elementor height/overflow recovery is missing");
assert(page.visualHtml.includes('class="hero"')&&page.visualHtml.includes('class="cards"'),
 "Original section hierarchy was lost");
assert(page.visualHtml.includes("Um Novo Propósito de Vida."),"Original headline lost");
assert(!page.visualHtml.includes("SEÇÃO 01")&&!page.visualHtml.includes('class="block"'),
 "PageNova generic reconstructed template was used");
assert(page.visualHtml.includes("#bc8995"),"Inline original design colors lost");
assert(page.visualHtml.includes("@media(max-width:720px)"),"Responsive media query lost");
assert(page.visualHtml.includes("https://example.org/wp-content/uploads/elementor/images/card.png"),
 "Original stylesheet images were lost");
assert(page.visualHtml.includes('src="https://example.org/wp-content/uploads/samara-real.jpg"'),
 "Lazy photo was not recovered");
assert(page.visualHtml.includes('href="https://example.org/checkout"'),"CTA link lost");
assert(!page.visualHtml.includes("<script")&&!page.visualHtml.includes("<iframe")&&!page.visualHtml.includes("<form"),
 "Source executable/tracking content leaked");
assert(!page.visualHtml.includes('action="https://example.org/exfil"'),
 "Live source form must be neutralized");
assert(page.recoveredImages===1&&page.detectedImages===2,"Image recovery metrics incorrect");
assert(page.visualHtml.includes("https://example.org/assets/footer-bg.webp"),
 "Inline background image was not resolved");
console.log("CLONER FIDELITY PASS: real DOM hierarchy, Elementor CSS, mobile media, lazy assets, inert forms, safe CTA, no scripts.");
