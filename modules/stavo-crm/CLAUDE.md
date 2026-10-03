# Ferramenta de CRM — Stavo Digital

CRM de prospecção (leads, agenda, financeiro, metas) com um módulo de **Sites
com IA**, que gera sites de demonstração para os leads. Node + Express +
MySQL no servidor, React + Vite no navegador. Português do Brasil em tudo que
o usuário lê.

## Comandos

| | |
| --- | --- |
| `npm run dev` | sobe servidor e cliente |
| `npm run build` | build de produção (o que a Hostinger roda) |
| `npm test` | testes unitários (vitest) |
| `npm run typecheck` / `npm run lint` | tipos e lint (zero aviso) |
| `npm run db:migrate` | aplica migrações (também roda sozinho no boot) |

Antes de entregar qualquer mudança: `npm run typecheck && npm run lint && npm test`.

## Dois mundos de UI — não confundir

**1. O CRM (`src/client/`)** — React + Tailwind + Radix, base do shadcn/ui já
instalada (`components.json`, `src/client/components/ui/`). Para telas do CRM,
use a skill `shadcn` e o MCP oficial: procure um componente existente antes de
escrever um novo.

**2. Os sites gerados (`src/site-kit/`)** — **não são React**. São HTML montado
no servidor por um renderizador determinístico, a partir de um schema validado.
É o **site-kit**: `schemas/` (formato), `registry/` (catálogo de variantes),
`sections/<família>/` (uma pasta por família), `primitives/`, `themes/`,
`interactions/`, `renderer/`, `utils/`.
Componente do shadcn **não entra** em site gerado.

O caminho da geração: briefing → IA devolve `SiteSpec`
(`src/builder/generation/site-spec.ts`) → `spec-to-plan.ts` → `assembler.ts`
(injeta os fatos confirmados) → `site-kit/renderer/` → `builder/publishing/`.

## Regras invioláveis

Valem para todo trabalho neste repositório:

- **Nada de HTML/CSS livre em produção.** Site publicado nasce do schema e do
  renderizador. A IA nunca devolve marcação, e nenhuma rota aceita HTML do
  usuário.
- **Só componentes aprovados do site-kit.** Toda seção de site usa um `type` +
  `variant` que existe em `site-registry.ts`. Variante fora do catálogo é
  recusada, não improvisada.
- **Tokens semânticos, sempre.** No CRM: `bg-primary`, `text-muted-foreground`.
  Nos sites: `var(--primary)`, `var(--text)`. Nunca `bg-blue-500`.
- **Zero cor fixa dentro de seção.** Cor vem do tema (`designTokensSchema`).
  Um hex escrito na seção quebra a direção visual e o contraste calculado.
- **Componente novo = schema Zod.** Sem schema, não existe: é o schema que
  valida a saída da IA e o rascunho do editor.
- **Componente novo = registro.** Entrada em `VARIANT_REGISTRY` com limites de
  itens, suporte a imagem, densidades, presets e `status`.
- **Funciona em 375px, 768px e 1440px.** Sem rolagem horizontal, sem texto
  cortado, alvo de toque mínimo de 44px.
- **Movimento respeita `prefers-reduced-motion`.** Não é opcional e não é
  configurável: quem pediu menos movimento recebe nenhum.
- **Dependência nova exige justificativa** no PR: o que resolve, por que o que
  já existe não resolve, peso e licença.
- **Código copiado exige licença verificada** e registro da origem. Sem
  licença compatível, não entra.
- **Componente Pro (pago) não entra no produto** sem licença que cubra uso em
  gerador de sites para terceiros. Na dúvida, não usar.
- **Chave de API nunca no frontend.** Google, Anthropic e OpenAI são chamadas
  só pelo servidor. Segredo não vai para o bundle, nem para o log, nem para o
  ZIP exportado.

## Fatos nunca vêm da IA

Depoimento, credencial, número, preço, endereço e telefone só aparecem no site
se estiverem em `BusinessFacts` (dado confirmado). O schema da IA nem tem esses
campos, e o linter bloqueia o que passar. Se falta o dado, a seção some — nunca
se inventa.

## Regras detalhadas

Convenções de nome, pastas, responsividade, acessibilidade, semântica,
limites de animação e de texto, imagens, CTA, e os processos para incluir
componente, registrar licença e testar: **[.claude/rules/site-kit.md](.claude/rules/site-kit.md)**.

## Onde ficam as coisas

```
src/site-kit/        o que vira site: schemas, registry, sections, themes,
                     interactions, primitives, renderer, utils, blueprints
src/builder/         quem produz o site: generation, publishing, preview, editor
src/server/modules/  API do CRM: router · service · repository por módulo
src/client/          telas do CRM (React + shadcn)
src/shared/          contratos usados por cliente e servidor
drizzle/             migrações versionadas (nunca editar as antigas)
docs/                deploy, segurança, design-system, referências, licenças
tests/               unit · components · generation · visual · accessibility
                     · integration · e2e
```

Imports do site-kit e do builder usam alias: `@site-kit/...` e `@builder/...`.

## Ao trabalhar aqui

- Comentário explica **por quê**, não o quê. Escreva como o código ao redor.
- Mudança de comportamento vem com teste que falha sem ela.
- Nunca commitar `.env`, `storage/` ou segredo.
- MySQL local pode estar desligado: testes de integração não rodam sem ele.
