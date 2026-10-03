# Plano de implementação — Sites com IA

Módulo de geração de sites one-page demonstrativos dentro do CRM existente.
Especificação de origem: `PROMPT_MESTRE_SITE_COM_IA_CLAUDE_CODE.md`.

Este arquivo é o registro vivo do trabalho. O status de cada etapa reflete o
que existe no repositório, não a intenção.

---

## 1. Linha de base auditada (Etapa A0)

Verificada em 28/08/2026, antes de qualquer alteração de código.

| Comando | Resultado |
| --- | --- |
| `npm run lint` | passa, zero avisos |
| `npm run typecheck` | passa |
| `npm test` | 19 arquivos, 265 testes, todos verdes |
| `npm run build` | cliente + servidor compilam |

`git status` limpo, exceto o próprio documento da especificação, não versionado
antes desta implementação.

Falha ambiental observada e **não** originada no repositório: a primeira
execução do `vitest` abortou com `ERR_DLOPEN_FAILED` ao carregar
`@rollup/rollup-win32-x64-msvc`, bloqueado por política de Controle de
Aplicativo do Windows. A repetição imediata do mesmo comando passou. É
intermitente, afeta apenas esta máquina e não deve ser confundida com
regressão do módulo.

### Stack real confirmada

- **Node.js 24.14.1** local; `package.json` exige `>=22`.
- **Frontend:** React 18 + Vite 6 + TypeScript strict, TanStack Query,
  React Hook Form, Zod, Tailwind, Radix UI, dnd-kit, Recharts, React Router 7.
- **Backend:** Express 4 + TypeScript, Drizzle ORM 0.45 sobre mysql2, Zod, pino.
- **Banco:** MySQL (Hostinger). Migrações versionadas em `drizzle/`, hoje até
  `0003_reversal_dates`.
- **Testes:** Vitest (unit + integration com config separada), Playwright (e2e).
- **Build:** `vite build` para o cliente, `esbuild` via
  `scripts/build-server.mjs` para o servidor. Processo único em produção.

### Convenções que o módulo deve seguir

- Ids: ULID de 26 caracteres via `newId()` em `src/server/lib/ids.ts`.
  Nunca inteiro sequencial exposto.
- Dinheiro: `decimal(14,2)`, jamais float. Helper `money()` no schema.
- Timestamps: `datetime` com `fsp: 3`, gravados em UTC.
- Status e enums: `varchar` com comentário listando os valores, validado no
  domínio — o repositório evita `mysqlEnum` por causa da evolução de schema.
- Concorrência otimista: coluna `version` incrementada a cada alteração;
  conflito responde 409. Precedente em `meetings`.
- Módulo de servidor é uma pasta em `src/server/modules/<nome>/` com
  `router.ts` e `service.ts`, registrada em `src/server/routes.ts`.
- Contratos Zod compartilhados vivem em `src/shared/schemas.ts`; regras de
  domínio puras usadas pelos dois lados ficam em `src/shared/<assunto>.ts`.
  Precedentes: `meetings.ts`, `roles.ts`.
- Autorização: `requireAuth` e `requireCapability(...)` de
  `src/server/middleware`. Capacidades em `src/shared/roles.ts`.
- CSRF: `csrfProtection` em toda rota mutável.
- Páginas do cliente em `src/client/pages/`, carregadas com `lazy()` em
  `App.tsx`, item de menu em `components/layout/AppLayout.tsx`.
- Migrações são aplicadas automaticamente no boot (`AUTO_MIGRATE`), porque a
  hospedagem não dá terminal. Toda migração nova precisa ser aditiva e
  idempotente.

### Pontos de integração mapeados

| Necessidade do módulo | Onde encaixa |
| --- | --- |
| Ação no card e no drawer | `src/client/components/crm/LeadDrawer.tsx` |
| Item de menu | `src/client/components/layout/AppLayout.tsx` |
| Rotas do cliente | `src/client/App.tsx` |
| Registro das rotas de API | `src/server/routes.ts` |
| Dados do lead para prefill | `leads`, `lead_contacts`, `lead_links` |
| Configuração sem segredo | `app_settings` e `src/server/modules/settings` |
| Upload | padrão `multer` de `src/server/modules/imports/router.ts` |
| Variáveis de ambiente | `src/server/config/env.ts`, validado por Zod |
| CSP da rota pública | `src/server/app.ts`, hoje com CSP única e restritiva |

---

## 2. Riscos confirmados

1. **CSP única para toda a aplicação.** O `helmet` em `app.ts` aplica uma
   política restritiva a tudo. O site publicado precisa de política própria
   para fontes, imagens e estilos de tokens. Exige separar a CSP da rota
   pública da CSP do CRM, sem afrouxar o CRM.
2. **Persistência do filesystem na Hostinger não comprovada.** A especificação
   (§16.4) manda parar antes da publicação real se não for possível provar que
   o diretório sobrevive a um deploy. Enquanto não houver essa prova, o driver
   de storage fica em `local` com diagnóstico no boot e a publicação real
   permanece bloqueada por diagnóstico explícito, nunca por simulação.
3. **Origem pública ainda não existe.** Nem `sites.instal.digital.com.br` nem
   o domínio atual estão configurados; o CRM sequer foi publicado. A rota
   pública será `/p/:slug` na própria origem, que funciona sem DNS novo. O
   subdomínio dedicado fica como configuração manual documentada.
4. **O fallback de SPA captura tudo.** `app.get('*')` responde qualquer
   caminho fora de `/api`. A rota pública precisa ser registrada **antes**
   dele, senão o prospect recebe o HTML do CRM.
5. **Sem chave da Anthropic e sem MySQL local.** Todo o trabalho será validado
   em modo mock determinístico e em testes. A geração real fica implementada e
   bloqueada com diagnóstico, conforme §24.
