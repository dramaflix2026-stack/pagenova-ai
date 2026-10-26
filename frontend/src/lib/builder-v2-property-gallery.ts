export type PropertyPhotoFields={id:string;title:string;location:string;image:string;images?:string[]};
const normalize=(value:string)=>value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLocaleLowerCase("pt-BR").trim();
export const MAX_PHOTOS_PER_PROPERTY=24;
export const MAX_PHOTOS_PER_UPLOAD=8;
export function getPropertyPhotos(property:PropertyPhotoFields):string[]{
  const urls=Array.isArray(property.images)&&property.images.length?property.images:property.image?[property.image]:[];
  return [...new Set(urls.filter((url):url is string=>typeof url==="string"&&/^https:\/\//i.test(url)))].slice(0,MAX_PHOTOS_PER_PROPERTY);
}
export function withPropertyPhotos<P extends PropertyPhotoFields>(property:P,images:string[]):P{
  const unique=[...new Set(images.filter(url=>/^https:\/\//i.test(url)))].slice(0,MAX_PHOTOS_PER_PROPERTY);
  return {...property,image:unique[0]||"",images:unique};
}
export function findPropertyForPhotos<P extends PropertyPhotoFields>(properties:P[],instruction:string):number{
  const text=normalize(instruction);
  const indexed=text.match(/\b(?:imovel|casa|apartamento|terreno|sobrado|cobertura|card)\s*(?:n(?:umero|[º°.])\s*)?#?\s*(\d{1,3})\b/i);
  if(indexed){
    const index=Number(indexed[1])-1;
    return index>=0&&index<properties.length?index:-1;
  }
  // A single property is unambiguous without a number.
  if(properties.length===1)return 0;
  const matches=properties.map((property,i)=>({i,location:normalize(property.location),title:normalize(property.title)}))
    .filter(item=>(item.location.length>=4&&text.includes(item.location))||(item.title.length>=9&&text.includes(item.title)));
  return matches.length===1?matches[0].i:-1;
}
const ordinals:Record<string,number>={primeira:0,primeiro:0,segunda:1,segundo:1,terceira:2,terceiro:2,quarta:3,quarto:3,quinta:4,quinto:4,sexta:5,sexto:5,setima:6,setimo:6,oitava:7,oitavo:7,nona:8,nono:8,decima:9,decimo:9};
export function photoIndexFromInstruction(instruction:string):number|undefined{
  const text=normalize(instruction);
  const numeric=text.match(/\b(?:foto|imagem)\s*(?:n(?:umero|[º°.])\s*)?#?\s*(\d{1,2})\b/);
  const ordinal=text.match(/\b(primeira|primeiro|segunda|segundo|terceira|terceiro|quarta|quarto|quinta|quinto|sexta|sexto|setima|setimo|oitava|oitavo|nona|nono|decima|decimo)\s+(?:foto|imagem)\b|\b(?:foto|imagem)\s+(primeira|primeiro|segunda|segundo|terceira|terceiro|quarta|quarto|quinta|quinto|sexta|sexto|setima|setimo|oitava|oitavo|nona|nono|decima|decimo)\b/);
  if(ordinal&&(!numeric||(ordinal.index??Infinity)<(numeric.index??Infinity)))return ordinals[ordinal[1]||ordinal[2]];
  if(numeric)return Number(numeric[1])-1;
  if(ordinal)return ordinals[ordinal[1]||ordinal[2]];
  const describedCover=text.match(/\b(primeira|primeiro|segunda|segundo|terceira|terceiro|quarta|quarto|quinta|quinto|sexta|sexto|setima|setimo|oitava|oitavo|nona|nono|decima|decimo)\b.{0,32}\bcapa\b/);
  if(describedCover)return ordinals[describedCover[1]];
  if(/\b(?:foto|imagem)\s+(?:principal|de capa)\b|\b(?:capa|foto principal)\b/.test(text))return 0;
  return undefined;
}
export function looksLikePhotoInstruction(instruction:string):boolean{
  const lines=normalize(instruction).split(/[.!?\n]+/);
  return lines.some(line=>{
    // Constraints such as "preserve as fotos" must never override a price or text edit.
    const actionable=line.split(/\b(?:preserv\w*|mantenh\w*|mantend\w*|sem alterar|sem mexer|nao alter\w*|nao mex\w*|nao modific\w*|nao (?:use|usar|coloc\w*|remov\w*|adicione))\b/)[0].trim();
    const action=/\b(?:use|usar|deix|adicion|inclu|anex|coloc|envi|defin|torn|escolh|troqu|substitu|alter|mud|remov|retir|apag|exclu|mov|reorden|organiz)\w*/;
    const photo=/\b(?:foto|fotos|imagem|imagens|capa|galeria)\b/;
    return photo.test(actionable)&&action.test(actionable);
  });
}
export function photoAction(instruction:string,hasUpload:boolean):"add"|"replace"|"remove"|"clear"|"cover"|"reorder"|"help"{
  const text=normalize(instruction);
  if(/\b(?:remov|retir|apag|exclu)\w*/.test(text)){
    if(/\b(?:todas|todos)\s+(?:as\s+|os\s+)?(?:fotos|imagens)\b/.test(text))return "clear";
    return "remove";
  }
  if(hasUpload){
    return /\b(?:troqu|substitu)\w*/.test(text)?"replace":"add";
  }
  if(/\b(?:troqu|substitu)\w*/.test(text)&&!/\b(?:capa|principal)\b/.test(text))return "help";
  if(/\b(?:mov|coloc|reposicion|reorden|organiz)\w*/.test(text)&&/\b(?:antes|depois)\b/.test(text)&&/\b(?:foto|imagem)\b/.test(text))return "reorder";
  if(/\b(?:capa|principal|primeira|segunda|terceira|quarta|quinta|sexta|setima|oitava|\d+)\b/.test(text)&&/\b(?:use|usar|deix|defin|torn|escolh|coloc|mov|alter|mud|troqu)\w*/.test(text))return "cover";
  return "help";
}
