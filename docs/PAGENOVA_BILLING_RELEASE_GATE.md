# PageNova billing release gate (DO NOT deploy without validation)

## Blockers
- [ ] Obtain Kiwify's documented, authenticated source of **paid billing interval start and end** per recurring order; confirm real webhook/API fixtures. `verifiedPaidBillingPeriod` currently returns `null` intentionally. No automatic renewal is active.
- [ ] Verify webhook authenticity against Kiwify's current official documentation, including replay resistance and timestamp rules. A shared token in the query is not independently verified provider HMAC.
- [ ] Replace entitlement lookup-then-upsert with a database-atomic transition so a late approval cannot resurrect a refund. Reconcile cross-database webhook retries.
- [ ] Confirm payment-to-account ownership (email lookup alone is insufficient) and implement post-registration reconciliation.
- [ ] Verify migration history on the **actual target database** before executing any migrations. The branch removed duplicate journal entries for 0011/0013, but legacy SQL files remain and previously applied migration history may differ. Take a backup and compare schema and Drizzle migration ledger first.
- [ ] Confirm subscriber cycle checks and debit/refund paths for site generation success, asynchronous failures, revoked cycles and retries.
- [ ] Run `npm --prefix modules/stavo-crm run check`, integration tests with disposable MySQL, `npm --prefix frontend run lint`, and `npm --prefix frontend run build` on the branch. Frontend's vitest test files require an installed test runner; its package.json currently has no vitest dependency.
- [ ] Validate internal CRM HMAC endpoints, admin UUID allowlist, CSRF/origin handling and production HTTPS.
- [ ] Configure `PAGENOVA_ADMIN_USER_IDS` (comma-separated Supabase Auth user UUIDs), `PAGENOVA_ADMIN_REPORT_SECRET` (32+ chars), `PAGENOVA_CRM_API_URL`, `PAGENOVA_BILLING_SYNC_SECRET` (32+ chars) in appropriate server environments only.
- [ ] Review 500-cycle reporting cap, audit logging, privacy retention, Google Places pricing and per-subscriber cost model. Current admin report displays **usage, not provider cost**.
- [ ] Test sandbox purchase, recurring renewal, refund-before-approval, chargeback, duplicate webhook, concurrent sync/revoke, exhausted 150/40 quotas and next-cycle reset.
- [ ] Stage deployment with backup/rollback plan; obtain explicit production approval.

## Current state
Admin page: `/app/admin/consumo` (requires authenticated user UUID in `PAGENOVA_ADMIN_USER_IDS`).
CRM report: `GET /api/internal/pagenova/admin/subscriber-usage` (HMAC signed).
No live migrations, deployment, or successful integration test run is asserted by this document.