6. **Worker no mesmo processo.** A fila em MySQL roda dentro do processo
   Express existente (§22.1), premissa de instância única — a mesma que o
   `auto-migrate` já assume. Exige lease com heartbeat e recuperação no boot.
7. **Tamanho da biblioteca.** As metas da §10.3 somam 70 variantes. É a maior
   fatia isolada do trabalho e não pode ser declarada pronta por duplicação
   cosmética.

---

## 3. Etapas e status

Ordem obrigatória da §28. Uma etapa só é marcada concluída com lint, typecheck
e testes verdes.

| Etapa | Escopo | Status |
| --- | --- | --- |
| A0 | Auditoria, linha de base e plano | concluída |
| A1 | Feature flag, env, migrações base, state machines, repositórios | concluída |
| A2 | SiteSchema versionado, policies, sanitizers, linter determinístico | concluída |
| A3 | Primitivas, registry e primeiro renderer vertical | concluída |
| A4 | Biblioteca completa de componentes | concluída (blueprints na A6) |
| A5 | Motion system: CSS nativo, reduced-motion, cleanup | concluída |
| A6 | Providers, structured output, prompt versionado, modo mock | concluída |
| A7 | Fila persistente em MySQL, eventos, SSE e recuperação | concluída |
| A8 | Fluxo de criação: card, menu, wizard, progresso | concluída |
| A9 | Editor visual, autosave, undo/redo, versões | concluída |
| A10 | Assets, upload seguro, crop e focal | concluída (OpenAI Images adiado) |
| A11 | SEO/GEO e QA determinístico | concluída |
| A12 | Publicação, snapshot, slug, rollback, smoke anônimo | concluída |
| A13 | Exportação ZIP estática validada | concluída |
| A14 | WhatsApp e integração final com o CRM | concluída |
| A15 | Hardening, documentação e rollout | concluída |
| B | Correção dos dados do lead, só depois de A15 | concluída |

---

## 4. Migrações previstas

Todas aditivas e forward-only, sem tocar em dado existente. Numeração a partir
de `0004`.

| Tabela | Papel |
| --- | --- |
| `site_projects` | projeto, vínculo opcional com lead, draft, seed, lock |
| `site_project_versions` | versões imutáveis do config |
| `site_generation_jobs` | fila persistente, lease, idempotência |
| `site_generation_events` | trilha de etapas reais para SSE e histórico |
| `site_assets` | arquivos com proveniência, direitos e expiração |
| `site_publications` | snapshots publicados e ponteiro ativo |
| `site_ai_usage` | tokens, modelo e custo, append-only |
| `site_outreach_messages` | mensagens de WhatsApp e confirmação manual |

Nenhuma chave estrangeira em cascata a partir de `leads`: o vínculo é
`SET NULL` ou `RESTRICT` conforme o caso, preservando o princípio de que
histórico e financeiro não somem em silêncio.

---

## 4.1 Estado da Etapa A1

Entregue e verificado com lint, typecheck, 300 testes e build.

- `src/shared/site-ai.ts` — máquinas de estado de projeto, job e publicação;
  slug com palavras proibidas e caminhos reservados; tetos de segurança.
- `src/shared/roles.ts` — capacidade `SITE_AI_MANAGE` (OWNER e PARTNER).
- `src/server/config/env.ts` — 24 variáveis novas, `siteAiMode()` e
  diagnóstico. Falta de chave **não** invalida o ambiente.
- `src/server/db/schema.ts` — as 8 tabelas.
- `drizzle/0004_site_ai_module.sql` — migração aditiva, nenhum `DROP`.
- `src/server/modules/site-ai/` — `repository.ts`, `service.ts`, `router.ts`.
- `tests/unit/site-ai-domain.test.ts` — 34 testes do domínio.

Dois erros reais encontrados pelos próprios testes e corrigidos:

1. Uma constraint gerada media exatamente 64 caracteres, o teto do MySQL — a
   mesma classe de bug do commit `dfcf2ed`. A coluna virou `version_id` e a
   maior constraint caiu para 56.
2. `validateSlug` recusava `p` e `api` por tamanho antes de checar a lista de
   reservados, dando o motivo errado. A ordem foi invertida.

### Estado da Etapa A2

Entregue e verificado com lint, typecheck, **349 testes** e build.

- `src/shared/site-schema.ts` — SiteSchema versionado: tokens fechados por
  faixa, união discriminada de 16 tipos de seção, fatos com proveniência,
  SEO/GEO, e `migrateSiteSchema()` que recusa versão desconhecida em vez de
  adivinhar.
- `src/shared/site-sanitize.ts` — remoção de HTML, caracteres invisíveis e
  bidi; allowlist de protocolo; bloqueio de host interno e de credencial
  embutida; `wa.me` sempre montado, nunca aceito pronto; neutralização de
  prompt injection.
- `src/shared/site-color.ts` — contraste WCAG e ajuste que preserva o matiz da
  cor de marca em vez de trocá-la.
- `src/shared/site-linter.ts` — linter determinístico, sem IA, com dois níveis:
  erro bloqueia publicação, aviso exige confirmação consciente.
- `src/server/modules/site-ai/fixture.ts` — projeto de referência completo,
  que **passa no linter com zero erros** (testado).
- `tests/unit/site-schema.test.ts` — 49 testes.

A regra mais importante da etapa: depoimento, credencial, número e endereço só
existem na página se estiverem em `business` com proveniência confirmada. Um
depoimento inventado é `ERROR` e trava a publicação.

### Estado da Etapa A3

Entregue e verificado com lint, typecheck, **391 testes** e build.

- `src/shared/site-registry.ts` — 14 variantes declaradas com limites reais
  (mín/máx de itens, densidades, presets compatíveis) e `registryForPrompt()`,
  a representação compacta que a IA recebe — sem uma linha de código de
  componente.
- `src/shared/site-renderer.ts` — o renderer único. CSS derivado dos tokens,
  HTML semântico, escape obrigatório, JSON-LD só com fato confirmado.
