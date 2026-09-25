export type PageNovaGeneratedProject = {
  id: string;
  sourceUrl: string;
  finalUrl: string;
  domain: string;
  title: string;
  description: string;
  favicon: string | null;
  headings: string[];
  texts: string[];
  links: Array<{ text: string; href: string }>;
  images: Array<{ src: string; alt: string }>;
  sections: unknown[];
  visualHtml: string;
  visualBodyHtml: string;
  visualHeadHtml: string;
  fetchedAt: string;
};

export type PageNovaAICopy = {
  source?: string;

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
    items: Array<{
      title: string;
      description: string;
    }>;
  };

  after: {
    eyebrow: string;
    headline: string;
    description: string;
    items: Array<{
      title: string;
      description: string;
    }>;
    cta: string;
  };

  included: {
    eyebrow: string;
    headline: string;
    description: string;
    items: Array<{
      title: string;
      description: string;
      badge: string;
    }>;
  };

  bonuses: {
    eyebrow: string;
    headline: string;
    description: string;
    items: Array<{
      title: string;
      description: string;
      badge: string;
    }>;
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

  faq: Array<{
    question: string;
    answer: string;
  }>;

  finalCta: {
    eyebrow: string;
    headline: string;
    description: string;
    cta: string;
    microcopy: string;
  };
};
export type PageNovaImageSlot =
  | "hero"
  | "content"
  | "bonus"
  | "offer";

export type PageNovaGeneratedImage = {
  slot: PageNovaImageSlot;
  url: string;
  alt: string;
};

export type PageNovaImagePlan = {
  requestedCount: 0 | 1 | 2 | 3 | 4;
  images?: PageNovaGeneratedImage[];
};
type GeneratorInput = {
  aiCopy?: PageNovaAICopy;
  productName: string;
  description: string;
  audience: string;
  price: string;
  cta: string;
  guarantee: string;
  categoryId: string;
  categoryLabel: string;
  accent: string;
  imagePlan?: PageNovaImagePlan;
};

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function normalizePrice(value: string) {
  const trimmed = value.trim();

  if (!trimmed) {
    return "Consulte a oferta";
  }

  if (/^r\$/i.test(trimmed)) {
    return trimmed;
  }

  return `R$ ${trimmed}`;
}

function buildCopy(input: GeneratorInput) {
  const ai = input.aiCopy;

  const safe = (
    value: string | null | undefined,
    fallback = "",
  ) => escapeHtml(String(value || "").trim() || fallback);

  const name = safe(input.productName, "Infoproduto");
  const category = safe(input.categoryLabel, "Infoproduto");

  const fallbackDescription =
    "Um método prático para transformar conhecimento em execução com mais clareza, estrutura e direção.";

  const description = safe(
    ai?.offer?.description ||
      ai?.hero?.subheadline ||
      input.description,
    fallbackDescription,
  );

  const fallbackAudience =
    `pessoas que querem evoluir em ${input.categoryLabel || "seus resultados"}`;

  const audience = safe(
    ai?.before?.description ||
      input.audience,
    fallbackAudience,
  );

  const cta = safe(
    ai?.hero?.cta ||
      ai?.offer?.cta ||
      input.cta,
    "QUERO GARANTIR MEU ACESSO",
  );

  const price = safe(normalizePrice(input.price));
  const guarantee = safe(input.guarantee, "7");

  const headline = safe(
    ai?.hero?.headline,
    `Transforme conhecimento em resultado com ${input.productName}`,
  );

  const subheadline = safe(
    ai?.hero?.subheadline,
    `${input.description} Tenha uma estrutura objetiva para sair da informação solta e avançar com direção.`,
  );

  const beforeTitle = safe(
    ai?.before?.headline,
    "Chega de consumir informação sem saber qual é o próximo passo.",
  );

  const beforeText = safe(
    ai?.before?.description,
    "Quando falta estrutura, até quem está disposto a agir pode perder tempo entre excesso de conteúdo, prioridades confusas e tentativa e erro.",
  );

  const afterTitle = safe(
    ai?.after?.headline,
    `Um caminho mais claro começa com ${input.productName}`,
  );

  const afterText = safe(
    ai?.after?.description,
    "Organize sua execução, entenda o processo e avance etapa por etapa com uma direção muito mais clara.",
  );

  const includedTitle = safe(
    ai?.included?.headline,
    `O que você encontra dentro de ${input.productName}`,
  );

  const includedText = safe(
    ai?.included?.description,
    "Uma experiência organizada para facilitar o aprendizado e transformar conteúdo em aplicação.",
  );

  const finalTitle = safe(
    ai?.finalCta?.headline,
    "Seu próximo passo pode começar agora.",
  );

  const finalText = safe(
    ai?.finalCta?.description,
    `Tenha acesso a ${input.productName} e comece a construir sua próxima evolução com mais clareza e estrutura.`,
  );

  const finalCta = safe(
    ai?.finalCta?.cta,
    ai?.hero?.cta || input.cta || "QUERO GARANTIR MEU ACESSO",
  );

  return {
    name,
    category,
    description,
    audience,
    cta,
    price,
    guarantee,
    headline,
    subheadline,
    beforeTitle,
    beforeText,
    afterTitle,
    afterText,
    includedTitle,
    includedText,
    finalTitle,
    finalText,
    finalCta,
    ai,
  };
}
function sanitizePageNovaImageUrl(value: string): string {
  const url = value.trim();

  if (
    url.startsWith("https://") ||
    url.startsWith("http://") ||
    url.startsWith("data:image/")
  ) {
    return url;
  }

  return "";
}

