export type UniversalBusinessProfile = {
  name: string;
  description: string;
  category: string;
  audience: string;
  offer: string[];
  primaryGoal: UniversalSiteGoal;
  conversion: UniversalConversion;
  businessModel: UniversalBusinessModel;
  tone: UniversalTone;
};

export type UniversalSiteGoal =
  | "lead-generation"
  | "sales"
  | "booking"
  | "contact"
  | "authority"
  | "portfolio"
  | "information";

export type UniversalConversion =
  | "whatsapp"
  | "form"
  | "checkout"
  | "booking"
  | "phone"
  | "email"
  | "visit";

export type UniversalBusinessModel =
  | "local-service"
  | "professional-service"
  | "product"
  | "software"
  | "commerce"
  | "content"
  | "property"
  | "hospitality"
  | "generic";

export type UniversalTone =
  | "professional"
  | "premium"
  | "friendly"
  | "technical"
  | "bold"
  | "minimal";

export type UniversalSectionKind =
  | "hero"
  | "services"
  | "products"
  | "benefits"
  | "features"
  | "about"
  | "authority"
  | "process"
  | "portfolio"
  | "gallery"
  | "team"
  | "testimonials"
  | "pricing"
  | "faq"
  | "location"
  | "contact"
  | "final-cta";

export type UniversalSectionPlan = {
  kind: UniversalSectionKind;
  priority: number;
  purpose: string;
};

export type UniversalDesignDirection = {
  density: "compact" | "balanced" | "editorial";
  heroStyle: "split" | "centered" | "visual" | "product";
  cardStyle: "soft" | "bordered" | "elevated" | "minimal";
  defaultFont: "Poppins";
};

export type UniversalSiteStrategy = {
  profile: UniversalBusinessProfile;
  sections: UniversalSectionPlan[];
  design: UniversalDesignDirection;
};

const normalize = (value: string): string =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const containsAny = (text: string, values: string[]): boolean =>
  values.some((value) => text.includes(value));

function inferBusinessModel(text: string): UniversalBusinessModel {
  if (
    containsAny(text, [
      "saas",
      "software",
      "aplicativo",
      "app ",
      "plataforma",
      "sistema online",
      "automacao",
    ])
  ) {
    return "software";
  }

  if (
    containsAny(text, [
      "imobiliaria",
      "imovel",
      "imoveis",
      "corretor",
      "apartamento",
      "casa a venda",
    ])
  ) {
    return "property";
  }

  if (
    containsAny(text, [
      "hotel",
      "pousada",
      "resort",
      "hostel",
      "restaurante",
      "pizzaria",
      "cafeteria",
      "cafe ",
      "bar ",
    ])
  ) {
    return "hospitality";
  }

  if (
    containsAny(text, [
      "advogado",
      "advocacia",
      "contador",
      "contabilidade",
      "consultor",
      "consultoria",
      "arquiteto",
      "arquitetura",
      "psicologo",
      "psicologia",
      "terapeuta",
      "nutricionista",
      "medico",
      "clinica",
      "dentista",
      "odontologia",
    ])
  ) {
    return "professional-service";
  }

  if (
    containsAny(text, [
      "loja",
      "ecommerce",
      "e-commerce",
      "varejo",
      "catalogo",
      "produto fisico",
    ])
  ) {
    return "commerce";
  }

  if (
    containsAny(text, [
      "curso",
      "ebook",
      "e-book",
      "mentoria",
      "treinamento",
      "infoproduto",
    ])
  ) {
    return "content";
  }

  if (
    containsAny(text, [
      "produto",
      "equipamento",
      "dispositivo",
      "marca de",
    ])
  ) {
    return "product";
  }

  if (
    containsAny(text, [
      "lavanderia",
      "eletricista",
      "encanador",
      "limpeza",
      "manutencao",
      "oficina",
      "mecanica",
      "academia",
      "personal trainer",
      "estetica",
      "salao",
      "barbearia",
      "pet shop",
      "fotografo",
    ])
  ) {
    return "local-service";
  }

  return "generic";
}