- `src/shared/site-runtime.ts` — runtime opcional em ES5, sem dependência e
  sem nenhuma requisição de rede.
- `tests/unit/site-renderer.test.ts` — 42 testes.

**Desvio consciente da especificação (§5.5).** O documento sugere componentes
React isomórficos com `react-dom/server`. Optei por um renderer que produz
HTML em string. O objetivo declarado da seção — *"evite manter um renderer de
preview e outro de exportação com implementações divergentes"* — é atendido de
forma mais forte: não há dois caminhos, é uma função pura, e um teste prova que
a mesma entrada gera bytes idênticos. Além disso o site publicado fica sem
React, sem hidratação e sem bundle da plataforma, o que a §17.1 exige do ZIP.

Prova de funcionamento: a fixture renderiza 22 KB de HTML com **zero erros e
zero avisos** do linter.

### Estado da Etapa A4

Entregue e verificado com lint, typecheck, **500 testes** e build.

A biblioteca atingiu as metas da §10.3: **73 variantes de seção + 5 de
cabeçalho = 78**. (As somas que citei antes, de 70 e 74, estavam erradas; a
soma correta da tabela é 78.)

| Arquivo | Conteúdo |
| --- | --- |
| `src/shared/site-render-utils.ts` | primitivas: escape, imagem, link, botão, ícones SVG inline |
| `src/shared/site-sections/hero.ts` | 8 variantes de hero |
| `src/shared/site-sections/lists.ts` | serviços 6, benefícios 5, público 4, processo 5, números 3, galeria 4 |
| `src/shared/site-sections/content.ts` | sobre 5, autoridade 4, depoimentos 4, FAQ 4, oferta 4 |
| `src/shared/site-sections/chrome.ts` | cabeçalho 5, CTA 5, contato 4, formulário 3, rodapé 5 |
| `src/shared/site-styles.ts` | CSS derivado dos tokens, cobrindo todas as variantes |
| `tests/unit/site-library.test.ts` | 109 testes |

O critério de variante é cobrado por teste: **cada uma renderiza de verdade e
gera HTML estruturalmente distinto das irmãs da mesma família** — a comparação
remove o nome da variante antes de comparar, então uma duplicata cosmética
seria reprovada.

Dois erros reais encontrados pelos próprios testes:

1. **XSS no JSON-LD.** O escape de `<` estava escrito com um contrabarra só,
   o que o TypeScript interpreta como o próprio `<` — a substituição era um
   no-op e uma descrição maliciosa fechava a tag `script`. Corrigido e coberto
   por teste.
2. **Id de variante duplicado.** `rail-scroll` existia em galeria e em
   depoimentos, e como a seção guarda só `variant` (sem o tipo), a busca
   devolvia a variante errada. O da galeria virou `media-rail`, e a unicidade
   global agora é travada por teste.

### Estado da Etapa A5

Entregue e verificado com lint, typecheck, **528 testes** e build.

- `src/shared/site-motion.ts` — registry com os 12 presets, cada um declarando
  alvo, duração, easing, gatilho, comportamento no celular, custo e fallback.
- `src/shared/site-runtime.ts` — runtime reescrito: presets implementados,
  contador, scrub, cabeçalho que encolhe, barra de progresso, e
  `__siteRuntimeCleanup()` para o editor.
- `src/shared/site-styles.ts` — CSS de cada preset, todo atrás da classe `js`.
- `docs/site-ai-motion.md` — decisões e a ressalva de licença do GSAP.
- `tests/unit/site-motion.test.ts` — 30 testes.

**Desvio consciente: não instalei o GSAP.** A §2.5 pede "suporte controlado a
GSAP e ScrollTrigger", mas a §14.1 só autoriza biblioteca com "licença
compatível" e a §25.8 manda verificar a licença antes de produção. O
`gsap@3.15.0` usa a *Standard "no charge" license*, que cobre sites comuns —
só que este módulo é um **gerador** de sites para múltiplos clientes finais, o
caso que a licença padrão do GSAP historicamente tratava à parte. Não consegui
confirmar daqui o texto atual dos termos para esse uso.

Como nenhum dos 12 presets precisa de motor de timeline, implementei todos com
CSS, `IntersectionObserver` e `requestAnimationFrame`: o runtime tem menos de
20 KB (contra ~70 KB do GSAP + ScrollTrigger) e o site publicado não carrega
biblioteca nenhuma. O campo `needsTimelineEngine` já existe no registry para o
dia em que um preset justifique a adição — e `docs/site-ai-motion.md` lista o
que fazer nesse dia. **Esta decisão é sua para revisar.**

### Estado da Etapa A6

Entregue e verificado com lint, typecheck, **559 testes** e build.

- `src/server/modules/site-ai/ai/plan-schema.ts` — o subconjunto do SiteSchema
  que a IA pode autorar. Depoimento, credencial, número, preço e endereço NÃO
  existem nesse schema; vêm sempre do assembler a partir de `business`.
- `src/server/modules/site-ai/ai/assembler.ts` — funde plano + fatos em um
  SiteSchema completo. Ajusta contraste automaticamente preservando o matiz;
  descarta seção que pede fato ausente em vez de inventar.
- `src/server/modules/site-ai/ai/anthropic-provider.ts` — Structured Outputs
  via tool-use forçado, um reparo estruturado, mapeamento de erro por código.
- `src/server/modules/site-ai/ai/mock-provider.ts` — determinístico (mesma
  entrada → mesma saída), sem rede, dirigido pelo negócio real informado.
- `src/server/modules/site-ai/ai/prompts/site-plan-v1.ts` — prompt versionado,
  briefing sempre delimitado como dado não confiável.
- Instalado `@anthropic-ai/sdk@0.122.0` e `zod-to-json-schema@3.25.2`.

