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

  const prompt = `Negócio: ${name}\nCategoria informada: ${getSitePreset(presetId).title}\nBriefing: ${brief}\nDados confirmados pelo cliente: ${presetId === "institucional" ? facts : "Ver briefing"}\nEstratégia universal:\n${universalDirection}\nPlano recomendado de seções:\n${universalSectionPlan}\nEstilo solicitado: ${style}\nPágina atual: ${key}\nConteúdo atual: ${existingPage || "nenhum"}\nAlteração: ${instruction || "nenhuma"}\nUse a estratégia universal como planejamento editorial, não como autorização para inventar fatos. Adapte a página ao modelo de negócio, objetivo e conversão identificados. O plano de seções é uma recomendação: use apenas seções sustentadas pelos dados disponíveis e adequadas à página atual. Um nicho desconhecido deve continuar recebendo conteúdo específico a partir do briefing, sem depender de uma categoria cadastrada. Não mencione internamente modelo de negócio, estratégia universal, plano de seções ou classificação ao visitante. Escreva para o visitante final, nunca sobre a criação do site. Entregue uma proposta clara e específica do negócio, serviços e caminho para contato. Na home: hero explica a proposta; seções representam ofertas distintas confirmadas; sobre explica identidade e método sem repetir o hero; contato orienta o próximo passo. Não repita o mesmo argumento em cards, introdução e rodapé. Dê nomes concretos aos serviços se constarem dos dados. Se faltarem fatos, omita a afirmação; jamais publique frases como "pendente", "adicione aqui", "este espaço", "site em construção" ou listas de dados faltantes. Não invente credenciais, números, preços, depoimentos, resultados ou disponibilidade. Títulos de até 9 palavras; introdução de até 260 caracteres; 3 a 4 seções, cada uma com corpo de até 220 caracteres, diferentes entre si e adequadas ao nicho. Evite repetir o nome do negócio em todos os textos. Se houver print, use como referência de hierarquia visual e intenção, sem copiar marcas ou fatos de terceiros. Preserve conteúdo atual que não foi pedido para alterar. Direção de conteúdo obrigatória: o título principal deve nomear o serviço, produto ou transformação concreta. Na home, cada seção precisa corresponder a uma oferta diferente que conste do briefing ou dos dados confirmados; não use cards intitulados Sobre, Serviços, Contato, Atendimento, Diferenciais ou Dúvidas. Se as ofertas fornecidas não sustentarem quatro seções diferentes, entregue apenas as seções fundamentadas pelos fatos informados. Nunca escreva frases autorreferentes como Conheça os serviços disponíveis, saiba mais sobre nós, soluções para você, cuidado para sua rotina, atendimento pensado ou apresentação clara. Use frases curtas, com benefício específico e linguagem natural. Na página Sobre, não replique as ofertas da home. Evite repetir palavras ou sentenças entre páginas. Não invente prova social nem fatos. `;

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
        text: { format: { type: "json_schema", name: "institutional_page", strict: true, schema: {
          type: "object", additionalProperties: false,
          properties: {
            eyebrow: { type: "string" }, heading: { type: "string" }, introduction: { type: "string" },
            sections: { type: "array", items: { type: "object", additionalProperties: false,
              properties: { title: { type: "string" }, body: { type: "string" } }, required: ["title", "body"] } },
            cta: { type: "string" },
          }, required: ["eyebrow", "heading", "introduction", "sections", "cta"],
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
    const parsed = JSON.parse(text) as Omit<SitePage, "key">;
    if (typeof parsed.heading !== "string" || typeof parsed.introduction !== "string" ||
        typeof parsed.eyebrow !== "string" || typeof parsed.cta !== "string" ||
        !Array.isArray(parsed.sections) || parsed.sections.length < 1 || parsed.sections.length > 6 ||
        parsed.sections.some((section) => typeof section.title !== "string" || typeof section.body !== "string")) {
      throw new Error("Invalid AI page");
    }
    const page: SitePage = { key, eyebrow: parsed.eyebrow.slice(0, 100), heading: parsed.heading.slice(0, 180),
      introduction: parsed.introduction.slice(0, 300), cta: parsed.cta.slice(0, 80),
      sections: parsed.sections.slice(0, 4).map((section) => ({ title: section.title.slice(0, 80), body: section.body.slice(0, 280) })) };
    return NextResponse.json({ page });
  } catch (error) {
    console.error("[Builder] Generation failed", error);
    return NextResponse.json({ error: "Não foi possível gerar esta página. Você pode tentar novamente." }, { status: 502 });
  } finally {
    clearTimeout(timer);
  }
}
