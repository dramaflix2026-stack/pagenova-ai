import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { SITE_PAGES, type SitePage, type SitePageKey } from "@/lib/site-builder";
import { getSitePreset, SITE_PRESETS } from "@/lib/site-builder-presets";
import { planUniversalSite } from "@/lib/site-builder-universal";

export const runtime = "nodejs";
export const maxDuration = 90;

const keys = new Set<SitePageKey>(SITE_PAGES.map((page) => page.key));

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: "Faça login para criar um site." }, { status: 401 });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) return NextResponse.json({ error: "Configuração indisponível." }, { status: 503 });
  const admin = createAdminClient(url, secret, { auth: { persistSession: false } });
  const { data: entitlement, error: accessError } = await admin.from("entitlements")
    .select("id").eq("product", "pagenova-ai").eq("status", "active")
    .ilike("email", user.email.trim()).limit(1).maybeSingle();
  if (accessError || !entitlement) return NextResponse.json({ error: "Acesso indisponível." }, { status: 403 });

  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({ error: "Pedido inválido." }, { status: 400 }); }
  const brief = typeof body.brief === "string" ? body.brief.trim() : "";
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const style = typeof body.style === "string" ? body.style.trim() : "";
  const presetId = typeof body.presetId === "string" ? body.presetId : "institucional";
  const key = body.key as SitePageKey;
  const instruction = typeof body.instruction === "string" ? body.instruction.trim() : "";
  const existingPage = typeof body.existingPage === "string" ? body.existingPage.trim() : "";
  const screenshot = typeof body.screenshot === "string" ? body.screenshot : "";
  if (screenshot && (!instruction || screenshot.length > 1200000 ||
      !/^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(screenshot))) {
    return NextResponse.json({ error: "Print inválido ou grande demais." }, { status: 400 });
  }
  const submitted = body.institutional && typeof body.institutional === "object"
    ? body.institutional as Record<string, unknown> : {};
  const facts = ["role", "audience", "offer", "process", "proof"].map((field) => {
    const value = submitted[field];
    return `${field}: ${typeof value === "string" ? value.slice(0, 700).trim() : ""}`;
  }).join("\n");
  const universalStrategy = planUniversalSite({
    name,
    brief,
    category: getSitePreset(presetId).title,
    offer: typeof submitted.offer === "string" ? submitted.offer : "",
    audience: typeof submitted.audience === "string" ? submitted.audience : "",
  });

  const universalSectionPlan = universalStrategy.sections
    .map((section) => `${section.priority}. ${section.kind}: ${section.purpose}`)
    .join("\n");

  const universalDirection = [
    `Modelo de negócio: ${universalStrategy.profile.businessModel}`,
    `Objetivo principal: ${universalStrategy.profile.primaryGoal}`,
    `Conversão principal: ${universalStrategy.profile.conversion}`,
    `Tom: ${universalStrategy.profile.tone}`,
    `Densidade visual: ${universalStrategy.design.density}`,
    `Hero: ${universalStrategy.design.heroStyle}`,
    `Cards: ${universalStrategy.design.cardStyle}`,
    `Fonte padrão: ${universalStrategy.design.defaultFont}`,
  ].join("\n");
  if (brief.length < 20 || brief.length > 3000 || name.length < 2 || name.length > 100 ||
      !keys.has(key) || !SITE_PRESETS.some((preset) => preset.id === presetId) || !["moderno", "elegante", "vibrante"].includes(style) || instruction.length > 700 || existingPage.length > 6000) {
    return NextResponse.json({ error: "Revise o nome, a descrição e o estilo." }, { status: 400 });
  }
  const apiKey = process.env.OPENAI_API_KEY;
  if (process.env.PAGENOVA_AI_PROVIDER !== "openai" || !apiKey) {
    return NextResponse.json({ error: "O gerador de sites com IA ainda não está configurado." }, { status: 503 });
  }

  const prompt = `Negócio: ${name}\nCategoria informada: ${getSitePreset(presetId).title}\nBriefing: ${brief}\nDados confirmados pelo cliente: ${presetId === "institucional" ? facts : "Ver briefing"}\nEstratégia universal:\n${universalDirection}\nPlano recomendado de seções:\n${universalSectionPlan}\nEstilo solicitado: ${style}\nPágina atual: ${key}\nConteúdo atual: ${existingPage || "nenhum"}\nAlteração: ${instruction || "nenhuma"}\nPrimeiro interprete semanticamente o negócio descrito, independentemente de palavras-chave ou categorias pré-cadastradas. Classifique o modelo de negócio pela forma real como a empresa entrega valor e recebe a conversão. Diferencie produto de serviço: o uso de equipamentos, software, drones, máquinas ou tecnologia para executar um serviço não transforma automaticamente o negócio em venda de produto. Determine também objetivo principal, conversão, tom e seções adequadas. A estratégia determinística fornecida abaixo é apenas uma hipótese inicial e pode ser corrigida quando o briefing demonstrar outro modelo. Nunca altere fatos do briefing para encaixá-los na classificação. Use a estratégia universal como planejamento editorial, não como autorização para inventar fatos. Adapte a página ao modelo de negócio, objetivo e conversão identificados. O plano de seções é uma recomendação: use apenas seções sustentadas pelos dados disponíveis e adequadas à página atual. Um nicho desconhecido deve continuar recebendo conteúdo específico a partir do briefing, sem depender de uma categoria cadastrada. Não mencione internamente modelo de negócio, estratégia universal, plano de seções ou classificação ao visitante. Escreva para o visitante final, nunca sobre a criação do site. Entregue uma proposta clara e específica do negócio, serviços e caminho para contato. Na home: hero explica a proposta; seções representam ofertas distintas confirmadas; sobre explica identidade e método sem repetir o hero; contato orienta o próximo passo. Não repita o mesmo argumento em cards, introdução e rodapé. Dê nomes concretos aos serviços se constarem dos dados. Se faltarem fatos, omita a afirmação; jamais publique frases como "pendente", "adicione aqui", "este espaço", "site em construção" ou listas de dados faltantes. Não invente credenciais, números, preços, depoimentos, resultados ou disponibilidade. Títulos de até 9 palavras; introdução de até 260 caracteres; 3 a 4 seções, cada uma com corpo de até 220 caracteres, diferentes entre si e adequadas ao nicho. Evite repetir o nome do negócio em todos os textos. Se houver print, use como referência de hierarquia visual e intenção, sem copiar marcas ou fatos de terceiros. Preserve conteúdo atual que não foi pedido para alterar.
DIREÇÃO VISUAL:
Escolha visualDirection semanticamente com base no negócio, no pedido do usuário e, quando houver, no screenshot de referência.
heroLayout:
- overlay = texto sobre imagem de fundo;
- split-left = imagem à esquerda e conteúdo à direita;
- split-right = conteúdo à esquerda e imagem à direita;
- centered = conteúdo centralizado com composição visual central.
heroAlignment controla o alinhamento principal do conteúdo.
heroContentWidth controla a largura visual do bloco textual.
imageFocus indica qual região da imagem deve receber prioridade.
density controla respiro e espaçamento geral.
cardStyle define a linguagem visual dos cards.

Quando houver screenshot, analise composição, hierarquia, proporções, distribuição de imagem e texto, densidade e estilo de cards. Use a referência como direção visual, sem copiar marca, logotipo, textos ou identidade proprietária.

Em MODO DE REVISÃO, se o usuário pedir alteração visual, preserve o conteúdo textual atual e altere visualDirection conforme o pedido. Se o pedido for somente textual e não mencionar layout, composição, visual, estilo, hero, imagem, cards, espaçamento ou screenshot, preserve a direção visual existente quando ela for fornecida. Quando existir uma instrução de alteração e conteúdo atual, você está em MODO DE REVISÃO. Nesse modo, trate o conteúdo atual como fonte principal da página. Altere somente o que a instrução solicitar. Todo campo não solicitado deve ser devolvido exatamente igual ao conteúdo atual, caractere por caractere sempre que possível. Não reescreva títulos, introdução, CTA ou seções apenas para melhorar estilo. Não acrescente novas seções, não remova seções e não reorganize seções, exceto quando a instrução pedir explicitamente isso. Se a instrução mencionar somente título, altere somente heading. Se mencionar somente subtítulo ou introdução, altere somente introduction. Se mencionar somente CTA ou botão, altere somente cta. Se mencionar uma seção específica, preserve todas as demais seções sem alteração. Direção de conteúdo obrigatória: o título principal deve nomear o serviço, produto ou transformação concreta. Na home, cada seção precisa corresponder a uma oferta diferente que conste do briefing ou dos dados confirmados; não use cards intitulados Sobre, Serviços, Contato, Atendimento, Diferenciais ou Dúvidas. Se as ofertas fornecidas não sustentarem quatro seções diferentes, entregue apenas as seções fundamentadas pelos fatos informados. Nunca escreva frases autorreferentes como Conheça os serviços disponíveis, saiba mais sobre nós, soluções para você, cuidado para sua rotina, atendimento pensado ou apresentação clara. Use frases curtas, com benefício específico e linguagem natural. Na página Sobre, não replique as ofertas da home. Evite repetir palavras ou sentenças entre páginas. Não invente prova social nem fatos. `;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 65000);
  try {
    const ai = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        model: process.env.PAGENOVA_OPENAI_MODEL || "gpt-5.6-luna",
        input: [
          { role: "system", content: "Você cria conteúdo original de sites profissionais em português brasileiro, adaptado ao nicho. Produza conteúdo específico ao negócio informado. Campos entre colchetes são dados ausentes, nunca fatos confirmados. Não invente endereço, telefone, preços, imóveis reais, avaliações, certificações nem fatos não fornecidos. Não inclua HTML, Markdown ou scripts. Evite linguagem genérica e promessas sem fundamento. Cada seção deve ter texto claro e útil." },
          { role: "user", content: screenshot
            ? [{ type: "input_text", text: prompt }, { type: "input_image", image_url: screenshot, detail: "high" }]
            : prompt },
        ],
        text: { format: { type: "json_schema", name: "universal_site_page", strict: true, schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            strategy: {
              type: "object",
              additionalProperties: false,
              properties: {
                businessModel: {
                  type: "string",
                  enum: ["professional-service", "local-service", "hospitality", "commerce", "product", "content", "software", "property", "generic"],
                },
                primaryGoal: {
                  type: "string",
                  enum: ["lead-generation", "booking", "sales", "authority", "portfolio", "contact"],
                },
                conversion: {
                  type: "string",
                  enum: ["whatsapp", "form", "booking", "checkout", "phone", "email"],
                },
                tone: {
                  type: "string",
                  enum: ["professional", "premium", "friendly", "bold", "technical", "minimal"],
                },
                sectionKinds: {
                  type: "array",
                  minItems: 1,
                  maxItems: 10,
                  items: {
                    type: "string",
                    enum: ["hero", "services", "products", "benefits", "features", "about", "authority", "process", "portfolio", "gallery", "team", "testimonials", "pricing", "faq", "location", "contact", "final-cta"],
                  },
                },
              },
              required: ["businessModel", "primaryGoal", "conversion", "tone", "sectionKinds"],
            },
                        visualDirection: {
              type: "object",
              additionalProperties: false,
              properties: {
                heroLayout: {
                  type: "string",
                  enum: ["overlay", "split-left", "split-right", "centered"],
                },
                heroAlignment: {
                  type: "string",
                  enum: ["left", "center"],
                },
                heroContentWidth: {
                  type: "string",
                  enum: ["narrow", "medium", "wide"],
                },
                imageFocus: {
                  type: "string",
                  enum: ["left", "center", "right"],
                },
                density: {
                  type: "string",
                  enum: ["compact", "balanced", "spacious"],
                },
                cardStyle: {
                  type: "string",
                  enum: ["flat", "bordered", "elevated"],
                },
              },
              required: [
                "heroLayout",
                "heroAlignment",
                "heroContentWidth",
                "imageFocus",
                "density",
                "cardStyle"
              ],
            },            page: {
              type: "object",
              additionalProperties: false,
              properties: {
                eyebrow: { type: "string" },
                heading: { type: "string" },
                introduction: { type: "string" },
                sections: {
                  type: "array",
                  minItems: 1,
                  maxItems: 6,
                  items: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      title: { type: "string" },
                      body: { type: "string" },
                    },
                    required: ["title", "body"],
                  },
                },
                cta: { type: "string" },
              },
              required: ["eyebrow", "heading", "introduction", "sections", "cta"],
            },
          },
          required: ["strategy", "visualDirection", "page"],
        } } },
      }),
    });
    if (!ai.ok) {
      console.error("[Builder] Provider request failed", ai.status);
      return NextResponse.json({ error: "A IA não conseguiu criar esta página. Tente novamente." }, { status: 502 });
    }
    const payload = await ai.json() as { output?: { content?: { text?: string }[] }[]; output_text?: string };
    const text = payload.output_text || payload.output?.flatMap((item) => item.content || []).map((item) => item.text || "").join("");
    if (!text) throw new Error("Empty AI output");
    const parsed = JSON.parse(text) as {
      strategy?: {
        businessModel?: string;
        primaryGoal?: string;
        conversion?: string;
        tone?: string;
        sectionKinds?: string[];
      };
      visualDirection?: {
        heroLayout?: "overlay" | "split-left" | "split-right" | "centered";
        heroAlignment?: "left" | "center";
        heroContentWidth?: "narrow" | "medium" | "wide";
        imageFocus?: "left" | "center" | "right";
        density?: "compact" | "balanced" | "spacious";
        cardStyle?: "flat" | "bordered" | "elevated";
      };      page?: Omit<SitePage, "key">;
    };

    const semanticStrategy = parsed.strategy;
    const parsedPage = parsed.page;

    if (!semanticStrategy ||
        typeof semanticStrategy.businessModel !== "string" ||
        typeof semanticStrategy.primaryGoal !== "string" ||
        typeof semanticStrategy.conversion !== "string" ||
        typeof semanticStrategy.tone !== "string" ||
        !Array.isArray(semanticStrategy.sectionKinds) ||
        semanticStrategy.sectionKinds.length < 1) {
      throw new Error("Invalid AI strategy");
    }

    if (!parsedPage ||
        typeof parsedPage.heading !== "string" ||
        typeof parsedPage.introduction !== "string" ||
        typeof parsedPage.eyebrow !== "string" ||
        typeof parsedPage.cta !== "string" ||
        !Array.isArray(parsedPage.sections) ||
        parsedPage.sections.length < 1 ||
        parsedPage.sections.length > 6 ||
        parsedPage.sections.some((section) =>
          typeof section.title !== "string" ||
          typeof section.body !== "string"
        )) {
      throw new Error("Invalid AI page");
    }

        if (instruction && existingPage) {
      try {
        const currentPage = JSON.parse(existingPage) as Partial<SitePage>;

        const normalizedInstruction = instruction
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase();

        const mentionsHeading =
          /\b(titulo|headline|heading|chamada principal|hero)\b/.test(normalizedInstruction);

        const mentionsIntroduction =
          /\b(subtitulo|introducao|descricao principal|texto principal|paragrafo principal)\b/.test(normalizedInstruction);

        const mentionsCta =
          /\b(cta|botao|chamada para acao|call to action)\b/.test(normalizedInstruction);

        const mentionsSections =
          /\b(secao|secoes|card|cards|servico|servicos|beneficio|beneficios|bloco|blocos|conteudo)\b/.test(normalizedInstruction);

        const broadRevision =
          /\b(toda|tudo|pagina inteira|pagina completa|reescreva a pagina|refaca a pagina|recrie a pagina|melhore a pagina inteira|mude tudo)\b/.test(normalizedInstruction);

        if (!broadRevision) {
          if (!mentionsHeading && typeof currentPage.heading === "string") {
            parsedPage.heading = currentPage.heading;
          }

          if (!mentionsIntroduction && typeof currentPage.introduction === "string") {
            parsedPage.introduction = currentPage.introduction;
          }

          if (!mentionsCta && typeof currentPage.cta === "string") {
            parsedPage.cta = currentPage.cta;
          }

          if (!mentionsSections && Array.isArray(currentPage.sections)) {
            parsedPage.sections = currentPage.sections
              .filter((section) =>
                section &&
                typeof section.title === "string" &&
                typeof section.body === "string"
              )
              .map((section) => ({
                title: section.title,
                body: section.body,
              }));
          }

          if (
            typeof currentPage.eyebrow === "string" &&
            !/\b(eyebrow|rotulo|categoria acima do titulo|texto acima do titulo)\b/.test(normalizedInstruction)
          ) {
            parsedPage.eyebrow = currentPage.eyebrow;
          }
        }

        console.info("[Builder] Granular revision", {
          key,
          broadRevision,
          preserveHeading: !broadRevision && !mentionsHeading,
          preserveIntroduction: !broadRevision && !mentionsIntroduction,
          preserveSections: !broadRevision && !mentionsSections,
          preserveCta: !broadRevision && !mentionsCta,
        });
      } catch (revisionError) {
        console.warn(
          "[Builder] Could not apply deterministic revision preservation",
          revisionError,
        );
      }
    }
