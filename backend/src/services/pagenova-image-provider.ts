export type PageNovaImageSlot =
  | "hero"
  | "content"
  | "offer"
  | "bonus";

export function getPageNovaImageSlots(
  requestedCount: number,
): PageNovaImageSlot[] {
  if (requestedCount <= 0) {
    return [];
  }

  if (requestedCount === 1) {
    return ["hero"];
  }

  if (requestedCount === 2) {
    return ["hero", "content"];
  }

  if (requestedCount === 3) {
    return ["hero", "content", "offer"];
  }

  return ["hero", "content", "offer", "bonus"];
}

export function isPageNovaImageGenerationEnabled(): boolean {
  return (
    String(
      process.env.PAGENOVA_IMAGE_GENERATION_ENABLED ||
        "false",
    )
      .trim()
      .toLowerCase() === "true"
  );
}
export type PageNovaImageProductType =
  | "physical"
  | "info"
  | "ebook";

export type PageNovaImageRequest = {
  slot: PageNovaImageSlot;
  productType: PageNovaImageProductType;
  category: string;
  categoryLabel: string;
  productName: string;
  productDescription: string;
  accent?: string;
  mockupPreference?: string;
  visualInstructions?: string;
};

export type PageNovaGeneratedImage = {
  slot: PageNovaImageSlot;
  mimeType: "image/webp";
  base64: string;
  alt: string;
};

export type PageNovaImageProviderResult = {
  ok: boolean;
  provider: "openai";
  model: string;
  image?: PageNovaGeneratedImage;
  error?: string;
};

type OpenAIImagePayload = {
  data?: Array<{
    b64_json?: string;
  }>;
  error?: {
    message?: string;
  };
};

const DEFAULT_IMAGE_MODEL =
  "gpt-image-2.5-flare";

export function getPageNovaImageModel(): string {
  return String(
    process.env.PAGENOVA_OPENAI_IMAGE_MODEL ||
      DEFAULT_IMAGE_MODEL,
  ).trim();
}

export function isPageNovaImageConfigured(): boolean {
  return Boolean(
    String(process.env.OPENAI_API_KEY || "").trim(),
  );
}

function clean(value: unknown): string {
  return String(value ?? "").trim();
}

function getSlotPurpose(
  slot: PageNovaImageSlot,
): string {
  if (slot === "hero") {
    return [
      "Crie o visual comercial principal do produto.",
      "A imagem será usada no Hero da landing page.",
      "O produto deve ser o foco visual da composição.",
    ].join(" ");
  }

  if (slot === "content") {
    return [
      "Crie uma imagem contextual para uma seção de conteúdo.",
      "Ela deve ajudar a explicar a experiência, utilização",
      "ou transformação associada ao produto.",
    ].join(" ");
  }

  if (slot === "offer") {
    return [
      "Crie uma composição comercial premium para a oferta.",
      "Destaque visualmente o produto e seus entregáveis.",
    ].join(" ");
  }

  return [
    "Crie uma composição visual premium para os bônus.",
    "Represente materiais adicionais ou entregáveis extras.",
  ].join(" ");
}

function getMockupDirection(
  value: string,
): string {
  if (value === "notebook") {
    return "Apresente o produto principalmente em um notebook premium.";
  }

  if (value === "phone") {
    return "Apresente o produto principalmente em um smartphone premium.";
  }

  if (value === "notebook-phone") {
    return "Apresente o produto usando notebook e smartphone na mesma composição.";
  }

  if (value === "course") {
    return "Apresente o produto como curso ou área de membros digital.";
  }

  if (value === "digital-kit") {
    return "Apresente o produto como um kit digital 3D premium com múltiplos entregáveis.";
  }

  return "Escolha automaticamente a apresentação visual mais adequada ao produto.";
}

export function buildPageNovaImagePrompt(
  input: PageNovaImageRequest,
): string {
  const instructions =
    clean(input.visualInstructions);

  const accent =
    clean(input.accent) || "#7557FF";

  const mockup =
    clean(input.mockupPreference) ||
    "ai-decides";

  const promptParts = [
    "Crie uma imagem publicitária premium para uma landing page moderna.",
    getSlotPurpose(input.slot),
    "Produto: " + clean(input.productName) + ".",
    "Descrição real do produto: " +
      clean(input.productDescription) +
      ".",
    "Categoria: " +
      clean(input.categoryLabel || input.category) +
      ".",
    getMockupDirection(mockup),
    "Cor de destaque da identidade visual: " +
      accent +
      ".",
    "Composição limpa, sofisticada e comercial.",
    "Use iluminação profissional, profundidade visual e acabamento premium.",
    "A imagem deve funcionar visualmente dentro de uma landing page.",
    "Não invente depoimentos, avaliações, números de clientes, faturamento, resultados ou selos de autoridade.",
    "Não inclua botões, preços ou chamadas para ação dentro da imagem.",
    "Evite texto pequeno ou texto decorativo desnecessário dentro da imagem.",
  ];

  if (instructions) {
    promptParts.push(
      "Instrução visual adicional do usuário: " +
        instructions,
    );
  }

  return promptParts.join(" ");
}

export async function generatePageNovaImage(
  input: PageNovaImageRequest,
): Promise<PageNovaImageProviderResult> {
  const apiKey = String(
    process.env.OPENAI_API_KEY || "",
  ).trim();

  const model =
    getPageNovaImageModel();

  if (!apiKey) {
    return {
      ok: false,
      provider: "openai",
      model,
      error:
        "openai_api_key_not_configured",
    };
  }

  const prompt =
    buildPageNovaImagePrompt(input);

  try {
    const response = await fetch(
      "https://api.openai.com/v1/images/generations",
      {
        method: "POST",

        headers: {
          Authorization:
            "Bearer " + apiKey,

          "Content-Type":
            "application/json",
        },

        body: JSON.stringify({
          model,
          prompt,
          n: 1,
          size: "1536x1024",
          quality: "low",
          output_format: "webp",
          output_compression: 85,
          background: "opaque",
        }),
      },
    );

    const payload =
      (await response.json()) as OpenAIImagePayload;

    if (!response.ok) {
      return {
        ok: false,
        provider: "openai",
        model,
        error:
          payload.error?.message ||
          "openai_image_http_" +
            response.status,
      };
    }

    const base64 =
      clean(
        payload.data?.[0]?.b64_json,
      );

    if (!base64) {
      return {
        ok: false,
        provider: "openai",
        model,
        error:
          "openai_image_empty_output",
      };
    }

    return {
      ok: true,
      provider: "openai",
      model,

      image: {
        slot: input.slot,
        mimeType: "image/webp",
        base64,
        alt:
          clean(input.productName) +
          " - " +
          input.slot,
      },
    };
  } catch (error) {
    return {
      ok: false,
      provider: "openai",
      model,

      error:
        error instanceof Error
          ? error.message
          : "openai_image_unknown_error",
    };
  }
}

