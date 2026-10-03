# Regras de negócio

Fonte de verdade do comportamento comercial. Onde houver conflito entre código e
este documento, um dos dois está errado — corrija ambos conscientemente.

---

## 1. Etapas e significado

O usuário pode renomear, recolorir e reordenar as colunas. O que alimenta as
métricas é `stages.semantic_key`, **nunca** o nome visível.

| Ordem | Nome padrão | `semantic_key` | O que representa |
| --- | --- | --- | --- |
| 1 | Selecionados | `SELECTED` | Escolhido para prospecção, ainda **sem nenhuma abordagem** |
| 2 | Contato realizado | `FIRST_CONTACT` | A primeira abordagem foi enviada; o retorno pode estar pendente |
| 3 | Follow-up | `FOLLOW_UP` | Precisa de novas tentativas ou de um retorno agendado |
| 4 | Respondeu | `REPLIED` | O lead respondeu pelo menos uma vez |
| 5 | Em negociação | `NEGOTIATION` | Proposta e valores em discussão |
| 6 | Aguardando pagamento | `AWAITING_PAYMENT` | Existe valor a receber ainda não confirmado |
| 7 | Venda concluída | `WON` | Recebimento confirmado |
| 8 | Recusado/Perdido | `LOST` | Recusa registrada com motivo |
| — | (criadas pelo usuário) | `AUXILIARY` | Organização própria; **não** gera métrica principal sozinha |

**Não existem** as etapas "Site em criação", "Site pronto" nem uma coluna separada
"Aguardando resposta" — "Contato realizado" já significa que a abordagem foi feita.

### Restrições

- Etapa principal é **única**: não é possível criar duas colunas com o mesmo significado.
- Etapa principal **não pode ser apagada nem desativada**.
- Etapa auxiliar pode ser removida informando uma **etapa de destino** para os cards.
  Se houver histórico apontando para ela, a etapa sai do quadro mas continua existindo,
  para que `stage_history` nunca fique órfão.
- Renomear não afeta histórico nem métricas.

---

## 2. Motor de eventos

`lead_events` é um log **imutável**. Nada é editado ou apagado; correções viram
eventos de reversão.

### Eventos singulares (um por lead, garantido pelo banco)

| Evento | Quando |
| --- | --- |
| `FIRST_CONTACT_RECORDED` | Primeira entrada semântica em `FIRST_CONTACT` |
| `FIRST_RESPONSE_RECORDED` | Primeira entrada semântica em `REPLIED` |

A coluna `lead_events.unique_scope` recebe `${leadId}:${eventType}` e possui índice
`UNIQUE`. Como o MySQL permite vários `NULL` em índice único, eventos repetíveis
gravam `NULL` ali.

**Consequência prática:** mover o card para trás e para frente de novo **não** cria
um segundo primeiro contato. Três follow-ups continuam sendo **um** contato novo.

### Eventos por ciclo

`LOSS_RECORDED` e `NEGOTIATION_STARTED` usam `unique_scope` com sufixo de ciclo.
O ciclo é `(quantidade de perdas do lead) + 1`, então reabrir um lead perdido e
perdê-lo de novo gera um segundo registro legítimo — mas reenviar a mesma
requisição não duplica nada.

### Efeitos por destino

| `semantic_key` | Efeito |
| --- | --- |
| `SELECTED` | Nenhum evento histórico |
| `FIRST_CONTACT` | `FIRST_CONTACT_RECORDED` (se ainda não existir) |
| `FOLLOW_UP` | **Nenhuma tentativa é registrada** — entrar na coluna é apenas organizar |
| `REPLIED` | `FIRST_RESPONSE_RECORDED` (se ainda não existir) |
| `NEGOTIATION` | Substitui as propostas em aberto; `NEGOTIATION_STARTED` por ciclo |
| `AWAITING_PAYMENT` | Cria venda + recebíveis pendentes; `AWAITING_PAYMENT_RECORDED` |
| `WON` | Confirma o recebimento (ou cria venda paga); marca propostas como vendidas |
| `LOST` | Exige motivo; grava `lead_losses` + `LOSS_RECORDED`; follow-up opcional |
| `AUXILIARY` | Apenas `STAGE_MOVED` |

**Tentativa de contato** é sempre uma **ação explícita** do usuário
(`POST /api/leads/:id/activities` com tipo `CALL`, `WHATSAPP_ATTEMPT`,
`CONTACT_ATTEMPT` ou `MEETING`). Clicar em "Abrir WhatsApp" **não** registra contato.