Três erros reais achados pelos testes: um alvo de CTA vazio violando o schema
(corrigido com um token de placeholder resolvido depois pelo assembler); um
deslocamento de bits que virava índice negativo em `pick()` e produzia
`bodyFont: undefined`; e o mais sério — o ajuste automático de contraste
escrevia a cor corrigida no **campo errado** (`surface` em vez de `text`),
porque o código derivava o campo a ajustar a partir do `path` de exibição do
linter, que nem sempre corresponde ao campo real. Corrigido separando
"campo para o editor apontar" de "campo a ajustar" (`fgKey`), com dois testes
diferenciando o caso corrigível do caso genuinamente sem solução (que agora
corretamente bloqueia a publicação em vez de fingir sucesso).

### Estado da Etapa A7

Entregue e verificado com lint, typecheck e build (**563 testes** unitários;
6 testes de integração do worker escritos e skipados honestamente por falta
de MySQL local — ver `tests/integration/site-ai-worker.test.ts`).

- `src/server/modules/site-ai/worker.ts` — worker no mesmo processo, sem
  Redis. Claim atômico, lease com heartbeat, recuperação de lease vencido no
  boot, cancelamento cooperativo entre etapas, concorrência configurável.
- Rotas novas: `POST /api/site-jobs/:jobId/retry` e
  `GET /api/site-jobs/:jobId/stream` (SSE, reconecta com `Last-Event-ID`,
  fecha sozinho ao chegar a um estado terminal).
- `src/server/index.ts` — worker sobe só com o módulo ligado; encerramento
  gracioso espera o job em andamento antes de fechar o banco.

### Estado das Etapas A8, A9 e A10

Entregues e verificadas com lint, typecheck, **598 testes** e build.

**A8 — fluxo de criação.** Item "Sites com IA" no menu, `SiteAiPage` (listagem
com filtros), `SiteWizardDialog` (3 passos), `SiteProjectPage`,
`SiteProgressView` (SSE com fallback de polling) e a aba no drawer do lead
(`LeadSiteAiSection`). Corrigi uma lacuna da A1: `createSiteProjectSchema` não
aceitava o briefing completo — adicionei `siteBriefingSchema` e o worker agora
embrulha telefone/e-mail/endereço digitados como fato `USER_CONFIRMED`.

**A9 — editor visual.** `SiteEditor` roda o **mesmo `renderSite` do
servidor** dentro de um iframe, importado direto no bundle do cliente — não
existe "renderer de preview" separado. Painel de seções, painel de
propriedades genérico (por convenção de nome/tipo de campo, com política de
somente-leitura para todo campo que carrega fato confirmado), autosave com
trava otimista, desfazer/refazer local, histórico de versões com restauração,
e edição de seção por IA usando o `patchSection` da A6.

*Redução de escopo documentada:* reordenar usa botões subir/descer, não
arrastar-e-soltar — mesmo resultado, muito menos risco no tempo disponível.

**A10 — assets.** `sharp` para decodificação real (nunca cabeçalho lido à
mão), MIME por assinatura de bytes, EXIF removido, versão otimizada sempre em
WebP. `StorageAdapter` com verificação de escrita/leitura/remoção real no
boot (§16.4) — nunca suposição. Upload integrado ao editor com ponto focal.

*Redução de escopo documentada:* **OpenAI Images não foi implementado.** A
especificação marca essa integração como opcional (§13.4), e sem chave para
testar, priorizei terminar publicação, ZIP e WhatsApp — que a jornada de
"definição de pronto" (§3) exige e a geração de imagem não. As variáveis de
ambiente já existem desde a A1; a interface `SiteIntelligenceProvider` e a
tabela de preços já preveem o custo de imagem. Falta escrever o provider.

Dois erros reais achados pelos testes: `pick()` do mock (A6) podia receber um
seed negativo de um deslocamento de bits e devolver `undefined` — já corrigido
na A6, mas o mesmo padrão foi verificado aqui. E o assembler omitia a chave
`image` inteiramente em vez de defini-la como `undefined`, o que esconderia o
slot de imagem do editor (`Object.keys` não lista uma chave nunca atribuída).

### Estado das Etapas A11, A12 e A13

Entregues e verificadas com lint, typecheck, **621 testes unitários** e
build. Além disso, **20 testes Playwright reais** (não simulados): Chromium
de verdade, axe-core de verdade, servidor HTTP de verdade.

**A11 — QA determinístico.** `tests/e2e/site-ai-qa.spec.ts` roda contra o HTML
que `renderSite` produz, sem precisar do CRM nem de MySQL: 6 larguras sem
rolagem horizontal, zero violações críticas/sérias do axe-core (desktop e
celular), reduced-motion visível de imediato, conteúdo íntegro com JavaScript
desligado, e capturas de tela reais como evidência.

*Bug real achado pelo próprio teste, na metodologia — não no site:* a
primeira versão da screenshot de página inteira mostrava as seções abaixo da
dobra **em branco**. O `IntersectionObserver` nunca chega a disparar quando o
Playwright redimensiona a viewport para a altura total num único passo. Um
visitante rolando normalmente nunca veria isso. Corrigido fazendo o teste
rolar de verdade (`scrollIntoViewIfNeeded`) antes de capturar.

**A12 — Publicação.** `artifact-builder.ts` é a peça nova que factoriza a
montagem do artefato (HTML + assets em caminhos relativos), usada tanto pela
publicação quanto pela exportação. Rota pública `/p/:slug` registrada em
`app.ts` **antes** do fallback de SPA, com CSP própria (mais permissiva só
para essa origem, nunca afrouxando a do CRM). Publicar roda um smoke test
HTTP real contra o próprio processo antes de trocar o ponteiro — se falhar, a
publicação anterior nunca sai do ar.

*Bug real achado pelos testes:* a primeira versão do `writeArtifact`
**esqueceu de embutir o runtime** no site publicado — sem ele, nem o menu do
celular, nem as animações, nem o formulário de WhatsApp funcionariam num site
já no ar. Corrigido.