function getPageNovaGeneratedImage(
  imagePlan: PageNovaImagePlan | undefined,
  slot: PageNovaImageSlot,
): PageNovaGeneratedImage | null {
  const image = imagePlan?.images?.find(
    (candidate) => candidate.slot === slot,
  );

  if (!image) {
    return null;
  }

  const safeUrl = sanitizePageNovaImageUrl(image.url);

  if (!safeUrl) {
    return null;
  }

  return {
    slot: image.slot,
    url: safeUrl,
    alt: image.alt.trim() || "Imagem gerada pela PageNova AI",
  };
}
export function generateInfoProductProject(
  input: GeneratorInput
): PageNovaGeneratedProject {
  const id =
    typeof crypto !== "undefined" && "randomUUID" in crypto
      ? crypto.randomUUID()
      : `generated-${Date.now()}`;

  const copy = buildCopy(input);

  const renderIncludedCards = () => {
    const fallbackItems = [
      {
        title: "Conteúdo principal",
        description:
          `Acesso ao conteúdo central de ${input.productName}, organizado para facilitar sua evolução.`,
        badge: "CONTEÚDO",
      },
      {
        title: "Material de apoio",
        description:
          "Recursos complementares para tornar a aplicação mais simples e objetiva.",
        badge: "RECURSOS",
      },
      {
        title: "Acesso imediato",
        description:
          "Comece sua experiência assim que sua inscrição for confirmada.",
        badge: "ACESSO",
      },
    ];

    const items =
      copy.ai?.included?.items?.length
        ? copy.ai.included.items
        : fallbackItems;

    return items
      .slice(0, 6)
      .map((item, index) => {
        const number = String(index + 1).padStart(2, "0");
        const title = escapeHtml(item.title || "Conteúdo");
        const description = escapeHtml(
          item.description || "Conteúdo incluído na sua compra.",
        );
        const badge = escapeHtml(item.badge || "INCLUSO");

        return `
        <div class="card included-card">
          <div class="number">${number}</div>

          <div class="iconbox">
            <svg viewBox="0 0 24 24">
              <path d="M4 5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 1-2-2z"/>
              <path d="M8 7h6M8 11h6"/>
            </svg>
          </div>

          <strong>${title}</strong>

          <div class="card-copy">
            ${description}
          </div>

          <span class="card-tag">
            ${badge}
          </span>
        </div>`;
      })
      .join("");
  };

  const renderBonusCards = () => {
    const fallbackItems = [
      {
        title: "Checklist de aplicação",
        description:
          "Um roteiro rápido para transformar o conteúdo em ação.",
        badge: "BÔNUS 01",
      },
      {
        title: "Material complementar",
        description:
          "Recursos adicionais para acelerar sua execução.",
        badge: "BÔNUS 02",
      },
      {
        title: "Guia de próximos passos",
        description:
          "Uma referência simples para continuar sua evolução depois do conteúdo principal.",
        badge: "BÔNUS 03",
      },
    ];

    const items =
      copy.ai?.bonuses?.items?.length
        ? copy.ai.bonuses.items
        : fallbackItems;

    return items
      .slice(0, 6)
      .map((item, index) => {
        const defaultBadge =
          `BÔNUS ${String(index + 1).padStart(2, "0")}`;

        const badge = escapeHtml(item.badge || defaultBadge);
        const title = escapeHtml(item.title || "Material complementar");
        const description = escapeHtml(
          item.description || "Material complementar incluído.",
        );

        return `
        <div class="card bonus-card">
          <div class="bonus-top">
            <span class="bonus-badge">
              ${badge}
            </span>
          </div>

          <div class="bonus-body">
            <div class="iconbox">
              <svg viewBox="0 0 24 24">
                <path d="M9 11l3 3L22 4"/>
                <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11"/>
              </svg>
            </div>

            <strong>
              ${title}
            </strong>

            <div class="card-copy">
              ${description}
            </div>
          </div>
        </div>`;
      })
      .join("");
  };

  const renderOfferItems = () => {
    const fallbackItems = [
      "Acesso ao conteúdo principal",
      "Materiais complementares",
      "Bônus inclusos",
      `Garantia de ${input.guarantee || "7"} dias`,
    ];

    const items =
      copy.ai?.offer?.items?.length
        ? copy.ai.offer.items
        : fallbackItems;

    return items
      .slice(0, 8)
      .map(
        (item) => `
            <div class="offer-item">
              <span class="offer-check">✓</span>
              ${escapeHtml(item)}
            </div>`,
      )
      .join("");
  };

  const renderFaqItems = () => {
    const fallbackItems = [
      {
        question: "Como recebo o acesso?",
        answer:
          "Após a confirmação da compra, você recebe as orientações de acesso ao produto.",
      },
      {
        question: "Para quem é este produto?",
        answer:
          `${input.productName} foi estruturado para ${input.audience}.`,
      },
      {
        question: "Por quanto tempo tenho acesso?",
        answer:
          "Consulte as condições da oferta. Esta informação também poderá ser personalizada diretamente no editor PageNova.",
      },
      {
        question: "Como funciona a garantia?",
        answer:
          `A oferta possui garantia de ${input.guarantee || "7"} dias, conforme as condições apresentadas na compra.`,
      },
    ];

    const items =
      copy.ai?.faq?.length
        ? copy.ai.faq
        : fallbackItems;

    return items
      .slice(0, 8)
      .map((item) => {
        const question = escapeHtml(item.question || "Dúvida frequente");
        const answer = escapeHtml(
          item.answer || "Consulte as informações apresentadas na oferta.",
        );

        return `
        <details>
          <summary>
            ${question}
          </summary>

          <p>
            ${answer}
          </p>
        </details>`;
      })
      .join("");
  };

  const includedCardsHtml = renderIncludedCards();
  const bonusCardsHtml = renderBonusCards();
  const offerItemsHtml = renderOfferItems();
  const faqItemsHtml = renderFaqItems();

  const bonusEyebrow = escapeHtml(
    copy.ai?.bonuses?.eyebrow || "BÔNUS",
  );

  const bonusHeadline = escapeHtml(
    copy.ai?.bonuses?.headline || "Você também recebe estes bônus",
  );

  const bonusDescription = escapeHtml(
    copy.ai?.bonuses?.description ||
      "Recursos extras para complementar sua experiência e facilitar sua execução.",
  );

  const offerLabel = escapeHtml(
    copy.ai?.offer?.label || "OFERTA ESPECIAL",
  );

  const offerHeadline = escapeHtml(
    copy.ai?.offer?.headline || input.productName,
  );

  const offerDescription = escapeHtml(
    copy.ai?.offer?.description || input.description,
  );

  const offerPriceLabel = escapeHtml(
    copy.ai?.offer?.priceLabel || "ACESSO POR",
  );

  const offerCta = escapeHtml(
    copy.ai?.offer?.cta || copy.cta,
  );

  const offerSecureNote = escapeHtml(
    copy.ai?.offer?.secureNote ||
      "Acesso liberado após a confirmação • Compra protegida",
  );

  const guaranteeEyebrow = escapeHtml(
    copy.ai?.guarantee?.eyebrow || "GARANTIA",
  );

  const guaranteeHeadline = escapeHtml(
    copy.ai?.guarantee?.headline ||
      `Você tem ${input.guarantee || "7"} dias para conhecer o produto`,
  );

  const guaranteeDescription = escapeHtml(
    copy.ai?.guarantee?.description ||
      `Acesse ${input.productName}, conheça o conteúdo e avalie sua experiência dentro do período de garantia informado na oferta.`,
  );

  const finalEyebrow = escapeHtml(
    copy.ai?.finalCta?.eyebrow || "COMECE AGORA",
  );

  const finalButton = escapeHtml(
    copy.ai?.finalCta?.cta || copy.finalCta || copy.cta,
  );

  const finalMicrocopy = escapeHtml(
    copy.ai?.finalCta?.microcopy ||
      "Acesso imediato • Ambiente seguro • Garantia incluída",
  );

  const accent = /^#[0-9a-fA-F]{6}$/.test(input.accent)
    ? input.accent
    : "#875DFF";
  // PAGENOVA_IMAGE_SLOT_PLAN
  const requestedImageCount = Math.max(
    0,
    Math.min(4, input.imagePlan?.requestedCount ?? 0),
  ) as 0 | 1 | 2 | 3 | 4;

  const heroGeneratedImage =
    requestedImageCount >= 1
      ? getPageNovaGeneratedImage(input.imagePlan, "hero")
      : null;

  const contentGeneratedImage =
    requestedImageCount >= 2
      ? getPageNovaGeneratedImage(input.imagePlan, "content")
      : null;

  const offerGeneratedImage =
    requestedImageCount >= 3
      ? getPageNovaGeneratedImage(input.imagePlan, "offer")
      : null;

  const bonusGeneratedImage =
    requestedImageCount >= 4
      ? getPageNovaGeneratedImage(input.imagePlan, "bonus")
      : null;


  // PAGENOVA_V7_8D_GENERATED_IMAGE_RENDER
  const renderGeneratedImage = (
    image: PageNovaGeneratedImage | null,
    className: string,
  ) => {
    if (!image) return "";

    const safeUrl = sanitizePageNovaImageUrl(image.url);

    if (!safeUrl) return "";

    return `<img class="${className}" src="${escapeHtml(safeUrl)}" alt="${escapeHtml(image.alt || copy.name)}" loading="lazy">`;
  };

  const heroImageHtml = renderGeneratedImage(
    heroGeneratedImage,
    "pn-generated-image pn-generated-image-hero",
  );

  const contentImageHtml = renderGeneratedImage(
    contentGeneratedImage,
    "pn-generated-image pn-generated-image-content",
  );

  const offerImageHtml = renderGeneratedImage(
    offerGeneratedImage,
    "pn-generated-image pn-generated-image-offer",
  );

  const bonusImageHtml = renderGeneratedImage(
    bonusGeneratedImage,
    "pn-generated-image pn-generated-image-bonus",
  );
  const head = `
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${copy.name}</title>

<style>
:root{
  --accent:${accent};
  --accent-soft:${accent}22;
  --accent-mid:${accent}55;
  --accent-border:${accent}75;
  --bg:#08080c;
  --surface:#111118;
  --surface-2:#15151e;
  --surface-3:#0d0d13;
  --muted:#aaa6b5;
  --muted-2:#777481;
  --text:#ffffff;
}

*{
  box-sizing:border-box;
}

html{
  scroll-behavior:smooth;
}

body{
  margin:0;
  background:var(--bg);
  color:var(--text);
  font-family:Inter,Arial,sans-serif;
  line-height:1.5;
  overflow-x:hidden;
}

a{
  color:inherit;
  text-decoration:none;
}

.wrap{
  width:min(1120px,calc(100% - 40px));
  margin:auto;
}

.topbar{
  position:relative;
  z-index:20;
  padding:11px 20px;
  text-align:center;
  background:var(--accent);
  color:#fff;
  font-size:13px;
  font-weight:900;
  letter-spacing:.035em;
}

.hero{
  position:relative;
  overflow:hidden;
  padding:94px 0 82px;
  text-align:center;
  background:
    radial-gradient(circle at 50% -10%,${accent}42,transparent 37%),
    radial-gradient(circle at 15% 40%,${accent}13,transparent 27%),
    #08080c;
}

.hero::before{
  content:"";
  position:absolute;
  inset:0;
  pointer-events:none;
  opacity:.3;
  background-image:
    linear-gradient(#ffffff06 1px,transparent 1px),
    linear-gradient(90deg,#ffffff06 1px,transparent 1px);
  background-size:54px 54px;
  mask-image:linear-gradient(to bottom,#000,transparent 82%);
}

.hero-glow{
  position:absolute;
  width:500px;
  height:500px;
  left:50%;
  top:-330px;
  transform:translateX(-50%);
  border-radius:50%;
  background:var(--accent);
  filter:blur(130px);
  opacity:.16;
  pointer-events:none;
}

.hero .wrap{
  position:relative;
  z-index:2;
}

.eyebrow{
  color:var(--accent);
  font-size:12px;
  font-weight:950;
  letter-spacing:.18em;
  text-transform:uppercase;
}

.pill{
  display:inline-flex;
  align-items:center;
  gap:8px;
  padding:8px 12px;
  border:1px solid var(--accent-border);
  border-radius:999px;
  background:var(--accent-soft);
  color:#e9e5f3;
  font-size:12px;
  font-weight:850;
}

.pill-dot{
  width:7px;
  height:7px;
  border-radius:50%;
  background:var(--accent);
  box-shadow:0 0 14px var(--accent);
}

h1{
  max-width:930px;
  margin:20px auto 22px;
  font-size:clamp(43px,7vw,78px);
  line-height:.98;
  letter-spacing:-.055em;
}

.lead{
  max-width:760px;
  margin:0 auto;
  color:#c6c2cf;
  font-size:19px;
  line-height:1.65;
}

.cta{
  display:inline-flex;
  align-items:center;
  justify-content:center;
  gap:10px;
  margin-top:30px;
  padding:18px 30px;
  border-radius:14px;
  background:var(--accent);
  color:#fff;
  font-weight:950;
  box-shadow:0 18px 55px var(--accent-soft);
  transition:
    transform .2s ease,
    box-shadow .2s ease;
}

.cta:hover{
  transform:translateY(-2px);
  box-shadow:0 24px 65px var(--accent-mid);
}

.hero-trust{
  display:flex;
  justify-content:center;
  flex-wrap:wrap;
  gap:10px;
  margin-top:18px;
}

.hero-trust span{
  display:inline-flex;
  align-items:center;
  gap:7px;
  padding:7px 10px;
  border:1px solid #ffffff10;
  border-radius:999px;
  background:#ffffff05;
  color:#96929f;
  font-size:11px;
  font-weight:750;
}

.hero-trust b{
  color:var(--accent);
}

.media{
  position:relative;
  display:flex;
  align-items:center;
  justify-content:center;
  max-width:880px;
  min-height:430px;
  margin:48px auto 0;
  overflow:hidden;
  border:1px solid #ffffff18;
  border-radius:30px;
  background:
    radial-gradient(circle at 50% 45%,var(--accent-soft),transparent 45%),
    linear-gradient(145deg,#15141e,#09090e);
  box-shadow:
    0 45px 110px #00000090,
    inset 0 1px 0 #ffffff08;
}

.media::before{
  content:"";
  position:absolute;
  inset:0;
  opacity:.4;
  background-image:
    linear-gradient(#ffffff06 1px,transparent 1px),
    linear-gradient(90deg,#ffffff06 1px,transparent 1px);
  background-size:40px 40px;
  mask-image:radial-gradient(circle,#000,transparent 72%);
}

.orbit{
  position:absolute;
  width:330px;
  height:330px;
  border:1px solid var(--accent-border);
  border-radius:50%;
  opacity:.35;
}

.orbit.small{
  width:260px;
  height:260px;
  opacity:.55;
}

.float-card{
  position:absolute;
  z-index:2;
  padding:11px 14px;
  border:1px solid #ffffff15;
  border-radius:13px;
  background:#101017dd;
  color:#c9c5d1;
  font-size:11px;
  font-weight:800;
  box-shadow:0 15px 40px #0008;
  backdrop-filter:blur(10px);
}

.float-one{
  left:10%;
  top:22%;
  transform:rotate(-5deg);
}

.float-two{
  right:9%;
  bottom:22%;
  transform:rotate(4deg);
}

.mock{
  position:relative;
  z-index:3;
  display:flex;
  align-items:center;
  justify-content:center;
  width:245px;
  min-height:315px;
  padding:34px 25px;
  border:1px solid #ffffff25;
  border-radius:19px;
  background:
    linear-gradient(145deg,${accent},#21172f 65%,#101017);
  box-shadow:
    25px 32px 80px #000c,
    0 0 80px var(--accent-soft);
  font-size:26px;
  font-weight:950;
  line-height:1.08;
  text-align:center;
  transform:
    perspective(900px)
    rotateY(-7deg)
    rotateX(3deg)
    rotateZ(-2deg);
}

.section{
  position:relative;
  overflow:hidden;
  padding:92px 0;
}

.section.alt{
  background:var(--surface-3);
}

.section h2{
  max-width:800px;
  margin:12px 0 18px;
  font-size:clamp(34px,5vw,54px);
  line-height:1.04;
  letter-spacing:-.045em;
}

.section p{
  max-width:760px;
  color:var(--muted);
  font-size:17px;
  line-height:1.7;
}

.center{
  text-align:center;
}

.center h2,
.center p{
  margin-left:auto;
  margin-right:auto;
}

.grid{
  display:grid;
  grid-template-columns:repeat(3,1fr);
  gap:18px;
  margin-top:40px;
}

.card{
  position:relative;
  min-height:210px;
  padding:27px;
  overflow:hidden;
  border:1px solid #ffffff13;
  border-radius:21px;
  background:
    linear-gradient(145deg,#14141c,#101016);
  transition:
    transform .25s ease,
    border-color .25s ease,
    box-shadow .25s ease;
}

.card::before{
  content:"";
  position:absolute;
  width:180px;
  height:180px;
  right:-100px;
  top:-100px;
  border-radius:50%;
  background:var(--accent);
  filter:blur(70px);
  opacity:.055;
}

.card:hover{
  transform:translateY(-4px);
  border-color:var(--accent-border);
  box-shadow:0 22px 55px #00000035;
}

.card strong{
  position:relative;
  z-index:2;
  display:block;
  margin-bottom:9px;
  font-size:18px;
}

.card-copy{
  position:relative;
  z-index:2;
  color:#918d9b;
  font-size:14px;
  line-height:1.65;
}

.iconbox{
  position:relative;
  z-index:2;
  display:flex;
  align-items:center;
  justify-content:center;
  width:47px;
  height:47px;
  margin-bottom:20px;
  border:1px solid var(--accent-border);
  border-radius:14px;
  background:var(--accent-soft);
  color:var(--accent);
}

.iconbox svg{
  width:23px;
  height:23px;
  fill:none;
  stroke:currentColor;
  stroke-width:1.8;
  stroke-linecap:round;
  stroke-linejoin:round;
}

.number{
  position:absolute;
  right:21px;
  top:18px;
  color:#ffffff0d;
  font-size:50px;
  font-weight:950;
  letter-spacing:-.08em;
}

.before-layout{
  display:grid;
  grid-template-columns:.82fr 1.18fr;
  gap:52px;
  align-items:center;
}

.before-copy p{
  max-width:480px;
}

.before-grid{
  display:grid;
  gap:13px;
}

.problem{
  position:relative;
  padding:20px 22px 20px 68px;
  border:1px solid #ffffff12;
  border-radius:18px;
  background:#111118;
}

.problem-num{
  position:absolute;
  left:20px;
  top:21px;
  display:flex;
  align-items:center;
  justify-content:center;
  width:30px;
  height:30px;
  border-radius:9px;
  background:var(--accent-soft);
  color:var(--accent);
  font-size:11px;
  font-weight:950;
}

.problem strong{
  display:block;
  margin-bottom:5px;
  font-size:16px;
}

.problem span{
  color:#898592;
  font-size:13px;
  line-height:1.55;
}

.after-layout{
  display:grid;
  grid-template-columns:1.05fr .95fr;
  gap:45px;
  align-items:center;
}

.benefit-list{
  display:grid;
  gap:12px;
  margin-top:30px;
}

.benefit{
  display:flex;
  gap:14px;
  align-items:flex-start;
  padding:16px;
  border:1px solid #ffffff10;
  border-radius:16px;
  background:#ffffff04;
}

.benefit-check{
  flex:0 0 auto;
  display:flex;
  align-items:center;
  justify-content:center;
  width:28px;
  height:28px;
  border-radius:9px;
  background:var(--accent-soft);
  color:var(--accent);
  font-weight:950;
}

.benefit strong{
  display:block;
  margin-bottom:3px;
}

.benefit span{
  color:#8f8b98;
  font-size:13px;
}

.after-visual{
  position:relative;
  min-height:390px;
  overflow:hidden;
  border:1px solid #ffffff12;
  border-radius:28px;
  background:
    radial-gradient(circle at center,var(--accent-soft),transparent 55%),
    #0a0a10;
}

.after-visual::before,
.after-visual::after{
  content:"";
  position:absolute;
  left:50%;
  top:50%;
  transform:translate(-50%,-50%);
  border:1px solid var(--accent-border);
  border-radius:50%;
}

.after-visual::before{
  width:235px;
  height:235px;
}

.after-visual::after{
  width:330px;
  height:330px;
  opacity:.4;
}

.after-core{
  position:absolute;
  z-index:2;
  left:50%;
  top:50%;
  transform:translate(-50%,-50%);
  display:flex;
  align-items:center;
  justify-content:center;
  width:125px;
  height:125px;
  padding:16px;
  border:1px solid #ffffff20;
  border-radius:31px;
  background:
    linear-gradient(145deg,var(--accent),#191320);
  box-shadow:
    0 30px 80px #000a,
    0 0 70px var(--accent-soft);
  font-weight:950;
  text-align:center;
}

.section-intro{
  max-width:780px;
  margin:auto;
  text-align:center;
}

.included-card{
  min-height:245px;
}

.card-tag{
  display:inline-flex;
  margin-top:18px;
  padding:6px 9px;
  border:1px solid #ffffff10;
  border-radius:999px;
  color:#76727f;
  background:#ffffff04;
  font-size:10px;
  font-weight:850;
  letter-spacing:.08em;
  text-transform:uppercase;
}

.bonus-card{
  padding:0;
  min-height:285px;
}

.bonus-top{
  position:relative;
  height:96px;
  padding:20px;
  overflow:hidden;
  border-bottom:1px solid #ffffff10;
  background:
    radial-gradient(circle at 85% 15%,var(--accent-mid),transparent 40%),
    linear-gradient(135deg,var(--accent-soft),transparent);
}

.bonus-top::before{
  content:"";
  position:absolute;
  width:90px;
  height:90px;
  right:22px;
  bottom:-50px;
  border:1px solid #ffffff17;
  border-radius:24px;
  background:#ffffff05;
  transform:rotate(15deg);
}

.bonus-badge{
  display:inline-flex;
  padding:6px 9px;
  border:1px solid var(--accent-border);
  border-radius:999px;
  background:#09090dcc;
  color:var(--accent);
  font-size:10px;
  font-weight:950;
  letter-spacing:.09em;
}

.bonus-body{
  padding:25px;
}

.bonus-body strong{
  font-size:18px;
}

.offer-shell{
  position:relative;
  max-width:760px;
  margin:auto;
}

.offer-glow{
  position:absolute;
  inset:10% 15%;
  background:var(--accent);
  filter:blur(120px);
  opacity:.14;
}

.offer{
  position:relative;
  z-index:2;
  overflow:hidden;
  padding:46px;
  border:1px solid var(--accent-border);
  border-radius:30px;
  background:
    radial-gradient(circle at 100% 0%,var(--accent-soft),transparent 37%),
    linear-gradient(145deg,#15151e,#0e0e14);
  text-align:center;
  box-shadow:
    0 35px 110px #00000080,
    inset 0 1px 0 #ffffff0a;
}

.offer-label{
  display:inline-flex;
  padding:7px 11px;
  border:1px solid var(--accent-border);
  border-radius:999px;
  background:var(--accent-soft);
  color:var(--accent);
  font-size:10px;
  font-weight:950;
  letter-spacing:.12em;
}

.offer h2{
  margin:15px auto 8px;
}

.offer-description{
  margin:auto!important;
}

.offer-list{
  display:grid;
  gap:10px;
  margin:28px 0;
  text-align:left;
}

.offer-item{
  display:flex;
  align-items:center;
  gap:11px;
  padding:14px 16px;
  border:1px solid #ffffff0d;
  border-radius:13px;
  background:#ffffff05;
  color:#d7d3dd;
  font-size:14px;
}

.offer-check{
  display:flex;
  align-items:center;
  justify-content:center;
  flex:0 0 auto;
  width:23px;
  height:23px;
  border-radius:7px;
  background:var(--accent-soft);
  color:var(--accent);
  font-size:12px;
  font-weight:950;
}

.price-label{
  margin-top:26px;
  color:#807c89;
  font-size:12px;
  font-weight:800;
  text-transform:uppercase;
  letter-spacing:.08em;
}

.price{
  margin:4px 0 0;
  font-size:52px;
  font-weight:950;
  letter-spacing:-.055em;
}

.offer .cta{
  width:100%;
  margin-top:23px;
}

.secure-note{
  margin-top:14px;
  color:#777481;
  font-size:11px;
}

.guarantee-card{
  display:grid;
  grid-template-columns:auto 1fr;
  gap:34px;
  align-items:center;
  max-width:850px;
  margin:auto;
  padding:40px;
  border:1px solid #ffffff13;
  border-radius:28px;
  background:
    radial-gradient(circle at 0% 50%,var(--accent-soft),transparent 35%),
    linear-gradient(145deg,#15151d,#101016);
}

.seal{
  display:flex;
  align-items:center;
  justify-content:center;
  width:126px;
  height:126px;
  border:2px solid var(--accent);
  border-radius:50%;
  color:var(--accent);
  font-size:31px;
  font-weight:950;
  line-height:.8;
  text-align:center;
  box-shadow:
    0 0 55px var(--accent-soft),
    inset 0 0 35px var(--accent-soft);
}

.seal span{
  font-size:10px;
  letter-spacing:.1em;
}

.guarantee-copy h2{
  margin:8px 0 12px;
  font-size:clamp(30px,4vw,44px);
}

.guarantee-copy p{
  margin:0;
}

.faq-head{
  display:grid;
  grid-template-columns:.8fr 1.2fr;
  gap:50px;
  align-items:start;
}

.faq-copy{
  position:sticky;
  top:25px;
}

.faq{
  display:grid;
  gap:12px;
}

.faq details{
  padding:20px;
  border:1px solid #ffffff12;
  border-radius:16px;
  background:#111118;
  transition:
    border-color .2s ease,
    background .2s ease;
}

.faq details:hover,
.faq details[open]{
  border-color:var(--accent-border);
  background:#15151d;
}

.faq summary{
  display:flex;
  align-items:center;
  justify-content:space-between;
  gap:15px;
  cursor:pointer;
  list-style:none;
  font-weight:850;
}

.faq summary::-webkit-details-marker{
  display:none;
}

.faq summary::after{
  content:"+";
  flex:0 0 auto;
  display:flex;
  align-items:center;
  justify-content:center;
  width:28px;
  height:28px;
  border-radius:8px;
  background:var(--accent-soft);
  color:var(--accent);
  font-size:20px;
}

.faq details[open] summary::after{
  content:"-";
}

.faq p{
  margin:13px 0 0;
  font-size:14px;
}

.final-section{
  padding:100px 0;
}

.final-box{
  position:relative;
  max-width:940px;
  margin:auto;
  padding:70px 40px;
  overflow:hidden;
  border:1px solid var(--accent-border);
  border-radius:32px;
  background:
    radial-gradient(circle at 50% 0%,var(--accent-soft),transparent 55%),
    #101016;
  text-align:center;
  box-shadow:0 35px 100px #00000060;
}

.final-box::before{
  content:"";
  position:absolute;
  width:450px;
  height:220px;
  left:50%;
  top:-160px;
  transform:translateX(-50%);
  background:var(--accent);
  filter:blur(100px);
  opacity:.17;
}

.final-box>*{
  position:relative;
  z-index:2;
}

.final-box h2{
  margin:16px auto;
}

.final-box p{
  margin:auto;
}

.microcopy{
  margin-top:13px!important;
  color:#777481!important;
  font-size:11px!important;
}

footer{
  padding:40px 20px;
  border-top:1px solid #ffffff0f;
  color:#706d79;
  text-align:center;
  font-size:12px;
}

@media(max-width:860px){
  .before-layout,
  .after-layout,
  .faq-head{
    grid-template-columns:1fr;
  }

  .faq-copy{
    position:static;
  }

  .after-visual{
    min-height:330px;
  }
}

@media(max-width:760px){
  .wrap{
    width:min(100% - 28px,1120px);
  }

  .hero{
    padding:68px 0 62px;
  }

  .media{
    min-height:320px;
  }

  .mock{
    width:190px;
    min-height:245px;
    font-size:21px;
  }

  .float-card{
    display:none;
  }

  .orbit{
    width:250px;
    height:250px;
  }

  .orbit.small{
    width:200px;
    height:200px;
  }

  .section{
    padding:68px 0;
  }

  .grid{
    grid-template-columns:1fr;
  }

  .card{
    min-height:auto;
  }

  .guarantee-card{
    grid-template-columns:1fr;
    padding:30px 24px;
    text-align:center;
  }

  .seal{
    margin:auto;
  }

  .offer{
    padding:31px 22px;
  }

  .final-section{
    padding:68px 0;
  }

  .final-box{
    padding:50px 23px;
  }
}

/* PAGENOVA_V7_6A_PREMIUM_VISUAL_POLISH */

/* ---------- HERO ---------- */

.hero{
  padding:112px 0 104px;
  background:
    radial-gradient(circle at 50% -15%,var(--accent-mid),transparent 34%),
    radial-gradient(circle at 18% 35%,var(--accent-soft),transparent 28%),
    radial-gradient(circle at 86% 58%,var(--accent-soft),transparent 27%),
    linear-gradient(180deg,#09090e 0%,#07070a 100%);
}

.hero::before{
  opacity:.42;
  background-size:62px 62px;
}

.hero-glow{
  width:720px;
  height:560px;
  top:-360px;
  filter:blur(145px);
  opacity:.23;
}

.hero h1{
  max-width:970px;
  margin-top:24px;
  font-size:clamp(46px,6.7vw,80px);
  line-height:.96;
  text-shadow:0 20px 65px #000a;
}

.hero .lead{
  max-width:790px;
  font-size:19px;
  color:#c9c6d1;
}

.pill{
  padding:9px 14px;
  border-color:var(--accent-border);
  background:
    linear-gradient(180deg,var(--accent-soft),#ffffff025);
  box-shadow:
    inset 0 1px 0 #ffffff12,
    0 12px 34px var(--accent-soft);
}

.cta{
  position:relative;
  overflow:hidden;
  min-height:58px;
  padding:18px 32px;
  border:1px solid #ffffff20;
  box-shadow:
    0 18px 50px var(--accent-mid),
    inset 0 1px 0 #ffffff38;
}

.cta::before{
  content:"";
  position:absolute;
  inset:0;
  transform:translateX(-120%);
  background:
    linear-gradient(
      105deg,
      transparent 20%,
      #ffffff28 48%,
      transparent 75%
    );
  transition:transform .55s ease;
}

.cta:hover{
  transform:translateY(-3px);
  box-shadow:
    0 26px 70px var(--accent-mid),
    inset 0 1px 0 #ffffff48;
}

.cta:hover::before{
  transform:translateX(120%);
}

.hero-trust{
  margin-top:22px;
}

.hero-trust span{
  padding:8px 12px;
  background:#ffffff055;
  box-shadow:inset 0 1px 0 #ffffff08;
}


/* ---------- PRODUCT STAGE ---------- */

.media{
  max-width:930px;
  min-height:465px;
  margin-top:62px;
  border-color:#ffffff20;
  border-radius:34px;
  background:
    radial-gradient(circle at 50% 43%,var(--accent-mid),transparent 28%),
    radial-gradient(circle at 50% 50%,var(--accent-soft),transparent 54%),
    linear-gradient(145deg,#171620,#08080d);
  box-shadow:
    0 55px 130px #000c,
    0 0 80px var(--accent-soft),
    inset 0 1px 0 #ffffff10;
}

.media::after{
  content:"";
  position:absolute;
  left:12%;
  right:12%;
  bottom:7%;
  height:70px;
  border-radius:50%;
  background:var(--accent);
  filter:blur(65px);
  opacity:.13;
}

.orbit{
  width:355px;
  height:355px;
  box-shadow:
    0 0 45px var(--accent-soft),
    inset 0 0 45px var(--accent-soft);
}

.orbit.small{
  width:270px;
  height:270px;
}

.float-card{
  border-color:#ffffff20;
  background:#0d0d13dc;
  box-shadow:
    0 20px 55px #000b,
    inset 0 1px 0 #ffffff0c;
}

.mock{
  width:255px;
  min-height:330px;
  border-color:var(--accent-border);
  background:
    radial-gradient(circle at 30% 10%,#ffffff1c,transparent 34%),
    linear-gradient(145deg,var(--accent),#241a31 58%,#0b0b10);
  box-shadow:
    28px 40px 90px #000d,
    0 0 95px var(--accent-mid),
    inset 0 1px 0 #ffffff22;
  transition:
    transform .35s ease,
    box-shadow .35s ease;
}

.mock:hover{
  transform:
    perspective(900px)
    rotateY(-2deg)
    rotateX(1deg)
    translateY(-7px);
  box-shadow:
    30px 48px 110px #000e,
    0 0 120px var(--accent-mid),
    inset 0 1px 0 #ffffff28;
}


/* ---------- SECTION RHYTHM ---------- */

.section{
  padding:108px 0;
}

.section.alt{
  border-top:1px solid #ffffff07;
  border-bottom:1px solid #ffffff07;
  background:
    radial-gradient(circle at 50% 0,var(--accent-soft),transparent 35%),
    linear-gradient(180deg,#101017,#0c0c12);
}

.section h2{
  letter-spacing:-.052em;
}

.section-intro{
  max-width:820px;
}

.section-intro p{
  line-height:1.75;
}


/* ---------- BEFORE ---------- */

.problem{
  overflow:hidden;
  border-color:#ffffff14;
  background:
    radial-gradient(circle at 100% 0,#ff64640b,transparent 42%),
    linear-gradient(145deg,#15151c,#0f0f15);
  box-shadow:
    0 16px 45px #0004,
    inset 0 1px 0 #ffffff08;
  transition:
    transform .22s ease,
    border-color .22s ease,
    box-shadow .22s ease;
}

.problem:hover{
  transform:translateX(5px);
  border-color:#ffffff24;
  box-shadow:
    0 22px 55px #0006,
    inset 0 1px 0 #ffffff0c;
}

.problem-num{
  border:1px solid var(--accent-border);
  box-shadow:0 8px 22px var(--accent-soft);
}


/* ---------- AFTER ---------- */

.benefit{
  border-color:#ffffff13;
  background:
    linear-gradient(145deg,#ffffff065,#ffffff025);
  box-shadow:
    inset 0 1px 0 #ffffff08,
    0 12px 35px #0003;
  transition:
    transform .22s ease,
    border-color .22s ease;
}

.benefit:hover{
  transform:translateX(5px);
  border-color:var(--accent-border);
}

.benefit-check{
  border:1px solid var(--accent-border);
  box-shadow:0 8px 24px var(--accent-soft);
}

.after-visual{
  border-color:#ffffff1a;
  background:
    radial-gradient(circle at center,var(--accent-mid),transparent 34%),
    radial-gradient(circle at center,var(--accent-soft),transparent 58%),
    #08080d;
  box-shadow:
    0 35px 90px #0008,
    inset 0 1px 0 #ffffff0b;
}

.after-core{
  width:135px;
  height:135px;
  border-color:var(--accent-border);
  box-shadow:
    0 35px 90px #000c,
    0 0 100px var(--accent-mid),
    inset 0 1px 0 #ffffff20;
}


/* ---------- GENERIC CARDS ---------- */

.card{
  min-height:225px;
  border-color:#ffffff15;
  background:
    radial-gradient(circle at 100% 0,var(--accent-soft),transparent 38%),
    linear-gradient(145deg,#16161f,#0e0e14);
  box-shadow:
    0 18px 50px #0004,
    inset 0 1px 0 #ffffff0b;
}

.card::before{
  width:230px;
  height:230px;
  right:-125px;
  top:-125px;
  opacity:.09;
}

.card:hover{
  transform:translateY(-7px);
  border-color:var(--accent-border);
  box-shadow:
    0 30px 75px #0008,
    0 0 35px var(--accent-soft),
    inset 0 1px 0 #ffffff10;
}

.iconbox{
  width:50px;
  height:50px;
  border-color:var(--accent-border);
  background:
    linear-gradient(145deg,var(--accent-soft),#ffffff025);
  box-shadow:
    0 12px 30px var(--accent-soft),
    inset 0 1px 0 #ffffff10;
}

.number{
  color:#ffffff0f;
  font-size:54px;
}

.card-tag{
  border-color:#ffffff15;
  background:#ffffff055;
}


/* ---------- INCLUDED ---------- */

.included-card{
  min-height:265px;
}

.included-card strong{
  font-size:19px;
  line-height:1.3;
}


/* ---------- BONUSES ---------- */

.bonus-card{
  min-height:310px;
  border-color:var(--accent-border);
  box-shadow:
    0 22px 60px #0005,
    0 0 28px var(--accent-soft),
    inset 0 1px 0 #ffffff0b;
}

.bonus-top{
  height:108px;
  background:
    radial-gradient(circle at 82% 5%,var(--accent-mid),transparent 38%),
    linear-gradient(135deg,var(--accent-soft),#ffffff018);
}

.bonus-top::after{
  content:"";
  position:absolute;
  left:0;
  right:0;
  bottom:0;
  height:1px;
  background:
    linear-gradient(
      90deg,
      transparent,
      var(--accent),
      transparent
    );
  opacity:.65;
}

.bonus-badge{
  box-shadow:0 10px 28px var(--accent-soft);
}

.bonus-body{
  padding:28px;
}


/* ---------- OFFER ---------- */

.offer-shell{
  max-width:800px;
}

.offer-glow{
  inset:5% 5%;
  filter:blur(135px);
  opacity:.25;
}

.offer{
  padding:54px;
  border-color:var(--accent-border);
  border-radius:34px;
  background:
    radial-gradient(circle at 50% -10%,var(--accent-mid),transparent 35%),
    radial-gradient(circle at 100% 0,var(--accent-soft),transparent 38%),
    linear-gradient(150deg,#181720,#0a0a0f 74%);
  box-shadow:
    0 50px 135px #000c,
    0 0 65px var(--accent-soft),
    inset 0 1px 0 #ffffff14;
}

.offer::before{
  content:"";
  position:absolute;
  left:12%;
  right:12%;
  top:0;
  height:1px;
  background:
    linear-gradient(
      90deg,
      transparent,
      var(--accent),
      transparent
    );
}

.offer-label{
  padding:8px 13px;
  box-shadow:
    0 10px 30px var(--accent-soft),
    inset 0 1px 0 #ffffff10;
}

.offer h2{
  max-width:680px;
  margin-top:20px;
  font-size:clamp(38px,5vw,57px);
}

.offer-description{
  max-width:620px!important;
  line-height:1.72!important;
}

.offer-list{
  gap:9px;
  margin:32px 0 28px;
  padding:12px;
  border:1px solid #ffffff0d;
  border-radius:20px;
  background:#00000025;
  box-shadow:inset 0 1px 0 #ffffff06;
}

.offer-item{
  min-height:52px;
  padding:14px 16px;
  border-color:#ffffff0b;
  background:#ffffff045;
}

.offer-check{
  width:25px;
  height:25px;
  border-radius:8px;
  border:1px solid var(--accent-border);
  box-shadow:0 7px 20px var(--accent-soft);
}

.price-label{
  margin-top:30px;
  letter-spacing:.14em;
}

.price{
  margin-top:7px;
  font-size:60px;
  text-shadow:0 0 50px var(--accent-mid);
}

.offer .cta{
  min-height:62px;
  font-size:16px;
}

.secure-note{
  margin-top:17px;
}


/* ---------- GUARANTEE ---------- */

.guarantee-card{
  max-width:900px;
  padding:46px;
  border-color:var(--accent-border);
  background:
    radial-gradient(circle at 0 50%,var(--accent-mid),transparent 27%),
    radial-gradient(circle at 100% 100%,var(--accent-soft),transparent 35%),
    linear-gradient(145deg,#17171f,#0d0d13);
  box-shadow:
    0 35px 90px #0008,
    0 0 45px var(--accent-soft),
    inset 0 1px 0 #ffffff0d;
}

.seal{
  width:138px;
  height:138px;
  border-width:2px;
  box-shadow:
    0 0 70px var(--accent-mid),
    inset 0 0 45px var(--accent-soft);
}


/* ---------- FAQ ---------- */

.faq details{
  padding:22px;
  border-color:#ffffff14;
  background:
    linear-gradient(145deg,#15151c,#0f0f15);
  box-shadow:
    0 13px 38px #0003,
    inset 0 1px 0 #ffffff07;
}

.faq details:hover{
  transform:translateX(4px);
  border-color:var(--accent-border);
}

.faq details[open]{
  border-color:var(--accent-border);
  background:
    radial-gradient(circle at 100% 0,var(--accent-soft),transparent 50%),
    #15151d;
}

.faq summary::after{
  border:1px solid var(--accent-border);
}


/* ---------- FINAL CTA ---------- */

.final-section{
  padding:120px 0;
}

.final-box{
  max-width:980px;
  padding:82px 48px;
  border-color:var(--accent-border);
  background:
    radial-gradient(circle at 50% -5%,var(--accent-mid),transparent 34%),
    radial-gradient(circle at 10% 100%,var(--accent-soft),transparent 32%),
    linear-gradient(145deg,#15151d,#09090e);
  box-shadow:
    0 50px 130px #000b,
    0 0 70px var(--accent-soft),
    inset 0 1px 0 #ffffff10;
}

.final-box::before{
  width:600px;
  height:300px;
  top:-230px;
  opacity:.24;
}

.final-box h2{
  max-width:780px;
  font-size:clamp(38px,5vw,58px);
}


/* ---------- RESPONSIVE ---------- */

@media(max-width:860px){
  .hero{
    padding:88px 0 80px;
  }

  .section{
    padding:86px 0;
  }

  .offer{
    padding:42px;
  }

  .guarantee-card{
    padding:36px;
  }
}

@media(max-width:760px){
  .hero{
    padding:72px 0 68px;
  }

  .hero h1{
    font-size:clamp(40px,13vw,58px);
  }

  .media{
    min-height:350px;
    margin-top:46px;
    border-radius:25px;
  }

  .mock{
    width:195px;
    min-height:255px;
  }

  .section{
    padding:72px 0;
  }

  .card{
    min-height:auto;
  }

  .included-card{
    min-height:auto;
  }

  .offer{
    padding:30px 20px;
    border-radius:25px;
  }

  .offer h2{
    font-size:36px;
  }

  .price{
    font-size:52px;
  }

  .guarantee-card{
    padding:30px 22px;
  }

  .seal{
    width:112px;
    height:112px;
  }

  .final-section{
    padding:78px 0;
  }

  .final-box{
    padding:58px 22px;
    border-radius:25px;
  }
}

/* PAGENOVA_V7_6B_PREMIUM_COMPOSITION */

/* ==========================================================
   GLOBAL COMPOSITION
   ========================================================== */

body{
  background:
    radial-gradient(circle at 50% -10%,var(--accent-soft),transparent 34%),
    #07070b;
}

.wrap{
  position:relative;
  isolation:isolate;
}

.section{
  position:relative;
  overflow:hidden;
}

.section::before{
  content:"";
  position:absolute;
  left:50%;
  top:0;
  width:min(1120px,82vw);
  height:1px;
  transform:translateX(-50%);
  background:
    linear-gradient(
      90deg,
      transparent,
      #ffffff10 20%,
      var(--accent-mid) 50%,
      #ffffff10 80%,
      transparent
    );
  opacity:.75;
}

.section::after{
  content:"";
  position:absolute;
  pointer-events:none;
  width:520px;
  height:520px;
  border-radius:50%;
  filter:blur(110px);
  background:var(--accent);
  opacity:.025;
  right:-260px;
  top:12%;
}

.section:nth-of-type(even)::after{
  right:auto;
  left:-280px;
}

.section-intro{
  position:relative;
  z-index:2;
  max-width:820px;
  margin-left:auto;
  margin-right:auto;
}

.eyebrow{
  letter-spacing:.16em;
  text-shadow:0 0 24px var(--accent-mid);
}


/* ==========================================================
   HERO — CINEMATIC DEPTH
   ========================================================== */

.hero{
  position:relative;
  min-height:760px;
  display:flex;
  align-items:center;
  isolation:isolate;
}

.hero::before{
  content:"";
  position:absolute;
  inset:0;
  pointer-events:none;
  background:
    radial-gradient(circle at 50% 32%,var(--accent-mid),transparent 24%),
    radial-gradient(circle at 50% 70%,var(--accent-soft),transparent 42%),
    linear-gradient(180deg,transparent 68%,#07070b 100%);
  opacity:.72;
  z-index:-2;
}

.hero::after{
  content:"";
  position:absolute;
  left:50%;
  bottom:3%;
  width:min(900px,80vw);
  height:220px;
  transform:translateX(-50%);
  pointer-events:none;
  background:radial-gradient(ellipse,var(--accent-soft),transparent 68%);
  filter:blur(22px);
  opacity:.7;
  z-index:-1;
}

.hero-glow{
  width:720px;
  height:720px;
  filter:blur(105px);
  opacity:.24;
}

.hero h1{
  max-width:1000px;
  margin-left:auto;
  margin-right:auto;
  letter-spacing:-.055em;
  line-height:.94;
  text-wrap:balance;
  text-shadow:0 14px 50px #000a;
}

.hero .lead{
  max-width:800px;
  margin-left:auto;
  margin-right:auto;
  line-height:1.72;
  text-wrap:balance;
}

.hero-trust{
  margin-top:24px;
}

.hero-trust > *{
  background:
    linear-gradient(180deg,#ffffff08,#ffffff025);
  border-color:#ffffff12;
  box-shadow:inset 0 1px 0 #ffffff0c;
}


/* ==========================================================
   MOCKUP / PRODUCT STAGE
   ========================================================== */

.media{
  position:relative;
  perspective:1400px;
}

.media::before{
  content:"";
  position:absolute;
  left:50%;
  top:50%;
  width:70%;
  height:70%;
  transform:translate(-50%,-50%);
  border-radius:50%;
  background:var(--accent);
  filter:blur(120px);
  opacity:.08;
  pointer-events:none;
}

.mock{
  position:relative;
  transform-style:preserve-3d;
  box-shadow:
    0 50px 110px #000c,
    0 0 80px var(--accent-soft),
    inset 0 1px 0 #ffffff16;
}

.mock::before{
  content:"";
  position:absolute;
  inset:-1px;
  border-radius:inherit;
  padding:1px;
  pointer-events:none;
  background:
    linear-gradient(
      135deg,
      #ffffff35,
      var(--accent-mid),
      transparent 45%,
      #ffffff10
    );
  -webkit-mask:
    linear-gradient(#000 0 0) content-box,
    linear-gradient(#000 0 0);
  -webkit-mask-composite:xor;
  mask-composite:exclude;
}

.mock::after{
  content:"";
  position:absolute;
  left:12%;
  right:12%;
  bottom:-42px;
  height:70px;
  border-radius:50%;
  background:var(--accent);
  filter:blur(38px);
  opacity:.12;
  z-index:-1;
}

.float-card{
  backdrop-filter:blur(18px);
  background:
    linear-gradient(145deg,#171720dd,#0c0c12dd);
  border:1px solid #ffffff14;
  box-shadow:
    0 22px 60px #000a,
    inset 0 1px 0 #ffffff12;
}


/* ==========================================================
   BEFORE — PAIN / CONTRAST
   ========================================================== */

.before-layout{
  position:relative;
}

.before-layout::before{
  content:"";
  position:absolute;
  left:-80px;
  top:10%;
  width:320px;
  height:320px;
  background:radial-gradient(circle,var(--accent-soft),transparent 68%);
  filter:blur(40px);
  opacity:.45;
  pointer-events:none;
}

.problem{
  position:relative;
  overflow:hidden;
  transition:
    transform .28s ease,
    border-color .28s ease,
    background .28s ease,
    box-shadow .28s ease;
}

.problem::after{
  content:"";
  position:absolute;
  width:130px;
  height:130px;
  right:-70px;
  bottom:-70px;
  border-radius:50%;
  background:var(--accent);
  filter:blur(48px);
  opacity:0;
  transition:opacity .3s ease;
}

.problem:hover{
  transform:translateX(6px);
  border-color:var(--accent-mid);
  background:
    linear-gradient(120deg,var(--accent-soft),#ffffff025);
  box-shadow:
    0 18px 50px #0006,
    inset 0 1px 0 #ffffff10;
}

.problem:hover::after{
  opacity:.10;
}

.problem-num{
  box-shadow:
    inset 0 1px 0 #ffffff14,
    0 8px 24px #0005;
}


/* ==========================================================
   AFTER — TRANSFORMATION
   ========================================================== */

.after-layout{
  position:relative;
  align-items:center;
}

.after-core{
  position:relative;
}

.benefit{
  position:relative;
  overflow:hidden;
  transition:
    transform .28s ease,
    border-color .28s ease,
    box-shadow .28s ease;
}

.benefit:hover{
  transform:translateX(5px);
  border-color:var(--accent-mid);
  box-shadow:
    0 18px 46px #0005,
    inset 0 1px 0 #ffffff10;
}

.benefit-check{
  box-shadow:
    0 0 28px var(--accent-soft),
    inset 0 1px 0 #ffffff16;
}

.after-visual{
  position:relative;
  overflow:hidden;
  box-shadow:
    0 40px 90px #0009,
    inset 0 1px 0 #ffffff12;
}

.after-visual::before{
  content:"";
  position:absolute;
  inset:12%;
  border-radius:50%;
  background:radial-gradient(circle,var(--accent-mid),transparent 65%);
  filter:blur(45px);
  opacity:.38;
}

.orbit{
  box-shadow:
    0 0 50px var(--accent-soft),
    inset 0 0 40px #0008;
}


/* ==========================================================
   INCLUDED — PREMIUM MODULE GRID
   ========================================================== */

.grid{
  position:relative;
}

.included-card{
  position:relative;
  overflow:hidden;
  min-height:250px;
  transition:
    transform .3s ease,
    border-color .3s ease,
    box-shadow .3s ease;
}

.included-card::before{
  content:"";
  position:absolute;
  left:0;
  right:0;
  top:0;
  height:2px;
  background:
    linear-gradient(
      90deg,
      transparent,
      var(--accent),
      transparent
    );
  opacity:.28;
  transition:opacity .3s ease;
}

.included-card::after{
  content:"";
  position:absolute;
  width:180px;
  height:180px;
  right:-100px;
  top:-100px;
  border-radius:50%;
  background:var(--accent);
  filter:blur(55px);
  opacity:.035;
  transition:opacity .3s ease;
}

.included-card:hover{
  transform:translateY(-8px);
  border-color:var(--accent-mid);
  box-shadow:
    0 30px 70px #0008,
    0 0 40px var(--accent-soft),
    inset 0 1px 0 #ffffff12;
}

.included-card:hover::before{
  opacity:.9;
}

.included-card:hover::after{
  opacity:.10;
}

.iconbox{
  position:relative;
  box-shadow:
    0 12px 28px #0005,
    0 0 24px var(--accent-soft),
    inset 0 1px 0 #ffffff18;
}

.number{
  opacity:.06;
  transform:scale(1.1);
}


/* ==========================================================
   BONUSES — DISTINCT PREMIUM LAYER
   ========================================================== */

.bonus-card{
  position:relative;
  overflow:hidden;
  transform:translateZ(0);
  transition:
    transform .32s ease,
    border-color .32s ease,
    box-shadow .32s ease;
}

.bonus-card::before{
  content:"";
  position:absolute;
  inset:0;
  pointer-events:none;
  background:
    linear-gradient(
      125deg,
      transparent 20%,
      var(--accent-soft) 52%,
      transparent 80%
    );
  opacity:.35;
}

.bonus-card:hover{
  transform:translateY(-10px);
  border-color:var(--accent-mid);
  box-shadow:
    0 34px 85px #000a,
    0 0 50px var(--accent-soft),
    inset 0 1px 0 #ffffff12;
}

.bonus-top{
  position:relative;
  overflow:hidden;
}

.bonus-top::before{
  content:"";
  position:absolute;
  width:220px;
  height:220px;
  left:50%;
  top:50%;
  transform:translate(-50%,-50%);
  border-radius:50%;
  border:1px solid var(--accent-mid);
  opacity:.18;
}

.bonus-top::after{
  content:"";
  position:absolute;
  inset:0;
  background:
    radial-gradient(circle at 50% 110%,var(--accent-mid),transparent 58%);
  opacity:.55;
}

.bonus-badge{
  position:relative;
  z-index:2;
  box-shadow:
    0 10px 30px #0006,
    0 0 24px var(--accent-soft);
}

.bonus-body{
  position:relative;
  z-index:2;
}


/* ==========================================================
   OFFER — MAIN CONVERSION FOCAL POINT
   ========================================================== */

.offer{
  position:relative;
  isolation:isolate;
}

.offer::before{
  content:"";
  position:absolute;
  left:50%;
  top:50%;
  width:min(1050px,92vw);
  height:720px;
  transform:translate(-50%,-50%);
  background:
    radial-gradient(circle,var(--accent-mid),transparent 64%);
  filter:blur(85px);
  opacity:.17;
  pointer-events:none;
  z-index:-1;
}

.offer::after{
  content:"";
  position:absolute;
  left:50%;
  top:50%;
  width:min(900px,88vw);
  height:1px;
  transform:translate(-50%,-50%);
  background:
    linear-gradient(
      90deg,
      transparent,
      var(--accent),
      transparent
    );
  opacity:.25;
  pointer-events:none;
}

.offer-shell{
  position:relative;
  overflow:hidden;
  border-color:var(--accent-mid);
  box-shadow:
    0 55px 130px #000d,
    0 0 90px var(--accent-soft),
    inset 0 1px 0 #ffffff18;
}

.offer-shell::before{
  content:"";
  position:absolute;
  inset:0;
  pointer-events:none;
  background:
    radial-gradient(circle at 50% 0%,var(--accent-soft),transparent 38%),
    linear-gradient(135deg,#ffffff04,transparent 40%);
}

.offer-shell::after{
  content:"";
  position:absolute;
  top:-180px;
  right:-180px;
  width:360px;
  height:360px;
  border-radius:50%;
  border:1px solid var(--accent-mid);
  opacity:.12;
}

.offer-glow{
  opacity:.34;
  filter:blur(80px);
}

.offer-label{
  position:relative;
  z-index:2;
  box-shadow:
    0 10px 28px #0006,
    0 0 28px var(--accent-soft);
}

.offer-description{
  position:relative;
  z-index:2;
}

.offer-list{
  position:relative;
  z-index:2;
}

.offer-item{
  transition:
    transform .24s ease,
    border-color .24s ease,
    background .24s ease;
}

.offer-item:hover{
  transform:translateX(5px);
  border-color:var(--accent-mid);
  background:var(--accent-soft);
}

.offer-check{
  box-shadow:
    0 0 22px var(--accent-soft),
    inset 0 1px 0 #ffffff18;
}

.price{
  position:relative;
  z-index:2;
  letter-spacing:-.06em;
  text-shadow:
    0 12px 35px #0009,
    0 0 35px var(--accent-soft);
}

.price-label{
  position:relative;
  z-index:2;
}

.secure-note{
  position:relative;
  z-index:2;
}


/* ==========================================================
   GUARANTEE — TRUST MOMENT
   ========================================================== */

.guarantee-card{
  position:relative;
  overflow:hidden;
  box-shadow:
    0 35px 90px #0009,
    inset 0 1px 0 #ffffff14;
}

.guarantee-card::before{
  content:"";
  position:absolute;
  left:-100px;
  top:50%;
  width:330px;
  height:330px;
  transform:translateY(-50%);
  border-radius:50%;
  background:
    radial-gradient(circle,var(--accent-mid),transparent 68%);
  filter:blur(45px);
  opacity:.22;
  pointer-events:none;
}

.guarantee-card::after{
  content:"";
  position:absolute;
  inset:0;
  pointer-events:none;
  background:
    linear-gradient(
      115deg,
      var(--accent-soft),
      transparent 32%,
      transparent 70%,
      #ffffff025
    );
}

.seal{
  position:relative;
  z-index:2;
  box-shadow:
    0 0 0 10px #ffffff018,
    0 0 0 11px var(--accent-soft),
    0 20px 60px #0008,
    0 0 55px var(--accent-soft),
    inset 0 0 35px var(--accent-soft);
}

.guarantee-copy{
  position:relative;
  z-index:2;
}


/* ==========================================================
   FAQ — CLEANER / MORE INTERACTIVE
   ========================================================== */

.faq{
  position:relative;
}

.faq details{
  position:relative;
  overflow:hidden;
  transition:
    border-color .25s ease,
    background .25s ease,
    transform .25s ease,
    box-shadow .25s ease;
}

.faq details::before{
  content:"";
  position:absolute;
  left:0;
  top:0;
  bottom:0;
  width:2px;
  background:var(--accent);
  transform:scaleY(0);
  transform-origin:center;
  transition:transform .25s ease;
}

.faq details:hover{
  transform:translateX(4px);
  border-color:#ffffff20;
}

.faq details[open]{
  border-color:var(--accent-mid);
  background:
    linear-gradient(120deg,var(--accent-soft),#ffffff025);
  box-shadow:
    0 18px 50px #0006,
    inset 0 1px 0 #ffffff10;
}

.faq details[open]::before{
  transform:scaleY(1);
}

.faq summary{
  transition:color .22s ease;
}

.faq details[open] summary{
  color:#fff;
}


/* ==========================================================
   FINAL CTA — PREMIUM CLOSING STAGE
   ========================================================== */

.final-section{
  position:relative;
  isolation:isolate;
}

.final-section::before{
  content:"";
  position:absolute;
  left:50%;
  top:50%;
  width:min(1050px,92vw);
  height:650px;
  transform:translate(-50%,-50%);
  background:
    radial-gradient(circle,var(--accent-mid),transparent 65%);
  filter:blur(95px);
  opacity:.15;
  pointer-events:none;
  z-index:-1;
}

.final-box{
  position:relative;
  overflow:hidden;
  isolation:isolate;
  box-shadow:
    0 50px 120px #000c,
    0 0 80px var(--accent-soft),
    inset 0 1px 0 #ffffff18;
}

.final-box::before{
  content:"";
  position:absolute;
  width:540px;
  height:540px;
  left:50%;
  top:-360px;
  transform:translateX(-50%);
  border-radius:50%;
  background:var(--accent);
  filter:blur(100px);
  opacity:.18;
  z-index:-1;
}

.final-box::after{
  content:"";
  position:absolute;
  inset:0;
  pointer-events:none;
  background:
    linear-gradient(
      135deg,
      #ffffff05,
      transparent 28%,
      transparent 72%,
      var(--accent-soft)
    );
  z-index:-1;
}

.final-box h2{
  max-width:900px;
  margin-left:auto;
  margin-right:auto;
  letter-spacing:-.045em;
  text-wrap:balance;
}

.final-box .lead{
  max-width:760px;
  margin-left:auto;
  margin-right:auto;
  text-wrap:balance;
}

.final-box .cta{
  min-width:min(430px,100%);
}


/* ==========================================================
   CTA SYSTEM
   ========================================================== */

.cta{
  position:relative;
  overflow:hidden;
  isolation:isolate;
}

.cta::after{
  content:"";
  position:absolute;
  width:60px;
  height:160px;
  top:50%;
  left:-100px;
  transform:translateY(-50%) rotate(22deg);
  background:#fff;
  filter:blur(22px);
  opacity:.14;
  transition:left .65s ease;
  pointer-events:none;
}

.cta:hover::after{
  left:calc(100% + 70px);
}


/* ==========================================================
   RESPONSIVE COMPOSITION
   ========================================================== */

@media(max-width:860px){

  .hero{
    min-height:auto;
  }

  .hero h1{
    letter-spacing:-.04em;
  }

  .included-card{
    min-height:0;
  }

  .section::after{
    opacity:.018;
  }

  .offer::before,
  .final-section::before{
    width:100vw;
  }

  .guarantee-card::before{
    left:-190px;
  }
}

@media(max-width:760px){

  .hero::after{
    width:100%;
  }

  .hero-glow{
    width:100vw;
    height:100vw;
  }

  .problem:hover,
  .benefit:hover,
  .offer-item:hover,
  .faq details:hover{
    transform:none;
  }

  .included-card:hover,
  .bonus-card:hover{
    transform:none;
  }

  .final-box .cta{
    min-width:0;
    width:100%;
  }
}

/* ============================================================
   PAGENOVA_V7_6C_ART_DIRECTION
   Premium art direction layer.
   CSS-only. Structure/copy/AI contracts remain untouched.
   ============================================================ */

/* ---------- GLOBAL VISUAL RHYTHM ---------- */

body{
  background:
    radial-gradient(circle at 50% -10%,var(--accent-soft),transparent 28%),
    #07080c;
}

.section{
  position:relative;
  isolation:isolate;
  overflow:hidden;
}

.section:nth-of-type(even){
  background:
    radial-gradient(
      circle at 88% 18%,
      var(--accent-soft),
      transparent 31%
    ),
    linear-gradient(
      180deg,
      #ffffff018,
      transparent 35%,
      #00000012
    );
}

.section:nth-of-type(odd){
  background:
    radial-gradient(
      circle at 8% 76%,
      var(--accent-soft),
      transparent 29%
    );
}

.section > .wrap{
  position:relative;
  z-index:2;
}

.section::after{
  content:"";
  position:absolute;
  width:420px;
  height:420px;
  border-radius:50%;
  pointer-events:none;
  opacity:.34;
  filter:blur(95px);
  background:var(--accent-soft);
  z-index:0;
}

.section:nth-of-type(even)::after{
  right:-260px;
  top:18%;
}

.section:nth-of-type(odd)::after{
  left:-300px;
  bottom:5%;
}

/* ---------- TYPOGRAPHY REFINEMENT ---------- */

.section h2,
.before-copy h2,
.after-core h2,
.faq-copy h2{
  letter-spacing:-.045em;
  text-wrap:balance;
}

.section-intro,
.before-copy p,
.after-core > p,
.faq-copy p{
  max-width:720px;
  line-height:1.72;
}

.eyebrow{
  letter-spacing:.18em;
  text-shadow:0 0 24px var(--accent-mid);
}

/* ---------- BEFORE / PROBLEM ART DIRECTION ---------- */

.before-layout{
  align-items:center;
  gap:clamp(52px,7vw,110px);
}

.before-copy{
  position:relative;
}

.before-copy::before{
  content:"";
  position:absolute;
  left:-34px;
  top:6px;
  width:2px;
  height:76px;
  border-radius:999px;
  background:
    linear-gradient(
      180deg,
      var(--accent),
      transparent
    );
  box-shadow:0 0 24px var(--accent-mid);
}

.before-copy h2{
  max-width:590px;
  font-size:clamp(44px,5.2vw,76px);
  line-height:.98;
}

.before-grid{
  position:relative;
  gap:16px;
}

.before-grid::before{
  content:"";
  position:absolute;
  left:27px;
  top:54px;
  bottom:54px;
  width:1px;
  background:
    linear-gradient(
      180deg,
      transparent,
      var(--accent-mid) 18%,
      var(--accent-mid) 82%,
      transparent
    );
  pointer-events:none;
}

.problem{
  position:relative;
  overflow:hidden;
  min-height:116px;
  padding:25px 28px 25px 68px;
  border-color:#ffffff12;
  background:
    linear-gradient(
      135deg,
      #ffffff055,
      transparent 62%
    ),
    #101117;
  box-shadow:
    inset 0 1px 0 #ffffff09,
    0 14px 40px #00000024;
}

.problem::after{
  content:"";
  position:absolute;
  width:160px;
  height:160px;
  right:-85px;
  top:-90px;
  border-radius:50%;
  background:var(--accent-soft);
  filter:blur(26px);
  opacity:.72;
  transition:
    opacity .35s ease,
    transform .35s ease;
}

.problem:hover::after{
  opacity:1;
  transform:scale(1.18);
}

.problem-num{
  position:absolute;
  left:20px;
  top:22px;
  z-index:2;
  box-shadow:0 0 24px var(--accent-soft);
}

.problem:nth-child(1)::before{
  content:"01";
}

.problem:nth-child(2)::before{
  content:"02";
}

.problem:nth-child(3)::before{
  content:"03";
}

.problem::before{
  position:absolute;
  right:17px;
  bottom:-20px;
  font-size:88px;
  line-height:1;
  font-weight:900;
  letter-spacing:-.08em;
  color:#ffffff028;
  pointer-events:none;
}

/* ---------- AFTER / TRANSFORMATION STAGE ---------- */

.after-layout{
  gap:clamp(48px,7vw,100px);
  align-items:center;
}

.after-core{
  position:relative;
}

.after-core h2{
  max-width:650px;
  font-size:clamp(43px,4.8vw,70px);
  line-height:1;
}

.benefit-list{
  gap:14px;
}

.benefit{
  position:relative;
  overflow:hidden;
  min-height:80px;
  border-color:#ffffff12;
  background:
    linear-gradient(
      105deg,
      var(--accent-soft),
      transparent 24%
    ),
    #101117;
  box-shadow:
    inset 0 1px 0 #ffffff08,
    0 12px 34px #0000001f;
}

.benefit::after{
  content:"";
  position:absolute;
  inset:0;
  pointer-events:none;
  opacity:0;
  background:
    linear-gradient(
      90deg,
      transparent,
      var(--accent-soft),
      transparent
    );
  transition:opacity .3s ease;
}

.benefit:hover::after{
  opacity:.7;
}

.after-visual{
  position:relative;
  min-height:420px;
  display:flex;
  align-items:center;
  justify-content:center;
}

.after-visual::before{
  content:"";
  position:absolute;
  width:76%;
  aspect-ratio:1;
  border-radius:50%;
  background:
    radial-gradient(
      circle,
      var(--accent-mid) 0%,
      var(--accent-soft) 28%,
      transparent 69%
    );
  filter:blur(18px);
  opacity:.65;
}

.after-visual::after{
  content:"";
  position:absolute;
  width:58%;
  aspect-ratio:1;
  border-radius:50%;
  border:1px dashed var(--accent-mid);
  opacity:.55;
  animation:pagenovaV76Orbit 24s linear infinite;
}

.after-visual .mock{
  z-index:3;
  transform:perspective(900px) rotateY(-8deg) rotateX(3deg);
  box-shadow:
    0 40px 90px #0009,
    0 0 70px var(--accent-soft),
    inset 0 1px 0 #ffffff26;
}

.after-visual .mock::after{
  content:"";
  position:absolute;
  width:54%;
  height:10px;
  left:23%;
  bottom:-30px;
  border-radius:50%;
  background:var(--accent);
  filter:blur(18px);
  opacity:.35;
}

/* ---------- INCLUDED / CONTENT GRID ---------- */

.included-card{
  min-height:270px;
  padding:30px 28px;
  background:
    radial-gradient(
      circle at 100% 0%,
      var(--accent-soft),
      transparent 38%
    ),
    linear-gradient(
      155deg,
      #171920,
      #0f1016
    );
}

.included-card .number,
.included-card > .number{
  font-size:54px;
  opacity:.08;
  transition:
    opacity .3s ease,
    transform .3s ease;
}

.included-card:hover .number{
  opacity:.16;
  transform:translateY(-4px);
}

.included-card:hover{
  transform:translateY(-7px);
  border-color:var(--accent-mid);
  box-shadow:
    0 28px 70px #0007,
    0 0 36px var(--accent-soft),
    inset 0 1px 0 #ffffff12;
}

/* ---------- BONUS PREMIUM CARDS ---------- */

.bonus-card{
  position:relative;
  isolation:isolate;
  min-height:330px;
  background:
    linear-gradient(
      155deg,
      #16181f,
      #0d0e13 68%
    );
}

.bonus-card::after{
  content:"";
  position:absolute;
  width:180px;
  height:180px;
  right:-65px;
  top:-70px;
  border-radius:50%;
  background:var(--accent-mid);
  filter:blur(60px);
  opacity:.24;
  z-index:-1;
  transition:
    opacity .35s ease,
    transform .35s ease;
}

.bonus-card:hover::after{
  opacity:.5;
  transform:scale(1.22);
}

.bonus-badge{
  box-shadow:
    0 0 22px var(--accent-soft),
    inset 0 1px 0 #ffffff1a;
}

/* ---------- OFFER AS PRIMARY CONVERSION FOCAL POINT ---------- */

.offer{
  position:relative;
  padding-top:clamp(90px,10vw,150px);
  padding-bottom:clamp(90px,10vw,150px);
}

.offer::after{
  content:"";
  position:absolute;
  width:min(900px,80vw);
  height:420px;
  left:50%;
  top:50%;
  transform:translate(-50%,-50%);
  border-radius:50%;
  background:
    radial-gradient(
      ellipse,
      var(--accent-mid),
      var(--accent-soft) 32%,
      transparent 70%
    );
  filter:blur(45px);
  opacity:.34;
  pointer-events:none;
}

.offer-shell{
  position:relative;
  z-index:2;
  overflow:hidden;
  border-color:var(--accent-mid);
  box-shadow:
    0 45px 120px #000a,
    0 0 75px var(--accent-soft),
    inset 0 1px 0 #ffffff1a;
}

.offer-shell::after{
  content:"";
  position:absolute;
  width:460px;
  height:460px;
  right:-250px;
  top:-240px;
  border-radius:50%;
  border:1px solid var(--accent-mid);
  box-shadow:
    0 0 80px var(--accent-soft),
    inset 0 0 80px var(--accent-soft);
  opacity:.6;
  pointer-events:none;
}

.price{
  position:relative;
  display:inline-block;
  text-shadow:
    0 0 35px var(--accent-soft),
    0 8px 30px #0008;
}

.price::after{
  content:"";
  position:absolute;
  height:8px;
  left:8%;
  right:8%;
  bottom:-10px;
  border-radius:50%;
  background:var(--accent);
  filter:blur(12px);
  opacity:.28;
}

/* ---------- GUARANTEE / TRUST MOMENT ---------- */

.guarantee-card{
  position:relative;
  overflow:hidden;
  min-height:310px;
  border-color:#ffffff18;
  background:
    radial-gradient(
      circle at 10% 50%,
      var(--accent-soft),
      transparent 34%
    ),
    linear-gradient(
      120deg,
      #14171b,
      #0f1016 65%
    );
  box-shadow:
    0 30px 80px #0006,
    inset 0 1px 0 #ffffff10;
}

.guarantee-card::after{
  content:"";
  position:absolute;
  width:320px;
  height:320px;
  left:-100px;
  top:50%;
  transform:translateY(-50%);
  border-radius:50%;
  border:1px solid var(--accent-mid);
  box-shadow:
    inset 0 0 70px var(--accent-soft),
    0 0 70px var(--accent-soft);
  opacity:.42;
  pointer-events:none;
}

.seal{
  position:relative;
  z-index:2;
  transform:scale(1.08);
  background:
    radial-gradient(
      circle at 35% 30%,
      var(--accent-soft),
      transparent 56%
    ),
    #111319;
  box-shadow:
    0 0 0 9px #ffffff018,
    0 0 55px var(--accent-soft),
    inset 0 1px 0 #ffffff20;
}

.guarantee-copy{
  position:relative;
  z-index:2;
}

/* ---------- FAQ ---------- */

.faq{
  position:relative;
}

.faq details{
  overflow:hidden;
  transition:
    transform .25s ease,
    border-color .25s ease,
    background .25s ease,
    box-shadow .25s ease;
}

.faq details:hover{
  transform:translateX(5px);
  border-color:var(--accent-mid);
}

.faq details[open]{
  background:
    linear-gradient(
      110deg,
      var(--accent-soft),
      transparent 30%
    ),
    #111219;
  box-shadow:
    0 18px 50px #0004,
    inset 0 1px 0 #ffffff0d;
}

/* ---------- FINAL CTA / GRAND FINALE ---------- */

.final-section{
  position:relative;
  overflow:hidden;
  padding-top:clamp(110px,12vw,180px);
  padding-bottom:clamp(110px,12vw,180px);
  background:
    radial-gradient(
      ellipse at 50% 55%,
      var(--accent-soft),
      transparent 46%
    ),
    linear-gradient(
      180deg,
      #08090d,
      #0b0d12
    );
}

.final-section::after{
  content:"";
  position:absolute;
  inset:0;
  pointer-events:none;
  background:
    linear-gradient(#ffffff025 1px,transparent 1px),
    linear-gradient(90deg,#ffffff025 1px,transparent 1px);
  background-size:54px 54px;
  mask-image:
    radial-gradient(
      ellipse at center,
      #000,
      transparent 72%
    );
  opacity:.5;
}

.final-box{
  position:relative;
  z-index:2;
  overflow:hidden;
  padding:
    clamp(62px,7vw,105px)
    clamp(28px,8vw,120px);
  border-color:var(--accent-mid);
  background:
    radial-gradient(
      circle at 50% -20%,
      var(--accent-mid),
      transparent 42%
    ),
    linear-gradient(
      145deg,
      #151820,
      #0d0f15 68%
    );
  box-shadow:
    0 45px 120px #0009,
    0 0 85px var(--accent-soft),
    inset 0 1px 0 #ffffff18;
}

.final-box::before{
  content:"";
  position:absolute;
  width:520px;
  height:520px;
  left:50%;
  top:-390px;
  transform:translateX(-50%);
  border-radius:50%;
  border:1px solid var(--accent-mid);
  box-shadow:
    0 0 80px var(--accent-soft),
    inset 0 0 80px var(--accent-soft);
  opacity:.58;
  pointer-events:none;
}

.final-box h2{
  position:relative;
  z-index:2;
  max-width:900px;
  margin-left:auto;
  margin-right:auto;
  font-size:clamp(43px,5.2vw,76px);
  line-height:.98;
  letter-spacing:-.05em;
  text-wrap:balance;
}

.final-box .lead{
  position:relative;
  z-index:2;
  max-width:760px;
  margin-left:auto;
  margin-right:auto;
}

.final-box .cta{
  position:relative;
  z-index:2;
  min-width:min(390px,100%);
  margin-top:14px;
  box-shadow:
    0 24px 65px var(--accent-mid),
    0 0 35px var(--accent-soft),
    inset 0 1px 0 #ffffff45;
}

/* ---------- CTA PREMIUM LIGHT SWEEP ---------- */

.cta{
  isolation:isolate;
}

.cta::after{
  content:"";
  position:absolute;
  width:42px;
  height:180%;
  top:-40%;
  left:-90px;
  transform:rotate(18deg);
  background:#ffffff42;
  filter:blur(8px);
  opacity:0;
  transition:
    left .7s ease,
    opacity .2s ease;
  pointer-events:none;
}

.cta:hover::after{
  left:calc(100% + 70px);
  opacity:.8;
}

/* ---------- MICRO INTERACTIONS ---------- */

@keyframes pagenovaV76Orbit{
  from{
    transform:rotate(0deg);
  }
  to{
    transform:rotate(360deg);
  }
}

@media(max-width:860px){

  .before-copy::before{
    display:none;
  }

  .before-copy h2,
  .after-core h2{
    font-size:clamp(39px,9vw,58px);
  }

  .before-grid::before{
    display:none;
  }

  .problem{
    padding-left:24px;
  }

  .problem-num{
    position:relative;
    left:auto;
    top:auto;
  }

  .after-visual{
    min-height:340px;
  }

  .guarantee-card::after{
    opacity:.22;
  }

  .final-box h2{
    font-size:clamp(38px,9vw,58px);
  }
}

@media(max-width:600px){

  .section::after{
    opacity:.2;
  }

  .problem::before{
    font-size:68px;
  }

  .included-card{
    min-height:auto;
  }

  .bonus-card{
    min-height:auto;
  }

  .guarantee-card{
    min-height:auto;
  }

  .seal{
    transform:none;
  }

  .final-section{
    padding-top:88px;
    padding-bottom:88px;
  }

  .final-box{
    padding:58px 22px;
  }

  .final-box .cta{
    min-width:0;
    width:100%;
  }
}

/* ============================================================
   PAGENOVA_V7_6D_MOTION_3D
   Motion + depth system
   ============================================================ */

html{
  scroll-behavior:smooth;
}

body{
  overflow-x:hidden;
}

/* ------------------------------------------------------------
   GLOBAL DEPTH
   ------------------------------------------------------------ */

.hero,
.section,
.offer,
.final-section{
  position:relative;
  isolation:isolate;
}

.hero{
  perspective:1200px;
}

.hero::after{
  content:"";
  position:absolute;
  left:50%;
  top:8%;
  width:min(820px,72vw);
  height:min(520px,48vw);
  transform:translateX(-50%);
  pointer-events:none;
  z-index:-1;
  opacity:.52;
  background:
    radial-gradient(
      ellipse at center,
      var(--accent-soft) 0%,
      transparent 68%
    );
  filter:blur(42px);
  animation:pagenovaHeroAura 8s ease-in-out infinite;
}

/* ------------------------------------------------------------
   HERO MOCKUP 3D
   ------------------------------------------------------------ */

.mock{
  transform-style:preserve-3d;
  perspective:1000px;
}

.mock > *{
  transform-style:preserve-3d;
}

.mock::before{
  animation:
    pagenovaMockFloat 7s ease-in-out infinite,
    pagenovaMockGlow 5s ease-in-out infinite;
}

.mock::after{
  content:"";
  position:absolute;
  left:22%;
  right:22%;
  bottom:7%;
  height:8%;
  border-radius:999px;
  pointer-events:none;
  background:var(--accent-mid);
  filter:blur(28px);
  opacity:.28;
  transform:translateZ(-50px);
  animation:pagenovaGroundShadow 7s ease-in-out infinite;
}

.orbit{
  will-change:transform;
}

.orbit:nth-of-type(1){
  animation:pagenovaOrbit 22s linear infinite;
}

.orbit:nth-of-type(2){
  animation:pagenovaOrbitReverse 31s linear infinite;
}

.float-card{
  will-change:transform;
}

.float-one{
  animation:pagenovaFloatOne 6.4s ease-in-out infinite;
}

.float-two{
  animation:pagenovaFloatTwo 7.8s ease-in-out infinite;
}

/* ------------------------------------------------------------
   AMBIENT PARTICLES
   ------------------------------------------------------------ */

.hero-glow{
  animation:pagenovaAmbientGlow 7s ease-in-out infinite;
}

.hero-glow::before,
.hero-glow::after{
  content:"";
  position:absolute;
  width:7px;
  height:7px;
  border-radius:50%;
  background:var(--accent);
  box-shadow:
    72px 48px 0 -2px var(--accent),
    -96px 104px 0 -2px var(--accent),
    154px 132px 0 -3px var(--accent),
    -184px 28px 0 -3px var(--accent);
  opacity:.32;
  animation:pagenovaParticleDrift 11s ease-in-out infinite;
}

.hero-glow::before{
  left:28%;
  top:24%;
}

.hero-glow::after{
  right:27%;
  bottom:20%;
  animation-delay:-5s;
}

/* ------------------------------------------------------------
   BEFORE CARDS
   ------------------------------------------------------------ */

.problem{
  position:relative;
  overflow:hidden;
  transform-style:preserve-3d;
  will-change:transform;
}

.problem::after{
  content:"";
  position:absolute;
  width:150px;
  height:150px;
  right:-65px;
  top:-70px;
  border-radius:50%;
  background:radial-gradient(circle,var(--accent-soft),transparent 68%);
  opacity:0;
  transform:scale(.65);
  transition:
    opacity .35s ease,
    transform .55s cubic-bezier(.2,.8,.2,1);
  pointer-events:none;
}

.problem:hover{
  transform:
    perspective(900px)
    translateY(-6px)
    rotateX(1.4deg)
    rotateY(-1.2deg);
}

.problem:hover::after{
  opacity:.8;
  transform:scale(1);
}

.problem-num{
  position:relative;
  z-index:2;
  box-shadow:0 8px 24px var(--accent-soft);
}

/* ------------------------------------------------------------
   AFTER / PRODUCT OBJECT
   ------------------------------------------------------------ */

.after-visual{
  perspective:1100px;
  transform-style:preserve-3d;
}

.after-visual .mock,
.after-visual .media{
  transform-style:preserve-3d;
}

.after-visual .mock{
  animation:pagenovaProductFloat 7.5s ease-in-out infinite;
}

.after-visual .orbit:nth-child(1){
  animation-duration:26s;
}

.after-visual .orbit:nth-child(2){
  animation-duration:38s;
}

/* ------------------------------------------------------------
   INCLUDED CARDS
   ------------------------------------------------------------ */

.included-card{
  transform-style:preserve-3d;
  will-change:transform;
}

.included-card::before{
  transition:
    opacity .35s ease,
    transform .5s ease;
}

.included-card:hover{
  transform:
    perspective(900px)
    translateY(-7px)
    rotateX(1.2deg);
  box-shadow:
    0 28px 65px #00000038,
    0 0 38px var(--accent-soft),
    inset 0 1px 0 #ffffff12;
}

.included-card:hover::before{
  opacity:1;
  transform:translate3d(0,-3px,0);
}

.included-card .iconbox{
  transition:
    transform .35s cubic-bezier(.2,.8,.2,1),
    box-shadow .35s ease;
}

.included-card:hover .iconbox{
  transform:translateZ(24px) rotate(-4deg) scale(1.06);
  box-shadow:0 12px 28px var(--accent-soft);
}

/* ------------------------------------------------------------
   BONUS ASSET CARDS
   ------------------------------------------------------------ */

.bonus-card{
  transform-style:preserve-3d;
  will-change:transform;
}

.bonus-card:hover{
  transform:
    perspective(1000px)
    translateY(-7px)
    rotateX(1.5deg);
  box-shadow:
    0 30px 70px #00000042,
    0 0 42px var(--accent-soft);
}

.bonus-top{
  position:relative;
  overflow:hidden;
}

.bonus-top::after{
  content:"";
  position:absolute;
  width:94px;
  height:118px;
  right:34px;
  bottom:-58px;
  border:1px solid var(--accent);
  border-radius:16px;
  background:
    linear-gradient(145deg,var(--accent-soft),#ffffff06);
  box-shadow:
    -18px -12px 0 -5px #ffffff05,
    0 20px 35px #00000035;
  transform:
    perspective(500px)
    rotate(-9deg)
    skewY(2deg);
  opacity:.42;
  transition:
    transform .5s cubic-bezier(.2,.8,.2,1),
    opacity .35s ease;
}

.bonus-card:hover .bonus-top::after{
  opacity:.72;
  transform:
    perspective(500px)
    translateY(-7px)
    rotate(-4deg)
    skewY(1deg);
}

/* ------------------------------------------------------------
   OFFER FOCAL ENERGY
   ------------------------------------------------------------ */

.offer{
  overflow:hidden;
}

.offer::after{
  content:"";
  position:absolute;
  width:720px;
  height:720px;
  left:50%;
  top:48%;
  transform:translate(-50%,-50%);
  border-radius:50%;
  background:
    radial-gradient(
      circle,
      var(--accent-soft) 0%,
      transparent 68%
    );
  filter:blur(24px);
  opacity:.58;
  z-index:-1;
  pointer-events:none;
  animation:pagenovaOfferAura 8s ease-in-out infinite;
}

.offer-shell{
  transform-style:preserve-3d;
  perspective:1200px;
}

.offer-shell::before{
  animation:pagenovaOfferBorder 6s ease-in-out infinite;
}

.offer-item{
  transition:
    transform .3s ease,
    border-color .3s ease,
    background .3s ease;
}

.offer-item:hover{
  transform:translateX(5px);
  border-color:var(--accent-mid);
  background:var(--accent-soft);
}

.price{
  position:relative;
  text-shadow:0 12px 44px var(--accent-soft);
}

/* ------------------------------------------------------------
   GUARANTEE SEAL
   ------------------------------------------------------------ */

.seal{
  position:relative;
  isolation:isolate;
  animation:pagenovaSealFloat 6s ease-in-out infinite;
}

.seal::before,
.seal::after{
  content:"";
  position:absolute;
  border-radius:50%;
  pointer-events:none;
  z-index:-1;
}

.seal::before{
  inset:-14px;
  border:1px solid var(--accent-mid);
  opacity:.55;
  animation:pagenovaSealSpin 20s linear infinite;
}

.seal::after{
  inset:-29px;
  border:1px dashed var(--accent-mid);
  opacity:.24;
  animation:pagenovaSealSpinReverse 28s linear infinite;
}

/* ------------------------------------------------------------
   FAQ MOTION
   ------------------------------------------------------------ */

.faq details{
  overflow:hidden;
  transition:
    transform .3s ease,
    border-color .3s ease,
    background .3s ease;
}

.faq details:hover{
  transform:translateX(4px);
  border-color:var(--accent-mid);
}

.faq details[open]{
  background:
    linear-gradient(
      180deg,
      var(--accent-soft),
      #ffffff02
    );
  border-color:var(--accent-mid);
}

/* ------------------------------------------------------------
   FINAL CTA STAGE
   ------------------------------------------------------------ */

.final-section{
  perspective:1200px;
}

.final-section::after{
  content:"";
  position:absolute;
  inset:12% 10%;
  border-radius:50%;
  background:
    radial-gradient(
      ellipse,
      var(--accent-soft),
      transparent 67%
    );
  filter:blur(34px);
  opacity:.55;
  z-index:-1;
  pointer-events:none;
  animation:pagenovaFinalAura 7s ease-in-out infinite;
}

.final-box{
  transform-style:preserve-3d;
  transition:
    transform .5s cubic-bezier(.2,.8,.2,1),
    box-shadow .5s ease;
}

.final-box:hover{
  transform:
    perspective(1100px)
    translateY(-4px)
    rotateX(.6deg);
  box-shadow:
    0 34px 90px #00000048,
    0 0 60px var(--accent-soft);
}

/* ------------------------------------------------------------
   CTA LIGHT SWEEP
   ------------------------------------------------------------ */

.cta{
  isolation:isolate;
  transform:translateZ(0);
}

.cta::after{
  content:"";
  position:absolute;
  top:-40%;
  bottom:-40%;
  width:46px;
  left:-90px;
  z-index:-1;
  opacity:0;
  transform:rotate(18deg);
  background:
    linear-gradient(
      90deg,
      transparent,
      #ffffff55,
      transparent
    );
  filter:blur(3px);
  animation:pagenovaCtaSweep 6.8s ease-in-out infinite;
}

.cta:hover{
  transform:translateY(-4px) scale(1.012);
}

/* ------------------------------------------------------------
   SCROLL REVEAL
   baseline remains visible before JS
   ------------------------------------------------------------ */

html.pagenova-motion-ready .pn-reveal{
  opacity:0;
  transform:translateY(26px) scale(.985);
  transition:
    opacity .68s cubic-bezier(.2,.8,.2,1),
    transform .68s cubic-bezier(.2,.8,.2,1);
  transition-delay:var(--pn-delay,0ms);
}

html.pagenova-motion-ready .pn-reveal.pn-visible{
  opacity:1;
  transform:translateY(0) scale(1);
}

html.pagenova-motion-ready .pn-reveal-left{
  opacity:0;
  transform:translateX(-26px);
  transition:
    opacity .7s cubic-bezier(.2,.8,.2,1),
    transform .7s cubic-bezier(.2,.8,.2,1);
}

html.pagenova-motion-ready .pn-reveal-left.pn-visible{
  opacity:1;
  transform:translateX(0);
}

html.pagenova-motion-ready .pn-reveal-right{
  opacity:0;
  transform:translateX(26px);
  transition:
    opacity .7s cubic-bezier(.2,.8,.2,1),
    transform .7s cubic-bezier(.2,.8,.2,1);
}

html.pagenova-motion-ready .pn-reveal-right.pn-visible{
  opacity:1;
  transform:translateX(0);
}

/* ------------------------------------------------------------
   KEYFRAMES
   ------------------------------------------------------------ */

@keyframes pagenovaHeroAura{
  0%,100%{
    opacity:.42;
    transform:translateX(-50%) scale(.94);
  }
  50%{
    opacity:.72;
    transform:translateX(-50%) scale(1.05);
  }
}

@keyframes pagenovaMockFloat{
  0%,100%{
    transform:translateY(0) rotateX(0deg) rotateY(0deg);
  }
  50%{
    transform:translateY(-10px) rotateX(1.2deg) rotateY(-1deg);
  }
}

@keyframes pagenovaMockGlow{
  0%,100%{
    filter:drop-shadow(0 18px 28px #00000035);
  }
  50%{
    filter:drop-shadow(0 25px 44px var(--accent-soft));
  }
}

@keyframes pagenovaGroundShadow{
  0%,100%{
    opacity:.18;
    transform:scale(.88);
  }
  50%{
    opacity:.34;
    transform:scale(1.05);
  }
}

@keyframes pagenovaOrbit{
  from{transform:rotate(0deg);}
  to{transform:rotate(360deg);}
}

@keyframes pagenovaOrbitReverse{
  from{transform:rotate(360deg);}
  to{transform:rotate(0deg);}
}

@keyframes pagenovaFloatOne{
  0%,100%{transform:translate3d(0,0,0) rotate(-3deg);}
  50%{transform:translate3d(0,-10px,20px) rotate(-1deg);}
}

@keyframes pagenovaFloatTwo{
  0%,100%{transform:translate3d(0,0,0) rotate(3deg);}
  50%{transform:translate3d(0,9px,24px) rotate(1deg);}
}

@keyframes pagenovaAmbientGlow{
  0%,100%{opacity:.72;}
  50%{opacity:1;}
}

@keyframes pagenovaParticleDrift{
  0%,100%{transform:translate3d(0,0,0);}
  50%{transform:translate3d(12px,-16px,0);}
}

@keyframes pagenovaProductFloat{
  0%,100%{
    transform:translateY(0) rotateY(-2deg);
  }
  50%{
    transform:translateY(-9px) rotateY(2deg);
  }
}

@keyframes pagenovaOfferAura{
  0%,100%{
    opacity:.36;
    transform:translate(-50%,-50%) scale(.9);
  }
  50%{
    opacity:.68;
    transform:translate(-50%,-50%) scale(1.08);
  }
}

@keyframes pagenovaOfferBorder{
  0%,100%{opacity:.42;}
  50%{opacity:.86;}
}

@keyframes pagenovaSealFloat{
  0%,100%{transform:translateY(0);}
  50%{transform:translateY(-6px);}
}

@keyframes pagenovaSealSpin{
  from{transform:rotate(0deg);}
  to{transform:rotate(360deg);}
}

@keyframes pagenovaSealSpinReverse{
  from{transform:rotate(360deg);}
  to{transform:rotate(0deg);}
}

@keyframes pagenovaFinalAura{
  0%,100%{
    opacity:.35;
    transform:scale(.94);
  }
  50%{
    opacity:.66;
    transform:scale(1.05);
  }
}

@keyframes pagenovaCtaSweep{
  0%,72%{
    left:-90px;
    opacity:0;
  }
  76%{
    opacity:.72;
  }
  88%{
    left:calc(100% + 90px);
    opacity:.55;
  }
  100%{
    left:calc(100% + 90px);
    opacity:0;
  }
}

/* ------------------------------------------------------------
   MOBILE
   ------------------------------------------------------------ */

@media (max-width:760px){

  .problem:hover,
  .included-card:hover,
  .bonus-card:hover,
  .final-box:hover{
    transform:none;
  }

  .hero::after{
    width:100%;
    height:420px;
  }

  .offer::after{
    width:520px;
    height:520px;
  }

  .float-one,
  .float-two{
    animation-duration:8s;
  }
}

/* ------------------------------------------------------------
   REDUCED MOTION
   ------------------------------------------------------------ */

@media (prefers-reduced-motion:reduce){

  html{
    scroll-behavior:auto;
  }

  *,
  *::before,
  *::after{
    animation-duration:.001ms !important;
    animation-iteration-count:1 !important;
    transition-duration:.001ms !important;
    scroll-behavior:auto !important;
  }

  html.pagenova-motion-ready .pn-reveal,
  html.pagenova-motion-ready .pn-reveal-left,
  html.pagenova-motion-ready .pn-reveal-right{
    opacity:1 !important;
    transform:none !important;
  }
}

/* PAGENOVA_V7_4C_MOTION_DEPTH_ENGINE */

@keyframes pagenovaAmbientDrift {
  0%,100% {
    transform:translate3d(0,0,0) scale(1);
    opacity:.42;
  }
  35% {
    transform:translate3d(4%,-3%,0) scale(1.08);
    opacity:.68;
  }
  70% {
    transform:translate3d(-3%,4%,0) scale(.96);
    opacity:.5;
  }
}

@keyframes pagenovaOrbitSpin {
  from { transform:rotate(0deg); }
  to { transform:rotate(360deg); }
}

@keyframes pagenovaOrbitReverse {
  from { transform:rotate(360deg); }
  to { transform:rotate(0deg); }
}

@keyframes pagenovaProductFloat {
  0%,100% {
    transform:
      perspective(900px)
      rotateY(-5deg)
      rotateX(3deg)
      translate3d(0,0,0);
  }
  50% {
    transform:
      perspective(900px)
      rotateY(4deg)
      rotateX(-2deg)
      translate3d(0,-16px,24px);
  }
}

@keyframes pagenovaGlowPulse {
  0%,100% {
    opacity:.35;
    transform:scale(.92);
    filter:blur(55px);
  }
  50% {
    opacity:.72;
    transform:scale(1.12);
    filter:blur(75px);
  }
}

@keyframes pagenovaCardFloat {
  0%,100% {
    transform:translate3d(0,0,0) rotate(0deg);
  }
  50% {
    transform:translate3d(0,-7px,12px) rotate(.35deg);
  }
}

@keyframes pagenovaShine {
  0% { transform:translateX(-160%) skewX(-18deg); }
  55%,100% { transform:translateX(220%) skewX(-18deg); }
}

@keyframes pagenovaReveal {
  from {
    opacity:0;
    transform:translate3d(0,28px,0) scale(.985);
  }
  to {
    opacity:1;
    transform:translate3d(0,0,0) scale(1);
  }
}

body::before{
  content:"";
  position:fixed;
  width:52vw;
  height:52vw;
  left:-18vw;
  top:10vh;
  border-radius:999px;
  pointer-events:none;
  z-index:0;
  background:radial-gradient(circle,var(--accent-soft),transparent 68%);
  filter:blur(28px);
  animation:pagenovaAmbientDrift 14s ease-in-out infinite;
}

body::after{
  content:"";
  position:fixed;
  width:44vw;
  height:44vw;
  right:-16vw;
  bottom:-10vh;
  border-radius:999px;
  pointer-events:none;
  z-index:0;
  background:radial-gradient(circle,var(--accent-mid),transparent 70%);
  filter:blur(60px);
  opacity:.28;
  animation:pagenovaAmbientDrift 18s ease-in-out infinite reverse;
}

.hero-glow{
  animation:pagenovaGlowPulse 5.8s ease-in-out infinite;
  will-change:transform,opacity,filter;
}

.orbit{
  animation:pagenovaOrbitSpin 20s linear infinite;
  will-change:transform;
}

.orbit.small{
  animation:pagenovaOrbitReverse 13s linear infinite;
}

.product-card,
.product-mockup,
.mockup,
.hero-product,
.hero-visual > *{
  transform-style:preserve-3d;
  will-change:transform;
}

.product-card,
.product-mockup,
.mockup{
  animation:pagenovaProductFloat 7s ease-in-out infinite;
}

.card,
.before-card,
.after-card,
.included-card,
.bonus-card{
  transform-style:preserve-3d;
  transition:
    transform .35s cubic-bezier(.2,.8,.2,1),
    border-color .35s ease,
    box-shadow .35s ease;
}

.card:hover,
.before-card:hover,
.after-card:hover,
.included-card:hover,
.bonus-card:hover{
  transform:
    perspective(850px)
    translate3d(0,-8px,18px)
    rotateX(1.5deg)
    rotateY(-1.5deg);
  border-color:var(--accent-border);
  box-shadow:
    0 24px 65px #00000055,
    0 0 34px var(--accent-soft);
}

.cta,
.cta-button,
button,
a[class*="cta"]{
  position:relative;
  overflow:hidden;
  isolation:isolate;
}

.cta::after,
.cta-button::after,
a[class*="cta"]::after{
  content:"";
  position:absolute;
  z-index:2;
  top:-40%;
  bottom:-40%;
  width:28%;
  left:-35%;
  pointer-events:none;
  background:linear-gradient(
    90deg,
    transparent,
    rgba(255,255,255,.32),
    transparent
  );
  animation:pagenovaShine 4.8s ease-in-out infinite;
}

section{
  position:relative;
}

section > *{
  animation:pagenovaReveal .7s cubic-bezier(.2,.8,.2,1) both;
}

section:nth-of-type(2n) > *{
  animation-delay:.08s;
}

section:nth-of-type(3n) > *{
  animation-delay:.14s;
}

.offer-shell,
.guarantee-card,
.final-cta{
  transform-style:preserve-3d;
  transition:
    transform .4s cubic-bezier(.2,.8,.2,1),
    box-shadow .4s ease;
}

.offer-shell:hover,
.guarantee-card:hover,
.final-cta:hover{
  transform:perspective(1000px) translateY(-5px) rotateX(.6deg);
  box-shadow:
    0 35px 100px #00000060,
    0 0 55px var(--accent-soft);
}

@media (prefers-reduced-motion: reduce){
  body::before,
  body::after,
  .hero-glow,
  .orbit,
  .orbit.small,
  .product-card,
  .product-mockup,
  .mockup,
  section > *,
  .cta::after,
  .cta-button::after,
  a[class*="cta"]::after{
    animation:none !important;
  }

  .card:hover,
  .before-card:hover,
  .after-card:hover,
  .included-card:hover,
  .bonus-card:hover,
  .offer-shell:hover,
  .guarantee-card:hover,
  .final-cta:hover{
    transform:none;
  }
}

/* PAGENOVA_V7_9C_STRUCTURAL_IMAGE_INTEGRATION */

.hero .media{
  position:relative;
  overflow:visible;
}

.hero .pn-generated-image-hero{
  display:block;
  width:min(100%,860px);
  height:auto;
  max-height:620px;
  margin:0 auto;
  object-fit:contain;
  border:0!important;
  border-radius:0!important;
  box-shadow:none!important;
  background:transparent!important;
  filter:drop-shadow(0 34px 55px rgba(0,0,0,.34));
}

.pn-generated-content-stage{
  position:relative;
  width:100%;
  min-height:420px;
  display:flex;
  align-items:center;
  justify-content:center;
  overflow:hidden;
  border-radius:32px;
  border:1px solid var(--accent-border);
  background:
    radial-gradient(circle at 50% 35%,var(--accent-mid),transparent 54%),
    linear-gradient(145deg,#15151c,#09090d);
  box-shadow:
    0 34px 80px rgba(0,0,0,.38),
    inset 0 1px 0 rgba(255,255,255,.06);
}

.pn-generated-content-stage::before{
  content:"";
  position:absolute;
  inset:12%;
  border-radius:50%;
  background:var(--accent-soft);
  filter:blur(60px);
  opacity:.8;
  pointer-events:none;
}

.pn-generated-content-stage .pn-generated-image-content{
  position:relative;
  z-index:2;
  display:block;
  width:100%;
  height:100%;
  min-height:420px;
  max-height:620px;
  object-fit:cover;
  border:0;
  border-radius:28px;
}

.pn-generated-visual-frame-offer,
.pn-generated-visual-frame-bonus{
  position:relative;
  overflow:hidden;
}

.pn-generated-visual-frame-offer .pn-generated-image-offer,
.pn-generated-visual-frame-bonus .pn-generated-image-bonus{
  display:block;
  width:100%;
  height:auto;
  object-fit:cover;
}

@media(max-width:760px){
  .hero .pn-generated-image-hero{
    width:100%;
    max-height:440px;
    border-radius:0!important;
  }

  .pn-generated-content-stage{
    min-height:280px;
    border-radius:24px;
  }

  .pn-generated-content-stage .pn-generated-image-content{
    min-height:280px;
    max-height:440px;
    border-radius:21px;
  }
}
/* PAGENOVA_V7_9D_VISUAL_CORRECTIONS */

/* ============================================================
   HERO — GENERATED IMAGE MUST FEEL FREE, NOT INSIDE A CARD
   ============================================================ */

.hero .media{
  width:100%;
  max-width:980px;
  min-height:0!important;
  margin:38px auto 34px;
  padding:0!important;
  border:0!important;
  border-radius:0!important;
  background:transparent!important;
  box-shadow:none!important;
  overflow:visible!important;
}

.hero .media::before,
.hero .media::after{
  display:none!important;
}

.hero .media .orbit,
.hero .media .float-card{
  display:none!important;
}

.hero .pn-generated-image-hero{
  display:block!important;
  width:100%!important;
  max-width:920px!important;
  height:auto!important;
  max-height:none!important;
  margin:0 auto!important;
  padding:0!important;
  border:0!important;
  outline:0!important;
  border-radius:0!important;
  background:transparent!important;
  box-shadow:none!important;
  object-fit:contain!important;
  transform:none!important;
  filter:
    drop-shadow(0 28px 34px rgba(0,0,0,.28))
    drop-shadow(0 0 44px var(--accent-soft))!important;
}

/* ============================================================
   BEFORE — CLEAN CARDS / NO GIANT OVERLAPPING NUMBERS
   ============================================================ */

.before-layout{
  grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr)!important;
  gap:clamp(40px,6vw,82px)!important;
  align-items:center!important;
}

.before-copy h2{
  max-width:560px!important;
  font-size:clamp(38px,4.3vw,64px)!important;
  line-height:1.04!important;
  letter-spacing:-.045em!important;
}

.before-copy p{
  max-width:560px!important;
}

.before-grid{
  display:grid!important;
  grid-template-columns:1fr!important;
  gap:16px!important;
}

.problem{
  position:relative!important;
  min-height:0!important;
  padding:25px 28px 25px 82px!important;
  overflow:hidden!important;
  border:1px solid rgba(255,255,255,.09)!important;
  border-radius:22px!important;
  background:
    linear-gradient(
      135deg,
      rgba(255,255,255,.035),
      rgba(124,92,255,.045)
    )!important;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.035),
    0 18px 42px rgba(0,0,0,.14)!important;
  transition:
    transform .28s ease,
    border-color .28s ease,
    background .28s ease!important;
}

.problem:hover{
  transform:translateY(-3px)!important;
  border-color:var(--accent-border)!important;
  background:
    linear-gradient(
      135deg,
      rgba(255,255,255,.05),
      var(--accent-soft)
    )!important;
}

.problem-num{
  position:absolute!important;
  left:24px!important;
  top:25px!important;
  width:38px!important;
  height:38px!important;
  display:flex!important;
  align-items:center!important;
  justify-content:center!important;
  margin:0!important;
  padding:0!important;
  border:1px solid var(--accent-border)!important;
  border-radius:12px!important;
  background:var(--accent-soft)!important;
  color:var(--accent)!important;
  font-size:12px!important;
  line-height:1!important;
  font-weight:950!important;
  letter-spacing:.04em!important;
  opacity:1!important;
  transform:none!important;
}

.problem strong{
  position:relative!important;
  z-index:2!important;
  display:block!important;
  margin:0 0 8px!important;
  font-size:17px!important;
  line-height:1.25!important;
}

.problem span{
  position:relative!important;
  z-index:2!important;
  display:block!important;
  margin:0!important;
  max-width:none!important;
  font-size:14px!important;
  line-height:1.65!important;
}

/* ============================================================
   BONUS — DIFFERENT VISUAL ICON FOR EACH CARD
   ============================================================ */

.bonus-card{
  position:relative!important;
  overflow:hidden!important;
}

.bonus-card::after{
  position:absolute!important;
  right:22px!important;
  top:22px!important;
  width:46px!important;
  height:46px!important;
  display:flex!important;
  align-items:center!important;
  justify-content:center!important;
  border:1px solid var(--accent-border)!important;
  border-radius:14px!important;
  background:var(--accent-soft)!important;
  color:var(--accent)!important;
  font-size:21px!important;
  line-height:1!important;
  box-shadow:0 0 28px var(--accent-soft)!important;
}

.bonus-card:nth-child(1)::after{
  content:"✓"!important;
}

.bonus-card:nth-child(2)::after{
  content:"↗"!important;
}

.bonus-card:nth-child(3)::after{
  content:"◆"!important;
}

.bonus-card .icon,
.bonus-card .card-icon{
  display:none!important;
}

/* Generic fallback when bonus cards use the standard grid card class */

.grid > *:nth-child(1) .bonus-icon::before{
  content:"✓";
}

.grid > *:nth-child(2) .bonus-icon::before{
  content:"↗";
}

.grid > *:nth-child(3) .bonus-icon::before{
  content:"◆";
}

/* ============================================================
   GUARANTEE — PREMIUM CERTIFICATE SEAL
   ============================================================ */

.guarantee-card{
  grid-template-columns:230px minmax(0,1fr)!important;
  gap:42px!important;
  align-items:center!important;
  max-width:1000px!important;
  min-height:300px!important;
  margin:0 auto!important;
  padding:44px 52px!important;
  overflow:hidden!important;
}

.seal{
  position:relative!important;
  width:178px!important;
  height:178px!important;
  min-width:178px!important;
  display:flex!important;
  flex-direction:column!important;
  align-items:center!important;
  justify-content:center!important;
  margin:0 auto!important;
  border:0!important;
  border-radius:50%!important;
  background:
    radial-gradient(
      circle at 50% 45%,
      #211a39 0 45%,
      #100d1b 46% 57%,
      #8b67ff 58% 60%,
      #171222 61% 68%,
      #6f4dff 69% 71%,
      #0d0b13 72%
    )!important;
  color:#fff!important;
  font-size:50px!important;
  line-height:.8!important;
  font-weight:950!important;
  letter-spacing:-.06em!important;
  text-align:center!important;
  transform:rotate(-5deg)!important;
  box-shadow:
    0 0 0 7px rgba(126,88,255,.08),
    0 0 0 13px rgba(126,88,255,.035),
    0 24px 60px rgba(0,0,0,.36),
    0 0 48px rgba(126,88,255,.22)!important;
}

.seal::before{
  content:"GARANTIA • GARANTIA •"!important;
  position:absolute!important;
  inset:13px!important;
  display:flex!important;
  align-items:flex-start!important;
  justify-content:center!important;
  padding-top:13px!important;
  border:1px dashed rgba(183,163,255,.7)!important;
  border-radius:50%!important;
  color:#b9a8ff!important;
  font-size:8px!important;
  line-height:1!important;
  font-weight:900!important;
  letter-spacing:.13em!important;
  transform:rotate(5deg)!important;
}

.seal::after{
  content:"COMPRA PROTEGIDA"!important;
  position:absolute!important;
  left:50%!important;
  bottom:28px!important;
  transform:translateX(-50%) rotate(5deg)!important;
  width:max-content!important;
  color:#b9a8ff!important;
  font-size:7px!important;
  line-height:1!important;
  font-weight:900!important;
  letter-spacing:.11em!important;
}

.seal span{
  display:block!important;
  margin-top:8px!important;
  color:#a98dff!important;
  font-size:11px!important;
  line-height:1!important;
  font-weight:950!important;
  letter-spacing:.18em!important;
}

.guarantee-copy h2{
  max-width:620px!important;
  font-size:clamp(34px,4vw,54px)!important;
  line-height:1.02!important;
}

.guarantee-copy p{
  max-width:650px!important;
}

/* ============================================================
   MOBILE
   ============================================================ */

@media(max-width:760px){

  .hero .media{
    margin:28px auto 28px!important;
  }

  .hero .pn-generated-image-hero{
    width:100%!important;
    max-height:none!important;
  }

  .before-layout{
    grid-template-columns:1fr!important;
    gap:34px!important;
  }

  .before-copy h2{
    font-size:clamp(34px,10vw,48px)!important;
  }

  .problem{
    padding:22px 20px 22px 72px!important;
  }

  .problem-num{
    left:20px!important;
    top:22px!important;
  }

  .guarantee-card{
    grid-template-columns:1fr!important;
    gap:30px!important;
    padding:38px 24px!important;
    text-align:center!important;
  }

  .seal{
    width:158px!important;
    height:158px!important;
    min-width:158px!important;
    font-size:44px!important;
  }

  .guarantee-copy h2,
  .guarantee-copy p{
    margin-left:auto!important;
    margin-right:auto!important;
  }
}

/* PAGENOVA_V7_9G_AUTHORITATIVE_STRUCTURE */

/* HERO: HEADLINE -> IMAGE -> SUBHEADLINE -> CTA -> TRUST */

.hero .wrap{
  display:flex!important;
  flex-direction:column!important;
  align-items:center!important;
}

.hero .pill{
  order:1!important;
}

.hero h1{
  order:2!important;
}

.hero .media{
  order:3!important;
  width:100%!important;
  max-width:960px!important;
  min-height:0!important;
  margin:34px auto 30px!important;
  padding:0!important;
  border:0!important;
  border-radius:0!important;
  background:transparent!important;
  box-shadow:none!important;
  overflow:visible!important;
}

.hero .media::before,
.hero .media::after,
.hero .media .orbit,
.hero .media .float-card{
  display:none!important;
}

.hero .pn-generated-image-hero{
  display:block!important;
  width:100%!important;
  max-width:920px!important;
  height:auto!important;
  max-height:none!important;
  margin:0 auto!important;
  padding:0!important;
  border:0!important;
  outline:0!important;
  border-radius:0!important;
  background:transparent!important;
  box-shadow:none!important;
  object-fit:contain!important;
  filter:
    drop-shadow(0 30px 38px rgba(0,0,0,.30))
    drop-shadow(0 0 50px var(--accent-soft))!important;
}

.hero .lead{
  order:4!important;
  margin-top:0!important;
}

.hero > .wrap > .cta{
  order:5!important;
}

.hero .hero-trust{
  order:6!important;
}

/* BEFORE */

.before-layout{
  grid-template-columns:minmax(0,.92fr) minmax(0,1.08fr)!important;
  gap:clamp(42px,6vw,80px)!important;
  align-items:center!important;
}

.before-copy h2{
  max-width:570px!important;
  font-size:clamp(38px,4.1vw,62px)!important;
  line-height:1.04!important;
  letter-spacing:-.045em!important;
}

.before-grid{
  display:grid!important;
  grid-template-columns:1fr!important;
  gap:14px!important;
}

.problem{
  position:relative!important;
  min-height:0!important;
  padding:24px 26px 24px 78px!important;
  overflow:hidden!important;
  border:1px solid rgba(255,255,255,.09)!important;
  border-radius:20px!important;
  background:
    linear-gradient(
      135deg,
      rgba(255,255,255,.035),
      rgba(124,92,255,.045)
    )!important;
  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.04),
    0 16px 38px rgba(0,0,0,.15)!important;
}

.problem::before,
.problem::after{
  display:none!important;
}

.problem-num{
  position:absolute!important;
  left:22px!important;
  top:23px!important;
  width:36px!important;
  height:36px!important;
  display:flex!important;
  align-items:center!important;
  justify-content:center!important;
  margin:0!important;
  padding:0!important;
  border:1px solid var(--accent-border)!important;
  border-radius:11px!important;
  background:var(--accent-soft)!important;
  color:var(--accent)!important;
  font-size:11px!important;
  line-height:1!important;
  font-weight:950!important;
  letter-spacing:.04em!important;
  opacity:1!important;
  transform:none!important;
}

.problem strong{
  display:block!important;
  margin:0 0 7px!important;
  font-size:17px!important;
  line-height:1.25!important;
}

.problem span{
  display:block!important;
  margin:0!important;
  font-size:14px!important;
  line-height:1.6!important;
}

/* AFTER IMAGE */

.after-visual{
  position:relative!important;
}

.pn-generated-content-stage{
  min-height:0!important;
  padding:0!important;
  overflow:visible!important;
  border:0!important;
  background:transparent!important;
  box-shadow:none!important;
}

.pn-generated-content-stage::before{
  opacity:.55!important;
}

.pn-generated-content-stage .pn-generated-image-content{
  display:block!important;
  width:100%!important;
  height:auto!important;
  min-height:0!important;
  max-height:none!important;
  object-fit:contain!important;
  border:0!important;
  border-radius:24px!important;
  box-shadow:
    0 30px 70px rgba(0,0,0,.30),
    0 0 44px var(--accent-soft)!important;
}

/* BONUS */

.bonus-card{
  position:relative!important;
  overflow:hidden!important;
}

.bonus-card::after{
  display:none!important;
}

.bonus-card:nth-child(1) .bonus-badge::before{
  content:"✓"!important;
}

.bonus-card:nth-child(2) .bonus-badge::before{
  content:"↗"!important;
}

.bonus-card:nth-child(3) .bonus-badge::before{
  content:"◆"!important;
}

.bonus-badge{
  display:flex!important;
  align-items:center!important;
  justify-content:center!important;
  font-size:0!important;
}

.bonus-badge::before{
  font-size:18px!important;
  line-height:1!important;
  color:var(--accent)!important;
}

/* GUARANTEE */

.guarantee-card{
  grid-template-columns:220px minmax(0,1fr)!important;
  gap:42px!important;
  align-items:center!important;
  max-width:960px!important;
  min-height:280px!important;
  margin:0 auto!important;
  padding:42px 48px!important;
}

.seal{
  position:relative!important;
  width:184px!important;
  height:184px!important;
  min-width:184px!important;
  display:flex!important;
  flex-direction:column!important;
  align-items:center!important;
  justify-content:center!important;
  gap:0!important;
  margin:0 auto!important;
  padding:0!important;
  border:0!important;
  border-radius:50%!important;
  background:
    radial-gradient(circle at 50% 50%,
      #171121 0 42%,
      #8c68ff 43% 45%,
      #181223 46% 56%,
      #5f43c9 57% 59%,
      #0c0a10 60% 100%
    )!important;
  color:#fff!important;
  transform:rotate(-4deg)!important;
  box-shadow:
    0 0 0 7px rgba(132,95,255,.08),
    0 0 0 13px rgba(132,95,255,.035),
    0 28px 65px rgba(0,0,0,.40),
    0 0 52px rgba(126,88,255,.25)!important;
}

.seal::before{
  content:""!important;
  position:absolute!important;
  inset:12px!important;
  border:1px dashed rgba(196,181,255,.72)!important;
  border-radius:50%!important;
  pointer-events:none!important;
}

.seal::after{
  content:""!important;
  position:absolute!important;
  inset:22px!important;
  border:1px solid rgba(151,119,255,.38)!important;
  border-radius:50%!important;
  pointer-events:none!important;
}

.seal-top{
  position:relative!important;
  z-index:2!important;
  margin-bottom:3px!important;
  color:#c9baff!important;
  font-size:9px!important;
  line-height:1!important;
  font-weight:950!important;
  letter-spacing:.20em!important;
}

.seal strong{
  position:relative!important;
  z-index:2!important;
  display:block!important;
  color:#fff!important;
  font-size:58px!important;
  line-height:.82!important;
  font-weight:950!important;
  letter-spacing:-.07em!important;
}

.seal-days{
  position:relative!important;
  z-index:2!important;
  display:block!important;
  margin-top:7px!important;
  color:#bba6ff!important;
  font-size:13px!important;
  line-height:1!important;
  font-weight:950!important;
  letter-spacing:.22em!important;
}

.seal-bottom{
  position:relative!important;
  z-index:2!important;
  display:block!important;
  margin-top:12px!important;
  color:#8973d9!important;
  font-size:6px!important;
  line-height:1!important;
  font-weight:900!important;
  letter-spacing:.13em!important;
}

.guarantee-copy h2{
  max-width:620px!important;
  font-size:clamp(34px,4vw,52px)!important;
  line-height:1.03!important;
}

@media(max-width:760px){

  .hero .media{
    margin:26px auto 26px!important;
  }

  .before-layout{
    grid-template-columns:1fr!important;
    gap:34px!important;
  }

  .problem{
    padding:22px 20px 22px 70px!important;
  }

  .problem-num{
    left:19px!important;
    top:21px!important;
  }

  .guarantee-card{
    grid-template-columns:1fr!important;
    gap:28px!important;
    padding:36px 22px!important;
    text-align:center!important;
  }

  .seal{
    width:160px!important;
    height:160px!important;
    min-width:160px!important;
  }

  .seal strong{
    font-size:50px!important;
  }

  .guarantee-copy h2,
  .guarantee-copy p{
    margin-left:auto!important;
    margin-right:auto!important;
  }
}
/* PAGENOVA_V7_8D_GENERATED_IMAGE_STYLES */

.pn-generated-image{
  display:block;
  width:100%;
  height:100%;
  object-fit:cover;
}

.pn-generated-image-hero{border:0!important;border-radius:0!important;box-shadow:none!important;
  position:relative;
  z-index:3;
  width:min(100%,920px);
  max-height:560px;
  margin:auto;
  border-radius:28px;
  object-fit:contain;
  filter:drop-shadow(0 30px 60px #0008);
}

.pn-generated-visual-section{
  position:relative;
  padding:24px 0 86px;
  overflow:hidden;
}

.pn-generated-visual-frame{
  position:relative;
  overflow:hidden;
  max-width:980px;
  min-height:320px;
  margin:34px auto 0;
  border:1px solid var(--accent-border);
  border-radius:30px;
  background:
    radial-gradient(circle at 50% 0%,var(--accent-soft),transparent 55%),
    #0c0b11;
  box-shadow:
    0 30px 90px #0007,
    0 0 50px var(--accent-soft);
}

.pn-generated-image-content{
  max-height:620px;
  object-fit:cover;
}

.pn-generated-visual-frame-bonus{
  max-width:900px;
  margin:34px auto 42px;
}

.pn-generated-image-bonus{
  max-height:520px;
  object-fit:cover;
}

.pn-generated-visual-frame-offer{
  max-width:650px;
  min-height:0;
  margin:28px auto;
  border-radius:24px;
}

.pn-generated-image-offer{
  max-height:500px;
  object-fit:contain;
  padding:10px;
}

@media(max-width:720px){
  .pn-generated-image-hero{border:0!important;border-radius:0!important;box-shadow:none!important;
    max-height:420px;
    border-radius:20px;
  }

  .pn-generated-visual-frame{
    min-height:220px;
    border-radius:22px;
  }

  .pn-generated-visual-section{
    padding:10px 0 58px;
  }
}

/* PAGENOVA_V7_9I_FINAL_AUTHORITY */

/* =========================
   HERO
   ========================= */

.hero .media{
  position:relative!important;
  width:100%!important;
  max-width:940px!important;
  min-height:0!important;
  height:auto!important;
  margin:34px auto 32px!important;
  padding:0!important;
  border:0!important;
  outline:0!important;
  border-radius:0!important;
  background:none!important;
  box-shadow:none!important;
  overflow:visible!important;
}

.hero .media::before,
.hero .media::after,
.hero .media .orbit,
.hero .media .float-card{
  display:none!important;
  content:none!important;
}

.hero .pn-generated-image-hero{
  display:block!important;
  width:100%!important;
  max-width:920px!important;
  height:auto!important;
  min-height:0!important;
  max-height:none!important;
  margin:0 auto!important;
  padding:0!important;
  border:0!important;
  outline:0!important;
  border-radius:0!important;
  background:none!important;
  box-shadow:none!important;
  object-fit:contain!important;
  transform:none!important;
}

/* =========================
   BEFORE
   ========================= */

.before-grid{
  display:grid!important;
  grid-template-columns:1fr!important;
  gap:16px!important;
}

.problem{
  position:relative!important;
  display:block!important;
  min-height:132px!important;
  margin:0!important;
  padding:27px 30px 27px 88px!important;
  overflow:hidden!important;

  border:1px solid rgba(132,95,255,.28)!important;
  border-radius:20px!important;

  background:
    linear-gradient(
      135deg,
      rgba(19,19,29,.98),
      rgba(18,16,29,.98)
    )!important;

  box-shadow:
    0 16px 40px rgba(0,0,0,.18),
    inset 0 1px 0 rgba(255,255,255,.035)!important;
}

.problem::before,
.problem::after{
  display:none!important;
  content:none!important;
  width:0!important;
  height:0!important;
  opacity:0!important;
}

.problem-num{
  position:absolute!important;
  left:26px!important;
  top:28px!important;

  display:flex!important;
  align-items:center!important;
  justify-content:center!important;

  width:38px!important;
  height:38px!important;
  min-width:38px!important;
  min-height:38px!important;

  margin:0!important;
  padding:0!important;

  border:1px solid rgba(132,95,255,.65)!important;
  border-radius:10px!important;

  background:rgba(124,92,255,.12)!important;
  color:#9b7cff!important;

  font-size:11px!important;
  line-height:1!important;
  font-weight:900!important;
  letter-spacing:.03em!important;

  opacity:1!important;
  transform:none!important;
  overflow:hidden!important;
}

.problem strong{
  position:relative!important;
  z-index:2!important;
  display:block!important;

  margin:0 0 8px!important;

  color:#fff!important;
  font-size:18px!important;
  line-height:1.25!important;
  font-weight:800!important;
}

.problem > span{
  position:relative!important;
  z-index:2!important;

  display:block!important;

  margin:0!important;

  color:rgba(235,232,245,.62)!important;
  font-size:14px!important;
  line-height:1.65!important;
}

/* =========================
   BONUS
   ========================= */

.bonus-card{
  position:relative!important;
}

.bonus-card::before,
.bonus-card::after{
  pointer-events:none!important;
}

.bonus-card::after{
  display:none!important;
  content:none!important;
}

.bonus-badge{
  position:relative!important;

  display:flex!important;
  align-items:center!important;
  justify-content:center!important;

  width:50px!important;
  height:50px!important;

  border:1px solid rgba(132,95,255,.58)!important;
  border-radius:14px!important;

  background:
    linear-gradient(
      145deg,
      rgba(124,92,255,.15),
      rgba(124,92,255,.04)
    )!important;

  color:#9d7cff!important;

  font-size:0!important;

  box-shadow:
    inset 0 1px 0 rgba(255,255,255,.05),
    0 12px 26px rgba(0,0,0,.18)!important;
}

.bonus-badge::before{
  display:block!important;
  color:#9d7cff!important;
  font-size:22px!important;
  line-height:1!important;
  font-weight:800!important;
}

.bonus-card:nth-child(1) .bonus-badge::before{
  content:"✓"!important;
}

.bonus-card:nth-child(2) .bonus-badge::before{
  content:"↗"!important;
}

.bonus-card:nth-child(3) .bonus-badge::before{
  content:"◆"!important;
}

/* =========================
   GUARANTEE
   ========================= */

.guarantee-card{
  position:relative!important;

  display:grid!important;
  grid-template-columns:220px minmax(0,1fr)!important;
  align-items:center!important;

  gap:44px!important;

  max-width:980px!important;
  min-height:290px!important;

  margin:0 auto!important;
  padding:44px 52px!important;

  overflow:hidden!important;

  border:1px solid rgba(132,95,255,.28)!important;
  border-radius:28px!important;

  background:
    radial-gradient(
      circle at 10% 50%,
      rgba(124,92,255,.11),
      transparent 34%
    ),
    linear-gradient(
      135deg,
      rgba(18,18,27,.98),
      rgba(12,12,19,.98)
    )!important;

  box-shadow:
    0 28px 70px rgba(0,0,0,.28),
    inset 0 1px 0 rgba(255,255,255,.04)!important;
}

.guarantee-card::before,
.guarantee-card::after{
  display:none!important;
  content:none!important;
}

.seal{
  position:relative!important;

  display:flex!important;
  flex-direction:column!important;
  align-items:center!important;
  justify-content:center!important;

  width:190px!important;
  height:190px!important;
  min-width:190px!important;

  margin:0 auto!important;
  padding:0!important;

  overflow:visible!important;

  border:3px solid #8d68ff!important;
  border-radius:50%!important;

  background:
    radial-gradient(
      circle,
      #1d1531 0 49%,
      #100d19 50% 64%,
      #7b55ed 65% 67%,
      #111019 68% 100%
    )!important;

  color:#fff!important;

  transform:rotate(-4deg)!important;

  box-shadow:
    0 0 0 7px rgba(126,88,255,.12),
    0 0 0 13px rgba(126,88,255,.045),
    0 28px 60px rgba(0,0,0,.42),
    0 0 42px rgba(126,88,255,.26)!important;
}

.seal::before{
  content:""!important;

  position:absolute!important;
  inset:12px!important;

  display:block!important;

  border:1px dashed rgba(218,208,255,.72)!important;
  border-radius:50%!important;

  opacity:1!important;
}

.seal::after{
  content:""!important;

  position:absolute!important;
  inset:23px!important;

  display:block!important;

  border:1px solid rgba(157,124,255,.34)!important;
  border-radius:50%!important;

  opacity:1!important;
}

.seal-top{
  position:relative!important;
  z-index:3!important;

  display:block!important;

  margin:0 0 5px!important;

  color:#c9baff!important;

  font-size:9px!important;
  line-height:1!important;
  font-weight:900!important;
  letter-spacing:.22em!important;
}

.seal strong{
  position:relative!important;
  z-index:3!important;

  display:block!important;

  margin:0!important;

  color:#fff!important;

  font-size:58px!important;
  line-height:.86!important;
  font-weight:950!important;
  letter-spacing:-.06em!important;
}

.seal-days{
  position:relative!important;
  z-index:3!important;

  display:block!important;

  margin:7px 0 0!important;

  color:#bca8ff!important;

  font-size:12px!important;
  line-height:1!important;
  font-weight:950!important;
  letter-spacing:.24em!important;
}

.seal-bottom{
  position:relative!important;
  z-index:3!important;

  display:block!important;

  margin:13px 0 0!important;

  color:#8f78dd!important;

  font-size:6px!important;
  line-height:1!important;
  font-weight:900!important;
  letter-spacing:.14em!important;
}

@media(max-width:760px){

  .problem{
    min-height:0!important;
    padding:23px 20px 23px 72px!important;
  }

  .problem-num{
    left:19px!important;
    top:22px!important;
  }

  .guarantee-card{
    grid-template-columns:1fr!important;
    gap:30px!important;
    padding:38px 22px!important;
    text-align:center!important;
  }

  .seal{
    width:165px!important;
    height:165px!important;
    min-width:165px!important;
  }

  .seal strong{
    font-size:50px!important;
  }
}

/* PAGENOVA_GUARANTEE_ASSETS_V1 */

.pn-guarantee-seal{
  border:0!important;
  border-radius:0!important;
  background:none!important;
  box-shadow:none!important;
  padding:0!important;
  width:220px!important;
  height:auto!important;
  min-width:220px!important;
  overflow:visible!important;
}

.pn-guarantee-seal::before,
.pn-guarantee-seal::after{
  display:none!important;
  content:none!important;
}

.pn-guarantee-badge{
  display:block!important;
  width:100%!important;
  max-width:220px!important;
  height:auto!important;
  object-fit:contain!important;
  margin:0 auto!important;
}

@media(max-width:720px){
  .pn-guarantee-seal{
    width:190px!important;
    min-width:190px!important;
    height:auto!important;
  }

  .pn-guarantee-badge{
    width:100%!important;
    max-width:190px!important;
    height:auto!important;
  }
}
</style>`;

  const body = `
<div class="topbar">
  ACESSO IMEDIATO • OFERTA DISPONÍVEL AGORA
</div>

<main>

  <section class="hero">
    <div class="hero-glow"></div>

    <div class="wrap">

      <div class="pill">
        <span class="pill-dot"></span>
        ${copy.category}
      </div>

      <h1>${copy.headline}</h1>

      <div class="media">

        <div class="orbit"></div>
        <div class="orbit small"></div>

        <div class="float-card float-one">
          CONTEÚDO ORGANIZADO
        </div>

        <div class="float-card float-two">
          ACESSO IMEDIATO
        </div>

        ${
          heroImageHtml ||
          `<div class="mock">
            ${copy.name}
          </div>`
        }

      </div>

      <p class="lead">
        ${copy.subheadline}
      </p>

      <a class="cta" href="#oferta">
        ${copy.cta}
        <span>→</span>
      </a>

      <div class="hero-trust">
        <span><b>✓</b> Acesso imediato</span>
        <span><b>✓</b> Compra segura</span>
        <span><b>✓</b> ${copy.guarantee} dias de garantia</span>
      </div>

    </div>
  </section>


  <section class="section">

    <div class="wrap before-layout">

      <div class="before-copy">

        <span class="eyebrow">
          ANTES
        </span>

        <h2>
          ${copy.beforeTitle}
        </h2>

        <p>
          ${copy.beforeText}
        </p>

      </div>

      <div class="before-grid">

        <div class="problem">
          <div class="problem-num">01</div>
          <strong>Informação demais</strong>
          <span>
            Muito conteúdo disponível, mas pouca direção sobre o que realmente merece sua atenção.
          </span>
        </div>

        <div class="problem">
          <div class="problem-num">02</div>
          <strong>Falta de clareza</strong>
          <span>
            Dificuldade para entender prioridades e transformar conhecimento em um plano executável.
          </span>
        </div>

        <div class="problem">
          <div class="problem-num">03</div>
          <strong>Tentativa e erro</strong>
          <span>
            Tempo perdido testando caminhos diferentes sem uma sequência clara para seguir.
          </span>
        </div>

      </div>

    </div>

  </section>

  <section class="section alt">

    <div class="wrap after-layout">

      <div>

        <span class="eyebrow">
          DEPOIS
        </span>

        <h2>
          ${copy.afterTitle}
        </h2>

        <p>
          ${copy.afterText}
        </p>

        <div class="benefit-list">

          <div class="benefit">
            <div class="benefit-check">✓</div>
            <div>
              <strong>Clareza</strong>
              <span>
                Saiba por onde começar e qual deve ser seu próximo movimento.
              </span>
            </div>
          </div>

          <div class="benefit">
            <div class="benefit-check">✓</div>
            <div>
              <strong>Estrutura</strong>
              <span>
                Siga uma sequência organizada em vez de depender de improviso.
              </span>
            </div>
          </div>

          <div class="benefit">
            <div class="benefit-check">✓</div>
            <div>
              <strong>Aplicação</strong>
              <span>
                Transforme o que aprende em ações que você realmente consegue executar.
              </span>
            </div>
          </div>

        </div>

        <a class="cta" href="#conteudo">
          VER O QUE ESTÁ INCLUSO
          <span>→</span>
        </a>

      </div>

      <div class="after-visual">

        ${
          contentImageHtml
            ? `<div class="pn-generated-content-stage">
                ${contentImageHtml}
              </div>`
            : `<div class="after-core">
                ${copy.name}
              </div>`
        }

      </div>

    </div>

  </section>


  <section id="conteudo" class="section">

    <div class="wrap">

      <div class="section-intro">

        <span class="eyebrow">
          O QUE ESTÁ INCLUSO
        </span>

        <h2>
          ${copy.includedTitle}
        </h2>

        <p>
          ${copy.includedText}
        </p>

      </div>

      <div class="grid">
        ${includedCardsHtml}
      </div>

    </div>

  </section>


  <section class="section alt">
    <div class="wrap">

      <div class="section-intro">
        <span class="eyebrow">
          ${bonusEyebrow}
        </span>

        <h2>
          ${bonusHeadline}
        </h2>

        <p>
          ${bonusDescription}
        </p>
      </div>

      ${
        bonusImageHtml
          ? `<div class="pn-generated-visual-frame pn-generated-visual-frame-bonus">
              ${bonusImageHtml}
            </div>`
          : ""
      }

      <div class="grid">
        ${bonusCardsHtml}
      </div>

    </div>
  </section>


  <section id="oferta" class="section">
    <div class="wrap">

      <div class="offer-shell">
        <div class="offer-glow"></div>

        <div class="offer">
          <span class="offer-label">
            ${offerLabel}
          </span>

          <h2>
            ${offerHeadline}
          </h2>

          <p class="offer-description">
            ${offerDescription}
          </p>

          ${
            offerImageHtml
              ? `<div class="pn-generated-visual-frame pn-generated-visual-frame-offer">
                  ${offerImageHtml}
                </div>`
              : ""
          }

          <div class="offer-list">
            ${offerItemsHtml}
          </div>

          <div class="price-label">
            ${offerPriceLabel}
          </div>

          <div class="price">
            ${copy.price}
          </div>

          <a class="cta" href="#">
            ${offerCta}
            <span>→</span>
          </a>

          <div class="secure-note">
            ${offerSecureNote}
          </div>

        </div>
      </div>

    </div>
  </section>


  <section class="section alt">
    <div class="wrap">

      <div class="guarantee-card">

        <div class="seal pn-guarantee-seal">
          <img
            class="pn-guarantee-badge"
            src="${copy.guarantee === "30" ? "/guarantees/guarantee-30.png" : copy.guarantee === "15" ? "/guarantees/guarantee-15.png" : "/guarantees/guarantee-7.png"}"
            alt="Garantia de ${copy.guarantee} dias"
          />
        </div>

        <div class="guarantee-copy">

          <span class="eyebrow">
            ${guaranteeEyebrow}
          </span>

          <h2>
            ${guaranteeHeadline}
          </h2>

          <p>
            ${guaranteeDescription}
          </p>

        </div>

      </div>

    </div>
  </section>


  <section class="section">
    <div class="wrap faq-head">

      <div class="faq-copy">

        <span class="eyebrow">
          DÚVIDAS
        </span>

        <h2>
          Perguntas frequentes
        </h2>

        <p>
          As principais informações antes de garantir seu acesso.
        </p>

      </div>

      <div class="faq">
        ${faqItemsHtml}
      </div>

    </div>
  </section>


  <section class="section alt final-section">
    <div class="wrap">

      <div class="final-box">

        <div class="pill">
          <span class="pill-dot"></span>
          ${finalEyebrow}
        </div>

        <h2>
          ${copy.finalTitle}
        </h2>

        <p>
          ${copy.finalText}
        </p>

        <a class="cta" href="#oferta">
          ${finalButton}
          <span>→</span>
        </a>

        <p class="microcopy">
          ${finalMicrocopy}
        </p>

      </div>

    </div>
  </section>

</main>

<footer>
  © ${new Date().getFullYear()} ${copy.name}. Todos os direitos reservados.
</footer>`;

  const visualHtml =
    `<!doctype html><html lang="pt-BR"><head>${head}</head><body>${body}
<script>
(function(){
  if(window.__PAGENOVA_V7_6D_MOTION_3D__) return;
  window.__PAGENOVA_V7_6D_MOTION_3D__ = true;

  var reducedMotion = false;

  try{
    reducedMotion = window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  }catch(error){
    reducedMotion = false;
  }

  if(reducedMotion) return;

  document.documentElement.classList.add("pagenova-motion-ready");

  var revealTargets = [];

  function addReveal(selector, className){
    var nodes = document.querySelectorAll(selector);

    nodes.forEach(function(node,index){
      if(node.dataset.pnMotionReady === "1") return;

      node.dataset.pnMotionReady = "1";
      node.classList.add(className || "pn-reveal");

      var delay = Math.min(index % 5,4) * 75;
      node.style.setProperty("--pn-delay", delay + "ms");

      revealTargets.push(node);
    });
  }

  addReveal(".section-intro","pn-reveal");
  addReveal(".before-copy","pn-reveal-left");
  addReveal(".problem","pn-reveal");
  addReveal(".after-core","pn-reveal-left");
  addReveal(".after-visual","pn-reveal-right");
  addReveal(".included-card","pn-reveal");
  addReveal(".bonus-card","pn-reveal");
  addReveal(".offer-shell","pn-reveal");
  addReveal(".guarantee-card","pn-reveal");
  addReveal(".faq-copy","pn-reveal-left");
  addReveal(".faq details","pn-reveal");
  addReveal(".final-box","pn-reveal");

  if(!("IntersectionObserver" in window)){
    revealTargets.forEach(function(node){
      node.classList.add("pn-visible");
    });
    return;
  }

  var observer = new IntersectionObserver(
    function(entries){
      entries.forEach(function(entry){
        if(entry.isIntersecting){
          entry.target.classList.add("pn-visible");
          observer.unobserve(entry.target);
        }
      });
    },
    {
      threshold:0.12,
      rootMargin:"0px 0px -6% 0px"
    }
  );

  revealTargets.forEach(function(node){
    observer.observe(node);
  });

  var hero = document.querySelector(".hero");
  var mock = document.querySelector(".hero .mock");

  if(hero && mock && window.matchMedia("(pointer:fine)").matches){

    hero.addEventListener("pointermove",function(event){
      var rect = hero.getBoundingClientRect();

      var px = (event.clientX - rect.left) / rect.width;
      var py = (event.clientY - rect.top) / rect.height;

      var rotateY = (px - 0.5) * 3.2;
      var rotateX = (0.5 - py) * 2.4;

      mock.style.transform =
        "perspective(1000px) rotateX(" +
        rotateX.toFixed(2) +
        "deg) rotateY(" +
        rotateY.toFixed(2) +
        "deg)";
    });

    hero.addEventListener("pointerleave",function(){
      mock.style.transform = "";
    });
  }
})();
</script>
</body></html>`;

  return {
    id,
    sourceUrl: "pagenova://generator/infoproduct",
    finalUrl: "",
    domain: "PageNova AI",
    title: input.productName.trim() || "Landing Page",
    description: copy.description,
    favicon: null,

    headings: [
      copy.headline,
      copy.beforeTitle,
      copy.afterTitle,
      copy.includedTitle,
      bonusHeadline,
      input.productName,
      guaranteeHeadline,
      "Perguntas frequentes",
      copy.finalTitle,
    ],

    texts: [
      copy.description,
      copy.audience,
      copy.beforeText,
      copy.afterText,
      copy.cta,
    ],

    links: [
      {
        text: copy.cta,
        href: "#oferta",
      },
    ],

    images: [],

    sections: [
      "hero",
      "before",
      "after",
      "included",
      "bonus",
      "offer",
      "guarantee",
      "faq",
      "final-cta",
      "footer",
    ],

    visualHtml,
    visualBodyHtml: body,
    visualHeadHtml: head,
    fetchedAt: new Date().toISOString(),
  };
}

