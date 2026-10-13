/**
 * Extract a business/person name from the single free-form briefing.
 * Do not let a draft label such as "Novo projeto" become the actual brand
 * when the customer explicitly supplies a name in the prompt.
 *
 * This is deterministic and makes no AI call; no unsupported "guessing"
 * from a generic niche such as "crie um site para psicólogos".
 */
const WORD=String.raw`(?:[A-ZÀ-Ý][a-zà-ÿ]+|[A-Z]{2,8})`;
const PERSON_OR_BRAND=new RegExp(
  String.raw`(${WORD}(?:\s+(?:de|da|do|dos|das|e|&|\+)?\s*${WORD}){1,4})`, 'u',
);
const PROFESSION_PREFIX=/\b(?:psic[oó]log[ao]|dentista|odont[oó]log[ao]|nutricionista|advogad[ao]|m[eé]dic[ao]|arquiteta?|terapeuta|fisioterapeuta|profissional)\s+(?:chamad[ao]\s+)?/giu;
const PROPER_NAME=new RegExp(String.raw`^(${WORD}(?:\s+${WORD}){1,3})`,'u');
const FORMAL_NAME=/(?:\b(?:chamad[ao]|denominad[ao]|se chama|nome(?:\s+d[ao]\s+(?:marca|empresa|consult[oó]rio|cl[ií]nica|profissional))?\s*(?:é|:)|marca\s*(?:é|:)|empresa\s*(?:é|:))\s*)[“"'\s]*([^,.;!?\n]{2,85})/iu;
const LOWER_CONNECTOR=/\s+(?:com|que|onde|cujo|cuja|especializad[ao]|voltad[ao]|atuando|localizad[ao]|atuante|quero|preciso|gostaria|para\s+que|e\s+(?:que|quero|preciso))\b[\s\S]*$/iu;
const GENERIC=/^(?:novo projeto|minha empresa|minha marca|site|landing page|site institucional|empresa|profissional|pessoa|consult[oó]rio|cl[ií]nica|psic[oó]log[ao])$/iu;

function sanitize(value:string):string|null {
  const raw=value
    .replace(/^[\s\u201c\u201d"'“”]+|[\s\u201c\u201d"'“”]+$/g,'')
    .replace(LOWER_CONNECTOR,'')
    .replace(/\s+/g,' ')
    .replace(/[.,;:!?]+$/g,'')
    .trim();
  // Only copy a valid proper name from free-form instructions. This also
  // truncates a later sentence (e.g. "Nathalia Ferreira e quero...").
  const name=raw.match(new RegExp(String.raw`^${WORD}(?:\s+(?:(?:de|da|do|dos|das)\s+)?${WORD}){0,5}`,'u'))?.[0]||raw;
  // Do not confuse an entire instruction sentence with a brand.
  if(name.length<3||name.length>72||GENERIC.test(name))return null;
  if(/^(?:quero|crie|faça|preciso|desenvolva|um site|site para)\b/iu.test(name))return null;
  if(name.split(/\s+/).length>7)return null;
  return name;
}

export function inferSiteBrand(brief:string):string|null {
  const text=brief.replace(/[\t\r]+/g,' ').trim();
  const explicit=text.match(FORMAL_NAME)?.[1];
  if(explicit){
    const candidate=sanitize(explicit);
    if(candidate)return candidate;
  }
  for (const matched of text.matchAll(PROFESSION_PREFIX)) {
    const tail=text.slice((matched.index||0)+matched[0].length);
    const professional=tail.match(PROPER_NAME)?.[1];
    if(!professional)continue;
    const candidate=sanitize(professional);
    if(candidate)return candidate;
  }
  const intro=text.match(/^\s*(?:sou|me chamo)\s+(?:(?:a|o)\s+)?(.+)/iu)?.[1];
  if(intro){
    const named=intro.match(PROPER_NAME)?.[1];
    const candidate=named?sanitize(named):null;
    if(candidate)return candidate;
  }
  // Common usage: "site para Nathalia Ferreira Psicóloga".
  const preceded=text.match(/(?:\b(?:para|sobre|da|do)\s+(?:(?:a|o|uma|um)\s+)?(?:site\s+(?:de|da|do|para)\s+)?)((?:[A-ZÀ-Ý][a-zà-ÿ]+|[A-Z]{2,8})(?:\s+(?:[A-ZÀ-Ý][a-zà-ÿ]+|[A-Z]{2,8})){1,4})/u)?.[1];
  if(preceded){
    const candidate=sanitize(preceded);
    if(candidate)return candidate;
  }
  // Beginning with the business name is also a useful convention:
  // "Lumina Odontologia — clínica com atendimento em São Paulo".
  const first=text.split(/[—–:,;\n]/)[0].trim();
  if(!/^(crie|quero|faça|preciso|monte|site|landing|desenvolva)\b/iu.test(first)){
    const match=first.match(PERSON_OR_BRAND)?.[1];
    if(match){
      const candidate=sanitize(match);
      if(candidate)return candidate;
    }
  }
  return null;
}
