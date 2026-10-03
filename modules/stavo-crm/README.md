# Stavo Digital — plataforma privada de prospecção, CRM e gestão comercial

Aplicação web **privada**, de **usuário único**, para localizar e organizar leads,
conduzir a prospecção em um CRM Kanban, registrar vendas e controlar recebimentos.

Não é um SaaS, não tem cadastro público e não é multiusuário.

---

## 1. O que a plataforma faz

| Área | Entrega |
| --- | --- |
| **Buscar empresas** | Pesquisa pela API oficial do Google Places (New), feita pelo servidor, com controle de quota e atribuição |
| **CRM Kanban** | Colunas configuráveis, arrastar no desktop, "Mover para…" no celular, drawer completo por lead |
| **Deduplicação** | `place_id`, telefone, domínio próprio e nome+endereço impedem dois cards da mesma empresa |
| **Importação** | Assistente CSV/XLSX com mapeamento, validação, relatório e revisão de campos vazios |
| **Vendas e financeiro** | Propostas, vendas, recebíveis, pagamentos, estornos e recorrências mensais idempotentes |
| **Dashboard e metas** | Métricas por eventos históricos, funil atual, "Precisa da sua atenção" e metas diária/semanal/mensal |
| **Exportação** | Backup lógico em JSON e listas em CSV, sem segredos e sem risco de fórmula maliciosa |

### Princípios que o código respeita

- **Estado atual ≠ histórico.** Mover um card muda onde ele está, nunca apaga o que aconteceu.
- **Primeiro contato é único.** Três follow-ups continuam sendo um único contato novo.
- **Pendente não é receita.** Só pagamento confirmado entra na receita realizada.
- **Nada é sobrescrito.** Importação duplicada é ignorada; o preenchimento de campo vazio exige confirmação campo a campo.
- **Nada é apagado.** Leads são arquivados; financeiro é cancelado, estornado ou revertido — sempre com motivo.
- **Dados do Google são transitórios.** Só o `place_id` e o que você confirmar viram registro permanente.

---

## 2. Stack

- **Frontend:** React 18 + Vite + TypeScript (strict), TanStack Query, React Hook Form, Zod, Tailwind CSS, Radix UI, dnd-kit, Recharts
- **Backend:** Node.js 22 + Express + TypeScript, Drizzle ORM, mysql2, Zod, pino
- **Banco:** MySQL (Hostinger)
- **Testes:** Vitest, Supertest, Playwright

Sem Supabase, Firebase, PostgreSQL, Redis, Docker obrigatório, SMTP ou OAuth.

---

## 3. Requisitos

- Node.js **22 ou superior**
- MySQL 8 (ou MariaDB compatível)
- Uma chave da **Google Places API (New)** — opcional para desenvolvimento; sem ela o
  restante do sistema funciona normalmente e a tela de pesquisa explica a configuração.

---

## 4. Instalação local

```bash
npm ci
cp .env.example .env          # preencha os valores locais
npm run db:migrate            # cria o schema
npm run db:seed               # etapas, origens, motivos e preferências
npm run admin:bootstrap       # cria o administrador (usa ADMIN_INITIAL_PASSWORD)
npm run dev                   # API em :3000 e interface em :5173
```

Gere um `SESSION_SECRET` forte:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

> **Nunca** coloque senha, chave ou credencial em arquivo versionado.
> `.env` está no `.gitignore`; `.env.example` contém apenas nomes.

---

## 5. Variáveis de ambiente

Todas estão documentadas com comentários em [`.env.example`](.env.example).
As obrigatórias em produção:

| Variável | Observação |
| --- | --- |
| `NODE_ENV` | `production` |
| `PORT`, `HOST` | A hospedagem define a porta; `HOST` deve ser `0.0.0.0` |
| `APP_URL` | URL final com HTTPS |
| `DB_HOST` … `DB_PASSWORD` | MySQL da Hostinger |
| `SESSION_SECRET` | Mínimo de 32 caracteres; a aplicação recusa iniciar com valor fraco |
| `ADMIN_EMAIL` | `stavodigital123@gmail.com` |
| `ADMIN_INITIAL_PASSWORD` | **Temporário.** Remova após criar o administrador |
| `GOOGLE_MAPS_API_KEY` | Só no servidor; nunca vai ao navegador |
| `CRON_SECRET` | Opcional; protege o endpoint de manutenção |

---

## 6. Comandos

| Comando | O que faz |
| --- | --- |
| `npm run dev` | Servidor + interface em modo desenvolvimento |
| `npm run build` | Compila frontend (`dist/client`) e backend (`dist/server`) |
| `npm start` | Sobe o processo único de produção |
| `npm run lint` | ESLint sem tolerância a avisos |
| `npm run typecheck` | TypeScript strict em todo o projeto |
| `npm test` | Testes unitários (Vitest) |
| `npm run test:integration` | Testes de integração (**exigem MySQL de teste**) |
| `npm run test:e2e` | Jornadas E2E (Playwright, exige app no ar) |
| `npm run check` | lint + typecheck + testes + build |
| `npm run db:generate` | Gera uma nova migração a partir do schema |
| `npm run db:migrate` | Aplica as migrações versionadas |
| `npm run db:seed` | Seed idempotente |
| `npm run admin:bootstrap` | Cria o administrador único |
| `npm run admin:reset-password` | Redefinição emergencial no servidor |
| `npm run jobs:recurrences` | Gera mensalidades e marca vencidos (idempotente) |

---

## 7. Estrutura

```
src/
  shared/     contratos Zod, constantes e formatação pt-BR
  server/     config · db · domain (regras puras) · modules · middleware · jobs
  client/     components (ui, layout, crm) · pages · hooks · lib
drizzle/      migrações SQL versionadas
scripts/      tarefas administrativas
tests/        unit · integration · e2e
docs/         documentação obrigatória
```

---

## 8. Documentação

| Documento | Conteúdo |
| --- | --- |
| [docs/architecture.md](docs/architecture.md) | Decisões, fronteiras e exclusões |
| [docs/data-model.md](docs/data-model.md) | Entidades, índices e invariantes |
| [docs/business-rules.md](docs/business-rules.md) | Etapas, eventos, métricas, dedup, vendas, recorrências |
| [docs/google-places.md](docs/google-places.md) | Field masks, quota, persistência, atribuição, limitações |
| [docs/deploy-hostinger.md](docs/deploy-hostinger.md) | Procedimento completo de implantação |
| [docs/admin-password-reset.md](docs/admin-password-reset.md) | Redefinição emergencial de senha |
| [docs/backup-restore.md](docs/backup-restore.md) | Backup, restauração e rollback |
| [docs/testing.md](docs/testing.md) | Como rodar cada suíte e o checklist manual |
| [docs/security.md](docs/security.md) | Ameaças, controles e revisão |
| [docs/risks.md](docs/risks.md) | Riscos técnicos e mitigações |

---

## 9. Limitações honestas

A plataforma antecipa organização e sinais, mas **não garante**:

- que uma empresa realmente não possua site fora do Google;
- que um telefone tenha WhatsApp (o Google não informa isso — o rótulo é sempre "não confirmado");
- que um Instagram encontrado seja o oficial da empresa;
- que os dados públicos estejam corretos ou atualizados.

A validação final é sempre humana. O módulo financeiro é **controle comercial interno**
e não substitui contabilidade fiscal oficial.
