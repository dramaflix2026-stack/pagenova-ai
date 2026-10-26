/**
 * Deterministic institutional photography edits. Never send customer photographs to
 * image generation or let an LLM rewrite unrelated blocks.
 */
export type InstitutionalMediaBlock = {
  id:string; type:"heading"|"paragraph"|"button"|"image"; text:string;
  color:string; align:"left"|"center"|"right"; section?:string; src?:string;
  mobileSrc?:string; forCardId?:string; imageFit?:"contain"|"cover";
  imagePosition?:string; userUploaded?:boolean;
};
export type HeroComposition = "single"|"duo"|"trio";
export type MediaLayout = "grid"|"mosaic"|"carousel";
export type InstitutionalMediaSite = {
  blocks:InstitutionalMediaBlock[];heroComposition?:HeroComposition;
  sectionMediaLayouts?:Record<string,MediaLayout>;
  sectionMediaManaged?:string[];
};
const norm=(value:string)=>value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
const numberWord=(value:string|undefined)=>{
  if(!value)return undefined;
  const n=Number(value);
  if(Number.isInteger(n)&&n>0)return n-1;
  const key=norm(value).replace(/[^a-z]/g,"");
  const names:Record<string,number>={primeiro:0,primeira:0,segundo:1,segunda:1,terceiro:2,terceira:2,quarto:3,quarta:3,quinto:4,quinta:4,sexto:5,sexta:5};
  return names[key];
};
const ordinalPattern="(primeir[oa]|segund[oa]|terceir[oa]|quart[oa]|quint[oa]|sext[oa]|[1-9][0-9]?)";
const imageNoun="(?:foto|imagem|fotografia)";
const sectionOf=(b:InstitutionalMediaBlock)=>b.section||"principal";
const isImage=(b:InstitutionalMediaBlock)=>b.type==="image";
const isCard=(b:InstitutionalMediaBlock)=>b.type==="paragraph";
const hasPositiveImageAction=(s:string)=>/(?:troqu|substitu|adicion|inclu|coloc|insir|remov|exclu|apag|mova|reorden|inver|altere|ajust|transform|use|usar|deix|restaur|mostr|organize|configure)/.test(s);
function targetSection(blocks:InstitutionalMediaBlock[],s:string){
  const ids=[...new Set(blocks.map(sectionOf))];
  const hero=sectionOf(blocks.find(b=>b.type==="heading")||blocks[0]);
  if(/\b(capa|hero|banner|home|inicio|principal)\b/.test(s))return hero;
  const entries=ids.map(id=>({id,label:norm(id+" "+blocks.filter(b=>sectionOf(b)===id&&b.type==="heading").map(b=>b.text).join(" "))}));
  for(const [pattern,category] of [
    [/servic|tratament|especialidad/,"servic"],
    [/sobre.nos|sobre|apresenta|empresa/,"sobre"],
    [/galeria|portfoli|portfolio|trabalhos|projetos/,"galeria"],
    [/diferencia|benefici/,"diferencia"],
    [/process|etapa|passos/,"process"],
    [/contato|fale/,"contato"]
  ] as const){
    if(pattern.test(s)){
      const match=entries.find(entry=>entry.label.includes(category)||pattern.test(entry.label));
      if(match)return match.id;
    }
  }
  return hero;
}
function indexesForGroup(blocks:InstitutionalMediaBlock[],section:string){
  return blocks.map((block,index)=>isImage(block)&&sectionOf(block)===section?index:-1).filter(index=>index>=0);
}
function newImage(section:string,src:string,card?:string):InstitutionalMediaBlock{
  return {id:"uploaded-"+crypto.randomUUID(),type:"image",text:"Fotografia enviada pelo cliente",
    color:"#ffffff",align:"center",section,src,userUploaded:true,...(card?{forCardId:card}:{})};
}
export function institutionalImageIntent(instruction:string,hasUploads=false){
  const s=norm(instruction);
  if(hasUploads)return true;
  if(/(?:imagem|foto|fotografia)/.test(s)&&/sem\s+cort|inteir[ao]|formato\s+original/.test(s))return true;
  if(!/(?:imagem|imagens|foto|fotos|fotografia|fotografias|banner|galeria|mosaico|carrossel|enquadramento)/.test(s))return false;
  if(!hasPositiveImageAction(s)&&!/\b(duplo|triplo|duas|tres)\b/.test(s))return false;
  // Guard non-image edits containing "não altere a foto" or "preserve imagens".
  // Only image-directed verbs BEFORE the protective clause can authorize an edit.
  const protect=/(?:\b(?:nao|sem)\s+(?:alter\w*|troc\w*|modific\w*|mex\w*|substitu\w*)|\b(?:preserv\w*|mantenha|mantendo)\b)/.exec(s);
  if(protect){
    const prefix=s.slice(0,protect.index);
    if(!/(?:troqu|substitu|adicion|inclu|coloc|remov|mova|reorden|transform)[^.]{0,70}(?:foto|imagem|fotografia|banner|galeria)/.test(prefix))return false;
  }
  return true;
}
export function planInstitutionalImageEdit<T extends InstitutionalMediaSite>(site:T,instruction:string,uploads:string[]=[]):{site:T;summary:string}|null{
  const s=norm(instruction);
  if(!institutionalImageIntent(instruction,uploads.length>0))return null;
  if(!site.blocks.length)throw Error("Gere o site antes de editar fotografias.");
  if(uploads.some(src=>!/^https:\/\/[^ "'<>]+$/.test(src)))throw Error("Anexo não armazenado com segurança.");
  const blocks=structuredClone(site.blocks);
  const section=targetSection(blocks,s);
  const hero=sectionOf(blocks.find(b=>b.type==="heading")||blocks[0]);
  const sectionImages=()=>indexesForGroup(blocks,section);
  const cardRequest=s.match(new RegExp("(?:card|cartao)\\s*(?:numero\\s*)?"+ordinalPattern+"|"+ordinalPattern+"\\s*(?:card|cartao)"));
  const cardIndex=numberWord(cardRequest?.[1]||cardRequest?.[2]);
  const paragraphs=blocks.filter(b=>sectionOf(b)===section&&isCard(b)&&b.text.trim().length>0);
  const targetCard=cardIndex!==undefined?paragraphs[cardIndex]:undefined;
  if(cardRequest&&!targetCard)throw Error("Não encontrei esse card na seção indicada. Nenhuma imagem foi alterada.");
  const mobileOnly=/\b(?:somente|apenas|so)\s+(?:no\s+|a\s+|para\s+)?mobile\b|\bimagem\s+mobile\b|\bfoto\s+mobile\b/.test(s)&&!/\bdesktop\b/.test(s);
  const imageMention=s.match(new RegExp("(?:foto|imagem|fotografia)\\s*(?:numero\\s*)?"+ordinalPattern+"|"+ordinalPattern+"\\s*(?:foto|imagem|fotografia)"));
  const photoIndex=numberWord(imageMention?.[1]||imageMention?.[2]);
  const layout:HeroComposition|undefined=/\b(?:triplo|tres|3)\s*(?:banner|fotos|fotografias|imagens)|(?:capa|banner)[^.]{0,45}\b(?:tres|3)\s*(?:foto|imagem)/.test(s)?"trio":
    /\b(?:duplo|duas|dois|2)\s*(?:banner|fotos|fotografias|imagens)|(?:capa|banner)[^.]{0,45}\b(?:duas|2)\s*(?:foto|imagem)/.test(s)?"duo":
    /\b(?:banner|capa)\s+(?:unico|simples|com\s+uma\s+(?:foto|imagem))/.test(s)?"single":undefined;
  const fit=/sem\s+cort|inteir[ao]|formato\s+original|object.contain/.test(s)?"contain" as const:
    /preench|recort|corte\s+central|object.cover/.test(s)?"cover" as const:undefined;
  const remove=/\b(?:remov|exclu|apag|retir|tire)\w*/.test(s);
  const reorder=/\b(?:reorden|mova|inver|troque\s+a\s+ordem)\w*/.test(s);
  const isGallery=/galeria|portfoli|portfolio/.test(norm(section));
  const mediaLayout:MediaLayout|undefined=/\bcarrossel\b/.test(s)?"carousel":/\bmosaico\b/.test(s)?"mosaic":
    /galeria\s+(?:em\s+)?grade|galeria\s+grid/.test(s)?"grid":undefined;
  if(uploads.length>6)throw Error("Envie até seis imagens por edição.");
  if(uploads.length&&!hasPositiveImageAction(s)&&!layout&&!(s.includes("anex")&&s.includes("capa")))
    throw Error("Indique onde usar as fotos anexadas: capa, seção ou card. Nenhuma imagem foi alterada.");
  if(!uploads.length&&!layout&&!fit&&!remove&&!reorder&&!mediaLayout)
    throw Error("Anexe as imagens ou indique uma alteração visual específica.");
  const updated={...site,blocks} as T;
  const findCardImage=()=>targetCard?blocks.findIndex(b=>isImage(b)&&b.forCardId===targetCard.id):-1;
  const selectedImage=()=>{
    const index=findCardImage();
    if(index>=0)return index;
    const list=sectionImages().filter(i=>!blocks[i].forCardId);
    return list[photoIndex??0]??-1;
  };
  const changes:string[]=[];
  if(uploads.length){
    if(targetCard&&uploads.length!==1)throw Error("Envie uma foto por card para evitar substituições ambíguas.");
    const replace=/\b(?:troqu|substitu|reempla|altere)\w*/.test(s)&&!/\b(?:adicione|inclua|acrescente)\b/.test(s);
    if(mobileOnly&&uploads.length!==1)throw Error("Para trocar apenas a imagem mobile, envie uma foto.");
    const desired=layout==="duo"?2:layout==="trio"?3:1;
    const replaceSlots=layout&&section===hero&&uploads.length>=desired?sectionImages().filter(index=>!blocks[index].forCardId):[];
    for(let i=0;i<uploads.length;i++){
      const existing=selectedImage();
      if(mobileOnly){
        if(existing<0)throw Error("Não há imagem desktop correspondente para criar a versão mobile.");
        blocks[existing].mobileSrc=uploads[i];
        blocks[existing].userUploaded=true;
      }else if(targetCard){
        const assigned=findCardImage();
        if(assigned>=0){blocks[assigned].src=uploads[i];delete blocks[assigned].mobileSrc;blocks[assigned].userUploaded=true;}
        else blocks.push(newImage(section,uploads[i],targetCard.id));
      }else if(replaceSlots[i]!==undefined){
        blocks[replaceSlots[i]].src=uploads[i];delete blocks[replaceSlots[i]].mobileSrc;
        blocks[replaceSlots[i]].userUploaded=true;
      }else if(replace&&uploads.length===1&&existing>=0&&!layout){
        blocks[existing].src=uploads[i];delete blocks[existing].mobileSrc;
        blocks[existing].userUploaded=true;
      }else{
        const image=newImage(section,uploads[i]);
        const last=blocks.findLastIndex(b=>sectionOf(b)===section);
        blocks.splice(last+1,0,image);
      }
    }
    changes.push(uploads.length+" imagem(ns) armazenada(s) e aplicada(s)");
  }
  if(remove){
    if(uploads.length)throw Error("Envie remoções e adições em comandos separados.");
    const index=selectedImage();
    if(index<0)throw Error("Não há imagem nessa posição para remover.");
    blocks.splice(index,1);changes.push("imagem removida");
  }
  if(reorder){
    if(uploads.length)throw Error("Reordene as fotos em outro comando para preservar a ordem dos anexos.");
    const match=s.match(new RegExp("(?:mova|mover|coloque)\\s+(?:a\\s+)?(?:(?:foto|imagem|fotografia)\\s*)?"+ordinalPattern+"\\s*(?:foto|imagem|fotografia)?[^.]{0,55}?(?:posicao|lugar|foto|imagem)\\s*"+ordinalPattern));
    const from=numberWord(match?.[1])??photoIndex;
    const to=numberWord(match?.[2]);
    const positions=sectionImages().filter(i=>!blocks[i].forCardId);
    if(from===undefined||to===undefined||from>=positions.length||to>=positions.length)
      throw Error("Informe origem e destino, como 'mova a foto 3 para a posição 1'.");
    const reordered=positions.map(i=>blocks[i]);
    const [moved]=reordered.splice(from,1);reordered.splice(to,0,moved);
    positions.forEach((pos,i)=>blocks[pos]=reordered[i]);
    changes.push("ordem das fotografias atualizada");
  }
  if(fit){
    const selected=targetCard?findCardImage():selectedImage();
    const indexes=layout&&section===hero?sectionImages():selected>=0?[selected]:[];
    if(!indexes.length)throw Error("Não há imagem para alterar o enquadramento.");
    indexes.forEach(i=>blocks[i].imageFit=fit);
    changes.push(fit==="contain"?"enquadramento integral, sem cortes":"preenchimento ajustado");
  }
  if(layout){
    if(section!==hero)throw Error("Duplo e triplo banner são configurações da capa. Indique a capa na mensagem.");
    const required=layout==="duo"?2:layout==="trio"?3:1;
    if(sectionImages().filter(i=>!!blocks[i].src).length<required)throw Error("A capa precisa de "+required+" fotografias. Anexe as fotos que faltam.");
    updated.heroComposition=layout;
    changes.push("capa "+(layout==="duo"?"dupla":layout==="trio"?"tripla":"simples"));
  }
  if(mediaLayout){
    updated.sectionMediaLayouts={...site.sectionMediaLayouts,[section]:mediaLayout};
    changes.push("disposição "+mediaLayout);
  }
  if(isGallery||mediaLayout)updated.sectionMediaManaged=[...new Set([...(site.sectionMediaManaged||[]),section])];
  if(!changes.length)throw Error("Nenhuma alteração de imagem foi identificada.");
  return {site:updated,summary:changes.join("; ")+". Textos, botões e outras seções preservados."};
}
