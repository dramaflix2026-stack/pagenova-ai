import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const maxDuration = 90;

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return NextResponse.json({ error: "Faça login para criar imagens." }, { status: 401 });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;
  if (!url || !secret) return NextResponse.json({ error: "Configuração indisponível." }, { status: 503 });
  const admin = createAdminClient(url, secret, { auth: { persistSession: false } });
  const { data: entitlement, error } = await admin.from("entitlements").select("id")
    .eq("product", "pagenova-ai").eq("status", "active")
    .ilike("email", user.email.trim()).limit(1).maybeSingle();
  if (error || !entitlement) return NextResponse.json({ error: "Acesso indisponível." }, { status: 403 });
  let input: unknown;
  try { input = await request.json(); } catch { return NextResponse.json({ error: "Pedido inválido." }, { status: 400 }); }
  if (!input || typeof input !== "object") return NextResponse.json({ error: "Pedido inválido." }, { status: 400 });
  const body = input as Record<string, unknown>;
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const brief = typeof body.brief === "string" ? body.brief.trim() : "";
  const kind = body.kind;
  if (name.length < 2 || name.length > 100 || brief.length < 20 || brief.length > 3000 || !["hero", "work"].includes(String(kind))) {
    return NextResponse.json({ error: "Informe um briefing válido." }, { status: 400 });
  }
  const apiKey = process.env.OPENAI_API_KEY;
  if (process.env.PAGENOVA_AI_PROVIDER !== "openai" || !apiKey) {
    return NextResponse.json({ error: "Geração de imagem indisponível." }, { status: 503 });
  }
  const laundry = /lavanderia|lavagem de roupas|passadoria|roupas e peças/i.test(`${name} ${brief}`);
  const scene = laundry
    ? kind === "hero"
      ? "Fotografia comercial de uma lavanderia contemporânea em funcionamento. Pilhas de roupas limpas e dobradas, tecidos com textura visível, lavadoras profissionais discretas ao fundo. Foco no serviço e nas roupas, sem retrato ou rosto em destaque. Composição horizontal com área escura e limpa à esquerda para texto e ação principal à direita."
      : "Fotografia comercial diferente da primeira: mãos realizando passadoria ou dobra cuidadosa de roupas em bancada limpa, tecidos claros em primeiro plano e ambiente real de lavanderia ao fundo. Foco no processo, sem rosto em destaque, composição horizontal."
    : kind === "hero"
      ? "Fotografia principal do serviço ou ambiente descrito no briefing, com elemento relevante à direita e espaço livre à esquerda para texto. Retrato de pessoa apenas se o negócio for centrado em profissional individual."
      : "Fotografia de processo, detalhe do trabalho ou ambiente descrito no briefing, com composição diferente da imagem principal.";
  const prompt = `Crie uma fotografia editorial premium para o website de ${name}. Contexto: ${brief.slice(0, 1500)}. Cena obrigatória: ${scene} Fotografia realista, direção de arte profissional, iluminação natural, sem logos, marcas, letras ou alegações fabricadas. Não mostre a mesma cena nos dois banners.`;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 78000);
  try {
    const result = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST", signal: controller.signal,
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({ model: process.env.PAGENOVA_IMAGE_MODEL || "gpt-image-2.5-flare",
        prompt, size: "1536x1024", quality: "medium", output_format: "jpeg", output_compression: 76, n: 1 }),
    });
    if (!result.ok) { console.error("[Builder image] Provider failed", result.status); return NextResponse.json({ error: "Não foi possível criar a imagem." }, { status: 502 }); }
    const payload = await result.json() as { data?: { b64_json?: string }[] };
    const base64 = payload.data?.[0]?.b64_json;
    if (!base64 || base64.length > 8_000_000) throw new Error("Invalid image response");
    return NextResponse.json({ image: `data:image/jpeg;base64,${base64}` });
  } catch (cause) {
    console.error("[Builder image] Generation failed", cause);
    return NextResponse.json({ error: "A imagem não ficou pronta. Tente novamente." }, { status: 502 });
  } finally { clearTimeout(timeout); }
}
