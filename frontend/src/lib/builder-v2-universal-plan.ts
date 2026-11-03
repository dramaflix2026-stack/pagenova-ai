/** Quote-aware boundaries shared by the editor and API. */
const verb="(?:altere|troque|mude|substitua|remova|exclua|apague|mova|reposicione|coloque|adicione|crie|faca|faça|deixe|defina|configure|centralize|alinhe|torne|inclua|preserve|mantenha)";
const boundary=new RegExp("^(?:[,;]\\s*(?:e\\s+)?|\\s+e\\s+|\\r?\\n\\s*(?:\\d+[.)]\\s*)?)(?="+verb+"\\b)","i");

/** Split only command boundaries outside quotes. URLs, punctuation and copy stay intact. */
export function universalInstructionClauses(instruction:string):string[]{
 const clauses:string[]=[];let start=0;let quote="";
 for(let i=0;i<instruction.length;i++){
  const char=instruction[i];
  if(quote){if(char===quote||(quote==="“"&&char==="”"))quote="";continue;}
  if(char==='"'||char==="“"||(char==="'"&&!/\p{L}/u.test(instruction[i-1]||" "))){quote=char;continue;}
  // Numbered commands may be pasted as one paragraph by mobile keyboards.
  // Split at "2. Altere" or "3. Na seção ..., altere", never inside quotes.
  const numbered=instruction.slice(i).match(/^\s+(?:\d{1,2}[.)])\s+(?=(?:na\s+se[cç][aã]o\s+[^,]{1,100},\s*)?(?:altere|troque|mude|substitua|mova|reposicione|coloque|remova|adicione|crie|defina)\b)/i);
  if(numbered&&instruction.slice(start,i).trim()){
   clauses.push(instruction.slice(start,i).trim());i+=numbered[0].length-1;start=i+1;continue;
  }
  // "Na seção X, altere..." is a single command: the comma is part of its target.
  const prefix=instruction.slice(start,i).trim().replace(/^\d{1,2}[.)]\s*/,"");
  if(char===","&&/^na\s+se[cç][aã]o\s+[^,]{1,100}$/i.test(prefix))continue;
  const match=instruction.slice(i).match(boundary);
  if(match&&instruction.slice(start,i).trim()){
   clauses.push(instruction.slice(start,i).trim());i+=match[0].length-1;start=i+1;
  }
 }
 clauses.push(instruction.slice(start).trim());
 return clauses.filter(Boolean);
}

/** Shared creation intent classifier for Builder UI and chat API.
 * A complete site brief is distinct from a request to edit an existing site.
 */
export function isFullSiteCreationBrief(instruction:string):boolean{
 return /(?:crie|criar|gere|gerar|monte|construa|desenvolva)\s+(?:um\s+)?site\b/i.test(instruction);
}
