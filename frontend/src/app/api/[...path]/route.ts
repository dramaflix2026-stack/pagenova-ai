import { NextRequest, NextResponse } from "next/server";

import { cloneLandingPage } from "@/server/services/cloner-service";
import { generatePageNovaCopy } from "@/server/services/pagenova-copy-engine";
import { generateCopyWithAI } from "@/server/services/pagenova-ai-provider";

import {
  generatePageNovaImage,
  getPageNovaImageSlots,
  isPageNovaImageConfigured,
  isPageNovaImageGenerationEnabled,
  type PageNovaImageProductType,
  type PageNovaImageSlot,
} from "@/server/services/pagenova-image-provider";

export const runtime = "nodejs";
export const maxDuration = 300;
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{
    path: string[];
  }>;
};

function json(data: unknown, status = 200) {
  return NextResponse.json(data, { status });
}

async function getPath(context: RouteContext) {
  const params = await context.params;
  return (params.path || []).join("/");
}

export async function GET(
  _request: NextRequest,
  context: RouteContext,
) {
  const path = await getPath(context);

  if (path === "health") {
    return json({
      ok: true,
      service: "next-api",
      product: "LP Cloner + LP Generator",
      timestamp: new Date().toISOString(),
    });
  }

  return json(
    {
      ok: false,
      error: "route_not_found",
    },
    404,
  );
}

