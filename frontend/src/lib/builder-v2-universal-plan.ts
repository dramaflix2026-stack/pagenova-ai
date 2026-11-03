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
  const match=instruction.slice(i).match(boundary);
  if(match&&instruction.slice(start,i).trim()){
   clauses.push(instruction.slice(start,i).trim());i+=match[0].length-1;start=i+1;
  }
 }
 clauses.push(instruction.slice(start).trim());
 return clauses.filter(Boolean);
}
