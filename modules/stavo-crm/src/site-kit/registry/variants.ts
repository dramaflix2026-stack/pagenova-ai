/**
 * Registry de componentes.
 *
 * Cada variante que o renderer sabe desenhar esta declarada aqui, com os
 * limites que ela aguenta. O registry serve a tres consumidores:
 *
 *  - a IA recebe uma versao COMPACTA disto no prompt e escolhe entre estes
 *    ids. E o que permite variedade sem deixar o modelo inventar componente;
 *  - o editor usa os limites para saber quais variantes podem receber a
 *    quantidade de itens que a secao tem hoje;
 *  - o linter recusa uma combinacao impossivel antes de ela virar layout
 *    quebrado na tela do cliente.
 *
 * O prompt NUNCA recebe o codigo dos componentes -- so estes metadados.
 */
import type { MotionPresetId } from '@site-kit/schemas/site-schema';
import type { SectionType } from '@site-kit/schemas/site-schema';

export interface VariantSpec {
  /**
   * Id estavel e UNICO EM TODO O CATALOGO, nao apenas dentro da familia.
   *
   * A secao guarda so `variant` no schema, sem o tipo junto, entao dois ids
   * iguais em familias diferentes fariam a busca devolver a variante errada --
   * foi exatamente o que aconteceu com um `rail-scroll` que existia em galeria
   * e em depoimentos. Um teste trava esta unicidade.
   *
   * Trocar um id quebra sites ja publicados.
   */
  id: string;
  type: SectionType;
  /** Frase curta que a IA le para escolher. Descreve a COMPOSICAO. */
  description: string;
  minItems: number;
  maxItems: number;
  /** A variante precisa de imagem para nao parecer vazia? */
  requiresImage: boolean;
  supportsImage: boolean;
  /** Densidades em que a composicao funciona. */
  densities: ReadonlyArray<'AIRY' | 'BALANCED' | 'COMPACT'>;
  motionPresets: readonly MotionPresetId[];
  status: 'STABLE' | 'EXPERIMENTAL';
  version: number;
}

/**
 * Catalogo: 73 variantes de secao, mais 5 de cabecalho em `HEADER_VARIANTS`.
 *
 * Sao exatamente as metas da secao 10.3 da especificacao, e `site-registry`
 * tem um teste que trava esses numeros: baixar uma meta exige mexer no teste,
 * o que obriga a decisao a ser consciente.
 *
 * O criterio de "variante" adotado, e cobrado na revisao: duas variantes so
 * contam como distintas quando mudam COMPOSICAO, hierarquia ou comportamento.
 * Alinhamento, cor e raio sao tokens, nao variantes -- duplicar uma variante
 * trocando `text-align` inflaria o numero sem dar ao usuario nenhuma escolha
 * real.
 *
 * Uma variante so entra aqui quando o renderer sabe desenha-la de verdade:
 * anunciar uma variante inexistente faria a IA escolher algo que quebra.
 */
