import type {
  PageNovaCopyRequest,
  PageNovaCopyResult,
} from "./pagenova-copy-engine";

export type PageNovaAIProviderName =
  | "none"
  | "openai"
  | "gemini";

export type PageNovaAIUsage = {
  inputTokens: number;
  outputTokens: number;
  totalTokens: number;
};

export type PageNovaAIProviderResult = {
  provider: PageNovaAIProviderName;
  model: string | null;
  usedAI: boolean;
  copy: PageNovaCopyResult | null;
  error: string | null;
  usage: PageNovaAIUsage | null;
};

type OpenAIResponsePayload = {
  id?: string;
  status?: string;
  output_text?: string;
  output?: Array<{
    type?: string;
    content?: Array<{
      type?: string;
      text?: string;
      refusal?: string;
    }>;
  }>;
  usage?: {
    input_tokens?: number;
    output_tokens?: number;
    total_tokens?: number;
  };
  error?: {
    message?: string;
    type?: string;
    code?: string;
  };
};

function resolveProvider(): PageNovaAIProviderName {
  const raw = String(process.env.PAGENOVA_AI_PROVIDER || "none")
    .trim()
    .toLowerCase();

  if (raw === "openai") {
    return "openai";
  }

  if (raw === "gemini") {
    return "gemini";
  }

  return "none";
}

export function getPageNovaAIProviderName(): PageNovaAIProviderName {
  return resolveProvider();
}

export function isPageNovaAIConfigured(): boolean {
  const provider = resolveProvider();

  if (provider === "openai") {
    return Boolean(String(process.env.OPENAI_API_KEY || "").trim());
  }

  if (provider === "gemini") {
    return Boolean(String(process.env.GEMINI_API_KEY || "").trim());
  }

  return false;
}

function getOpenAIModel(): string {
  return String(
    process.env.PAGENOVA_OPENAI_MODEL || "gpt-5.6-luna",
  ).trim();
}

function stringSchema() {
  return {
    type: "string",
  };
}

function simpleItemSchema() {
  return {
    type: "object",
    properties: {
      title: stringSchema(),
      description: stringSchema(),
    },
    required: [
      "title",
      "description",
    ],
    additionalProperties: false,
  };
}

function badgeItemSchema() {
  return {
    type: "object",
    properties: {
      title: stringSchema(),
      description: stringSchema(),
      badge: stringSchema(),
    },
    required: [
      "title",
      "description",
      "badge",
    ],
    additionalProperties: false,
  };
}

const pageNovaCopySchema = {
  type: "object",
  properties: {
    source: {
      type: "string",
      enum: ["openai"],
    },

    hero: {
      type: "object",
      properties: {
        eyebrow: stringSchema(),
        headline: stringSchema(),
        subheadline: stringSchema(),
        cta: stringSchema(),
      },
      required: [
        "eyebrow",
        "headline",
        "subheadline",
        "cta",
      ],
      additionalProperties: false,
    },

    before: {
      type: "object",
      properties: {
        eyebrow: stringSchema(),
        headline: stringSchema(),
        description: stringSchema(),
        items: {
          type: "array",
          items: simpleItemSchema(),
        },
      },
      required: [
        "eyebrow",
        "headline",
        "description",
        "items",
      ],
      additionalProperties: false,
    },

    after: {
      type: "object",
      properties: {
        eyebrow: stringSchema(),
        headline: stringSchema(),
        description: stringSchema(),
        items: {
          type: "array",
          items: simpleItemSchema(),
        },
        cta: stringSchema(),
      },
      required: [
        "eyebrow",
        "headline",
        "description",
        "items",
        "cta",
      ],
      additionalProperties: false,
    },

    included: {
      type: "object",
      properties: {
        eyebrow: stringSchema(),
        headline: stringSchema(),
        description: stringSchema(),
        items: {
          type: "array",
          items: badgeItemSchema(),
        },
      },
      required: [
        "eyebrow",
        "headline",
        "description",
        "items",
      ],
      additionalProperties: false,
    },

    bonuses: {
      type: "object",
      properties: {
        eyebrow: stringSchema(),
        headline: stringSchema(),
        description: stringSchema(),
        items: {
          type: "array",
          items: badgeItemSchema(),
        },
      },
      required: [
        "eyebrow",
        "headline",
        "description",
        "items",
      ],
      additionalProperties: false,
    },

    offer: {
      type: "object",
      properties: {
        label: stringSchema(),
        headline: stringSchema(),
        description: stringSchema(),
        items: {
          type: "array",
          items: stringSchema(),
        },
        priceLabel: stringSchema(),
        cta: stringSchema(),
        secureNote: stringSchema(),
      },
      required: [
        "label",
        "headline",
        "description",
        "items",
        "priceLabel",
        "cta",
        "secureNote",
      ],
      additionalProperties: false,
    },

    guarantee: {
      type: "object",
      properties: {
        eyebrow: stringSchema(),
        headline: stringSchema(),
        description: stringSchema(),
      },
      required: [
        "eyebrow",
        "headline",
        "description",
      ],
      additionalProperties: false,
    },

    faq: {
      type: "array",
      items: {
        type: "object",
        properties: {
          question: stringSchema(),
          answer: stringSchema(),
        },
        required: [
          "question",
          "answer",
        ],
        additionalProperties: false,
      },
    },

    finalCta: {
      type: "object",
      properties: {
        eyebrow: stringSchema(),
        headline: stringSchema(),
        description: stringSchema(),
        cta: stringSchema(),
        microcopy: stringSchema(),
      },
      required: [
        "eyebrow",
        "headline",
        "description",
        "cta",
        "microcopy",
      ],
      additionalProperties: false,
    },
  },
  required: [
    "source",
    "hero",
    "before",
    "after",
    "included",
    "bonuses",
    "offer",
    "guarantee",
    "faq",
    "finalCta",
  ],
  additionalProperties: false,
};

