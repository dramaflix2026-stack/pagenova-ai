(function(){
"use strict";
const cfg=window.__PAGENOVA_PUBLISHED_OVERLAY__;
if(!cfg||typeof cfg!=="object")return;
function find(selector){try{return document.querySelector(selector);}catch{return null;}}
function textNode(el){return el&&el.matches("h1,h2,h3,h4,h5,h6,p,li,blockquote,small,strong,a,span,button,[data-pn-free-text=true]");}
function apply(edit){
 if(!edit||typeof edit.selector!=="string")return;
 const el=find(edit.selector);if(!el)return;
 if(textNode(el)){
  if(typeof edit.text==="string"&&edit.text)el.textContent=edit.text;
  if(edit.font)el.style.setProperty("font-family",edit.font,"important");
  if(Number.isFinite(edit.size))el.style.setProperty("font-size",edit.size+"px","important");
  if(/^#[a-f0-9]{6}$/i.test(edit.color||""))el.style.setProperty("color",edit.color,"important");
  if(edit.textAlign)el.style.setProperty("text-align",edit.textAlign,"important");
  if(edit.fontWeight)el.style.setProperty("font-weight",String(edit.fontWeight),"important");
 }
 if(Number.isFinite(edit.offsetX)&&Number.isFinite(edit.offsetY)&&(edit.offsetX||edit.offsetY)){
  el.style.setProperty("transform","translate3d("+edit.offsetX+"px,"+edit.offsetY+"px,0)","important");
 }
 if(edit.width>0&&edit.kind!=="section"){
  el.style.setProperty("max-width","100%","important");
  el.style.setProperty("width",edit.width+"px","important");
 }
 if(edit.kind==="section"&&edit.height>0)el.style.setProperty("min-height",Math.max(40,edit.height)+"px","important");
 if(edit.kind!=="text"&&edit.kind!=="section"&&edit.height>0)el.style.setProperty("min-height",Math.max(18,edit.height)+"px","important");
}
function kind(text){
 const s=String(text||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/\s+/g," ");
 return s.includes("foto do negocio")?"work":s.includes("foto principal")?"hero":"";
}
function slotFor(k){
 const marked=document.querySelector('[data-pn-photo-slot="'+k+'"]');
 if(marked)return marked;
 const nodes=Array.from(document.querySelectorAll("div,span,p,button"));
 for(const label of nodes){
  const t=(label.textContent||"").trim();
  if(t.length>=80||kind(t)!==k)continue;
  let node=label;
  for(let i=0;i<6&&node;i++,node=node.parentElement){
   if(node===document.body||node.matches("section,article,main"))break;
   const r=node.getBoundingClientRect();
   if(r.width<130||r.height<100||r.height>560)continue;
   const cs=getComputedStyle(node);
   if(["borderTopStyle","borderBottomStyle","borderLeftStyle","borderRightStyle"].some(p=>cs[p]!=="none"))return node;
  }
 }
 return null;
}
function photo(k,src){
 if(typeof src!=="string"||!/^data:image\/(png|jpeg|webp);base64,/.test(src))return;
 const slot=slotFor(k);if(!slot)return;
 slot.dataset.pnPhotoSlot=k;
 let img=slot.querySelector('img[data-pn-uploaded="'+k+'"]');
 if(!img){
  Array.from(slot.children).forEach(child=>child.style.setProperty("display","none","important"));
  img=document.createElement("img");img.dataset.pnUploaded=k;slot.appendChild(img);
 }
 slot.style.setProperty("position","relative");
 slot.style.setProperty("overflow","hidden");
 for(const p of ["height","max-height","aspect-ratio"])slot.style.setProperty(p,"auto","important");
 slot.style.setProperty("min-height","0","important");
 slot.style.setProperty("padding","0","important");
 img.style.cssText="display:block!important;width:100%!important;height:auto!important;max-width:100%!important;max-height:none!important;min-height:0!important;object-fit:contain!important;aspect-ratio:auto!important;border-radius:inherit";
 img.src=src;
}
function init(){
 const page=cfg.page||"home";
 const edits=cfg.pages&&cfg.pages[page];
 if(Array.isArray(edits))edits.forEach(apply);
 const images=cfg.images||{};
 photo("hero",images.portrait);photo("work",images.businessPhoto);
}
if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init,{once:true});
else init();
})();