**A13 — Exportação ZIP.** `exporter.ts` reaproveita o mesmo
`buildSiteArtifactFiles` da publicação. `tests/e2e/site-ai-zip.spec.ts`
**extrai o ZIP de verdade** para um diretório temporário, serve com um
servidor HTTP próprio (sem nenhuma peça do CRM) e abre num Chromium real,
provando zero requisições para fora daquele servidor.

*O mesmo bug do runtime apareceu aqui de novo* — eu tinha corrigido na
publicação mas esquecido de aplicar a mesma correção na exportação, porque
ainda não havia extraído um ZIP de verdade para testar. Só a extração real
pegou isso; testar só os bytes do ZIP não teria bastado.

*Adaptação de escopo registrada:* a especificação modela a exportação como
job assíncrono com download em duas chamadas. Implementei como uma única
requisição síncrona que devolve os bytes — a exportação não chama IA e um
site de uma página gera o ZIP em menos de um segundo, então a fila não
agregava valor real aqui.

### Estado da Etapa A14

Entregue e verificada com lint, typecheck, os **621 testes unitários**
existentes ainda verdes, mais **7 testes de integração novos** (ignorados
honestamente por falta de MySQL de teste neste ambiente — nunca marcados
como aprovados) e build de cliente e servidor.

**Rotas** (`router.ts`, seção 18): `GET .../outreach` (histórico), `POST
.../outreach/generate` (exige publicação ativa — nunca gera um convite para
um link que ainda não existe), `PATCH .../outreach/:id` (edição manual,
marca `editedByUser`), `POST .../outreach/:id/opened` e `POST
.../outreach/:id/confirm-sent`, ambas idempotentes via `WHERE ... IS NULL`
no repositório (`markOutreachOpened`/`markOutreachConfirmedSent`).

**Decisão de integração central:** confirmar o envio de um projeto vinculado
a um lead reaproveita `recordActivity` — a MESMA função que todo o resto do
CRM já usa para registrar tentativas de contato — criando uma atividade
`WHATSAPP_ATTEMPT`, em vez de inventar um segundo histórico de contato
paralelo ao já existente no módulo de leads. Nenhuma tabela nova foi
necessária para essa integração além de `site_outreach_messages` (já prevista
desde a A1).

**UI:** seção nova em `PublishPanel.tsx`, visível só quando há publicação
ativa (gerar exige link real). Reaproveita `buildWhatsAppUrl` (já testado na
A2) em vez de montar a URL do `wa.me` à mão — ele também valida o tamanho do
número, então um telefone malformado nunca vira um botão quebrado. Abrir o
link marca "aberto"; só o botão explícito "A mensagem foi enviada de
verdade?" confirma o envio e libera a atividade no lead — abrir o WhatsApp
sozinho nunca conta como contato feito.

**Teste real, não mockado:** `tests/integration/site-ai-outreach.test.ts`
roda contra MySQL de verdade quando `TEST_DB_*` está configurado (aqui não
está — a suíte fica **honestamente ignorada**, com aviso, nunca marcada como
aprovada). Cobre: histórico ordenado, edição manual, idempotência de
"aberto" e de "confirmado" (a segunda chamada não sobrescreve o horário
nem falha), a atividade `WHATSAPP_ATTEMPT` sendo criada de verdade no lead
via `recordActivity`, e que apagar o lead depois não apaga a mensagem —
`leadId` só vira `NULL` (FK `ON DELETE SET NULL`, já prevista no schema).

### Estado da Etapa A15

**Esta foi a etapa mais reveladora de todo o projeto**, porque foi a primeira
vez que qualquer teste de integração deste repositório — não só do módulo
Sites com IA — rodou contra um MySQL de verdade. Até aqui, "testes de
integração passam" significava apenas "compilam e ficam honestamente
ignorados" (o padrão `hasTestDatabase`). A etapa A15 subiu um MySQL 8.4 real
via Docker (`docker run mysql:8.4`, descartável, isolado do banco de
desenvolvimento de qualquer outro projeto na máquina) e rodou a suíte
completa de verdade. Documentado de forma reprodutível em
`docs/testing.md`, seção "Alternativa rápida: MySQL descartável via Docker".

**Resultado objetivo:** migração do zero (0000→0005) aplicada com sucesso,
migração incremental (0004→0005 sobre um banco já existente) também aplicada
com sucesso, **89 testes de integração passando de verdade** (não mais
ignorados) em duas execuções consecutivas sem flakiness, 621 testes
unitários inalterados, 40 testes E2E Playwright inalterados, build de
cliente e servidor limpo, lint e typecheck limpos.

**O que essa primeira execução real encontrou — 2 bugs de produção e 7 bugs
de teste, nenhum visível antes disso:**

**Bug de produção #1 (crítico — o mais sério de toda a implementação).**
`publishProject` rodava o smoke test **antes** de ativar a publicação, mas a
rota pública `/p/:slug` só serve uma publicação com `status='ACTIVE'`. Ou
seja: **toda publicação, sempre, em qualquer ambiente real, falharia no
próprio smoke test** — o recurso de publicar nunca teria funcionado em
produção. Nenhum teste anterior (unitário, E2E) pegou isso porque nenhum
deles publica de verdade contra um banco e um servidor HTTP reais ao mesmo
tempo — só a integração fez isso. Corrigido invertendo a ordem: ativa
primeiro (a rota pública já serve a nova versão), roda o smoke test contra a
URL agora ativa, e **desfaz a ativação automaticamente** se ele falhar
(`repo.rollbackToPublication` restaura a publicação anterior como ACTIVE;
sem publicação anterior, a nova fica `FAILED` e nenhuma fica ACTIVE) — o
comentário "a versão anterior continua no ar" no código agora corresponde ao
que o código de fato faz.

