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
Cada bloco tem ID permanente; preserve IDs existentes. Em edição, modifique SOMENTE os elementos solicitados e mantenha rigorosamente todos os outros blocos, sua ordem e propriedades. Se o usuário pedir para trocar texto, substitua o texto exato do bloco correspondente. Se pedir cor, fonte/tamanho, espaçamento, alinhamento, botão, imagem ou reorganizar/adicionar/remover seção, execute nos blocos relevantes. Para botões, use href somente quando o usuário fornecer URL, telefone, e-mail ou âncora real; não invente destinos externos. Se o usuário pedir para trocar o link do botão, altere href e preserve o restante. Para mover uma seção, mova seus blocos em conjunto. Não se limite a modelos fixos. Cada seção pode ter layout hero, grid, split, banner, faq, gallery ou standard no primeiro bloco, além de background próprio. O primeiro bloco deve ser heading com layout e section. Para serviços e benefícios: gere um heading e 3 a 6 blocos paragraph SEPARADOS, cada um com nome e descrição curta; layout grid. Para FAQ: gere heading e um bloco paragraph SEPARADO por pergunta, no formato "Pergunta? Resposta"; layout faq. Para galeria: heading e blocos image separados; layout gallery. Para equipe e estrutura: layout split com heading, texto e imagem. Não escreva instruções de design dentro do texto do site. Não crie dados de contato fictícios, nem rodapé com ano ou endereço inventados. Escolha o layout pelo nicho e permita ao usuário alterá-lo pelo chat. Nunca invente nome de empresa, escritório ou pessoa. Se o briefing não informar marca, use um título descritivo neutro. Varie realmente a composição entre seções, alternando hero, grid, split, banner e faq conforme fizer sentido; evite 10 seções com o mesmo estilo. Para um escritório de advocacia, escolha tipografia sóbria e paleta elegante (ex.: azul-marinho, marfim e dourado discreto), hero institucional, áreas de atuação em cards separados, apresentação do escritório, diferenciais factuais sem promessas, processo de atendimento, perguntas frequentes e CTA de contato. Evite linguagem mercantilista, garantia de resultados, depoimentos fictícios, especializações ou registros OAB inventados. Para outros segmentos, infira a identidade visual e estrutura adequada sem depender de palavras exatas no briefing. Evite escrever "a definir" no rodapé público: omita dados que não foram informados e use CTA genérico editável sem link fictício. Ao criar novo site, produza 7 a 10 seções relevantes, cada uma com um identificador section próprio, composição editorial de títulos curtos, descrições objetivas e CTAs adequados. Evite parágrafos enormes e repetitivos. Nunca invente endereço, telefone, e-mail, anos de experiência, depoimentos, profissionais, certificações ou URLs de imagens; omita informações não fornecidas sem mostrar "A definir". Para imagens não disponíveis, evite criar espaços vazios em excesso: priorize composição tipográfica e cards sem fotos. Se o usuário fornecer URL válida de imagem, use src; se fornecer somente referência visual, não finja ter gerado uma imagem. Quando houver imagem de referência, analise-a para aplicar as alterações visuais ou textuais solicitadas; não alegue que substituiu uma imagem se não recebeu uma URL ou arquivo utilizável. O campo summary deve explicar brevemente a ação executada em português.`;

  // A presentation layer must never expose design specifications as visitor copy.
  const cleanCopy = (value:string) => {
    let text=value.trim();
    text=text.replace(/\\s*(?:[–—-]|•)\\s*(?:(?:layout|fundo|background|bordas?|tipografia|responsiv[oa]|banner horizontal|chamada para a[cç][aã]o|rodap[eé] profissional|faq)\\b[^.!?]*)$/i,"").trim();
    if (/^(?:cabe[cç]alho elegante|t[ií]tulo principal impactante|subt[ií]tulo suave|[aá]rea reservada para|imagem a adicionar|redes sociais\\s*[:(]|©|copyright)/i.test(text)) return "";
    if (/(?:layout (?:grid|split|standard)|fundo (?:marfim|branco|azul.marinho)|bordas douradas|[ií]cones dourados|fontes refinadas|imagem impactante|menu de navega[cç][aã]o sofisticado)/i.test(text)) return "";
    return text;
  };
  const normalizeBlocks = (items:Array<Record<string,unknown>>) => items.flatMap((raw,index)=>{
    if (!raw || !["heading","paragraph","button","image"].includes(String(raw.type))) return [];
    const text=typeof raw.text==="string"?cleanCopy(raw.text):"";
    if (!text || raw.type==="image" && (typeof raw.src!=="string" || !/^https?:\\/\\/|^data:image\\//.test(raw.src))) return [];
    return [{...raw,id:typeof raw.id==="string"&&raw.id?raw.id:"block-"+index,text}];
  });
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
        "Você é o arquiteto de sites premium PageNova. Responda APENAS JSON com title, background e sections: array de 7 a 9 objetos {id,layout,goal}. Layout permitido: hero,grid,split,banner,faq,standard. Não invente nome de escritório, telefone, endereço, profissionais ou depoimentos. Crie uma arquitetura elegante, não repetitiva. A instrução do usuário prevalece.",
        {instruction},1200
      );
      const sections = Array.isArray(plan.sections) ? plan.sections.filter((v):v is Record<string,unknown>=>!!v&&typeof v==="object").slice(0,9) : [];
      if (sections.length < 5) throw new Error("invalid-plan");
      const batches = [sections.slice(0,Math.ceil(sections.length/2)),sections.slice(Math.ceil(sections.length/2))];
      const results = await Promise.all(batches.map(async (batch,index) => {
        const out = await callAI(
          "Você é o redator e designer PageNova. Retorne APENAS JSON {blocks:[...]}. Para CADA seção solicitada, gere um heading e 1 a 5 blocos apropriados. Escreva textos finais para o visitante, nunca instruções de design ou placeholders como Título Principal Impactante, Subtítulo suave, Fundo azul-marinho, ícones dourados, Imagem a adicionar, ©2024 ou Redes Sociais (ícones). Não inclua rodapé sem dados reais. Campos obrigatórios de cada bloco: id string único, type heading|paragraph|button|image, text string, color string hexadecimal, align left|center|right, section id exato. No heading inicial da seção inclua layout e background. Use cores com alto contraste; hero fundo escuro, outras seções claras, grids com cards claros. Em grid: heading + 3 a 5 paragraphs separados. Em faq: heading + perguntas no formato Pergunta? Resposta. Não crie URLs fictícias, dados de contato inventados, nomes de pessoas/escritórios inventados ou imagens falsas. Texto conciso, premium e adequado ao segmento. Não gere seções fora da lista. A instrução do usuário prevalece.",
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
        const id=typeof b.id==="string"&&b.id?b.id:"block-"+index;
        const unique=seen.has(id)?id+"-"+index:id;seen.add(unique);
        return {...b,id:unique,color:typeof b.color==="string"?b.color:"#243043",
          align:["left","center","right"].includes(String(b.align))?b.align:"left",
          section:typeof b.section==="string"?b.section:"principal"};
      }).filter((b):b is NonNullable<typeof b>=>b!==null);
      const cleaned=normalizeBlocks(blocks);\n      const generatedSections=new Set(cleaned.map(b=>b.section));
      if(cleaned.length<8||generatedSections.size<3)throw new Error("incomplete-site");
      return NextResponse.json({site:{title:typeof plan.title==="string"?plan.title:"Site profissional",background:typeof plan.background==="string"?plan.background:"#ffffff",blocks:cleaned},summary:"Site completo criado em etapas e validado: "+generatedSections.size+" seções."});
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
    incoming.blocks = normalizeBlocks(incoming.blocks as unknown as Array<Record<string,unknown>>) as unknown as typeof incoming.blocks;\n    if (incoming.blocks.length < 4 && isFresh) throw Error("incomplete");
    return NextResponse.json({site:incoming,summary:typeof output.summary==="string"?output.summary:"Site gerado e validado."});
  } catch (error) {
    console.error("[builder-v2] invalid AI response",error instanceof Error?error.message:"unknown",data?.choices?.[0]?.finish_reason);
    return NextResponse.json({error:"A IA não retornou um site válido e completo. Tente novamente; seu projeto foi preservado."},{status:502});
  }
}
