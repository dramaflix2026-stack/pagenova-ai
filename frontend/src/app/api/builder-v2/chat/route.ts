import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { applyAnnouncementTextInstruction, referencesTopAnnouncement, DEFAULT_BUILDER_ANNOUNCEMENT } from "@/lib/builder-v2-announcement";
import { applyInstitutionalEdit } from "@/lib/builder-v2-institutional-edits";
import { applySiteMotionInstruction, hasMotionIntent, initialSiteMotion, isMotionOnlyInstruction, type SiteMotion } from "@/lib/site-builder-animation";
import {applySocialInstruction,socialLinksFromInstruction} from "@/lib/site-social-links";
import {reserveBuilderV2Generation,generationCreditError} from "@/lib/builder-v2-generation-credits";

// Social links are optional, never fabricated. The layout supports all three brands
// automatically; only destinations explicitly supplied by the client are published.
function socialFromBrief(brief:string){
  const social=socialLinksFromInstruction(brief);
  return {
    ...social,
    showFloatingWhatsapp:!/\b(?:sem|remover|ocultar|desativar)\s+(?:o\s+)?(?:bot[aã]o\s+)?whatsapp\s+flutuante\b/i.test(brief)
  };
}

export const runtime = "nodejs";
export const maxDuration = 300;
export async function POST(req: NextRequest) {
  const origin=req.headers.get("origin");
  if(origin&&origin!==req.nextUrl.origin)return NextResponse.json({error:"Origem não autorizada."},{status:403});
  const user = (await (await createClient()).auth.getUser()).data.user;
  if (!user) return NextResponse.json({error:"Faça login."},{status:401});
  const key = process.env.OPENAI_API_KEY;
  if (!key) return NextResponse.json({error:"IA não configurada."},{status:503});
  let body: Record<string,unknown>;
  try { body = await req.json(); } catch { return NextResponse.json({error:"Pedido inválido."},{status:400}); }
  if (typeof body.instruction !== "string" || body.instruction.length > 20000) return NextResponse.json({error:"Pedido inválido."},{status:400});
  const currentBlocks = (body.site as {blocks?:unknown[]}|undefined)?.blocks;
  const isFresh = !Array.isArray(currentBlocks) || currentBlocks.length === 0;
  const prompt = `Você é o motor de edição PageNova Builder 2.0. A instrução do usuário prevalece sobre o template. A plataforma dispõe de modelos internos invisíveis para acelerar a criação, mas nunca exige que o usuário escolha um modelo. Se receber somente "Faça um site para advogados", "site para restaurante" ou outra descrição mínima, infira o segmento e entregue um site COMPLETO com arquitetura, identidade visual e textos adequados, sem perguntar por detalhes. O usuário pode refinar tudo depois pelo chat. Retorne APENAS JSON válido {"site":{...},"summary":"..."}.
Esquema site: {"title":string,"background":cor CSS,"blocks":[{"id":string,"type":"heading"|"paragraph"|"button"|"image","text":string,"color":cor CSS,"align":"left"|"center"|"right","src"?:string,"href"?:string,"section"?:string,"fontSize"?:number,"radius"?:number,"spacing"?:number,"layout"?:"hero"|"grid"|"split"|"banner"|"faq"|"gallery"|"standard","background"?:string,"columns"?:number}]}.
Cada bloco tem ID permanente; preserve IDs existentes. Em edição, modifique SOMENTE os elementos solicitados e mantenha rigorosamente todos os outros blocos, sua ordem e propriedades. Se o usuário pedir para trocar texto, substitua o texto exato do bloco correspondente. Se pedir cor, fonte/tamanho, espaçamento, alinhamento, botão, imagem ou reorganizar/adicionar/remover seção, execute nos blocos relevantes. Para botões, use href somente quando o usuário fornecer URL, telefone, e-mail ou âncora real; não invente destinos externos. Se o usuário pedir para trocar o link do botão, altere href e preserve o restante. Para mover uma seção, mova seus blocos em conjunto. Não se limite a modelos fixos. Cada seção pode ter layout hero, grid, split, banner, faq, gallery ou standard no primeiro bloco, além de background próprio. O primeiro bloco deve ser heading com layout e section. Para serviços e benefícios: gere um heading e 3 a 6 blocos paragraph SEPARADOS, cada um com nome e descrição curta; layout grid. Para depoimentos: gere heading e três blocos paragraph no formato Nome Sobrenome | Cidade - UF | relato ilustrativo específico do nicho; nunca apresente como avaliações verificadas. Para FAQ: gere heading e um bloco paragraph SEPARADO por pergunta, no formato "Pergunta? Resposta"; layout faq. Cada pergunta deve ter no máximo 14 palavras e cada resposta no máximo 35 palavras. Em serviços, tratamentos, etapas e diferenciais, escreva cada card como "Título curto: descrição de até 25 palavras". Quando o briefing trouxer títulos explícitos para cards, use exatamente esses títulos, palavra por palavra, na ordem indicada. Nunca parafraseie, resuma ou omita a última palavra. Preserve também todas as seções explicitamente pedidas. Não escreva um parágrafo longo por card. Não afirme que o negócio possui equipamentos, equipe, certificações, tratamentos específicos, tempo de sessão ou resultados comprovados sem o usuário informar isso. Não anuncie formulário, WhatsApp, agendamento ou canal de contato como disponível se não houver link ou integração fornecida. Evite prometer resultados garantidos. Para depoimentos, gere 3 paragraphs distintos como Nome Sobrenome | Cidade - UF | comentário demonstrativo específico do nicho; os relatos são exemplos fictícios e não devem ser apresentados como avaliações reais. Para galeria: heading e blocos image separados; layout gallery. Para equipe e estrutura: layout split com heading, texto e imagem. Não escreva instruções de design dentro do texto do site. Não crie dados de contato fictícios, nem rodapé com ano ou endereço inventados. Escolha o layout pelo nicho e permita ao usuário alterá-lo pelo chat. Nunca invente nome de empresa, escritório ou pessoa. Se o briefing não informar marca, use um título descritivo neutro. Varie realmente a composição entre seções, alternando hero, grid, split, banner e faq conforme fizer sentido; evite 10 seções com o mesmo estilo. Para um escritório de advocacia, escolha tipografia sóbria e paleta elegante (ex.: azul-marinho, marfim e dourado discreto), hero institucional, áreas de atuação em cards separados, apresentação do escritório, diferenciais factuais sem promessas, processo de atendimento, perguntas frequentes e CTA de contato. Evite linguagem mercantilista, garantia de resultados, depoimentos fictícios, especializações ou registros OAB inventados. Para outros segmentos, infira a identidade visual e estrutura adequada sem depender de palavras exatas no briefing. Evite escrever "a definir" no rodapé público: omita dados que não foram informados e use CTA genérico editável sem link fictício. Ao criar novo site, produza 7 a 10 seções relevantes, cada uma com um identificador section próprio, composição editorial de títulos curtos, descrições objetivas e CTAs adequados. Evite parágrafos enormes e repetitivos. Nunca invente endereço, telefone, e-mail, anos de experiência, depoimentos, profissionais, certificações ou URLs de imagens; omita informações não fornecidas sem mostrar "A definir". Para imagens não disponíveis, evite criar espaços vazios em excesso: priorize composição tipográfica e cards sem fotos. Se o usuário fornecer URL válida de imagem, use src; se fornecer somente referência visual, não finja ter gerado uma imagem. Quando houver imagem de referência, analise-a para aplicar as alterações visuais ou textuais solicitadas; não alegue que substituiu uma imagem se não recebeu uma URL ou arquivo utilizável. O campo summary deve explicar brevemente a ação executada em português.`;

  const cleanGeneratedCopy = (value: string) => value.replace(/\s*[-–—]\s*(?:(?:grid|hero|faq|banner|split|standard|gallery)|(?:fundo\s+)?(?:areia|branco|verde|escuro|claro|preto))(?:\s*[-–—]\s*(?:(?:fundo\s+)?(?:areia|branco|verde|escuro|claro|preto)))*/giu, "").replace(/\s*[-–—,;]?\s*(?:layout|design|background|fundo)\s*:\s*[^,;]+/giu, "").replace(/\s*[-–—]\s*$/u, "").trim();
  const removeLayoutHeading = (value:string,section:string) => {const result=value.replace(/\b(?:hero|tratamentos?|apresenta[cç][aã]o|diferenciais|galeria|contato|faq)\s+layout\s+(?:hero|grid|split|banner|faq|gallery|standard)?\s*(?:com\s+)?(?:fundo\s+)?(?:areia(?:\s+claro)?|branco|verde|escuro|claro|preto)?/giu,"").replace(/\b(?:layout\s+(?:hero|grid|split|banner|faq|gallery|standard)|fundo\s+(?:areia(?:\s+claro)?|branco|verde|escuro|claro|preto))\b/giu,"").trim();return result||(/tratament|servi[cç]/i.test(section)?"Nossos tratamentos":/apresent|sobre/i.test(section)?"Sobre nós":/diferenc/i.test(section)?"Nossos diferenciais":/galeria/i.test(section)?"Galeria de imagens":/contato/i.test(section)?"Entre em contato":/faq/i.test(section)?"Dúvidas frequentes":"Conheça nossos serviços");};
  const fabricatedContact = /(?:\(?11\)?\s*1234[-\s]?5678|\(?11\)?\s*9?8765[-\s]?4321|contato@clinic[a-z.]*|rua principal\s*,?\s*123)/i;
  const inventedContact = /(?:\+?55\s*)?\(?\d{2}\)?\s*9?\d{4}[-\s]?\d{4}|[\w.+-]+@[\w.-]+\.[a-z]{2,}|(?:rua|avenida|av\.|alameda|travessa)\s+[^.;|\n]{3,90}\s*,\s*\d{1,5}/i;
  const designOnlyHeading = /^(?:editorial|portf[oó]lio exclusivo assim[eé]trico(?: e imagens sobrepostas)?|imagens sobrepostas|composi[cç][aã]o assim[eé]trica|layout editorial|hero editorial|estilo editorial)$/i;
  // New websites are assembled in small independently validated batches.
  // Existing-site edits still use the original editing path below.
  if (isFresh) {
    // A NEW site spends exactly one shared CRM/Studio generation credit.
    // Existing sites never enter this branch and their edits remain free.
    let charge:Awaited<ReturnType<typeof reserveBuilderV2Generation>>;
    try {
      const identity=(body.site as {id?:unknown}|undefined)?.id;
      const key=typeof identity==="string"&&/^[a-zA-Z0-9_-]{8,120}$/.test(identity)?identity:crypto.randomUUID();
      charge=await reserveBuilderV2Generation(user,key);
    }catch(error){return generationCreditError(error) as NextResponse;}
    const instruction = String(body.instruction);
    const requestedLanguage=/\b(?:em|idioma|língua|language|write in)\s+(?:espanhol|español|spanish|inglês|english|francês|french)\b/i.test(instruction)?instruction.match(/\b(?:espanhol|español|spanish|inglês|english|francês|french)\b/i)?.[0]:"português brasileiro";
    const languageRule=`Escreva TODOS os textos públicos e botões exclusivamente em ${requestedLanguage}. Não misture espanhol, inglês ou português entre título, subtítulo, cards e CTA. O idioma do usuário só muda se ele pedir explicitamente outro idioma.`;
    const callAI = async (system: string, user: unknown, tokens: number) => {
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method:"POST",
        headers:{"Authorization":"Bearer "+key,"Content-Type":"application/json"},
        body:JSON.stringify({model:"gpt-4.1-mini",max_completion_tokens:tokens,
          response_format:{type:"json_object"},
          messages:[{role:"system",content:system},{role:"user",content:JSON.stringify(user)}]}),
        signal:AbortSignal.timeout(75000)
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
        languageRule+" Você é a PageNova AI. Responda somente JSON {title:string,background:string}. Leia o briefing e identifique corretamente o segmento. Use como title o nome comercial fornecido; se não houver nome, um título neutro e específico do nicho. Não invente marcas, profissionais, credenciais ou dados de contato. Escolha uma cor CSS de fundo clara. Não gere seções nem conteúdo nesta etapa.",
        {instruction},350
      );
      // An explicit card count in the customer brief overrides Template 1 defaults.
      const serviceCountMatch=instruction.match(/(?:servi[cç]os|atividades)\s*(?:com|:|-)?\s*(\d{1,2})\s*(?:cards?|itens?)|\b(\d{1,2})\s*(?:cards?|itens?)\s*(?:de\s+)?servi[cç]os/i);
      const requestedServiceCount=serviceCountMatch?Number(serviceCountMatch[1]||serviceCountMatch[2]):4;
      const serviceCount=requestedServiceCount>=3&&requestedServiceCount<=12?requestedServiceCount:4;
      // Template 1 has a deterministic structure; AI is responsible for niche-specific
      // copy and design, not for deleting essential sections or making a gallery the hero.
      // Later edits still honor the user's chat instructions and preserve existing blocks.
      const sections: Array<{id:string;layout:string;goal:string}> = [
        {id:"inicio",layout:"hero",goal:"Capa principal do negócio, com proposta de valor clara, subtítulo e CTA para #servicos. Nunca usar galeria, nosso espaço ou equipe como título principal."},
        {id:"servicos",layout:"grid",goal:`EXATAMENTE ${serviceCount} cards de serviços ou atividades relevantes para o segmento, com ${serviceCount} blocos paragraph separados, títulos específicos e descrições objetivas, sem inventar especializações.`},
        {id:"sobre",layout:"split",goal:"Apresentação institucional do negócio com abordagem e proposta de trabalho, sem inventar histórico, estrutura, profissionais ou anos de experiência."},
        {id:"diferenciais",layout:"grid",goal:"EXATAMENTE QUATRO cards distintos com motivos para escolher o atendimento, em quatro blocos paragraph separados. Use compromissos plausíveis sem inventar resultados, equipe ou certificações."},
        {id:"processo",layout:"grid",goal:"Como funciona o atendimento ou a experiência do cliente, em três etapas objetivas e adequadas ao nicho."},
        {id:"galeria",layout:"gallery",goal:"Galeria de imagens do segmento; heading e três imagens descritivas com src vazio para a biblioteca de fotos preencher."},
        {id:"depoimentos",layout:"grid",goal:"Três relatos demonstrativos contextualizados para o nicho, explicitamente ilustrativos, sem atribuir avaliações reais a pessoas inexistentes. Cada paragraph no formato Nome Sobrenome | Cidade - UF | texto curto sobre a experiência do nicho. Nomes e cidades são personagens fictícios de exemplo; não usar credenciais, promessas ou resultados médicos."},
        {id:"faq",layout:"faq",goal:"Quatro perguntas frequentes com respostas curtas e úteis, sem afirmar dados comerciais não fornecidos."},
        {id:"contato",layout:"banner",goal:"Uma única seção de contato, com descrição breve e formulário de contato; não inventar endereços, e-mails ou telefones."}
      ];
      // The universal template is a starting point, not a ceiling for user-requested sections.
      // Plan additional sections before generating copy; preserve every canonical section.
      const sectionPlan = await callAI(
        languageRule + " Analise o briefing de criação de site e retorne SOMENTE JSON {extraSections:[{id:string,title:string,layout:string,goal:string}]}. Liste apenas seções ADICIONAIS explicitamente pedidas pelo cliente e ainda não cobertas pelas seções padrão: início, serviços, sobre/história, diferenciais, processo/como funciona, galeria, depoimentos, FAQ e contato. Planos/preços, equipe, horários, modalidades, transformações e programas de fidelidade são exemplos de seções extras quando solicitadas. Não confunda quantidade de cards com quantidade de seções. IDs curtos, únicos, em minúsculas, sem acentos, usando hífen. layout deve ser grid, split, gallery ou banner. Preserve valores, itens, quantidades e botões mencionados no briefing dentro de goal. Se não houver extras, retorne lista vazia. Não invente solicitações.",
        {instruction,existingSections:sections.map(({id,goal})=>({id,goal}))},2400
      );
      const requestedExtras = Array.isArray(sectionPlan.extraSections)?sectionPlan.extraSections:[];
      const existingSectionIds = new Set(sections.map(section=>section.id));
      for(const raw of requestedExtras.slice(0,20)){
        if(!raw || typeof raw!=="object")continue;
        const item=raw as Record<string,unknown>;
        const id=String(item.id||"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9-]/g,"-").replace(/-+/g,"-").replace(/^-|-$/g,"").slice(0,48);
        if(!id || existingSectionIds.has(id) || id.length<3)continue;
        const layout=["grid","split","gallery","banner"].includes(String(item.layout))?String(item.layout):"grid";
        const title=String(item.title||id).slice(0,100);
        const goal=String(item.goal||title).slice(0,1200);
        sections.push({id,layout,goal:"Seção adicional solicitada pelo cliente: "+title+". "+goal+". Inclua heading e conteúdo completo; respeite dados, preços, quantidades e links fornecidos, sem inventar informações."});
        existingSectionIds.add(id);
      }
      // Keep each parallel AI call small enough to finish within the request budget.
      const batchSize=2;
      const batches=Array.from({length:Math.ceil(sections.length/batchSize)},(_,i)=>sections.slice(i*batchSize,(i+1)*batchSize));
      const forbiddenDesignCopy = /(?:paleta sofisticada|tons areia|off-white|grafite e detalhes|tipografia elegante|profundidade e textura|composi[cç][oõ]es assim[eé]tricas|fotografias realistas|est[eé]tica minimalista|layout editorial|cards repetitivos)/i;
      const nicheArchitecture = /arquitet|interiores|atelier|ateli[eê]/i.test(instruction);
      const nicheHealthcare = /cl[ií]nica|est[eé]tica facial|tratamentos est[eé]ticos|beleza|spa/i.test(instruction);
      const results = await Promise.all(batches.map(async (batch,index) => {
        const generateBatch = async (selectedSections:typeof sections, tokens:number):Promise<unknown[]> => {
        const out = await callAI(
          languageRule+" Você é o redator e designer PageNova. Retorne APENAS JSON {blocks:[...]}. Para CADA seção solicitada, gere um heading e 1 a 5 blocos apropriados. Escreva somente conteúdo final para o visitante, nunca instruções de design ou placeholders como Título Principal Impactante, Subtítulo suave, Fundo azul-marinho, ícones dourados, Imagem a adicionar, ©2024 ou Redes Sociais (ícones). Não inclua rodapé sem dados reais. Campos obrigatórios de cada bloco: id string único, type heading|paragraph|button|image, text string, href string opcional para button, color string hexadecimal, align left|center|right, section id exato. No heading inicial da seção inclua layout e background. Use cores com alto contraste; hero fundo escuro, outras seções claras, grids com cards claros. Em grid: heading + 3 a 5 paragraphs separados, títulos curtos e descrições com até 20 palavras. EXCEÇÃO OBRIGATÓRIA: para section=servicos gere exatamente a quantidade indicada no goal; para section=diferenciais gere exatamente 4 paragraphs separados no formato Título curto: descrição. Não produza 3 nem 5 nesses dois casos. Nunca escreva Layout:, Background:, Design: ou instruções técnicas no texto público. Não invente credenciais ou resultados, nem alegue experiência comprovada, tecnologia exclusiva, resultados garantidos, eficácia, equipamentos próprios, profissionais certificados ou resultados duradouros sem fatos explícitos no briefing. Em cada grid, todos os cards devem ter título curto e descrição concreta separados por dois-pontos. Planeje variedade editorial: hero com CTA para âncora existente, serviços em grid sem imagens repetidas, história em split, diferenciais em cards, galeria, FAQ e contato com CTA somente se existir destino real. Evite prometer formulário que não existe. Em depoimentos: heading + exatamente três paragraphs separados com Nome Sobrenome | Cidade - UF | relato ilustrativo pertinente ao nicho, sem alegar testemunho real. Em faq: heading + perguntas no formato Pergunta? Resposta. Não crie URLs fictícias, dados de contato inventados, nomes de pessoas/escritórios inventados ou imagens falsas. Nunca gere números de telefone, e-mails ou endereços a menos que estejam literalmente presentes no briefing. Não use frases de clínica em sites de arquitetura. Não transforme instruções como editorial, assimétrico, sobreposição ou colagem em títulos públicos. Texto conciso, premium e adequado ao segmento. Gere todas as seções da lista, inclusive as adicionais solicitadas. Não omita nenhuma seção adicional. Em seções de planos, mantenha cada preço e benefício informado; em horários use entradas legíveis; em equipe não invente nomes reais. Para botões, inclua href com URL externa literal fornecida pelo cliente ou âncora #id de seção existente. Não gere seções fora da lista. CRÍTICO: o briefing mistura dados do NEGÓCIO e DIREÇÃO DE ARTE. Direção de arte nunca deve aparecer como diferencial, serviço, valor ou título. Exemplo proibido: Paleta Sofisticada, Profundidade e Textura, Estética Minimalista. Não use copy genérica de clínica (possibilidades de cuidado, tratamento) para arquitetura. Cada seção deve ter conteúdo real: portfólio com heading e pelo menos 3 blocos image de src vazio e text descritivo para o gerador de imagens posterior; metodologia em etapas curtas no formato Etapa: descrição, sem repetir a mesma frase no título e no corpo. Em serviços use descrições específicas do setor. Evite headings vazios. A instrução do usuário prevalece.",
          {instruction,siteTitle:plan.title,sections:selectedSections,batch:index},tokens
        );
        return Array.isArray(out.blocks)?out.blocks:[];
        };
        const recover = async (part:typeof sections,depth=0):Promise<unknown[]> => {
          try{return await generateBatch(part,depth===0?4500:3500);}
          catch(error){
            if(!(error instanceof Error)||error.message!=="truncated")throw error;
            if(part.length===1){
              // Single-section output must stay concise enough for the model limit.
              const section=part[0];
              const compact=part.map(v=>({...v,goal:v.goal.slice(0,500)}));
              return await generateBatch(compact,6000);
            }
            const middle=Math.ceil(part.length/2);
            const recovered=await Promise.all([recover(part.slice(0,middle),depth+1),recover(part.slice(middle),depth+1)]);
            return recovered.flat();
          }
        };
        return recover(batch);
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
          section:sectionName,layout:sections.find(v=>v.id===sectionName)?.layout,...(b.type==="button" && typeof b.href==="string" && (/^https?:\/\//i.test(b.href)||/^#[a-z0-9-]+$/i.test(b.href))?{href:b.href}:{})};
      }).filter((b):b is NonNullable<typeof b>=>b!==null);
      const mutableBlocks: Array<Record<string,unknown>> = blocks;
      const heroId=String(sections.find(v=>v.layout==="hero")?.id||"");
      const heroSeen=new Set<string>();
      for(let i=0;i<mutableBlocks.length;i++){
        const item=mutableBlocks[i];
        if(String(item.section)!==heroId||!["heading","paragraph","button"].includes(String(item.type)))continue;
        const kind=String(item.type);
        if(heroSeen.has(kind)){mutableBlocks.splice(i,1);i--;}else heroSeen.add(kind);
      }
      const galleryPlan=sections.find(v=>v.layout==="gallery");
      const faqPlan=sections.find(v=>v.layout==="faq");
      if(galleryPlan&&faqPlan){
        const galleryId=String(galleryPlan.id);
        if(!mutableBlocks.some(item=>item.section===galleryId&&item.type==="heading"))mutableBlocks.push({id:"gallery-heading",section:galleryId,layout:"gallery",type:"heading",text:"Galeria de imagens",color:"#24332e",align:"center"});
        if(!mutableBlocks.some(item=>item.section===galleryId&&item.type==="image")){
          for(let i=0;i<3;i++)mutableBlocks.push({id:"gallery-image-"+i,section:galleryId,layout:"gallery",type:"image",text:["Ambiente","Atendimento","Nossa atuação"][i],src:"",color:"#24332e",align:"center"});
        }
        const galleryBlocks=mutableBlocks.filter(item=>item.section===galleryId);
        const otherBlocks=mutableBlocks.filter(item=>item.section!==galleryId);
        const faqIndex=otherBlocks.findIndex(item=>item.section===String(faqPlan.id));
        otherBlocks.splice(faqIndex<0?otherBlocks.length:faqIndex,0,...galleryBlocks);
        mutableBlocks.splice(0,mutableBlocks.length,...otherBlocks);
      }

      // Template 1: the two commercial card sections always contain four distinct cards.
      // If the model underproduces, request only the missing copy; preserve all other sections.
      for(const sectionId of ["servicos","diferenciais"]){
        const targetCount=sectionId==="servicos"?serviceCount:4;
        const cards=mutableBlocks.filter(item=>item.section===sectionId&&item.type==="paragraph");
        if(cards.length>targetCount){
          const redundant=new Set(cards.slice(targetCount));
          for(let i=mutableBlocks.length-1;i>=0;i--)if(redundant.has(mutableBlocks[i]))mutableBlocks.splice(i,1);
        }else if(cards.length<targetCount){
          const missing=targetCount-cards.length;
          const supplement=await callAI(
            "Você completa cards específicos de um site profissional sem modificar outras seções. Retorne apenas JSON {cards:[{title:string,description:string}]}. Forneça exatamente a quantidade solicitada de novos cards, com títulos diferentes dos existentes. Descrição factual, concisa e adequada ao nicho, até 20 palavras; não invente equipe, métodos certificados, experiência, especializações, resultados, endereço ou telefone.",
            {instruction,siteTitle:plan.title,section:sectionId,existingCards:cards.map(item=>item.text),count:missing},1100
          );
          const candidates=Array.isArray(supplement.cards)?supplement.cards:[];
          const priorTitles=new Set(cards.map(item=>String(item.text).split(":")[0].trim().toLocaleLowerCase("pt-BR")));
          let appended=0;
          for(const item of candidates){
            if(!item||typeof item!=="object")continue;
            const candidate=item as Record<string,unknown>;
            if(typeof candidate.title!=="string"||typeof candidate.description!=="string")continue;
            const title=cleanGeneratedCopy(candidate.title).trim();
            const description=cleanGeneratedCopy(candidate.description).trim();
            if(!title||!description||title.length>85||description.length>210||forbiddenDesignCopy.test(title+" "+description)||inventedContact.test(title+" "+description))continue;
            if(priorTitles.has(title.toLocaleLowerCase("pt-BR")))continue;
            priorTitles.add(title.toLocaleLowerCase("pt-BR"));
            mutableBlocks.push({id:"card-"+sectionId+"-"+crypto.randomUUID(),section:sectionId,layout:"grid",type:"paragraph",text:title+": "+description,color:"#24332e",align:"left"});
            appended++;
            if(appended===missing)break;
          }
          // Keep the validated layout complete even when the model returns too few cards.
          // These editable placeholders are only used for genuinely missing cards.
          const fallbackCards=sectionId==="servicos"?[
            ["Atendimento personalizado","Soluções adaptadas às necessidades de cada cliente."],
            ["Qualidade no serviço","Atenção aos detalhes em cada etapa do atendimento."],
            ["Orientação clara","Informações objetivas para ajudar na escolha do serviço."],
            ["Facilidade de contato","Um canal direto para esclarecer dúvidas e solicitar informações."]
          ]:[
            ["Atenção aos detalhes","Cuidado com cada etapa do serviço."],
            ["Comunicação transparente","Informações claras durante o atendimento."],
            ["Soluções sob medida","Atendimento alinhado às necessidades apresentadas."],
            ["Experiência acolhedora","Uma jornada simples e organizada para o cliente."]
          ];
          for(let j=appended;j<missing;j++){
            const [title,description]=fallbackCards[(cards.length+j)%fallbackCards.length];
            mutableBlocks.push({id:"card-"+sectionId+"-"+crypto.randomUUID(),section:sectionId,layout:"grid",type:"paragraph",text:title+": "+description,color:"#24332e",align:"left"});
          }
        }
      }

      // Ensure cinematic FAQ entries contain actual answers before saving the generated site.
      if((body.site as {cinematic?:{mode?:string}}|undefined)?.cinematic?.mode==="cinematic"){
        const faqBlocks=mutableBlocks.filter(b=>b.type==="paragraph"&&/faq|perguntas|d[uú]vidas/i.test(String(b.section||"")));
        const unanswered=faqBlocks.filter(b=>{const q=String(b.text||"");const at=q.indexOf("?");return at<0||!q.slice(at+1).trim();});
        if(unanswered.length){
          const completion=await callAI("Complete somente respostas de perguntas frequentes para um site. Retorne JSON {answers:[{question:string,answer:string}]}. Responda em português, até 35 palavras por resposta, sem inventar horários, preços, opções de cardápio, disponibilidade, endereços ou promessas. Se um dado depender da empresa, explique como confirmar com ela.",{siteTitle:plan.title,briefing:instruction,questions:unanswered.map(b=>b.text)},1800);
          const answers=Array.isArray(completion.answers)?completion.answers:[];
          for(let i=0;i<unanswered.length;i++){
            const item=answers[i] as {answer?:unknown}|undefined;
            const answer=typeof item?.answer==="string"?cleanGeneratedCopy(item.answer).trim():"";
            if(!answer)throw new Error("incomplete-faq");
            const question=String(unanswered[i].text).trim();
            unanswered[i].text=question+(question.endsWith("?")?"":"?")+" "+answer;
          }
        }
      }

      // Default CTAs are real editable blocks. AI chat may change, move or delete them.
      for(const sectionId of ["servicos","depoimentos"]){
        if(!mutableBlocks.some(b=>b.section===sectionId&&b.type==="button")){
          mutableBlocks.push({id:"cta-"+sectionId+"-"+crypto.randomUUID(),section:sectionId,type:"button",text:"Entre em contato",href:"#contato",color:"#234b3a",align:"center"});
        }
      }
            // Reject an apparently successful response if any core Template 1 section vanished.
      // The fallback below is safer than publishing a three-section "complete" site.
      // The template order is fixed regardless of the model's JSON item ordering.
      const canonicalIds=sections.map(section=>section.id);
      mutableBlocks.sort((a,b)=>{
        const diff=canonicalIds.indexOf(String(a.section))-canonicalIds.indexOf(String(b.section));
        if(diff)return diff;
        return (a.type==="heading"?-1:0)-(b.type==="heading"?-1:0);
      });
      const heroTitle=mutableBlocks.find(b=>b.section==="inicio"&&b.type==="heading");
      if(heroTitle&&/^(?:nosso espa[cç]o|nossos ambientes|galeria|consult[oó]rio|nossa equipe|ambiente acolhedor)$/i.test(String(heroTitle.text).trim())){
        heroTitle.text=typeof plan.title==="string"&&plan.title.trim()?plan.title.trim():"Conheça nossa proposta";
      }
      const coreIds=["inicio","servicos","sobre","diferenciais","processo","galeria","faq","contato"];
      const generatedIds=new Set(mutableBlocks.map(b=>String(b.section)));
      const missing=coreIds.filter(id=>!generatedIds.has(id));
      const meaningful=(id:string)=>mutableBlocks.filter(b=>b.section===id && (b.type==="paragraph" || b.type==="button" || b.type==="image")).length;
      const weak=coreIds.filter(id=>meaningful(id)<(id==="servicos"?serviceCount:id==="diferenciais"?4:id==="faq"?3:1));
      if(mutableBlocks.length<24||missing.length||weak.length)throw new Error("incomplete-site:"+[...missing,...weak].join(","));
      const absentExtras=sections.filter(section=>!coreIds.includes(section.id)&&!mutableBlocks.some(b=>b.section===section.id&&b.type==="heading") );
      if(absentExtras.length)throw new Error("missing-requested-sections:"+absentExtras.map(s=>s.id).join(","));
      const generatedSections=new Set(mutableBlocks.map(b=>String(b.section)));
      await charge.finish(true);
      return NextResponse.json({site:{title:typeof plan.title==="string"?plan.title:"Site profissional",background:typeof plan.background==="string"?plan.background:"#ffffff",blocks:mutableBlocks,motion:initialSiteMotion(instruction),extras:{enabled:{}},footer:socialFromBrief(instruction)},summary:"Site completo criado em etapas e validado: "+generatedSections.size+" seções; animações "+(initialSiteMotion(instruction).preset==="none"?"desligadas":"profissionais ativadas")+"."});
    } catch(error) {
      try{await charge.finish(false);}
      catch(settlementError){console.error("[builder-v2] credit refund failed",settlementError instanceof Error?settlementError.name:"unknown");}
      console.error("[builder-v2] staged generation failed",error instanceof Error?error.message:"unknown");
      // Never silently publish an incomplete or generic fallback as a finished site.
      return NextResponse.json({error:"Não foi possível concluir o Template 1 com todas as seções. Seu projeto foi preservado; tente gerar novamente."},{status:502});
    }
  }
  // Resolve simple alignment requests locally to avoid regenerating the full site.
  const instructionText=String(body.instruction);
  // A complete site-creation brief always takes precedence over incremental editing handlers.
  const fullSiteBrief=/(?:crie|criar|gere|gerar|monte|construa|desenvolva)\s+(?:um\s+)?site\b/i.test(instructionText);

  const editingSite=body.site as {title?:string;background?:string;motion?:SiteMotion;blocks?:Array<Record<string,unknown>>;header?:Record<string,string|boolean>;footer?:Record<string,string|boolean>;extras?:{announcement?:string;[key:string]:unknown}}|undefined;
  // Immersive 3D edits are scoped to their own editable content contract.
  if(!isFresh&&!fullSiteBrief&&(body.site as {cinematic?:{mode?:string}}|undefined)?.cinematic?.mode==="immersive-3d"){
    const current=body.site as {title?:string;header?:Record<string,unknown>;blocks:Array<Record<string,unknown>>;extras?:Record<string,unknown>;cinematic?:Record<string,unknown>};
    const blocks=current.blocks.map(b=>({...b}));
    const extras={...(current.extras||{})};
    const bakery={...((extras.bakery3d as Record<string,unknown>)||{})};
    const header={...(current.header||{})};
    const instruction=instructionText;
    const quoted=[...instruction.matchAll(/["“]([^"”]+)["”]/g)].map(m=>m[1]);
    const replacement=instruction.match(/(?:para|por)\s+["“]([^"”]+)["”]/i)?.[1]||quoted[0];
    const norm=(v:string)=>v.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
    const lower=norm(instruction);
    let changed=false;
    let summary="";
    const set=(key:string,value:unknown)=>{bakery[key]=value;changed=true;};
    const hero=blocks.find(b=>b.type==="heading"&&b.section==="inicio");
    const heroButton=blocks.find(b=>b.type==="button"&&b.section==="inicio");
    const sectionKey=/encomenda|pedido/.test(lower)?"order":/depoimento|avaliac|cliente/.test(lower)?"reviews":/localiz|enderec|horario|mapa|rota/.test(lower)?"location":/rodape/.test(lower)?"footer":null;
    if(sectionKey&&/titulo|descricao|texto/.test(lower)&&replacement&&!/depoimento|avaliac/.test(lower)){
      const suffix=/titulo/.test(lower)?"Title":"Description";
      set(sectionKey+suffix,replacement);summary="Conteúdo da seção atualizado.";
    }else if(sectionKey==="location"&&/enderec|rua|avenida|av\.|localiz/.test(lower)&&replacement){
      set("address",replacement);summary="Endereço e mapa atualizados.";
    }else if(sectionKey==="location"&&/horario|funcionamento|domingo|sabado/.test(lower)){
      set("hours",instruction.replace(/^.*?(?:para|:|funcionamento)\s*/i,""));summary="Horários atualizados.";
    }else if(sectionKey==="reviews"&&!/animac|efeito|movimento|parallax|zoom/.test(lower)&&/adicion|inclu|remov|exclu|alter|troc/.test(lower)){
      const defaults=["Ana Souza | São Paulo - SP | Sempre encontro pães fresquinhos e atendimento acolhedor que faz meu dia melhor.","Carlos Martins | Belo Horizonte - MG | Adoro a variedade de produtos naturais e o aroma gostoso que invade a loja.","Luiza Almeida | Curitiba - PR | O ambiente é agradável e os sabores tradicionais me trazem lembranças da infância."];
      const items=Array.isArray(bakery.reviews)?[...(bakery.reviews as string[])]:defaults;
      const index=/ultimo/.test(lower)?items.length-1:/segundo/.test(lower)?1:/terceiro/.test(lower)?2:0;
      if(/adicion|inclu/.test(lower)&&quoted.length){const person=instruction.match(/(?:de|do|da)\s+([A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+)+)\s+com\s+(?:o\s+)?texto/i)?.[1];items.push((person||"Cliente da padaria")+" | Avaliação de cliente | "+quoted.join(" | "));set("reviews",items);summary="Depoimento adicionado.";}
      else if(/remov|exclu/.test(lower)&&items.length){items.splice(index,1);set("reviews",items);summary="Depoimento removido.";}
      else if(/alter|troc/.test(lower)&&replacement&&items[index]){items[index]=replacement;set("reviews",items);summary="Depoimento atualizado.";}
    }else if(/animac|efeito|movimento|parallax|zoom/.test(lower)){
      const target=/fornada/.test(lower)?"fornada":/balcao|produto/.test(lower)?"balcao":/depoimento|avaliac|testemunh/.test(lower)?"reviews":/rodape/.test(lower)?"footer":/todas|site inteiro|todas as secoes/.test(lower)?"all":"hero";
      const off=/remov|desativ|sem animac|parar/.test(lower);
      const motions={...((bakery.motions as Record<string,boolean>)||{})};motions[target]=!off;
      set("motions",motions);summary="Animação "+(off?"desativada":"ativada")+" na seção selecionada.";
    }else if(sectionKey==="footer"&&/descricao|texto/.test(lower)&&replacement){
      set("footerDescription",replacement);summary="Descrição do rodapé atualizada.";
    }
    if(!changed)
    if(/(?:nome da padaria|nome do negocio|nome da empresa|marca do site|logotipo|logo da padaria)/.test(lower)&&/(?:alter|troc|mud|renome)/.test(lower)&&replacement&&!/(?:card|produto|balcao|fornada)/.test(lower)){
      header.brand=replacement;current.title=replacement;changed=true;summary="Marca atualizada em todas as áreas que utilizam a identidade do negócio.";
      if(hero&&typeof hero.text==="string"&&/padaria|pao nosso/i.test(hero.text))hero.text=replacement;
    }else if(/cor principal|cores? (?:do site|principal)|verde.oliva/.test(lower)&&/#[0-9a-f]{6}/i.test(instruction)){
      const color=instruction.match(/#[0-9a-f]{6}/i)![0];set("accent",color);summary="Cor de destaque aplicada aos componentes 3D.";
    }else if(/(?:titulo|texto principal).{0,30}(?:capa|principal)|(?:capa).{0,25}titulo/.test(lower)&&replacement&&hero){
      hero.text=replacement;changed=true;summary="Título principal da capa atualizado.";
    }else if(/botao/.test(lower)&&/(?:capa|principal)/.test(lower)&&heroButton){
      if(/balcao|balcão|o que tem no/.test(lower)){heroButton.href="#balcao";changed=true;}
      const buttonText=instruction.match(/(?:texto|nome)\s+do\s+bot[aã]o[^"“]*["“]([^"”]+)["”]/i)?.[1]||(/(?:texto|nome)\s+do\s+bot[aã]o/i.test(instruction)?quoted[0]:undefined);
      if(buttonText){heroButton.text=buttonText;changed=true;}
      summary="Botão da capa atualizado sem modificar o template.";
    }else if(/(?:animac|efeito|movimento)/.test(lower)){
      set("titleMotion",!/sem animac|desativ|remov|parar/.test(lower));summary="Animação do título configurada sem alterar o modo cinematográfico.";
    }else if(/fornada/.test(lower)&&/(?:titulo|t[ií]tulo)/.test(lower)&&replacement){
      set("fornadaTitle",replacement);summary="Título da fornada atualizado.";
    }else if(/fornada/.test(lower)&&/card/.test(lower)&&/(?:segundo|2[oº°]?)/.test(lower)&&quoted.length){
      const cards=Array.isArray(bakery.fornadaCards)?[...(bakery.fornadaCards as Array<[string,string]>)]:[["Pão quentinho","Crosta dourada e miolo macio"],["Croissant artesanal","Camadas leves e amanteigadas"],["Doces da casa","Um carinho em cada pedaço"],["Café fresquinho","O par perfeito para seu pão"]];
      cards[1]=[quoted[0],quoted[1]||cards[1][1]];set("fornadaCards",cards);summary="Segundo card da fornada atualizado.";
    }else if(/fornada/.test(lower)&&/card/.test(lower)&&/(?:primeiro|segundo|terceiro|quarto|1[oº°]?|2[oº°]?|3[oº°]?|4[oº°]?)/.test(lower)){
      const index=/primeiro|1[oº°]?/.test(lower)?0:/segundo|2[oº°]?/.test(lower)?1:/terceiro|3[oº°]?/.test(lower)?2:3;
      const cards=Array.isArray(bakery.fornadaCards)?[...(bakery.fornadaCards as Array<[string,string]>)]:[["Pão quentinho","Crosta dourada e miolo macio"],["Croissant artesanal","Camadas leves e amanteigadas"],["Doces da casa","Um carinho em cada pedaço"],["Café fresquinho","O par perfeito para seu pão"]];
      const name=instruction.match(/card[^"“]*["“]([^"”]+)["”]/i)?.[1];
      const description=instruction.match(/descri[cç][aã]o[^"“]*["“]([^"”]+)["”]/i)?.[1];
      if(name||description){cards[index]=[name||cards[index][0],description||cards[index][1]];set("fornadaCards",cards);summary="Card da fornada atualizado.";}
    }else if(/balcao/.test(lower)&&/(?:produto|card)/.test(lower)){
      const defaults=[["Pão francês","Sai quente a cada fornada, até a hora de fechar. Tem o integral também."],["Pão na chapa","Chapa bem quente, manteiga e requeijão cremoso. Sai com café coado."],["Trança de pistache","Massa macia, creme de pistache e pistache picado por cima."],["Coxinha de queijo puxa","Frita na hora. Também em mini, para festa."],["Café da manhã","Pães, café passado na hora e tudo para começar bem o dia."],["Doces da vitrine","Bolos e delícias artesanais preparados todos os dias."]];
      const items=Array.isArray(bakery.menu)?[...(bakery.menu as string[][])]:defaults;
      const name=instruction.match(/(?:chamado|para)\s+["“]([^"”]+)["”]/i)?.[1];
      const description=instruction.match(/descri[cç][aã]o\s+(?:para\s+)?["“]([^"”]+)["”]/i)?.[1];
      const index=/segundo|2[oº°]?/.test(lower)?1:/terceiro|3[oº°]?/.test(lower)?2:/quarto|4[oº°]?/.test(lower)?3:/ultimo/.test(lower)?items.length-1:0;
      if(/(?:adicion|inclu|novo produto)/.test(lower)&&name){items.push([name,description||""]);set("menu",items);summary="Produto adicionado ao balcão.";}
      else if(/(?:remov|exclu|apag)/.test(lower)&&items.length){items.splice(index,1);set("menu",items);summary="Produto removido do balcão.";}
      else if(/(?:alter|troc|mud|renome)/.test(lower)&&(name||description)&&items[index]){items[index]=[name||items[index][0],description||items[index][1]];set("menu",items);summary="Produto do balcão atualizado.";}
    }else if(/(?:balcao|balcão)/.test(lower)&&/(?:titulo|t[ií]tulo)/.test(lower)&&replacement){
      set("balcaoTitle",replacement);summary="Título do balcão atualizado.";
    }
    if(changed)return NextResponse.json({site:{...current,header,blocks,extras:{...extras,bakery3d:bakery}},summary});
    return NextResponse.json({error:"Este comando ainda não tem uma operação segura no Template 3D. Nenhuma alteração foi aplicada."},{status:422});
  }
  // Scoped deterministic edits take priority over generic handlers: a complex prompt
  // must be applied atomically, never answered as if only one sub-step succeeded.
  if(!isFresh&&!fullSiteBrief&&Array.isArray(editingSite?.blocks)&&editingSite.blocks.length&&(editingSite as typeof editingSite&{cinematic?:{mode?:string}}).cinematic?.mode!=="immersive-3d"){
    const localized=applyInstitutionalEdit(editingSite as typeof editingSite&{blocks:Array<Record<string,unknown>>},instructionText);
    if(localized){
      if("error" in localized)return NextResponse.json({error:localized.error},{status:422});
      return NextResponse.json(localized);
    }
  }
  // Top announcement is rendered from extras, not from a heading or CTA block.
  if(!isFresh&&Array.isArray(editingSite?.blocks)&&editingSite.blocks.length){
    const announcementEdit=applyAnnouncementTextInstruction(editingSite,instructionText);
    if(announcementEdit){
      if("error" in announcementEdit)return NextResponse.json({error:announcementEdit.error},{status:422});
      return NextResponse.json(announcementEdit);
    }
  }
  // Animation-only instructions must never regenerate copy, sections or images.
  // Deterministic social configuration. Never publish icons with missing destinations.
  if(!isFresh&&Array.isArray(editingSite?.blocks)&&/(faixa|aviso superior|banner superior)/i.test(instructionText)&&/(movimento|mover|passando|rolando|est[aá]tic|parar anima[cç][aã]o)/i.test(instructionText)){
    const current=(editingSite as typeof editingSite&{extras?:Record<string,unknown>}).extras||{};
    const off=/(est[aá]tic|parar|sem movimento|desativar)/i.test(instructionText);
    const speed=instructionText.match(/(\d{1,3})\s*(?:segundos|seg|s)\b/i);
    const extras={...current,announcementMotion:!off,announcementDirection:/direita/i.test(instructionText)?"right":"left",...(speed?{announcementSpeed:Math.max(8,Math.min(120,Number(speed[1])))}:{})};
    return NextResponse.json({site:{...editingSite,extras},summary:off?"Faixa superior estática.":"Movimento contínuo ativado na faixa superior."});
  }
  if(!isFresh&&Array.isArray(editingSite?.blocks)){
    const targets:[string,string][]=[["announcement","faixa de avisos"],["map","mapa"],["video","vídeo"],["comparison","antes e depois"],["partners","parceiros"],["pricing","planos"],["counters","contadores"],["popup","pop-up"],["faq","faq"],["backToTop","voltar ao topo"]];
    const text=instructionText.toLocaleLowerCase("pt-BR");
    const selected=targets.filter(([,label])=>text.includes(label));
    if(selected.length&&/(remover|retirar|excluir|ocultar|desativar|mostrar|adicionar|ativar|exibir|colocar)/i.test(text)){
      const current=(editingSite as typeof editingSite&{extras?:{enabled?:Record<string,boolean>}}).extras||{};
      const enabled={...(current.enabled||{})};
      const removing=/(remover|retirar|excluir|ocultar|desativar)/i.test(text);
      for(const [key] of selected)enabled[key]=!removing;
      return NextResponse.json({site:{...editingSite,extras:{...current,enabled}},summary:"Componentes atualizados pelo chat; outras seções preservadas."});
    }
  }
  if(!isFresh&&Array.isArray(editingSite?.blocks)){
    const socialEdit=applySocialInstruction(editingSite as typeof editingSite & {footer?:import("@/lib/site-social-links").SocialFooter},instructionText);
    if(socialEdit)return NextResponse.json({site:socialEdit.site,summary:socialEdit.summary});
  }
  // Header identity is independent from the page title and remains editable via chat.
  if(!isFresh && Array.isArray(editingSite?.blocks) && /(?:cabe[cç]alho|logo|logotipo|marca|menu)/i.test(instructionText)){
    const current=editingSite.header&&typeof editingSite.header==="object"?editingSite.header:{};
    const next={...current};
    // A brand/logo rename is distinct from changing the hero heading.
    // Examples: "Mude a logo de Pet Shop Natural para PetLoVe",
    // "Troque o nome da marca para PetLoVe", "Altere o texto do cabeçalho para PetLoVe".
    const renameWithOldName=instructionText.match(/(?:mude|altere|troque|substitua|renomeie|modifique|mudar|alterar|trocar)\s+(?:o|a)?\s*(?:nome(?:\s+(?:do|da)\s+(?:logo|logotipo|marca|cabe[cç]alho))?|texto(?:\s+(?:do|da)\s+(?:logo|logotipo|marca|cabe[cç]alho))?|logo(?:tipo)?|marca|identidade(?:\s+visual)?|cabe[cç]alho)\s+(?:(?:de|do|da)\s+["“”']?[^.!?\n]{1,80}?["“”']?\s+)?(?:para|por|como)\s+["“']?([^"”'\n.!?]{2,65})/i);
    const renameDirect=instructionText.match(/(?:nome|texto|marca|logo(?:tipo)?)\s+(?:(?:do|da|no|na|de)\s+)?(?:cabe[cç]alho|logo|marca)?\s*(?:para|por|como|:|é)\s*["“']?([^"”'\n.!?]{2,65})/i);
    const rename=renameWithOldName||renameDirect;
    const image=instructionText.match(new RegExp("https://[^\\s\\\"\x27<>]+[.](?:png|jpe?g|webp|svg)(?:[?][^\\s\\\"\x27<>]*)?","i"));
    let changed=false;
    const requestedBrand=rename?.[1]?.trim().replace(/["“”']+$/,"").trim();
    const isImageRequest=!!requestedBrand&&/^(?:(?:uma?|o|a)\s+)?(?:imagem|foto|ícone|icone|arquivo|símbolo|simbolo|logotipo\s+gráfico|logo\s+gráfica)\b/i.test(requestedBrand);
    if(requestedBrand&&!isImageRequest&&!/^https?:\/\//i.test(requestedBrand)){
      next.brand=requestedBrand;
      // A textual wordmark replaces any previous image logo so the new brand is visible.
      next.logoUrl="";
      changed=true;
    }
    if(image&&/(?:logo|logotipo|marca)/i.test(instructionText)){next.logoUrl=image[0];changed=true;}
    if(/(?:remov|retir|escond|ocult).{0,30}(?:logo|logotipo|imagem da marca)/i.test(instructionText)){next.logoUrl="";changed=true;}
    if(/(?:remov|retir|escond|ocult).{0,30}cabe[cç]alho/i.test(instructionText)){next.enabled=false;changed=true;}
    if(/(?:mostr|ativ|exib).{0,30}cabe[cç]alho/i.test(instructionText)){next.enabled=true;changed=true;}
    const bg=instructionText.match(/(?:fundo|background)\\s+(?:do\\s+)?cabe[cç]alho\\s+(?:para|em|:)\\s*(#[0-9a-fA-F]{6})/i);
    if(bg){next.background=bg[1];changed=true;}
    if(changed)return NextResponse.json({site:{...editingSite,header:next},summary:requestedBrand&&!isImageRequest?"Nome da marca no cabeçalho atualizado para "+requestedBrand+". Título principal, imagens e demais seções preservados.":"Identidade do cabeçalho atualizada. Demais seções preservadas."});
  }
  const explicitSectionReorder=/(?:mova|mover|reposicione|reorganize|coloque)\s+(?:a\s+)?se[cç][aã]o/i.test(instructionText);
  if (!isFresh && Array.isArray(editingSite?.blocks) && explicitSectionReorder) {
    const match=instructionText.match(/(?:mova|mover|reposicione|reorganize|coloque)\s+(?:a\s+)?se[cç][aã]o\s+["“]([^"”]+)["”]\s+para\s+(antes|depois)\s+d[aeo]\s+(?:se[cç][aã]o\s+)?["“]([^"”]+)["”]/i);
    if(!match)return NextResponse.json({error:"Informe os nomes das duas seções entre aspas e a posição desejada. Nada foi alterado."},{status:422});
    const normalize=(v:string)=>v.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
    const headings=editingSite.blocks.filter(b=>b.type==="heading"&&b.section);
    const sectionAliases:Record<string,string[]>={servicos:["nossos servicos","servicos","tratamentos","tratamentos para seu bem estar"],diferenciais:["diferenciais","nossos diferenciais","beneficios"],inicio:["inicio","capa","hero"],contato:["contato","fale conosco"],sobre:["sobre","sobre nos"]};
    const resolve=(label:string)=>{
      const wanted=normalize(label);
      const exact=headings.find(b=>normalize(String(b.text))===wanted||normalize(String(b.section))===wanted);
      if(exact)return exact;
      const aliasKey=Object.entries(sectionAliases).find(([,names])=>names.includes(wanted))?.[0];
      if(aliasKey){
        const byId=headings.find(b=>normalize(String(b.section)).includes(aliasKey));
        if(byId)return byId;
        const byTitle=headings.find(b=>sectionAliases[aliasKey].includes(normalize(String(b.text))));
        if(byTitle)return byTitle;
      }
      return undefined;
    };
    const source=resolve(match[1]);
    const target=resolve(match[3]);
    if(!source||!target||source.section===target.section)return NextResponse.json({error:"Seções não identificadas com segurança. Nenhuma alteração aplicada."},{status:422});
    const moving=editingSite.blocks.filter(b=>b.section===source.section);
    const remaining=editingSite.blocks.filter(b=>b.section!==source.section);
    const targetIndices=remaining.map((b,i)=>b.section===target.section?i:-1).filter(i=>i>=0);
    if(!moving.length||!targetIndices.length)return NextResponse.json({error:"Movimentação inválida. O site foi preservado."},{status:422});
    const position=match[2].toLowerCase()==="antes"?targetIndices[0]:targetIndices[targetIndices.length-1]+1;
    const blocks=[...remaining.slice(0,position),...moving,...remaining.slice(position)];
    // Verify an exact permutation: every block and every property must remain unchanged.
    const original=editingSite.blocks;
    const byId=new Map(original.map(b=>[String(b.id),JSON.stringify(b)]));
    const valid=blocks.length===original.length&&new Set(blocks.map(b=>String(b.id))).size===original.length&&blocks.every(b=>byId.get(String(b.id))===JSON.stringify(b));
    const resultingSections=[...new Set(blocks.map(b=>String(b.section||"principal")))];
    const sourceIndex=resultingSections.indexOf(String(source.section));
    const targetIndex=resultingSections.indexOf(String(target.section));
    if(!valid||sourceIndex<0||targetIndex<0||(match[2].toLowerCase()==="antes"?sourceIndex!==targetIndex-1:sourceIndex!==targetIndex+1)){
      return NextResponse.json({error:"Não foi possível preservar integralmente a ordem e o conteúdo. Nenhuma alteração aplicada."},{status:422});
    }
    return NextResponse.json({site:{...editingSite,blocks},summary:"Somente a posição da seção foi alterada. Textos, cards, imagens e configurações de todas as seções foram preservados."});
  }
  if (!isFresh && Array.isArray(editingSite?.blocks) && !explicitSectionReorder && !fullSiteBrief && isMotionOnlyInstruction(instructionText)) {
    return NextResponse.json({site:{...editingSite,motion:applySiteMotionInstruction(editingSite,instructionText)},summary:"Animações atualizadas pelo chat. Conteúdo e estrutura preservados."});
  }
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
      return NextResponse.json({site:{...editingSite,blocks:remaining,motion:hasMotionIntent(instructionText)?applySiteMotionInstruction({...editingSite,blocks:remaining},instructionText):editingSite.motion},summary:'Seção "'+match[1]+'" movida integralmente para depois de "'+match[2]+'".'});
    }
  }
  // Deterministic, section-scoped hero alignment: never touch unrelated sections.
  if(!isFresh&&Array.isArray(editingSite?.blocks)&&/centraliz|alinhar|alinhamento/i.test(instructionText)&&/capa|hero|principal/i.test(instructionText)&&/t[ií]tulo|descri[cç][aã]o/i.test(instructionText)){
    const align=/centraliz|centro/i.test(instructionText)?"center":/direita/i.test(instructionText)?"right":/esquerda/i.test(instructionText)?"left":null;
    if(align){const hero=editingSite.blocks.find(b=>b.type==="heading"&&/^(inicio|hero|home|principal)$/i.test(String(b.section||"")))?.section||editingSite.blocks.find(b=>b.type==="heading")?.section;
      if(hero){const changed=editingSite.blocks.map(b=>b.section===hero&&["heading","paragraph","button"].includes(String(b.type))?{...b,align}:b);
        return NextResponse.json({site:{...editingSite,blocks:changed},summary:"Alinhamento da capa aplicado somente aos seus textos e botões."});}
    }
  }
  // Handle service-card layout before styling; preservation clauses are not edits.
  if(!isFresh&&Array.isArray(editingSite?.blocks)&&/cards?|cart[oõ]es/i.test(instructionText)&&/colunas?/i.test(instructionText)&&/servi[cç]os|tratament|modalidade/i.test(instructionText)){
    const section=editingSite.blocks.find(block=>/servic|tratament|modalidade/i.test(String(block.section||"")))?.section;
    if(!section)return NextResponse.json({error:"Seção de Serviços não encontrada. Nenhuma alteração aplicada."},{status:422});
    const match=instructionText.match(/(\d+|uma|duas|tr[eê]s|quatro)\s+colunas?[^.]{0,45}desktop/i);
    const word=match?.[1]?.toLocaleLowerCase("pt-BR")||"";
    const count=({uma:1,duas:2,"três":3,tres:3,quatro:4}[word]||Number(word));
    if(!Number.isInteger(count)||count<1||count>4)return NextResponse.json({error:"Especifique de uma a quatro colunas no desktop."},{status:422});
    const blocks=editingSite.blocks.map(block=>block.section===section&&block.type==="paragraph"?{...block,columns:count}:block);
    return NextResponse.json({site:{...editingSite,blocks},summary:"Layout de Serviços: "+count+" colunas no desktop, uma no mobile. Cards e estilos preservados."});
  }
  // Scoped multi-property styling: do not silently discard border or shadow requests.
  if(!isFresh&&Array.isArray(editingSite?.blocks)&&/cards?|cart[oõ]es/i.test(instructionText)&&/arredond|cantos|borda|sombra/i.test(instructionText)){
    const target=editingSite.blocks.find(b=>/servic|tratament|modalidade/i.test(String(b.section||"")))?.section;
    if(!target)return NextResponse.json({error:"Não foi possível identificar a seção de Serviços. Nenhuma alteração aplicada."},{status:422});
    const radiusMatch=instructionText.match(/(?:cantos|raio|arredondamento)[^0-9]{0,45}(\\d{1,2})\\s*px/i);
    const borderMatch=instructionText.match(/borda[^.]{0,100}?(\\d{1,2})\\s*px/i);
    const colorMatch=instructionText.match(/#[0-9a-f]{6}\\b/i);
    const instructions=instructionText.split(/(?<=[.!?])\\s+/);
    const actionable=instructions.filter(sentence=>!/^(?:n[aã]o\\s+alter[ea]|preserv[ea]|mantenha|sem\\s+alterar|deixe\\s+como)/i.test(sentence.trim())).join(" ");
    const setRadius=/arredond|cantos|raio/i.test(actionable)&&!/(?:mantenha|preserve|n[aã]o altere)[^.]{0,65}(?:arredond|cantos|raio)/i.test(actionable);
    const setBorder=/borda/i.test(actionable)&&!/(?:mantenha|preserve|n[aã]o altere)[^.]{0,65}borda/i.test(actionable);
    const setShadow=/sombra/i.test(actionable);
    const stronger=/aument|intens|forte|mais vis[ií]vel|destac/i.test(actionable);
    const softer=/reduz|suaviz|mais leve|menos intens/i.test(actionable);
    const shadowValue=/sem sombra|remov[ae].{0,12}sombra/i.test(actionable)?"none":stronger?"0 14px 34px rgba(20,35,29,0.25)":softer?"0 5px 16px rgba(20,35,29,0.06)":"0 8px 24px rgba(20,35,29,0.10)";
    if(!setRadius&&!setBorder&&!setShadow)return NextResponse.json({error:"Nenhuma mudança de estilo identificada. Propriedades preservadas."},{status:422});
    const changed=editingSite.blocks.map(block=>{
      if(block.section!==target||block.type!=="paragraph")return block;
      return {...block,...(setRadius?{radius:radiusMatch?Math.min(48,Number(radiusMatch[1])):20}:{}),...(setBorder?{cardBorderWidth:borderMatch?Math.min(12,Number(borderMatch[1])):1,cardBorderColor:colorMatch?.[0]||"#E5E7EB"}:{}),...(setShadow?{cardShadow:shadowValue}:{})};
    });
    return NextResponse.json({site:{...editingSite,blocks:changed},summary:"Cards de Serviços: "+[setRadius?"cantos arredondados":null,setBorder?"borda aplicada":null,setShadow?stronger?"sombra intensificada":softer?"sombra suavizada":"sombra configurada":null].filter(Boolean).join(", ")+". Demais propriedades preservadas."});
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
    const editSystem='Você é o editor da PageNova. A instrução do usuário prevalece. Retorne SOMENTE JSON {"edits":[{"id":"ID existente","changes":{"text":"novo texto","align":"left|center|right","color":"#hex"}}],"insertions":[{"afterId":"ID existente","block":{"type":"button|heading|paragraph","text":"texto novo","color":"#hex","align":"left|center|right"}}],"sections":[{"afterSection":"ID da seção anterior","name":"Nome da nova seção","blocks":[{"type":"heading|paragraph|button","text":"conteúdo","align":"left|center|right","color":"#hex"}]}],"deletions":["ID existente"],"moves":[{"id":"ID a mover","beforeId":"ID opcional","toSection":"ID opcional da seção destino","position":"start|end"}],"summary":"resumo"}. Para criar uma seção inteira, use sections, mantendo exatamente os títulos de cards citados pelo usuário, sem sinônimos nem cortes de palavras. Cada card deve ter texto no formato "Título exato: descrição breve". com afterSection igual ao identificador de uma seção existente, name e todos os blocos necessários; não use insertions para criar seções. Preserve todas as seções existentes. Para reorganizar na mesma seção use moves com id e beforeId. Para transferir entre seções use moves com id, toSection igual ao ID de seção existente e position:"end" para último card. Preserve o mesmo ID, texto, cor e propriedades; não duplique nem recrie. Quando o usuário pedir títulos de cards, edite SOMENTE blocos paragraph da seção indicada, nunca blocos heading. Em cards, o título é a parte ANTES do primeiro ":" e a descrição é a parte DEPOIS; preserve integralmente a descrição e altere somente o título. Para editar, preserve IDs e altere apenas propriedades solicitadas. Para remover, retorne os IDs exatos em deletions e não edite os outros blocos. Para adicionar, escolha afterId do bloco que deve preceder o novo elemento, dentro da seção correta. Pode adicionar vários elementos. Não retorne o site inteiro. Não invente href. Execute TODAS as instruções solicitadas. Se não houver inserções, retorne insertions:[]; se não houver edições, retorne edits:[]. Se não houver exclusões, retorne deletions:[]. Se não houver movimentos, retorne moves:[]. Se não houver novas seções, retorne sections:[]. Título principal é o primeiro heading do hero; títulos de seção são heading. Cor dourada é #B89B60. A tarja superior/faixa verde é extras.announcement, NÃO um bloco, heading ou botão. Quando o pedido envolver a tarja superior, inclua "extraChanges":{"announcement":"texto novo"} sem editar o CTA ou o H1 por engano. Se o pedido alterar também outro elemento, use edits para esse elemento e extraChanges para a tarja na mesma resposta. Se não foi pedida mudança na tarja, omita extraChanges.';
    try {
      const editResponse=await fetch("https://api.openai.com/v1/chat/completions",{method:"POST",headers:{"Authorization":"Bearer "+key,"Content-Type":"application/json"},body:JSON.stringify({model:"gpt-4.1-mini",max_completion_tokens:1800,response_format:{type:"json_object"},messages:[{role:"system",content:editSystem},{role:"user",content:JSON.stringify({instruction:instructionText,blocks:inventory,announcement:editingSite.extras?.announcement||DEFAULT_BUILDER_ANNOUNCEMENT})}]}),signal:AbortSignal.timeout(45000)});
      if(!editResponse.ok) return NextResponse.json({error:"Não foi possível interpretar as alterações. O projeto foi preservado."},{status:502});
      const editData=await editResponse.json();
      const payload=JSON.parse(String(editData?.choices?.[0]?.message?.content||"{}")) as {edits?:Array<{id?:string;changes?:Record<string,unknown>}>;extraChanges?:{announcement?:string};insertions?:Array<{afterId?:string;block?:Record<string,unknown>}>;deletions?:string[];sections?:Array<{afterSection?:string;name?:string;blocks?:Array<Record<string,unknown>>}>;moves?:Array<{id?:string;beforeId?:string;toSection?:string;position?:string}>;summary?:string};
      if(!Array.isArray(payload.edits))payload.edits=[];
      const wantsAnnouncement=referencesTopAnnouncement(instructionText,editingSite.extras?.announcement);
      const announcementChange=wantsAnnouncement&&typeof payload.extraChanges?.announcement==="string"?payload.extraChanges.announcement.replace(/\s+/g," ").trim():undefined;
      if(announcementChange!==undefined&&(!announcementChange||announcementChange.length>300))return NextResponse.json({error:"Texto inválido para a tarja superior. Nenhuma alteração foi aplicada."},{status:422});
      if(wantsAnnouncement&&/\b(?:troque|mude|altere|substitua|atualize|coloque|modifique)\b/i.test(instructionText)&&announcementChange===undefined)return NextResponse.json({error:"A IA não identificou a alteração da tarja superior. O site foi preservado."},{status:422});
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
        if(clean.color!==undefined)clean.colorExplicit=true;
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
      if(!changesById.size&&!insertionsByAnchor.size&&!deletedIds.size&&announcementChange===undefined&&!(Array.isArray(payload.moves)&&payload.moves.length)&&!(Array.isArray(payload.sections)&&payload.sections.length))return NextResponse.json({error:"Nenhuma alteração válida foi encontrada. O projeto foi preservado."},{status:422});
      // Protect existing content: AI suggestions cannot delete blocks unless the user explicitly asks.
      if(deletedIds.size && !/(?:remover|remova|excluir|exclua|apagar|apague|deletar|delete|eliminar|elimine)/i.test(instructionText)){
        return NextResponse.json({error:"A edição tentou remover conteúdo não solicitado. O projeto foi preservado."},{status:422});
      }
      const updatedBlocks=editingSite.blocks.filter(b=>!deletedIds.has(String(b.id))).flatMap(b=>[changesById.has(String(b.id))?{...b,...changesById.get(String(b.id))}:b,...(insertionsByAnchor.get(String(b.id))||[])]);
      // Section moves operate on the entire group; never move only its heading.
      const sectionMove=instructionText.match(/(?:mova|mover|coloque|reposicione)\s+(?:a\s+)?se[cç][aã]o\s+["“]?(.+?)["”]?\s+para\s+(antes|depois)\s+d[aeo]\s+(?:se[cç][aã]o\s+)?["“]?(.+?)["”]?(?:[.!]|$)/i);
      if(sectionMove){
        const normalize=(value:string)=>value.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]+/g," ").trim();
        const headings=updatedBlocks.filter(b=>b.type==="heading"&&b.section);
        const findSection=(label:string)=>headings.find(b=>normalize(String(b.text))===normalize(label))?.section;
        const sourceId=findSection(sectionMove[1]);
        const targetId=findSection(sectionMove[3]);
        if(!sourceId||!targetId||sourceId===targetId)return NextResponse.json({error:"Não foi possível identificar as seções para mover com segurança. O site foi preservado."},{status:422});
        const moved=updatedBlocks.filter(b=>b.section===sourceId);
        const rest=updatedBlocks.filter(b=>b.section!==sourceId);
        const positions=rest.map((b,i)=>b.section===targetId?i:-1).filter(i=>i>=0);
        if(!moved.length||!positions.length)return NextResponse.json({error:"A movimentação não pôde ser validada. O site foi preservado."},{status:422});
        const insertAt=sectionMove[2]==="antes"?positions[0]:positions[positions.length-1]+1;
        const result=[...rest.slice(0,insertAt),...moved,...rest.slice(insertAt)];
        return NextResponse.json({site:{...editingSite,blocks:result},summary:"Seção inteira movida com todos os blocos preservados."});
      }
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
      // Transactional guard: never return a partially invalid edit or mutate the approved template.
      const resultIds=new Set<string>();
      for(const block of updatedBlocks){
        const id=String(block.id||"");
        if(!id||resultIds.has(id)||!["heading","paragraph","button","image"].includes(String(block.type))||typeof block.text!=="string"){
          return NextResponse.json({error:"A alteração gerou uma estrutura inválida. O site original foi preservado."},{status:422});
        }
        resultIds.add(id);
        if(changesById.get(id)?.color!==undefined&&typeof block.color==="string"&&!/^#[0-9a-fA-F]{3}(?:[0-9a-fA-F]{3})?$/.test(block.color)){
          return NextResponse.json({error:"Cor inválida na edição. O site foi preservado."},{status:422});
        }
        if(changesById.get(id)?.href!==undefined&&typeof block.href==="string"&&block.href&&!["https://","http://","mailto:","tel:","#"].some(prefix=>String(block.href).startsWith(prefix))){
          return NextResponse.json({error:"Link inválido na edição. O site foi preservado."},{status:422});
        }
      }
      if(updatedBlocks.length>120||updatedBlocks.length<4||!updatedBlocks.some(b=>b.type==="heading")){
        return NextResponse.json({error:"A alteração comprometeria a estrutura do site. Nada foi aplicado."},{status:422});
      }
      return NextResponse.json({site:{...editingSite,blocks:updatedBlocks,...(announcementChange!==undefined?{extras:{...editingSite.extras,announcement:announcementChange}}:{}),motion:hasMotionIntent(instructionText)?applySiteMotionInstruction({...editingSite,blocks:updatedBlocks},instructionText):editingSite.motion||{preset:"professional"}},summary:typeof payload.summary==="string"?payload.summary:"Alterações aplicadas aos elementos solicitados."});
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
    const incoming = output.site as {title?:string;background?:string;footer?:Record<string,string|boolean>;blocks:Array<{id?:string;type?:string;text?:string;color?:string;align?:string;src?:string;fontSize?:number;radius?:number;spacing?:number;section?:string}>};
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
    if(!isFresh&&editingSite?.blocks?.length)return NextResponse.json({error:"Edição incompatível com o modelo atual. O template e todas as suas configurações foram preservados."},{status:422});
    return NextResponse.json({site:{...incoming,motion:initialSiteMotion(String(body.instruction)),extras:{enabled:{}},footer:{...socialFromBrief(String(body.instruction)),...(incoming.footer||{})}},summary:typeof output.summary==="string"?output.summary:"Site gerado e validado."});
  } catch (error) {
    console.error("[builder-v2] invalid AI response",error instanceof Error?error.message:"unknown",data?.choices?.[0]?.finish_reason);
    return NextResponse.json({error:"A IA não retornou um site válido e completo. Tente novamente; seu projeto foi preservado."},{status:502});
  }
}
