import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { SITE_PAGES, type SitePage, type SitePageKey } from "@/lib/site-builder";
import { getSitePreset, SITE_PRESETS } from "@/lib/site-builder-presets";

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
  const submitted = body.institutional && typeof body.institutional === "object"
    ? body.institutional as Record<string, unknown> : {};
  const facts = ["role", "audience", "offer", "process", "proof"].map((field) => {
    const value = submitted[field];
    return `${field}: ${typeof value === "string" ? value.slice(0, 700).trim() : ""}`;
  }).join("\n");

  if (brief.length < 20 || brief.length > 3000 || name.length < 2 || name.length > 100 ||
      !keys.has(key) || !SITE_PRESETS.some((preset) => preset.id === presetId) || !["moderno", "elegante", "vibrante"].includes(style) || instruction.length > 700 || existingPage.length > 6000) {
    return NextResponse.json({ error: "Revise o nome, a descrição e o estilo." }, { status: 400 });
  }
  const apiKey = process.env.OPENAI_API_KEY;
  if (process.env.PAGENOVA_AI_PROVIDER !== "openai" || !apiKey) {
    return NextResponse.json({ error: "O gerador de sites com IA ainda não está configurado." }, { status: 503 });
  }

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
          { role: "user", content: `Negócio: ${name}\nNicho: ${getSitePreset(presetId).title}\nMódulos necessários: ${getSitePreset(presetId).modules.join(", ")}\nBriefing: ${brief}\nInformações fornecidas pelo cliente (campos vazios não são fatos):\n${presetId === "institucional" ? facts : "não aplicável"}\nEstilo: ${style}\nPágina: ${key}\nConteúdo atual: ${existingPage || "nenhum"}\nAlteração solicitada: ${instruction || "nenhuma"}\nPara Landing de SaaS: escreva recursos concretos, fluxo de uso e casos de uso específicos ao briefing; na home, seções para benefícios, recursos, funcionamento e objeções; na página de serviços, detalhe funcionalidades. Planos e depoimentos só podem conter dados fornecidos. Para outros nichos: Crie a página com 3 a 5 seções específicas do nicho e CTA apropriado. Na página inicial, priorize a proposta de valor e a jornada principal do visitante. Na página de serviços, descreva ofertas/áreas pertinentes. Se houver conteúdo atual, preserve o que não foi solicitado alterar.` },
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
      introduction: parsed.introduction.slice(0, 800), cta: parsed.cta.slice(0, 80),
      sections: parsed.sections.map((section) => ({ title: section.title.slice(0, 120), body: section.body.slice(0, 800) })) };
    return NextResponse.json({ page });
  } catch (error) {
    console.error("[Builder] Generation failed", error);
    return NextResponse.json({ error: "Não foi possível gerar esta página. Você pode tentar novamente." }, { status: 502 });
  } finally {
    clearTimeout(timer);
  }
}
