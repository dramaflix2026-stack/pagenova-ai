# PageNova AI — créditos individuais (R$ 147/mês)

## Contrato aprovado (não modificar silenciosamente)

- **40** novas gerações de site por ciclo e assinante. Studio (`Gerar site com IA`) e CRM compartilham o mesmo saldo: 40ª permitida, 41ª recusada. Mesmo projeto + chave idempotente não cobra de novo.
- **150** páginas solicitadas ao Google Places Text Search, por ciclo e assinante. 150ª permitida, 151ª recusada. Paginação consome 1 por página.
- **Sem débito destes créditos**: editar/revisar um site com IA, prévia, publicação, reabrir projetos, histórico de empresas pesquisadas, páginas de detalhes e demais funcionalidades não expressamente incluídas nos dois saldos.
- Falhas de chamada ou jobs de site que terminaram em FAILED/CANCELED devolvem a reserva; erro no editor ou visualização não gera débito.
- Renovação paga Kiwify (nova compra/novo order_id) inicia o próximo ciclo; webhook repetido não recarrega. Reembolso/chargeback bloqueia aquele ciclo e conserva histórico.
- Geração de ebook e de imagens para ebook têm custo próprio de API. **Não há quantidade ou tarifação de ebooks contratada**: não cobrar desses 40/150 por conta própria.

## Componentes

1. `supabase/migrations/20261014_pagenova_individual_credit_cycles.sql`: ciclo por pedido/assinante, ledger de operações, limites fixos, transações com advisory lock, idempotência, estorno, RLS e RPCs restritas ao `service_role`.
2. `frontend/src/app/api/crm/[...path]/route.ts`: única porta PageNova para cobrança de POST `/site-projects/:id/generate` e POST `/google/search`. Busca de histórico e alterações são liberadas. Conciliação no polling de jobs.
3. `frontend/src/app/api/webhooks/kiwify/route.ts`: abertura/revogação idempotente do ciclo após o webhook Kiwify ser autenticado.
4. `modules/stavo-crm/src/builder/generation/worker.ts` e `frontend/src/app/api/credits/job-event/route.ts`: aviso assinado de estado terminal mesmo quando o navegador está fechado. O polling permanece como redundância.
5. `/app/creditos` e `/api/credits`: consulta privada do saldo do assinante.

## ATENÇÃO — rollout em produção (pendente)

O Supabase conectado neste ambiente lista somente **FORMA** e **INSTA-IA**. O banco da PageNova, que possui `entitlements`, não aparece. Não aplicar esta migração em FORMA ou INSTA-IA. O código está versionado, mas **o novo débito individual está desativado até executar os passos abaixo**. Quando desativado, o produto conserva o comportamento anterior; a UI não inventa saldos.

1. Conceder acesso ao projeto Supabase **real** da PageNova, identificado por `NEXT_PUBLIC_SUPABASE_URL` (sem revelar senhas/chaves no chat).
2. Realizar snapshot/backup do schema e dos registros de `entitlements`, e aplicar a migração ao banco certo.
3. Identificar os ciclos pagos ativos por `provider_order_id`, com `purchased_at`. Executar `pagenova_credits_bootstrap(email)` somente com `service_role` para cada assinante atual. Clientes ainda sem cadastro de usuário podem ter ciclo atrelado ao e-mail, que será associado ao ID de usuário no primeiro acesso.
4. **Conciliar consumo preexistente** do ciclo atual: jobs de site já gerados pelo CRM/Studio e TEXT_SEARCH já solicitadas. O contador interno `google_api_usage` é global (e não basta para separar um workspace compartilhado); não atribuir esse global integralmente a um usuário. Auditar jobs e pesquisas por conta, usando históricos válidos. Só depois chamar `pagenova_credits_backfill(email,order_id,sites_used,google_used)`. Essa função recusa sobrescrever ciclos que já possuem operações.
5. Conferir os limites globais do Google no Railway: `GOOGLE_TEXT_SEARCH_MONTHLY_HARD_LIMIT` default 900 protege o custo total da plataforma, **mas precisa ser dimensionado para a base pagante** para não bloquear um assinante antes dos seus 150 créditos individuais. Limite de detalhes é separado.
6. Configurar no Railway `PAGENOVA_CREDIT_CALLBACK_URL=https://pagenovaai.com.br/api/credits/job-event` (proteger o segredo compartilhado `PAGENOVA_SSO_SECRET`; não expor esse valor).
7. Ativar `PAGENOVA_CREDITS_ENFORCE=1` no frontend Vercel **somente após a migração, conciliação e teste de callbacks**. Sem RPC funcional, os endpoints pagos falham fechados ao ativar.
8. Testar dois usuários reais de teste com ciclos separados e limites 40/150, sem realizar chamadas caras: usar simulação transacional em staging. Confirmar 40/41, 150/151, corrida de duas reservas pelo último crédito, duas chamadas com a mesma chave, falha e estorno uma vez, Kiwify repetido, renovação e chargeback. Conferir que edições, histórico e gerador de ebooks não alteram estes saldos.
9. Após ativar, validar `GET /api/credits`, navegação em `/app/creditos` e efeitos no CRM/Studio. Nunca restaurar um ciclo a zero por reimplantação da aplicação.

## Observações operacionais

- Não é seguro ligar a flag de cobrança antes da migração e da reconciliação histórica.
- O controle interno de orçamento Google do CRM permanece como proteção global, separado do crédito comercial individual.
- Jobs que falham com navegador aberto são reconciliados no status/eventos; com navegador fechado, o worker envia o callback autenticado. Não depender de um cron de terceiros.
- O ledger registra a razão do débito e status de devolução e evita dupla cobrança por chave idempotente; não persiste respostas temporárias do Google, preservando as regras de armazenamento do Google Places.
