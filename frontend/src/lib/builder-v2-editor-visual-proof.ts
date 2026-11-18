/** Delivery 06/15: render-backed postconditions for the five Universal Editor edits.
 * Never turn a changed JSON field, parser success or preview absence into proof.
 * Contracts contain only values needed for transient checking; do not persist copy.
 */
import type {UniversalSite,UniversalBlock} from './builder-v2-universal-operations.ts';
import {findUniversalPreviewSections,universalSectionDomIdMatches} from './builder-v2-universal-preview-sections.ts';

type ProofTask =
 | {kind:'block-text';id:string;text:string}
 | {kind:'block-color';id:string;color:string;property:'color'|'backgroundColor'}
 | {kind:'block-align';id:string;align:'left'|'center'|'right';button:boolean}
 | {kind:'block-image';id:string;src:string}
 | {kind:'block-present';id:string}
 | {kind:'block-absent';id:string}
 | {kind:'section-absent';section:string}
 | {kind:'section-new';section:string;heading:string;cardTitles:string[];cardImages?:string[];preceding?:string;following?:string}
 | {kind:'section-color';section:string;color:string;target:'background'|'heading'}
 | {kind:'cta-color';color:string};
export type UniversalVisualProof={version:1;tasks:ProofTask[]};
export type UniversalVisualProofResult={ok:boolean;reason:string};
const hex=(v:unknown):v is string=>typeof v==='string'&&/^#[0-9a-fA-F]{6}$/.test(v);
const normalize=(v:string)=>v.normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/\s+/g,' ').trim().toLowerCase();
const styleMap=(site:UniversalSite)=>site.universalSectionStyles as Record<string,{backgroundColor?:string;headingColor?:string}>|undefined;

