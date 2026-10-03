# Inventário de componentes e ativos de terceiros

Registro do que **entra no site do cliente** ou no site-kit: de onde veio, sob
qual licença, e o que aquela licença permite. O processo de registro está em
`.claude/rules/site-kit.md`, seção 11.

Uma linha por item. Nada entra no produto sem linha aqui.

**Como ler as colunas**

| Coluna | O que significa |
| --- | --- |
| ID | `categoria/nome` do componente, ou nome do ativo |
| Fonte | de onde veio ("Original" = escrito neste projeto) |
| URL | endereço da fonte; vazio quando original |
| Licença | identificador SPDX quando existir |
| Versão/data | versão usada, ou data da verificação (AAAA-MM-DD) |
| Modificado | o código/ativo foi alterado depois de trazido? |
| Redistribuição | pode ir dentro do site publicado do cliente? |
| Exportação de código | pode ir no ZIP entregue ao cliente? |
| Atribuição | exige manter aviso de copyright? Onde está o aviso |
| Status | `draft` · `review` · `approved` · `deprecated` · `rejected` |

---

## Componentes de seção

As 73 variantes do catálogo (`src/site-kit/registry/variants.ts`) foram
escritas neste projeto: são funções que montam HTML a partir do schema, sem
código de terceiros.

| ID | Nome | Fonte | URL | Licença | Versão/data | Modificado | Redistribuição | Exportação | Atribuição | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `*/*` (73 variantes) | Catálogo de seções | Original | — | ORIGINAL | 2026-09-20 | — | Sim | Sim | Não | approved |

> Entram aqui linha a linha conforme forem revisadas individualmente pelo
> processo novo. Enquanto isso, valem como aprovadas por já estarem em
> produção com `status: STABLE` no registry.

## Tipografia

Carregadas do Google Fonts pelo site publicado; **não** redistribuímos os
arquivos. Todas são SIL Open Font License 1.1, que permite uso comercial e
incorporação.

| ID | Nome | Fonte | URL | Licença | Versão/data | Modificado | Redistribuição | Exportação | Atribuição | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `font/inter` | Inter | Google Fonts | https://fonts.google.com/specimen/Inter | OFL-1.1 | 2026-09-20 | Não | Sim | Sim (por link) | Não | approved |
| `font/manrope` | Manrope | Google Fonts | https://fonts.google.com/specimen/Manrope | OFL-1.1 | 2026-09-20 | Não | Sim | Sim (por link) | Não | approved |
| `font/sora` | Sora | Google Fonts | https://fonts.google.com/specimen/Sora | OFL-1.1 | 2026-09-20 | Não | Sim | Sim (por link) | Não | approved |
| `font/space-grotesk` | Space Grotesk | Google Fonts | https://fonts.google.com/specimen/Space+Grotesk | OFL-1.1 | 2026-09-20 | Não | Sim | Sim (por link) | Não | approved |
| `font/dm-sans` | DM Sans | Google Fonts | https://fonts.google.com/specimen/DM+Sans | OFL-1.1 | 2026-09-20 | Não | Sim | Sim (por link) | Não | approved |
| `font/work-sans` | Work Sans | Google Fonts | https://fonts.google.com/specimen/Work+Sans | OFL-1.1 | 2026-09-20 | Não | Sim | Sim (por link) | Não | approved |
| `font/fraunces` | Fraunces | Google Fonts | https://fonts.google.com/specimen/Fraunces | OFL-1.1 | 2026-09-20 | Não | Sim | Sim (por link) | Não | approved |
| `font/playfair-display` | Playfair Display | Google Fonts | https://fonts.google.com/specimen/Playfair+Display | OFL-1.1 | 2026-09-20 | Não | Sim | Sim (por link) | Não | approved |
| `font/lora` | Lora | Google Fonts | https://fonts.google.com/specimen/Lora | OFL-1.1 | 2026-09-20 | Não | Sim | Sim (por link) | Não | approved |
| `font/dm-serif-display` | DM Serif Display | Google Fonts | https://fonts.google.com/specimen/DM+Serif+Display | OFL-1.1 | 2026-09-20 | Não | Sim | Sim (por link) | Não | approved |

**Ressalva de exportação:** o ZIP entregue ao cliente referencia o Google
Fonts por link. O site funciona offline, mas com as fontes de sistema. Para um
ZIP realmente autônomo, é preciso hospedar os arquivos `.woff2` — aí a
redistribuição passa a acontecer de fato, e a OFL exige manter o arquivo de
licença de cada família junto.

## Ícones

| ID | Nome | Fonte | URL | Licença | Versão/data | Modificado | Redistribuição | Exportação | Atribuição | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `icon/allowlist` | 17 ícones inline do site | **A verificar** | https://lucide.dev | **UNKNOWN** | 2026-09-20 | Sim (SVG reescrito inline) | A confirmar | A confirmar | A confirmar | review |

> **Pendência aberta.** O comentário em `primitives/render-utils.ts` diz que os
> traçados foram desenhados aqui, mas alguns são idênticos aos do Lucide (o
> `check`, por exemplo, é `M20 6 9 17l-5-5`). O projeto já depende de
> `lucide-react` (ISC) no CRM, então a origem é plausível. Enquanto não for
> confirmado, o status é `review`. Se a origem for Lucide, a solução é simples:
> a ISC permite uso e redistribuição, bastando manter o aviso de copyright — já
> preparado em `THIRD_PARTY_NOTICES.md`.

## Movimento

| ID | Nome | Fonte | URL | Licença | Versão/data | Modificado | Redistribuição | Exportação | Atribuição | Status |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| `motion/presets` | 12 presets de animação | Original | — | ORIGINAL | 2026-09-20 | — | Sim | Sim | Não | approved |

Decisão registrada em `docs/site-ai-motion.md`: o site publicado **não** carrega
GSAP nem qualquer biblioteca de animação. O runtime é escrito neste projeto,
com `IntersectionObserver` nativo. Isso evita tanto o peso quanto a licença
comercial do GSAP para uso em produto de terceiros.

## Dependências que não vão para o site do cliente

React, Radix, Tailwind, Express, Drizzle e demais pacotes rodam **no CRM e no
servidor**, nunca dentro do site gerado. As licenças estão em
`THIRD_PARTY_NOTICES.md`.
