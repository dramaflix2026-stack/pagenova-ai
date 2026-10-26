/**
 * A protection clause mentioning "imagem" is not an image-edit instruction.
 * Parse the requested object, not distant keywords from separate sentences.
 */
export function isExplicitImageChangeRequest(instruction:string):boolean {
  const action=instruction.split(/\b(?:preserv[ea]\w*|mantenha|mantendo|sem\s+(?:alterar|trocar|modificar)|n[aã]o\s+(?:alter[ea]\w*|mex\w*|troqu\w*|substitu\w*))\b/i)[0].trim();
  if(!/\b(?:imagem|imagens|foto|fotos|fotografia|fotografias)\b/i.test(action))return false;
  const replacement=/\b(?:troqu\w*|substitu\w*|regener\w*|reger\w*|gerar|gere|crie|criar)\s+(?:(?:somente|apenas|novas?|outras?|uma|um|as|a|os|o|de|da|do|dessa|deste|primeira|segunda|terceira|quarta|quinta|sexta|n[uú]mero\s+\d+|\d+[ªº]?)\s+){0,5}(?:imagens?|fotos?|fotografias?)\b/i;
  return replacement.test(action)||/\b(?:nova|novas)\s+(?:imagens?|fotos?|fotografias?)\b/i.test(action);
}