function inferGoal(
  text: string,
  model: UniversalBusinessModel,
): UniversalSiteGoal {
  if (containsAny(text, ["agendar", "agendamento", "consulta", "reserva"])) {
    return "booking";
  }

  if (
    model === "commerce" ||
    model === "product" ||
    model === "content"
  ) {
    return "sales";
  }

  if (model === "software") {
    return "lead-generation";
  }

  if (
    model === "professional-service" ||
    model === "local-service" ||
    model === "property"
  ) {
    return "lead-generation";
  }

  return "contact";
}

function inferConversion(
  text: string,
  model: UniversalBusinessModel,
  goal: UniversalSiteGoal,
): UniversalConversion {
  if (containsAny(text, ["whatsapp", "zap"])) return "whatsapp";

  if (containsAny(text, ["agendar", "agendamento", "reserva"])) {
    return "booking";
  }

  if (goal === "sales") return "checkout";

  if (model === "local-service" || model === "professional-service") {
    return "whatsapp";
  }

  return "form";
}

function inferTone(text: string): UniversalTone {
  if (containsAny(text, ["luxo", "premium", "alto padrao", "exclusivo"])) {
    return "premium";
  }

  if (containsAny(text, ["tecnico", "engenharia", "industrial", "tecnologia"])) {
    return "technical";
  }

  if (containsAny(text, ["moderno", "ousado", "jovem", "energia"])) {
    return "bold";
  }

  if (containsAny(text, ["minimalista", "minimal", "clean"])) {
    return "minimal";
  }

  if (containsAny(text, ["acolhedor", "familia", "humanizado", "proximo"])) {
    return "friendly";
  }

  return "professional";
}

function uniqueSections(
  sections: UniversalSectionKind[],
): UniversalSectionKind[] {
  return [...new Set(sections)];
}

function buildSectionKinds(
  profile: UniversalBusinessProfile,
): UniversalSectionKind[] {
  const sections: UniversalSectionKind[] = ["hero"];

  switch (profile.businessModel) {
    case "software":
      sections.push(
        "benefits",
        "features",
        "process",
        "pricing",
        "testimonials",
        "faq",
      );
      break;

    case "property":
      sections.push(
        "features",
        "portfolio",
        "process",
        "authority",
        "testimonials",
        "faq",
      );
      break;

    case "professional-service":
      sections.push(
        "services",
        "authority",
        "about",
        "process",
        "testimonials",
        "faq",
      );
      break;

    case "local-service":
      sections.push(
        "services",
        "benefits",
        "process",
        "testimonials",
        "location",
        "faq",
      );
      break;

    case "hospitality":
      sections.push(
        "services",
        "gallery",
        "benefits",
        "location",
        "testimonials",
        "faq",
      );
      break;

    case "commerce":
      sections.push(
        "products",
        "benefits",
        "testimonials",
        "faq",
      );
      break;

    case "product":
      sections.push(
        "benefits",
        "features",
        "gallery",
        "testimonials",
        "faq",
      );
      break;

    case "content":
      sections.push(
        "benefits",
        "features",
        "about",
        "testimonials",
        "pricing",
        "faq",
      );
      break;

    default:
      sections.push(
        "services",
        "benefits",
        "about",
        "process",
        "faq",
      );
  }

  if (profile.primaryGoal === "portfolio") {
    sections.splice(2, 0, "portfolio");
  }

  if (profile.primaryGoal === "authority") {
    sections.splice(2, 0, "authority");
  }

  sections.push("final-cta", "contact");

  return uniqueSections(sections);
}

