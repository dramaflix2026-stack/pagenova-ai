/** Intent routing for the single paperclip in Builder V2.
 * A user attachment never silently replaces an existing photograph.
 */
export type BuilderAttachmentIntent="reference"|"site"|"needs-instruction";
const normalize=(v:string)=>v.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");
export function builderAttachmentIntent(instruction:string,siteExists:boolean):BuilderAttachmentIntent{
  const text=normalize(instruction);
  // Explicit placement wins over "como referência" when the user asks to use the attached photo itself.
  if(/\b(?:substitua|substituir|troque|trocar|coloque|colocar|insira|inserir|aplique|aplicar|utilize|usar)\b/.test(text)&&/(?:imagem|foto|fotografia|anexad|anexo)/.test(text)&&/(?:capa|hero|banner|secao|site|galeria|card)/.test(text)&&!/(?:apenas|somente)\s+(?:como\s+)?referencia\s+visual/.test(text))return "site";
  if(/(?:somente|apenas|so|usar|use|envio|anex[oa]|imagem|foto)[^.]{0,65}(?:como\s+)?referencia\b|(?:inspiracao|inspirar|estilo\s+de\s+referencia|analisar\s+(?:esta|essa)\s+foto)/.test(text))return "reference";
  if(/(?:foto|imagem|fotografia|banner|capa|card|galeria|portfoli)/.test(text)&&
     /(?:adicione|acrescente|inclua|insira|coloque|use|usar|troque|substitua|alter[ea]|mude|atualize|aplique|utilize|crie|monte|transforme|segunda|primeira|terceira)/.test(text))return "site";
  if(!siteExists)return "reference"; // during generation, one image is a visual reference
  return "needs-instruction";
}
