# Frente 3 — Kiwify modular subscriptions (preview only)

## Blocks delivered
1. Product ID mapping: `src/lib/commercial/kiwify-product-mapping.ts`.
2. Side-effect-free event decision: `src/lib/commercial/kiwify-event-planner.ts`.
3. Aggregate permissions only from active, authenticated customer orders. A reversed order must never revoke a different active order.

## Before connecting the production webhook
- Obtain the **11 actual Kiwify product IDs** from the Kiwify dashboard. Set the `KIWIFY_PRODUCT_ID_*` environment keys defined in the mapping module **as server-only secrets/config**, not in the browser. Do not infer IDs from names or checkout links.
- Obtain the signing secret for **each new webhook**; existing legacy global/plan-specific tokens must continue to work unchanged. Verify HMAC against the exact mapped product's secret, not the legacy fallback. Do not store tokens in source control.
- Implement a separate modular subscription ledger keyed by provider + subscription/order identifiers, email/user and product ID, with idempotent delivery handling and unique constraints. Confirm Kiwify renewal and cancellation payload shapes from actual redacted events.
- Keep legacy `entitlements`, existing credit cycle RPCs and the legacy `pagenova-ai` access policy untouched. New modular orders must NOT call `pagenova_credits_activate` by default.
- Integrate authorization checks with every relevant API and page (server-side); hiding buttons is insufficient. Legacy R$147 accounts retain their current access.
- Reconcile cancellation against paid-through expiry; never immediately revoke already-paid time. Refund/chargeback must revoke only the corresponding order.
- Only launch exact, active, server-priced checkout offers. Kiwify's fixed checkout links do not inherently charge arbitrary combinations shown in the configurator.
- Test: valid/invalid HMAC, unmapped product, fictional Kiwify test event, initial purchase, renewal, duplicate delivery, refund, chargeback, cancellation, two simultaneous subscriptions, shared module entitlement, legacy customer, trial, cross-customer identity and coming-soon products.
- Run migrations only after schema review, isolated environment tests, and explicit production approval.

## Event planner contract
- `activate`: signed, mapped, paid order approval/renewal; **decision only**, no database write.
- `revoke`: signed refund or chargeback; **decision only**.
- `defer`: canceled/late subscription pending paid-through reconciliation.
- `ignore`: unknown product/event or incomplete identity.

Nothing in this branch currently processes new purchases, creates users, changes permissions, or activates checkout.
