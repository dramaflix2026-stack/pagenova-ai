# Modelo de dados

MySQL 8, 32 tabelas, 30 chaves estrangeiras. Migrações versionadas em `drizzle/`.

## Convenções

| Aspecto | Decisão |
| --- | --- |
| Chave primária | `varchar(26)` — identificador ordenável por tempo (ULID), bom para índices |
| Dinheiro | `DECIMAL(14,2)` — **nunca** float; trafega como string na API |
| Timestamps | `datetime(3)` gravado em **UTC** (conexão com `timezone: 'Z'`) |
| Datas civis | `date` lido como string `AAAA-MM-DD`, sem conversão de fuso |
| Competência | `varchar(7)` no formato `AAAA-MM` |
| Exclusão | Restritiva no histórico; cascata só em dados-filho puros |

---

## Entidades

### Acesso

| Tabela | Responsabilidade | Invariante |
| --- | --- | --- |
| `users` | Administrador único | `email` único; só `password_hash`, nunca a senha |
| `auth_sessions` | Sessões ativas | Guarda o **hash** do token; expiração por inatividade e absoluta |
| `login_attempts` | Força bruta | Contagem e bloqueio temporário por IP+e-mail (hash) |
| `app_settings` | Preferências não secretas | **Nunca** guarda chave de API ou senha |
| `audit_log` | Ações administrativas sensíveis | Resumo sanitizado, sem segredo |

### Catálogos

| Tabela | Invariante |
| --- | --- |
| `stages` | `semantic_key` sustenta as métricas; `deleted_at` remove do quadro sem orfanar histórico |
| `lead_sources` | `slug` único; origem com leads não é excluída, apenas desativada |
| `loss_reasons` | Pelo menos um motivo ativo sempre existe |
| `services` | Preço padrão é sugestão; tipo de cobrança trava após a primeira venda |

### Leads

| Tabela | Invariante |
| --- | --- |
| `leads` | `place_id` **único** quando não nulo; `internal_name` é rótulo do CRM, não cópia do Google |
| `lead_contacts` | Guarda o valor digitado **e** o normalizado; `is_valid=false` permanece visível para revisão |
| `lead_links` | Tipo inferido pela classificação; `DEMO_OR_PROPOSAL` é dado próprio da Stavo |
| `lead_identity_keys` | `UNIQUE (key_type, key_hash)`; `is_shared_exception` só por decisão humana |
| `lead_identity_memberships` | PK composta `(identity_key_id, lead_id)` |
| `duplicate_reviews` | Suspeitas aguardando decisão; nunca mescla sozinha |
| `lead_service_interests` | Propostas por lead, com `billing_type_snapshot` |

### Histórico

| Tabela | Invariante |
| --- | --- |
| `lead_events` | **Imutável.** `UNIQUE(unique_scope)` garante evento singular; `UNIQUE(idempotency_key)` garante idempotência |
| `stage_history` | Uma linha por passagem; no máximo uma com `exited_at IS NULL` por lead |
| `activities` | Anotações e tentativas; importação nunca sobrescreve |
| `follow_ups` | Aceita data atrasada, hoje ou futura; concluir não apaga |
| `lead_losses` | `UNIQUE (lead_id, cycle)` — uma perda por ciclo lógico |

### Financeiro

| Tabela | Invariante |
| --- | --- |
| `sales` | Status `PENDING → CONFIRMED`; cancelamento preserva snapshots |
| `sale_items` | Snapshots congelados: alterar o catálogo não muda a venda |
| `subscriptions` | `amount_snapshot` é o valor contratado; `last_generated_period` guia o job |
| `subscription_changes` | `UNIQUE (subscription_id, effective_from)` |
| `receivables` | **`UNIQUE (subscription_id, reference_period)`** impede mensalidade duplicada |
| `payments` | `UNIQUE(idempotency_key)`; estorno é linha nova com valor negativo e `reversal_of_id` |
| `goals` | Metas por métrica e período |

### Importação e Google

| Tabela | Invariante |
| --- | --- |
| `import_jobs` | `UNIQUE(idempotency_key)` — reenviar não reimporta |
| `import_rows` | `UNIQUE (import_job_id, row_number)`; guarda só o necessário para relatório e revisão |
| `google_api_usage` | `UNIQUE (billing_month, sku_type)`; incremento **atômico** e condicional |
| `search_runs` | **Apenas metadados** da pesquisa; nunca o conteúdo dos resultados |

---

## Invariantes garantidas pelo banco

```sql
-- Um place_id nunca pertence a dois leads
UNIQUE leads_place_id_unique (place_id)

-- Primeiro contato e primeira resposta existem uma única vez por lead
UNIQUE lead_events_unique_scope (unique_scope)

-- Requisição repetida não gera evento duplicado
UNIQUE lead_events_idempotency_unique (idempotency_key)

-- Uma cobrança por competência de cada assinatura
UNIQUE receivables_subscription_period_unique (subscription_id, reference_period)

-- Pagamento nunca é confirmado duas vezes
UNIQUE payments_idempotency_unique (idempotency_key)

-- Uma identidade forte nunca aponta para dois registros distintos
UNIQUE lead_identity_keys_unique (key_type, key_hash)

-- Uma perda por ciclo lógico
UNIQUE lead_losses_cycle_unique (lead_id, cycle)
```

> O MySQL permite vários `NULL` em índice único. É por isso que `unique_scope`,
> `idempotency_key` e `subscription_id` recebem `NULL` quando a regra não se aplica.

---

## Índices de desempenho

| Consulta | Índice |
| --- | --- |
| Quadro Kanban | `leads_stage_idx (current_stage_id, archived_at)` |
| Filtros do CRM | `leads_source_idx`, `leads_city_idx`, `leads_niche_idx`, `leads_created_idx` |
| Histórico do lead | `lead_events_lead_idx (lead_id, occurred_at)` |
| Métricas do período | `lead_events_type_idx (event_type, occurred_at)` |
| Tempo em etapa | `stage_history_lead_idx`, `stage_history_open_idx` |
| Atenção: follow-ups | `follow_ups_status_due_idx (status, due_at)` |
| Atenção: cobranças | `receivables_status_due_idx (status, due_date)` |
| Próximas recorrências | `subscriptions_status_next_idx (status, next_due_date)` |
| Receita realizada | `payments_date_idx (payment_date, status)` |
| Vendas confirmadas | `sales_status_idx (status, confirmed_at)` |
| Quota do Google | `google_api_usage_unique (billing_month, sku_type)` |

---

## Política de exclusão

| Dado | Comportamento |
| --- | --- |
| Lead | **Arquivar** (`archived_at`), nunca excluir |
| Serviço com histórico | **Desativar** (`active = false`) |
| Origem com leads | **Desativar** |
| Etapa auxiliar com histórico | Sai do quadro (`deleted_at`), a linha permanece |
| Recebível | **Cancelar** com motivo |
| Pagamento | **Estornar** com motivo; o original permanece |
| Venda | **Cancelar** com motivo; snapshots preservados |
| Assinatura | **Cancelar**; pagamentos anteriores permanecem |

As chaves estrangeiras usam `RESTRICT` no histórico justamente para que uma
exclusão acidental falhe em vez de apagar trilha comercial.

---

## Gerar uma nova migração

```bash
# 1. edite src/server/db/schema.ts
npm run db:generate -- --name=descricao_curta
# 2. revise o SQL gerado em drizzle/
# 3. faça backup do banco antes de aplicar em produção
npm run db:migrate
```

Nunca use sincronização automática de schema em produção.