console.info("[Builder] Semantic strategy", {
      deterministicBusinessModel: universalStrategy.profile.businessModel,
      semanticBusinessModel: semanticStrategy.businessModel,
      deterministicGoal: universalStrategy.profile.primaryGoal,
      semanticGoal: semanticStrategy.primaryGoal,
      deterministicConversion: universalStrategy.profile.conversion,
      semanticConversion: semanticStrategy.conversion,
      semanticSections: semanticStrategy.sectionKinds,
    });

    const rawVisualDirection = parsed.visualDirection;

    if (
      !rawVisualDirection ||
      typeof rawVisualDirection.heroLayout !== "string" ||
      typeof rawVisualDirection.heroAlignment !== "string" ||
      typeof rawVisualDirection.heroContentWidth !== "string" ||
      typeof rawVisualDirection.imageFocus !== "string" ||
      typeof rawVisualDirection.density !== "string" ||
      typeof rawVisualDirection.cardStyle !== "string" ||
      !["overlay", "split-left", "split-right", "centered"].includes(
        rawVisualDirection.heroLayout
      ) ||
      !["left", "center"].includes(
        rawVisualDirection.heroAlignment
      ) ||
      !["narrow", "medium", "wide"].includes(
        rawVisualDirection.heroContentWidth
      ) ||
      !["left", "center", "right"].includes(
        rawVisualDirection.imageFocus
      ) ||
      !["compact", "balanced", "spacious"].includes(
        rawVisualDirection.density
      ) ||
      !["flat", "bordered", "elevated"].includes(
        rawVisualDirection.cardStyle
      )
    ) {
      throw new Error("Invalid AI visual direction");
    }
    const visualDirection = {
      heroLayout: rawVisualDirection.heroLayout as "overlay" | "split-left" | "split-right" | "centered",
      heroAlignment: rawVisualDirection.heroAlignment as "left" | "center",
      heroContentWidth: rawVisualDirection.heroContentWidth as "narrow" | "medium" | "wide",
      imageFocus: rawVisualDirection.imageFocus as "left" | "center" | "right",
      density: rawVisualDirection.density as "compact" | "balanced" | "spacious",
      cardStyle: rawVisualDirection.cardStyle as "flat" | "bordered" | "elevated",
    };
    const page: SitePage = {
      key,
      eyebrow: parsedPage.eyebrow.slice(0, 100),
      heading: parsedPage.heading.slice(0, 180),
      introduction: parsedPage.introduction.slice(0, 300),
      cta: parsedPage.cta.slice(0, 80),
      sections: parsedPage.sections.slice(0, 4).map((section) => ({
        title: section.title.slice(0, 80),
        body: section.body.slice(0, 280),
      })),
    };

    return NextResponse.json({ page, visualDirection });
  } catch (error) {
    console.error("[Builder] Generation failed", error);
    return NextResponse.json({ error: "Não foi possível gerar esta página. Você pode tentar novamente." }, { status: 502 });
  } finally {
    clearTimeout(timer);
  }
}
