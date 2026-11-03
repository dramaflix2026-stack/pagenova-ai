const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),Module=require('node:module'),ts=require('typescript'),React=require('react');
const {renderToStaticMarkup}=require('react-dom/server');
const root=path.resolve(__dirname,'..'),originalResolve=Module._resolveFilename;
Module._resolveFilename=function(request,parent,...rest){return originalResolve.call(this,request.startsWith('@/')?path.join(root,'src',request.slice(2)):request,parent,...rest);};
for(const extension of ['.ts','.tsx'])require.extensions[extension]=(module,filename)=>module._compile(ts.transpileModule(fs.readFileSync(filename,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,jsx:ts.JsxEmit.ReactJSX,target:ts.ScriptTarget.ES2022,esModuleInterop:true}}).outputText,filename);
require.extensions['.css']=()=>{};
const {applyUniversalNaturalLanguage}=require('../src/lib/builder-v2-universal-language.ts');
const make=(id,type,section,text,extra={})=>({id,type,section,text,color:'#ffffff',align:'left',...extra});
const original={title:'Gastronomia QA',niche:'Restaurante',templateId:'prompt-adaptive',background:'#ffffff',blocks:[
 make('hero-title','heading','inicio','Título anterior'),make('hero-description','paragraph','inicio','Descrição anterior'),make('hero-image','image','inicio','',{src:'https://example.com/old.png'}),make('hero-button','button','inicio','Conhecer',{href:'#contato'}),
 make('faq-title','heading','faq','Perguntas frequentes'),make('faq-item','paragraph','faq','Aceita encomendas? Consulte nossa equipe pelo canal cadastrado.'),
 make('about-title','heading','sobre','Sobre QA'),make('about-description','paragraph','sobre','Descrição sobre QA'),make('gallery-title','heading','galeria','Galeria cadastrada'),make('gallery-image','image','galeria','',{src:'https://example.com/gallery.png'}),make('contact-title','heading','contato','Contato')
]};
const edit=applyUniversalNaturalLanguage(original,'Troque o título da capa para "Título editado QA", troque a descrição da capa para "Descrição editada QA", deixe os botões pretos, defina o tamanho da fonte do título da capa para 64px, defina o tamanho da fonte mobile do título da capa para 32px e defina o alinhamento do título da capa para centro');
assert.equal(edit?.ok,true,edit?.error);
const site=JSON.parse(JSON.stringify(edit.site)),load=require('cheerio').load,renders=[];
for(const variant of [1,2,3]){
 const Component=require('../src/components/builder-v2-tp3-model'+variant+'.tsx')['BuilderV2TP3Model'+variant];
 const html=renderToStaticMarkup(React.createElement(Component,{site})), $=load(html);
 assert.equal($('h1').text(),'Título editado QA');
 assert.equal($('[data-block-id="hero-description"]').text(),'Descrição editada QA');
 assert.match($('[data-block-id="hero-button"]').attr('style'),/background-color:#000000/);
 assert.match($('h1').attr('style'),/--pn-edit-desktop-size:64px/);
 assert.match($('h1').attr('style'),/--pn-edit-mobile-size:32px/);
 assert.match($('h1').attr('style'),/text-align:center/);
 if(variant>1){assert.ok(html.includes('Aceita encomendas?'));assert.ok(html.includes('Consulte nossa equipe pelo canal cadastrado.'));}
 if(variant===3)assert.ok(html.includes('Galeria cadastrada'));
 const structural=applyUniversalNaturalLanguage(site,'Remova a seção inicio e mova a galeria para antes da seção Sobre QA');
 assert.equal(structural?.ok,true,structural?.error);
 const structuralSite=JSON.parse(JSON.stringify(structural.site));
 const structuralHtml=renderToStaticMarkup(React.createElement(Component,{site:structuralSite}));
 const moved=load(structuralHtml);
 assert.equal(moved('[data-universal-section="inicio"]').length,0,'Removed hero must not return from a fixed template fallback');
 const order=moved('[data-universal-section]').map((_,element)=>moved(element).attr('data-universal-section')).get();
 assert.equal(order.indexOf('galeria'),order.indexOf('sobre')-1);
 assert.equal(moved('header').length,1);assert.ok(structuralHtml.includes('Gastronomia QA'));
 renders.push({variant,html});
}
(async()=>{
 const chromium=require('@sparticuz/chromium').default;
 const browser=await require('playwright-core').chromium.launch({executablePath:fs.existsSync('/tmp/chromium')?'/tmp/chromium':await chromium.executablePath(),args:chromium.args,headless:true});
 try{
  const page=await browser.newPage();await page.route('https://**/*',route=>route.abort());
  for(const {variant,html} of renders){
   const css=variant>1?fs.readFileSync(path.join(root,'src/components/builder-v2-tp3-model'+variant+'.css'),'utf8'):'';
   for(const width of [1440,820,390]){
    await page.setViewportSize({width,height:900});await page.setContent('<!doctype html><meta name="viewport" content="width=device-width, initial-scale=1"><style>'+css+'</style>'+html);
    const metrics=await page.evaluate(()=>({font:getComputedStyle(document.querySelector('h1')).fontSize,align:getComputedStyle(document.querySelector('h1')).textAlign,button:getComputedStyle(document.querySelector('[data-block-id="hero-button"]')).backgroundColor,overflow:document.documentElement.scrollWidth>innerWidth+1}));
    assert.equal(metrics.font,width<768?'32px':'64px');assert.equal(metrics.align,'center');assert.equal(metrics.button,'rgb(0, 0, 0)');
    if(variant>1)assert.equal(metrics.overflow,false,JSON.stringify({variant,width,...metrics}));
    if(process.env.BUILDER_QA_OUTPUT){fs.mkdirSync(process.env.BUILDER_QA_OUTPUT,{recursive:true});await page.screenshot({path:path.join(process.env.BUILDER_QA_OUTPUT,`tp3-model${variant}-${width}.png`),fullPage:true});}
   }
  }
  console.log('PASS: 3 real TP3 renderers; copy/CTA/FAQ/gallery, real section removal/reorder, JSON round trip, typography at 1440/820/390px, no horizontal overflow in models 02/03.');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
