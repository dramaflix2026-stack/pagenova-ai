import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import { getSitePreset, SITE_PRESETS } from "@/lib/site-builder-presets";

export const runtime = "nodejs";
export const maxDuration = 60;

type BriefingResult = {
  brief: string;
  institutional: {
    role: string;
    audience: string;
    offer: string;
    process: string;
    proof: string;
  };
};

function extractOutputText(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";

  const direct = (payload as { output_text?: unknown }).output_text;
  if (typeof direct === "string" && direct.trim()) return direct.trim();

  const output = (payload as {
    output?: Array<{
      content?: Array<{
        type?: string;
        text?: string;
      }>;
    }>;
  }).output;

  if (!Array.isArray(output)) return "";

  for (const item of output) {
    if (!Array.isArray(item?.content)) continue;

    for (const content of item.content) {
      if (
        (content?.type === "output_text" || content?.type === "text") &&
        typeof content.text === "string" &&
        content.text.trim()
      ) {
        return content.text.trim();
      }
    }
  }

  return "";
}

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user?.email) {
    return NextResponse.json(
      { error: "Faça login para usar o assistente de briefing." },
      { status: 401 },
    );
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const secret = process.env.SUPABASE_SECRET_KEY;

  if (!url || !secret) {
    return NextResponse.json(
      { error: "Configuração indisponível." },
      { status: 503 },
    );
  }

  const admin = createAdminClient(url, secret, {
    auth: { persistSession: false },
  });

  const { data: entitlement, error: accessError } = await admin
    .from("entitlements")
    .select("id")
    .eq("product", "pagenova-ai")
    .eq("status", "active")
    .ilike("email", user.email.trim())
    .limit(1)
    .maybeSingle();

  if (accessError || !entitlement) {
    return NextResponse.json(
      { error: "Acesso indisponível." },
      { status: 403 },
    );
  }

  let body: Record<string, unknown>;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Pedido inválido." },
      { status: 400 },
    );
  }

  const name =
    typeof body.name === "string" ? body.name.trim() : "";

  const description =
    typeof body.description === "string"
      ? body.description.trim()
      : "";

  const presetId =
    typeof body.presetId === "string"
      ? body.presetId
      : "institucional";

  if (
    name.length < 2 ||
    name.length > 100 ||
    description.length < 10 ||
    description.length > 1200 ||
    !SITE_PRESETS.some((preset) => preset.id === presetId)
  ) {
    return NextResponse.json(
      {
        error:
          "Informe o nome do negócio e uma descrição curta com pelo menos 10 caracteres.",
      },
      { status: 400 },
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;

  if (
    process.env.PAGENOVA_AI_PROVIDER !== "openai" ||
    !apiKey
  ) {
    return NextResponse.json(
      {
        error:
          "O assistente de briefing com IA ainda não está configurado.",
      },
      { status: 503 },
    );
  }

  const category = getSitePreset(presetId).title;

  const prompt = `
Nome do negócio: ${name}
Categoria selecionada na interface: ${category}
Descrição fornecida pelo usuário:
${description}

Transforme essas informações em um briefing profissional para criação de um site.

Interprete semanticamente o negócio. Não dependa de uma lista fechada de nichos e não force o negócio a caber na categoria selecionada quando a descrição indicar algo mais específico.

O briefing deve ajudar outra IA a criar um site realmente adequado ao negócio.

Inclua somente informações sustentadas pela descrição do usuário.

Organize o briefing em texto natural e objetivo, contemplando quando houver base:
- o que é o negócio;
- o que oferece;
- público atendido;
- problema ou necessidade que resolve;
- diferenciais explicitamente informados;
- objetivo principal do site;
- conversão mais apropriada;
- tom de comunicação;
- informações úteis para hero, serviços, benefícios, processo e contato.

Não invente:
- endereço;
- telefone;
- preços;
- números;
- clientes;
- avaliações;
- certificações;
- credenciais;
- resultados;
- garantias;
- tempo de mercado;
- formas de atendimento;
- serviços não mencionados;
- características não informadas.

Quando um dado importante não estiver disponível, simplesmente não o inclua.
Não escreva campos como "não informado", "a definir", "[preencher]" ou equivalentes.
Não inclua HTML, Markdown ou scripts.

Além do briefing, extraia os dados institucionais apenas quando estiverem claramente sustentados pela descrição.

"role" = quem é a empresa/profissional ou qual é sua atuação.
"audience" = público explicitamente informado ou claramente descrito.
"offer" = serviços/produtos efetivamente mencionados.
"process" = como funciona, somente se isso estiver informado.
"proof" = credencial/prova verificável, somente se estiver informada.

Se algum desses dados não estiver sustentado pela entrada, devolva string vazia nesse campo.
`.trim();

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 45000);

  try {
    const ai = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        body: JSON.stringify({
          model:
            process.env.PAGENOVA_OPENAI_MODEL ||
            "gpt-5.6-luna",

          input: [
            {
              role: "system",
              content:
                "Você é o assistente de briefing do PageNova. Converta uma descrição curta de um negócio em um briefing factual, específico e útil para geração de sites profissionais em português brasileiro. Nunca invente fatos.",
            },
            {
              role: "user",
              content: prompt,
            },
          ],

          text: {
            format: {
              type: "json_schema",
              name: "pagenova_site_briefing",
              strict: true,
              schema: {
                type: "object",
                additionalProperties: false,
                properties: {
                  brief: {
                    type: "string",
                    minLength: 20,
                    maxLength: 2800,
                  },
                  institutional: {
                    type: "object",
                    additionalProperties: false,
                    properties: {
                      role: {
                        type: "string",
                        maxLength: 400,
                      },
                      audience: {
                        type: "string",
                        maxLength: 400,
                      },
                      offer: {
                        type: "string",
                        maxLength: 400,
                      },
                      process: {
                        type: "string",
                        maxLength: 400,
                      },
                      proof: {
                        type: "string",
                        maxLength: 400,
                      },
                    },
                    required: [
                      "role",
                      "audience",
                      "offer",
                      "process",
                      "proof",
                    ],
                  },
                },
                required: ["brief", "institutional"],
              },
            },
          },
        }),
      },
    );

    const payload = (await ai.json()) as unknown;

    if (!ai.ok) {
      console.error(
        "[BuilderBrief] OpenAI request failed",
        ai.status,
      );

      return NextResponse.json(
        {
          error:
            "Não foi possível criar o briefing agora. Tente novamente.",
        },
        { status: 502 },
      );
    }

    const raw = extractOutputText(payload);

    if (!raw) {
      throw new Error("Resposta da IA sem conteúdo.");
    }

    let parsed: BriefingResult;

    try {
      parsed = JSON.parse(raw) as BriefingResult;
    } catch {
      throw new Error("Resposta estruturada inválida.");
    }

    const brief =
      typeof parsed.brief === "string"
        ? parsed.brief.trim().slice(0, 2800)
        : "";

    if (brief.length < 20) {
      throw new Error("Briefing retornado é muito curto.");
    }

    const institutional =
      parsed.institutional &&
      typeof parsed.institutional === "object"
        ? parsed.institutional
        : {
            role: "",
            audience: "",
            offer: "",
            process: "",
            proof: "",
          };

    return NextResponse.json({
      brief,
      institutional: {
        role:
          typeof institutional.role === "string"
            ? institutional.role.trim().slice(0, 400)
            : "",
        audience:
          typeof institutional.audience === "string"
            ? institutional.audience.trim().slice(0, 400)
            : "",
        offer:
          typeof institutional.offer === "string"
            ? institutional.offer.trim().slice(0, 400)
            : "",
        process:
          typeof institutional.process === "string"
            ? institutional.process.trim().slice(0, 400)
            : "",
        proof:
          typeof institutional.proof === "string"
            ? institutional.proof.trim().slice(0, 400)
            : "",
      },
    });
  } catch (error) {
    console.error(
      "[BuilderBrief] Generation failed",
      error,
    );

    return NextResponse.json(
      {
        error:
          "Não foi possível criar o briefing. Tente novamente.",
      },
      { status: 502 },
    );
  } finally {
    clearTimeout(timer);
  }
}