**Bug de produção #2.** As colunas `lead_events.idempotency_key` e
`payments.idempotency_key` eram `varchar(80)`, mas o código compõe chaves
como `<chave-do-cliente>:receivable:<subscriptionId>:<periodo>`, que passam
de 80 caracteres com folga. Cobrança recorrente real (a rota de renovação de
assinatura) teria quebrado com `ER_DATA_TOO_LONG` na primeira execução. Não
é exclusivo do módulo Sites com IA — é uma correção ao financeiro do CRM,
encontrada como efeito colateral de rodar a suíte completa. Corrigido:
migração `0005_widen_idempotency_key_columns.sql` (só alarga para 191,
aditiva, sem perda de dado) e as duas colunas atualizadas em `schema.ts`.

**7 bugs nos próprios testes** (nunca no código de produção), todos por
nunca terem rodado contra um banco de verdade antes:

1. A constante `ADMIN` usada em **cinco** arquivos de teste de integração
   (`crm.test.ts`, `meetings.test.ts` e os três de Sites com IA) tinha 27
   caracteres — um a mais que `users.id` (`varchar(26)`). Todo teste que
   inseria esse usuário falhava com `ER_DATA_TOO_LONG`. Corrigido encurtando
   para 26 caracteres nos cinco arquivos.
2. Os três arquivos de integração de Sites com IA nunca inseriam uma linha
   real em `users` para o `ADMIN` — mas `site_projects.owner_user_id` tem FK
   `NOT NULL` para `users.id`. Corrigido acrescentando o insert (mesmo
   padrão já usado em `crm.test.ts`/`meetings.test.ts`).
3. Nos mesmos três arquivos, o padrão `const projectId = newId(); await
   repo.insertProject({...})` **descartava** o id de verdade que
   `insertProject` gera internamente e devolve — `projectId` era um ULID
   diferente, que nunca existiu no banco. Todo `findProject`/`enqueueJob`
   subsequente falhava (projeto não encontrado / violação de FK). Corrigido
   capturando o retorno de `insertProject` como o `projectId` real.
4. `meetings.test.ts`: o fixture `novoLead(nome)` usava o **mesmo telefone
   fixo** para qualquer nome. Os três testes de "conflito de horário", que
   criam dois leads (`Cliente A` e `Cliente B`) no mesmo teste, colidiam
   entre si na regra (correta) de telefone único — o segundo lead nunca
   chegava a existir. Corrigido derivando o telefone do nome.
5. `tests/integration/setup.ts`: as tabelas `meetings` e `meeting_reminders`
   nunca estiveram na lista `TABLES_IN_DELETE_ORDER` usada por
   `resetDatabase`. Reuniões de um teste vazavam para o próximo dentro do
   mesmo arquivo (uma asserção esperava 1 reunião e encontrou 27, depois 32
   — acumulando a cada teste). Corrigido acrescentando as duas tabelas.
6. `site-ai-worker.test.ts`: os dois testes de "execução completa"
   enfileiravam um job com o projeto ainda em `BRIEFING`, sem passar por
   `QUEUED` — passo que em produção `requestGeneration` sempre faz antes de
   enfileirar. O worker, corretamente, recusava `BRIEFING→GENERATING`
   direto. Corrigido replicando a transição no setup do teste.
7. `site-ai-worker.test.ts`, teste "um restart do worker recupera um job
   travado": tinha uma corrida real. O `beforeEach` do bloco já sobe um
   worker com poll de 100 ms; o teste então tentava "forjar" manualmente um
   lease vencido via `repo.claimJob(job.id, 'processo-morto', -1)` — mas
   nada impedia o worker de verdade de reivindicar o job primeiro, o que
   fazia o cenário de "lease vencido" nunca se formar. Corrigido: o teste
   agora para o worker do `beforeEach`, monta o cenário sem ninguém
   disputando a fila, e só então sobe um worker novo para observar a
   recuperação de verdade.

**Licença e dependências.** `@anthropic-ai/sdk` (MIT), `sharp` (Apache-2.0),
`zod-to-json-schema` (ISC), `jszip` (MIT — a licença dupla MIT/GPL-3.0 do
pacote permite escolher; usamos sob MIT), `axe-core` (MPL-2.0, só
dev-dependency, nunca embarcado no bundle de produção). Nenhuma licença
copyleft ou comercial entra no runtime. GSAP/ScrollTrigger permanecem **não
instalados** por decisão já registrada na etapa A5 (`docs/site-ai-motion.md`).

**Documentação entregue nesta etapa:** seção 14 nova em
`docs/deploy-hostinger.md` (variáveis, armazenamento persistente,
migração); seção 13 nova em `docs/security.md` (superfícies específicas do
módulo: injeção de prompt, proveniência de fatos, CSP em duas zonas);
seção 6.1 nova em `docs/backup-restore.md` (os dois diretórios de
armazenamento não cobertos pelo dump do MySQL); `docs/site-ai-runbook.md`
novo (orçamento, job travado, rotação de chave, publicação com problema,
armazenamento não-persistente, confirmação de WhatsApp); nota de
reprodutibilidade em `docs/testing.md` com o comando Docker exato usado
nesta etapa.

**Atualização — chave real testada (2026-08-29).** O usuário forneceu uma
`ANTHROPIC_API_KEY` de verdade e pediu uma geração real de teste. A primeira
chamada falhou com um erro genuíno da API, nunca visto em modo mock:
`anthropic-workspace-id is required when authenticating with an
identity-linked API key`. A chave era do tipo "multi-workspace" (pessoal,
vinculada a mais de um workspace na organização) — a API exige, para esse
tipo específico de chave, o cabeçalho `anthropic-workspace-id` em toda
chamada. Corrigido com uma variável nova e opcional,
`ANTHROPIC_WORKSPACE_ID`, passada como `defaultHeaders` no cliente do SDK
quando presente (nunca obrigatória para uma chave de workspace único).
Documentado em `docs/deploy-hostinger.md` seção 14 e `.env.example`.

