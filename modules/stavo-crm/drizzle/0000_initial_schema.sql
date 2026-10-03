CREATE TABLE `activities` (
	`id` varchar(26) NOT NULL,
	`lead_id` varchar(26) NOT NULL,
	`activity_type` varchar(24) NOT NULL,
	`body` text,
	`occurred_at` datetime(3) NOT NULL,
	`created_by` varchar(26),
	`created_at` datetime(3) NOT NULL,
	`updated_at` datetime(3) NOT NULL,
	CONSTRAINT `activities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `app_settings` (
	`setting_key` varchar(80) NOT NULL,
	`value` json NOT NULL,
	`updated_at` datetime(3) NOT NULL,
	CONSTRAINT `app_settings_setting_key` PRIMARY KEY(`setting_key`)
);
--> statement-breakpoint
CREATE TABLE `audit_log` (
	`id` varchar(26) NOT NULL,
	`action` varchar(80) NOT NULL,
	`entity_type` varchar(60),
	`entity_id` varchar(26),
	`actor_user_id` varchar(26),
	`summary` varchar(500),
	`metadata` json,
	`occurred_at` datetime(3) NOT NULL,
	CONSTRAINT `audit_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `auth_sessions` (
	`id` varchar(26) NOT NULL,
	`token_hash` varchar(64) NOT NULL,
	`user_id` varchar(26) NOT NULL,
	`created_at` datetime(3) NOT NULL,
	`last_seen_at` datetime(3) NOT NULL,
	`expires_at` datetime(3) NOT NULL,
	`revoked_at` datetime(3),
	`ip_hash` varchar(64),
	`user_agent_summary` varchar(120),
	CONSTRAINT `auth_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `auth_sessions_token_hash_unique` UNIQUE(`token_hash`)
);
--> statement-breakpoint
CREATE TABLE `duplicate_reviews` (
	`id` varchar(26) NOT NULL,
	`candidate_lead_id` varchar(26),
	`existing_lead_id` varchar(26) NOT NULL,
	`reason` varchar(255) NOT NULL,
	`candidate_payload` json,
	`import_job_id` varchar(26),
	`import_row_number` int,
	`status` varchar(24) NOT NULL DEFAULT 'PENDING',
	`reviewed_at` datetime(3),
	`created_at` datetime(3) NOT NULL,
	CONSTRAINT `duplicate_reviews_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `follow_ups` (
	`id` varchar(26) NOT NULL,
	`lead_id` varchar(26) NOT NULL,
	`due_at` date NOT NULL,
	`status` varchar(16) NOT NULL DEFAULT 'PENDING',
	`note` text,
	`completed_at` datetime(3),
	`created_at` datetime(3) NOT NULL,
	`updated_at` datetime(3) NOT NULL,
	CONSTRAINT `follow_ups_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `goals` (
	`id` varchar(26) NOT NULL,
	`metric_type` varchar(24) NOT NULL,
	`period_type` varchar(12) NOT NULL,
	`target_value` decimal(14,2) NOT NULL,
	`starts_on` date NOT NULL,
	`ends_on` date,
	`active` boolean NOT NULL DEFAULT true,
	`created_at` datetime(3) NOT NULL,
	`updated_at` datetime(3) NOT NULL,
	CONSTRAINT `goals_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `google_api_usage` (
	`id` varchar(26) NOT NULL,
	`billing_month` varchar(7) NOT NULL,
	`sku_type` varchar(24) NOT NULL,
	`request_count` int NOT NULL DEFAULT 0,
	`warning_state` varchar(12) NOT NULL DEFAULT 'NONE',
	`updated_at` datetime(3) NOT NULL,
	CONSTRAINT `google_api_usage_id` PRIMARY KEY(`id`),
	CONSTRAINT `google_api_usage_unique` UNIQUE(`billing_month`,`sku_type`)
);
--> statement-breakpoint
CREATE TABLE `import_jobs` (
	`id` varchar(26) NOT NULL,
	`original_filename` varchar(255) NOT NULL,
	`source_id` varchar(26),
	`service_id` varchar(26),
	`status` varchar(16) NOT NULL DEFAULT 'PENDING',
	`idempotency_key` varchar(80),
	`total_rows` int NOT NULL DEFAULT 0,
	`imported_rows` int NOT NULL DEFAULT 0,
	`duplicate_rows` int NOT NULL DEFAULT 0,
	`probable_duplicate_rows` int NOT NULL DEFAULT 0,
	`incomplete_rows` int NOT NULL DEFAULT 0,
	`invalid_rows` int NOT NULL DEFAULT 0,
	`empty_rows` int NOT NULL DEFAULT 0,
	`created_at` datetime(3) NOT NULL,
	`completed_at` datetime(3),
	CONSTRAINT `import_jobs_id` PRIMARY KEY(`id`),
	CONSTRAINT `import_jobs_idempotency_unique` UNIQUE(`idempotency_key`)
);
--> statement-breakpoint
CREATE TABLE `import_rows` (
	`id` varchar(26) NOT NULL,
	`import_job_id` varchar(26) NOT NULL,
	`row_number` int NOT NULL,
	`status` varchar(24) NOT NULL,
	`lead_id` varchar(26),
	`duplicate_lead_id` varchar(26),
	`validation_errors` json,
	`normalized_match_summary` varchar(255),
	`normalized_values` json,
	`created_at` datetime(3) NOT NULL,
	CONSTRAINT `import_rows_id` PRIMARY KEY(`id`),
	CONSTRAINT `import_rows_job_row_unique` UNIQUE(`import_job_id`,`row_number`)
);
--> statement-breakpoint
CREATE TABLE `lead_contacts` (
	`id` varchar(26) NOT NULL,
	`lead_id` varchar(26) NOT NULL,
	`type` varchar(16) NOT NULL,
	`value` varchar(160) NOT NULL,
	`normalized_value` varchar(160),
	`origin` varchar(20) NOT NULL,
	`is_primary` boolean NOT NULL DEFAULT false,
	`is_confirmed` boolean NOT NULL DEFAULT false,
	`is_valid` boolean NOT NULL DEFAULT true,
	`created_at` datetime(3) NOT NULL,
	`updated_at` datetime(3) NOT NULL,
	CONSTRAINT `lead_contacts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lead_events` (
	`id` varchar(26) NOT NULL,
	`lead_id` varchar(26) NOT NULL,
	`event_type` varchar(40) NOT NULL,
	`unique_scope` varchar(80),
	`idempotency_key` varchar(80),
	`actor_user_id` varchar(26),
	`occurred_at` datetime(3) NOT NULL,
	`payload_version` smallint NOT NULL DEFAULT 1,
	`payload` json,
	`created_at` datetime(3) NOT NULL,
	CONSTRAINT `lead_events_id` PRIMARY KEY(`id`),
	CONSTRAINT `lead_events_unique_scope` UNIQUE(`unique_scope`),
	CONSTRAINT `lead_events_idempotency_unique` UNIQUE(`idempotency_key`)
);
--> statement-breakpoint
CREATE TABLE `lead_identity_keys` (
	`id` varchar(26) NOT NULL,
	`key_type` varchar(20) NOT NULL,
	`key_hash` varchar(64) NOT NULL,
	`key_sample` varchar(120),
	`is_shared_exception` boolean NOT NULL DEFAULT false,
	`exception_reason` varchar(255),
	`created_at` datetime(3) NOT NULL,
	`updated_at` datetime(3) NOT NULL,
	CONSTRAINT `lead_identity_keys_id` PRIMARY KEY(`id`),
	CONSTRAINT `lead_identity_keys_unique` UNIQUE(`key_type`,`key_hash`)
);
--> statement-breakpoint
CREATE TABLE `lead_identity_memberships` (
	`identity_key_id` varchar(26) NOT NULL,
	`lead_id` varchar(26) NOT NULL,
	`created_at` datetime(3) NOT NULL,
	CONSTRAINT `lead_identity_memberships_identity_key_id_lead_id_pk` PRIMARY KEY(`identity_key_id`,`lead_id`)
);
--> statement-breakpoint
CREATE TABLE `lead_links` (
	`id` varchar(26) NOT NULL,
	`lead_id` varchar(26) NOT NULL,
	`type` varchar(24) NOT NULL,
	`url` varchar(2048) NOT NULL,
	`normalized_host` varchar(253),
	`origin` varchar(20) NOT NULL,
	`is_primary` boolean NOT NULL DEFAULT false,
	`created_at` datetime(3) NOT NULL,
	`updated_at` datetime(3) NOT NULL,
	CONSTRAINT `lead_links_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lead_losses` (
	`id` varchar(26) NOT NULL,
	`lead_id` varchar(26) NOT NULL,
	`loss_reason_id` varchar(26) NOT NULL,
	`note` text,
	`occurred_at` datetime(3) NOT NULL,
	`cycle` int NOT NULL DEFAULT 1,
	`created_at` datetime(3) NOT NULL,
	CONSTRAINT `lead_losses_id` PRIMARY KEY(`id`),
	CONSTRAINT `lead_losses_cycle_unique` UNIQUE(`lead_id`,`cycle`)
);
--> statement-breakpoint
CREATE TABLE `lead_service_interests` (
	`id` varchar(26) NOT NULL,
	`lead_id` varchar(26) NOT NULL,
	`service_id` varchar(26) NOT NULL,
	`proposed_price` decimal(14,2),
	`billing_type_snapshot` varchar(24) NOT NULL,
	`notes` text,
	`status` varchar(16) NOT NULL DEFAULT 'OPEN',
	`created_at` datetime(3) NOT NULL,
	`updated_at` datetime(3) NOT NULL,
	CONSTRAINT `lead_service_interests_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `lead_sources` (
	`id` varchar(26) NOT NULL,
	`name` varchar(60) NOT NULL,
	`slug` varchar(60) NOT NULL,
	`is_system` boolean NOT NULL DEFAULT false,
	`active` boolean NOT NULL DEFAULT true,
	`created_at` datetime(3) NOT NULL,
	`updated_at` datetime(3) NOT NULL,
	CONSTRAINT `lead_sources_id` PRIMARY KEY(`id`),
	CONSTRAINT `lead_sources_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE TABLE `leads` (
	`id` varchar(26) NOT NULL,
	`origin_type` varchar(20) NOT NULL,
	`source_id` varchar(26),
	`current_stage_id` varchar(26) NOT NULL,
	`internal_name` varchar(160) NOT NULL,
	`place_id` varchar(255),
	`prospecting_niche` varchar(120),
	`prospecting_country` varchar(80),
	`prospecting_state` varchar(80),
	`prospecting_city` varchar(120),
	`address` varchar(255),
	`campaign_or_search_context` varchar(255),
	`status` varchar(20) NOT NULL DEFAULT 'ACTIVE',
	`incomplete_level` varchar(12) NOT NULL DEFAULT 'NONE',
	`stage_entered_at` datetime(3) NOT NULL,
	`archived_at` datetime(3),
	`import_job_id` varchar(26),
	`search_run_id` varchar(26),
	`created_at` datetime(3) NOT NULL,
	`updated_at` datetime(3) NOT NULL,
	CONSTRAINT `leads_id` PRIMARY KEY(`id`),
	CONSTRAINT `leads_place_id_unique` UNIQUE(`place_id`)
);
--> statement-breakpoint
CREATE TABLE `login_attempts` (
	`id` varchar(26) NOT NULL,
	`attempt_key` varchar(64) NOT NULL,
	`failed_count` int NOT NULL DEFAULT 0,
	`first_failed_at` datetime(3) NOT NULL,
	`last_failed_at` datetime(3) NOT NULL,
	`locked_until` datetime(3),
	CONSTRAINT `login_attempts_id` PRIMARY KEY(`id`),
	CONSTRAINT `login_attempts_key_unique` UNIQUE(`attempt_key`)
);
--> statement-breakpoint
CREATE TABLE `loss_reasons` (
	`id` varchar(26) NOT NULL,
	`name` varchar(80) NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	`is_system` boolean NOT NULL DEFAULT false,
	`position` int NOT NULL DEFAULT 0,
	`created_at` datetime(3) NOT NULL,
	`updated_at` datetime(3) NOT NULL,
	CONSTRAINT `loss_reasons_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payments` (
	`id` varchar(26) NOT NULL,
	`receivable_id` varchar(26) NOT NULL,
	`lead_id` varchar(26) NOT NULL,
	`amount` decimal(14,2) NOT NULL,
	`payment_date` date NOT NULL,
	`status` varchar(16) NOT NULL DEFAULT 'CONFIRMED',
	`reversal_of_id` varchar(26),
	`reason` varchar(500),
	`idempotency_key` varchar(80),
	`created_by` varchar(26),
	`created_at` datetime(3) NOT NULL,
	CONSTRAINT `payments_id` PRIMARY KEY(`id`),
	CONSTRAINT `payments_idempotency_unique` UNIQUE(`idempotency_key`)
);
--> statement-breakpoint
CREATE TABLE `receivables` (
	`id` varchar(26) NOT NULL,
	`lead_id` varchar(26) NOT NULL,
	`sale_id` varchar(26),
	`subscription_id` varchar(26),
	`reference_period` varchar(7),
	`description_snapshot` varchar(255) NOT NULL,
	`amount` decimal(14,2) NOT NULL,
	`due_date` date NOT NULL,
	`status` varchar(16) NOT NULL DEFAULT 'PENDING',
	`paid_at` datetime(3),
	`canceled_at` datetime(3),
	`cancellation_reason` varchar(500),
	`created_at` datetime(3) NOT NULL,
	`updated_at` datetime(3) NOT NULL,
	CONSTRAINT `receivables_id` PRIMARY KEY(`id`),
	CONSTRAINT `receivables_subscription_period_unique` UNIQUE(`subscription_id`,`reference_period`)
);
--> statement-breakpoint
CREATE TABLE `sale_items` (
	`id` varchar(26) NOT NULL,
	`sale_id` varchar(26) NOT NULL,
	`service_id` varchar(26) NOT NULL,
	`service_name_snapshot` varchar(120) NOT NULL,
	`billing_type_snapshot` varchar(24) NOT NULL,
	`unit_price_snapshot` decimal(14,2) NOT NULL,
	`quantity` int NOT NULL DEFAULT 1,
	`total_snapshot` decimal(14,2) NOT NULL,
	`created_at` datetime(3) NOT NULL,
	CONSTRAINT `sale_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sales` (
	`id` varchar(26) NOT NULL,
	`lead_id` varchar(26) NOT NULL,
	`status` varchar(16) NOT NULL DEFAULT 'PENDING',
	`agreed_at` date NOT NULL,
	`confirmed_at` datetime(3),
	`canceled_at` datetime(3),
	`cancellation_reason` varchar(500),
	`total_snapshot` decimal(14,2) NOT NULL,
	`notes` text,
	`created_by` varchar(26),
	`created_at` datetime(3) NOT NULL,
	`updated_at` datetime(3) NOT NULL,
	CONSTRAINT `sales_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `search_runs` (
	`id` varchar(26) NOT NULL,
	`query_text` varchar(255) NOT NULL,
	`niche` varchar(120),
	`country` varchar(80),
	`state` varchar(80),
	`city` varchar(120),
	`region_or_neighborhood` varchar(120),
	`selected_service_id` varchar(26),
	`website_filter` varchar(24),
	`pages_requested` int NOT NULL DEFAULT 0,
	`result_count` int NOT NULL DEFAULT 0,
	`created_at` datetime(3) NOT NULL,
	CONSTRAINT `search_runs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `services` (
	`id` varchar(26) NOT NULL,
	`name` varchar(120) NOT NULL,
	`description` text,
	`billing_type` varchar(24) NOT NULL,
	`default_price` decimal(14,2) NOT NULL DEFAULT '0.00',
	`active` boolean NOT NULL DEFAULT true,
	`created_at` datetime(3) NOT NULL,
	`updated_at` datetime(3) NOT NULL,
	CONSTRAINT `services_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stage_history` (
	`id` varchar(26) NOT NULL,
	`lead_id` varchar(26) NOT NULL,
	`stage_id` varchar(26) NOT NULL,
	`semantic_key` varchar(24) NOT NULL,
	`entered_at` datetime(3) NOT NULL,
	`exited_at` datetime(3),
	`movement_event_id` varchar(26),
	CONSTRAINT `stage_history_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `stages` (
	`id` varchar(26) NOT NULL,
	`name` varchar(60) NOT NULL,
	`semantic_key` varchar(24) NOT NULL,
	`color` varchar(9) NOT NULL DEFAULT '#64748b',
	`position` int NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	`is_system` boolean NOT NULL DEFAULT false,
	`deleted_at` datetime(3),
	`created_at` datetime(3) NOT NULL,
	`updated_at` datetime(3) NOT NULL,
	CONSTRAINT `stages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `subscription_changes` (
	`id` varchar(26) NOT NULL,
	`subscription_id` varchar(26) NOT NULL,
	`previous_amount` decimal(14,2) NOT NULL,
	`new_amount` decimal(14,2) NOT NULL,
	`effective_from` varchar(7) NOT NULL,
	`reason` varchar(500),
	`created_at` datetime(3) NOT NULL,
	CONSTRAINT `subscription_changes_id` PRIMARY KEY(`id`),
	CONSTRAINT `subscription_changes_unique` UNIQUE(`subscription_id`,`effective_from`)
);
--> statement-breakpoint
CREATE TABLE `subscriptions` (
	`id` varchar(26) NOT NULL,
	`lead_id` varchar(26) NOT NULL,
	`sale_item_id` varchar(26),
	`service_id` varchar(26) NOT NULL,
	`service_name_snapshot` varchar(120) NOT NULL,
	`amount_snapshot` decimal(14,2) NOT NULL,
	`status` varchar(16) NOT NULL DEFAULT 'ACTIVE',
	`first_due_date` date NOT NULL,
	`next_due_date` date,
	`last_generated_period` varchar(7),
	`canceled_at` datetime(3),
	`cancellation_reason` varchar(500),
	`created_at` datetime(3) NOT NULL,
	`updated_at` datetime(3) NOT NULL,
	CONSTRAINT `subscriptions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(26) NOT NULL,
	`email` varchar(254) NOT NULL,
	`password_hash` varchar(255) NOT NULL,
	`active` boolean NOT NULL DEFAULT true,
	`last_login_at` datetime(3),
	`password_changed_at` datetime(3),
	`created_at` datetime(3) NOT NULL,
	`updated_at` datetime(3) NOT NULL,
	CONSTRAINT `users_id` PRIMARY KEY(`id`),
	CONSTRAINT `users_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
ALTER TABLE `activities` ADD CONSTRAINT `activities_lead_id_leads_id_fk` FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `auth_sessions` ADD CONSTRAINT `auth_sessions_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `duplicate_reviews` ADD CONSTRAINT `duplicate_reviews_existing_lead_id_leads_id_fk` FOREIGN KEY (`existing_lead_id`) REFERENCES `leads`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `follow_ups` ADD CONSTRAINT `follow_ups_lead_id_leads_id_fk` FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `import_rows` ADD CONSTRAINT `import_rows_import_job_id_import_jobs_id_fk` FOREIGN KEY (`import_job_id`) REFERENCES `import_jobs`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lead_contacts` ADD CONSTRAINT `lead_contacts_lead_id_leads_id_fk` FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lead_events` ADD CONSTRAINT `lead_events_lead_id_leads_id_fk` FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lead_identity_memberships` ADD CONSTRAINT `lead_identity_memberships_lead_id_leads_id_fk` FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lead_identity_memberships` ADD CONSTRAINT `lead_identity_memberships_key_fk` FOREIGN KEY (`identity_key_id`) REFERENCES `lead_identity_keys`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lead_links` ADD CONSTRAINT `lead_links_lead_id_leads_id_fk` FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lead_losses` ADD CONSTRAINT `lead_losses_lead_id_leads_id_fk` FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lead_losses` ADD CONSTRAINT `lead_losses_loss_reason_id_loss_reasons_id_fk` FOREIGN KEY (`loss_reason_id`) REFERENCES `loss_reasons`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lead_service_interests` ADD CONSTRAINT `lead_service_interests_lead_id_leads_id_fk` FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `lead_service_interests` ADD CONSTRAINT `lead_service_interests_service_id_services_id_fk` FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `leads` ADD CONSTRAINT `leads_source_id_lead_sources_id_fk` FOREIGN KEY (`source_id`) REFERENCES `lead_sources`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `leads` ADD CONSTRAINT `leads_current_stage_id_stages_id_fk` FOREIGN KEY (`current_stage_id`) REFERENCES `stages`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_receivable_id_receivables_id_fk` FOREIGN KEY (`receivable_id`) REFERENCES `receivables`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_lead_id_leads_id_fk` FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `receivables` ADD CONSTRAINT `receivables_lead_id_leads_id_fk` FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `receivables` ADD CONSTRAINT `receivables_sale_id_sales_id_fk` FOREIGN KEY (`sale_id`) REFERENCES `sales`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `receivables` ADD CONSTRAINT `receivables_subscription_id_subscriptions_id_fk` FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sale_items` ADD CONSTRAINT `sale_items_sale_id_sales_id_fk` FOREIGN KEY (`sale_id`) REFERENCES `sales`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sale_items` ADD CONSTRAINT `sale_items_service_id_services_id_fk` FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `sales` ADD CONSTRAINT `sales_lead_id_leads_id_fk` FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stage_history` ADD CONSTRAINT `stage_history_lead_id_leads_id_fk` FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `stage_history` ADD CONSTRAINT `stage_history_stage_id_stages_id_fk` FOREIGN KEY (`stage_id`) REFERENCES `stages`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subscription_changes` ADD CONSTRAINT `subscription_changes_subscription_id_subscriptions_id_fk` FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_lead_id_leads_id_fk` FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_sale_item_id_sale_items_id_fk` FOREIGN KEY (`sale_item_id`) REFERENCES `sale_items`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_service_id_services_id_fk` FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `activities_lead_idx` ON `activities` (`lead_id`,`occurred_at`);--> statement-breakpoint
CREATE INDEX `activities_type_idx` ON `activities` (`activity_type`,`occurred_at`);--> statement-breakpoint
CREATE INDEX `audit_log_action_idx` ON `audit_log` (`action`,`occurred_at`);--> statement-breakpoint
CREATE INDEX `audit_log_entity_idx` ON `audit_log` (`entity_type`,`entity_id`);--> statement-breakpoint
CREATE INDEX `auth_sessions_user_idx` ON `auth_sessions` (`user_id`,`expires_at`);--> statement-breakpoint
CREATE INDEX `duplicate_reviews_status_idx` ON `duplicate_reviews` (`status`,`created_at`);--> statement-breakpoint
CREATE INDEX `duplicate_reviews_existing_idx` ON `duplicate_reviews` (`existing_lead_id`);--> statement-breakpoint
CREATE INDEX `follow_ups_status_due_idx` ON `follow_ups` (`status`,`due_at`);--> statement-breakpoint
CREATE INDEX `follow_ups_lead_idx` ON `follow_ups` (`lead_id`,`status`);--> statement-breakpoint
CREATE INDEX `goals_active_idx` ON `goals` (`active`,`metric_type`,`period_type`);--> statement-breakpoint
CREATE INDEX `import_jobs_created_idx` ON `import_jobs` (`created_at`);--> statement-breakpoint
CREATE INDEX `import_rows_status_idx` ON `import_rows` (`import_job_id`,`status`);--> statement-breakpoint
CREATE INDEX `lead_contacts_lead_idx` ON `lead_contacts` (`lead_id`,`type`);--> statement-breakpoint
CREATE INDEX `lead_contacts_normalized_idx` ON `lead_contacts` (`normalized_value`);--> statement-breakpoint
CREATE INDEX `lead_events_lead_idx` ON `lead_events` (`lead_id`,`occurred_at`);--> statement-breakpoint
CREATE INDEX `lead_events_type_idx` ON `lead_events` (`event_type`,`occurred_at`);--> statement-breakpoint
CREATE INDEX `lead_identity_memberships_lead_idx` ON `lead_identity_memberships` (`lead_id`);--> statement-breakpoint
CREATE INDEX `lead_links_lead_idx` ON `lead_links` (`lead_id`,`type`);--> statement-breakpoint
CREATE INDEX `lead_links_host_idx` ON `lead_links` (`normalized_host`);--> statement-breakpoint
CREATE INDEX `lead_losses_occurred_idx` ON `lead_losses` (`occurred_at`);--> statement-breakpoint
CREATE INDEX `lead_losses_reason_idx` ON `lead_losses` (`loss_reason_id`);--> statement-breakpoint
CREATE INDEX `lead_service_interests_lead_idx` ON `lead_service_interests` (`lead_id`,`status`);--> statement-breakpoint
CREATE INDEX `lead_service_interests_service_idx` ON `lead_service_interests` (`service_id`);--> statement-breakpoint
CREATE INDEX `leads_stage_idx` ON `leads` (`current_stage_id`,`archived_at`);--> statement-breakpoint
CREATE INDEX `leads_source_idx` ON `leads` (`source_id`);--> statement-breakpoint
CREATE INDEX `leads_created_idx` ON `leads` (`created_at`);--> statement-breakpoint
CREATE INDEX `leads_archived_idx` ON `leads` (`archived_at`);--> statement-breakpoint
CREATE INDEX `leads_city_idx` ON `leads` (`prospecting_city`);--> statement-breakpoint
CREATE INDEX `leads_niche_idx` ON `leads` (`prospecting_niche`);--> statement-breakpoint
CREATE INDEX `leads_name_idx` ON `leads` (`internal_name`);--> statement-breakpoint
CREATE INDEX `loss_reasons_position_idx` ON `loss_reasons` (`position`);--> statement-breakpoint
CREATE INDEX `payments_receivable_idx` ON `payments` (`receivable_id`);--> statement-breakpoint
CREATE INDEX `payments_date_idx` ON `payments` (`payment_date`,`status`);--> statement-breakpoint
CREATE INDEX `payments_lead_idx` ON `payments` (`lead_id`);--> statement-breakpoint
CREATE INDEX `receivables_status_due_idx` ON `receivables` (`status`,`due_date`);--> statement-breakpoint
CREATE INDEX `receivables_lead_idx` ON `receivables` (`lead_id`,`status`);--> statement-breakpoint
CREATE INDEX `receivables_sale_idx` ON `receivables` (`sale_id`);--> statement-breakpoint
CREATE INDEX `sale_items_sale_idx` ON `sale_items` (`sale_id`);--> statement-breakpoint
CREATE INDEX `sale_items_service_idx` ON `sale_items` (`service_id`);--> statement-breakpoint
CREATE INDEX `sales_status_idx` ON `sales` (`status`,`confirmed_at`);--> statement-breakpoint
CREATE INDEX `sales_lead_idx` ON `sales` (`lead_id`);--> statement-breakpoint
CREATE INDEX `sales_agreed_idx` ON `sales` (`agreed_at`);--> statement-breakpoint
CREATE INDEX `search_runs_created_idx` ON `search_runs` (`created_at`);--> statement-breakpoint
CREATE INDEX `services_active_idx` ON `services` (`active`,`name`);--> statement-breakpoint
CREATE INDEX `stage_history_lead_idx` ON `stage_history` (`lead_id`,`entered_at`);--> statement-breakpoint
CREATE INDEX `stage_history_open_idx` ON `stage_history` (`lead_id`,`exited_at`);--> statement-breakpoint
CREATE INDEX `stage_history_stage_idx` ON `stage_history` (`stage_id`,`entered_at`);--> statement-breakpoint
CREATE INDEX `stages_position_idx` ON `stages` (`position`);--> statement-breakpoint
CREATE INDEX `stages_semantic_idx` ON `stages` (`semantic_key`);--> statement-breakpoint
CREATE INDEX `stages_deleted_idx` ON `stages` (`deleted_at`);--> statement-breakpoint
CREATE INDEX `subscriptions_status_next_idx` ON `subscriptions` (`status`,`next_due_date`);--> statement-breakpoint
CREATE INDEX `subscriptions_lead_idx` ON `subscriptions` (`lead_id`);--> statement-breakpoint
CREATE INDEX `subscriptions_service_idx` ON `subscriptions` (`service_id`);