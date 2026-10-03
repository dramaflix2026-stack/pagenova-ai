/**
 * Registry de movimento.
 *
 * A IA escolhe um ID desta lista. Ela NUNCA escreve uma timeline: aceitar
 * codigo de animacao gerado seria executar codigo arbitrario na pagina do
 * cliente, e nenhum ganho visual paga esse risco.
 *
 * Cada preset declara o que a especificacao (secao 14.2) exige: alvo, duracao,
 * easing, gatilho, comportamento no celular, fallback de reduced-motion,
 * limpeza e custo. Esses campos nao sao documentacao -- o runtime le alguns
 * deles, o linter cobra outros e o editor mostra o custo antes de aplicar.
 *
 * Duas regras absolutas, verificadas por teste:
 *
 *  1. Nenhum preset esconde conteudo. O CSS de entrada so vale sob a classe
 *     `js`, que o proprio runtime adiciona -- sem JavaScript, tudo ja nasce
 *     visivel;
 *  2. Todo preset degrada para "aparece imediatamente" quando o visitante pede
 *     menos movimento.
 */

export const MOTION_PRESETS = [
  'none',
  'fade-in',
  'fade-up-soft',
  'stagger-cards',
  'text-lines-reveal',
  'image-mask-reveal',
  'parallax-subtle',
  'counter-on-view',
  'header-condense-on-scroll',
  'section-background-shift',
  'cta-gradient-flow',
  'progress-indicator',
] as const;
export type MotionPresetId = (typeof MOTION_PRESETS)[number];

/**
 * Onde o preset roda.
 *
 * `enter`     dispara uma vez, quando a secao entra na tela;
 * `scrub`     acompanha a posicao do scroll de forma continua;
 * `ambient`   roda sozinho, sem depender de scroll (gradiente, por exemplo);
 * `global`    nao pertence a uma secao (cabecalho, barra de progresso).
 */
export type MotionTrigger = 'enter' | 'scrub' | 'ambient' | 'global';

export interface MotionPresetSpec {
  id: MotionPresetId;
  /** Descricao curta que vai ao prompt, junto do registry de componentes. */
  description: string;
  trigger: MotionTrigger;
  /** Seletor relativo a secao. Vazio significa a propria secao. */
  target: string;
  durationMs: number;
  easing: string;
  /**
   * O que acontece no celular.
   *
   * `same`    identico ao desktop;
   * `reduced` versao mais curta ou menor deslocamento;
   * `off`     desligado -- parallax e scrub custam caro em aparelho fraco.
   */
  mobile: 'same' | 'reduced' | 'off';
  /** Custo relativo de CPU. `high` nunca entra como padrao de nenhuma variante. */
  cost: 'low' | 'medium' | 'high';
  /**
   * Precisa de motor com timeline (GSAP)?
   *
   * `false` significa que o motor nativo -- CSS, IntersectionObserver e Web
   * Animations -- da conta sozinho, sem nenhuma dependencia externa.
   */
  needsTimelineEngine: boolean;
}