function buildSystemPrompt(): string {
  return [
    "Voce e o PageNova Copy Engine.",
    "Sua funcao e escrever copy comercial especifica para landing pages.",
    "Responda em portugues brasileiro.",
    "Nao gere HTML, CSS, Markdown ou codigo.",
    "Nao altere a arquitetura da landing page.",
    "Preencha somente o JSON exigido pelo schema.",
    "",
    "REGRAS DE QUALIDADE:",
    "- Evite copy generica, vazia ou intercambiavel entre produtos.",
    "- Use o nome do produto e a categoria para inferir contexto comercial plausivel.",
    "- Nao invente depoimentos, numeros de clientes, faturamento ou resultados comprovados.",
    "- Nao invente credenciais do produtor.",
    "- Nao prometa renda garantida.",
    "- Nao use alegacoes que dependam de fatos que nao foram fornecidos.",
    "- Transforme beneficios abstratos em ganhos praticos quando isso puder ser inferido com seguranca.",
    "- Headline deve ser especifica ao produto.",
    "- Antes e Depois devem representar a transformacao desejada sem prometer resultado garantido.",
    "- O que esta incluso deve parecer parte real e coerente do produto.",
    "- Bonus devem ser complementares ao produto principal.",
    "- FAQ deve responder objecoes comerciais reais.",
    "- CTAs devem ser claros e orientados a acao.",
    "- Nao mencione PageNova na copy final.",
    "",
    "IMPORTANTE:",
    "O campo source deve ser exatamente openai.",
  ].join("\n");
}

function buildUserPrompt(input: PageNovaCopyRequest): string {
  return [
    "Crie a copy estruturada desta landing page.",
    "",
    "TIPO DO PRODUTO: " + input.productType,
    "CATEGORIA ID: " + input.category,
    "CATEGORIA: " + input.categoryLabel,
    "NOME DO PRODUTO: " + input.productName,
    "DESCRICAO DO PRODUTO: " + input.productDescription,
    "PRECO: R$ " + input.price,
    "GARANTIA: " + input.guaranteeDays + " dias",
    "",
    "A arquitetura visual ja existe e nao deve ser recriada.",
    "Sua responsabilidade e somente gerar a copy de cada secao.",
    "A copy deve ser coerente de ponta a ponta e parecer escrita especificamente para este produto.",
  ].join("\n");
}

function extractOutputText(payload: OpenAIResponsePayload): string | null {
  if (
    typeof payload.output_text === "string" &&
    payload.output_text.trim()
  ) {
    return payload.output_text.trim();
  }

  if (!Array.isArray(payload.output)) {
    return null;
  }

  for (const item of payload.output) {
    if (!Array.isArray(item.content)) {
      continue;
    }

    for (const content of item.content) {
      if (
        content.type === "output_text" &&
        typeof content.text === "string" &&
        content.text.trim()
      ) {
        return content.text.trim();
      }
    }
  }

  return null;
}