const SECTION_PURPOSE: Record<UniversalSectionKind, string> = {
  hero: "Explicar imediatamente o que o negócio oferece e qual é o próximo passo.",
  services: "Apresentar serviços reais de forma objetiva e comparável.",
  products: "Apresentar produtos ou categorias relevantes para compra.",
  benefits: "Traduzir a oferta em benefícios concretos para o visitante.",
  features: "Explicar recursos, capacidades ou características importantes.",
  about: "Apresentar identidade, contexto e forma de atuação sem repetir o hero.",
  authority: "Apresentar experiência, método ou credenciais somente quando fornecidos.",
  process: "Mostrar como contratação, atendimento ou uso funciona.",
  portfolio: "Demonstrar trabalhos, projetos ou itens reais quando disponíveis.",
  gallery: "Dar contexto visual ao produto, ambiente, serviço ou experiência.",
  team: "Apresentar pessoas reais quando os dados forem fornecidos.",
  testimonials: "Apresentar prova social real quando houver dados confirmados.",
  pricing: "Explicar planos ou preços somente quando forem informados.",
  faq: "Responder objeções e dúvidas úteis antes da conversão.",
  location: "Facilitar visita ou entendimento da área atendida quando aplicável.",
  contact: "Oferecer um caminho direto e claro para contato.",
  "final-cta": "Encerrar a página com uma ação principal coerente com o objetivo.",
};

function buildDesign(
  profile: UniversalBusinessProfile,
): UniversalDesignDirection {
  if (
    profile.businessModel === "software" ||
    profile.businessModel === "product"
  ) {
    return {
      density: "balanced",
      heroStyle: "product",
      cardStyle: "elevated",
      defaultFont: "Poppins",
    };
  }

  if (
    profile.tone === "premium" ||
    profile.businessModel === "professional-service"
  ) {
    return {
      density: "editorial",
      heroStyle: "split",
      cardStyle: "minimal",
      defaultFont: "Poppins",
    };
  }

  if (
    profile.businessModel === "hospitality" ||
    profile.businessModel === "property"
  ) {
    return {
      density: "editorial",
      heroStyle: "visual",
      cardStyle: "soft",
      defaultFont: "Poppins",
    };
  }

  return {
    density: "balanced",
    heroStyle: "split",
    cardStyle: "bordered",
    defaultFont: "Poppins",
  };
}

export function createUniversalBusinessProfile(input: {
  name: string;
  brief: string;
  category?: string;
  audience?: string;
  offer?: string | string[];
}): UniversalBusinessProfile {
  const name = input.name.trim();
  const description = input.brief.trim();
  const category = (input.category || "").trim();

  const offer = Array.isArray(input.offer)
    ? input.offer.map((value) => value.trim()).filter(Boolean)
    : (input.offer || "")
        .split(/\n|,|;/)
        .map((value) => value.trim())
        .filter(Boolean);

  const text = normalize(
    [name, description, category, input.audience || "", ...offer].join(" "),
  );

  const businessModel = inferBusinessModel(text);
  const primaryGoal = inferGoal(text, businessModel);
  const conversion = inferConversion(text, businessModel, primaryGoal);
  const tone = inferTone(text);

  return {
    name,
    description,
    category: category || "Negócio",
    audience: (input.audience || "").trim(),
    offer,
    primaryGoal,
    conversion,
    businessModel,
    tone,
  };
}

export function createUniversalSiteStrategy(
  profile: UniversalBusinessProfile,
): UniversalSiteStrategy {
  const kinds = buildSectionKinds(profile);

  return {
    profile,
    sections: kinds.map((kind, index) => ({
      kind,
      priority: index + 1,
      purpose: SECTION_PURPOSE[kind],
    })),
    design: buildDesign(profile),
  };
}

export function planUniversalSite(input: {
  name: string;
  brief: string;
  category?: string;
  audience?: string;
  offer?: string | string[];
}): UniversalSiteStrategy {
  return createUniversalSiteStrategy(
    createUniversalBusinessProfile(input),
  );
}