---

## 3. Movimentação de etapa (transação única)

1. Verifica se a `idempotency_key` já foi processada → devolve o resultado original.
2. Valida o destino e os dados que ele exige (motivo de perda, venda, recebimento).
3. Confere `expected_current_stage_id`. Divergência → `409 STAGE_CONFLICT` com a
   posição real; a tela se atualiza em vez de sobrescrever.
4. Atualiza `leads.current_stage_id` e `stage_entered_at`.
5. Fecha o `stage_history` aberto e abre a nova passagem.
6. Grava `STAGE_MOVED`.
7. Aplica o efeito semântico e o financeiro.
8. Recalcula o nível de completude.
9. Confirma a transação.

Movimentos **comuns** (Selecionados → Contato, Contato → Follow-up, Follow-up →
Respondeu, auxiliares) concluem com toast e **"Desfazer"**.
Movimentos **críticos** (negociação, aguardando, venda, perda) exigem formulário.

---

## 4. Deduplicação

Compara contra **tudo**: CRM ativo, arquivados, importações anteriores, leads
manuais e leads do Google.

### Chaves fortes

| Tipo | Normalização | Compartilhável? |
| --- | --- | --- |
| `PLACE_ID` | valor bruto do Google | **Nunca** |
| `PHONE` | E.164 (libphonenumber) | Só por decisão humana |
| `OWN_DOMAIN` | host sem protocolo/www/porta — **apenas** quando classificado como site próprio | Só por decisão humana |
| `NAME_ADDRESS` | nome + endereço normalizados; exige **ambos** | Só por decisão humana |

Instagram, WhatsApp, Facebook, Linktree e diretórios **não** geram chave de domínio:
empresas diferentes compartilham essas plataformas o tempo todo.

Nome sozinho **nunca** deduplica — franquias e unidades são leads legítimos distintos.

### Decisão

| Situação | Resultado |
| --- | --- |
| Chave forte de outro lead | **Bloqueia** a criação; a API devolve `409 DUPLICATE_LEAD` com o lead existente e a etapa |
| Chave já marcada como compartilhada | **Revisão** — nunca libera uma terceira criação automática |
| Nome muito parecido na mesma cidade | **Revisão** — cria o card e abre `duplicate_reviews` |
| Nada | Cria normalmente |

### Revisão humana

- **"É o mesmo lead"** → arquiva o candidato; o original permanece intocado.
- **"São leads diferentes"** → marca as chaves (exceto `place_id`) como exceção auditada.
- **"Ignorar"** → encerra o alerta sem alterar nada.

Nenhum lead é mesclado automaticamente, em nenhuma hipótese.

### Concorrência

Duas abas adicionando o mesmo `place_id` simultaneamente: o `UNIQUE` do banco
decide, a API captura o conflito e devolve o lead existente — sem erro técnico
exposto e sem evento órfão.

---

## 5. Importação

**Regra absoluta:** linha duplicada é **ignorada**. Nunca cria um segundo card e
**nunca** altera o lead existente — nem anotação, nem valor, nem serviço, nem
etapa, nem histórico, nem sequer um campo vazio.

| Situação da linha | Resultado |
| --- | --- |
| Válida e única | Cria lead em **Selecionados** |
| Sem telefone | **Importa** com contorno vermelho e "Dados incompletos" |
| Telefone inválido | Importa marcado para revisão; nenhum link de contato é gerado |
| Duplicada (arquivo ou base) | Ignorada, com o lead existente e a etapa no relatório |
| Possível duplicidade | Não cria; abre revisão |
| Sem nome **e** sem contato | Inválida |
| Totalmente vazia | Ignorada |

### Revisão de campos vazios (pós-importação)

- Só aparecem campos que o lead existente **não tem hoje**.
- Nada vem marcado por padrão; a escolha é campo a campo.
- A gravação reconfere dentro da transação (`IS NULL` / ausência do registro):
  uma corrida nunca sobrescreve.
- Cada preenchimento gera `DATA_CONFIRMED` no histórico.

---

## 6. Vendas, recebíveis e recorrências

### Vocabulário

| Conceito | Significado |
| --- | --- |
| Proposta | Valor discutido. **Não é receita.** |
| Aguardando pagamento | Recebível `PENDING`/`OVERDUE`. **Não é receita.** |
| Venda concluída | Recebimento confirmado manualmente |
| Receita realizada | Pagamentos confirmados **menos** estornos, pela data do pagamento |
| MRR ativo | Soma das assinaturas `ACTIVE` — expectativa contratada, não dinheiro recebido |

