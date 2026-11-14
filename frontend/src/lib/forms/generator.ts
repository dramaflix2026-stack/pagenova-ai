import {normalizeForm,type FormInput,type FormQuestion,type FormKind} from "@/lib/forms/schema";
import {localForm} from "@/lib/studio/local-engine";

/** Forms-only interpretation. Do not change the shared Studio engine. */
const plain=(s:string)=>s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
const field=(id:number,label:string,type:FormQuestion["type"],required:boolean,options:string[]=[]):FormQuestion=>({id:"q-"+id,label,type,required,options});
const titleFrom=(prompt:string)=>{
 const explicit=/\*\*T[ií]tulo:\*\*\s*([^\n]+)/i.exec(prompt)||/^T[ií]tulo:\s*(.+)$/im.exec(prompt);
 if(explicit)return explicit[1].trim().replace(/\*\*/g,"").slice(0,100);
 const name=/\b(?:chamad[ao]|nomead[ao])\s+\*{0,2}["“]?([^\n,."]{3,60})/i.exec(prompt);
 return name?"Formulário — "+name[1].replace(/\*+/g,"").trim():"Solicite seu atendimento";
};
function inferKind(prompt:string):FormKind{
 const p=plain(prompt);
 if(/pesquisa de satisfacao|avaliar (?:a |o )?experiencia|coletar feedback|pesquisa nps/.test(p))return "survey";
 if(/inscricao|candidatura|processo seletivo/.test(p))return "application";
 if(/quiz interativo|teste de personalidade/.test(p))return "quiz";
 return "leads";
}
function parseFieldLine(line:string,id:number):FormQuestion|null{
 const cleaned=line.replace(/^\s*(?:[-*]\s*)?(?:\d{1,2}[.)]\s*)/,"").replace(/\*\*/g,"").trim();
 const m=/^([^—–:]+?)\s*[—–:]\s*(.*)$/.exec(cleaned);
 if(!m)return null;
 const label=m[1].trim(),details=m[2].trim();
 if(label.length<3||label.length>150)return null;
 const p=plain(label+" "+details);
 const optionsMatch=/(?:op[cç][oõ]es|sele[cç][aã]o(?: obrigat[oó]ria)?|alternativas)\s*:\s*(.+)/i.exec(details);
 const options=optionsMatch?optionsMatch[1].split(/\s*,\s*|\s*;\s*|\s+ou\s+/i).map(s=>s.trim().replace(/[.]$/,"")).filter(Boolean).slice(0,12):[];
 const type:FormQuestion["type"]=options.length>=2?"select":/e-?mail/.test(p)?"email":/whatsapp|telefone|celular/.test(p)?"tel":/texto longo|descricao|observac|mensagem|comentario/.test(p)?"textarea":"text";
 const required=!/opcional|facultativo|nao obrigatorio/.test(plain(details));
 return field(id,label,type,required,options);
}
export function generatePageNovaForm(prompt:string,existing?:FormInput|null):FormInput{
 if(existing)return localForm(prompt,existing);
 const lines=prompt.split(/\r?\n/);
 const start=lines.findIndex(line=>/\*{0,2}(?:campos do formul[aá]rio|perguntas do formul[aá]rio|campos solicitados)\*{0,2}\s*:/i.test(line));
 const selected:string[]=[];
 if(start>=0){
  for(const line of lines.slice(start+1)){
   if(/^\s*(?:\*{0,2}(?:personaliza[cç][aã]o|ap[oó]s o envio|identidade visual|observa[cç][oõ]es)\b)/i.test(line))break;
   if(/^\s*\d{1,2}[.)]\s+/.test(line))selected.push(line);
  }
 }
 const parsed=selected.map((line,i)=>parseFieldLine(line,i+1)).filter((q):q is FormQuestion=>Boolean(q));
 if(!parsed.length)return localForm(prompt);
 const explicitDescription=/\*\*Descri[cç][aã]o:\*\*\s*([^\n]+)/i.exec(prompt)||/^Descri[cç][aã]o:\s*(.+)$/im.exec(prompt);
 const p=plain(prompt);
 return normalizeForm({
  title:titleFrom(prompt),
  description:explicitDescription?explicitDescription[1].replace(/\*\*/g,"").trim():"Preencha seus dados para que nossa equipe entre em contato.",
  kind:inferKind(prompt),fields:parsed,intent:prompt,whatsapp:"",
  visualTheme:/preto|dourado|luxo|noturno|black/.test(p)?"midnight":/rose|rosa/.test(p)?"rose":"emerald",motion:true
 });
}