export const VARIANT_REGISTRY: readonly VariantSpec[] = [
  {
    id: 'editorial-split',
    type: 'hero',
    description:
      'Duas colunas: texto a esquerda com respiro grande, imagem alta a direita. Tom editorial e calmo.',
    minItems: 0,
    maxItems: 4,
    requiresImage: false,
    supportsImage: true,
    densities: ['AIRY', 'BALANCED'],
    motionPresets: ['text-lines-reveal', 'fade-up-soft', 'fade-in', 'image-mask-reveal'],
    status: 'STABLE',
    version: 1,
  },
  {
    id: 'centered-statement',
    type: 'hero',
    description:
      'Centralizado, headline grande como declaracao e um unico CTA. Sem imagem, apoiado no tipo e no espaco.',
    minItems: 0,
    maxItems: 3,
    requiresImage: false,
    supportsImage: false,
    densities: ['AIRY', 'BALANCED', 'COMPACT'],
    motionPresets: ['text-lines-reveal', 'fade-up-soft', 'fade-in'],
    status: 'STABLE',
    version: 1,
  },
  {
    id: 'overlay-full',
    type: 'hero',
    description:
      'Imagem sangrando na largura toda com texto sobreposto e escurecimento. Exige foto com area de respiro.',
    minItems: 0,
    maxItems: 3,
    requiresImage: true,
    supportsImage: true,
    densities: ['AIRY', 'BALANCED'],
    motionPresets: ['image-mask-reveal', 'fade-up-soft', 'fade-in', 'text-lines-reveal'],
    status: 'STABLE',
    version: 1,
  },
  {
    id: 'split-reverse-card',
    type: 'hero',
    description:
      'Imagem a esquerda e texto em cartao elevado a direita, com profundidade e ordem de leitura invertida.',
    minItems: 0,
    maxItems: 3,
    requiresImage: false,
    supportsImage: true,
    densities: ['AIRY', 'BALANCED'],
    motionPresets: ['fade-up-soft', 'fade-in', 'image-mask-reveal'],
    status: 'STABLE',
    version: 1,
  },
  {
    id: 'stacked-image-below',
    type: 'hero',
    description:
      'Texto centralizado em cima e imagem larga embaixo: o visitante le antes de ver.',
    minItems: 0,
    maxItems: 3,
    requiresImage: false,
    supportsImage: true,
    densities: ['AIRY', 'BALANCED'],
    motionPresets: ['text-lines-reveal', 'fade-up-soft', 'fade-in', 'image-mask-reveal'],
    status: 'STABLE',
    version: 1,
  },
  {
    id: 'minimal-rule',
    type: 'hero',
    description:
      'Coluna estreita a esquerda com regua acima do titulo. Sobrio: consultorio, advocacia, arquitetura.',
    minItems: 0,
    maxItems: 2,
    requiresImage: false,
    supportsImage: false,
    densities: ['AIRY', 'BALANCED'],
    motionPresets: ['text-lines-reveal', 'fade-up-soft', 'fade-in'],
    status: 'STABLE',
    version: 1,
  },
  {
    id: 'duo-highlight',
    type: 'hero',
    description:
      'Texto de um lado e destaques em bloco proeminente do outro, usando a lista como contrapeso sem foto.',
    minItems: 2,
    maxItems: 4,
    requiresImage: false,
    supportsImage: false,
    densities: ['AIRY', 'BALANCED'],
    motionPresets: ['fade-up-soft', 'fade-in', 'stagger-cards'],
    status: 'STABLE',
    version: 1,
  },
  {
    id: 'banner-compact',
    type: 'hero',
    description:
      'Faixa curta e horizontal com titulo e CTA quase na mesma linha. Para landing de campanha.',
    minItems: 0,
    maxItems: 2,
    requiresImage: false,
    supportsImage: false,
    densities: ['BALANCED', 'COMPACT'],
    motionPresets: ['fade-up-soft', 'fade-in'],
    status: 'STABLE',
    version: 1,
  },
  {
    id: 'text-lead',
    type: 'about',
    description:
      'Texto largo com entrelinha generosa e imagem opcional ao lado.',
    minItems: 0,
    maxItems: 4,
    requiresImage: false,
    supportsImage: true,
    densities: ['AIRY', 'BALANCED'],
    motionPresets: ['fade-up-soft', 'fade-in'],
    status: 'STABLE',
    version: 1,
  },
  {
    id: 'two-column-prose',
    type: 'about',
    description:
      'Texto em duas colunas de jornal, sem imagem. Densidade de revista.',
    minItems: 0,
    maxItems: 4,
    requiresImage: false,
    supportsImage: false,
    densities: ['AIRY', 'BALANCED'],
    motionPresets: ['fade-up-soft', 'fade-in'],
    status: 'STABLE',
    version: 1,
  },
  {
    id: 'statement-quote',
    type: 'about',
    description:
      'Bloco centralizado em corpo maior, como uma declaracao do profissional.',
    minItems: 0,
    maxItems: 3,
    requiresImage: false,
    supportsImage: false,
    densities: ['AIRY', 'BALANCED'],
    motionPresets: ['text-lines-reveal', 'fade-up-soft', 'fade-in'],
    status: 'STABLE',
    version: 1,
  },
  {
    id: 'media-above',
    type: 'about',
    description:
      'Imagem larga no topo e texto em coluna estreita abaixo.',
    minItems: 0,
    maxItems: 4,
    requiresImage: false,
    supportsImage: true,
    densities: ['AIRY', 'BALANCED'],
    motionPresets: ['image-mask-reveal', 'fade-up-soft', 'fade-in'],
    status: 'STABLE',
    version: 1,
  },
  {
    id: 'boxed-card',
    type: 'about',
    description:
      'Cartao elevado que separa o bloco do restante da pagina.',
    minItems: 0,
    maxItems: 4,
    requiresImage: false,
    supportsImage: false,
    densities: ['BALANCED', 'COMPACT'],
    motionPresets: ['fade-up-soft', 'fade-in'],
    status: 'STABLE',
    version: 1,
  },
  {
    id: 'for-you-cards',
    type: 'audience',
    description:
      'Cartoes no formato "para voce que...", em que o visitante se reconhece em um deles.',
    minItems: 2,
    maxItems: 6,
    requiresImage: false,
    supportsImage: false,
    densities: ['BALANCED', 'COMPACT'],
    motionPresets: ['stagger-cards', 'fade-up-soft', 'fade-in'],
    status: 'STABLE',
    version: 1,
  },
  {
    id: 'pain-list',
    type: 'audience',
    description:
      'Lista de dores em coluna estreita com marcador lateral.',
    minItems: 2,
    maxItems: 8,
    requiresImage: false,
    supportsImage: false,
    densities: ['AIRY', 'BALANCED'],
    motionPresets: ['fade-up-soft', 'fade-in'],
    status: 'STABLE',
    version: 1,
  },
  {
    id: 'persona-rows',
    type: 'audience',
    description:
      'Perfis com retrato ao lado do texto. So com foto real autorizada.',
    minItems: 2,
    maxItems: 5,
    requiresImage: false,
    supportsImage: true,
    densities: ['AIRY', 'BALANCED'],
    motionPresets: ['fade-up-soft', 'fade-in', 'image-mask-reveal'],
    status: 'STABLE',
    version: 1,
  },
  {
    id: 'fit-split',
    type: 'audience',
    description:
      'Duas colunas: para quem e e para quem nao e. Honestidade que filtra.',
    minItems: 2,
    maxItems: 4,
    requiresImage: false,
    supportsImage: false,
    densities: ['BALANCED', 'COMPACT'],
    motionPresets: ['stagger-cards', 'fade-up-soft', 'fade-in'],
    status: 'STABLE',
    version: 1,
  },
  {
    id: 'cards-3col',
    type: 'services',
    description:
      'Grade de cartoes com icone, titulo e descricao curta. Comparacao rapida.',
    minItems: 3,
    maxItems: 9,
    requiresImage: false,
    supportsImage: false,
    densities: ['BALANCED', 'COMPACT'],
    motionPresets: ['stagger-cards', 'fade-up-soft', 'fade-in'],
    status: 'STABLE',
    version: 1,
  },
  {
    id: 'list-detailed',
    type: 'services',
    description:
      'Lista vertical larga com espaco para explicar cada servico.',
    minItems: 1,
    maxItems: 5,
    requiresImage: false,
    supportsImage: true,
    densities: ['AIRY', 'BALANCED'],
    motionPresets: ['stagger-cards', 'fade-up-soft', 'fade-in'],
    status: 'STABLE',
    version: 1,
  },
  {
    id: 'tiles-alternating',
    type: 'services',
    description:
      'Blocos alternando o lado da imagem. Para servicos que precisam de foto.',
    minItems: 2,
    maxItems: 6,
    requiresImage: false,
    supportsImage: true,
    densities: ['AIRY', 'BALANCED'],
    motionPresets: ['fade-up-soft', 'fade-in', 'image-mask-reveal'],
    status: 'STABLE',
    version: 1,
  },
  {
    id: 'accordion-compact',
    type: 'services',
    description:
      'Acordeao nativo: muitos servicos sem alongar a pagina.',
    minItems: 3,
    maxItems: 12,
    requiresImage: false,
    supportsImage: false,
    densities: ['BALANCED', 'COMPACT'],
    motionPresets: ['fade-up-soft', 'fade-in'],
    status: 'STABLE',
    version: 1,
  },
  {
    id: 'numbered-columns',
    type: 'services',
    description:
      'Grade numerada com regua superior. Sugere portfolio ordenado.',
    minItems: 2,
    maxItems: 8,
    requiresImage: false,
    supportsImage: false,
    densities: ['BALANCED', 'COMPACT'],
    motionPresets: ['stagger-cards', 'fade-up-soft', 'fade-in'],
    status: 'STABLE',
    version: 1,
  },
  {
    id: 'scroll-rail',
    type: 'services',
    description:
      'Faixa horizontal rolavel com encaixe. Boa no celular.',
    minItems: 3,
    maxItems: 10,
    requiresImage: false,
    supportsImage: false,
    densities: ['BALANCED', 'COMPACT'],
    motionPresets: ['stagger-cards', 'fade-up-soft', 'fade-in'],
    status: 'STABLE',
    version: 1,
  },
  {
    id: 'icon-grid',
    type: 'benefits',
    description:
      'Grade com icone acima do texto, sem cartao. Leve e escaneavel.',
    minItems: 2,
    maxItems: 8,
    requiresImage: false,
    supportsImage: false,
    densities: ['BALANCED', 'COMPACT'],
    motionPresets: ['stagger-cards', 'fade-up-soft', 'fade-in'],
    status: 'STABLE',
    version: 1,
  },
  {
    id: 'checklist-two-col',
    type: 'benefits',
    description:
      'Marcadores de conferencia em duas colunas. Denso e rapido de ler.',
    minItems: 2,
    maxItems: 8,
    requiresImage: false,
    supportsImage: false,
    densities: ['BALANCED', 'COMPACT'],
    motionPresets: ['fade-up-soft', 'fade-in'],
    status: 'STABLE',
    version: 1,
  },
  {
    id: 'contrast-pairs',
    type: 'benefits',
    description:
      'Cartoes de contraste entre a situacao atual e o que o servico organiza.',
    minItems: 2,
    maxItems: 6,
    requiresImage: false,
    supportsImage: false,
    densities: ['BALANCED', 'COMPACT'],
    motionPresets: ['stagger-cards', 'fade-up-soft', 'fade-in'],
    status: 'STABLE',
    version: 1,
  },
  {
    id: 'divided-rows',
    type: 'benefits',
    description:
      'Coluna unica com divisores. Ritmo lento e editorial.',
    minItems: 2,
    maxItems: 6,
    requiresImage: false,
    supportsImage: false,
    densities: ['AIRY', 'BALANCED'],
    motionPresets: ['fade-up-soft', 'fade-in'],
    status: 'STABLE',
    version: 1,
  },
  {
    id: 'feature-lead',
    type: 'benefits',
    description:
      'Assimetrico: o primeiro item ocupa o dobro do espaco.',
    minItems: 3,
    maxItems: 7,
    requiresImage: false,
    supportsImage: false,
    densities: ['BALANCED', 'COMPACT'],
    motionPresets: ['stagger-cards', 'fade-up-soft', 'fade-in'],
    status: 'STABLE',
    version: 1,
  },
  {
    id: 'portrait-side',
    type: 'authority',
    description:
      'Retrato ao lado do texto, credenciais listadas abaixo.',
    minItems: 0,
    maxItems: 8,
    requiresImage: false,
    supportsImage: true,
    densities: ['AIRY', 'BALANCED'],
    motionPresets: ['fade-up-soft', 'fade-in', 'image-mask-reveal'],
    status: 'STABLE',
    version: 1,
  },
  {
    id: 'portrait-centered',
    type: 'authority',
    description:
      'Retrato circular centralizado acima do texto. Tom pessoal.',
    minItems: 0,
    maxItems: 8,
    requiresImage: false,
    supportsImage: true,
    densities: ['AIRY', 'BALANCED'],
    motionPresets: ['fade-up-soft', 'fade-in'],
    status: 'STABLE',
    version: 1,
  },
  {
    id: 'credential-strip',
    type: 'authority',
    description:
      'Credenciais como faixa de selos abaixo do texto centralizado.',
    minItems: 1,
    maxItems: 8,
    requiresImage: false,
    supportsImage: false,
    densities: ['BALANCED', 'COMPACT'],
    motionPresets: ['fade-up-soft', 'fade-in'],
    status: 'STABLE',
    version: 1,
  },
  {
    id: 'profile-card',
    type: 'authority',
    description:
      'Cartao de perfil compacto, para assinar o fim de uma landing.',
    minItems: 0,
    maxItems: 6,
    requiresImage: false,
    supportsImage: true,
    densities: ['BALANCED', 'COMPACT'],
    motionPresets: ['fade-up-soft', 'fade-in'],
    status: 'STABLE',
    version: 1,
  },
  {
    id: 'inline',
    type: 'stats',
    description:
      'Numeros em linha separados por divisor. Discreto.',
    minItems: 2,
    maxItems: 4,
    requiresImage: false,
    supportsImage: false,
    densities: ['BALANCED', 'COMPACT'],
    motionPresets: ['counter-on-view', 'fade-up-soft', 'fade-in'],
    status: 'STABLE',
    version: 1,
  },
  {
    id: 'stat-cards',
    type: 'stats',
    description:
      'Cartoes: dao peso quando os numeros sao o argumento principal.',
    minItems: 2,
    maxItems: 6,
    requiresImage: false,
    supportsImage: false,
    densities: ['BALANCED', 'COMPACT'],
    motionPresets: ['counter-on-view', 'fade-up-soft', 'fade-in', 'stagger-cards'],
    status: 'STABLE',
    version: 1,
  },
  {
    id: 'banner-strip',
    type: 'stats',
    description:
      'Faixa de largura total com fundo contrastante.',
    minItems: 2,
    maxItems: 4,
    requiresImage: false,
    supportsImage: false,
    densities: ['BALANCED', 'COMPACT'],
    motionPresets: ['counter-on-view', 'fade-up-soft', 'fade-in'],
    status: 'STABLE',
    version: 1,
  },
  {
    id: 'numbered-steps',
    type: 'process',
    description:
      'Coluna numerada com linha conectando a sequencia.',
    minItems: 2,
    maxItems: 6,
    requiresImage: false,
    supportsImage: false,
    densities: ['AIRY', 'BALANCED'],
    motionPresets: ['stagger-cards', 'fade-up-soft', 'fade-in'],
    status: 'STABLE',
    version: 1,
  },
  {
    id: 'timeline-horizontal',
    type: 'process',
    description:
      'Linha do tempo horizontal. Poucos passos, leitura lateral.',
    minItems: 2,
    maxItems: 5,
    requiresImage: false,
    supportsImage: false,
    densities: ['BALANCED', 'COMPACT'],
    motionPresets: ['stagger-cards', 'fade-up-soft', 'fade-in'],
    status: 'STABLE',
    version: 1,
  },
  {
    id: 'step-cards',
    type: 'process',
    description:
      'Cartoes numerados grandes, cada passo com peso proprio.',
    minItems: 2,
    maxItems: 6,
    requiresImage: false,
    supportsImage: false,
    densities: ['BALANCED', 'COMPACT'],
    motionPresets: ['stagger-cards', 'fade-up-soft', 'fade-in'],
    status: 'STABLE',
    version: 1,
  },
  {
    id: 'steps-with-media',
    type: 'process',
    description:
      'Passos alternando com imagem. Quando cada etapa tem foto.',
    minItems: 2,
    maxItems: 5,
    requiresImage: false,
    supportsImage: true,
    densities: ['AIRY', 'BALANCED'],
    motionPresets: ['fade-up-soft', 'fade-in', 'image-mask-reveal'],
    status: 'STABLE',
    version: 1,
  },
  {
    id: 'steps-compact',
    type: 'process',
    description:
      'Coluna estreita e compacta, para landing curta.',
    minItems: 2,
    maxItems: 8,
    requiresImage: false,
    supportsImage: false,
    densities: ['BALANCED', 'COMPACT'],
    motionPresets: ['fade-up-soft', 'fade-in'],
    status: 'STABLE',
    version: 1,
  },
  {
    id: 'grid-uniform',
    type: 'gallery',
    description:
      'Grade uniforme de imagens em proporcao 4:3.',
    minItems: 2,
    maxItems: 12,
    requiresImage: true,
    supportsImage: true,
    densities: ['BALANCED', 'COMPACT'],
    motionPresets: ['stagger-cards', 'fade-up-soft', 'fade-in'],
    status: 'STABLE',
    version: 1,
  },
  {
    id: 'mosaic-lead',
    type: 'gallery',
    description:
      'Mosaico com a primeira imagem em destaque dobrado.',
    minItems: 3,
    maxItems: 12,
    requiresImage: true,
    supportsImage: true,
    densities: ['AIRY', 'BALANCED'],
    motionPresets: ['stagger-cards', 'fade-up-soft', 'fade-in'],
    status: 'STABLE',
    version: 1,
  },
  {
    id: 'media-rail',
    type: 'gallery',
    description:
      'Faixa rolavel que preserva a proporcao das fotos no celular.',
    minItems: 2,
    maxItems: 12,
    requiresImage: true,
    supportsImage: true,
    densities: ['BALANCED', 'COMPACT'],
    motionPresets: ['stagger-cards', 'fade-up-soft', 'fade-in'],
    status: 'STABLE',
    version: 1,
  },
  {
    id: 'offset-columns',
    type: 'gallery',
    description:
      'Duas colunas com deslocamento vertical. Ritmo de portfolio.',
    minItems: 2,
    maxItems: 10,
    requiresImage: true,
    supportsImage: true,
    densities: ['AIRY', 'BALANCED'],
    motionPresets: ['parallax-subtle', 'fade-up-soft', 'fade-in'],
    status: 'STABLE',
    version: 1,
  },
  {
    id: 'single-card',
    type: 'offer',
    description:
      'Cartao unico centralizado: a oferta e o unico foco da secao.',
    minItems: 0,
    maxItems: 8,
    requiresImage: false,
    supportsImage: false,
    densities: ['AIRY', 'BALANCED'],
    motionPresets: ['fade-up-soft', 'fade-in'],
    status: 'STABLE',
    version: 1,
  },
  {
    id: 'split-price',
    type: 'offer',
    description:
      'Texto a esquerda e cartao de preco a direita.',
    minItems: 0,
    maxItems: 8,
    requiresImage: false,
    supportsImage: false,
    densities: ['BALANCED', 'COMPACT'],
    motionPresets: ['fade-up-soft', 'fade-in'],
    status: 'STABLE',
    version: 1,
  },
  {
    id: 'highlight-band',
    type: 'offer',
    description:
      'Faixa de destaque com fundo suave de acento.',
    minItems: 0,
    maxItems: 8,
    requiresImage: false,
    supportsImage: false,
    densities: ['BALANCED', 'COMPACT'],
    motionPresets: ['cta-gradient-flow', 'fade-up-soft', 'fade-in'],
    status: 'STABLE',
    version: 1,
  },
  {
    id: 'inclusions-list',
    type: 'offer',
    description:
      'Lista do que esta incluso com o preco abaixo.',
    minItems: 1,
    maxItems: 10,
    requiresImage: false,
    supportsImage: false,
    densities: ['AIRY', 'BALANCED'],
    motionPresets: ['fade-up-soft', 'fade-in'],
    status: 'STABLE',
    version: 1,
  },
  {
    id: 'quote-pair',
    type: 'testimonials',
    description:
      'Dois depoimentos lado a lado com tipografia de citacao.',
    minItems: 1,
    maxItems: 4,
    requiresImage: false,
    supportsImage: false,
    densities: ['AIRY', 'BALANCED'],
    motionPresets: ['stagger-cards', 'fade-up-soft', 'fade-in'],
    status: 'STABLE',
    version: 1,
  },
  {
    id: 'single-feature',
    type: 'testimonials',
    description:
      'Uma citacao unica e grande, quando ha um depoimento forte.',
    minItems: 1,
    maxItems: 1,
    requiresImage: false,
    supportsImage: false,
    densities: ['AIRY', 'BALANCED'],
    motionPresets: ['text-lines-reveal', 'fade-up-soft', 'fade-in'],
    status: 'STABLE',
    version: 1,
  },
  {
    id: 'card-grid',
    type: 'testimonials',
    description:
      'Grade de cartoes para varios depoimentos curtos.',
    minItems: 3,
    maxItems: 12,
    requiresImage: false,
    supportsImage: false,
    densities: ['BALANCED', 'COMPACT'],
    motionPresets: ['stagger-cards', 'fade-up-soft', 'fade-in'],
    status: 'STABLE',
    version: 1,
  },
  {
    id: 'rail-scroll',
    type: 'testimonials',
    description:
      'Faixa rolavel: muitos depoimentos sem alongar a pagina.',
    minItems: 3,
    maxItems: 12,
    requiresImage: false,
    supportsImage: false,
    densities: ['BALANCED', 'COMPACT'],
    motionPresets: ['stagger-cards', 'fade-up-soft', 'fade-in'],
    status: 'STABLE',
    version: 1,
  },
  {
    id: 'accordion-single',
    type: 'faq',
    description:
      'Coluna unica em acordeao nativo, a primeira ja aberta.',
    minItems: 2,
    maxItems: 12,
    requiresImage: false,
    supportsImage: false,
    densities: ['AIRY', 'BALANCED', 'COMPACT'],
    motionPresets: ['fade-up-soft', 'fade-in'],
    status: 'STABLE',
    version: 1,
  },
  {
    id: 'accordion-two-col',
    type: 'faq',
    description:
      'Duas colunas de acordeao para muitas perguntas curtas.',
    minItems: 4,
    maxItems: 12,
    requiresImage: false,
    supportsImage: false,
    densities: ['BALANCED', 'COMPACT'],
    motionPresets: ['fade-up-soft', 'fade-in'],
    status: 'STABLE',
    version: 1,
  },
  {
    id: 'side-heading',
    type: 'faq',
    description:
      'Titulo a esquerda e perguntas a direita. Hierarquia editorial.',
    minItems: 2,
    maxItems: 10,
    requiresImage: false,
    supportsImage: false,
    densities: ['AIRY', 'BALANCED'],
    motionPresets: ['fade-up-soft', 'fade-in'],
    status: 'STABLE',
    version: 1,
  },
  {
    id: 'open-list',
    type: 'faq',
    description:
      'Tudo aberto em lista de definicao, para leitura corrida.',
    minItems: 2,
    maxItems: 10,
    requiresImage: false,
    supportsImage: false,
    densities: ['AIRY', 'BALANCED'],
    motionPresets: ['fade-up-soft', 'fade-in'],
    status: 'STABLE',
    version: 1,
  },
  {
    id: 'centered-band',
    type: 'cta',
    description:
      'Faixa centralizada com fundo primario. O fechamento classico.',
    minItems: 0,
    maxItems: 2,
    requiresImage: false,
    supportsImage: false,
    densities: ['AIRY', 'BALANCED', 'COMPACT'],
    motionPresets: ['cta-gradient-flow', 'fade-up-soft', 'fade-in'],
    status: 'STABLE',
    version: 1,
  },
  {
    id: 'inline-split',
    type: 'cta',
    description:
      'Titulo a esquerda e botao a direita, na mesma linha.',
    minItems: 0,
    maxItems: 2,
    requiresImage: false,
    supportsImage: false,
    densities: ['BALANCED', 'COMPACT'],
    motionPresets: ['fade-up-soft', 'fade-in'],
    status: 'STABLE',
    version: 1,
  },
  {
    id: 'raised-card',
    type: 'cta',
    description:
      'Cartao elevado que separa o convite do conteudo.',
    minItems: 0,
    maxItems: 2,
    requiresImage: false,
    supportsImage: false,
    densities: ['AIRY', 'BALANCED'],
    motionPresets: ['fade-up-soft', 'fade-in'],
    status: 'STABLE',
    version: 1,
  },
  {
    id: 'quiet-line',
    type: 'cta',
    description:
      'Discreto, so uma linha e um link. Evita saturar a pagina de CTAs.',
    minItems: 0,
    maxItems: 2,
    requiresImage: false,
    supportsImage: false,
    densities: ['AIRY', 'BALANCED', 'COMPACT'],
    motionPresets: ['fade-up-soft', 'fade-in'],
    status: 'STABLE',
    version: 1,
  },
  {
    id: 'sticky-mobile-bar',
    type: 'cta',
    description:
      'Barra fixa no rodape da janela no celular, com espaco reservado no corpo.',
    minItems: 0,
    maxItems: 2,
    requiresImage: false,
    supportsImage: false,
    densities: ['BALANCED', 'COMPACT'],
    motionPresets: ['fade-up-soft', 'fade-in'],
    status: 'STABLE',
    version: 1,
  },
  {
    id: 'address-card',
    type: 'contactMap',
    description:
      'Cartao de endereco com horarios e botoes. Sem mapa embutido.',
    minItems: 0,
    maxItems: 6,
    requiresImage: false,
    supportsImage: false,
    densities: ['BALANCED', 'COMPACT'],
    motionPresets: ['fade-up-soft', 'fade-in'],
    status: 'STABLE',
    version: 1,
  },
  {
    id: 'map-side',
    type: 'contactMap',
    description:
      'Mapa ao lado do cartao, quando ha chave de navegador configurada.',
    minItems: 0,
    maxItems: 6,
    requiresImage: false,
    supportsImage: false,
    densities: ['BALANCED', 'COMPACT'],
    motionPresets: ['fade-up-soft', 'fade-in'],
    status: 'STABLE',
    version: 1,
  },
  {
    id: 'channel-list',
    type: 'contactMap',
    description:
      'Lista de canais em coluna: telefone, WhatsApp, e-mail e redes.',
    minItems: 1,
    maxItems: 6,
    requiresImage: false,
    supportsImage: false,
    densities: ['BALANCED', 'COMPACT'],
    motionPresets: ['fade-up-soft', 'fade-in'],
    status: 'STABLE',
    version: 1,
  },
  {
    id: 'wide-band',
    type: 'contactMap',
    description:
      'Faixa larga com endereco e horarios lado a lado.',
    minItems: 0,
    maxItems: 6,
    requiresImage: false,
    supportsImage: false,
    densities: ['AIRY', 'BALANCED'],
    motionPresets: ['fade-up-soft', 'fade-in'],
    status: 'STABLE',
    version: 1,
  },
  {
    id: 'card-centered',
    type: 'whatsappForm',
    description:
      'Formulario em cartao centralizado, coluna unica.',
    minItems: 1,
    maxItems: 8,
    requiresImage: false,
    supportsImage: false,
    densities: ['AIRY', 'BALANCED'],
    motionPresets: ['fade-up-soft', 'fade-in'],
    status: 'STABLE',
    version: 1,
  },
  {
    id: 'split-context',
    type: 'whatsappForm',
    description:
      'Texto a esquerda e formulario a direita: contexto e acao juntos.',
    minItems: 1,
    maxItems: 8,
    requiresImage: false,
    supportsImage: false,
    densities: ['AIRY', 'BALANCED'],
    motionPresets: ['fade-up-soft', 'fade-in'],
    status: 'STABLE',
    version: 1,
  },
  {
    id: 'compact-inline',
    type: 'whatsappForm',
    description:
      'Poucos campos em bloco compacto, para landing curta.',
    minItems: 1,
    maxItems: 4,
    requiresImage: false,
    supportsImage: false,
    densities: ['BALANCED', 'COMPACT'],
    motionPresets: ['fade-up-soft', 'fade-in'],
    status: 'STABLE',
    version: 1,
  },
  {
    id: 'simple-centered',
    type: 'footer',
    description:
      'Rodape enxuto centralizado com nome, links e redes.',
    minItems: 0,
    maxItems: 10,
    requiresImage: false,
    supportsImage: false,
    densities: ['AIRY', 'BALANCED', 'COMPACT'],
    motionPresets: ['none', 'fade-in'],
    status: 'STABLE',
    version: 1,
  },
  {
    id: 'three-column',
    type: 'footer',
    description:
      'Tres colunas: marca, navegacao e onde encontrar.',
    minItems: 0,
    maxItems: 12,
    requiresImage: false,
    supportsImage: false,
    densities: ['AIRY', 'BALANCED'],
    motionPresets: ['none', 'fade-in'],
    status: 'STABLE',
    version: 1,
  },
  {
    id: 'inline-bar',
    type: 'footer',
    description:
      'Marca a esquerda e links a direita, em uma faixa unica.',
    minItems: 0,
    maxItems: 10,
    requiresImage: false,
    supportsImage: false,
    densities: ['BALANCED', 'COMPACT'],
    motionPresets: ['none', 'fade-in'],
    status: 'STABLE',
    version: 1,
  },
  {
    id: 'contrast-block',
    type: 'footer',
    description:
      'Rodape com fundo primario, fechando a pagina com peso.',
    minItems: 0,
    maxItems: 10,
    requiresImage: false,
    supportsImage: false,
    densities: ['AIRY', 'BALANCED'],
    motionPresets: ['none', 'fade-in'],
    status: 'STABLE',
    version: 1,
  },
  {
    id: 'legal-only',
    type: 'footer',
    description:
      'So o essencial legal: nome, aviso e ano.',
    minItems: 0,
    maxItems: 4,
    requiresImage: false,
    supportsImage: false,
    densities: ['BALANCED', 'COMPACT'],
    motionPresets: ['none', 'fade-in'],
    status: 'STABLE',
    version: 1,
  },
];

