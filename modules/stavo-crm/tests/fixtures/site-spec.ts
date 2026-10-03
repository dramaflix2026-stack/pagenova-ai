/**
 * SiteSpecs de teste: saidas plausiveis do modelo, sem gastar credito.
 *
 * Servem para exercitar o caminho inteiro -- conversao, montagem, contraste,
 * linter e renderizacao -- e para comparar nichos visualmente diferentes sem
 * depender da rede. Nao substituem o teste com a API real, que so verifica a
 * qualidade da SAIDA do modelo.
 */
import type { SiteSpec, SpecSection } from '@builder/generation/site-spec';

type SectionInput = Partial<SpecSection> & Pick<SpecSection, 'type' | 'variant'>;

/** Preenche o formato completo: texto ausente e "", lista ausente e []. */
export function specSection(input: SectionInput): SpecSection {
  const emptyCta = { intent: 'none' as const, label: '', whatsappMessage: '' };
  return {
    motionPreset: 'fade-up-soft',
    background: 'DEFAULT',
    eyebrow: '',
    headline: '',
    subheadline: '',
    paragraphs: [],
    items: [],
    faq: [],
    bullets: [],
    image: 'none',
    gallery: [],
    primaryCta: emptyCta,
    secondaryCta: emptyCta,
    submitLabel: '',
    tagline: '',
    ...input,
  };
}

const item = (title: string, body: string, icon = 'none') => ({ title, body, icon, image: 'none' });

export interface SpecFixtureOptions {
  sections?: SpecSection[];
  palette?: Partial<SiteSpec['palette']>;
  typography?: Partial<SiteSpec['typography']>;
  visualDirection?: Partial<SiteSpec['visualDirection']>;
}

/** SiteSpec valido minimo, com hero, servicos, FAQ, CTA e rodape. */
export function specFixture(options: SpecFixtureOptions = {}): SiteSpec {
  return {
    concept: {
      name: 'Consultorio de luz clara',
      idea: 'Atendimento odontologico proximo, sem pressa e com explicacao do que sera feito.',
      audience: 'Familias do bairro que adiam a consulta por medo de dentista.',
      toneOfVoice: 'Calmo, direto, sem jargao tecnico.',
      narrative: 'Comeca acolhendo o receio, mostra como e a consulta e termina convidando a agendar.',
    },
    visualDirection: {
      mood: ['claro', 'calmo', 'limpo'],
      mode: 'LIGHT',
      shape: 'SOFT',
      density: 'BALANCED',
      elevation: 'SOFT',
      borderWidth: '1',
      buttonStyle: 'SOLID',
      iconStyle: 'LINE',
      imageTreatment: 'ROUNDED',
      headerVariant: 'inline-right',
      compositionRationale: 'Alterna fundo claro e superficie para dar ritmo sem cansar.',
      photographyTreatment: 'Fotos reais do consultorio, luz natural.',
      ...options.visualDirection,
    },
    palette: {
      background: '#FBFAF7',
      surface: '#FFFFFF',
      text: '#1B2430',
      muted: '#5B6675',
      primary: '#0F6E63',
      primaryForeground: '#FFFFFF',
      accent: '#E4A951',
      accentForeground: '#1B2430',
      border: '#E2E0DA',
      rationale: 'Verde profundo transmite cuidado sem o clima de consultorio frio.',
      ...options.palette,
    },
    typography: {
      headingFont: 'Fraunces',
      bodyFont: 'Inter',
      scale: 'BALANCED',
      headingWeight: '600',
      rationale: 'Serifa com calor no titulo e sans neutra no corpo.',
      ...options.typography,
    },
    sections: options.sections ?? [
      specSection({
        type: 'hero',
        variant: 'centered-statement',
        eyebrow: 'Odontologia de bairro',
        headline: 'Um dentista que explica cada passo antes de comecar',
        subheadline: 'Atendimento sem pressa, com horarios que cabem na sua rotina.',
        primaryCta: { intent: 'whatsapp', label: 'Agendar avaliacao', whatsappMessage: 'Oi! Quero agendar uma avaliacao.' },
      }),
      specSection({
        type: 'services',
        variant: 'cards-3col',
        headline: 'O que resolvemos no dia a dia',
        background: 'SURFACE',
        items: [
          item('Limpeza e prevencao', 'Consulta de rotina com orientacao de higiene.', 'sparkles'),
          item('Clareamento', 'Avaliacao antes, para evitar sensibilidade.', 'star'),
          item('Ortodontia', 'Acompanhamento mes a mes, com ajustes previstos.', 'clipboard-list'),
        ],
      }),
      specSection({
        type: 'faq',
        variant: 'accordion-single',
        headline: 'Duvidas que chegam toda semana',
        faq: [
          { question: 'A primeira consulta demora?', answer: 'Reservamos cerca de 40 minutos para conversar e avaliar.' },
          { question: 'Atendem aos sabados?', answer: 'Sim, pela manha, com agenda reduzida.' },
        ],
      }),
      specSection({
        type: 'cta',
        variant: 'centered-band',
        headline: 'Quer tirar uma duvida antes de marcar?',
        background: 'PRIMARY',
        paragraphs: ['Mande uma mensagem: respondemos no mesmo dia.'],
        primaryCta: { intent: 'whatsapp', label: 'Falar no WhatsApp', whatsappMessage: 'Oi! Tenho uma duvida.' },
      }),
      specSection({ type: 'footer', variant: 'simple-centered', tagline: 'Odontologia com calma, perto de voce.' }),
    ],
    motionPlan: { smoothScroll: false, rationale: 'Movimento discreto, so na entrada das secoes.' },
    seo: {
      title: 'Clinica Aurora | Odontologia em Campinas',
      description:
        'Consultorio odontologico em Campinas com atendimento sem pressa, avaliacao explicada passo a passo e horarios flexiveis.',
      jsonLdType: 'LocalBusiness',
    },
    cta: { primaryLabel: 'Agendar avaliacao', whatsappMessage: 'Oi! Quero agendar uma avaliacao.', headerLabel: 'Agendar' },
    businessSummary: 'Consultorio odontologico de bairro, com foco em rotina preventiva e atendimento acolhedor.',
    entitySummary: 'Clinica odontologica em Campinas, atendimento familiar e preventivo.',
    servicesSummary: ['Limpeza e prevencao', 'Clareamento', 'Ortodontia'],
    missingData: [],
  };
}
