/** Stable universal section selectors for prefixed IDs across templates. */
const norm=(value:string)=>value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().trim().replace(/[_\s]+/g,"-");
const groups:readonly (readonly string[])[]=[
 ["diferenciais","differentials","differences","difference","features"],
 ["depoimentos","testimonials","reviews","review"],
 ["servicos","services","treatments"],
 ["cursos","courses","programas","programs"],
 ["sobre","about"],["galeria","gallery"],["contato","contact"],
 ["matriculas","enrollment","admissions"],
 ["faq","perguntas-frequentes","duvidas-frequentes"],
 ["metodologia","method"],["processo","process","como-funciona"]
];
const slugs=(section:string):string[]=>{
 const key=norm(section);
 if(!/^[a-z0-9-]{1,80}$/.test(key))return [];
 return [...new Set(groups.find(group=>group.includes(key))||[key])];
};
export function universalSectionDomIdMatches(section:string,id:string):boolean{
 const actual=norm(id);
 return slugs(section).some(slug=>actual===slug||actual.endsWith("-"+slug))&&!actual.startsWith("custom-");
}
export function universalPreviewSectionSelectors(section:string):string[]{
 const names=slugs(section),key=norm(section);
 if(!names.length)return [];
 return [`section[data-section-id="${key}"]`,`section[data-universal-section="${key}"]`,`section[id="${key}"]`,
 ...names.map(slug=>`section[id$="-${slug}"]:not([id^="custom-"])`)];
}
/** Do not guess a match when a section identifier is ambiguous. */
export function findUniversalPreviewSections(root:ParentNode,section:string):HTMLElement[]{
 const selectors=universalPreviewSectionSelectors(section);
 if(!selectors.length)return [];
 const candidates=Array.from(root.querySelectorAll<HTMLElement>(selectors.join(",")));
 const canonical=norm(section);
 const exact=candidates.filter(el=>norm(el.getAttribute("data-section-id")||"")===canonical||
  norm(el.getAttribute("data-universal-section")||"")===canonical||norm(el.id)===canonical);
 const matches=exact.length?exact:candidates;
 return matches.length===1?matches:[];
}