const BY_ID = new Map(VARIANT_REGISTRY.map((variant) => [variant.id, variant]));

export const findVariant = (id: string): VariantSpec | null => BY_ID.get(id) ?? null;

export const variantsFor = (type: SectionType): VariantSpec[] =>
  VARIANT_REGISTRY.filter((variant) => variant.type === type);

export type CompatibilityError =
  | 'UNKNOWN_VARIANT'
  | 'WRONG_TYPE'
  | 'TOO_FEW_ITEMS'
  | 'TOO_MANY_ITEMS'
  | 'MISSING_IMAGE'
  | 'MOTION_NOT_SUPPORTED';

export type CompatibilityResult =
  | { ok: true }
  | { ok: false; code: CompatibilityError; reason: string };

/**
 * A secao cabe nesta variante?
 *
 * Chamado pelo editor ao oferecer "trocar variante" e pelo linter antes de
 * publicar. Bloquear aqui e o que impede uma grade de tres colunas receber um
 * unico item e virar um cartao solitario no meio da tela.
 */
export function checkCompatibility(input: {
  variantId: string;
  type: SectionType;
  itemCount: number;
  hasImage: boolean;
  motionPreset: MotionPresetId;
}): CompatibilityResult {
  const variant = findVariant(input.variantId);

  if (!variant) {
    return {
      ok: false,
      code: 'UNKNOWN_VARIANT',
      reason: `A variante "${input.variantId}" nao existe na biblioteca.`,
    };
  }
  if (variant.type !== input.type) {
    return {
      ok: false,
      code: 'WRONG_TYPE',
      reason: `A variante "${variant.id}" e de ${variant.type}, nao de ${input.type}.`,
    };
  }
  if (input.itemCount < variant.minItems) {
    return {
      ok: false,
      code: 'TOO_FEW_ITEMS',
      reason: `"${variant.id}" precisa de pelo menos ${variant.minItems} itens.`,
    };
  }
  if (input.itemCount > variant.maxItems) {
    return {
      ok: false,
      code: 'TOO_MANY_ITEMS',
      reason: `"${variant.id}" comporta no maximo ${variant.maxItems} itens.`,
    };
  }
  if (variant.requiresImage && !input.hasImage) {
    return {
      ok: false,
      code: 'MISSING_IMAGE',
      reason: `"${variant.id}" fica vazia sem imagem.`,
    };
  }
  if (!variant.motionPresets.includes(input.motionPreset)) {
    return {
      ok: false,
      code: 'MOTION_NOT_SUPPORTED',
      reason: `A animacao "${input.motionPreset}" nao foi testada em "${variant.id}".`,
    };
  }

  return { ok: true };
}

/**
 * Representacao compacta para o prompt.
 *
 * Sai texto, e nao JSON, porque texto corrido gasta menos token e o modelo
 * entende igual. O codigo dos componentes nunca aparece aqui.
 */
export function registryForPrompt(): string {
  return VARIANT_REGISTRY.filter((variant) => variant.status === 'STABLE')
    .map(
      (variant) =>
        `${variant.type}/${variant.id}: ${variant.description} ` +
        `(itens ${variant.minItems}-${variant.maxItems}` +
        `${variant.supportsImage ? ', aceita imagem' : ''})`,
    )
    .join('\n');
}