function normalizeUsage(
  payload: OpenAIResponsePayload,
): PageNovaAIUsage | null {
  if (!payload.usage) {
    return null;
  }

  const inputTokens =
    Number(payload.usage.input_tokens || 0);

  const outputTokens =
    Number(payload.usage.output_tokens || 0);

  const totalTokens =
    Number(
      payload.usage.total_tokens ||
      inputTokens + outputTokens,
    );

  return {
    inputTokens,
    outputTokens,
    totalTokens,
  };
}

function isRecord(
  value: unknown,
): value is Record<string, unknown> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value)
  );
}

function validateCopyShape(
  value: unknown,
): value is PageNovaCopyResult {
  if (!isRecord(value)) {
    return false;
  }

  const requiredObjects = [
    "hero",
    "before",
    "after",
    "included",
    "bonuses",
    "offer",
    "guarantee",
    "finalCta",
  ];

  for (const key of requiredObjects) {
    if (!isRecord(value[key])) {
      return false;
    }
  }

  if (!Array.isArray(value.faq)) {
    return false;
  }

  if (value.source !== "openai") {
    return false;
  }

  return true;
}

async function generateCopyWithOpenAI(
  input: PageNovaCopyRequest,
): Promise<PageNovaAIProviderResult> {
  const apiKey =
    String(process.env.OPENAI_API_KEY || "").trim();

  const model = getOpenAIModel();

  if (!apiKey) {
    return {
      provider: "openai",
      model,
      usedAI: false,
      copy: null,
      error: "openai_api_key_not_configured",
      usage: null,
    };
  }

  try {
    const response = await fetch(
      "https://api.openai.com/v1/responses",
      {
        method: "POST",
        headers: {
          Authorization: "Bearer " + apiKey,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model,
          instructions: buildSystemPrompt(),
          input: buildUserPrompt(input),
          text: {
            format: {
              type: "json_schema",
              name: "pagenova_landing_page_copy",
              strict: true,
              schema: pageNovaCopySchema,
            },
          },
        }),
      },
    );

    const payload =
      (await response.json()) as OpenAIResponsePayload;

    const usage = normalizeUsage(payload);

    if (!response.ok) {
      return {
        provider: "openai",
        model,
        usedAI: false,
        copy: null,
        error:
          payload.error?.message ||
          "openai_http_" + response.status,
        usage,
      };
    }

    const outputText = extractOutputText(payload);

    if (!outputText) {
      return {
        provider: "openai",
        model,
        usedAI: false,
        copy: null,
        error: "openai_empty_output",
        usage,
      };
    }

    let parsed: unknown;

    try {
      parsed = JSON.parse(outputText);
    } catch {
      return {
        provider: "openai",
        model,
        usedAI: false,
        copy: null,
        error: "openai_invalid_json",
        usage,
      };
    }

    if (!validateCopyShape(parsed)) {
      return {
        provider: "openai",
        model,
        usedAI: false,
        copy: null,
        error: "openai_invalid_copy_shape",
        usage,
      };
    }

    return {
      provider: "openai",
      model,
      usedAI: true,
      copy: parsed,
      error: null,
      usage,
    };
  } catch (error) {
    return {
      provider: "openai",
      model,
      usedAI: false,
      copy: null,
      error:
        error instanceof Error
          ? error.message
          : "openai_unknown_error",
      usage: null,
    };
  }
}

export async function generateCopyWithAI(
  input: PageNovaCopyRequest,
): Promise<PageNovaAIProviderResult> {
  const provider = resolveProvider();

  if (provider === "none") {
    return {
      provider,
      model: null,
      usedAI: false,
      copy: null,
      error: "ai_provider_not_configured",
      usage: null,
    };
  }

  if (!isPageNovaAIConfigured()) {
    return {
      provider,
      model: null,
      usedAI: false,
      copy: null,
      error: "ai_api_key_not_configured",
      usage: null,
    };
  }

  if (provider === "openai") {
    return generateCopyWithOpenAI(input);
  }

  return {
    provider,
    model: null,
    usedAI: false,
    copy: null,
    error: "gemini_provider_not_implemented",
    usage: null,
  };
}
