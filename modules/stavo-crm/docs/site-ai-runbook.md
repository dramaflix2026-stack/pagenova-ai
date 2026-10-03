# Runbook — Sites com IA

Procedimentos operacionais do módulo. Para configuração inicial, veja
[deploy-hostinger.md](deploy-hostinger.md) seção 14; para arquitetura, veja
`IMPLEMENTATION_PLAN_SITE_AI.md`.

## 1. Orçamento estourado

`SITE_AI_MONTHLY_BUDGET_USD` bloqueia **antes** da chamada cara — nunca depois.
Sintoma: "Orçamento mensal atingido" ao tentar gerar.

1. Confirme o gasto real no [console da Anthropic](https://platform.claude.com/settings/billing)
   (a tabela `site_ai_usage` é a estimativa local, não a fatura).
2. Se o gasto for legítimo, aumente `SITE_AI_MONTHLY_BUDGET_USD` e reinicie.
3. Se não for, revise `site_ai_usage` por `project_id`/`operation` para achar
   o projeto que consumiu mais — cada linha tem `model`, `input_tokens`,
   `output_tokens` e `cost_estimated_usd`.

Orçamento por projeto (`budgetLimitUsd`, padrão em
`SITE_AI_DEFAULT_PROJECT_BUDGET_USD`) é independente do mensal: um projeto
específico pode estourar seu próprio teto mesmo com saldo mensal sobrando.

**Por que o valor gravado pode ficar abaixo do cobrado de verdade.** Achado
real (2026-08-29): geração de teste com credencial real registrou US$ 0,13
no CRM, mas a Anthropic cobrou US$ 1,71. Duas causas, uma corrigida:

1. *Corrigido.* Quando a saída da IA precisa de reparo (uma segunda chamada
   corrigindo só o campo com erro), a primeira chamada **também é cobrada**
   pela Anthropic — mas o código só registrava a segunda, descartando o
   custo real da primeira. `generateSitePlan` agora acumula tokens e custo
   de todas as chamadas da mesma geração, nunca sobrescreve.
2. *Limite estrutural, não tem correção definitiva.* O SDK da Anthropic
   pode tentar de novo sozinho, por baixo do `await` de uma única chamada
   nossa, quando uma tentativa demora demais. Se essa tentativa descartada
   já tinha sido processada (e cobrada) do lado da Anthropic antes do SDK
   desistir dela, nosso código nunca fica sabendo — só vê a resposta final.
   `site_ai_usage` é sempre uma **estimativa a partir do que o processo
   observou**, nunca a fatura. Para o valor exato, use sempre o [console de
   billing](https://platform.claude.com/settings/billing).

## 2. Job travado (nunca sai de RUNNING/PENDING)

O worker é single-process, em lease: se o processo cair no meio de um job,
outro tick do próprio worker (ou de um restart) recupera o lease vencido
automaticamente — não é normalmente necessária intervenção manual.

Se um job ficar preso por mais tempo que `SITE_AI_JOB_LEASE_SECONDS` (padrão
nas configurações do worker) sem se recuperar sozinho:

1. Confirme que o processo Node está de fato rodando (`/api/ready`).
2. Veja `site_generation_jobs` pelo `id` do job: `lease_expires_at` no
   passado com `status='RUNNING'` é o sinal de lease vencido não recuperado.
3. Reinicie o processo — a recuperação roda automaticamente na subida
   (mesmo mecanismo verificado em `tests/integration/site-ai-worker.test.ts`).
4. Se `attempt >= max_attempts`, o job já foi marcado `FAILED` com
   `errorRetryable=true`; a interface oferece "Tentar novamente", que cria
   uma nova tentativa dentro do mesmo projeto.

## 3. Rotação de chave da Anthropic

1. Gere a nova chave no console da Anthropic.
2. Atualize `ANTHROPIC_API_KEY` no painel da Hostinger e reinicie.
3. Revogue a chave antiga **depois** de confirmar que a nova funciona (gere
   um site de teste).
4. Nenhuma chave fica no cliente nem em log — `src/server/lib/logger.ts`
   nunca recebe o valor da variável, só o fato de estar configurada.

## 4. Publicação com problema no ar

- **Rollback**: a interface lista o histórico de publicações; qualquer
  publicação `SUPERSEDED` pode voltar a `ACTIVE` com um clique
  (`POST /api/site-projects/:id/publications/:publicationId/rollback`).
- **Despublicar**: tira o link do ar sem apagar histórico
  (`POST /api/site-projects/:id/unpublish`).
- **Nunca fica um link quebrado no ar por uma publicação nova com defeito**:
  publicar roda um smoke test HTTP real contra o próprio processo antes de
  manter a nova versão ativa; se falhar, a versão anterior volta
  automaticamente (ver `publisher.ts`, seção "por que essa ordem" no topo do
  arquivo).

## 5. Armazenamento não aparece após redeploy

Sintoma: sites publicados antes de um deploy somem (404) depois dele.

Isso significa que `SITE_PUBLIC_ASSETS_DIR`/`SITE_ASSETS_DIR` apontam para
dentro da árvore que a Hostinger recria a cada deploy. Mova ambos para um
caminho persistente fora dessa árvore (ver seção 14 de
[deploy-hostinger.md](deploy-hostinger.md)) e restaure os arquivos do último
backup (seção 6.1 de [backup-restore.md](backup-restore.md)).

## 6. Mensagem de WhatsApp não confirma o envio

Por desenho: abrir o link `wa.me` só marca "aberto" (`openedAt`). O sistema
**nunca** assume que a mensagem foi enviada — só o botão explícito "A
mensagem foi enviada de verdade?" (`confirm-sent`) registra o contato,
inclusive criando a atividade `WHATSAPP_ATTEMPT` no lead quando o projeto
está vinculado a um. Se um administrador reportar que "não registrou o
contato", confirme que ele de fato clicou nesse botão — não é um bug se ele
só abriu o WhatsApp.

## 7. Verificação rápida de que o módulo está saudável

```bash
curl -s https://seu-crm/api/site-ai/diagnostics -H "Cookie: <sessao>" | jq
```

Retorna `mode` (`real`/`mock`/`bloqueado`), se a chave está configurada, se o
armazenamento está gravável (teste real de escrita+leitura+remoção feito na
subida do processo) e os limites de orçamento/concorrência efetivos.
