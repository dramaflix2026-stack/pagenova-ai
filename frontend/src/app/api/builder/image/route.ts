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
  const visualRole =
    kind === "hero"
      ? `
IMAGEM PRINCIPAL / HERO:
- Crie a principal fotografia editorial do site.
- A imagem deve comunicar imediatamente o tipo REAL de negócio descrito.
- Mostre ambiente, atividade, serviço, produto ou profissional que façam sentido para esse negócio.
- A composição deve funcionar como hero de website premium.
- Priorize o assunto principal no centro/direita e preserve respiro visual suficiente.
- Não coloque texto dentro da imagem.
`
      : `
IMAGEM SECUNDÁRIA / SOBRE / PROCESSO:
- Crie uma segunda fotografia diferente da imagem principal.
- Mostre contexto real de trabalho, ambiente, processo, atendimento, detalhe profissional, equipe ou execução do serviço.
- Não repita enquadramento, cena ou composição da imagem principal.
- A imagem deve complementar a história visual da empresa.
- Não coloque texto dentro da imagem.
`;

  const prompt = `
Você é diretor de arte de um website institucional premium.

EMPRESA / MARCA:
${name}

BRIEFING ORIGINAL:
${brief.slice(0, 1800)}

TAREFA:
Interprete semanticamente o briefing antes de criar a fotografia.

Descubra:
- qual é o setor real;
- qual é o negócio;
- qual serviço, produto ou atividade representa melhor a empresa;
- qual ambiente seria autêntico para esse negócio;
- quais objetos, ferramentas, equipamentos, materiais ou contexto visual pertencem naturalmente ao setor;
- se faz sentido mostrar uma pessoa, profissional, equipe, ambiente, produto ou processo.

A fotografia DEVE ser específica ao negócio descrito.

Exemplos de raciocínio, apenas para demonstrar a regra:
- clínica odontológica → contexto odontológico real;
- escritório de advocacia → ambiente jurídico/profissional coerente;
- arquitetura → arquitetura, projeto, materiais ou ambiente construído;
- oficina mecânica → contexto automotivo e trabalho mecânico;
- restaurante → gastronomia, cozinha, prato ou ambiente coerente;
- software B2B → ambiente profissional/tecnológico plausível;
- imobiliária → arquitetura, imóvel ou atendimento imobiliário;
- estética → clínica, ambiente ou procedimento coerente.

Esses exemplos NÃO são uma lista de nichos.
Para qualquer outro negócio, interprete o briefing e construa a cena correta.

${visualRole}

DIREÇÃO DE ARTE:
Fotografia editorial comercial premium.
Realismo fotográfico.
Aspecto sofisticado e contemporâneo.
Iluminação profissional natural.
Composição limpa.
Profundidade realista.
Materiais e texturas convincentes.
Sem aparência de banco de imagens genérico.
Sem aparência de render 3D.
Sem estética artificial de IA.
Sem colagem.
Sem mockup de website.
Sem moldura.
Sem interface.
Sem texto.
Sem letras.
Sem logos.
Sem marcas de terceiros.
Sem watermark.

FIDELIDADE:
Não invente certificações, prêmios, números, clientes, resultados ou características factuais não fornecidas.
Não introduza elementos visualmente incompatíveis com o setor.
Se houver pessoas, use aparência natural e profissional adequada ao contexto.
Se o negócio não exigir pessoa, priorize ambiente, produto, serviço ou processo.

A imagem deve parecer produzida especificamente para ${name}, e não uma fotografia genérica que poderia servir para qualquer empresa.
`.trim();
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
