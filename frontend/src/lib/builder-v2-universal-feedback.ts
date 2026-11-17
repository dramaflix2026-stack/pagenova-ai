/**
 * Consistent feedback taxonomy. Classify the requested operation, not the
 * preservation clause ("preserve buttons", "keep images") of a user command.
 * No raw prompt is ever persisted to Supabase.
 */
const norm=(text:string)=>text.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
export type UniversalFeedbackIntent="image"|"add-section"|"remove-section"|"layout"|"style"|"copy"|"other";
export type UniversalFeedbackTarget="buttons"|"testimonials"|"hero"|"services"|"collections"|"differences"|"gallery"|"faq"|"contact"|"footer"|"sections"|"unspecified";
export type UniversalFeedbackFailureCode="parse"|"missing-target"|"no-change"|"unrequested-change"|"postcondition"|"unsupported"|"unknown";
export function classifyUniversalFeedback(instruction:string):{intent:UniversalFeedbackIntent;target:UniversalFeedbackTarget;sectionKey?:string}{
 const text=norm(instruction).split(/\b(?:preserve|mantenha|sem alterar|nao altere|nao mude|garanta que)\b/)[0].trim();
 const sectionText=text.match(/\bsecao\s+(?:(?:de|da|do|dos|das)\s+)?(.+?)(?=\s+(?:para|pra|com|em|antes|depois|logo apos)\b|[,.]|$)/)?.[1]||"";
 const label=sectionText.replace(/^(?:nossos?|nossas?|os|as)\s+/,"").trim();
 const sectionTarget:UniversalFeedbackTarget|undefined=/diferenc|abordagem/.test(label)?"differences":
  /servic|tratament|curso|programa|formac/.test(label)?"services":
  /coleco|colecao|florais|produtos/.test(label)?"collections":
  /depoiment|avaliac|testemunh/.test(label)?"testimonials":
  /galeria|fotos/.test(label)?"gallery":
  /perguntas|faq|duvidas/.test(label)?"faq":
  /contato|matricul/.test(label)?"contact":
  /rodape/.test(label)?"footer":undefined;
 const target:UniversalFeedbackTarget=/(botao|botoes|cta|button|agendamento)/.test(text)?"buttons":
  sectionTarget||(/depoiment|avaliac|testemunh/.test(text)?"testimonials":
  /diferenc|abordagem/.test(text)?"differences":/galeria/.test(text)?"gallery":
  /perguntas frequentes|faq/.test(text)?"faq":/contato|matriculas/.test(text)?"contact":
  /rodape/.test(text)?"footer":/hero|capa|banner|primeira secao|principal/.test(text)?"hero":
  /servic|especialidade|tratament|cursos|programas/.test(text)?"services":"unspecified");
 // Whole action words only. "exclusivamente" begins with "exclu" but is
 // not the verb "excluir"; treating it as removal poisoned learning labels.
 const action=text.replace(/\b(?:nao\s+(?:remova|remover|exclua|excluir|apague|apagar|delete|deletar)|sem\s+(?:remover|excluir|apagar))\b[^.!?]*/g,"");
 const add=/\b(?:adicione|adicionar|inclua|incluir|insira|inserir|crie|criar)\b[^.!?]{0,90}\b(?:secao|especialidade|card)\b/.test(action);
 const remove=/\b(?:remova|remover|exclua|excluir|apague|apagar|delete|deletar)\b[^.!?]{0,90}\b(?:secao|card|bloco)\b/.test(action);
 const intent:UniversalFeedbackIntent=add?"add-section":remove?"remove-section":
  /\b(?:alinh\w*|centraliz\w*|ordem|reorden\w*|mova|mover|reposicion\w*)\b/.test(action)?"layout":
  /(imagem|foto|fotografia|capa|banner)/.test(text)?"image":
  /(cor|cores|color|fundo|background)/.test(text)?"style":
  /(texto|titulo|descric|subtitulo)/.test(text)?"copy":"other";
 // When creating a NEW section, references such as "antes do FAQ"
 // describe placement anchors, NOT the content being edited. Assign the
 // learning to the section-add technique, not to FAQ or process edits.
 const creatingNamedSection=intent==="add-section"&&/\buma\s+(?:nova\s+)?secao\s+(?:chamada|denominada)\b/.test(action);
 // Layout actions on an entire section must learn as section movement.
 // "título principal" is a heading constraint, not evidence of a Hero edit.
 const movingNamedSection=intent==="layout"&&/^(?:mova|mover|reposicione|coloque)\s+(?:a\s+)?secao\s+/.test(action);
 const resolvedTarget:UniversalFeedbackTarget=creatingNamedSection||movingNamedSection?"sections":target;
 const sectionKey=!(creatingNamedSection||movingNamedSection)?(sectionTarget==="collections"?"produtos":sectionTarget?sectionTarget:undefined):undefined;
 return {intent,target:resolvedTarget,...(sectionKey?{sectionKey}:{})};
}
export function inferUniversalFeedbackFailureCode(strategy:string,outcome:"applied"|"rejected"):UniversalFeedbackFailureCode|null{
 if(outcome!=="rejected")return null;
 const code=strategy.toLowerCase();
 if(/missing-target|unresolved|section-not-found/.test(code))return "missing-target";
 if(/visual|verification|mismatch|postcondition/.test(code))return "postcondition";
 if(/no-change|idempotent/.test(code))return "no-change";
 if(/parse/.test(code))return "parse";
 if(/unrequested-change/.test(code))return "unrequested-change";
 if(/unsupported/.test(code))return "unsupported";
 return "unknown";
}
