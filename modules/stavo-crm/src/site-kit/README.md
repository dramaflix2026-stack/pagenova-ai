# site-kit

Tudo que transforma um schema validado em um site publicável: catálogo de
componentes, temas, movimento, renderizador e verificações de qualidade.

## Finalidade

O site-kit existe para que **nenhum site nasça de HTML escrito na hora**. A IA
escolhe entre opções que existem aqui; o renderizador monta a página de forma
determinística. O mesmo código roda no navegador (prévia do editor) e no
servidor (publicação), e por isso não conhece Express, banco nem React.

Ele é consumido pelo `src/builder/` (que gera e publica) e pelo CRM (que mostra
a prévia). A dependência corre sempre nesse sentido: o site-kit não importa
nada de fora dele. O ESLint recusa o contrário.

```
types/        identidade: id, categoria, status, licença, tema, blueprint
schemas/      o formato do site e os limites de texto
registry/     catálogo de variantes, com limites e presets de cada uma
primitives/   peças de renderização (imagem, botão, ícone, casca da seção)
sections/     uma pasta por família: navigation, heroes, about, benefits,
              services, proof, gallery, process, pricing, faq, forms, cta,
              footers
themes/       CSS a partir dos tokens, cores e tipografia
interactions/ presets de movimento e o runtime do site
renderer/     despacha as famílias e monta o documento
utils/        saneamento e linter
blueprints/   composições de página prontas (ainda vazio)
```

## Como importar

De **fora** do site-kit, use a barrel:

```ts
import { renderSite, siteSchema, lintSite } from '@site-kit';
```

De **dentro**, use o caminho direto do módulo:

```ts
import { fontStack } from '@site-kit/themes/fonts';
```

Importar a barrel de dentro dela fecha um ciclo que o bundler resolve com
`undefined` em tempo de execução — o tipo de erro que só aparece em produção.
A regra está no ESLint, não na memória de quem escreve.

A barrel é curada: exporta contrato, não tudo. Precisar de um helper interno é
sinal de que falta contrato.

## Como incluir um componente

1. **Justifique a variante.** Ela muda composição, hierarquia ou comportamento?
   Se muda só cor, espaçamento ou alinhamento, é token — não entra.
2. **Schema** em `schemas/site-schema.ts` (e o recorte autorável pela IA em
   `@builder/generation/site-spec.ts`, se ela puder escolher).
3. **Renderizador** em `sections/<família>/`, usando os helpers de
   `primitives/`. Nada de `<div>` genérica nem cor fixa.
4. **Registro** em `registry/variants.ts`, com limites de itens, suporte a
   imagem, densidades, presets e versão.
5. **Estilos** em `themes/styles.ts`, só com tokens.
6. **Testes** (seção abaixo) e prévia em 375px, 768px e 1440px.
7. **Licença**, se algo veio de fora.

O passo a passo detalhado, com as convenções de nome e os limites, está em
`.claude/rules/site-kit.md`.

## Como aprovar um componente

Todo componente tem um estado (`types/component.ts`):

| Estado | O que significa |
| --- | --- |
| `draft` | existe, ainda não revisado. A IA nunca recebe |
| `review` | em revisão: código, prévia nos três tamanhos, licença |
| `approved` | pode ir para produção e ser oferecido à IA |
| `deprecated` | continua renderizando por causa de sites publicados, mas não entra em site novo |
| `rejected` | reprovado; fica registrado para não ser proposto de novo |

Para sair de `review` e virar `approved`, os cinco itens precisam estar
verdadeiros:

1. os testes da seção abaixo passam;
2. a prévia foi conferida em 375px, 768px e 1440px, sem rolagem horizontal;
3. contraste AA e navegação por teclado funcionando;
4. o movimento respeita `prefers-reduced-motion`;
5. a licença está registrada, quando houver origem externa.

Rebaixar para `deprecated` é o caminho de aposentadoria: **nunca apague uma
variante nem troque o id dela**, porque sites já publicados apontam para ele.

> Hoje o `registry/variants.ts` ainda usa `STABLE`/`EXPERIMENTAL`. A
> correspondência é direta: `STABLE` → `approved`, `EXPERIMENTAL` → `draft`. A
> troca acontece quando os componentes novos chegarem; o fluxo de geração atual
> não depende dos tipos novos.

## Como registrar licença

Antes de trazer código, ícone, fonte ou imagem de fora:

1. confirme a licença (permissivas são aceitas: MIT, ISC, Apache-2.0, OFL,
   CC0; GPL e "free for personal use" não são);
2. registre a origem, a licença e a data em comentário no topo do arquivo;
3. acrescente a linha em `docs/licenses/component-inventory.md`, com todas as
   colunas preenchidas;
4. se a licença exigir atribuição, acrescente o aviso em
   `THIRD_PARTY_NOTICES.md`, sem remover nada do que já está lá;
5. componente pago só entra com licença que cubra **redistribuição em site de
   terceiro**. Na dúvida, pergunte antes de escrever o código.

Os tipos `ComponentLicense` e `ComponentProvenance` existem para que o código e
o inventário não contem histórias diferentes.

## Como executar os testes

```bash
npm test                      # tudo que não precisa de banco
npx vitest run tests/components   # só o site-kit
npx vitest run tests/generation   # só o builder
npm run typecheck && npm run lint
```

Onde cada teste mora:

| Pasta | O que cobre |
| --- | --- |
| `tests/components/` | schema, renderização, registro, tema, movimento |
| `tests/generation/` | IA, conversão, montagem, publicação |
| `tests/visual/` | screenshot em 375/768/1440 (ainda vazio) |
| `tests/accessibility/` | contraste, foco, teclado (ainda vazio) |

Para um componente novo, o mínimo é: o schema aceita o válido e recusa o
inválido; a renderização escapa texto e sobrevive a campo opcional ausente; o
registro tem id único e limites coerentes; o linter bloqueia a combinação
impossível.
