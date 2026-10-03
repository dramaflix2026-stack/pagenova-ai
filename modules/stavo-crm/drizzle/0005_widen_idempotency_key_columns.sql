ALTER TABLE `lead_events` MODIFY COLUMN `idempotency_key` varchar(191);--> statement-breakpoint
ALTER TABLE `payments` MODIFY COLUMN `idempotency_key` varchar(191);