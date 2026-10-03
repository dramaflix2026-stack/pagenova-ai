# Arquitetura — Plataforma Stavo Digital

Documento de decisões arquiteturais (ADR consolidado). É a fonte de verdade técnica.
Nenhuma decisão desta página pode ser trocada silenciosamente.

## 1. Visão geral

Aplicação web **privada**, de **usuário único** (administrador), para prospecção,
CRM Kanban, vendas e controle financeiro da Stavo Digital.

Em produção existe **um único processo Node.js** que:

- expõe a API REST em `/api`;
- serve o frontend React já compilado (`dist/client`);
- responde `GET /api/health` e `GET /api/ready`;
- faz fallback de SPA para rotas do navegador sem interceptar `/api/*`.

```
Navegador (React SPA)
      │ same-origin, cookie HttpOnly
      ▼
Express (Node 22)  ──►  MySQL (Hostinger)
      │
      └──►  Google Places API (New)  [somente servidor, dados ao vivo]
```

## 2. Decisões fixas

| Área | Decisão | Motivo |
| --- | --- | --- |
| Frontend | React + Vite + TypeScript (strict) | Build rápido, bundle estático servível pelo Express |
| Roteamento | React Router | Padrão SPA maduro |
| Estado de servidor | TanStack Query | Cache, invalidação após mutação, estados de carregamento |
| Formulários | React Hook Form + Zod | Validação compartilhada com o backend |
| UI | Tailwind CSS + Radix UI + lucide-react | Acessibilidade real e design system próprio |
| Drag and drop | dnd-kit | Suporta teclado; mobile usa "Mover para…" |
| Gráficos | Recharts | Leve e suficiente para tendências |
| Backend | Node.js 22 + Express + TypeScript | Exigência da Hostinger (uma vaga Node) |
| Banco | MySQL da Hostinger | Único banco persistente do sistema |
| ORM | Drizzle ORM + drizzle-kit | Tipagem forte, migrações SQL versionadas, sem binários nativos |
| Driver | mysql2 (pool) | Maduro, queries parametrizadas |
| Hash de senha | `scrypt` do `node:crypto` | Portável, sem dependência nativa/compilação |
| Sessão | Cookie HttpOnly + token opaco com hash no banco | Sem localStorage, revogável |
| Log | pino (estruturado, redigido) | Sem segredos, com request id |
| Build do servidor | esbuild bundle CJS `--packages=external` | Resolve aliases sem loader em runtime |
| Testes | Vitest + Supertest + Playwright (E2E próprio) | Playwright **nunca** para scraping |

## 3. Exclusões arquiteturais (obrigatórias)

Não existem e não devem ser introduzidos:

- **Supabase**, **Firebase**, **PostgreSQL**, **Redis**, **Docker obrigatório**, **systemd**;
- Vercel como destino desta versão;
- SMTP / envio de e-mail / "esqueci minha senha" / link mágico;
- Google OAuth, login social, Google Sheets API;
- multiusuário, multiempresa, tenants, convites, cadastro público;
- scraping do Google Maps, navegador automatizado para extrair resultados,
  APIs não oficiais, proxies para contornar limite;
- processo residente adicional fora da aplicação Node.

## 4. Estrutura de pastas

```
src/
  shared/          contratos Zod e tipos usados por client e server
  server/
    config/        validação de ambiente (falha rápido)
    db/            schema Drizzle, pool, migrator, seed
    domain/        regras puras e testáveis (sem I/O)
    modules/       auth, leads, stages, services, sources, imports,
                   google, sales, receivables, subscriptions, goals,
                   dashboard, settings, exports  (router + service + repo)
    middleware/    erros, sessão, CSRF, rate limit, request id
    jobs/          recorrências idempotentes
    lib/           utilitários de servidor
  client/
    components/    ui (design system), layout
    pages/         telas
    lib/           api client, formatação, query client
drizzle/           migrações SQL versionadas + snapshots
scripts/           tarefas administrativas (bootstrap admin, reset de senha, cron)
tests/             unit, integration, e2e
docs/              documentação obrigatória
```

## 5. Persistência de dados do Google (política)

Regra central do produto. Para um lead com `origin_type = GOOGLE_PLACE`:

**Pode ser gravado permanentemente**
: `place_id`, `internal_name` (rótulo do CRM definido pelo usuário), origem,
nicho/país/estado/cidade digitados pelo usuário como contexto de campanha,
serviço, etapa, notas, atividades, follow-ups, propostas, vendas, pagamentos,
histórico, e contatos/links que o usuário **explicitamente** confirmar.

**Nunca é gravado automaticamente**
: nome retornado pelo Google, endereço, telefone, nota, quantidade de avaliações,
categoria, website, `googleMapsUri` ou a resposta integral.

Os detalhes são consultados **ao vivo** por `place_id`, exibidos com atribuição
do Google e descartados ao fim da requisição/sessão. Se a API falhar, o conteúdo
próprio do CRM continua íntegro e visível.

## 6. Modelo orientado a eventos

Duas informações distintas convivem:

- **Estado atual** — `leads.current_stage_id` responde "onde o lead está agora";
- **Histórico** — `lead_events` (imutável) e `stage_history` respondem
  "o que aconteceu no período".

Métricas do dashboard vêm dos **eventos**, nunca da contagem das colunas.
Mover um card para trás não apaga fato histórico. Correções são representadas
por eventos de reversão/cancelamento, nunca por exclusão física.

`stages.semantic_key` (`SELECTED`, `FIRST_CONTACT`, `FOLLOW_UP`, `REPLIED`,
`NEGOTIATION`, `AWAITING_PAYMENT`, `WON`, `LOST`, `AUXILIARY`) preserva o
significado mesmo quando o usuário renomeia, recolore ou reordena a coluna.

## 7. Deduplicação

Identidades normalizadas em `lead_identity_keys` + `lead_identity_memberships`:

- `PLACE_ID` — único e **nunca** compartilhável;
- `PHONE` — E.164;
- `OWN_DOMAIN` — host normalizado;
- `NAME_ADDRESS` — nome+endereço normalizados.

Chave já pertencente a outro lead **bloqueia** criação automática. Somente a
decisão humana explícita "São leads diferentes" cria exceção auditada, e uma
chave em exceção nunca autoriza uma terceira criação automática — ela volta
para revisão. Criação/atualização de chaves ocorre na mesma transação do lead.

## 8. Idempotência e concorrência

Mutações críticas aceitam `idempotency_key` e são protegidas por transação,
`UNIQUE` no banco e concorrência otimista via `expected_current_stage_id`:

movimento de etapa · confirmação de venda · geração de recebível ·
confirmação de pagamento · geração de mensalidade · importação · desfazer.

Requisição repetida retorna o resultado original sem criar evento duplicado.

## 9. Produção (Hostinger)

- `HOST=0.0.0.0`, porta por `process.env.PORT`;
- `trust proxy` somente conforme configuração explícita;
- cookies `Secure` + `HttpOnly` + `SameSite=Lax` em produção;
- desligamento gracioso encerrando o pool MySQL;
- recorrências geradas por job **idempotente** disparado no uso da aplicação e,
  opcionalmente, por cron da hospedagem protegido por `CRON_SECRET`;
- nenhum estado crítico em memória do processo.

## 10. Nota sobre o ambiente de desenvolvimento

O ambiente local usa Node 24; o alvo de produção é Node 22 e o código é escrito
e compilado (`--target=node22`) para essa versão. Não há dependência com binário
nativo, portanto o pacote é portável para a Hostinger.
