import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { frigologReferenceData, validateUniversalSiteData, type UniversalSiteData } from "@/lib/frigolog-template-data";

export const runtime = "nodejs";
const MAX_BODY = 4096;

export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) return NextResponse.json({ error: "Entre na sua conta para gerar o site." }, { status: 401 });
  const email = user.email?.trim().toLowerCase();
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const adminKey = process.env.SUPABASE_SECRET_KEY;
  if (!email) return NextResponse.json({ error: "Conta sem e-mail válido." }, { status: 403 });
  if (!supabaseUrl || !adminKey) return NextResponse.json({ error: "Acesso ao produto não configurado." }, { status: 503 });
  const admin = createAdminClient(supabaseUrl, adminKey, { auth: { persistSession: false, autoRefreshToken: false } });
  const { data: entitlement, error: entitlementError } = await admin.from("entitlements").select("id")
    .eq("product", "pagenova-ai").eq("status", "active").ilike("email", email).limit(1).maybeSingle();
  if (entitlementError) return NextResponse.json({ error: "Não foi possível validar sua assinatura." }, { status: 503 });
  if (!entitlement) return NextResponse.json({ error: "Assinatura PageNova ativa necessária." }, { status: 403 });
  if (!process.env.OPENAI_API_KEY) return NextResponse.json({ error: "Geração por IA ainda não configurada neste ambiente." }, { status: 503 });
  const raw = await request.text();
  if (raw.length > MAX_BODY) return NextResponse.json({ error: "Entrada muito longa." }, { status: 413 });
  let input: unknown;
  try { input = JSON.parse(raw); } catch { return NextResponse.json({ error: "JSON inválido." }, { status: 400 }); }
  if (!input || typeof input !== "object") return NextResponse.json({ error: "Dados inválidos." }, { status: 400 });
  const params = input as Record<string, unknown>;
  const niche = typeof params.niche === "string" ? params.niche.trim().slice(0, 100) : "";
  const company = typeof params.company === "string" ? params.company.trim().slice(0, 100) : "";
  const details = typeof params.details === "string" ? params.details.trim().slice(0, 1200) : "";
  if (!niche || !company) return NextResponse.json({ error: "Informe nicho e nome da empresa." }, { status: 400 });
  const reference = frigologReferenceData;
  const prompt = `Você é redator de sites profissionais brasileiros. Personalize SOMENTE o conteúdo textual do template fixo PageNova para um negócio. Não invente anos de experiência, prêmios, avaliações, números, certificações ou garantias. Não use textos genéricos; escreva para o nicho. Responda APENAS com um objeto JSON com as seguintes chaves:
brand:{name,tagline};hero:{eyebrow,title,description,ctaLabel};highlights:array de EXATAMENTE 4 objetos {title,description};services:{eyebrow,heading,items:array de EXATAMENTE 4 objetos {title,description}};about:{eyebrow,heading,paragraphs:array de EXATAMENTE 2 strings,benefits:array de EXATAMENTE 3 strings,ctaLabel};coverage:{eyebrow,heading,description};contact:{eyebrow,heading,description,ctaLabel}.
Não inclua imagens, links, cores, código, HTML ou outras chaves. Nome: ${company}. Nicho: ${niche}. Informações verificadas fornecidas pelo cliente: ${details || "nenhuma"}. Tom: profissional, objetivo, humano.`;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 25000);
    let response: Response;
    try {
      response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST", signal: controller.signal,
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ model: process.env.PAGENOVA_TEMPLATE_MODEL || "gpt-4o-mini", temperature: 0.5, max_tokens: 1800, response_format: { type: "json_object" }, messages: [{ role: "user", content: prompt }] }),
      });
    } finally { clearTimeout(timeout); }
    if (!response.ok) return NextResponse.json({ error: "Não foi possível gerar o conteúdo agora." }, { status: 502 });
    const result = await response.json();
    const generated = JSON.parse(result.choices?.[0]?.message?.content || "{}") as Record<string, unknown>;
    const object = (key: string) => generated[key] && typeof generated[key] === "object" && !Array.isArray(generated[key]) ? generated[key] as Record<string, unknown> : {};
    const merged: UniversalSiteData = {
      ...reference,
      brand: { ...reference.brand, ...object("brand"), name: company },
      hero: { ...reference.hero, ...object("hero"), image: reference.hero.image },
      highlights: generated.highlights as UniversalSiteData["highlights"],
      services: { ...reference.services, ...object("services") },
      about: { ...reference.about, ...object("about"), image: reference.about.image },
      coverage: { ...reference.coverage, ...object("coverage"), image: reference.coverage.image },
      contact: { ...reference.contact, ...object("contact"), ctaUrl: reference.contact.ctaUrl },
      footer: { copyright: `© ${new Date().getFullYear()} ${company}. Todos os direitos reservados.` },
    } as UniversalSiteData;
    const errors = validateUniversalSiteData(merged);
    if (errors.length) return NextResponse.json({ error: "A IA retornou um formato inesperado. Tente novamente." }, { status: 502 });
    return NextResponse.json({ data: merged, note: "Textos gerados por IA; imagens e cores mantidas para personalização." }, { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "A geração falhou. Tente novamente." }, { status: 502 });
  }
}
