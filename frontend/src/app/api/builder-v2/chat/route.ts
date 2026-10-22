import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
export const runtime = "nodejs";
export const maxDuration = 90;
export async function POST(req: NextRequest) {
  const user = (await (await createClient()).auth.getUser()).data.user;
  if (!user) return NextResponse.json({error:"Faça login."},{status:401});
  const key = process.env.OPENAI_API_KEY;
  if (!key) return NextResponse.json({error:"IA não configurada."},{status:503});
  let body: Record<string,unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({error:"Pedido inválido."},{status:400}); }
  if (typeof body.instruction !== "string" || body.instruction.length > 5000) return NextResponse.json({error:"Pedido inválido."},{status:400});
  const currentBlocks = (body.site as {blocks?:unknown[]}|undefined)?.blocks;
  const isFresh = (!Array.isArray(currentBlocks) || currentBlocks.length === 0) && /(?:site|website|página|pagina|landing page|escritório|advogados|clínica|loja)/i.test(String(body.instruction));
  const prompt = `Você é o motor de edição PageNova Builder 2.0. A instrução do usuário prevalece sobre o template. A plataforma dispõe de modelos internos invisíveis para acelerar a criação, mas nunca exige que o usuário escolha um modelo. Se receber somente "Faça um site para advogados", "site para restaurante" ou outra descrição mínima, infira o segmento e entregue um site COMPLETO com arquitetura, identidade visual e textos adequados, sem perguntar por detalhes. O usuário pode refinar tudo depois pelo chat. Retorne APENAS JSON válido {"site":{...},"summary":"..."}.
Esquema site: {"title":string,"background":cor CSS,"blocks":[{"id":string,"type":"heading"|"paragraph"|"button"|"image","text":string,"color":cor CSS,"align":"left"|"center"|"right","src"?:string,"href"?:string,"section"?:string,"fontSize"?:number,"radius"?:number,"spacing"?:number,"layout"?:"hero"|"grid"|"split"|"banner"|"faq"|"gallery"|"standard","background"?:string,"columns"?:number}]}.
Cada bloco tem ID permanente; preserve IDs existentes. Em edição, modifique SOMENTE os elementos solicitados e mantenha rigorosamente todos os outros blocos, sua ordem e propriedades. Se o usuário pedir para trocar texto, substitua o texto exato do bloco correspondente. Se pedir cor, fonte/tamanho, espaçamento, alinhamento, botão, imagem ou reorganizar/adicionar/remover seção, execute nos blocos relevantes. Para botões, use href somente quando o usuário fornecer URL, telefone, e-mail ou âncora real; não invente destinos externos. Se o usuário pedir para trocar o link do botão, altere href e preserve o restante. Para mover uma seção, mova seus blocos em conjunto. Não se limite a modelos fixos. Cada seção pode ter layout hero, grid, split, banner, faq, gallery ou standard no primeiro bloco, além de background próprio. O primeiro bloco deve ser heading com layout e section. Para serviços e benefícios: gere um heading e 3 a 6 blocos paragraph SEPARADOS, cada um com nome e descrição curta; layout grid. Para FAQ: gere heading e um bloco paragraph SEPARADO por pergunta, no formato "Pergunta? Resposta"; layout faq. Cada pergunta deve ter no máximo 14 palavras e cada resposta no máximo 35 palavras. Em serviços, tratamentos, etapas e diferenciais, escreva cada card como "Título curto: descrição de até 25 palavras". Quando o briefing trouxer títulos explícitos para cards, use exatamente esses títulos, palavra por palavra, na ordem indicada. Nunca parafraseie, resuma ou omita a última palavra. Preserve também todas as seções explicitamente pedidas. Não escreva um parágrafo longo por card. Não afirme que o negócio possui equipamentos, equipe, certificações, tratamentos específicos, tempo de sessão ou resultados comprovados sem o usuário informar isso. Não anuncie formulário, WhatsApp, agendamento ou canal de contato como disponível se não houver link ou integração fornecida. Evite prometer resultados garantidos. Para galeria: heading e blocos image separados; layout gallery. Para equipe e estrutura: layout split com heading, texto e imagem. Não escreva instruções de design dentro do texto do site. Não crie dados de contato fictícios, nem rodapé com ano ou endereço inventados. Escolha o layout pelo nicho e permita ao usuário alterá-lo pelo chat. Nunca invente nome de empresa, escritório ou pessoa. Se o briefing não informar marca, use um título descritivo neutro. Varie realmente a composição entre seções, alternando hero, grid, split, banner e faq conforme fizer sentido; evite 10 seções com o mesmo estilo. Para um escritório de advocacia, escolha tipografia sóbria e paleta elegante (ex.: azul-marinho, marfim e dourado discreto), hero institucional, áreas de atuação em cards separados, apresentação do escritório, diferenciais factuais sem promessas, processo de atendimento, perguntas frequentes e CTA de contato. Evite linguagem mercantilista, garantia de resultados, depoimentos fictícios, especializações ou registros OAB inventados. Para outros segmentos, infira a identidade visual e estrutura adequada sem depender de palavras exatas no briefing. Evite escrever "a definir" no rodapé público: omita dados que não foram informados e use CTA genérico editável sem link fictício. Ao criar novo site, produza 7 a 10 seções relevantes, cada uma com um identificador section próprio, composição editorial de títulos curtos, descrições objetivas e CTAs adequados. Evite parágrafos enormes e repetitivos. Nunca invente endereço, telefone, e-mail, anos de experiência, depoimentos, profissionais, certificações ou URLs de imagens; omita informações não fornecidas sem mostrar "A definir". Para imagens não disponíveis, evite criar espaços vazios em excesso: priorize composição tipográfica e cards sem fotos. Se o usuário fornecer URL válida de imagem, use src; se fornecer somente referência visual, não finja ter gerado uma imagem. Quando houver imagem de referência, analise-a para aplicar as alterações visuais ou textuais solicitadas; não alegue que substituiu uma imagem se não recebeu uma URL ou arquivo utilizável. O campo summary deve explicar brevemente a ação executada em português.`;

  const cleanGeneratedCopy = (value: string) => value.replace(/\s*[-–—]\s*(?:(?:grid|hero|faq|banner|split|standard|gallery)|(?:fundo\s+)?(?:areia|branco|verde|escuro|claro|preto))(?:\s*[-–—]\s*(?:(?:fundo\s+)?(?:areia|branco|verde|escuro|claro|preto)))*/giu, "").replace(/\s*[-–—,;]?\s*(?:layout|design|background|fundo)\s*:\s*[^,;]+/giu, "").replace(/\s*[-–—]\s*$/u, "").trim();
  const removeLayoutHeading = (value:string,section:string) => {const result=value.replace(/\b(?:hero|tratamentos?|apresenta[cç][aã]o|diferenciais|galeria|contato|faq)\s+layout\s+(?:hero|grid|split|banner|faq|gallery|standard)?\s*(?:com\s+)?(?:fundo\s+)?(?:areia(?:\s+claro)?|branco|verde|escuro|claro|preto)?/giu,"").replace(/\b(?:layout\s+(?:hero|grid|split|banner|faq|gallery|standard)|fundo\s+(?:areia(?:\s+claro)?|branco|verde|escuro|claro|preto))\b/giu,"").trim();return result||(/tratament|servi[cç]/i.test(section)?"Nossos tratamentos":/apresent|sobre/i.test(section)?"Sobre nós":/diferenc/i.test(section)?"Nossos diferenciais":/galeria/i.test(section)?"Galeria de imagens":/contato/i.test(section)?"Entre em contato":/faq/i.test(section)?"Dúvidas frequentes":"Conheça nossos serviços");};
  const fabricatedContact = /(?:\(?11\)?\s*1234[-\s]?5678|\(?11\)?\s*9?8765[-\s]?4321|contato@clinic[a-z.]*|rua principal\s*,?\s*123)/i;
  const inventedContact = /(?:\+?55\s*)?\(?\d{2}\)?\s*9?\d{4}[-\s]?\d{4}|[\w.+-]+@[\w.-]+\.[a-z]{2,}|(?:rua|avenida|av\.|alameda|travessa)\s+[^.;|\n]{3,90}\s*,\s*\d{1,5}/i;
  const designOnlyHeading = /^(?:editorial|portf[oó]lio exclusivo assim[eé]trico(?: e imagens sobrepostas)?|imagens sobrepostas|composi[cç][aã]o assim[eé]trica|layout editorial|hero editorial|estilo editorial)$/i;
  // New websites are assembled in small independently validated batches.
  // Existing-site edits still use the original editing path below.
  if (isFresh) {
    const instruction = String(body.instruction);
    const callAI = async (system: string, user: unknown, tokens: number) => {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method:"POST",
        headers:{"Authorization":"Bearer "+key,"Content-Type":"application/json"},
        body:JSON.stringify({model:"gpt-4.1-mini",max_completion_tokens:tokens,
          response_format:{type:"json_object"},
          messages:[{role:"system",content:system},{role:"user",content:JSON.stringify(user)}]}),
        signal:AbortSignal.timeout(55000)
      });
      if (!response.ok) throw new Error("upstream-"+response.status);
      const data = await response.json();
      const raw = data?.choices?.[0]?.message?.content;
      if (data?.choices?.[0]?.finish_reason === "length") throw new Error("truncated");
      if (typeof raw !== "string" || !raw.trim()) throw new Error("empty");
      return JSON.parse(raw) as Record<string,unknown>;
    };
    try {
      const plan = await callAI(
        "Você é o arquiteto de sites premium PageNova. Responda APENAS JSON com title, background e sections: array de 7 a 9 objetos {id,layout,goal}. Layout permitido: hero,grid,split,banner,faq,standard. Não invente nome de escritório, telefone, endereço, profissionais, certificações, equipamentos, tratamentos específicos ou depoimentos. Crie uma arquitetura editorial elegante e não repetitiva. Hero forte, serviços em grid, história em split, diferenciais em grid, uma seção editorial em banner, galeria, FAQ e contato. Distribua imagens entre hero, apresentação e galeria; não exija fotografia para cada card de serviços. Não use cards numerados para todas as seções. Não repita estruturas consecutivas. Não escreva metadados de design em títulos. ATENÇÃO: separe instruções de aparência visual de fatos do negócio. Paleta, tipografia, profundidade, sobreposição e estilo são apenas METADADOS DE DESIGN, nunca serviços, diferenciais, valores ou textos do site. Para arquitetura, portfólio precisa ter seção gallery com imagens solicitadas, serviços de arquitetura e metodologia em etapas; jamais use texto de clínica. Toda seção precisa ter conteúdo além do heading. A instrução do usuário prevalece.",
        {instruction},1200
      );
      const sections = Array.isArray(plan.sections) ? plan.sections.filter((v):v is Record<string,unknown>=>!!v&&typeof v==="object").slice(0,9) : [];
      if (sections.length < 5) throw new Error("invalid-plan");
      // Keep the approved component architecture stable regardless of AI wording.
      const normalizeId=(value:unknown)=>String(value||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
      const usedSectionIds=new Set<string>();
      for(let i=0;i<sections.length;i++){
        const section=sections[i];
        const original=normalizeId(section.id)||"secao-"+(i+1);
        const id=usedSectionIds.has(original)?original+"-"+(i+1):original;
        usedSectionIds.add(id);
        section.id=id;
        const goal=String(section.goal||"");
        if(i===0)section.layout="hero";
        else if(/faq|perguntas|duvidas/.test(id+" "+goal))section.layout="faq";
        else if(/galeria|portfolio|projetos-realizados/.test(id+" "+goal))section.layout="gallery";
        else if(/servic|atuacao|diferencia|princip|metodologia|processo|atendimento/.test(id+" "+goal))section.layout="grid";
        else if(/contato|agendamento|fale-conosco/.test(id+" "+goal))section.layout="banner";
        else if(!["hero","grid","split","banner","faq","gallery","standard"].includes(String(section.layout)))section.layout="standard";
      }
      if(!sections.some(v=>v.layout==="faq"))sections.splice(Math.max(1,sections.length-1),0,{id:"faq",layout:"faq",goal:"Perguntas frequentes do segmento com respostas objetivas"});
      if(!sections.some(v=>/contato|agendamento/.test(String(v.id))))sections.push({id:"contato",layout:"banner",goal:"Contato com formulário Nome, E-mail e Mensagem"});
      if(!sections.some(v=>v.layout==="gallery")&&sections.length<10)sections.splice(Math.max(1,sections.length-2),0,{id:"galeria",layout:"gallery",goal:"Galeria visual com fotografias, sem afirmações de projetos reais não comprovados"});
      const batches = [sections.slice(0,Math.ceil(sections.length/2)),sections.slice(Math.ceil(sections.length/2))];
      const forbiddenDesignCopy = /(?:paleta sofisticada|tons areia|off-white|grafite e detalhes|tipografia elegante|profundidade e textura|composi[cç][oõ]es assim[eé]tricas|fotografias realistas|est[eé]tica minimalista|layout editorial|cards repetitivos)/i;
      const nicheArchitecture = /arquitet|interiores|atelier|ateli[eê]/i.test(instruction);
      const nicheHealthcare = /cl[ií]nica|est[eé]tica facial|tratamentos est[eé]ticos|beleza|spa/i.test(instruction);
      const results = await Promise.all(batches.map(async (batch,index) => {
        const out = await callAI(
          "Você é o redator e designer PageNova. Retorne APENAS JSON {blocks:[...]}. Para CADA seção solicitada, gere um heading e 1 a 5 blocos apropriados. Escreva somente conteúdo final para o visitante, nunca instruções de design ou placeholders como Título Principal Impactante, Subtítulo suave, Fundo azul-marinho, ícones dourados, Imagem a adicionar, ©2024 ou Redes Sociais (ícones). Não inclua rodapé sem dados reais. Campos obrigatórios de cada bloco: id string único, type heading|paragraph|button|image, text string, color string hexadecimal, align left|center|right, section id exato. No heading inicial da seção inclua layout e background. Use cores com alto contraste; hero fundo escuro, outras seções claras, grids com cards claros. Em grid: heading + 3 a 5 paragraphs separados, títulos curtos e descrições com até 20 palavras. Nunca escreva Layout:, Background:, Design: ou instruções técnicas no texto público. Não invente credenciais ou resultados, nem alegue experiência comprovada, tecnologia exclusiva, resultados garantidos, eficácia, equipamentos próprios, profissionais certificados ou resultados duradouros sem fatos explícitos no briefing. Em cada grid, todos os cards devem ter título curto e descrição concreta separados por dois-pontos. Planeje variedade editorial: hero com CTA para âncora existente, serviços em grid sem imagens repetidas, história em split, diferenciais em cards, galeria, FAQ e contato com CTA somente se existir destino real. Evite prometer formulário que não existe. Em faq: heading + perguntas no formato Pergunta? Resposta. Não crie URLs fictícias, dados de contato inventados, nomes de pessoas/escritórios inventados ou imagens falsas. Nunca gere números de telefone, e-mails ou endereços a menos que estejam literalmente presentes no briefing. Não use frases de clínica em sites de arquitetura. Não transforme instruções como editorial, assimétrico, sobreposição ou colagem em títulos públicos. Texto conciso, premium e adequado ao segmento. Não gere seções fora da lista. CRÍTICO: o briefing mistura dados do NEGÓCIO e DIREÇÃO DE ARTE. Direção de arte nunca deve aparecer como diferencial, serviço, valor ou título. Exemplo proibido: Paleta Sofisticada, Profundidade e Textura, Estética Minimalista. Não use copy genérica de clínica (possibilidades de cuidado, tratamento) para arquitetura. Cada seção deve ter conteúdo real: portfólio com heading e pelo menos 3 blocos image de src vazio e text descritivo para o gerador de imagens posterior; metodologia em etapas curtas no formato Etapa: descrição, sem repetir a mesma frase no título e no corpo. Em serviços use descrições específicas do setor. Evite headings vazios. A instrução do usuário prevalece.",
          {instruction,siteTitle:plan.title,sections:batch,batch:index},4500
        );
        return Array.isArray(out.blocks)?out.blocks:[];
      }));
      const rawBlocks=results.flat();
      const seen=new Set<string>();
      const blocks=rawBlocks.map((raw,index)=>{
        if(!raw||typeof raw!=="object")return null;
        const b=raw as Record<string,unknown>;
        if(!["heading","paragraph","button","image"].includes(String(b.type))||typeof b.text!=="string")return null;
        if(/^(?:\(?xx\)?[\s-]*){2,}|contato@clinic|rua principal\s*,?\s*123/i.test(b.text))return null;
        const cleanedText=cleanGeneratedCopy(String(b.text));
        if (forbiddenDesignCopy.test(cleanedText) && b.type!=="image") return null;
        if (designOnlyHeading.test(cleanedText)) return null;
        if (b.type!=="image" && inventedContact.test(cleanedText) && !instruction.includes(cleanedText.match(inventedContact)?.[0] || "__missing__")) return null;
        if (nicheArchitecture && !nicheHealthcare && /possibilidades de cuidado|tratamentos est[eé]ticos|sua beleza|sess[oõ]es de tratamento/i.test(cleanedText)) return null;
        if (b.type==="paragraph" && /^(.{12,85}?)\s*:\s*\1\b/i.test(cleanedText)) return null;
        const requestedSection=String(b.section||"");
        const sectionName=sections.find(v=>String(v.id)===requestedSection)?.id as string|undefined;
        if(!sectionName)return null;
        b.text=b.type==="heading"?removeLayoutHeading(cleanedText,sectionName):cleanedText;
        if(b.type==="paragraph"&&fabricatedContact.test(cleanedText))return null;
        const id=typeof b.id==="string"&&b.id?b.id:"block-"+index;
        const unique=seen.has(id)?id+"-"+index:id;seen.add(unique);
        return {...b,id:unique,color:typeof b.color==="string"?b.color:"#243043",
          align:["left","center","right"].includes(String(b.align))?b.align:"left",
          section:sectionName,layout:sections.find(v=>v.id===sectionName)?.layout};
      }).filter((b):b is NonNullable<typeof b>=>b!==null);
      // Guard the initial hero only; never alter the AI editor or other sections.
      const heroSectionId=String(sections[0]?.id||"");
      const heroSeen={heading:false,paragraph:false,button:false};
      const normalizedBlocks=blocks.filter(block=>{
        if(block.section!==heroSectionId)return true;
        if(block.type!=="heading"&&block.type!=="paragraph"&&block.type!=="button")return true;
        if(heroSeen[block.type])return false;
        heroSeen[block.type]=true;
        return true;
      });
      const generatedSections=new Set(normalizedBlocks.map(b=>b.section));
      if(normalizedBlocks.length<8||generatedSections.size<3)throw new Error("incomplete-site");
      return NextResponse.json({site:{title:typeof plan.title==="string"?plan.title:"Site profissional",background:typeof plan.background==="string"?plan.background:"#ffffff",blocks:normalizedBlocks},summary:"Site completo criado em etapas e validado: "+generatedSections.size+" seções."});
    } catch(error) {
      console.error("[builder-v2] staged generation failed",error instanceof Error?error.message:"unknown");
      const legal=/advoga|jur[ií]dic|direito|escrit[oó]rio/i.test(instruction);
      const title=legal?"Escritório de Advocacia":"Site profissional";
      const items=legal?[
        ["inicio","hero","Assessoria jurídica com clareza e responsabilidade","Orientação para decisões importantes, com atenção às particularidades de cada situação."],
        ["atuacao","grid","Áreas de atuação","Direito Civil — orientação em contratos e relações jurídicas.|Direito Empresarial — apoio a demandas societárias e negociais.|Direito Trabalhista — análise de direitos e obrigações.|Direito Tributário — orientação em questões fiscais."],
        ["institucional","split","Atendimento jurídico próximo e criterioso","Cada demanda merece escuta, análise técnica e comunicação transparente ao longo do atendimento."],
        ["diferenciais","grid","Uma atuação pautada em princípios","Escuta atenta e comunicação clara.|Análise individualizada de cada demanda.|Compromisso com a ética profissional.|Acompanhamento e transparência."],
        ["processo","grid","Como funciona o atendimento","01 — Conversa inicial e compreensão da demanda.|02 — Análise das informações e documentos.|03 — Orientação sobre possibilidades e próximos passos."],
        ["faq","faq","Perguntas frequentes","Como iniciar o atendimento? Entre em contato pelo canal disponibilizado pelo escritório.|Quais documentos são necessários? A documentação depende do tipo de demanda e será orientada durante o atendimento.|Como são definidos os honorários? As condições são apresentadas conforme o serviço e as normas aplicáveis."],
        ["contato","banner","Vamos conversar sobre sua demanda?","Solicite informações e conheça os próximos passos para receber orientação jurídica."]
      ]:[
        ["inicio","hero","Uma experiência feita para você","Conheça soluções pensadas para suas necessidades."],
        ["servicos","grid","O que oferecemos","Atendimento com atenção aos detalhes.|Soluções adaptadas a cada necessidade.|Comunicação clara em cada etapa."],
        ["sobre","split","Conheça nossa proposta","Uma abordagem dedicada a tornar sua experiência mais simples e eficiente."],
        ["beneficios","grid","Nossos compromissos","Clareza nas informações.|Atenção em cada etapa.|Qualidade no atendimento."],
        ["processo","grid","Como funciona","01 — Conte o que você precisa.|02 — Entenda as possibilidades.|03 — Escolha o próximo passo."],
        ["faq","faq","Perguntas frequentes","Como posso saber mais? Utilize os canais de contato informados pela empresa.|Como funciona o atendimento? As etapas são explicadas conforme a necessidade."],
        ["contato","banner","Vamos conversar?","Entre em contato para saber mais."]
      ];
      const fallbackBlocks:Array<Record<string,unknown>>=[];
      for(const [section,layout,heading,description] of items){
        const dark=layout==="hero"||layout==="banner";
        const background=dark?"#101d33":section==="institucional"||section==="sobre"?"#f7f5ef":"#ffffff";
        fallbackBlocks.push({id:section+"-heading",section,layout,background,type:"heading",text:heading,color:dark?"#f8f5e9":"#101d33",align:layout==="hero"||layout==="banner"?"center":"left"});
        for(const [i,line] of description.split("|").entries())fallbackBlocks.push({id:section+"-text-"+i,section,type:"paragraph",text:line,color:dark?"#f8f5e9":"#24332e",align:layout==="hero"||layout==="banner"?"center":"left"});
        if(section==="inicio")fallbackBlocks.push({id:"hero-cta",section,type:"button",text:"Conheça nossos serviços",href:legal?"#atuacao":"#servicos",color:"#c9b782",align:"center"});
      }
      return NextResponse.json({site:{title,background:"#ffffff",blocks:fallbackBlocks},summary:"Site completo criado com estrutura de segurança após instabilidade temporária da IA."});
    }
  }
  // Resolve simple alignment requests locally to avoid regenerating the full site.
  const instructionText=String(body.instruction);
  const editingSite=body.site as {title?:string;background?:string;blocks?:Array<Record<string,unknown>>}|undefined;
  // Section-level moves are deterministic: never ask the model to relocate individual blocks.
  if(!isFresh&&Array.isArray(editingSite?.blocks)&&/\\bmov(?:a|er|imente)\\b/i.test(instructionText)&&/se[cç][aã]o/i.test(instructionText)){
    const match=instructionText.match(/(?:mov(?:a|er|imente))\\s+(?:a\\s+)?se[cç][aã]o\\s+(?:completa\\s+)?["“]([^"”]+)["”][\\s\\S]*?(?:depois|ap[oó]s)\\s+(?:da\\s+)?(?:se[cç][aã]o\\s+)?["“]([^"”]+)["”]/i);
    if(match){
      const normalize=(v:string)=>v.normalize("NFD").replace(/[\\u0300-\\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
      const headings=editingSite.blocks.filter(b=>b.type==="heading"&&typeof b.section==="string");
      const source=headings.find(b=>normalize(String(b.text||""))===normalize(match[1]));
      const target=headings.find(b=>normalize(String(b.text||""))===normalize(match[2]));
      if(!source||!target||source.section===target.section)return NextResponse.json({error:"Não foi possível identificar as duas seções para a movimentação. O site foi preservado."},{status:422});
      const moved=editingSite.blocks.filter(b=>b.section===source.section);
      const remaining=editingSite.blocks.filter(b=>b.section!==source.section);
      const last=remaining.findLastIndex(b=>b.section===target.section);
      if(!moved.length||last<0)return NextResponse.json({error:"Movimentação não validada. O site foi preservado."},{status:422});
      remaining.splice(last+1,0,...moved);
      if(remaining.length!==editingSite.blocks.length||remaining.filter(b=>b.section===source.section).length!==moved.length)return NextResponse.json({error:"Falha na validação da movimentação. O site foi preservado."},{status:422});
      return NextResponse.json({site:{...editingSite,blocks:remaining},summary:'Seção "'+match[1]+'" movida integralmente para depois de "'+match[2]+'".'});
    }
  }
  const multiEditRequest = /(?:\b[123][.)]\s|\b(?:primeiro|segundo|terceiro)\b|\baltere\b[\s\S]*\balinhe\b|\balinhe\b[\s\S]*\baltere\b)/i.test(instructionText) || (/(?:t[ií]tulo|subt[ií]tulo|par[aá]grafo)/i.test(instructionText) && /bot[aã]o/i.test(instructionText));
  if (!isFresh && !multiEditRequest && Array.isArray(editingSite?.blocks) && /bot[aã]o/i.test(instructionText)) {
    const alignment=/centraliz|ao centro|no centro/i.test(instructionText)?"center":/alinhar?[^.]{0,50}(?:esquerda)|à esquerda/i.test(instructionText)?"left":/alinhar?[^.]{0,50}(?:direita)|à direita/i.test(instructionText)?"right":null;
    if(alignment) {
      const buttons=editingSite.blocks.filter(b=>b.type==="button");
      const named=buttons.find(b=>instructionText.toLocaleLowerCase("pt-BR").includes(String(b.text||"").toLocaleLowerCase("pt-BR")) && String(b.text||"").length>3);
      const hero=buttons.find(b=>/^(inicio|hero|home|principal)$/i.test(String(b.section||"")));
      const selected=named || (/(?:hero|inicial|primeira se[cç][aã]o)/i.test(instructionText)?hero:undefined) || (buttons.length===1?buttons[0]:undefined);
      if(selected) return NextResponse.json({site:{...editingSite,blocks:editingSite.blocks.map(b=>b===selected?{...b,align:alignment}:b)},summary:"Alinhamento do botão atualizado sem modificar outros elementos."});
    }
  }
  // Apply narrowly scoped button color edits without asking the model to regenerate the site.
  if (!isFresh && !multiEditRequest && Array.isArray(editingSite?.blocks) && /bot[aã]o/i.test(instructionText) && /(?:cor|color|fundo|background)/i.test(instructionText)) {
    const hex = instructionText.match(/#[0-9a-fA-F]{6}\b|#[0-9a-fA-F]{3}\b/);
    const namedColors:Record<string,string>={"verde-escuro":"#174D3A","verde escuro":"#174D3A","azul-marinho":"#101D33","preto":"#000000","branco":"#FFFFFF","dourado":"#B89B60"};
    const normalized=instructionText.toLocaleLowerCase("pt-BR");
    const requestedColor=hex?.[0] || Object.entries(namedColors).find(([name])=>normalized.includes(name))?.[1];
    if (requestedColor) {
      const buttons=editingSite.blocks.filter(b=>b.type==="button");
      const named=buttons.find(b=>String(b.text||"").length>3 && normalized.includes(String(b.text).toLocaleLowerCase("pt-BR")));
      const hero=buttons.find(b=>/^(inicio|hero|home|principal)$/i.test(String(b.section||"")));
      const selected=named || (/(?:hero|inicial|primeira se[cç][aã]o)/i.test(instructionText)?hero:undefined) || (buttons.length===1?buttons[0]:undefined);
      if(selected) {
        const blocks=editingSite.blocks.map(b=>b===selected?{...b,color:requestedColor}:b);
        return NextResponse.json({site:{...editingSite,blocks},summary:"Cor do botão atualizada; todos os demais elementos foram preservados."});
      }
    }
  }
  // Existing sites are edited with a compact patch response, never a full-site rewrite.
  if(!isFresh && Array.isArray(editingSite?.blocks) && editingSite.blocks.length) {
    const inventory=editingSite.blocks.map(b=>({id:b.id,type:b.type,role:b.type==="heading"?"section_title":b.type==="paragraph"&&/[:：]|\\s[—–]\\s/.test(String(b.text||""))?"card":"content",section:b.section,text:String(b.text||"").slice(0,220),align:b.align,color:b.color}));
    const editSystem='Você é o editor da PageNova. A instrução do usuário prevalece. Retorne SOMENTE JSON {"edits":[{"id":"ID existente","changes":{"text":"novo texto","align":"left|center|right","color":"#hex"}}],"insertions":[{"afterId":"ID existente","block":{"type":"button|heading|paragraph","text":"texto novo","color":"#hex","align":"left|center|right"}}],"sections":[{"afterSection":"ID da seção anterior","name":"Nome da nova seção","blocks":[{"type":"heading|paragraph|button","text":"conteúdo","align":"left|center|right","color":"#hex"}]}],"deletions":["ID existente"],"moves":[{"id":"ID a mover","beforeId":"ID opcional","toSection":"ID opcional da seção destino","position":"start|end"}],"summary":"resumo"}. Para criar uma seção inteira, use sections, mantendo exatamente os títulos de cards citados pelo usuário, sem sinônimos nem cortes de palavras. Cada card deve ter texto no formato "Título exato: descrição breve". com afterSection igual ao identificador de uma seção existente, name e todos os blocos necessários; não use insertions para criar seções. Preserve todas as seções existentes. Para reorganizar na mesma seção use moves com id e beforeId. Para transferir entre seções use moves com id, toSection igual ao ID de seção existente e position:"end" para último card. Preserve o mesmo ID, texto, cor e propriedades; não duplique nem recrie. Quando o usuário pedir títulos de cards, edite SOMENTE blocos paragraph da seção indicada, nunca blocos heading. Em cards, o título é a parte ANTES do primeiro ":" e a descrição é a parte DEPOIS; preserve integralmente a descrição e altere somente o título. Para editar, preserve IDs e altere apenas propriedades solicitadas. Para remover, retorne os IDs exatos em deletions e não edite os outros blocos. Para adicionar, escolha afterId do bloco que deve preceder o novo elemento, dentro da seção correta. Pode adicionar vários elementos. Não retorne o site inteiro. Não invente href. Execute TODAS as instruções solicitadas. Se não houver inserções, retorne insertions:[]; se não houver edições, retorne edits:[]. Se não houver exclusões, retorne deletions:[]. Se não houver movimentos, retorne moves:[]. Se não houver novas seções, retorne sections:[]. Título principal é o primeiro heading do hero; títulos de seção são heading. Cor dourada é #B89B60';
    try {
      const editResponse=await fetch("https://api.openai.com/v1/chat/completions",{method:"POST",headers:{"Authorization":"Bearer "+key,"Content-Type":"application/json"},body:JSON.stringify({model:"gpt-4.1-mini",max_completion_tokens:1800,response_format:{type:"json_object"},messages:[{role:"system",content:editSystem},{role:"user",content:JSON.stringify({instruction:instructionText,blocks:inventory})}]}),signal:AbortSignal.timeout(45000)});
      if(!editResponse.ok) return NextResponse.json({error:"Não foi possível interpretar as alterações. O projeto foi preservado."},{status:502});
      const editData=await editResponse.json();
      const payload=JSON.parse(String(editData?.choices?.[0]?.message?.content||"{}")) as {edits?:Array<{id?:string;changes?:Record<string,unknown>}>;insertions?:Array<{afterId?:string;block?:Record<string,unknown>}>;deletions?:string[];sections?:Array<{afterSection?:string;name?:string;blocks?:Array<Record<string,unknown>>}>;moves?:Array<{id?:string;beforeId?:string;toSection?:string;position?:string}>;summary?:string};
      if(!Array.isArray(payload.edits))payload.edits=[];
      const allowed=new Set(["text","align","color","fontSize","href","background","spacing","radius"]);
      const changesById=new Map<string,Record<string,unknown>>();
      for(const edit of payload.edits){
        if(typeof edit.id!=="string"||!editingSite.blocks.some(b=>b.id===edit.id)||!edit.changes||typeof edit.changes!=="object")continue;
        const clean:Record<string,unknown>={};
        for(const [k,v] of Object.entries(edit.changes)){
          if(!allowed.has(k))continue;
          if(k==="align"&&["left","center","right"].includes(String(v)))clean[k]=v;
          else if(["text","color","href","background"].includes(k)&&typeof v==="string")clean[k]=v;
          else if(["fontSize","spacing","radius"].includes(k)&&typeof v==="number"&&Number.isFinite(v))clean[k]=v;
        }
        const original=editingSite.blocks.find(b=>b.id===edit.id);
        const cardTitleRequest=/t[ií]tulos?\\s+(?:dos?\\s+)?cards?|cards?[^.]{0,90}t[ií]tulos?/i.test(instructionText);
        if(cardTitleRequest&&original?.type==="heading")continue;
        if(cardTitleRequest&&original?.type==="paragraph"&&typeof clean.text==="string"){
          const oldText=String(original.text||"");
          const separator=oldText.match(/:\\s|\\s[—–]\\s/);
          if(separator){
            const description=oldText.slice((separator.index||0)+separator[0].length);
            const newTitle=String(clean.text).split(/:\\s|\\s[—–]\\s/)[0].trim();
            if(newTitle)clean.text=newTitle+separator[0]+description;
          }
        }
        if(Object.keys(clean).length)changesById.set(edit.id,{...(changesById.get(edit.id)||{}),...clean});
      }
      const insertionsByAnchor=new Map<string,Array<Record<string,unknown>>>();
      const existingIds=new Set(editingSite.blocks.map(b=>String(b.id)));
      for(const insertion of Array.isArray(payload.insertions)?payload.insertions:[]){
        const anchor=editingSite.blocks.find(b=>b.id===insertion.afterId);
        const candidate=insertion.block;
        if(!anchor||!candidate||!["button","heading","paragraph"].includes(String(candidate.type))||typeof candidate.text!=="string"||!candidate.text.trim())continue;
        const id="added-"+crypto.randomUUID();
        const block:Record<string,unknown>={id,type:candidate.type,text:candidate.text,section:anchor.section||"contato",color:typeof candidate.color==="string"?candidate.color:"#B89B60",align:["left","center","right"].includes(String(candidate.align))?candidate.align:"left"};
        if(typeof candidate.href==="string"&&/^(https?:\/\/|mailto:|tel:|#)/.test(candidate.href))block.href=candidate.href;
        const entries=insertionsByAnchor.get(String(anchor.id))||[];
        entries.push(block);insertionsByAnchor.set(String(anchor.id),entries);existingIds.add(id);
      }
      const deletedIds=new Set((Array.isArray(payload.deletions)?payload.deletions:[]).filter((id):id is string=>typeof id==="string"&&editingSite.blocks!.some(b=>b.id===id)));
      if(!changesById.size&&!insertionsByAnchor.size&&!deletedIds.size&&!(Array.isArray(payload.moves)&&payload.moves.length)&&!(Array.isArray(payload.sections)&&payload.sections.length))return NextResponse.json({error:"Nenhuma alteração válida foi encontrada. O projeto foi preservado."},{status:422});
      const updatedBlocks=editingSite.blocks.filter(b=>!deletedIds.has(String(b.id))).flatMap(b=>[changesById.has(String(b.id))?{...b,...changesById.get(String(b.id))}:b,...(insertionsByAnchor.get(String(b.id))||[])]);
      for(const move of Array.isArray(payload.moves)?payload.moves:[]){
        if(!move.id)continue;
        const from=updatedBlocks.findIndex(b=>b.id===move.id);
        if(from<0)continue;
        const original=updatedBlocks[from];
        if(move.toSection){
          const targetSection=String(move.toSection);
          if(!updatedBlocks.some(b=>b.section===targetSection))continue;
          const [item]=updatedBlocks.splice(from,1);
          item.section=targetSection;
          const indices=updatedBlocks.map((b,i)=>b.section===targetSection?i:-1).filter(i=>i>=0);
          const destination=move.position==="start"?indices[0]:indices[indices.length-1]+1;
          updatedBlocks.splice(destination,0,item);
          continue;
        }
        if(!move.beforeId||move.id===move.beforeId)continue;
        const target=updatedBlocks.findIndex(b=>b.id===move.beforeId);
        if(target<0||original.section!==updatedBlocks[target].section)continue;
        const [item]=updatedBlocks.splice(from,1);
        updatedBlocks.splice(updatedBlocks.findIndex(b=>b.id===move.beforeId),0,item);
      }
      for(const section of Array.isArray(payload.sections)?payload.sections:[]){
        if(!section.name||!Array.isArray(section.blocks)||!section.blocks.length)continue;
        const sectionId="section-"+crypto.randomUUID();
        const fresh=section.blocks.filter(b=>["heading","paragraph","button"].includes(String(b.type))&&typeof b.text==="string"&&b.text.trim()).map(b=>({id:"added-"+crypto.randomUUID(),section:sectionId,type:b.type,text:b.text,color:typeof b.color==="string"?b.color:"#B89B60",align:["left","center","right"].includes(String(b.align))?b.align:"center",layout:"standard"}));
        if(!fresh.length)continue;
        const sectionTitle=String(section.name).trim();
        const headings=fresh.filter(b=>b.type==="heading");
        if(!headings.length){
          fresh.unshift({id:"added-"+crypto.randomUUID(),section:sectionId,type:"heading",text:sectionTitle,color:"#B89B60",align:"center",layout:"standard"});
        }else{
          const heading=headings[0];
          heading.text=sectionTitle;
          const index=fresh.indexOf(heading);
          if(index>0){fresh.splice(index,1);fresh.unshift(heading);}
        }
        const normalizeSection=(value:string)=>value.normalize("NFD").replace(/[\\u0300-\\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
        const sectionHeadings=updatedBlocks.filter(b=>b.type==="heading"&&b.section);
        const namedAnchor=sectionHeadings.find(b=>normalizeSection(String(b.text||""))===normalizeSection(String(section.afterSection||"")));
        const explicitAfter=String(instructionText).match(/(?:imediatamente\\s+)?(?:logo\\s+)?ap[oó]s\\s+(?:a\\s+)?se[cç][aã]o\\s+["“]?([^"”.,\\n]+)["”]?/i);
        const requestedAnchor=explicitAfter?sectionHeadings.find(b=>normalizeSection(String(b.text||""))===normalizeSection(explicitAfter[1])):undefined;
        const anchorId=requestedAnchor?.section||namedAnchor?.section||section.afterSection;
        const last=updatedBlocks.findLastIndex(b=>b.section===anchorId);
        updatedBlocks.splice(last>=0?last+1:updatedBlocks.length,0,...fresh);
      }
      return NextResponse.json({site:{...editingSite,blocks:updatedBlocks},summary:typeof payload.summary==="string"?payload.summary:"Alterações aplicadas aos elementos solicitados."});
    }catch(error){console.error("[builder-v2] edit patch error",error instanceof Error?error.message:"unknown");return NextResponse.json({error:"Não foi possível concluir a edição. O projeto foi preservado."},{status:502});}
  }
  const input = JSON.stringify({instruction:body.instruction,site:body.site,mode:isFresh?"create_full_website":"edit_existing_website"});
  if (input.length > 140000) return NextResponse.json({error:"Projeto grande demais."},{status:413});
  const imageInput: string = typeof body.image === "string" ? body.image : "";
  const image = ["data:image/png;base64,","data:image/jpeg;base64,","data:image/webp;base64,"].some(prefix => imageInput.startsWith(prefix)) && imageInput.length < 3000000 ? imageInput : null;
  const userContent = image ? [{type:"text",text:input},{type:"image_url",image_url:{url:image,detail:"low"}}] : input;
  let response: Response;
  try { response = await fetch("https://api.openai.com/v1/chat/completions",{
    method:"POST",headers:{"Authorization":"Bearer "+key,"Content-Type":"application/json"},
    body:JSON.stringify({model:"gpt-4.1-mini",max_completion_tokens:12000,response_format:{type:"json_object"},messages:[{role:"system",content:prompt},{role:"user",content:userContent}]}),
    signal:AbortSignal.timeout(75000)
  }); } catch { return NextResponse.json({error:"Tempo esgotado. O projeto foi preservado."},{status:504}); }
  if (!response.ok) return NextResponse.json({error:"A IA falhou. Nenhuma alteração foi aplicada."},{status:502});
  const data = await response.json();
  try {
    const raw = data?.choices?.[0]?.message?.content;
    if (typeof raw !== "string" || !raw.trim()) throw Error("empty");
    const output = JSON.parse(raw);
    if (!output.site || !Array.isArray(output.site.blocks) || !output.site.blocks.length || output.site.blocks.length > 120) throw Error("blocks");
    const incoming = output.site as {title?:string;background?:string;blocks:Array<{id?:string;type?:string;text?:string;color?:string;align?:string;src?:string;fontSize?:number;radius?:number;spacing?:number;section?:string}>};
    if (typeof incoming.title !== "string" || !incoming.title.trim()) incoming.title = "Site profissional";
    if (typeof incoming.background !== "string" || !incoming.background.trim()) incoming.background = "#ffffff";
    const seen = new Set<string>();
    incoming.blocks = incoming.blocks.map((block,index) => {
      if (!block || !["heading","paragraph","button","image"].includes(block.type||"") || typeof block.text !== "string") throw Error("block type");
      const id = typeof block.id === "string" && block.id.trim() ? block.id : "block-"+index;
      const uniqueId = seen.has(id) ? id+"-"+index : id;
      seen.add(uniqueId);
      return {...block,id:uniqueId,align:["left","center","right"].includes(block.align||"")?block.align:"left",color:typeof block.color==="string"&&block.color.trim()?block.color:"#263343",
        ...(typeof block.fontSize==="number"?{fontSize:Math.min(120,Math.max(8,block.fontSize))}:{}),
        ...(typeof block.spacing==="number"?{spacing:Math.min(120,Math.max(0,block.spacing))}:{})};
    });
    if (incoming.blocks.length < 4 && isFresh) throw Error("incomplete");
    return NextResponse.json({site:incoming,summary:typeof output.summary==="string"?output.summary:"Site gerado e validado."});
  } catch (error) {
    console.error("[builder-v2] invalid AI response",error instanceof Error?error.message:"unknown",data?.choices?.[0]?.finish_reason);
    return NextResponse.json({error:"A IA não retornou um site válido e completo. Tente novamente; seu projeto foi preservado."},{status:502});
  }
}