**Atualização — primeira geração real completa (2026-08-29, mesmo dia).**
Depois do fix do workspace, a geração real ainda não funcionava — um job
ficava `RUNNING` para sempre, sem erro visível. Investigação (log real,
consulta direta no MySQL, script isolado reproduzindo a chamada exata que o
worker faz) encontrou, em cadeia, mais quatro problemas reais, três deles
corrigidos:

1. *Corrigido — o mais sério.* `recoverExpiredLeases()` só rodava **uma
   vez**, no primeiro ciclo do worker, nunca de novo durante a vida do
   processo. Um job só se recupera sozinho depois de um *restart* — mas se
   ele travasse com o MESMO processo ainda de pé, ficava preso para sempre.
   Corrigido: roda em todo ciclo (a cada 2s), como o lease com heartbeat
   sempre pretendeu garantir.
2. *Corrigido.* O SDK da Anthropic tenta de novo sozinho quando uma chamada
   demora mais que o timeout — e cada tentativa paga o timeout inteiro de
   novo. Com o padrão do SDK (2 retentativas) e o timeout de 180s, uma
   geração realmente lenta esperava até 9 minutos antes de falhar.
   `maxRetries: 1` explícito no cliente, timeout ajustado para 240s (uma
   geração completa real leva 1-2 minutos; dar 4 minutos por tentativa
   evita a retentativa multiplicar a espera sem necessidade).
3. *Corrigido — causa raiz de verdade.* Um aviso de qualidade gerado pela
   IA real ("nenhum depoimento confirmado...") é bem mais longo que
   qualquer aviso do modo mock, e estourava o limite de 300 caracteres da
   coluna `message` de `site_generation_events`. O INSERT falhava, o
   próprio registro da falha ENTÃO tentava gravar o texto completo do erro
   (com a query SQL inteira dentro) na coluna `error_message` (500
   caracteres) — que TAMBÉM estourava — e essa segunda falha não tinha
   proteção nenhuma. O job ficava `RUNNING` para sempre, porque o código
   que deveria marcá-lo como `FAILED` também quebrava. Corrigido em duas
   camadas: truncamento defensivo em toda mensagem antes de gravar, e uma
   rede de segurança em `handleJobFailure` — se mesmo assim algo falhar ao
   *registrar* a falha, o job é marcado `FAILED` com uma mensagem genérica
   em vez de ficar preso.
4. *Achado, sem correção definitiva possível.* O custo estimado registrado
   (`site_ai_usage.cost_estimated_usd`) ficou bem abaixo do cobrado de
   verdade pela Anthropic (US$ 0,13 registrado contra US$ 1,71 cobrados,
   confirmado pelo usuário no console de billing). Causa parcial
   corrigida: quando há reparo (segunda chamada corrigindo só o campo
   inválido), a PRIMEIRA chamada também é cobrada de verdade, mas o código
   só registrava a segunda — `generateSitePlan` agora acumula tokens/custo
   de todas as chamadas da mesma geração. O resto da diferença não tem
   correção possível do nosso lado: parte veio de chamadas de diagnóstico
   feitas fora do CRM durante esta própria investigação, e uma retentativa
   automática do SDK (item 2) pode processar e ser cobrada por uma
   tentativa que o próprio SDK decidiu descartar antes de nosso código
   nunca saber que ela existiu. `site_ai_usage` continua sendo, por
   desenho, uma estimativa do que o processo observou — nunca a fatura.
   Documentado com todo o detalhe em `docs/site-ai-runbook.md`, seção 1.

Depois dessas quatro correções, uma geração real completa (`Doce Ponto
Confeitaria`, negócio fictício de teste) funcionou de ponta a ponta:
gerada (US$ 0,13, ~2 min), o linter bloqueou corretamente um contraste
insuficiente que a própria IA introduziu (texto branco sobre botão rosa
claro, 2.16:1 contra o mínimo de 4.5:1), a cor foi corrigida no editor, e o
site foi publicado com sucesso (`smokeTestPassedAt` preenchido, HTML real
servido em `/p/doce-ponto-confeitaria`).

Ainda não verificado: se a Hostinger preserva
`SITE_PUBLIC_ASSETS_DIR`/`SITE_ASSETS_DIR` entre deploys (risco já
registrado, procedimento de teste documentado na seção 14 de
`docs/deploy-hostinger.md`).

**Container de teste.** O MySQL descartável usado nesta etapa
(`stavo-crm-test-mysql`, porta `33061`) continua de pé para a Fase B
reaproveitar a mesma verificação real; será removido (`docker rm -f`) ao
final da Fase B, e isso será reportado explicitamente quando acontecer.

---

## 5. Decisões tomadas nesta implementação

- **Rota pública:** `/p/:slug` na origem existente. O subdomínio dedicado fica
  como configuração manual opcional, documentada, sem exigir código novo.
- **Capacidade nova:** `SITE_AI_MANAGE` em `src/shared/roles.ts`, concedida a
  `OWNER` e `PARTNER`. Sem ela, nem o menu nem as rotas aparecem.
- **Feature flag:** `SITE_AI_ENABLED`, padrão `false`. Desligada, o módulo não
  registra menu nem rotas privadas e o CRM segue idêntico ao de hoje.
- **Sem Redis, sem processo extra e sem Docker.** A fila é MySQL, como a
  hospedagem exige.

---

## 6. Fase B — Correção dos dados do lead (§30 da especificação)

**Feita como alteração separada da Fase A**, só depois de A15 estabilizada,
como a especificação exige. Não mexe no gerador de sites; corrige o fluxo de
pesquisa/CRM que existia antes deste projeto começar.

### O que a auditoria encontrou

Antes de escrever qualquer linha, auditei o que já existe em
`src/server/modules/google/`, `src/server/domain/links.ts` e
`LeadDrawer.tsx`. **A maior parte do que a especificação pede já estava
implementada**, e implementada corretamente:

