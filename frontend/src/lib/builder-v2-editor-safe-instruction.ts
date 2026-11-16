/**
 * PageNova Universal Editor — delivery 2/15.
 *
 * Privacy-first excerpt of the ORIGINAL instruction. This is not a transcript.
 * Only recognized editing vocabulary, short numeric counts and literal color
 * values are retained; unrecognized words and quoted text are masked.
 * Sensitive, unusually long, or complex instructions are entirely omitted.
 * This function NEVER stores the original instruction in an event or cache.
 */
export type SafeEditorInstruction=
 | {version:1;status:"stored";text:string}
 | {version:1;status:"omitted";text:null};

const REDACTED="[DADO_PROTEGIDO]";
const MAX_ORIGINAL=600;
const MAX_STORED=480;
const WORDS=new Set((
 "altere alterar alterando altera mude mudar muda troque trocar trocando "+
 "pinte pintar defina definir coloque colocar deixe deixar ajuste ajustar "+
 "adicione adicionar inclua incluir crie criar insira inserir remova remover "+
 "exclua excluir substitua substituir troquem modifique modificar "+
 "centralize centralizar alinhe alinhar mova mover reposicione reposicionar "+
 "aumente aumentar diminua diminuir inverta inverter atualize atualizar "+
 "reescreva reescrever edite editar cor cores fundo fundos background "+
 "titulo títulos titulo subtitulo texto textos frase frases nome nomes "+
 "slogan descrição descricoes descricao paragrafo parágrafos conteúdo "+
 "letra letras fonte fontes tipografia negrito normal maiusculo "+
 "foto fotos imagem imagens fotografias fotografia banner banners "+
 "hero capa capas galeria galerias card cards botão botoes botões "+
 "icone icones ícone ícones seção seções secao secoes bloco blocos "+
 "serviços servicos serviço servico diferenciais diferenciais "+
 "depoimentos depoimento avaliações avaliacao avaliacao "+
 "contato contatos formulario formulário formularios formulários "+
 "perguntas frequentes faq rodapé rodape footer cabeçalho cabecalho header "+
 "principal principais sobre equipe localização localizacao mapa "+
 "informações informacoes estrutura projetos cursos matrículas matriculas "+
 "produtos produto ofertas serviços serviço etapas processo "+
 "altura largura tamanho margens margem espaçamento espaco espaço "+
 "vertical horizontal cima baixo esquerda direita centro meio "+
 "centralizado centralizada centralizados centralizadas "+
 "antes depois acima abaixo topo final ordem posição posicao alinhamento "+
 "primeira primeiro segunda segundo terceira terceiro "+
 "apenas somente só so todos todas cada uma um "+
 "o a os as ao aos da do das dos na no nas nos de em por para com sem "+
 "meu minha seus suas nossa nosso que essa esse esta este "+
 "e ou mas não nao mais menos igual diferente somente "+
 "azul verde vermelho branco branca preto preta cinza grafite "+
 "laranja amarelo amarela dourado dourada roxo roxa rosa bege marrom "+
 "claro clara escuro escura transparente "+
 "modelo template site pagina página versao versão desktop mobile "+
 "responsivo responsiva links link tamanho quantidade "+
 "exatamente manter mantenha preserve restante alterar modificações"
).split(/\s+/).filter(Boolean).map(w=>w.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase()));
const ACTIONS=new Set((
 "altere alterar mude mudar troque trocar pinte pintar defina definir "+
 "coloque colocar deixe deixar ajuste ajustar adicione adicionar inclua "+
 "incluir crie criar insira inserir remova remover exclua excluir "+
 "substitua substituir modifique modificar centralize centralizar alinhe "+
 "alinhar mova mover reposicione reposicionar aumente aumentar diminua "+
 "diminuir inverta inverter atualize atualizar reescreva reescrever edite editar"
).split(/\s+/));
const normalize=(word:string)=>word.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
// Fail closed for credentials, financial/identity data, contact details, URLs,
// arbitrary data transfers, code and pasted multi-line customer briefings.
const HIGH_RISK=/\b(?:senha|password|passwd|token|secret|apikey|api[\s_-]?key|bearer|authorization|oauth|credenciais?|cpf|cnpj|rg|pix|iban|cart[aã]o|banc[aá]ri[oa]|telefone|celular|whatsapp|e-?mail|endere[cç]o|avenida|alameda|rua|cep|logradouro|latitude|longitude|documento|login|usu[aá]rio)\b|https?:\/\/|www\.|@|\b\d{3}[.-]?\d{3}[.-]?\d{3}[-.]?\d{2}\b|\b\d{2}[.]?\d{3}[.]?\d{3}[/]?\d{4}[-]?\d{2}\b|(?:\+?55\s*)?\(?\d{2}\)?[\s().-]*9?\d{4}[\s.-]*\d{4}|data:|\b[0-9]{7,}\b|<\/?[A-Za-z]|[\r\n\t\x00-\x1f]|[{}\\]|[A-Za-z0-9_\-]{25,}/iu;
const COLOR_HEX=/^#[A-Fa-f0-9]{6}$/;
const TOKENS=/\[DADO_PROTEGIDO\]|#[a-fA-F0-9]{6}(?![a-fA-F0-9])|[\p{L}\p{M}]+|[0-9]+|\S/gu;
const isQuoted=(value:string)=>/["'“”‘’]/.test(value);
export function captureSafeEditorInstruction(raw:unknown):SafeEditorInstruction{
 const omitted:SafeEditorInstruction={version:1,status:"omitted",text:null};
 if(typeof raw!=="string"||!raw.trim()||raw.length>MAX_ORIGINAL||HIGH_RISK.test(raw))return omitted;
 if(isQuoted(raw)){
  // Even quoted business copy must never be silently uploaded.
  if((raw.match(/["'“”‘’]/g)||[]).length%2!==0)return omitted;
 }
 let normalized=raw.trim().normalize("NFC");
 // Mask quoted text, not the editing grammar surrounding it.
 normalized=normalized.replace(/"[^"]*"|'[^']*'|“[^”]*”|‘[^’]*’/gu,` ${REDACTED} `);
 if(isQuoted(normalized))return omitted;
 // A replacement phrase following a text-edit command is customer content,
 // even when it accidentally consists of our otherwise public vocabulary.
 if(/\b(?:troqu\w*|alter\w*|mud\w*|substitu\w*|reescrev\w*|edit\w*)\b[\s\S]{0,180}\b(?:texto|titulo|título|subtítulo|subtitulo|frase|slogan|descri[cç][aã]o|nome)\b/iu.test(normalized)){
  normalized=normalized.replace(/\b(para|por|com)\b[\s\S]*$/iu,`$1 ${REDACTED}`);
 }
 const tokens=normalized.match(TOKENS)||[];
 if(tokens.length>120)return omitted;
 const result:string[]=[];
 let action=false,recognized=0;
 for(const token of tokens){
  if(token===REDACTED){if(result.at(-1)!==REDACTED)result.push(REDACTED);continue;}
  if(COLOR_HEX.test(token)){result.push(token.toUpperCase());recognized++;continue;}
  const word=normalize(token);
  if(WORDS.has(word)){result.push(token);recognized++;if(ACTIONS.has(word))action=true;continue;}
  if(/^\d{1,2}$/.test(token)){result.push(token);continue;}
  if(token==="."||token===","||token===";"||token==="!"||token==="?")continue;
  if(result.at(-1)!==REDACTED)result.push(REDACTED);
 }
 let text=result.join(" ").replace(/(?:\[DADO_PROTEGIDO\]\s*){2,}/g,REDACTED+" ").trim();
 if(!action||recognized<3||!text||text.length>MAX_STORED)return omitted;
 // A storage-boundary second pass does not need the raw input.
 return {version:1,status:"stored",text};
}
export function isSafeEditorInstruction(value:unknown):value is SafeEditorInstruction{
 if(!value||typeof value!=="object")return false;
 const candidate=value as Partial<SafeEditorInstruction>;
 if(candidate.version!==1)return false;
 if(candidate.status==="omitted")return candidate.text===null;
 if(candidate.status!=="stored"||typeof candidate.text!=="string"||candidate.text.length>MAX_STORED)return false;
 const checked=captureSafeEditorInstruction(candidate.text);
 return checked.status==="stored"&&checked.text===candidate.text;
}
