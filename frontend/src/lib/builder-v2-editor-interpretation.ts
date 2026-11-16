/**
 * PageNova Universal Editor — delivery 03/15.
 * Records a bounded interpretation of the user's request, NOT proof that the AI,
 * DOM or renderer acted on that interpretation. The source is explicitly rules-v1.
 * Reads only the privacy-filtered excerpt produced in delivery 02; never stores
 * quoted customer copy, URLs, private image sources or arbitrary property values.
 */
import {isSafeEditorInstruction,type SafeEditorInstruction} from "./builder-v2-editor-safe-instruction.ts";
import type {UniversalFeedbackIntent,UniversalFeedbackTarget} from "./builder-v2-universal-feedback.ts";

export type EditorElementType="section"|"heading"|"paragraph"|"button"|"image"|"card";
export type EditorProperty="backgroundColor"|"color"|"text"|"src"|"align"|"order"|"presence"|"count";
export type EditorRequestedValueKind="hex"|"named-color"|"alignment"|"count";
export type EditorInterpretationContext={
 familyId:number|null;
 templateId:"institutional-complete"|"minimalist-sophisticated"|"prompt-adaptive"|null;
 model:"01"|"02"|"03"|null;
};
export type EditorCommandInterpretation={
 source:"rules-v1";
 status:"explicit"|"partial"|"unavailable";
 element:EditorElementType|null;
 property:EditorProperty|null;
 requestedValueKind:EditorRequestedValueKind|null;
 requestedValue:string|null;
 familyId:number|null;
 templateId:EditorInterpretationContext["templateId"];
};
const allowedTemplates=new Set(["institutional-complete","minimalist-sophisticated","prompt-adaptive"]);
const accents=(v:string)=>v.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
const namedColors=new Set(["azul","verde","vermelho","preto","branco","cinza","grafite","laranja","amarelo","dourado","roxo","rosa","bege","marrom"]);
const requestedColor=(text:string):{kind:"hex"|"named-color";value:string}|null=>{
 const hexes=[...text.matchAll(/#[0-9a-fA-F]{6}(?![0-9a-fA-F])/g)].map(m=>m[0].toUpperCase());
 const named=(text.match(/[\p{L}\p{M}]+/gu)||[]).map(accents).filter(word=>namedColors.has(word));
 if(hexes.length+named.length!==1)return null;
 return hexes.length?{kind:"hex",value:hexes[0]}:{kind:"named-color",value:named[0]};
};
/** Never trust arbitrary app/project/template strings as a learning context. */
export function safeEditorInterpretationContext(candidate:unknown):EditorInterpretationContext|null{
 if(!candidate||typeof candidate!=="object")return null;
 const input=candidate as Partial<EditorInterpretationContext>;
 if(input.familyId!==null&&(!Number.isInteger(input.familyId)||Number(input.familyId)<1||Number(input.familyId)>10))return null;
 if(input.templateId!==null&&!(typeof input.templateId==="string"&&allowedTemplates.has(input.templateId)))return null;
 if(input.model!==null&&!["01","02","03"].includes(String(input.model)))return null;
 return {familyId:input.familyId,templateId:input.templateId,model:input.model} as EditorInterpretationContext;
}
const allowedElements=new Set(["section","heading","paragraph","button","image","card"]);
const allowedProperties=new Set(["backgroundColor","color","text","src","align","order","presence","count"]);
export function interpretEditorFeedback(
 feedback:{intent:UniversalFeedbackIntent;target:UniversalFeedbackTarget;sectionKey?:string},
 excerpt:SafeEditorInstruction|unknown,
 context:EditorInterpretationContext|null|undefined
):EditorCommandInterpretation{
 const safeContext=safeEditorInterpretationContext(context);
 const base:EditorCommandInterpretation={
  source:"rules-v1",status:"unavailable",element:null,property:null,
  requestedValueKind:null,requestedValue:null,
  familyId:safeContext?.familyId??null,templateId:safeContext?.templateId??null
 };
 // Unknown/private content remains unknown; the existing intent/target columns
 // still carry the original classifier result, separately from this evidence.
 if(!isSafeEditorInstruction(excerpt)||excerpt.status!=="stored")return base;
 const t=accents(excerpt.text);
 let element:EditorElementType|null=null,property:EditorProperty|null=null;
 if(feedback.intent==="style"){
  if(/\b(?:fundo|background)\b/.test(t)){
   element=feedback.target==="buttons"?"button":feedback.target==="unspecified"?null:"section";
   property=feedback.target==="buttons"?"backgroundColor":"backgroundColor";
  }else if(/\bcor(?:es)?\b/.test(t)){
   if(/\b(?:titulo|subtitulo)\b/.test(t))element="heading";
   else if(feedback.target==="buttons")element="button";
   else if(/\b(?:texto|letra|fonte)\b/.test(t))element="paragraph";
   property=element?"color":null;
  }
 }else if(feedback.intent==="copy"){
  if(/\b(?:titulo|subtitulo)\b/.test(t))element="heading";
  else if(/\b(?:texto|paragrafo|descricao|frase|slogan)\b/.test(t))element="paragraph";
  else if(feedback.target==="buttons")element="button";
  property=element?"text":null;
 }else if(feedback.intent==="image"){
  if(/\b(?:imagem|foto|fotografia|banner|capa)\b/.test(t)){element="image";property="src";}
 }else if(feedback.intent==="layout"){
  if(/\b(?:centraliz\w*|alinh\w*|alinhamento)\b/.test(t)){
   element=/\b(?:titulo|subtitulo)\b/.test(t)?"heading":feedback.target==="buttons"?"button":null;
   property=element?"align":null;
  }else if(/\b(?:mova|mover|ordem|reposicion\w*|reorden\w*)\b/.test(t)){
   element=feedback.target==="unspecified"?null:"section";property=element?"order":null;
  }
 }else if(feedback.intent==="add-section"||feedback.intent==="remove-section"){
  element=/\b(?:card|cards)\b/.test(t)?"card":/\b(?:secao|bloco)\b/.test(t)?"section":null;
  property=element?"presence":null;
 }
 let requestedValueKind:EditorRequestedValueKind|null=null,requestedValue:string|null=null;
 if(property==="color"||property==="backgroundColor"){
  const color=requestedColor(t);
  if(color){requestedValueKind=color.kind;requestedValue=color.value;}
 }
 if(property==="presence"&&element==="card"){
  const numbers=[...t.matchAll(/\b[0-9]{1,2}\b/g)].map(match=>match[0]);
  if(numbers.length===1&&/^(?:[1-9]|[1-9][0-9])$/.test(numbers[0])){
   requestedValueKind="count";requestedValue=numbers[0];
  }
 }
 if(property==="align"){
  const alignments=[
   ...(/\bcentraliz\w*\b|\bcentro\b/.test(t)?["center"]:[]),
   ...(/\besquerda\b/.test(t)?["left"]:[]),
   ...(/\bdireita\b/.test(t)?["right"]:[])
  ];
  if(alignments.length===1){requestedValueKind="alignment";requestedValue=alignments[0];}
 }
 // A structure request has an explicit action, but individual customer copy,
 // image source, position target and counts are intentionally NOT recovered
 // from potentially private text unless a separately verified adapter exists.
 const explicit=!!(element&&property&&(
  requestedValue!==null||property==="presence"||property==="text"||property==="src"
 ));
 return {...base,element,property,requestedValueKind,requestedValue,
  status:explicit?"explicit":"partial"};
}
export function isValidEditorInterpretation(value:unknown):value is EditorCommandInterpretation{
 if(!value||typeof value!=="object")return false;
 const x=value as Partial<EditorCommandInterpretation>;
 if(x.source!=="rules-v1"||!["explicit","partial","unavailable"].includes(String(x.status)))return false;
 if(x.element!==null&&(typeof x.element!=="string"||!allowedElements.has(x.element)))return false;
 if(x.property!==null&&(typeof x.property!=="string"||!allowedProperties.has(x.property)))return false;
 if(x.familyId!==null&&(!Number.isInteger(x.familyId)||Number(x.familyId)<1||Number(x.familyId)>10))return false;
 if(x.templateId!==null&&(typeof x.templateId!=="string"||!allowedTemplates.has(x.templateId)))return false;
 if(x.requestedValueKind===null)return x.requestedValue===null;
 if(typeof x.requestedValue!=="string")return false;
 if(x.property===null)return false;
 if(x.requestedValueKind==="hex")return ["backgroundColor","color"].includes(x.property)&&/^#[0-9A-F]{6}$/.test(x.requestedValue);
 if(x.requestedValueKind==="named-color")return ["backgroundColor","color"].includes(x.property)&&namedColors.has(x.requestedValue);
 if(x.requestedValueKind==="alignment")return x.property==="align"&&["left","center","right"].includes(x.requestedValue);
 if(x.requestedValueKind==="count")return ["presence","count"].includes(x.property)&&/^(?:[1-9]|[1-9][0-9])$/.test(x.requestedValue);
 return false;
}