- `leads.placeId` já é permanente (a especificação nota isso: "guardado por
  tempo indeterminado"), consistente com o place_id ser a exceção oficial às
  regras de cache do Google.
- `mapsLinkFromPlaceId(placeId)` já deriva a URL do Maps localmente, sem
  chamada nova, e já é usada em toda resposta de detalhe de lead
  (`queries.ts`) — nunca uma segunda coluna guardando o mesmo link.
- `classifyWebsite` (`domain/links.ts`) já distingue site próprio de
  Instagram/Facebook/diretório/link-in-bio/construtor gratuito pelo host da
  URL — nunca por adivinhação de handle.
- `whatsappLink`/o painel do drawer já rotulam o WhatsApp como **não
  confirmado**, derivado do telefone, nunca `whatsapp_available=true` só por
  existir telefone.
- **"Consultar novamente" já existia**: `GooglePanel` no drawer (arquivo
  `LeadDrawer.tsx`) só consulta o Google com um clique explícito
  (`useState(false)` + botão "Consultar dados atuais no Google") — abrir o
  drawer **não** dispara chamada nenhuma. Cada campo tem seu próprio botão
  "Salvar como confirmado", que grava via `POST /leads/:id/contacts` ou
  `/links` com `origin='USER_CONFIRMED'` — dado manual nunca é sobrescrito
  porque nada além desse clique grava algo.
- Nenhum scraping do Google/Instagram em lugar nenhum do código.

### O gap real, confirmado lendo o código do zero ao fim

**Um único ponto**: a rota `POST /api/google/leads` ("Adicionar ao CRM"), o
único lugar que cria um lead a partir de um resultado de pesquisa, descartava
`contacts: []` e `links: []` **de propósito** — o diálogo de adicionar dizia
literalmente "nunca uma cópia dos dados do Google". Telefone e site que
**já apareciam no card de pesquisa** (mesma consulta, sem custo adicional)
eram jogados fora; o administrador precisava adicionar o lead, abrir o
drawer, clicar em "Consultar novamente" (uma **segunda** consulta,
consumindo cota de novo) e só então clicar em "Salvar como confirmado" —
exatamente o passeio que a seção 30.1 da especificação descreve.

### Correção feita

Em vez de inventar uma camada nova de cache/TTL para conteúdo do Google
(que já teria o mecanismo certo em `GooglePanel`), estendi o diálogo
"Adicionar ao CRM" para oferecer o **mesmo tipo de confirmação explícita**
que o drawer já usa, só que no momento da criação:

- `addGooglePlaceSchema` ganhou dois campos opcionais, `confirmedPhoneE164`
  e `confirmedWebsiteUrl` — vazios por padrão, nunca preenchidos
  automaticamente.
- O diálogo de adicionar mostra uma caixa de marcar para cada um, **ambas
  desmarcadas por padrão** (mesmo padrão de explicitude do botão "Salvar
  como confirmado"), com o telefone/site exatamente como já apareciam no
  card — nenhuma chamada nova ao Google.
- Quando marcado, o servidor passa esse contato/link para `createLead` com
  `dataOrigin: 'USER_CONFIRMED'` — o mesmo peso, a mesma tabela
  (`lead_contacts`/`lead_links`), a mesma reclassificação de tipo por
  conteúdo da URL (`inferLinkType`, não pelo rótulo enviado) que o restante
  do CRM já usa. **Nenhuma coluna nova, nenhuma migração**: os campos de
  proveniência que a seção 30.3 pede (`origin`, `isConfirmed`) já existiam.
- O Maps URL continua nunca persistido — sempre derivado do `placeId` já
  salvo, como antes.
- Duplicata por `place_id` continua bloqueando a segunda tentativa (mesmo
  comportamento de antes; testado explicitamente para confirmar que dados
  confirmados na tentativa recusada não vazam para o lead original).

### Verificação

3 arquivos alterados (`shared/schemas.ts`, `google/router.ts`,
`SearchPage.tsx`) e 1 arquivo de teste novo, zero migração.
`npm run typecheck`, `npm run lint` e os
**621 testes unitários** limpos. **6 testes de integração novos**
(`tests/integration/google-add-lead.test.ts`) rodados de verdade contra o
mesmo MySQL descartável da etapa A15 (não simulados): lead sem confirmação
nasce sem contato/link; telefone marcado vira `PHONE`/`USER_CONFIRMED`;
site marcado vira `WEBSITE`/`USER_CONFIRMED`; um Instagram enviado como
"site" é reclassificado como `INSTAGRAM` pelo conteúdo da URL, nunca pelo
rótulo; telefone inválido entra marcado para revisão em vez de travar a
criação; e o `place_id` duplicado continua bloqueado mesmo com dados
confirmados na segunda tentativa, sem vazamento para o lead já existente.
Suíte de integração completa (agora **95 testes**, todos passando duas vezes
seguidas) e build de cliente/servidor confirmados verdes depois da mudança.

### O que não foi tocado (e por quê)

- **Backfill de leads existentes**: não implementado, por decisão explícita
  da especificação ("não executar backfill pago em massa automaticamente").
  Leads antigos continuam exatamente como estavam; nada foi re-consultado.
- **Card compacto do Kanban**: não ganhou botões de ação novos. O drawer já
  tem "Ligar"/"Abrir WhatsApp"/link do site/Instagram/Maps com proveniência
  visível (`ContactsSection`, já existente); a especificação permite
  explicitamente deixar o card compacto sem sobrecarga ("ícones/ações
  rápidas no card conforme espaço").
- **Nenhuma nova consulta ao Maps Platform Service Specific Terms além da
  já feita**: confirmado nesta etapa, via documentação oficial atual, que
  place_id é isento do limite de cache (pode ser guardado indefinidamente) e
  que coordenadas têm limite de 30 dias — não relevante aqui porque nenhuma
  coordenada é persistida por este módulo.
