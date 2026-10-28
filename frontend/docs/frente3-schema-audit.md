# Frente 3 — auditoria do esquema comercial existente

Inspecionado no Supabase PageNova AI em 2026-10-28, sem executar mutações.

## Estrutura existente (RLS habilitada; tabelas comerciais sem registros)
- `pagenova_commercial_plans`: code, name, price_monthly_cents, lifecycle.
- `pagenova_commercial_checkout_mappings`: plan_code, provider_product_id, provider_offer_id, checkout_url, billing_period, state.
- `pagenova_commercial_subscriptions`: customer_email, plan_code (FK), provider_subscription_id, provider_order_id, state, current_period_ends_at.
- `pagenova_commercial_module_grants`: customer_email, module_code, subscription_id (FK), source, state, valid_until.
- `pagenova_commercial_webhook_events`: provider_event_id, event_type, payload, processing_state.

## BLOCKER: module granularity
`pagenova_commercial_module_grants.module_code` accepts **only** `crm`, `studio`, `apps`. Likewise `pagenova_commercial_plan_modules.module_code` accepts only those family codes. Therefore **do not** write `studio.forms`, `crm.search` etc. into those columns without a reviewed schema migration. Granting the family instead would over-authorize individual purchases.

## BLOCKER: identity and renewals
Subscription rows support `provider_subscription_id`, but the current legacy webhook only models order_id, and actual new Kiwify payload shapes/IDs have not been confirmed. An order ID is not a stable subscription ID; do not infer one. Distinct renewal orders must attach to the correct subscription and extend paid-through safely.

## Next implementation blocks
1. Prepare a migration proposal for fine-grained module codes in both grant and plan-module tables, preserving existing family codes and constraints.
2. Verify unique indexes for provider order, subscription and event IDs; add idempotent processing with transaction safety, avoiding duplicated subscription grants.
3. Configure real Kiwify product IDs, exact per-product signing secrets and checkout offers in protected server configuration.
4. Wire a separate, feature-flagged modular webhook path into the existing endpoint **after** validating signature; legacy path unchanged. Modular payments must not invoke legacy credit-cycle RPC.
5. Build server-side access resolution from active grants for the authenticated customer; keep legacy full-access semantics intact.
6. Test in isolated environment and request explicit approval before migrations, production activation, or checkout changes.

## Code prepared
- `src/lib/commercial/kiwify-product-mapping.ts`: explicit product-ID mapping, fail closed.
- `src/lib/commercial/kiwify-event-planner.ts`: pure decisions; no DB writes.
- `docs/frente3-kiwify-integration.md`: security and acceptance criteria.

**No live subscriptions, credit cycles, webhook endpoint, schema, or legacy accounts were modified.**
