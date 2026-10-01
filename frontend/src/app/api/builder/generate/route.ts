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

  const submittedHeader =
    body.currentHeaderDirection &&
    typeof body.currentHeaderDirection === "object"
      ? body.currentHeaderDirection as Record<string, unknown>
      : {};

  const currentHeaderDirection = {
    logoPosition:
      ["left", "center", "right"].includes(String(submittedHeader.logoPosition))
        ? String(submittedHeader.logoPosition)
        : "left",
    menuStyle:
      ["inline", "dropdown"].includes(String(submittedHeader.menuStyle))
        ? String(submittedHeader.menuStyle)
        : "inline",
    density:
      ["compact", "balanced", "spacious"].includes(String(submittedHeader.density))
        ? String(submittedHeader.density)
        : "balanced",
  };
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
DADOS INSTITUCIONAIS:
Retorne também institutional com role, audience, offer, process e proof.
ESTADO ATUAL DO CABEÇALHO:
${JSON.stringify(currentHeaderDirection)}

Em MODO DE REVISÃO, considere esse objeto como o cabeçalho atualmente persistido.
Quando a instrução pedir uma mudança no cabeçalho, logo, logotipo, marca, menu ou navegação, transforme esse estado conforme o pedido.
Preserve exatamente as propriedades do cabeçalho que o usuário não pediu para alterar.
Não retorne uma propriedade ao padrão anterior sem solicitação explícita.

DIREÇÃO DO CABEÇALHO:
Você também deve decidir a composição estrutural do cabeçalho em headerDirection.

logoPosition:
- left = marca à esquerda;
- center = marca centralizada;
- right = marca à direita.

menuStyle:
- inline = navegação visível horizontalmente;
- dropdown = navegação recolhida em botão de menu.

density:
- compact = cabeçalho baixo e enxuto;
- balanced = espaçamento intermediário;
- spacious = cabeçalho mais amplo.

Em geração inicial, escolha uma composição coerente com o site.
Em MODO DE REVISÃO, somente altere headerDirection quando a instrução tratar de cabeçalho, header, logo, logotipo, marca, menu ou navegação.
Centralizar a marca não significa remover a navegação.
Quando a marca estiver centralizada, dropdown costuma ser uma composição adequada quando necessário para evitar conflito visual.
Esses campos representam fatos persistidos do negócio, não copy decorativa.
Em geração inicial, use somente fatos sustentados pelo briefing ou pelos dados confirmados.
Se um fato não estiver sustentado, use string vazia. Nunca invente.
Em MODO DE REVISÃO, preserve exatamente os dados institucionais existentes que o usuário não pediu para alterar.
Somente altere role quando a instrução tratar da função, atividade ou papel do negócio.
Somente altere audience quando a instrução tratar do público, cliente ideal, segmento atendido ou para quem o serviço é destinado.
Somente altere offer quando a instrução tratar da oferta, produto ou serviço oferecido.
Somente altere process quando a instrução tratar do processo, método, etapas ou forma de execução.
Somente altere proof quando a instrução tratar de prova, credencial, experiência, resultado comprovado ou evidência.
Se o usuário pedir explicitamente para remover um desses dados, devolva string vazia nesse campo.
Uma alteração de título, texto, CTA, seção, layout, hero, imagem, cards, estilo ou screenshot não autoriza modificar dados institucionais.
PLANO ESTRUTURADO DE REVISÃO:
Além dos objetos completos abaixo, devolva revisionPlan descrevendo SOMENTE as alterações explicitamente solicitadas pelo usuário.

Em geração inicial, use scope "page" e devolva todos os arrays de mudanças vazios.

