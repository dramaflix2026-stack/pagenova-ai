# PageNova subscriber quotas: activation checklist

Status: NOT production-ready. Feature flag remains off.

## Product policy
- Subscription: BRL 147 per billing cycle.
- Google search: 150 result pages per subscriber per cycle, not 150 companies.
- New full site generation: 40 per subscriber per cycle.
- Manual editing and AI revisions: do not deduct site-generation quota.
- Provider budget safety caps remain separate and always apply.

## Current code boundaries
- CRM Google search: `modules/stavo-crm/src/server/modules/google/service.ts` includes a gated reservation before calling Google.
- CRM counter: `modules/stavo-crm/src/server/modules/billing/workspace-usage.ts` is isolated by workspace.
- Subscriber website generator: `frontend/src/app/api/builder/generate/route.ts` authenticates with Supabase entitlements, NOT the CRM workspace database.
- CRM site jobs: `modules/stavo-crm/src/server/modules/site-ai/service.ts` use an idempotent enqueue. This is a distinct generation flow.

## Mandatory before enabling
1. Link a verified Supabase entitlement to a single workspace, with a durable immutable subscriber identifier.
2. Store billing cycle start/end from actual paid subscription; current YYYY-MM counter is NOT sufficient for subscription anniversary billing.
3. Implement a transactionally safe reservation + idempotency key for full generation in BOTH generators, with explicit classification of revisions.
4. Ensure failed pre-provider jobs refund exactly once; provider-invoked failures follow a documented charging policy.
5. Decide and enforce place-details quota and provider SKU cost limits separately.
6. Make Google search reservation and global budget reservation atomic or reconcile reliably. Current two-step compensation can race under concurrent requests.
7. Apply migration 0010 in a non-production environment; confirm schema, journal, rollback and backup.
8. Test parallel requests at quota boundaries, cross-tenant isolation, entitlement cancellation, cycle renewal, duplicate submissions, provider failures and UI summaries.
9. Confirm Google field masks and billing SKUs from official pricing; do not assume Pro SKU pricing for Enterprise fields.
10. Release only after staging verification and explicit deployment approval.

Do not set `PAGENOVA_WORKSPACE_QUOTAS_ENABLED=true` until these steps pass.
