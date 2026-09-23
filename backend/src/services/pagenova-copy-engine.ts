import { generateCopyWithAI } from "./pagenova-ai-provider";

export type PageNovaCopyRequest = {
  productType: "physical" | "info" | "ebook";
  category: string;
  categoryLabel: string;
  productName: string;
  productDescription: string;
  price: string;
  guaranteeDays: number;
};

export type PageNovaCopyResult = {
  source: "fallback";
  hero: {
    eyebrow: string;
    headline: string;
    subheadline: string;
    cta: string;
  };
  before: {
    eyebrow: string;
    headline: string;
    description: string;
    items: Array<{ title: string; description: string }>;
  };
  after: {
    eyebrow: string;
    headline: string;
    description: string;
    items: Array<{ title: string; description: string }>;
    cta: string;
  };
  included: {
    eyebrow: string;
    headline: string;
    description: string;
    items: Array<{ title: string; description: string; badge: string }>;
  };
  bonuses: {
    eyebrow: string;
    headline: string;
    description: string;
    items: Array<{ title: string; description: string; badge: string }>;
  };
  offer: {
    label: string;
    headline: string;
    description: string;
    items: string[];
    priceLabel: string;
    cta: string;
    secureNote: string;
  };
  guarantee: {
    eyebrow: string;
    headline: string;
    description: string;
  };
  faq: Array<{ question: string; answer: string }>;
  finalCta: {
    eyebrow: string;
    headline: string;
    description: string;
    cta: string;
    microcopy: string;
  };
};

function clean(value: string) {
  return String(value || "").trim();
}