Em MODO DE REVISÃO:
- scope deve ser "page", exceto quando o usuário pedir explicitamente uma alteração global no site;
- cada categoria não solicitada deve ser [];
- não invente alterações para preencher o plano;
- contentChanges registra mudanças em eyebrow, heading, introduction ou cta;
- institutionalChanges registra mudanças em role, audience, offer, process ou proof;
- visualChanges registra mudanças em heroLayout, heroAlignment, heroContentWidth, imageFocus, density ou cardStyle;
- headerChanges registra mudanças em logoPosition, menuStyle ou density;
- sectionChanges registra update, remove, add ou move de seções;
- elementChanges registra mudanças visuais direcionadas a elementos específicos;
- revisionPlan descreve intenção. Não use o plano para reescrever campos que o usuário não pediu.

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
                        institutional: {
              type: "object",
              additionalProperties: false,
              properties: {
                role: { type: "string" },
                audience: { type: "string" },
                offer: { type: "string" },
                process: { type: "string" },
                proof: { type: "string" },
              },
              required: ["role", "audience", "offer", "process", "proof"],
            },            headerDirection: {
            type: "object",
            additionalProperties: false,
            properties: {
              logoPosition: {
                type: "string",
                enum: ["left", "center", "right"]
              },
              menuStyle: {
                type: "string",
                enum: ["inline", "dropdown"]
              },
              density: {
                type: "string",
                enum: ["compact", "balanced", "spacious"]
              }
            },
            required: ["logoPosition", "menuStyle", "density"]
          },          visualDirection: {
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
            },            revisionPlan: {
              type: "object",
              additionalProperties: false,
              properties: {
                scope: {
                  type: "string",
                  enum: ["page", "site"],
                },
                contentChanges: {
                  type: "array",
                  maxItems: 8,
                  items: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      field: {
                        type: "string",
                        enum: ["eyebrow", "heading", "introduction", "cta"],
                      },
                      value: { type: "string" },
                    },
                    required: ["field", "value"],
                  },
                },
                institutionalChanges: {
                  type: "array",
                  maxItems: 8,
                  items: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      field: {
                        type: "string",
                        enum: ["role", "audience", "offer", "process", "proof"],
                      },
                      value: { type: "string" },
                    },
                    required: ["field", "value"],
                  },
                },
                visualChanges: {
                  type: "array",
                  maxItems: 8,
                  items: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      field: {
                        type: "string",
                        enum: ["heroLayout", "heroAlignment", "heroContentWidth", "imageFocus", "density", "cardStyle"],
                      },
                      value: {
                        type: "string",
                        enum: [
                          "overlay",
                          "split-left",
                          "split-right",
                          "centered",
                          "left",
                          "center",
                          "right",
                          "narrow",
                          "medium",
                          "wide",
                          "compact",
                          "balanced",
                          "spacious",
                          "flat",
                          "bordered",
                          "elevated"
                        ],
                      },
                    },
                    required: ["field", "value"],
                  },
                },
                headerChanges: {
                  type: "array",
                  maxItems: 6,
                  items: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      field: {
                        type: "string",
                        enum: ["logoPosition", "menuStyle", "density"],
                      },
                      value: {
                        type: "string",
                        enum: ["left", "center", "right", "inline", "dropdown", "compact", "balanced", "spacious"],
                      },
                    },
                    required: ["field", "value"],
                  },
                },
                sectionChanges: {
                  type: "array",
                  maxItems: 12,
                  items: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      action: {
                        type: "string",
                        enum: ["update", "remove", "add", "move"],
                      },
                      index: { type: "integer", minimum: -1, maximum: 20 },
                      targetIndex: { type: "integer", minimum: -1, maximum: 20 },
                      title: { type: "string" },
                      body: { type: "string" },
                    },
                    required: ["action", "index", "targetIndex", "title", "body"],
                  },
                },
                elementChanges: {
                  type: "array",
                  maxItems: 12,
                  items: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      target: {
                        type: "string",
                        enum: ["heading", "eyebrow", "introduction", "cta", "hero", "header", "navigation", "logo", "cards", "section"],
                      },
                      action: {
                        type: "string",
                        enum: ["update", "remove", "resize", "align", "restyle"],
                      },
                      sectionIndex: {
                        type: "integer",
                        minimum: -1,
                        maximum: 20,
                      },
                      alignment: {
                        type: "string",
                        enum: ["none", "left", "center", "right"],
                      },
                      size: {
                        type: "string",
                        enum: ["none", "smaller", "default", "larger"],
                      },
                      emphasis: {
                        type: "string",
                        enum: ["none", "subtle", "default", "strong"],
                      },
                      cardStyle: {
                        type: "string",
                        enum: ["none", "flat", "bordered", "elevated"],
                      },
                    },
                    required: [
                      "target",
                      "action",
                      "sectionIndex",
                      "alignment",
                      "size",
                      "emphasis",
                      "cardStyle"
                    ],
                  },
                },
              },
              required: [
                "scope",
                "contentChanges",
                "institutionalChanges",
                "visualChanges",
                "headerChanges",
                "sectionChanges",
                "elementChanges"
              ],
            },
            page: {
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
          required: ["strategy", "institutional", "headerDirection", "visualDirection", "revisionPlan", "page"],
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
      institutional?: {
        role?: string;
        audience?: string;
        offer?: string;
        process?: string;
        proof?: string;
      };      headerDirection?: {
        logoPosition?: string;
        menuStyle?: string;
        density?: string;
      };      visualDirection?: {
        heroLayout?: "overlay" | "split-left" | "split-right" | "centered";
        heroAlignment?: "left" | "center";
        heroContentWidth?: "narrow" | "medium" | "wide";
        imageFocus?: "left" | "center" | "right";
        density?: "compact" | "balanced" | "spacious";
        cardStyle?: "flat" | "bordered" | "elevated";
      };
      revisionPlan?: {
        scope?: "page" | "site";
        contentChanges?: Array<{ field?: string; value?: string }>;
        institutionalChanges?: Array<{ field?: string; value?: string }>;
        visualChanges?: Array<{ field?: string; value?: string }>;
        headerChanges?: Array<{ field?: string; value?: string }>;
        sectionChanges?: Array<{
          action?: string;
          index?: number;
          targetIndex?: number;
          title?: string;
          body?: string;
        }>;
        elementChanges?: Array<{
          target?: string;
          action?: string;
          sectionIndex?: number;
          alignment?: string;
          size?: string;
          emphasis?: string;
          cardStyle?: string;
        }>;
      };
      page?: Omit<SitePage, "key">;
    };

    const semanticStrategy = parsed.strategy;
    const parsedPage = parsed.page;
    const rawInstitutional = parsed.institutional;

    if (
      !rawInstitutional ||
      typeof rawInstitutional.role !== "string" ||
      typeof rawInstitutional.audience !== "string" ||
      typeof rawInstitutional.offer !== "string" ||
      typeof rawInstitutional.process !== "string" ||
      typeof rawInstitutional.proof !== "string"
    ) {
      throw new Error("Invalid AI institutional data");
    }

    const currentInstitutional = {
      role: typeof submitted.role === "string" ? submitted.role.slice(0, 700).trim() : "",
      audience: typeof submitted.audience === "string" ? submitted.audience.slice(0, 700).trim() : "",
      offer: typeof submitted.offer === "string" ? submitted.offer.slice(0, 700).trim() : "",
      process: typeof submitted.process === "string" ? submitted.process.slice(0, 700).trim() : "",
      proof: typeof submitted.proof === "string" ? submitted.proof.slice(0, 700).trim() : "",
    };

    let institutional = {
      role: rawInstitutional.role.slice(0, 700).trim(),
      audience: rawInstitutional.audience.slice(0, 700).trim(),
      offer: rawInstitutional.offer.slice(0, 700).trim(),
      process: rawInstitutional.process.slice(0, 700).trim(),
      proof: rawInstitutional.proof.slice(0, 700).trim(),
    };

    if (instruction) {
      const normalizedInstitutionalInstruction = instruction
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase();

      const mentionsRole =
        /\b(funcao|atividade|papel|atuacao|o que a empresa faz|o que o negocio faz)\b/.test(
          normalizedInstitutionalInstruction
        );

      const mentionsAudience =
        /\b(publico|audience|cliente ideal|clientes ideais|segmento atendido|segmentos atendidos|para quem|quem atende|quem atendemos)\b/.test(
          normalizedInstitutionalInstruction
        );

      const mentionsOffer =
        /\b(oferta|produto|produtos|servico|servicos|o que oferece|o que vende|o que entregamos)\b/.test(
          normalizedInstitutionalInstruction
        );

      const mentionsProcess =
        /\b(processo|metodo|metodologia|etapa|etapas|como funciona|forma de execucao|como executa)\b/.test(
          normalizedInstitutionalInstruction
        );

      const mentionsProof =
        /\b(prova|credencial|credenciais|experiencia|resultado comprovado|resultados comprovados|evidencia|evidencias|certificacao|certificacoes)\b/.test(
          normalizedInstitutionalInstruction
        );

      institutional = {
        role: mentionsRole
          ? institutional.role
          : currentInstitutional.role,
        audience: mentionsAudience
          ? institutional.audience
          : currentInstitutional.audience,
        offer: mentionsOffer
          ? institutional.offer
          : currentInstitutional.offer,
        process: mentionsProcess
          ? institutional.process
          : currentInstitutional.process,
        proof: mentionsProof
          ? institutional.proof
          : currentInstitutional.proof,
      };

      console.info("[Builder] Granular institutional revision", {
        preserveRole: !mentionsRole,
        preserveAudience: !mentionsAudience,
        preserveOffer: !mentionsOffer,
        preserveProcess: !mentionsProcess,
        preserveProof: !mentionsProof,
      });
    }

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

        const rawRevisionPlan = parsed.revisionPlan;

    if (
      !rawRevisionPlan ||
      !["page", "site"].includes(String(rawRevisionPlan.scope)) ||
      !Array.isArray(rawRevisionPlan.contentChanges) ||
      !Array.isArray(rawRevisionPlan.institutionalChanges) ||
      !Array.isArray(rawRevisionPlan.visualChanges) ||
      !Array.isArray(rawRevisionPlan.headerChanges) ||
      !Array.isArray(rawRevisionPlan.sectionChanges) ||
      !Array.isArray(rawRevisionPlan.elementChanges)
    ) {
      throw new Error("Invalid AI revision plan");
    }

    const revisionPlan = {
      scope: rawRevisionPlan.scope as "page" | "site",
      contentChanges: rawRevisionPlan.contentChanges,
      institutionalChanges: rawRevisionPlan.institutionalChanges,
      visualChanges: rawRevisionPlan.visualChanges,
      headerChanges: rawRevisionPlan.headerChanges,
      sectionChanges: rawRevisionPlan.sectionChanges,
      elementChanges: rawRevisionPlan.elementChanges,
    };

    if (instruction && existingPage) {
      try {
        const currentPage = JSON.parse(existingPage) as Partial<SitePage>;

        const requestedContentFields = new Set(
          revisionPlan.contentChanges.map((change) => change.field),
        );

        const preserveHeading =
          !requestedContentFields.has("heading");

        const preserveIntroduction =
          !requestedContentFields.has("introduction");

        const preserveCta =
          !requestedContentFields.has("cta");

        const preserveEyebrow =
          !requestedContentFields.has("eyebrow");

        if (
          preserveHeading &&
          typeof currentPage.heading === "string"
        ) {
          parsedPage.heading = currentPage.heading;
        }

        if (
          preserveIntroduction &&
          typeof currentPage.introduction === "string"
        ) {
          parsedPage.introduction = currentPage.introduction;
        }

        if (
          preserveCta &&
          typeof currentPage.cta === "string"
        ) {
          parsedPage.cta = currentPage.cta;
        }

        if (
          preserveEyebrow &&
          typeof currentPage.eyebrow === "string"
        ) {
          parsedPage.eyebrow = currentPage.eyebrow;
        }

        /*
         * U5.6D.2:
         * Section structure is intentionally NOT controlled by
         * revisionPlan yet. Keep deterministic protection until
         * sectionChanges receives its own validated application step.
         */
        const normalizedInstruction = instruction
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .toLowerCase();

        const mentionsSections =
          /\b(secao|secoes|card|cards|servico|servicos|beneficio|beneficios|bloco|blocos|conteudo)\b/.test(
            normalizedInstruction,
          );

        const broadRevision =
          /\b(toda|tudo|pagina inteira|pagina completa|reescreva a pagina|refaca a pagina|recrie a pagina|melhore a pagina inteira|mude tudo)\b/.test(
            normalizedInstruction,
          );

        const preserveSections =
          !broadRevision && !mentionsSections;

        if (
          preserveSections &&
          Array.isArray(currentPage.sections)
        ) {
          parsedPage.sections = currentPage.sections
            .filter(
              (section) =>
                section &&
                typeof section.title === "string" &&
                typeof section.body === "string",
            )
            .map((section) => ({
              title: section.title,
              body: section.body,
            }));
        }

        console.info("[Builder] Revision plan content protection", {
          key,
          requestedContentFields: Array.from(requestedContentFields),
          preserveHeading,
          preserveIntroduction,
          preserveCta,
          preserveEyebrow,
          preserveSections,
          sectionAuthority: "legacy-temporary",
        });
      } catch (revisionError) {
        console.warn(
          "[Builder] Could not apply revision plan content protection",
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

    const rawHeaderDirection = parsed.headerDirection;

    if (
      !rawHeaderDirection ||
      typeof rawHeaderDirection.logoPosition !== "string" ||
      typeof rawHeaderDirection.menuStyle !== "string" ||
      typeof rawHeaderDirection.density !== "string" ||
      !["left", "center", "right"].includes(rawHeaderDirection.logoPosition) ||
      !["inline", "dropdown"].includes(rawHeaderDirection.menuStyle) ||
      !["compact", "balanced", "spacious"].includes(rawHeaderDirection.density)
    ) {
      throw new Error("Invalid AI header direction");
    }

    const headerDirection = {
      logoPosition: rawHeaderDirection.logoPosition as "left" | "center" | "right",
      menuStyle: rawHeaderDirection.menuStyle as "inline" | "dropdown",
      density: rawHeaderDirection.density as "compact" | "balanced" | "spacious",
    };
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

    return NextResponse.json({ page, visualDirection, headerDirection, institutional, revisionPlan });
  } catch (error) {
    console.error("[Builder] Generation failed", error);
    return NextResponse.json({ error: "Não foi possível gerar esta página. Você pode tentar novamente." }, { status: 502 });
  } finally {
    clearTimeout(timer);
  }
}
