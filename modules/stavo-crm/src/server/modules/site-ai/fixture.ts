/**
 * Projeto de referencia: um SiteSchema completo e valido.
 *
 * Serve a tres propositos:
 *  - e a saida do provider mock, para desenvolver e testar sem gastar um
 *    centavo de API;
 *  - e o corpo de prova do linter e do renderer nos testes;
 *  - documenta, por exemplo concreto, o que uma geracao boa produz.
 *
 * Todos os "fatos" aqui sao marcados como `USER_CONFIRMED` porque, na ficcao
 * desta fixture, o administrador os forneceu. E exatamente o que o linter
 * exige para permitir depoimento, credencial e numero na pagina -- a fixture
 * passa no linter, e isso e testado.
 *
 * O negocio escolhido e uma nutricionista de proposito: a especificacao cita
 * esse caso ao proibir o clichê automatico (verde, folhas, "transforme sua
 * jornada"). A paleta aqui e terrosa e quente, e a copy fala de rotina real.
 */
import {
  SITE_RENDERER_VERSION,
  SITE_SCHEMA_VERSION,
  type SiteSchemaModel,
} from '@site-kit/schemas/site-schema';

const confirmed = <T>(value: T) => ({
  value,
  source: 'USER_CONFIRMED' as const,
  confirmedAt: '2026-08-20T12:00:00.000Z',
});

export const FIXTURE_SEED = 'a3f19c74d2b8e015';