export function buildInfoProductCopy(input: PageNovaCopyRequest): PageNovaCopyResult {
  const name = clean(input.productName);
  const productDescription = clean(input.productDescription);
  const category = clean(input.categoryLabel).toLowerCase();
  const days = Number(input.guaranteeDays || 7);

  return {
    source: "fallback",
    hero: {
      eyebrow: input.categoryLabel,
      headline: `Transforme conhecimento em resultado com ${name}`,
      subheadline: `${name} organiza o caminho para quem quer avanÃ§ar em ${category} com mais clareza, estrutura e aplicaÃ§Ã£o prÃ¡tica.`,
      cta: "QUERO GARANTIR MEU ACESSO",
    },
    before: {
      eyebrow: "ANTES",
      headline: "Chega de consumir informaÃ§Ã£o sem saber qual Ã© o prÃ³ximo passo.",
      description: "Sem uma sequÃªncia clara, conteÃºdo demais vira dÃºvida, dispersÃ£o e tentativa e erro.",
      items: [
        { title: "InformaÃ§Ã£o demais", description: "Muito conteÃºdo disponÃ­vel, mas pouca direÃ§Ã£o sobre o que realmente merece sua atenÃ§Ã£o." },
        { title: "Falta de clareza", description: "Dificuldade para transformar conhecimento em prioridades e aÃ§Ãµes executÃ¡veis." },
        { title: "Tentativa e erro", description: "Tempo perdido testando caminhos diferentes sem uma sequÃªncia clara para seguir." },
      ],
    },
    after: {
      eyebrow: "DEPOIS",
      headline: `Um caminho mais claro comeÃ§a com ${name}`,
      description: "Organize sua execuÃ§Ã£o, entenda o processo e avance etapa por etapa com uma direÃ§Ã£o mais clara.",
      items: [
        { title: "Clareza", description: "Saiba por onde comeÃ§ar e qual deve ser seu prÃ³ximo movimento." },
        { title: "Estrutura", description: "Siga uma sequÃªncia organizada em vez de depender de improviso." },
        { title: "AplicaÃ§Ã£o", description: "Transforme o que aprende em aÃ§Ãµes que vocÃª realmente consegue executar." },
      ],
      cta: "VER O QUE ESTÃ INCLUSO",
    },
    included: {
      eyebrow: "O QUE ESTÃ INCLUSO",
      headline: `O que vocÃª encontra dentro de ${name}`,
      description: "Uma experiÃªncia organizada para facilitar o aprendizado e transformar conteÃºdo em aplicaÃ§Ã£o.",
      items: [
        { title: "ConteÃºdo principal", description: `Acesso ao conteÃºdo central de ${name}, organizado para facilitar sua evoluÃ§Ã£o.`, badge: "CONTEÃšDO" },
        { title: "Material de apoio", description: "Recursos complementares para tornar a aplicaÃ§Ã£o mais simples e objetiva.", badge: "RECURSOS" },
        { title: "Acesso imediato", description: "Comece sua experiÃªncia assim que sua inscriÃ§Ã£o for confirmada.", badge: "ACESSO" },
      ],
    },
    bonuses: {
      eyebrow: "BÃ”NUS",
      headline: "VocÃª tambÃ©m recebe estes bÃ´nus",
      description: "Recursos extras para complementar sua experiÃªncia e facilitar sua execuÃ§Ã£o.",
      items: [
        { title: "Checklist de aplicaÃ§Ã£o", description: "Um roteiro rÃ¡pido para transformar o conteÃºdo em aÃ§Ã£o.", badge: "BÃ”NUS 01" },
        { title: "Material complementar", description: "Recursos adicionais para acelerar sua execuÃ§Ã£o.", badge: "BÃ”NUS 02" },
        { title: "Guia de prÃ³ximos passos", description: "Uma referÃªncia simples para continuar sua evoluÃ§Ã£o depois do conteÃºdo principal.", badge: "BÃ”NUS 03" },
      ],
    },
    offer: {
      label: "OFERTA ESPECIAL",
      headline: name,
      description: `${name} reÃºne conteÃºdo, materiais e recursos para ajudar vocÃª a avanÃ§ar em ${category} com mais estrutura.`,
      items: [
        "Acesso ao conteÃºdo principal",
        "Materiais complementares",
        "BÃ´nus inclusos",
        `Garantia de ${days} dias`,
      ],
      priceLabel: input.price,
      cta: "QUERO GARANTIR MEU ACESSO",
      secureNote: "Acesso liberado apÃ³s a confirmaÃ§Ã£o â€¢ Compra protegida",
    },
    guarantee: {
      eyebrow: "GARANTIA",
      headline: `VocÃª tem ${days} dias para conhecer o produto`,
      description: `Acesse ${name}, conheÃ§a o conteÃºdo e avalie sua experiÃªncia dentro do perÃ­odo de garantia informado na oferta.`,
    },
    faq: [
      { question: "Como recebo o acesso?", answer: "ApÃ³s a confirmaÃ§Ã£o da compra, vocÃª recebe as instruÃ§Ãµes para acessar o conteÃºdo." },
      { question: "Para quem Ã© este produto?", answer: `${name} foi estruturado para pessoas interessadas em ${category} que querem avanÃ§ar com mais organizaÃ§Ã£o e direÃ§Ã£o.` },
      { question: "Por quanto tempo tenho acesso?", answer: "O perÃ­odo de acesso deve seguir as condiÃ§Ãµes definidas na oferta do produto." },
      { question: "Como funciona a garantia?", answer: `A oferta informa uma garantia de ${days} dias. Consulte as condiÃ§Ãµes apresentadas no momento da compra.` },
    ],
    finalCta: {
      eyebrow: "COMECE AGORA",
      headline: "Seu prÃ³ximo passo pode comeÃ§ar agora.",
      description: `Tenha acesso a ${name} e comece a construir sua prÃ³xima evoluÃ§Ã£o com mais clareza e estrutura.`,
      cta: "QUERO GARANTIR MEU ACESSO",
      microcopy: "Acesso imediato â€¢ Ambiente seguro â€¢ Garantia incluÃ­da",
    },
  };
}

export function generatePageNovaCopy(input: PageNovaCopyRequest): PageNovaCopyResult {
  if (input.productType === "info") {
    return buildInfoProductCopy(input);
  }

  return buildInfoProductCopy(input);
}


export type PageNovaCopyGenerationResult = {
  source: "ai" | "fallback";
  provider: "none" | "openai" | "gemini";
  model: string | null;
  fallbackReason: string | null;
  copy: PageNovaCopyResult;
};

export async function generatePageNovaCopySmart(
  input: PageNovaCopyRequest,
): Promise<PageNovaCopyGenerationResult> {
  try {
    const ai = await generateCopyWithAI(input);

    if (ai.usedAI && ai.copy) {
      return {
        source: "ai",
        provider: ai.provider,
        model: ai.model,
        fallbackReason: null,
        copy: ai.copy,
      };
    }

    return {
      source: "fallback",
      provider: ai.provider,
      model: ai.model,
      fallbackReason: ai.error,
      copy: generatePageNovaCopy(input),
    };
  } catch (error) {
    return {
      source: "fallback",
      provider: "none",
      model: null,
      fallbackReason:
        error instanceof Error
          ? error.message
          : "unknown_ai_provider_error",
      copy: generatePageNovaCopy(input),
    };
  }
}

