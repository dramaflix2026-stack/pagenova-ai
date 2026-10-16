/**
 * Inline editing layer for Landing Pages. The base HTML/template remains intact.
 * Overrides are keyed to the original DOM order, so editor-only controls
 * never leak into published pages. The preview sandbox communicates edits
 * through postMessage; no access to the parent DOM is required.
 */
export type LandingInlineEdit={
 text?:string;color?:string;fontSize?:string;fontFamily?:string;href?:string;image?:string;
};
export type LandingInlineEdits=Record<string,LandingInlineEdit>;
export type LandingInsertedImage={id:string;afterId:string;src:string};
export function normalizeInsertedImages(input:unknown):LandingInsertedImage[]{
 if(!Array.isArray(input))return [];
 const images:LandingInsertedImage[]=[],seen=new Set<string>();
 let remaining=1_300_000;
 for(const raw of input.slice(0,8)){
  if(!raw||typeof raw!=="object")continue;
  const {id,afterId,src}=raw as Record<string,unknown>;
  if(typeof id!=="string"||!/^i[a-z0-9]{8,40}$/.test(id)||seen.has(id)||
     typeof afterId!=="string"||!/^e\d{1,5}$/.test(afterId)||
     typeof src!=="string"||!/^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(src)||
     src.length>480_000||src.length>remaining)continue;
  images.push({id,afterId,src});seen.add(id);remaining-=src.length;
 }
 return images;
}