export function buildFixtureSite(): SiteSchemaModel {
  return {
    schemaVersion: SITE_SCHEMA_VERSION,
    rendererVersion: SITE_RENDERER_VERSION,
    project: {
      siteType: 'ONE_PAGE',
      language: 'pt-BR',
      creativeSeed: FIXTURE_SEED,
      promptVersion: '1.0.0',
    },

    business: {
      name: 'Marina Ferraz Nutricao',
      description:
        'Consultorio de nutricao clinica em Campinas, com atendimento presencial e online '
        + 'para adultos que querem reorganizar a alimentacao sem dieta restritiva.',
      niche: 'Nutricao clinica',
      city: 'Campinas',
      state: 'SP',
      serviceArea: 'Campinas e regiao, alem de atendimento online para todo o Brasil',
      services: [
        {
          name: 'Consulta de nutricao clinica',
          description:
            'Avaliacao completa, historico alimentar e plano ajustado a rotina de quem trabalha fora.',
        },
        {
          name: 'Acompanhamento mensal',
          description:
            'Encontros de retorno para ajustar o plano conforme a vida muda, sem recomecar do zero.',
        },
        {
          name: 'Nutricao para pre e pos-operatorio',
          description: 'Preparo e recuperacao alimentar acompanhando a orientacao da equipe medica.',
        },
        {
          name: 'Atendimento online',
          description: 'Mesma consulta por video, com o plano enviado depois por escrito.',
        },
      ],
      differentials: [
        'Plano montado sobre o que voce ja come, nao sobre uma lista pronta',
        'Retorno com ajuste incluso no acompanhamento mensal',
        'Atendimento presencial em Campinas e online para o resto do pais',
      ],
      audience:
        'Adultos entre 30 e 55 anos que ja tentaram dietas fechadas, nao conseguiram manter e '
        + 'querem uma abordagem que caiba na rotina de trabalho.',
      phoneE164: confirmed('+5519998877665'),
      whatsappE164: confirmed('+5519998877665'),
      email: confirmed('contato@marinaferraznutricao.com.br'),
      address: confirmed('Rua Coronel Quirino, 1420, sala 32, Cambui, Campinas - SP'),
      instagramUrl: confirmed('https://www.instagram.com/marinaferraznutri'),
      websiteUrl: null,
      googleMapsUrl: confirmed('https://www.google.com/maps/place/?q=place_id:ChIJfixture000000'),
      credentials: [confirmed('CRN-3 numero 41287'), confirmed('Pos-graduacao em Nutricao Clinica')],
      stats: [
        confirmed({ value: '9 anos', label: 'de consultorio em Campinas' }),
        confirmed({ value: '2 formatos', label: 'presencial e online' }),
      ],
      testimonials: [
        confirmed({
          quote:
            'Eu ja tinha desistido de dieta tres vezes. Aqui foi a primeira vez que o plano '
            + 'coube no meu dia a dia, com marmita e tudo.',
          author: 'Renata C.',
          role: 'paciente desde 2024',
        }),
        confirmed({
          quote:
            'O acompanhamento mensal fez diferenca. Quando minha rotina virou de cabeca para '
            + 'baixo, a gente ajustou em vez de recomecar.',
          author: 'Paulo M.',
          role: 'paciente desde 2023',
        }),
      ],
      openingHours: [
        'Segunda a sexta, das 8h as 19h',
        'Sabado, das 8h as 12h',
      ],
    },

    objective: {
      goal: 'APPOINTMENTS',
      customGoal: undefined,
      primaryCta: {
        kind: 'whatsapp',
        label: 'Agendar uma avaliacao',
        target: '+5519998877665',
        prefilledMessage: 'Ola, Marina. Vim pelo site e gostaria de agendar uma avaliacao.',
      },
    },

    creativeDirection: {
      positioning:
        'Nutricao clinica para quem ja tentou dieta fechada e precisa de um plano que sobreviva '
        + 'a semana de trabalho.',
      audienceSummary:
        'Adultos com rotina corrida, historico de tentativas frustradas e desconfianca de '
        + 'promessa rapida.',
      objections: [
        'Ja tentei antes e nao consegui manter',
        'Nao tenho tempo de cozinhar todo dia',
        'Nao quero cortar tudo que gosto',
      ],
      toneOfVoice: 'Direto, adulto e sem entusiasmo forcado. Fala de rotina, nao de transformacao.',
      visualConcept:
        'Editorial calmo com muito respiro, fotografia natural e um tom terroso quente que foge '
        + 'do verde clinico obvio do nicho.',
      paletteRationale:
        'Terracota como cor principal e um verde-oliva profundo apenas como apoio: a paleta '
        + 'remete a comida de verdade, e nao a folha e clinica.',
      typographyRationale:
        'Serifa de texto nos titulos para dar autoridade tranquila; sans neutra no corpo para '
        + 'leitura longa no celular.',
      compositionRationale:
        'Ritmo alternado entre blocos de texto largos e listas curtas, para a pagina nao virar '
        + 'um paredao de paragrafo.',
      photographyTreatment: 'Luz natural, tons quentes, sem filtro saturado e sem banco de imagem obvio.',
      narrative:
        'Comeca reconhecendo a frustracao de quem ja tentou, mostra como o metodo funciona na '
        + 'pratica, apresenta a profissional com credencial real e termina com um convite simples '
        + 'para conversar no WhatsApp.',
    },

    theme: {
      mode: 'LIGHT',
      colors: {
        background: '#fbf8f4',
        surface: '#ffffff',
        text: '#2b2320',
        muted: '#6b5f57',
        primary: '#9c4221',
        primaryForeground: '#ffffff',
        accent: '#3f4f3a',
        accentForeground: '#ffffff',
        border: '#e6ddd3',
      },
      typography: {
        headingFont: 'Fraunces',
        bodyFont: 'Inter',
        headingMinRem: 1.75,
        headingMaxRem: 3.5,
        bodyRem: 1.0625,
        headingWeight: 600,
        lineHeightTight: 1.1,
        lineHeightBody: 1.65,
      },
      spacing: { sectionPaddingRem: 5.5, containerMaxWidthPx: 1180, gapRem: 1.75 },
      radii: { sm: 6, md: 12, lg: 20, pill: 999 },
      elevation: 'SOFT',
      borderWidth: 1,
      iconStyle: 'LINE',
      imageTreatment: 'ROUNDED',
      buttonStyle: 'SOLID',
      density: 'AIRY',
    },

    navigation: {
      showMenu: true,
      headerVariant: 'inline-right',
      items: [
        { label: 'Atendimento', anchor: 'atendimento' },
        { label: 'Como funciona', anchor: 'como-funciona' },
        { label: 'Sobre', anchor: 'sobre' },
        { label: 'Duvidas', anchor: 'duvidas' },
      ],
      logo: null,
      wordmark: 'Marina Ferraz',
      headerCta: {
        kind: 'whatsapp',
        label: 'Agendar',
        target: '+5519998877665',
        prefilledMessage: 'Ola, Marina. Vim pelo site e gostaria de agendar uma avaliacao.',
      },
      stickyHeader: true,
    },

    sections: [
      {
        id: 'hero',
        type: 'hero',
        variant: 'editorial-split',
        visible: true,
        anchor: 'inicio',
        motionPreset: 'text-lines-reveal',
        eyebrow: 'Nutricao clinica em Campinas',
        headline: 'Um plano alimentar que sobrevive a sua semana de trabalho',
        subheadline:
          'Atendimento presencial no Cambui ou online, montado a partir do que voce ja come.',
        primaryCta: {
          kind: 'whatsapp',
          label: 'Agendar uma avaliacao',
          target: '+5519998877665',
          prefilledMessage: 'Ola, Marina. Vim pelo site e gostaria de agendar uma avaliacao.',
        },
        secondaryCta: { kind: 'anchor', label: 'Ver como funciona', target: 'como-funciona' },
        highlights: ['9 anos de consultorio', 'Presencial e online'],
      },
      {
        id: 'servicos',
        type: 'services',
        variant: 'cards-3col',
        visible: true,
        anchor: 'atendimento',
        motionPreset: 'stagger-cards',
        headline: 'Quatro formas de atendimento',
        subheadline: 'Todas partem da mesma avaliacao inicial.',
        items: [
          {
            title: 'Consulta de nutricao clinica',
            body: 'Avaliacao completa, historico alimentar e plano ajustado a sua rotina.',
            icon: 'clipboard-list',
          },
          {
            title: 'Acompanhamento mensal',
            body: 'Retornos para ajustar o plano conforme a vida muda, sem recomecar do zero.',
            icon: 'calendar-check',
          },
          {
            title: 'Pre e pos-operatorio',
            body: 'Preparo e recuperacao acompanhando a orientacao da equipe medica.',
            icon: 'heart-pulse',
          },
          {
            title: 'Atendimento online',
            body: 'A mesma consulta por video, com o plano enviado por escrito depois.',
            icon: 'video',
          },
        ],
      },
      {
        id: 'processo',
        type: 'process',
        variant: 'numbered-steps',
        visible: true,
        anchor: 'como-funciona',
        motionPreset: 'fade-up-soft',
        headline: 'Como funciona, da primeira conversa ao primeiro retorno',
        steps: [
          {
            title: 'Conversa inicial no WhatsApp',
            body: 'Voce conta o que procura e a gente ve se faz sentido comecar.',
          },
          {
            title: 'Avaliacao completa',
            body: 'Uma hora de consulta: historico, exames, rotina e o que voce realmente come.',
          },
          {
            title: 'Plano por escrito',
            body: 'Voce recebe o plano em ate tres dias, com substituicoes para os dias corridos.',
          },
          {
            title: 'Retorno para ajustar',
            body: 'No acompanhamento mensal, o plano muda junto com a sua rotina.',
          },
        ],
      },
      {
        id: 'sobre',
        type: 'authority',
        variant: 'portrait-side',
        visible: true,
        anchor: 'sobre',
        motionPreset: 'fade-up-soft',
        headline: 'Nove anos atendendo em Campinas',
        body:
          'Marina Ferraz atende no Cambui desde 2017, com foco em nutricao clinica para adultos. '
          + 'O consultorio trabalha com plano individual e retorno frequente, em vez de cardapio pronto.',
        personName: 'Marina Ferraz',
        personRole: 'Nutricionista clinica',
        credentials: ['CRN-3 numero 41287', 'Pos-graduacao em Nutricao Clinica'],
      },
      {
        id: 'depoimentos',
        type: 'testimonials',
        variant: 'quote-pair',
        visible: true,
        anchor: 'depoimentos',
        motionPreset: 'fade-in',
        headline: 'O que dizem duas pacientes',
        items: [
          {
            quote:
              'Eu ja tinha desistido de dieta tres vezes. Aqui foi a primeira vez que o plano '
              + 'coube no meu dia a dia, com marmita e tudo.',
            author: 'Renata C.',
            role: 'paciente desde 2024',
          },
          {
            quote:
              'O acompanhamento mensal fez diferenca. Quando minha rotina virou de cabeca para '
              + 'baixo, a gente ajustou em vez de recomecar.',
            author: 'Paulo M.',
            role: 'paciente desde 2023',
          },
        ],
      },
      {
        id: 'duvidas',
        type: 'faq',
        variant: 'accordion-single',
        visible: true,
        anchor: 'duvidas',
        motionPreset: 'fade-up-soft',
        headline: 'Duvidas de quem esta pensando em comecar',
        items: [
          {
            question: 'Preciso cortar tudo que eu gosto?',
            answer:
              'Nao. O plano parte do que voce ja come e ajusta quantidade, combinacao e horario. '
              + 'Alimento proibido costuma durar duas semanas e depois vira abandono.',
          },
          {
            question: 'Atende online?',
            answer:
              'Sim. A consulta online tem a mesma duracao e o mesmo plano por escrito. A diferenca '
              + 'e que a avaliacao fisica nao acontece.',
          },
          {
            question: 'Quanto tempo ate o primeiro retorno?',
            answer: 'O primeiro retorno costuma ser em 30 dias, ja incluso no acompanhamento mensal.',
          },
          {
            question: 'Precisa de pedido medico?',
            answer:
              'Nao e obrigatorio. Se voce tiver exames recentes, leve: eles ajudam a montar o plano.',
          },
        ],
      },
      {
        id: 'contato',
        type: 'contactMap',
        variant: 'address-card',
        visible: true,
        anchor: 'contato',
        motionPreset: 'fade-in',
        headline: 'Onde fica o consultorio',
        address: 'Rua Coronel Quirino, 1420, sala 32, Cambui, Campinas - SP',
        mapsUrl: 'https://www.google.com/maps/place/?q=place_id:ChIJfixture000000',
        showEmbeddedMap: false,
        contacts: [
          {
            kind: 'whatsapp',
            label: 'Falar no WhatsApp',
            target: '+5519998877665',
            prefilledMessage: 'Ola, Marina. Vim pelo site e gostaria de agendar uma avaliacao.',
          },
          { kind: 'tel', label: 'Ligar', target: '+5519998877665' },
          {
            kind: 'external',
            label: 'Instagram',
            target: 'https://www.instagram.com/marinaferraznutri',
          },
        ],
        openingHours: ['Segunda a sexta, das 8h as 19h', 'Sabado, das 8h as 12h'],
      },
      {
        id: 'chamada-final',
        type: 'cta',
        variant: 'centered-band',
        visible: true,
        anchor: 'agendar',
        motionPreset: 'cta-gradient-flow',
        headline: 'Comece com uma conversa, nao com uma dieta',
        body: 'Me conte no WhatsApp o que voce procura e a gente ve se faz sentido comecar agora.',
        primaryCta: {
          kind: 'whatsapp',
          label: 'Agendar uma avaliacao',
          target: '+5519998877665',
          prefilledMessage: 'Ola, Marina. Vim pelo site e gostaria de agendar uma avaliacao.',
        },
      },
      {
        id: 'rodape',
        type: 'footer',
        variant: 'simple-centered',
        visible: true,
        motionPreset: 'none',
        businessName: 'Marina Ferraz Nutricao',
        tagline: 'Nutricao clinica em Campinas, presencial e online.',
        links: [
          { kind: 'anchor', label: 'Atendimento', target: 'atendimento' },
          { kind: 'anchor', label: 'Duvidas', target: 'duvidas' },
        ],
        socialLinks: [
          {
            kind: 'external',
            label: 'Instagram',
            target: 'https://www.instagram.com/marinaferraznutri',
          },
        ],
        legalNote: 'CRN-3 numero 41287',
        showAgencyCredit: false,
      },
    ],

    motion: { level: 'BALANCED', respectReducedMotion: true, useSmoothScroll: false },

    seo: {
      title: 'Marina Ferraz | Nutricao clinica em Campinas',
      description:
        'Consultorio de nutricao clinica no Cambui, em Campinas, com atendimento presencial e '
        + 'online. Plano alimentar individual e acompanhamento mensal.',
      canonicalUrl: null,
      ogImage: null,
      noindex: true,
      jsonLdType: 'ProfessionalService',
    },

    geo: {
      entityName: 'Marina Ferraz Nutricao',
      entitySummary:
        'Consultorio de nutricao clinica em Campinas, SP, atendendo adultos presencialmente no '
        + 'Cambui e online em todo o Brasil.',
      servicesSummary: [
        'Consulta de nutricao clinica em Campinas',
        'Acompanhamento nutricional mensal',
        'Nutricao para pre e pos-operatorio',
        'Consulta de nutricao online',
      ],
      locationSummary: 'Cambui, Campinas - SP, com atendimento online para o restante do Brasil',
    },

    integrations: {
      whatsappE164: '+5519998877665',
      mapsPlaceId: 'ChIJfixture000000',
      analytics: 'NONE',
    },
  };
}
