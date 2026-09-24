"use client";

import { FormEvent, ReactNode, useMemo, useState } from "react";
import { generateInfoProductProject } from "@/lib/pagenova-generator";
import { savePageNovaProject } from "@/lib/pagenova-project-store";
import { useRouter } from "next/navigation";
import { AppHeader } from "@/components/app-header";

type ProductType = "physical" | "info" | "ebook";

type Category = {
  id: string;
  label: string;
  description: string;
  accent: string;
  glow: string;
  icon: CategoryIcon;
};

type CategoryIcon =
  | "sparkles"
  | "chart"
  | "heart"
  | "beauty"
  | "person"
  | "education"
  | "home"
  | "technology"
  | "fashion"
  | "general"
  | "book";

function Icon({ name, className = "h-6 w-6" }: { name: CategoryIcon; className?: string }) {
  const common = {
    className,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.8,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  if (name === "chart") return <svg {...common}><path d="M4 19V9" /><path d="M10 19V5" /><path d="M16 19v-7" /><path d="M22 19V2" /><path d="M3 19h19" /></svg>;
  if (name === "heart") return <svg {...common}><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.5 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" /></svg>;
  if (name === "beauty") return <svg {...common}><path d="M12 3c1.2 3.2 3.8 5.8 7 7-3.2 1.2-5.8 3.8-7 7-1.2-3.2-3.8-5.8-7-7 3.2-1.2 5.8-3.8 7-7Z" /><path d="M19 16c.5 1.4 1.6 2.5 3 3-1.4.5-2.5 1.6-3 3-.5-1.4-1.6-2.5-3-3 1.4-.5 2.5-1.6 3-3Z" /></svg>;
  if (name === "person") return <svg {...common}><circle cx="12" cy="7" r="4" /><path d="M4.5 21a7.5 7.5 0 0 1 15 0" /></svg>;
  if (name === "education") return <svg {...common}><path d="m3 10 9-5 9 5-9 5-9-5Z" /><path d="M7 12.5V17c3 2 7 2 10 0v-4.5" /><path d="M21 10v6" /></svg>;
  if (name === "home") return <svg {...common}><path d="m3 11 9-8 9 8" /><path d="M5 10v10h14V10" /><path d="M9 20v-6h6v6" /></svg>;
  if (name === "technology") return <svg {...common}><rect x="4" y="4" width="16" height="16" rx="3" /><path d="M9 9h6v6H9z" /><path d="M9 1v3M15 1v3M9 20v3M15 20v3M1 9h3M1 15h3M20 9h3M20 15h3" /></svg>;
  if (name === "fashion") return <svg {...common}><path d="M8 4c.8 2 2 3 4 3s3.2-1 4-3l4 3-2 4-2-1v10H8V10l-2 1-2-4 4-3Z" /></svg>;
  if (name === "book") return <svg {...common}><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H11v16H6.5A2.5 2.5 0 0 0 4 21.5v-16Z" /><path d="M20 5.5A2.5 2.5 0 0 0 17.5 3H13v16h4.5a2.5 2.5 0 0 1 2.5 2.5v-16Z" /></svg>;
  if (name === "general") return <svg {...common}><circle cx="12" cy="12" r="9" /><path d="M8 12h8M12 8v8" /></svg>;
  return <svg {...common}><path d="M12 3c1.3 3.5 4.2 6.4 7.7 7.7C16.2 12 13.3 14.9 12 18.4c-1.3-3.5-4.2-6.4-7.7-7.7C7.8 9.4 10.7 6.5 12 3Z" /></svg>;
}

function ProductIcon({ type }: { type: ProductType }) {
  if (type === "physical") {
    return <svg className="h-9 w-9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="m4 7 8-4 8 4-8 4-8-4Z" /><path d="m4 7 8 4 8-4v10l-8 4-8-4V7Z" /><path d="M12 11v10" /></svg>;
  }
  if (type === "info") {
    return <svg className="h-9 w-9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="16" rx="3" /><path d="m10 9 5 3-5 3V9Z" /></svg>;
  }
  return <svg className="h-9 w-9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M5 3h10l4 4v14H5V3Z" /><path d="M15 3v5h5" /><path d="M8 13h8M8 17h6" /></svg>;
}

const productTypes: { id: ProductType; title: string; description: string; eyebrow: string }[] = [
  { id: "physical", title: "Produto Físico", description: "Produtos, e-commerce e ofertas de produto único.", eyebrow: "OFERTA DE PRODUTO" },
  { id: "info", title: "Infoproduto", description: "Cursos, treinamentos, métodos e produtos digitais.", eyebrow: "CONHECIMENTO DIGITAL" },
  { id: "ebook", title: "E-book", description: "Guias, livros digitais, manuais e materiais em PDF.", eyebrow: "CONTEÚDO DIGITAL" },
];

const categories: Record<ProductType, Category[]> = {
  physical: [
    { id: "beauty", label: "Beleza & Cuidados", description: "Clean, premium e visual", accent: "#E879B9", glow: "rgba(232,121,185,0.18)", icon: "beauty" },
    { id: "fashion", label: "Moda & Acessórios", description: "Editorial e sofisticado", accent: "#D6B68A", glow: "rgba(214,182,138,0.18)", icon: "fashion" },
    { id: "home", label: "Casa & Utilidades", description: "Claro, comercial e objetivo", accent: "#52B788", glow: "rgba(82,183,136,0.18)", icon: "home" },
    { id: "technology", label: "Tecnologia", description: "Dark, moderno e tecnológico", accent: "#6C8CFF", glow: "rgba(108,140,255,0.20)", icon: "technology" },
    { id: "general", label: "Geral", description: "Comercial e versátil", accent: "#875DFF", glow: "rgba(135,93,255,0.20)", icon: "general" },
  ],
  info: [
    { id: "money", label: "Dinheiro & Negócios", description: "Premium e autoridade", accent: "#D6B85C", glow: "rgba(214,184,92,0.18)", icon: "chart" },
    { id: "marketing", label: "Marketing & Vendas", description: "Forte e tecnológico", accent: "#875DFF", glow: "rgba(135,93,255,0.24)", icon: "sparkles" },
    { id: "wellness", label: "Saúde & Bem-estar", description: "Clean e acolhedor", accent: "#45B99A", glow: "rgba(69,185,154,0.18)", icon: "heart" },
    { id: "beauty", label: "Beleza", description: "Elegante e visual", accent: "#E879B9", glow: "rgba(232,121,185,0.18)", icon: "beauty" },
    { id: "development", label: "Desenvolvimento Pessoal", description: "Humano e inspirador", accent: "#E28A5C", glow: "rgba(226,138,92,0.18)", icon: "person" },
    { id: "education", label: "Educação", description: "Organizado e confiável", accent: "#4D91FF", glow: "rgba(77,145,255,0.18)", icon: "education" },
  ],
  ebook: [
    { id: "business", label: "Negócios", description: "Premium e profissional", accent: "#D6B85C", glow: "rgba(214,184,92,0.18)", icon: "chart" },
    { id: "marketing", label: "Marketing", description: "Digital e moderno", accent: "#875DFF", glow: "rgba(135,93,255,0.24)", icon: "sparkles" },
    { id: "wellness", label: "Saúde & Bem-estar", description: "Leve e clean", accent: "#45B99A", glow: "rgba(69,185,154,0.18)", icon: "heart" },
    { id: "development", label: "Desenvolvimento Pessoal", description: "Quente e inspirador", accent: "#E28A5C", glow: "rgba(226,138,92,0.18)", icon: "person" },
    { id: "education", label: "Educação", description: "Claro e organizado", accent: "#4D91FF", glow: "rgba(77,145,255,0.18)", icon: "education" },
    { id: "general", label: "Geral", description: "Versátil e comercial", accent: "#875DFF", glow: "rgba(135,93,255,0.20)", icon: "book" },
  ],
};

function Feature({ children, accent }: { children: ReactNode; accent: string }) {
  return (
    <div className="flex items-center gap-2 text-sm text-neutral-400">
      <span className="flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-black" style={{ backgroundColor: `${accent}18`, color: accent }}>?</span>
      {children}
    </div>
  );
}

export default function GeneratorPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [productType, setProductType] = useState<ProductType | null>(null);
  const [categoryId, setCategoryId] = useState("");
  const [guarantee, setGuarantee] = useState("7");
  const [customAccent, setCustomAccent] = useState<string | null>(null);
  const [imageCount, setImageCount] = useState<0 | 1 | 2 | 3 | 4>(3);
  const [productDescription, setProductDescription] = useState("");
  const [mockupPreference, setMockupPreference] = useState("ai-decides");
  const [visualInstructions, setVisualInstructions] = useState("");

  const IMAGE_CREDITS_INITIAL = 30;
  const getAvailableImageCredits = () => {
    if (typeof window === "undefined") {
      return IMAGE_CREDITS_INITIAL;
    }

    const stored = window.localStorage.getItem(
      "pagenova-image-credits",
    );

    if (stored === null) {
      return IMAGE_CREDITS_INITIAL;
    }

    const parsed = Number(stored);

    if (!Number.isFinite(parsed)) {
      return IMAGE_CREDITS_INITIAL;
    }

    return Math.max(0, Math.floor(parsed));
  };

  // PAGENOVA_V7_8D_CREDIT_LEDGER_MVP
  const setAvailableImageCredits = (credits: number) => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(
      "pagenova-image-credits",
      String(Math.max(0, Math.floor(credits))),
    );
  };

  const [message, setMessage] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);

  const selectedCategory = useMemo(() => {
    if (!productType || !categoryId) return null;
    return categories[productType].find((category) => category.id === categoryId) ?? null;
  }, [productType, categoryId]);

  const selectedProductType = useMemo(() => {
    if (!productType) return null;
    return productTypes.find((item) => item.id === productType) ?? null;
  }, [productType]);

  const accent = customAccent ?? selectedCategory?.accent ?? "#875DFF";
  const glow = selectedCategory?.glow ?? "rgba(135,93,255,0.20)";

  function chooseProductType(type: ProductType) {
    setProductType(type);
    setCategoryId("");
    setMessage("");
    setStep(2);
  }

  function chooseCategory(id: string) {
    setCategoryId(id);
    setMessage("");
    setStep(3);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isGenerating) {
      return;
    }

    if (!productType || !selectedCategory) {
      setMessage("Selecione o tipo e a categoria da página.");
      return;
    }

    if (productType !== "info") {
      setMessage("A geração de Produto Físico e E-book será liberada na próxima etapa.");
      return;
    }

    const form = new FormData(event.currentTarget);
    const productName = String(form.get("productName") ?? "").trim();
    const price = String(form.get("price") ?? "").trim();
    const submittedProductDescription = String(
      form.get("productDescription") ?? ""
    ).trim();


    // PAGENOVA_PRODUCT_DESCRIPTION_GATE
    if (!productName || !price || !submittedProductDescription) {
      setMessage("Informe o nome, a descrição do produto e o preço.");
      return;
    }

    setIsGenerating(true);
    setMessage("Criando a copy da sua landing page com IA...");

    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 45000);

    let description = submittedProductDescription;


    let audience =
      `Pessoas interessadas em ${selectedCategory.label.toLowerCase()} que buscam uma solução prática e organizada.`;

    let cta = "QUERO GARANTIR MEU ACESSO";
    let aiCopy: import("@/lib/pagenova-generator").PageNovaAICopy | undefined;

    try {
      const response = await fetch("/api/pagenova/generate-copy", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        signal: controller.signal,
        body: JSON.stringify({
          productType: "info",
          category: categoryId,
          categoryLabel: selectedCategory.label,
          productName,
          productDescription: submittedProductDescription,
          price,
          guaranteeDays: Number(guarantee),
        }),
      });

      if (response.ok) {
        const result = await response.json();

        if (result?.ok && result?.copy?.hero) {
          aiCopy = result.copy;
          description =
            String(result.copy.hero.subheadline || "").trim() ||
            description;

          audience =
            String(result.copy.before?.description || "").trim() ||
            audience;

          cta =
            String(result.copy.hero.cta || "").trim() ||
            cta;

          window.sessionStorage.setItem(
            "pagenova-last-ai-copy",
            JSON.stringify({
              source: result.source ?? "unknown",
              provider: result.provider ?? null,
              model: result.model ?? null,
              fallbackReason: result.fallbackReason ?? null,
              usage: result.usage ?? null,
              copy: result.copy,
            }),
          );
        }
      }
    } catch (error) {
      console.warn(
        "[PageNova] AI copy unavailable. Using deterministic fallback.",
        error,
      );
    } finally {
      window.clearTimeout(timeout);
    }

    // PAGENOVA_V7_8D_IMAGE_ORCHESTRATION
    // PAGENOVA_V7_8D_REAL_IMAGE_ORCHESTRATION
    const imageSlots = (
      ["hero", "content", "offer", "bonus"] as const
    ).slice(0, imageCount);

    const generatedImages: import("@/lib/pagenova-generator").PageNovaGeneratedImage[] = [];

    const availableImageCredits = getAvailableImageCredits();

    if (imageCount > availableImageCredits) {
      setMessage(
        `Você possui ${availableImageCredits} crédito${availableImageCredits === 1 ? "" : "s"} de imagem. Reduza a quantidade solicitada.`,
      );
      setIsGenerating(false);
      return;
    }

    let successfulImageGenerations = 0;

    if (imageSlots.length > 0) {
      setMessage(
        `Criando ${imageSlots.length} imagem${imageSlots.length === 1 ? "" : "ns"} para sua landing page...`,
      );

      for (const slot of imageSlots) {
        try {
          const imageController = new AbortController();
          const imageTimeout = window.setTimeout(
            () => imageController.abort(),
            120000,
          );

          try {
            const imageResponse = await fetch(
              "/api/pagenova/generate-image",
              {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                },
                signal: imageController.signal,
                body: JSON.stringify({
                  productType: "info",
                  category: categoryId,
                  categoryLabel: selectedCategory.label,
                  productName,
                  productDescription: submittedProductDescription,
                  accent,
                  mockupPreference,
                  visualInstructions: visualInstructions.trim(),
                  slot,
                }),
              },
            );

            if (!imageResponse.ok) {
              console.warn(
                `[PageNova] Image generation failed for slot ${slot}: HTTP ${imageResponse.status}`,
              );
              continue;
            }

            const imageResult = await imageResponse.json();

            const returnedSlot = String(
              imageResult?.image?.slot ?? "",
            ).trim();

            const mimeType = String(
              imageResult?.image?.mimeType ?? "",
            ).trim();

            const base64 = String(
              imageResult?.image?.base64 ?? "",
            ).trim();

            const alt = String(
              imageResult?.image?.alt ?? `${productName} - ${slot}`,
            ).trim();

            if (
              imageResult?.ok !== true ||
              returnedSlot !== slot ||
              !mimeType.startsWith("image/") ||
              !base64
            ) {
              console.warn(
                `[PageNova] Invalid image payload for slot ${slot}.`,
              );
              continue;
            }

            generatedImages.push({
              slot,
              url: `data:${mimeType};base64,${base64}`,
              alt,
            });

            successfulImageGenerations += 1;
          } finally {
            window.clearTimeout(imageTimeout);
          }
        } catch (error) {
          console.warn(
            `[PageNova] Image unavailable for slot ${slot}. Continuing without this image.`,
            error,
          );
        }
      }
    }

    if (
      imageSlots.length > 0 &&
      successfulImageGenerations < imageSlots.length
    ) {
      console.warn(
        `[PageNova] Requested ${imageSlots.length} image(s), generated ${successfulImageGenerations}.`,
      );
    }
    const project = generateInfoProductProject({
      imagePlan: { requestedCount: imageCount, images: generatedImages },
      productName,
      description,
      audience,
      price,
      cta,
      guarantee,
      categoryId,
      categoryLabel: selectedCategory.label,
      accent,
      aiCopy,
    });

    try {
      // PAGENOVA_V7_9I_6F_INDEXEDDB_HANDOFF
      await savePageNovaProject(project.id, project);
      if (successfulImageGenerations > 0) {
        const remainingImageCredits = Math.max(
          0,
          availableImageCredits - successfulImageGenerations,
        );

        setAvailableImageCredits(remainingImageCredits);
      }


      window.sessionStorage.setItem(
        "lp-clone-current-project",
        project.id,
      );

      setMessage("Landing page criada. Abrindo o editor...");
      router.push(`/app/editor/${project.id}`);
    } catch {
      setMessage("Não foi possível criar o projeto. Tente novamente.");
      setIsGenerating(false);
    }
  }
  return (
    <>
      <AppHeader title="Gerador" description="Crie sua landing page em poucos passos." />

      <main className="mx-auto max-w-6xl px-6 py-10 lg:px-10">
        <div
          className="overflow-hidden rounded-[32px] border border-white/10 bg-[#0E0D13] shadow-[0_30px_100px_rgba(0,0,0,0.32)]"
          style={{ backgroundImage: `radial-gradient(circle at 12% 0%, ${glow}, transparent 34%), radial-gradient(circle at 100% 100%, ${glow}, transparent 30%)` }}
        >
          <div className="border-b border-white/10 px-6 py-6 md:px-9">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl text-white shadow-lg" style={{ background: `linear-gradient(135deg, ${accent}, #6333F5)` }}>
                  <Icon name="sparkles" className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.22em] text-neutral-500">PageNova AI</p>
                  <h1 className="text-xl font-bold text-white">Gerador Automático</h1>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {[1, 2, 3].map((item) => (
                  <div key={item} className="flex items-center gap-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full border text-sm font-bold transition" style={item <= step ? { borderColor: accent, backgroundColor: accent, color: "#fff" } : { borderColor: "rgba(255,255,255,0.10)", backgroundColor: "rgba(255,255,255,0.04)", color: "#737373" }}>{item}</div>
                    {item < 3 && <div className="h-px w-7 md:w-12" style={{ backgroundColor: item < step ? accent : "rgba(255,255,255,0.10)" }} />}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="p-6 md:p-9">
            {step === 1 && (
              <section>
                <div className="inline-flex items-center gap-2 rounded-full border border-[#875DFF]/20 bg-[#875DFF]/10 px-3 py-1.5 text-xs font-bold text-[#B9A7FF]">
                  <Icon name="sparkles" className="h-4 w-4" />
                  ESTRUTURA INTELIGENTE
                </div>
                <p className="mt-5 text-sm font-semibold" style={{ color: accent }}>PASSO 1 DE 3</p>
                <h2 className="mt-2 text-3xl font-bold tracking-tight text-white md:text-4xl">O que você quer vender?</h2>
                <p className="mt-3 max-w-2xl text-neutral-400">Escolha o tipo da sua oferta. A PageNova prepara automaticamente a estrutura ideal da landing page.</p>

                <div className="mt-8 grid gap-4 md:grid-cols-3">
                  {productTypes.map((type) => (
                    <button key={type.id} type="button" onClick={() => chooseProductType(type.id)} className="group relative min-h-[265px] overflow-hidden rounded-[24px] border border-white/10 bg-black/20 p-6 text-left transition duration-300 hover:-translate-y-1 hover:border-[#875DFF]/50 hover:bg-white/[0.04] hover:shadow-[0_20px_60px_rgba(117,87,255,0.12)]">
                      <div className="absolute -right-12 -top-12 h-36 w-36 rounded-full bg-[#875DFF]/10 blur-3xl transition group-hover:bg-[#875DFF]/20" />
                      <div className="relative">
                        <div className="flex items-start justify-between">
                          <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-gradient-to-br from-[#875DFF]/25 to-[#6333F5]/5 text-[#BBA9FF] shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]"><ProductIcon type={type.id} /></div>
                          <span className="rounded-full border border-white/10 bg-white/[0.03] px-2.5 py-1 text-[10px] font-bold tracking-wider text-neutral-500">AUTOMÁTICO</span>
                        </div>
                        <p className="mt-6 text-[10px] font-bold tracking-[0.16em] text-[#8C73FF]">{type.eyebrow}</p>
                        <h3 className="mt-2 text-xl font-bold text-white">{type.title}</h3>
                        <p className="mt-2 min-h-[48px] text-sm leading-6 text-neutral-500">{type.description}</p>
                        <div className="mt-5 flex items-center gap-2 text-sm font-bold text-[#A98FFF]">Selecionar <span className="transition-transform group-hover:translate-x-1">?</span></div>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {step === 2 && productType && (
              <section>
                <button type="button" onClick={() => setStep(1)} className="mb-6 flex items-center gap-2 text-sm font-semibold text-neutral-500 transition hover:text-white"><span>?</span> Voltar</button>

                <div className="flex flex-col gap-5 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: accent }}>PASSO 2 DE 3</p>
                    <h2 className="mt-2 text-3xl font-bold tracking-tight text-white md:text-4xl">Qual é a categoria?</h2>
                    <p className="mt-3 max-w-2xl text-neutral-400">A categoria define cores, atmosfera e identidade visual inicial da sua página.</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/[0.025] px-4 py-3">
                    <p className="text-[10px] font-bold tracking-[0.16em] text-neutral-600">TIPO SELECIONADO</p>
                    <p className="mt-1 font-semibold text-white">{selectedProductType?.title}</p>
                  </div>
                </div>

                <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {categories[productType].map((category) => (
                    <button key={category.id} type="button" onClick={() => chooseCategory(category.id)} className="group relative min-h-[190px] overflow-hidden rounded-[22px] border border-white/10 bg-black/20 p-5 text-left transition duration-300 hover:-translate-y-1" style={{ boxShadow: `inset 0 0 0 1px ${category.accent}20` }}>
                      <div className="absolute inset-x-0 top-0 h-1" style={{ background: `linear-gradient(90deg, ${category.accent}, transparent)` }} />
                      <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full blur-3xl transition group-hover:scale-125" style={{ backgroundColor: category.glow }} />
                      <div className="relative flex items-start justify-between">
                        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10" style={{ color: category.accent, background: `linear-gradient(135deg, ${category.accent}25, rgba(255,255,255,0.02))`, boxShadow: `0 10px 35px ${category.glow}` }}><Icon name={category.icon} /></div>
                        <span className="rounded-full border border-white/10 bg-black/20 px-2.5 py-1 text-[9px] font-bold tracking-wider text-neutral-600">IDENTIDADE IA</span>
                      </div>
                      <div className="relative mt-5">
                        <h3 className="text-base font-bold text-white">{category.label}</h3>
                        <p className="mt-1 text-sm text-neutral-500">{category.description}</p>
                        <div className="mt-4 flex items-center gap-1.5 text-xs font-semibold" style={{ color: category.accent }}>Usar esta identidade <span className="transition-transform group-hover:translate-x-1">?</span></div>
                      </div>
                    </button>
                  ))}
                </div>
              </section>
            )}

            {step === 3 && productType && selectedCategory && (
              <section>
                <button type="button" onClick={() => setStep(2)} className="mb-6 flex items-center gap-2 text-sm font-semibold text-neutral-500 transition hover:text-white"><span>?</span> Voltar</button>

                <div className="grid gap-7 lg:grid-cols-[1fr_340px]">
                  <div>
                    <p className="text-sm font-semibold" style={{ color: accent }}>PASSO 3 DE 3</p>
                    <h2 className="mt-2 text-3xl font-bold tracking-tight text-white md:text-4xl">Sua oferta está quase pronta.</h2>
                    <p className="mt-3 max-w-2xl text-neutral-400">Informe apenas o essencial. A PageNova monta a estrutura, cria os textos iniciais e prepara os CTAs automaticamente.</p>

                    <form onSubmit={handleSubmit} className="mt-8 grid gap-5">
                      <div className="rounded-[22px] border border-white/10 bg-black/20 p-5">
                        <label className="text-sm font-semibold text-neutral-200">Nome do produto</label>
                        <p className="mt-1 text-xs text-neutral-600">O nome principal que aparecerá na landing page.</p>
                        <input required name="productName" placeholder="Ex.: Método Venda Todo Dia" className="mt-4 h-14 w-full rounded-xl border border-white/10 bg-[#09090C] px-4 text-white outline-none transition placeholder:text-neutral-700 focus:border-white/20" style={{ caretColor: accent }} />
                      </div>

                      <div className="grid gap-6">
                        <div className="rounded-[22px] border border-white/10 bg-black/20 p-5">
                          <label className="text-sm font-semibold text-neutral-200">Preço</label>
                          <p className="mt-1 text-xs text-neutral-600">Valor principal da oferta.</p>
                          <input required name="price" placeholder="R$ 47,00" className="mt-4 h-14 w-full rounded-xl border border-white/10 bg-[#09090C] px-4 text-white outline-none transition placeholder:text-neutral-700 focus:border-white/20" style={{ caretColor: accent }} />
                        </div>

                        
              {/* PAGENOVA_PRODUCT_DESCRIPTION */}
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <label className="text-sm font-bold text-white">
                    Descrição do produto
                  </label>

                  <span
                    className="rounded-full border px-2.5 py-1 text-[9px] font-black uppercase tracking-[0.08em]"
                    style={{
                      borderColor: `${accent}30`,
                      backgroundColor: `${accent}10`,
                      color: accent,
                    }}
                  >
                    importante para a IA
                  </span>
                </div>

                <textarea
                  name="productDescription"
                  value={productDescription}
                  onChange={(event) => setProductDescription(event.target.value)}
                  rows={5}
                  maxLength={1200}
                  required
                  placeholder="Explique o que é o produto, o que a pessoa recebe, para que serve e quais são os principais diferenciais."
                  className="w-full resize-none rounded-2xl border border-white/[0.08] bg-black/30 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-neutral-600 focus:border-white/20"
                />

                <div className="flex items-start justify-between gap-4">
                  <p className="max-w-[470px] text-[10px] leading-4 text-neutral-600">
                    Quanto melhor a descrição, mais específica será a copy e, depois, as imagens da landing page.
                  </p>

                  <span className="shrink-0 text-[10px] text-neutral-600">
                    {productDescription.length}/1200
                  </span>
                </div>
              </div>
<div className="rounded-[22px] border border-white/10 bg-black/20 p-5">
                          <label className="text-sm font-semibold text-neutral-200">Garantia</label>
                          <p className="mt-1 text-xs text-neutral-600">Escolha o período da oferta.</p>
                          <div className="mt-4 flex gap-2">
                            {["7", "15", "30"].map((days) => (
                              <button key={days} type="button" onClick={() => setGuarantee(days)} className="min-w-0 flex-1 rounded-xl border px-3 py-3 text-sm font-bold transition" style={guarantee === days ? { borderColor: accent, backgroundColor: `${accent}18`, color: "#fff" } : { borderColor: "rgba(255,255,255,0.10)", backgroundColor: "rgba(0,0,0,0.20)", color: "#737373" }}>{days} dias</button>
                            ))}
                          </div>
                          <input type="hidden" name="guarantee" value={guarantee} />
                        </div>
                      </div>

                          
              
              {/* PAGENOVA_VISUAL_INTENT */}
              <div
                className="rounded-[22px] border p-5"
                style={{
                  borderColor: `${accent}25`,
                  background: "rgba(255,255,255,0.018)",
                }}
              >
                <div className="mb-4">
                  <p className="text-sm font-bold text-white">
                    Como você quer apresentar o produto?
                  </p>

                  <p className="mt-1 text-xs leading-5 text-neutral-500">
                    A PageNova usará esta preferência para planejar o mockup e as imagens da landing page.
                  </p>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                  {[
                    ["ai-decides", "Deixar a IA decidir"],
                    ["notebook", "Mockup em notebook"],
                    ["phone", "Mockup em celular"],
                    ["notebook-phone", "Notebook + celular"],
                    ["course", "Área de membros / curso"],
                    ["digital-kit", "Kit digital 3D"],
                  ].map(([value, label]) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setMockupPreference(value)}
                      className="rounded-xl border px-3 py-3 text-left text-xs font-semibold transition hover:-translate-y-0.5"
                      style={
                        mockupPreference === value
                          ? {
                              borderColor: accent,
                              backgroundColor: `${accent}16`,
                              color: "#ffffff",
                            }
                          : {
                              borderColor: "rgba(255,255,255,0.08)",
                              backgroundColor: "rgba(0,0,0,0.18)",
                              color: "#737373",
                            }
                      }
                    >
                      {label}
                    </button>
                  ))}
                </div>

                <div className="mt-4">
                  <label className="text-xs font-bold text-neutral-300">
                    Instruções visuais
                    <span className="ml-1 font-normal text-neutral-600">
                      (opcional)
                    </span>
                  </label>

                  <textarea
                    value={visualInstructions}
                    onChange={(event) => setVisualInstructions(event.target.value)}
                    rows={3}
                    maxLength={600}
                    placeholder="Ex.: notebook mostrando uma plataforma de SaaS, celular ao lado, aparência premium, sem pessoas."
                    className="mt-2 w-full resize-none rounded-xl border border-white/[0.08] bg-black/25 px-4 py-3 text-xs leading-5 text-white outline-none transition placeholder:text-neutral-600 focus:border-white/20"
                  />

                  <div className="mt-2 text-right text-[9px] text-neutral-600">
                    {visualInstructions.length}/600
                  </div>
                </div>
              </div>
{/* PAGENOVA_AI_IMAGE_SELECTOR */}
              <div
                className="rounded-[22px] border p-5"
                style={{
                  borderColor: `${accent}35`,
                  background: `linear-gradient(135deg, ${accent}10, rgba(255,255,255,0.015))`,
                }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                    style={{
                      backgroundColor: `${accent}18`,
                      color: accent,
                    }}
                  >
                    <Icon name="sparkles" className="h-5 w-5" />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-bold text-white">
                          Imagens com IA
                        </p>

                        <p className="mt-1 max-w-[430px] text-xs leading-5 text-neutral-500">
                          Escolha quantas imagens exclusivas a PageNova deverá gerar para sua landing page.
                        </p>
                      </div>

                      <div
                        className="rounded-full border px-3 py-1.5 text-[10px] font-bold"
                        style={{
                          borderColor: `${accent}35`,
                          backgroundColor: `${accent}12`,
                          color: accent,
                        }}
                      >
                        30 créditos incluídos
                      </div>
                    </div>

                    <div className="mt-6 grid grid-cols-5 gap-2 sm:gap-3">
                      {([0, 1, 2, 3, 4] as const).map((count) => (
                        <button
                          key={count}
                          type="button"
                          onClick={() => setImageCount(count)}
                          className="relative min-w-0 rounded-xl border px-2 py-3 text-center transition duration-200 hover:-translate-y-0.5"
                          style={
                            imageCount === count
                              ? {
                                  borderColor: accent,
                                  backgroundColor: `${accent}18`,
                                  color: "#ffffff",
                                  boxShadow: `0 8px 24px ${accent}18`,
                                }
                              : {
                                  borderColor: "rgba(255,255,255,0.10)",
                                  backgroundColor: "rgba(0,0,0,0.20)",
                                  color: "#737373",
                                }
                          }
                        >
                          <span className="block text-base font-black">
                            {count}
                          </span>

                          <span className="mt-1 block text-[8px] font-semibold uppercase tracking-[0.04em] sm:text-[9px]">
                            {count === 1 ? "imagem" : "imagens"}
                          </span>

                          {count === 3 && (
                            <span
                              className="absolute -right-1.5 -top-2 rounded-full px-1.5 py-0.5 text-[7px] font-black uppercase tracking-[0.08em] text-white"
                              style={{ backgroundColor: accent }}
                            >
                              ideal
                            </span>
                          )}
                        </button>
                      ))}
                    </div>

                    <div className="mt-5 rounded-2xl border border-white/[0.06] bg-black/20 p-4">
                      {imageCount === 0 && (
                        <p className="text-[11px] leading-5 text-neutral-500">
                          Sem imagens geradas por IA. Nenhum crédito será utilizado.
                        </p>
                      )}

                      {imageCount === 1 && (
                        <p className="text-[11px] leading-5 text-neutral-400">
                          <b className="text-white">1 imagem:</b> visual principal do Hero.
                        </p>
                      )}

                      {imageCount === 2 && (
                        <p className="text-[11px] leading-5 text-neutral-400">
                          <b className="text-white">2 imagens:</b> Hero + visual contextual de conteúdo.
                        </p>
                      )}

                      {imageCount === 3 && (
                        <p className="text-[11px] leading-5 text-neutral-400">
                          <b className="text-white">3 imagens:</b> Hero + conteúdo + oferta.
                        </p>
                      )}

                      {imageCount === 4 && (
                        <p className="text-[11px] leading-5 text-neutral-400">
                          <b className="text-white">4 imagens:</b> Hero + conteúdo + bônus + oferta.
                        </p>
                      )}
                    </div>

                    <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-[10px]">
                      <span className="text-neutral-600">
                        Cada imagem gerada com sucesso utilizará 1 crédito.
                      </span>

                      <span className="font-bold" style={{ color: accent }}>
                        Esta página solicitará {imageCount} {imageCount === 1 ? "crédito" : "créditos"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
<div>
                            <p className="text-base font-bold text-white">A PageNova cuida do restante</p>
                            <div className="mt-4 grid gap-3 md:grid-cols-2">
                              <Feature accent={accent}>Copy inicial da página</Feature>
                              <Feature accent={accent}>Descrição automática</Feature>
                              <Feature accent={accent}>CTA automático</Feature>
                              <Feature accent={accent}>Estrutura de conversão</Feature>
                            </div>
                            <p className="mt-4 text-xs leading-5 text-neutral-600">Depois de gerar, você poderá alterar qualquer texto diretamente no editor.</p>
                          </div>

                      <button type="submit" className="mt-1 flex h-15 w-full items-center justify-center gap-2 rounded-xl px-8 font-bold text-white shadow-lg transition hover:-translate-y-0.5 md:w-auto md:justify-self-start" style={{ background: `linear-gradient(90deg, ${accent}, #6333F5)`, boxShadow: `0 14px 40px ${glow}` }}>
                        <Icon name="sparkles" className="h-5 w-5" />
                        Gerar minha Landing Page
                      </button>

                      {message && <div className="rounded-xl border border-white/10 bg-white/[0.03] p-4 text-sm text-neutral-300">{message}</div>}
                    </form>
                  </div>

                  <aside className="lg:pt-16">
                    <div className="sticky top-6 overflow-hidden rounded-[24px] border border-white/10 bg-black/20">
                      <div className="h-1.5" style={{ background: `linear-gradient(90deg, ${accent}, transparent)` }} />
                      <div className="p-5">
                        <p className="text-[10px] font-bold tracking-[0.18em] text-neutral-600">SUA CONFIGURAÇÃO</p>
                        <div className="mt-5 flex items-center gap-3">
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10" style={{ backgroundColor: `${accent}15`, color: accent }}><Icon name={selectedCategory.icon} /></div>
                          <div>
                            <p className="text-xs text-neutral-600">{selectedProductType?.title}</p>
                            <p className="font-bold text-white">{selectedCategory.label}</p>
                          </div>
                        </div>
                        <div className="my-5 h-px bg-white/[0.07]" />
                        <p className="text-xs font-semibold text-neutral-500">Identidade visual</p>

                {/* PAGENOVA_CUSTOM_COLOR_PICKER */}
                <div className="mt-4 rounded-2xl border border-white/10 bg-black/20 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-white">Escolha sua cor</p>
                      <p className="mt-1 text-[11px] leading-5 text-neutral-500">
                        A PageNova adapta botões, luzes, bordas, elementos 3D e animações ? sua identidade.
                      </p>
                    </div>

                    <div
                      className="h-10 w-10 shrink-0 rounded-xl border border-white/15 shadow-lg"
                      style={{
                        background: accent,
                        boxShadow: `0 0 24px ${accent}55`,
                      }}
                    />
                  </div>

                  <div className="mt-4 grid grid-cols-6 gap-2">
                    {[
                      "#8457FF",
                      "#2563EB",
                      "#06B6D4",
                      "#10B981",
                      "#F59E0B",
                      "#EF4444",
                      "#EC4899",
                      "#F97316",
                      "#14B8A6",
                      "#6366F1",
                      "#A855F7",
                      "#EAB308",
                    ].map((color) => (
                      <button
                        key={color}
                        type="button"
                        aria-label={`Selecionar cor ${color}`}
                        onClick={() => setCustomAccent(color)}
                        className="relative aspect-square rounded-xl border transition hover:-translate-y-0.5 hover:scale-105"
                        style={{
                          background: color,
                          borderColor:
                            accent.toLowerCase() === color.toLowerCase()
                              ? "#ffffff"
                              : "rgba(255,255,255,0.10)",
                          boxShadow:
                            accent.toLowerCase() === color.toLowerCase()
                              ? `0 0 0 2px #09090b, 0 0 22px ${color}75`
                              : "none",
                        }}
                      >
                        {accent.toLowerCase() === color.toLowerCase() && (
                          <span className="absolute inset-0 flex items-center justify-center text-[11px] font-black text-white">
                            ?
                          </span>
                        )}
                      </button>
                    ))}
                  </div>

                  <div className="mt-4 flex items-center gap-3">
                    <label
                      className="flex h-10 cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-white/[0.03] px-3 text-[11px] font-semibold text-neutral-300 transition hover:border-white/20"
                    >
                      <input
                        type="color"
                        value={accent}
                        onChange={(event) => setCustomAccent(event.target.value)}
                        className="h-5 w-5 cursor-pointer border-0 bg-transparent p-0"
                      />
                      Cor personalizada
                    </label>

                    {customAccent && (
                      <button
                        type="button"
                        onClick={() => setCustomAccent(null)}
                        className="text-[10px] font-bold uppercase tracking-[0.12em] text-neutral-500 transition hover:text-white"
                      >
                        Usar recomendada
                      </button>
                    )}
                  </div>
                </div>                        <div className="mt-3 flex gap-2">
                          <span className="h-7 flex-1 rounded-lg" style={{ backgroundColor: accent }} />
                          <span className="h-7 flex-1 rounded-lg bg-[#15131D]" />
                          <span className="h-7 flex-1 rounded-lg bg-white" />
                        </div>
                        <div className="mt-5 space-y-3">
                          <Feature accent={accent}>Layout responsivo</Feature>
                          <Feature accent={accent}>Seções pré-estruturadas</Feature>
                          <Feature accent={accent}>Editável após gerar</Feature>
                        </div>
                      </div>
                    </div>
                  </aside>
                </div>
              </section>
            )}
          </div>
        </div>
      </main>
    </>
  );
}