export async function POST(
  request: NextRequest,
  context: RouteContext,
) {
  const path = await getPath(context);

  let body: Record<string, unknown>;

  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return json(
      {
        ok: false,
        error: "invalid_json",
      },
      400,
    );
  }

  if (path === "pagenova/generate-copy") {
    try {
      const productType =
        typeof body.productType === "string"
          ? body.productType.trim()
          : "";

      const category =
        typeof body.category === "string"
          ? body.category.trim()
          : "";

      const categoryLabel =
        typeof body.categoryLabel === "string"
          ? body.categoryLabel.trim()
          : "";

      const productName =
        typeof body.productName === "string"
          ? body.productName.trim()
          : "";

      const productDescription =
        typeof body.productDescription === "string"
          ? body.productDescription.trim()
          : "";

      const price =
        typeof body.price === "string"
          ? body.price.trim()
          : "";

      const guaranteeDays = Number(body.guaranteeDays);

      if (
        !productType ||
        !category ||
        !categoryLabel ||
        !productName ||
        !productDescription ||
        !price ||
        !Number.isFinite(guaranteeDays)
      ) {
        return json(
          {
            ok: false,
            error: "missing_required_fields",
          },
          400,
        );
      }

      if (
        productType !== "physical" &&
        productType !== "info" &&
        productType !== "ebook"
      ) {
        return json(
          {
            ok: false,
            error: "invalid_product_type",
          },
          400,
        );
      }

      const input = {
        productType,
        category,
        categoryLabel,
        productName,
        productDescription,
        price,
        guaranteeDays,
      };

      const aiResult = await generateCopyWithAI(input);

      if (aiResult.usedAI && aiResult.copy) {
        return json({
          ok: true,
          source: "openai",
          provider: aiResult.provider,
          model: aiResult.model,
          fallbackReason: null,
          usage: aiResult.usage,
          copy: aiResult.copy,
        });
      }

      const fallbackCopy = generatePageNovaCopy(input);

      return json({
        ok: true,
        source: "fallback",
        provider: aiResult.provider,
        model: aiResult.model,
        fallbackReason:
          aiResult.error || "ai_generation_unavailable",
        usage: aiResult.usage,
        copy: fallbackCopy,
      });
    } catch (error) {
      console.error("[PageNova Copy Engine]", error);

      return json(
        {
          ok: false,
          error: "copy_generation_failed",
        },
        500,
      );
    }
  }

  if (path === "cloner/analyze") {
    const rawUrl =
      typeof body.url === "string"
        ? body.url.trim()
        : "";

    if (!rawUrl) {
      return json(
        {
          ok: false,
          error: "Informe a URL da landing page.",
          code: "URL_REQUIRED",
        },
        400,
      );
    }

    try {
      const project = await cloneLandingPage(rawUrl);

      return json({
        ok: true,
        project,
        stats: {
          headings: project.headings.length,
          texts: project.texts.length,
          links: project.links.length,
          images: project.images.length,
          sections: project.sections.length,
        },
      });
    } catch (error) {
      const code =
        error instanceof Error
          ? error.message
          : "CLONE_ERROR";

      const friendlyMessages: Record<string, string> = {
        URL_INVALIDA:
          "A URL informada não é válida.",
        PROTOCOLO_NAO_PERMITIDO:
          "Use uma URL iniciando com http:// ou https://.",
        URL_COM_CREDENCIAIS_NAO_PERMITIDA:
          "URLs contendo usuário ou senha não são permitidas.",
        HOST_NAO_PERMITIDO:
          "Esse endereço não pode ser processado.",
        HOST_NAO_ENCONTRADO:
          "Não foi possível localizar esse domínio.",
        TIMEOUT:
          "A página demorou demais para responder.",
        FALHA_AO_ACESSAR_URL:
          "Não foi possível acessar a página.",
        REDIRECT_LIMIT:
          "A página possui redirecionamentos demais.",
        REDIRECT_INVALIDO:
          "A página retornou um redirecionamento inválido.",
        CONTEUDO_NAO_HTML:
          "O endereço informado não retornou uma página HTML.",
        PAGINA_MUITO_GRANDE:
          "A página é grande demais para este importador.",
      };

      const message =
        friendlyMessages[code] ||
        (code.startsWith("HTTP_")
          ? `A página respondeu com erro ${code.replace(
              "HTTP_",
              "",
            )}.`
          : "Não foi possível analisar essa página.");

      return json(
        {
          ok: false,
          error: message,
          code,
        },
        422,
      );
    }
  }

  if (path === "pagenova/generate-image") {
    try {
      if (!isPageNovaImageGenerationEnabled()) {
        return json(
          {
            ok: false,
            error: "image_generation_disabled",
          },
          503,
        );
      }

      if (!isPageNovaImageConfigured()) {
        return json(
          {
            ok: false,
            error: "image_provider_not_configured",
          },
          503,
        );
      }

      const productType =
        typeof body.productType === "string"
          ? body.productType.trim()
          : "";

      const category =
        typeof body.category === "string"
          ? body.category.trim()
          : "";

      const categoryLabel =
        typeof body.categoryLabel === "string"
          ? body.categoryLabel.trim()
          : "";

      const productName =
        typeof body.productName === "string"
          ? body.productName.trim()
          : "";

      const productDescription =
        typeof body.productDescription === "string"
          ? body.productDescription.trim()
          : "";

      const accent =
        typeof body.accent === "string"
          ? body.accent.trim()
          : "";

      const mockupPreference =
        typeof body.mockupPreference === "string"
          ? body.mockupPreference.trim()
          : "";

      const visualInstructions =
        typeof body.visualInstructions === "string"
          ? body.visualInstructions.trim()
          : "";

      const slot =
        typeof body.slot === "string"
          ? body.slot.trim()
          : "";

      if (
        !productType ||
        !category ||
        !categoryLabel ||
        !productName ||
        !productDescription ||
        !slot
      ) {
        return json(
          {
            ok: false,
            error: "missing_required_fields",
          },
          400,
        );
      }

      if (
        productType !== "physical" &&
        productType !== "info" &&
        productType !== "ebook"
      ) {
        return json(
          {
            ok: false,
            error: "invalid_product_type",
          },
          400,
        );
      }

      if (
        slot !== "hero" &&
        slot !== "content" &&
        slot !== "offer" &&
        slot !== "bonus"
      ) {
        return json(
          {
            ok: false,
            error: "invalid_image_slot",
          },
          400,
        );
      }

      if (productDescription.length > 1200) {
        return json(
          {
            ok: false,
            error: "product_description_too_long",
          },
          400,
        );
      }

      if (visualInstructions.length > 600) {
        return json(
          {
            ok: false,
            error: "visual_instructions_too_long",
          },
          400,
        );
      }

      const result = await generatePageNovaImage({
        slot: slot as PageNovaImageSlot,
        productType:
          productType as PageNovaImageProductType,
        category,
        categoryLabel,
        productName,
        productDescription,
        accent,
        mockupPreference,
        visualInstructions,
      });

      if (!result.ok || !result.image) {
        return json(
          {
            ok: false,
            provider: result.provider,
            model: result.model,
            error:
              result.error ||
              "image_generation_failed",
          },
          502,
        );
      }

      return json({
        ok: true,
        provider: result.provider,
        model: result.model,
        image: result.image,
      });
    } catch (error) {
      console.error("[PageNova Image Engine]", error);

      return json(
        {
          ok: false,
          error: "image_generation_failed",
        },
        500,
      );
    }
  }

  if (path === "pagenova/image-plan") {
    const requestedCount =
      Number(body.requestedCount);

    if (
      !Number.isInteger(requestedCount) ||
      requestedCount < 0 ||
      requestedCount > 4
    ) {
      return json(
        {
          ok: false,
          error: "invalid_requested_count",
        },
        400,
      );
    }

    const slots =
      getPageNovaImageSlots(requestedCount);

    return json({
      ok: true,
      requestedCount,
      slots,
      creditsRequired: slots.length,
      generationEnabled:
        isPageNovaImageGenerationEnabled(),
    });
  }

  return json(
    {
      ok: false,
      error: "route_not_found",
    },
    404,
  );
}