export const MOTION_REGISTRY: readonly MotionPresetSpec[] = [
  {
    id: 'none',
    description: 'Sem animacao. O conteudo simplesmente aparece.',
    trigger: 'enter',
    target: '',
    durationMs: 0,
    easing: 'linear',
    mobile: 'same',
    cost: 'low',
    needsTimelineEngine: false,
  },
  {
    id: 'fade-in',
    description: 'Aparecimento suave, sem deslocamento.',
    trigger: 'enter',
    target: '',
    durationMs: 600,
    easing: 'cubic-bezier(.22,.61,.36,1)',
    mobile: 'same',
    cost: 'low',
    needsTimelineEngine: false,
  },
  {
    id: 'fade-up-soft',
    description: 'Sobe alguns pixels enquanto aparece. O padrao discreto.',
    trigger: 'enter',
    target: '',
    durationMs: 700,
    easing: 'cubic-bezier(.22,.61,.36,1)',
    mobile: 'same',
    cost: 'low',
    needsTimelineEngine: false,
  },
  {
    id: 'stagger-cards',
    description: 'Os itens de uma grade entram em cascata, com atraso curto entre eles.',
    trigger: 'enter',
    target: '[data-animate-stagger] > *',
    durationMs: 600,
    easing: 'cubic-bezier(.22,.61,.36,1)',
    mobile: 'reduced',
    cost: 'low',
    needsTimelineEngine: false,
  },
  {
    id: 'text-lines-reveal',
    description: 'O titulo aparece em blocos, como linhas que sobem por tras de uma mascara.',
    trigger: 'enter',
    target: 'h1, h2, .lead',
    durationMs: 800,
    easing: 'cubic-bezier(.16,1,.3,1)',
    mobile: 'reduced',
    cost: 'low',
    needsTimelineEngine: false,
  },
  {
    id: 'image-mask-reveal',
    description: 'A imagem e revelada por uma mascara que desliza, em vez de apenas surgir.',
    trigger: 'enter',
    target: 'img',
    durationMs: 900,
    easing: 'cubic-bezier(.16,1,.3,1)',
    mobile: 'reduced',
    cost: 'medium',
    needsTimelineEngine: false,
  },
  {
    id: 'parallax-subtle',
    description: 'Leve deslocamento da imagem conforme a pagina rola. Discreto, nunca chamativo.',
    trigger: 'scrub',
    // Desligado no celular de proposito: scrub em aparelho fraco derruba os
    // quadros e o ganho visual e minimo em tela pequena.
    target: 'img',
    durationMs: 0,
    easing: 'linear',
    mobile: 'off',
    cost: 'high',
    needsTimelineEngine: false,
  },
  {
    id: 'counter-on-view',
    description: 'Os numeros contam de zero ate o valor quando a secao entra na tela.',
    trigger: 'enter',
    target: '[data-count]',
    durationMs: 1400,
    easing: 'cubic-bezier(.22,.61,.36,1)',
    mobile: 'same',
    cost: 'medium',
    needsTimelineEngine: false,
  },
  {
    id: 'header-condense-on-scroll',
    description: 'O cabecalho encolhe e ganha fundo depois dos primeiros pixels de rolagem.',
    trigger: 'global',
    target: '.site-header',
    durationMs: 250,
    easing: 'ease-out',
    mobile: 'same',
    cost: 'low',
    needsTimelineEngine: false,
  },
  {
    id: 'section-background-shift',
    description: 'O fundo da secao muda de tom lentamente enquanto ela ocupa a tela.',
    trigger: 'scrub',
    target: '',
    durationMs: 0,
    easing: 'linear',
    mobile: 'off',
    cost: 'medium',
    needsTimelineEngine: false,
  },
  {
    id: 'cta-gradient-flow',
    description: 'O gradiente do botao principal se move devagar, sem piscar nem chamar demais.',
    trigger: 'ambient',
    target: '.btn-primary',
    durationMs: 6000,
    easing: 'linear',
    mobile: 'same',
    cost: 'low',
    needsTimelineEngine: false,
  },
  {
    id: 'progress-indicator',
    description: 'Barra fina no topo mostrando o quanto da pagina ja foi lido.',
    trigger: 'global',
    target: '[data-progress]',
    durationMs: 0,
    easing: 'linear',
    mobile: 'same',
    cost: 'low',
    needsTimelineEngine: false,
  },
];

const BY_ID = new Map(MOTION_REGISTRY.map((preset) => [preset.id, preset]));

export const findMotionPreset = (id: string): MotionPresetSpec | null => BY_ID.get(id as MotionPresetId) ?? null;

/**
 * Presets permitidos conforme o nivel de movimento do briefing.
 *
 * `NONE` nao e "quase nada": e nada mesmo. Quem escolheu sem animacao nao quer
 * um fade discreto de consolacao.
 */
export function presetsForLevel(level: 'NONE' | 'SUBTLE' | 'BALANCED'): MotionPresetId[] {
  if (level === 'NONE') return ['none'];

  if (level === 'SUBTLE') {
    // Nada de scrub nem contador: sutil quer dizer que o visitante quase nao
    // percebe que houve animacao.
    return MOTION_REGISTRY.filter(
      (preset) => preset.trigger === 'enter' && preset.cost === 'low',
    ).map((preset) => preset.id);
  }

  return MOTION_REGISTRY.filter((preset) => preset.cost !== 'high').map((preset) => preset.id);
}

/** Representacao compacta para o prompt, no mesmo formato do registry visual. */
export function motionForPrompt(level: 'NONE' | 'SUBTLE' | 'BALANCED'): string {
  const permitidos = new Set(presetsForLevel(level));

  return MOTION_REGISTRY.filter((preset) => permitidos.has(preset.id))
    .map((preset) => `${preset.id}: ${preset.description}`)
    .join('\n');
}