### Snapshots imutáveis

`sale_items` guarda nome, tipo de cobrança e preço unitário no momento do acordo.
Alterar o catálogo depois **não muda venda alguma**. `subscriptions.amount_snapshot`
faz o mesmo para o contrato recorrente.

### Recorrências

- `UNIQUE (subscription_id, reference_period)` impede mensalidade duplicada.
- O job percorre de `last_generated_period + 1` até a competência atual e cria o
  que falta, **na ordem correta**. Se o cron parar por meses, a próxima execução
  recupera tudo.
- Rodar o job duas vezes não cria nada novo — a violação de unicidade é tratada
  como "já existe" e o ponteiro avança.
- O dia de vencimento acompanha o primeiro vencimento, ajustado para o último dia
  em meses curtos (31 → 28/29 em fevereiro).
- Disparo: automático ao abrir dashboard/financeiro, por `npm run jobs:recurrences`,
  ou por cron chamando `POST /api/jobs/recurrences` com `CRON_SECRET`.

### Correções

| Ação | Efeito |
| --- | --- |
| **Cancelar recebível** | Sai de pendente sem virar receita; motivo obrigatório; registro preservado |
| **Estornar pagamento** | Cria lançamento negativo; o original **continua visível**; recebível volta a `PENDING`; motivo obrigatório |
| **Cancelar venda** | Status muda; snapshots e itens permanecem; recebíveis em aberto seguem a escolha do usuário |
| **Cancelar recorrência** | Para cobranças futuras; pagamentos anteriores permanecem; a assinatura não é apagada; o recebível em aberto pode ser mantido ou cancelado |
| **Alterar valor da assinatura** | Vale a partir de uma competência futura; períodos anteriores e recebíveis pagos nunca são reescritos |

Nada usa exclusão física. A interface nunca diz "Excluir" para financeiro.

---

## 7. Métricas

Todas calculadas no backend, com janelas de período em **America/São_Paulo**
convertidas para instantes UTC.

| Métrica | Fórmula |
| --- | --- |
| Primeiros contatos | Leads únicos com `FIRST_CONTACT_RECORDED` no período |
| Tentativas de contato | Contagem de `CONTACT_ATTEMPT_RECORDED` no período |
| Respostas | Leads únicos com `FIRST_RESPONSE_RECORDED` no período |
| Taxa de resposta | respostas ÷ primeiros contatos |
| Taxa de recusa | leads únicos perdidos ÷ primeiros contatos |
| Taxa de conversão | leads únicos com venda confirmada ÷ primeiros contatos |
| Ticket médio | valor das vendas confirmadas ÷ quantidade de vendas |
| Receita realizada | soma dos pagamentos (estornos são negativos) pela data do pagamento |
| Aguardando pagamento | soma dos recebíveis `PENDING` + `OVERDUE` |
| MRR ativo | soma de `amount_snapshot` das assinaturas `ACTIVE` |

**Denominador zero devolve `null`** e a interface mostra `—` com explicação —
nunca uma porcentagem enganosa.

### Estado atual × histórico

- **Funil** conta `leads.current_stage_id` — onde cada lead está **agora**.
- **Desempenho** conta eventos — o que **aconteceu** no período.

Mover um card para trás muda o funil e **não reduz** o histórico.

### Tempo em etapa

Calculado por `stage_history`: tempo na coluna atual, média por etapa,
negociações paradas, selecionados sem abordagem e follow-ups vencidos.
Os limites de "parado" são configuráveis.

---

## 8. Completude de dados

| Nível | Condição | Visual |
| --- | --- | --- |
| `CRITICAL` | Sem nome interno **ou** sem nenhum contato direto persistido (ou todos inválidos) | Contorno **vermelho** + ícone + badge "Dados incompletos" |
| `WARNING` | Falta Instagram, website, Maps, cidade ou serviço | Aviso **âmbar** |
| `NONE` | Tudo presente | Sem destaque |

Lead do Google sem contato próprio salvo é apenas **aviso** — os dados públicos
podem ser consultados ao vivo pelo `place_id`.

Informação opcional **nunca** bloqueia o fluxo.

---

## 9. Arquivamento

- A ação se chama **"Arquivar lead"**, nunca "Excluir".
- Confirmação em modal vermelho, com a consequência escrita.
- O lead sai da visão padrão, pode ser consultado e restaurado.
- Eventos, vendas, pagamentos e anotações permanecem.
- Um lead arquivado **continua bloqueando** duplicatas automáticas.
