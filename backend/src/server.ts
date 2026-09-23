import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { cloneLandingPage } from "./services/cloner-service";
import { generatePageNovaCopy } from "./services/pagenova-copy-engine";
import {
  generatePageNovaImage,
  getPageNovaImageSlots,
  isPageNovaImageConfigured,
  isPageNovaImageGenerationEnabled,
  type PageNovaImageProductType,
  type PageNovaImageSlot,
} from "./services/pagenova-image-provider";
import { generateCopyWithAI } from "./services/pagenova-ai-provider";

dotenv.config();

const app = express();
const PORT = Number(process.env.PORT || 8001);

app.disable("x-powered-by");

app.use(
  cors({
    origin: process.env.FRONTEND_URL || "http://localhost:8000",
    credentials: true,
  })
);

app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: true }));

app.get("/", (_req, res) => {
  res.json({
    name: "Giovane LP SaaS API",
    status: "online",
    port: PORT,
  });
});

app.get("/api/health", (_req, res) => {
  res.status(200).json({
    ok: true,
    service: "backend",
    product: "LP Cloner + LP Generator",
    timestamp: new Date().toISOString(),
  });
});



app.post("/api/pagenova/generate-copy", async (req, res) => {
  try {
    const productType =
      typeof req.body?.productType === "string"
        ? req.body.productType.trim()
        : "";

    const category =
      typeof req.body?.category === "string"
        ? req.body.category.trim()
        : "";

    const categoryLabel =
      typeof req.body?.categoryLabel === "string"
        ? req.body.categoryLabel.trim()
        : "";

    const productName =
      typeof req.body?.productName === "string"
        ? req.body.productName.trim()
        : "";

        const productDescription =
      typeof req.body?.productDescription === "string"
        ? req.body.productDescription.trim()
        : "";
const price =
      typeof req.body?.price === "string"
        ? req.body.price.trim()
        : "";

    const guaranteeDays = Number(req.body?.guaranteeDays);

    if (
      !productType ||
      !category ||
      !categoryLabel ||
      !productName ||
      !productDescription ||
      !price ||
      !Number.isFinite(guaranteeDays)
    ) {
      return res.status(400).json({
        ok: false,
        error: "missing_required_fields",
      });
    }

    if (
      productType !== "physical" &&
      productType !== "info" &&
      productType !== "ebook"
    ) {
      return res.status(400).json({
        ok: false,
        error: "invalid_product_type",
      });
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
      return res.json({
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

    return res.json({
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

    return res.status(500).json({
      ok: false,
      error: "copy_generation_failed",
    });
  }
});
app.post("/api/cloner/analyze", async (req, res) => {
  const rawUrl =
    typeof req.body?.url === "string"
      ? req.body.url.trim()
      : "";

  if (!rawUrl) {
    res.status(400).json({
      ok: false,
      error: "Informe a URL da landing page.",
      code: "URL_REQUIRED",
    });
    return;
  }

  try {
    const project = await cloneLandingPage(rawUrl);

    res.status(200).json({
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
        "A URL informada nÃ£o Ã© vÃ¡lida.",
      PROTOCOLO_NAO_PERMITIDO:
        "Use uma URL iniciando com http:// ou https://.",
      URL_COM_CREDENCIAIS_NAO_PERMITIDA:
        "URLs contendo usuÃ¡rio ou senha nÃ£o sÃ£o permitidas.",
      HOST_NAO_PERMITIDO:
        "Esse endereÃ§o nÃ£o pode ser processado.",
      HOST_NAO_ENCONTRADO:
        "NÃ£o foi possÃ­vel localizar esse domÃ­nio.",
      TIMEOUT:
        "A pÃ¡gina demorou demais para responder.",
      FALHA_AO_ACESSAR_URL:
        "NÃ£o foi possÃ­vel acessar a pÃ¡gina.",
      REDIRECT_LIMIT:
        "A pÃ¡gina possui redirecionamentos demais.",
      REDIRECT_INVALIDO:
        "A pÃ¡gina retornou um redirecionamento invÃ¡lido.",
      CONTEUDO_NAO_HTML:
        "O endereÃ§o informado nÃ£o retornou uma pÃ¡gina HTML.",
      PAGINA_MUITO_GRANDE:
        "A pÃ¡gina Ã© grande demais para este importador.",
    };

    const message =
      friendlyMessages[code] ||
      (code.startsWith("HTTP_")
        ? `A pÃ¡gina respondeu com erro ${code.replace(
            "HTTP_",
            ""
          )}.`
        : "NÃ£o foi possÃ­vel analisar essa pÃ¡gina.");

    res.status(422).json({
      ok: false,
      error: message,
      code,
    });
  }
});

// PAGENOVA_IMAGE_GENERATION_ROUTE
app.post(
  "/api/pagenova/generate-image",
  async (req, res) => {
    try {
      if (!isPageNovaImageGenerationEnabled()) {
        return res.status(503).json({
          ok: false,
          error: "image_generation_disabled",
        });
      }

      if (!isPageNovaImageConfigured()) {
        return res.status(503).json({
          ok: false,
          error: "image_provider_not_configured",
        });
      }

      const productType =
        typeof req.body?.productType === "string"
          ? req.body.productType.trim()
          : "";

      const category =
        typeof req.body?.category === "string"
          ? req.body.category.trim()
          : "";

      const categoryLabel =
        typeof req.body?.categoryLabel === "string"
          ? req.body.categoryLabel.trim()
          : "";

      const productName =
        typeof req.body?.productName === "string"
          ? req.body.productName.trim()
          : "";

      const productDescription =
        typeof req.body?.productDescription === "string"
          ? req.body.productDescription.trim()
          : "";

      const accent =
        typeof req.body?.accent === "string"
          ? req.body.accent.trim()
          : "";

      const mockupPreference =
        typeof req.body?.mockupPreference === "string"
          ? req.body.mockupPreference.trim()
          : "";

      const visualInstructions =
        typeof req.body?.visualInstructions === "string"
          ? req.body.visualInstructions.trim()
          : "";

      const slot =
        typeof req.body?.slot === "string"
          ? req.body.slot.trim()
          : "";

      if (
        !productType ||
        !category ||
        !categoryLabel ||
        !productName ||
        !productDescription ||
        !slot
      ) {
        return res.status(400).json({
          ok: false,
          error: "missing_required_fields",
        });
      }

      if (
        productType !== "physical" &&
        productType !== "info" &&
        productType !== "ebook"
      ) {
        return res.status(400).json({
          ok: false,
          error: "invalid_product_type",
        });
      }

      if (
        slot !== "hero" &&
        slot !== "content" &&
        slot !== "offer" &&
        slot !== "bonus"
      ) {
        return res.status(400).json({
          ok: false,
          error: "invalid_image_slot",
        });
      }

      if (productDescription.length > 1200) {
        return res.status(400).json({
          ok: false,
          error: "product_description_too_long",
        });
      }

      if (visualInstructions.length > 600) {
        return res.status(400).json({
          ok: false,
          error: "visual_instructions_too_long",
        });
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
        return res.status(502).json({
          ok: false,
          provider: result.provider,
          model: result.model,
          error:
            result.error ||
            "image_generation_failed",
        });
      }

      return res.json({
        ok: true,
        provider: result.provider,
        model: result.model,
        image: result.image,
      });
    } catch (error) {
      console.error(
        "[PageNova Image Engine]",
        error,
      );

      return res.status(500).json({
        ok: false,
        error: "image_generation_failed",
      });
    }
  },
);

// PAGENOVA_IMAGE_PLAN_ROUTE
app.post(
  "/api/pagenova/image-plan",
  (req, res) => {
    const requestedCount =
      Number(req.body?.requestedCount);

    if (
      !Number.isInteger(requestedCount) ||
      requestedCount < 0 ||
      requestedCount > 4
    ) {
      return res.status(400).json({
        ok: false,
        error: "invalid_requested_count",
      });
    }

    const slots =
      getPageNovaImageSlots(
        requestedCount,
      );

    return res.json({
      ok: true,
      requestedCount,
      slots,
      creditsRequired: slots.length,
      generationEnabled:
        isPageNovaImageGenerationEnabled(),
    });
  },
);
app.listen(PORT, () => {
  console.log("============================================================");
  console.log(" GIOVANE LP SAAS - BACKEND");
  console.log(` http://localhost:${PORT}`);
  console.log("============================================================");
});

