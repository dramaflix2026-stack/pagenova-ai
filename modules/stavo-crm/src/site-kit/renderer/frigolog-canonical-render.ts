/**
 * Exact HTML/DOM of the PageNova /templates/universal FRIGOLOG component.
 * We SSR the GENERATED COPY of that very same source, and include the exact
 * approved CSS. Preview, published snapshots and ZIP call this one function.
 * No clone markup or hand-estimated typography/cards live in this module.
 */
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import type { SiteSchemaModel, SiteSection } from '@site-kit/schemas/site-schema';
import type { RenderContext } from '@site-kit/primitives/render-utils';
import { escapeHtml } from '@site-kit/primitives/render-utils';
import UniversalFrigologTemplate from './frigolog-react.generated';
import { validateUniversalSiteData } from './frigolog-template-data.generated';
import { adaptCrmToFrigolog } from './frigolog-crm-adapter';
import { FRIGOLOG_SOURCE_FINGERPRINT, FRIGOLOG_APPROVED_CSS } from './frigolog-style.generated';

export { FRIGOLOG_APPROVED_CSS };

const sectionByVisualId:Record<string,SiteSection['type']>={
  inicio:'hero',servicos:'services',sobre:'about',operacao:'process',contato:'cta',
};

/** Keep inline typography edits keyed by CRM section, just like other templates. */
function bindVisualTextEdits(
  html:string,model:SiteSchemaModel,
  applyText:(html:string,id:string,model:SiteSchemaModel)=>string
):string {
  return html.replace(
    /(<section\b[^>]*\bid="(inicio|servicos|sobre|operacao|contato)"[^>]*>)([\s\S]*?)(<\/section>)/g,
    (match,open:string,anchor:string,body:string,close:string)=>{
      const type=sectionByVisualId[anchor];
      const section=model.sections.find(s=>s.visible && s.type===type);
      if(!section) return match;
      return open+applyText(body,section.id,model)+close;
    }
  );
}

export function renderCanonicalFrigolog(
  model:SiteSchemaModel,ctx:RenderContext,
  applyText:(html:string,id:string,model:SiteSchemaModel)=>string
):string {
  if(!FRIGOLOG_APPROVED_CSS || FRIGOLOG_SOURCE_FINGERPRINT==='not-synchronized') {
    throw new Error('FRIGOLOG original nao sincronizado: execute sync-frigolog-master no build.');
  }
  const data=adaptCrmToFrigolog(model,ctx);
  const problems=validateUniversalSiteData(data);
  if(problems.length) throw new Error('Dados do FRIGOLOG invalidados: '+problems.join(', '));
  const html=renderToStaticMarkup(createElement(UniversalFrigologTemplate,{data}));
  const editable=bindVisualTextEdits(html,model,applyText);
  return '<!-- FRIGOLOG canonical source '+escapeHtml(FRIGOLOG_SOURCE_FINGERPRINT)+' -->\n'+editable;
}

/** The React preview handles onClick; static published HTML uses natural links
 * and this small progressive enhancement to open the existing mobile menu.
 */
export const FRIGOLOG_STATIC_RUNTIME=String.raw`(function(){
  // Graceful fallback for images that disappeared after a cloud redeploy.
  // No image is silently swapped for an unrelated stock/refrigeration photo.
  document.querySelectorAll('.frigolog-template img[data-pn-photo]').forEach(function(img){
    function unavailable(){
      img.hidden=true;
      var section=img.closest('section');
      if(section)section.classList.add('pn-photo-missing');
    }
    img.addEventListener('error',unavailable);
    if(img.complete && img.naturalWidth===0)unavailable();
  });
  // Autoplay works in published HTML/ZIP, which intentionally has no React
  // hydration. Native scroll and three visual copies provide a seamless loop
  // in both directions without interfering with visitors' touch gestures.
  document.querySelectorAll('.frigolog-template [data-pn-kpi-rail]').forEach(function(rail){
    var mobile=window.matchMedia('(max-width:767px)');
    var reduced=window.matchMedia('(prefers-reduced-motion: reduce)');
    var hoverCapable=window.matchMedia('(hover:hover)');
    var count=Number(rail.getAttribute('data-pn-kpi-count')||4);
    var period=0,positioned=false,lastFrame=0,pausedUntil=0;
    var pointerDown=false,hovering=false,focused=false,visible=true;
    var mouseDragX=null,mouseDragScroll=0;
    function measure(){
      var first=rail.children[0],repeat=rail.children[count];
      period=first&&repeat?repeat.offsetLeft-first.offsetLeft:0;
      if(!mobile.matches||period<=0){positioned=false;return;}
      if(!positioned){rail.scrollLeft=period;positioned=true;}
    }
    function recenter(){
      if(period<=0)return;
      while(rail.scrollLeft<period)rail.scrollLeft+=period;
      while(rail.scrollLeft>=period*2)rail.scrollLeft-=period;
    }
    function pause(){pausedUntil=window.performance.now()+4000;}
    function down(event){
      pointerDown=true;pause();
      if(event.pointerType==='mouse'&&mobile.matches){
        mouseDragX=event.clientX;mouseDragScroll=rail.scrollLeft;
      }
    }
    function move(event){
      if(mouseDragX===null||!pointerDown)return;
      rail.scrollLeft=mouseDragScroll-(event.clientX-mouseDragX);
      event.preventDefault();
    }
    function up(){pointerDown=false;mouseDragX=null;pause();}
    function enter(){if(hoverCapable.matches)hovering=true;}
    function leave(){hovering=false;up();}
    function focus(){focused=true;}
    function blur(){focused=false;pause();}
    function tick(time){
      var elapsed=lastFrame?Math.min(time-lastFrame,48):0;
      lastFrame=time;
      if(mobile.matches&&!reduced.matches&&visible&&!document.hidden&&positioned&&
          !pointerDown&&!hovering&&!focused&&time>=pausedUntil){
        recenter();
        rail.scrollLeft+=22*elapsed/1000;
        recenter();
      }
      window.requestAnimationFrame(tick);
    }
    if(typeof IntersectionObserver!=='undefined'){
      var observer=new IntersectionObserver(function(entries){
        visible=Boolean(entries[0]&&entries[0].isIntersecting);
      },{threshold:0});
      observer.observe(rail);
    }
    rail.addEventListener('pointerdown',down);
    rail.addEventListener('pointermove',move);
    rail.addEventListener('pointerup',up);
    rail.addEventListener('pointercancel',up);
    rail.addEventListener('pointerenter',enter);
    rail.addEventListener('pointerleave',leave);
    rail.addEventListener('focusin',focus);
    rail.addEventListener('focusout',blur);
    rail.addEventListener('wheel',pause,{passive:true});
    window.addEventListener('resize',measure);
    measure();
    window.requestAnimationFrame(tick);
  });
  var button=document.querySelector('[data-pn-menu-toggle]');
  var menu=document.querySelector('[data-pn-mobile-menu]');
  if(!button||!menu)return;
  button.addEventListener('click',function(){
    var expanded=button.getAttribute('aria-expanded')==='true';
    button.setAttribute('aria-expanded',String(!expanded));
    menu.hidden=expanded;
  });
  menu.addEventListener('click',function(e){
    if(e.target.closest('a')){
      menu.hidden=true;
      button.setAttribute('aria-expanded','false');
    }
  });
})();`;