/** Generate obligations from the committed mutation, not from an untrusted AI claim. */
export function planUniversalVisualProof(before:UniversalSite,after:UniversalSite,changedIds:readonly string[]):{ok:true;contract:UniversalVisualProof}|{ok:false;reason:string}{
 const fail=(reason:string)=>({ok:false as const,reason});
 if(!changedIds.length)return fail('Nenhuma modificação declarada para verificar.');
 const old=new Map(before.blocks.map(b=>[b.id,b]));
 const next=new Map(after.blocks.map(b=>[b.id,b]));
 const tasks:ProofTask[]=[];
 const handledCustom=new Set<string>();
 const removedSections=new Set<string>();
 const initialSections=new Set(before.blocks.map(b=>b.section).filter(Boolean));
 const customSections=new Set(after.blocks.filter(b=>b.section?.startsWith('custom-')&&!initialSections.has(b.section)).map(b=>b.section!));
 for(const id of changedIds){
  if(id==='primary-cta-theme'){
   const color=after.universalPrimaryCtaColor;
   if(!hex(color))return fail('Cor dos CTAs não verificável.');
   tasks.push({kind:'cta-color',color});continue;
  }
  if(id.startsWith('section-style:')||id.startsWith('section-heading-color:')){
   const heading=id.startsWith('section-heading-color:');
   const section=id.slice(id.indexOf(':')+1);
   const styles=styleMap(after)?.[section];
   const color=heading?styles?.headingColor:styles?.backgroundColor;
   if(!section||!hex(color))return fail('Estilo de seção sem cor verificável.');
   tasks.push({kind:'section-color',section,color,target:heading?'heading':'background'});continue;
  }
  const previous=old.get(id),current=next.get(id);
  if(!previous&&!current)return fail('Bloco inexistente no resultado.');
  if(current?.section&&customSections.has(current.section)){
   if(handledCustom.has(current.section))continue;
   handledCustom.add(current.section);
   const section=current.section;
   const blocks=after.blocks.filter(b=>b.section===section);
   const heading=blocks.find(b=>b.type==='heading');
   if(!heading?.text)return fail('Nova seção não possui título verificável.');
   const titles=blocks.filter(b=>b.type==='heading').slice(1).map(b=>b.text||'');
   const teamImages=blocks.filter(b=>b.type==='paragraph'&&typeof b.src==='string').map(b=>b.src!);
   if(teamImages.length>0&&(teamImages.length!==titles.length||teamImages.some(src=>!/^https:\/\//i.test(src))))
    return fail('As fotos dos cards não estão completas e verificáveis.');
   const placement=[...(after.universalSectionEvents||[])].reverse().find(event=>event.action==='move'&&event.section.id===section);
   const start=after.blocks.findIndex(b=>b.section===section);
   const end=after.blocks.findLastIndex(b=>b.section===section);
   const preceding=placement?.after?.id||(placement?undefined:after.blocks.slice(0,start).reverse().find(b=>b.section&&b.section!==section)?.section);
   const following=placement?.before?.id||(placement?undefined:after.blocks.slice(end+1).find(b=>b.section&&b.section!==section)?.section);
   tasks.push({kind:'section-new',section,heading:heading.text,cardTitles:titles,...(teamImages.length?{cardImages:teamImages}:{}),...(preceding?{preceding}:{}),...(following?{following}:{})});continue;
  }
  if(!current&&previous){
   if(previous.section&&!after.blocks.some(b=>b.section===previous.section)){
    if(!removedSections.has(previous.section))tasks.push({kind:'section-absent',section:previous.section});
    removedSections.add(previous.section);
   }else tasks.push({kind:'block-absent',id});
   continue;
  }
  if(current&&!previous){
   tasks.push({kind:'block-present',id});
   if(current.text&&current.type!=='image')tasks.push({kind:'block-text',id,text:current.text});
   if(current.type==='image'&&current.src)tasks.push({kind:'block-image',id,src:current.src});
   continue;
  }
  if(!previous||!current)return fail('Alteração não verificável.');
  let count=0;
  const newlyProjectedHero=after.universalHeroHeadingBlockId===id&&before.universalHeroHeadingBlockId!==id;
  if((current.text!==previous.text||newlyProjectedHero||(current.textExplicit===true&&previous.textExplicit!==true))&&current.type!=='image'){
   if(typeof current.text!=='string')return fail('Texto resultante inválido.');
   tasks.push({kind:'block-text',id,text:current.text});count++;
  }
  for(const [field,property] of [['color',current.type==='button'?'backgroundColor':'color'],['textColor','color'],['background','backgroundColor']] as const){
   if(current[field]!==previous[field]){
    if(!hex(current[field]))return fail('Cor resultante não verificável.');
    tasks.push({kind:'block-color',id,color:current[field],property});count++;
   }
  }
  if(current.align!==previous.align){
   if(!['left','center','right'].includes(current.align||''))return fail('Alinhamento não verificável.');
   tasks.push({kind:'block-align',id,align:current.align as 'left'|'center'|'right',button:current.type==='button'});count++;
  }
  if(current.src!==previous.src){
   if(typeof current.src!=='string'||!current.src)return fail('Imagem não verificável.');
   tasks.push({kind:'block-image',id,src:current.src});count++;
  }
  if(!count)return fail('Esta alteração não possui pós-condição visual verificável.');
 }
 if(!tasks.length)return fail('Nenhuma pós-condição visual encontrada.');
 return {ok:true,contract:{version:1,tasks}};
}

/** Inspect only the actual preview iframe DOM and computed styles. */
export function auditUniversalVisualProof(root:ParentNode,win:Pick<Window,'getComputedStyle'>,contract:UniversalVisualProof):UniversalVisualProofResult{
 const fail=(reason:string)=>({ok:false,reason});
 if(contract.version!==1||!contract.tasks.length)return fail('Contrato visual inválido.');
 const visible=(el:HTMLElement)=>el.getClientRects().length>0&&win.getComputedStyle(el).display!=='none'&&win.getComputedStyle(el).visibility!=='hidden';
 const blocks=Array.from(root.querySelectorAll<HTMLElement>('[data-block-id]'));
 const block=(id:string)=>blocks.filter(el=>el.getAttribute('data-block-id')===id&&visible(el));
 const sections=Array.from(root.querySelectorAll<HTMLElement>('section'));
 const section=(id:string)=>sections.filter(el=>visible(el)&&[el.id,el.getAttribute('data-universal-section')||'',el.getAttribute('data-section-id')||''].some(value=>universalSectionDomIdMatches(id,value)||normalize(value)===normalize(id)));
 const rgb=(c:string)=>c.match(/\d+(?:\.\d+)?/g)?.slice(0,3).map(Number)||[];
 const matches=(actual:string,expected:string)=>{
  const desired=[1,3,5].map(i=>parseInt(expected.slice(i,i+2),16)),current=rgb(actual);
  return current.length===3&&desired.every((channel,index)=>channel===Math.round(current[index]));
 };
 for(const task of contract.tasks){
  if(task.kind==='section-absent'){
   if(section(task.section).length)return fail('Seção removida ainda aparece na prévia.');continue;
  }
  if(task.kind==='section-new'){
   const matches=section(task.section);
   if(matches.length!==1)return fail('Seção adicionada ausente ou duplicada na prévia.');
   const target=matches[0];
   if(normalize(target.querySelector('h1,h2,h3')?.textContent||'')!==normalize(task.heading))return fail('Título da nova seção não corresponde ao pedido.');
   const actualCards=Array.from(target.querySelectorAll('article')).map(el=>normalize(el.querySelector('h3,h4')?.textContent||''));
   if(actualCards.length!==task.cardTitles.length||actualCards.some((v,i)=>v!==normalize(task.cardTitles[i])))return fail('Quantidade ou títulos dos cards não conferem.');
   if(task.cardImages?.length){
    const cards=Array.from(target.querySelectorAll('article'));
    if(cards.length!==task.cardImages.length||cards.some((card,i)=>{
     const image=card.querySelector('img');
     return !image||image.getAttribute('src')!==task.cardImages![i]||!image.complete||image.naturalWidth<=0;
    }))return fail('Uma ou mais fotos dos cards não estão carregadas na prévia.');
   }
   if(task.preceding){const previous=section(task.preceding);if(previous.length!==1||!(previous[0].compareDocumentPosition(target)&4))return fail('Nova seção não aparece após a seção de referência.');}
   if(task.following){const following=section(task.following);if(following.length!==1||!(target.compareDocumentPosition(following[0])&4))return fail('Nova seção não aparece antes da próxima seção.');}
   continue;
  }
  if(task.kind==='section-color'){
   const found=findUniversalPreviewSections(root,task.section);
   if(found.length!==1)return fail('Seção de cor não localizada de forma única.');
   const targets=task.target==='heading'?Array.from(found[0].querySelectorAll<HTMLElement>('h1,h2,h3')):[found[0]];
   if(!targets.length||!targets.some(el=>visible(el)&&matches(win.getComputedStyle(el)[task.target==='heading'?'color':'backgroundColor'],task.color)))return fail('Cor renderizada diferente do solicitado.');
   continue;
  }
  if(task.kind==='cta-color'){
   const buttons=Array.from(root.querySelectorAll<HTMLElement>('a[data-cta],button[data-cta],[data-primary-cta],a[class*="cta" i],button[class*="primary" i]'));
   if(!buttons.some(el=>visible(el)&&matches(win.getComputedStyle(el).backgroundColor,task.color)))return fail('Cor do CTA principal não comprovada na prévia.');
   continue;
  }
  const elements=block(task.id);
  if(task.kind==='block-absent'){
   if(elements.length)return fail('Bloco removido ainda está renderizado.');continue;
  }
  if(elements.length!==1)return fail('Bloco editado ausente ou duplicado na prévia.');
  const element=elements[0];
  if(task.kind==='block-present')continue;
  if(task.kind==='block-text'&&normalize(element.textContent||'')!==normalize(task.text))return fail('Texto renderizado diferente do texto solicitado.');
  if(task.kind==='block-color'&&!matches(win.getComputedStyle(element)[task.property],task.color))return fail('Cor do bloco não foi renderizada corretamente.');
  if(task.kind==='block-align'){
   if(win.getComputedStyle(element).textAlign!==task.align)return fail('Alinhamento do bloco não corresponde ao pedido.');
   if(task.button){
    const parent=element.parentElement,box=element.getBoundingClientRect(),container=parent?.getBoundingClientRect();
    if(!container||container.width<=0)return fail('Posição do botão não pôde ser medida.');
    const margin=18;
    if(task.align==='center'&&Math.abs((box.left+box.right-container.left-container.right)/2)>margin)return fail('Botão não centralizado na seção.');
    if(task.align==='left'&&Math.abs(box.left-container.left)>margin)return fail('Botão não alinhado à esquerda.');
    if(task.align==='right'&&Math.abs(box.right-container.right)>margin)return fail('Botão não alinhado à direita.');
   }
  }
  if(task.kind==='block-image'){
   const images=(element.tagName==='IMG'?[element as HTMLImageElement]:Array.from(element.querySelectorAll('img'))) as HTMLImageElement[];
   const expected=task.src;
   const srcMatches=(url:string)=>{
    if(url===expected)return true;
    try{const u=new URL(url,'https://preview.invalid');return u.pathname==='/_next/image'&&u.searchParams.get('url')===expected;}catch{return false;}
   };
   if(!images.some(img=>srcMatches(img.getAttribute('src')||'')&&img.complete&&img.naturalWidth>0))return fail('Fotografia solicitada ausente ou não carregada na prévia.');
  }
 }
 return {ok:true,reason:'Mudanças renderizadas e verificadas na prévia.'};
}
