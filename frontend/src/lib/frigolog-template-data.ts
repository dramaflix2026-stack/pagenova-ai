/**
 * PageNova universal template content contract.
 * The FRIGOLOG visual structure remains fixed; only data is personalized.
 * This module is deliberately independent from the rendered template until
 * the integration adapter has been tested.
 */
export type TemplateImage = { src: string; alt: string };
export type TemplateBenefit = { title: string; description: string };
export type TemplateService = { title: string; description: string };
export type UniversalSiteData = {
  brand: { name: string; tagline: string; logoUrl?: string };
  palette: { primary: string; accent: string; background: string; foreground: string };
  hero: { eyebrow: string; title: string; description: string; image: TemplateImage; ctaLabel: string };
  highlights: [TemplateBenefit, TemplateBenefit, TemplateBenefit, TemplateBenefit];
  services: { eyebrow: string; heading: string; items: [TemplateService, TemplateService, TemplateService, TemplateService] };
  about: { eyebrow: string; heading: string; paragraphs: [string, string]; benefits: [string, string, string]; image: TemplateImage; ctaLabel: string };
  coverage: { eyebrow: string; heading: string; description: string; image: TemplateImage };
  contact: { eyebrow: string; heading: string; description: string; ctaLabel: string; ctaUrl: string };
  footer: { copyright: string };
};
export const frigologReferenceData: UniversalSiteData = {
  brand: { name: "FRIGOLOG", tagline: "LOGÍSTICA FRIGORÍFICA · SÃO PAULO" },
  palette: { primary: "#315b82", accent: "#4cb38d", background: "#f4f7fa", foreground: "#1b2b39" },
  hero: {
    eyebrow: "CADEIA DO FRIO SEM INTERRUPÇÃO",
    title: "A temperatura certa, do seu frigorífico até o destino.",
    description: "Transporte refrigerado, armazenagem em câmaras frias e distribuição em toda a São Paulo — com a temperatura monitorada em cada quilômetro.",
    image: { src: "/lovable/frigolog/cold-storage.jpg", alt: "Operação frigorífica" },
    ctaLabel: "Solicitar cotação"
  },
  highlights: [
    { title: "24/7", description: "Monitoramento de temperatura" },
    { title: "−18 °C a +4 °C", description: "Faixa controlada em toda a operação" },
    { title: "Frota própria", description: "Baús e carretas refrigerados" },
    { title: "SP inteira", description: "Capital, ABC, interior e litoral" }
  ],
  services: {
    eyebrow: "O QUE FAZEMOS",
    heading: "Da doca fria do frigorífico à doca do seu cliente.",
    items: [
      { title: "Transporte refrigerado", description: "Congelados e refrigerados viajando com a temperatura certa." },
      { title: "Armazenagem frigorífica", description: "Câmaras frias em SP, prontas para o seu estoque." },
      { title: "Distribuição em SP", description: "Capital, ABC, interior e litoral — com janela agendada." },
      { title: "Rastreabilidade e compliance", description: "Cada viagem com histórico completo de temperatura." }
    ]
  },
  about: {
    eyebrow: "QUEM SOMOS",
    heading: "Operação de frio não é tarefa para amador.",
    paragraphs: [
      "A Frigolog nasceu em São Paulo para resolver o gargalo mais crítico da indústria de carnes: manter a cadeia do frio intacta entre a saída do frigorífico e a chegada ao cliente. Trabalhamos com processos documentados, equipe treinada para câmara fria e equipamentos dimensionados para cargas pesadas.",
      "Não terceirizamos o elo mais sensível da sua operação. Quem cuida da sua carga somos nós — com registro de tudo."
    ],
    benefits: [
      "Frota própria, sem terceirização da cadeia do frio",
      "Registros de temperatura prontos para auditoria",
      "Equipe treinada para carga e descarga em câmara"
    ],
    image: { src: "/lovable/frigolog/team.jpg", alt: "Equipe de operação" },
    ctaLabel: "Conheça a operação"
  },
  coverage: {
    eyebrow: "FROTA E COBERTURA",
    heading: "Onde sua carga precisa chegar, nós vamos — com frio.",
    description: "Operação baseada na Grande São Paulo, com atendimento à capital, ABC, interior e litoral. Frota dimensionada de baús refrigerados a carretas frigoríficas, conforme o volume e a distância da sua operação.",
    image: { src: "/lovable/frigolog/fleet.jpg", alt: "Frota frigorífica" }
  },
  contact: {
    eyebrow: "VAMOS OPERAR JUNTOS?",
    heading: "Sua carga não pode esperar fora da temperatura.",
    description: "Conte para a gente o volume, a faixa de temperatura e os destinos. Retornamos em breve com uma proposta.",
    ctaLabel: "Solicitar cotação",
    ctaUrl: "#contato"
  },
  footer: { copyright: "© 2026 Frigolog — Logística frigorífica. Todos os direitos reservados." }
};

/** Protects layout stability by requiring all content slots to be populated. */
export function validateUniversalSiteData(value: UniversalSiteData): string[] {
  const errors: string[] = [];
  const required = [
    value.brand.name, value.brand.tagline, value.hero.title, value.hero.description,
    value.hero.image.src, value.hero.ctaLabel, value.services.heading,
    value.about.heading, value.coverage.heading, value.contact.heading,
    value.contact.ctaLabel, value.contact.ctaUrl
  ];
  if (required.some(v => typeof v !== "string" || !v.trim())) errors.push("Missing required template content");
  if (value.highlights.length !== 4 || value.services.items.length !== 4 ||
      value.about.benefits.length !== 3 || value.about.paragraphs.length !== 2) {
    errors.push("Template slot counts must match the approved FRIGOLOG layout");
  }
  for (const color of Object.values(value.palette)) {
    if (!/^#[0-9a-fA-F]{6}$/.test(color)) errors.push("Palette colors must be six-digit hex values");
  }
  if (!/^(https?:\/\/|\/|#)/.test(value.contact.ctaUrl)) errors.push("Invalid CTA destination");
  return errors;
}