export function normalizeInlineEdits(input:unknown):LandingInlineEdits{
 const output:LandingInlineEdits={};
 if(!input||typeof input!=="object"||Array.isArray(input))return output;
 let imageBudget=1_800_000;
 for(const [id,value] of Object.entries(input).slice(0,240)){
  if(!/^e\d{1,5}$/.test(id)||!value||typeof value!=="object"||Array.isArray(value))continue;
  const v=value as LandingInlineEdit,clean:LandingInlineEdit={};
  if(typeof v.text==="string")clean.text=v.text.replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g,"").slice(0,1200);
  if(typeof v.color==="string"&&/^#[0-9a-fA-F]{6}$/.test(v.color))clean.color=v.color;
  if(typeof v.fontSize==="string"&&/^(?:[1-9]\d?|1[0-2]\d)px$/.test(v.fontSize))clean.fontSize=v.fontSize;
  if(typeof v.fontFamily==="string"&&["inherit","Arial","Georgia","Poppins","DM Sans","Bricolage Grotesque","Instrument Serif"].includes(v.fontFamily))clean.fontFamily=v.fontFamily;
  if(typeof v.href==="string"){
   const h=v.href.trim().slice(0,1500);
   if(/^#[a-z0-9_-]+$/i.test(h))clean.href=h;
   else{try{const u=new URL(h);if(u.protocol==="https:")clean.href=u.href;}catch{/* invalid URL */}}
  }
  if(typeof v.image==="string"&&/^data:image\/(?:png|jpeg|webp);base64,[A-Za-z0-9+/=]+$/.test(v.image)&&v.image.length<=550_000&&v.image.length<=imageBudget){
   clean.image=v.image;imageBudget-=v.image.length;
  }
  if(Object.keys(clean).length)output[id]=clean;
 }
 return output;
}

/** Injects only trusted, constant JavaScript plus JSON-escaped user data. */
export function withLandingInlineEditor(html:string,edits:LandingInlineEdits|undefined,preview:boolean,images?:LandingInsertedImage[]):string{
 const normalized=normalizeInlineEdits(edits);
 const uploads=normalizeInsertedImages(images);
 if(!preview&&!Object.keys(normalized).length&&!uploads.length)return html;
 const payload=JSON.stringify(normalized).replace(/</g,"\\u003c").replace(/>/g,"\\u003e").replace(/&/g,"\\u0026");
 const uploadPayload=JSON.stringify(uploads).replace(/</g,"\\u003c").replace(/>/g,"\\u003e").replace(/&/g,"\\u0026");
 const runtime=preview?inlineRuntime:inlineRuntime.slice(0,inlineRuntime.indexOf("if(!editing)return;"))+"\n})();";
 const js=runtime.replace("__PN_EDITS__",payload).replace("__PN_UPLOADS__",uploadPayload).replace("__PN_PREVIEW__",String(preview));
 return html.replace("</body>",'<script>'+js+'</script></body>');
}

const inlineRuntime=String.raw`
(function(){
'use strict';
var editing=__PN_PREVIEW__;
var edits=__PN_EDITS__;
var inserted=__PN_UPLOADS__;
var selector='h1,h2,h3,h4,h5,p,li,small,figcaption,blockquote,span,b,strong,em,a,button,img,summary';
var elements=Array.from(document.querySelectorAll(selector));
var byId={};
elements.forEach(function(el,i){
 var id='e'+i;el.setAttribute('data-pn-inline-id',id);byId[id]=el;
});
function apply(id,change){
 var el=byId[id];if(!el)return;
 var item=edits[id]||{};
 Object.assign(item,change);edits[id]=item;
 if(typeof change.text==='string'&&el.tagName!=='IMG'){
  var mark=el.tagName==='H1'&&el.querySelector('.mark');
  var svg=el.matches('a,button')&&el.querySelector('svg');
  if(mark){
   var words=change.text.trim().split(/\s+/);
   var split=words.length>5?words.length-3:Math.max(1,words.length-2);
   var accent=mark.cloneNode(false);accent.textContent=words.slice(split).join(' ');
   el.replaceChildren(document.createTextNode(words.slice(0,split).join(' ')+' '),accent);
  }else if(svg){
   var retainedIcon=svg.cloneNode(true);
   el.replaceChildren(document.createTextNode(change.text+' '),retainedIcon);
  }else el.textContent=change.text;
 }
 if(change.color)el.style.setProperty('color',change.color,'important');
 if(change.fontSize)el.style.setProperty('font-size',change.fontSize,'important');
 if(change.fontFamily)el.style.setProperty('font-family',change.fontFamily==='inherit'?'inherit':'"'+change.fontFamily+'",sans-serif','important');
 if(change.href&&(el.matches('a,button'))){
  if(el.tagName==='A'){
   el.href=change.href;
   if(/^https:/.test(change.href)){el.target='_blank';el.rel='noopener noreferrer';}
   else{el.removeAttribute('target');el.removeAttribute('rel');}
  }else if(el.type!=='submit'){el.dataset.pnHref=change.href;}
 }
 if(change.image&&el.tagName==='IMG')el.src=change.image;
}
Object.keys(edits).forEach(function(id){apply(id,edits[id]);});
function placeImage(item){
 var anchor=byId[item.afterId];if(!anchor||!item.src||document.querySelector('[data-pn-added-image="'+item.id+'"]'))return false;
 var figure=document.createElement('figure');
 figure.setAttribute('data-pn-added-image',item.id);
 figure.style.cssText='display:block;width:min(100%,780px);margin:24px auto;text-align:center;clear:both';
 var photo=document.createElement('img');
 photo.src=item.src;photo.alt='Imagem adicionada à landing page';photo.loading='lazy';
 photo.style.cssText='display:block;width:100%;height:auto;max-height:600px;object-fit:contain;border-radius:14px;margin:auto';
 photo.setAttribute('data-pn-inline-id',item.id);byId[item.id]=photo;
 figure.appendChild(photo);
 var place=anchor.closest('figure')||anchor.closest('.frame')||anchor.closest('.ip-cover')||anchor;
 place.insertAdjacentElement('afterend',figure);
 return true;
}
inserted.forEach(placeImage);
if(!editing)return;
var active=null,toolbar=null,editingText=null;
var lastTap={id:'',at:0};
var fileInput=document.createElement('input');
fileInput.type='file';fileInput.accept='image/jpeg,image/png,image/webp';
fileInput.style.display='none';document.body.appendChild(fileInput);
var css=document.createElement('style');css.textContent=
'[data-pn-inline-id]{cursor:pointer;touch-action:manipulation}'+
'[data-pn-selected]{outline:2px solid #13cfa4!important;outline-offset:3px!important}'+
'[data-pn-editing]{outline:2px dashed #13cfa4!important;outline-offset:3px!important;cursor:text!important}'+
'#pn-inline-tools{box-sizing:border-box;position:fixed;z-index:2147483646;display:flex;gap:6px;flex-wrap:wrap;align-items:center;max-width:calc(100vw - 12px);padding:8px;border-radius:13px;background:#101a21;color:#fff;border:1px solid #3e5b56;box-shadow:0 9px 32px #0008;font:12px system-ui,sans-serif}'+
'#pn-inline-tools button,#pn-inline-tools select,#pn-inline-tools input{box-sizing:border-box;border:1px solid #43535a;border-radius:8px;background:#202e35;color:#fff;font:12px system-ui,sans-serif;min-height:34px;padding:5px 7px}'+
'#pn-inline-tools input[type=color]{width:40px;padding:4px}'+
'#pn-inline-tools input[type=url]{width:min(260px,calc(100vw - 40px));max-width:100%}'+
'#pn-inline-tools button{cursor:pointer}'+
'#pn-inline-tools .pn-url{display:flex;gap:4px;width:100%}'+
'@media(max-width:480px){#pn-inline-tools{gap:4px;padding:6px}#pn-inline-tools button,#pn-inline-tools select{font-size:11px;padding:4px}}';
document.head.appendChild(css);
function notify(id,patch){window.parent.postMessage({type:'pagenova:landing-inline-edit',id:id,patch:patch},'*');}
function position(){
 if(!toolbar||!active)return;
 var rect=active.getBoundingClientRect();
 toolbar.style.visibility='hidden';toolbar.style.left='6px';toolbar.style.top='6px';
 var width=toolbar.offsetWidth,height=toolbar.offsetHeight;
 var x=Math.min(Math.max(6,rect.left+(rect.width-width)/2),Math.max(6,window.innerWidth-width-6));
 var y=rect.top-height-9;if(y<6)y=Math.min(window.innerHeight-height-6,rect.bottom+9);
 toolbar.style.left=x+'px';toolbar.style.top=Math.max(6,y)+'px';toolbar.style.visibility='visible';
}
function makeButton(label,title,callback){
 var b=document.createElement('button');b.type='button';b.textContent=label;b.title=title;
 b.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();callback();});return b;
}
function makeSelect(options,value,handler,title){
 var s=document.createElement('select');s.title=title;s.setAttribute('aria-label',title);
 options.forEach(function(item){var o=document.createElement('option');o.value=item[0];o.textContent=item[1];s.appendChild(o);});
 s.value=value;s.addEventListener('change',function(){handler(s.value);});return s;
}
function select(el){
 if(editingText&&editingText!==el)editingText.blur();
 if(active)active.removeAttribute('data-pn-selected');
 active=el;if(!active){if(toolbar){toolbar.remove();toolbar=null;}return;}
 active.setAttribute('data-pn-selected','');
 if(toolbar)toolbar.remove();
 toolbar=document.createElement('div');toolbar.id='pn-inline-tools';toolbar.setAttribute('role','toolbar');toolbar.setAttribute('aria-label','Editar elemento selecionado');
 var id=active.dataset.pnInlineId, link=active.matches('a,button'),img=active.tagName==='IMG';
 if(img){toolbar.appendChild(makeButton('Trocar imagem','Selecionar nova imagem',function(){fileInput.click();}));}
 else{
  toolbar.appendChild(makeButton('✎','Editar texto',function(){beginText();}));
  var color=document.createElement('input');color.type='color';color.title='Cor do texto';color.setAttribute('aria-label','Cor do texto');
  var rgb=getComputedStyle(active).color.match(/\d+/g);color.value=rgb?'#'+rgb.slice(0,3).map(function(n){return Number(n).toString(16).padStart(2,'0');}).join(''):'#ffffff';
  color.addEventListener('input',function(){apply(id,{color:color.value});notify(id,{color:color.value});});toolbar.appendChild(color);
  var sizes=[['','Tamanho'],['12px','12'],['14px','14'],['16px','16'],['18px','18'],['20px','20'],['24px','24'],['28px','28'],['32px','32'],['40px','40'],['48px','48'],['56px','56'],['64px','64'],['80px','80'],['96px','96']];
  toolbar.appendChild(makeSelect(sizes,edits[id]&&edits[id].fontSize||'',function(v){if(!v)return;apply(id,{fontSize:v});notify(id,{fontSize:v});position();},'Tamanho da fonte'));
  var fonts=[['inherit','Fonte'],['Poppins','Poppins'],['Arial','Arial'],['Georgia','Georgia'],['DM Sans','DM Sans'],['Bricolage Grotesque','Bricolage'],['Instrument Serif','Instrument Serif']];
  toolbar.appendChild(makeSelect(fonts,edits[id]&&edits[id].fontFamily||'inherit',function(v){apply(id,{fontFamily:v});notify(id,{fontFamily:v});position();},'Família da fonte'));
  if(link){
   toolbar.appendChild(makeButton('🔗 Link','Editar link do botão',function(){
    var old=toolbar.querySelector('.pn-url');if(old){old.remove();position();return;}
    var line=document.createElement('div');line.className='pn-url';
    var inp=document.createElement('input');inp.type='url';inp.placeholder='https://...';inp.setAttribute('aria-label','URL de destino');
    inp.value=(edits[id]&&edits[id].href)||active.getAttribute('href')||'';
    var save=makeButton('✓','Salvar URL',function(){
     var value=inp.value.trim();var ok=/^#[a-z0-9_-]+$/i.test(value);
     if(!ok){try{ok=new URL(value).protocol==='https:';}catch(e){ok=false;}}
     if(!ok){inp.setCustomValidity('Informe uma URL HTTPS válida.');inp.reportValidity();return;}
     inp.setCustomValidity('');apply(id,{href:value});notify(id,{href:value});line.remove();position();
    });
    inp.addEventListener('keydown',function(e){if(e.key==='Enter'){e.preventDefault();save.click();}});
    line.appendChild(inp);line.appendChild(save);toolbar.appendChild(line);position();inp.focus();
   }));
  }
 }
 toolbar.appendChild(makeButton('×','Fechar ferramentas',function(){select(null);}));
 document.body.appendChild(toolbar);position();
}
function beginText(){
 if(!active||active.tagName==='IMG')return;
 if(editingText)return;
 var el=active,id=el.dataset.pnInlineId;
 var originalMarkup=el.innerHTML;
 editingText=el;el.removeAttribute('data-pn-selected');el.setAttribute('data-pn-editing','');
 el.setAttribute('contenteditable','true');el.setAttribute('spellcheck','true');el.focus();
 var range=document.createRange();range.selectNodeContents(el);range.collapse(false);
 var selection=window.getSelection();if(selection){selection.removeAllRanges();selection.addRange(range);}
 function finish(){
  el.removeEventListener('blur',finish);el.removeEventListener('keydown',keyDown);
  el.removeAttribute('contenteditable');el.removeAttribute('data-pn-editing');editingText=null;
  var text=(el.innerText||el.textContent||'').trim().slice(0,1200);
  el.innerHTML=originalMarkup;
  apply(id,{text:text});notify(id,{text:text});select(el);
 }
 function keyDown(e){if(e.key==='Escape'){e.preventDefault();el.blur();}else if(e.key==='Enter'&&!e.shiftKey){e.preventDefault();el.blur();}}
 el.addEventListener('blur',finish);el.addEventListener('keydown',keyDown);
}
function chooseTarget(target){
 if(!(target instanceof Element)||target.closest('#pn-inline-tools'))return null;
 var anchor=target.closest('a,button');if(anchor)return anchor;
 return target.closest(selector);
}
document.addEventListener('click',function(e){
 if(e.target&&e.target.closest&&e.target.closest('#pn-inline-tools'))return;
 if(editingText)return;
 var el=chooseTarget(e.target);
 if(!el){select(null);return;}
 if(el.matches('a,button')){e.preventDefault();e.stopPropagation();}
 var id=el.dataset.pnInlineId,now=Date.now();
 if(lastTap.id===id&&now-lastTap.at<470){lastTap={id:'',at:0};select(el);if(el.tagName==='IMG')fileInput.click();else beginText();}
 else{lastTap={id:id,at:now};select(el);}
},true);
document.addEventListener('submit',function(e){e.preventDefault();},true);
document.addEventListener('click',function(e){
 var b=e.target&&e.target.closest&&e.target.closest('button[data-pn-href]');
 if(b)e.preventDefault();
},true);
fileInput.addEventListener('change',function(){
 var file=fileInput.files&&fileInput.files[0];fileInput.value='';
 if(!file||!active||active.tagName!=='IMG')return;
 if(!['image/png','image/jpeg','image/webp'].includes(file.type)||file.size>3_000_000){alert('Use JPG, PNG ou WebP de até 3 MB.');return;}
 var id=active.dataset.pnInlineId,img=new Image(),url=URL.createObjectURL(file);
 img.onload=function(){
  try{
   var scale=Math.min(1,1400/Math.max(img.naturalWidth,img.naturalHeight));
   var canvas=document.createElement('canvas');canvas.width=Math.max(1,Math.round(img.naturalWidth*scale));canvas.height=Math.max(1,Math.round(img.naturalHeight*scale));
   var ctx=canvas.getContext('2d');if(!ctx)throw Error('Canvas indisponível');
   ctx.drawImage(img,0,0,canvas.width,canvas.height);
   var result=canvas.toDataURL('image/webp',.72);
   if(result.length>550000){canvas.width=Math.max(1,Math.round(canvas.width*.65));canvas.height=Math.max(1,Math.round(canvas.height*.65));ctx=canvas.getContext('2d');ctx.drawImage(img,0,0,canvas.width,canvas.height);result=canvas.toDataURL('image/webp',.62);}
   if(result.length>550000)throw Error('Imagem grande demais após compressão.');
   apply(id,{image:result});notify(id,{image:result});
  }catch(error){alert(error.message||'Não foi possível carregar a imagem.');}
  finally{URL.revokeObjectURL(url);}
 };
 img.onerror=function(){URL.revokeObjectURL(url);alert('Imagem inválida.');};
 img.src=url;
});
window.addEventListener('scroll',position,{passive:true});
window.addEventListener('resize',position,{passive:true});
window.addEventListener('message',function(e){
 if(e.source!==window.parent)return;
 var d=e.data;if(d&&d.type==='pagenova:landing-inline-clear')select(null);
});
})();`;
