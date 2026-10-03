CREATE TABLE `site_ai_usage` (
	`id` varchar(26) NOT NULL,
	`project_id` varchar(26),
	`job_id` varchar(26),
	`provider` varchar(24) NOT NULL,
	`operation` varchar(32) NOT NULL,
	`model` varchar(80) NOT NULL,
	`provider_request_id` varchar(120),
	`input_tokens` int NOT NULL DEFAULT 0,
	`cache_creation_tokens` int NOT NULL DEFAULT 0,
	`cache_read_tokens` int NOT NULL DEFAULT 0,
	`output_tokens` int NOT NULL DEFAULT 0,
	`image_count` int NOT NULL DEFAULT 0,
	`image_size` varchar(16),
	`image_quality` varchar(16),
	`cost_estimated_usd` decimal(12,6),
	`cost_actual_usd` decimal(12,6),
	`currency` varchar(3) NOT NULL DEFAULT 'USD',
	`pricing_version` varchar(32),
	`status` varchar(24) NOT NULL,
	`latency_ms` int,
	`created_at` datetime(3) NOT NULL,
	CONSTRAINT `site_ai_usage_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `site_assets` (
	`id` varchar(26) NOT NULL,
	`project_id` varchar(26) NOT NULL,
	`source` varchar(24) NOT NULL,
	`provider` varchar(24),
	`provider_model` varchar(80),
	`storage_key` varchar(255) NOT NULL,
	`original_filename` varchar(255),
	`mime_type` varchar(80) NOT NULL,
	`width` int,
	`height` int,
	`size_bytes` int NOT NULL,
	`checksum` varchar(64) NOT NULL,
	`alt_text` varchar(300),
	`focal_x` decimal(5,4),
	`focal_y` decimal(5,4),
	`transforms` json,
	`rights_status` varchar(16) NOT NULL DEFAULT 'UNKNOWN',
	`attribution` json,
	`external_ref` varchar(255),
	`expires_at` datetime(3),
	`created_by` varchar(26) NOT NULL,
	`created_at` datetime(3) NOT NULL,
	`updated_at` datetime(3) NOT NULL,
	`deleted_at` datetime(3),
	CONSTRAINT `site_assets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `site_generation_events` (
	`id` varchar(26) NOT NULL,
	`job_id` varchar(26) NOT NULL,
	`sequence` int NOT NULL,
	`event_type` varchar(24) NOT NULL,
	`stage` varchar(32),
	`message` varchar(300) NOT NULL,
	`metadata` json,
	`created_at` datetime(3) NOT NULL,
	CONSTRAINT `site_generation_events_id` PRIMARY KEY(`id`),
	CONSTRAINT `site_events_sequence_unique` UNIQUE(`job_id`,`sequence`)
);
--> statement-breakpoint
CREATE TABLE `site_generation_jobs` (
	`id` varchar(26) NOT NULL,
	`project_id` varchar(26) NOT NULL,
	`type` varchar(24) NOT NULL,
	`idempotency_key` varchar(120) NOT NULL,
	`status` varchar(16) NOT NULL DEFAULT 'PENDING',
	`stage` varchar(32),
	`progress` smallint NOT NULL DEFAULT 0,
	`provider` varchar(24),
	`model` varchar(80),
	`input_hash` varchar(64),
	`attempt` int NOT NULL DEFAULT 0,
	`max_attempts` int NOT NULL DEFAULT 2,
	`priority` smallint NOT NULL DEFAULT 0,
	`lease_owner` varchar(64),
	`lease_expires_at` datetime(3),
	`cancel_requested_at` datetime(3),
	`started_at` datetime(3),
	`finished_at` datetime(3),
	`error_code` varchar(64),
	`error_message` varchar(500),
	`error_retryable` boolean,
	`result_ref` varchar(26),
	`created_by` varchar(26) NOT NULL,
	`created_at` datetime(3) NOT NULL,
	`updated_at` datetime(3) NOT NULL,
	CONSTRAINT `site_generation_jobs_id` PRIMARY KEY(`id`),
	CONSTRAINT `site_jobs_idempotency_unique` UNIQUE(`idempotency_key`)
);
--> statement-breakpoint
CREATE TABLE `site_outreach_messages` (
	`id` varchar(26) NOT NULL,
	`project_id` varchar(26) NOT NULL,
	`publication_id` varchar(26),
	`lead_id` varchar(26),
	`phone_snapshot` varchar(24),
	`message_text` text NOT NULL,
	`generated_by_model` varchar(80),
	`edited_by_user` boolean NOT NULL DEFAULT false,
	`opened_at` datetime(3),
	`confirmed_sent_at` datetime(3),
	`created_by` varchar(26) NOT NULL,
	`created_at` datetime(3) NOT NULL,
	`updated_at` datetime(3) NOT NULL,
	CONSTRAINT `site_outreach_messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `site_project_versions` (
	`id` varchar(26) NOT NULL,
	`project_id` varchar(26) NOT NULL,
	`version_number` int NOT NULL,
	`config` json NOT NULL,
	`schema_version` varchar(16) NOT NULL,
	`renderer_version` varchar(16) NOT NULL,
	`prompt_version` varchar(16) NOT NULL,
	`origin` varchar(16) NOT NULL,
	`summary` varchar(300),
	`checksum` varchar(64) NOT NULL,
	`created_by` varchar(26),
	`created_at` datetime(3) NOT NULL,
	CONSTRAINT `site_project_versions_id` PRIMARY KEY(`id`),
	CONSTRAINT `site_versions_number_unique` UNIQUE(`project_id`,`version_number`)
);
--> statement-breakpoint
CREATE TABLE `site_projects` (
	`id` varchar(26) NOT NULL,
	`lead_id` varchar(26),
	`owner_user_id` varchar(26) NOT NULL,
	`internal_name` varchar(160) NOT NULL,
	`business_name` varchar(160) NOT NULL,
	`site_type` varchar(16) NOT NULL,
	`status` varchar(16) NOT NULL DEFAULT 'BRIEFING',
	`desired_slug` varchar(60),
	`draft_config` json,
	`schema_version` varchar(16) NOT NULL DEFAULT '1.0.0',
	`renderer_version` varchar(16) NOT NULL DEFAULT '1.0.0',
	`prompt_version` varchar(16) NOT NULL DEFAULT '1.0.0',
	`creative_seed` varchar(32) NOT NULL,
	`design_fingerprint` varchar(64),
	`current_version_number` int NOT NULL DEFAULT 0,
	`active_publication_id` varchar(26),
	`lock_version` int NOT NULL DEFAULT 1,
	`cost_accumulated_usd` decimal(12,6) NOT NULL DEFAULT '0',
	`budget_limit_usd` decimal(12,6),
	`last_failure_code` varchar(64),
	`last_failure_message` varchar(500),
	`created_by` varchar(26) NOT NULL,
	`created_at` datetime(3) NOT NULL,
	`updated_at` datetime(3) NOT NULL,
	`archived_at` datetime(3),
	`deleted_at` datetime(3),
	CONSTRAINT `site_projects_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `site_publications` (
	`id` varchar(26) NOT NULL,
	`project_id` varchar(26) NOT NULL,
	`version_id` varchar(26) NOT NULL,
	`publication_number` int NOT NULL,
	`slug` varchar(60) NOT NULL,
	`status` varchar(16) NOT NULL DEFAULT 'BUILDING',
	`artifact_key` varchar(255),
	`manifest` json,
	`artifact_checksum` varchar(64),
	`base_url_snapshot` varchar(255),
	`noindex` boolean NOT NULL DEFAULT true,
	`smoke_test_result` json,
	`smoke_test_passed_at` datetime(3),
	`failure_code` varchar(64),
	`failure_message` varchar(500),
	`published_by` varchar(26) NOT NULL,
	`published_at` datetime(3),
	`superseded_at` datetime(3),
	`unpublished_at` datetime(3),
	`created_at` datetime(3) NOT NULL,
	`updated_at` datetime(3) NOT NULL,
	CONSTRAINT `site_publications_id` PRIMARY KEY(`id`),
	CONSTRAINT `site_publications_number_unique` UNIQUE(`project_id`,`publication_number`)
);
--> statement-breakpoint
ALTER TABLE `site_ai_usage` ADD CONSTRAINT `site_ai_usage_project_id_site_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `site_projects`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `site_assets` ADD CONSTRAINT `site_assets_project_id_site_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `site_projects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `site_generation_events` ADD CONSTRAINT `site_generation_events_job_id_site_generation_jobs_id_fk` FOREIGN KEY (`job_id`) REFERENCES `site_generation_jobs`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `site_generation_jobs` ADD CONSTRAINT `site_generation_jobs_project_id_site_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `site_projects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `site_outreach_messages` ADD CONSTRAINT `site_outreach_messages_project_id_site_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `site_projects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `site_outreach_messages` ADD CONSTRAINT `site_outreach_messages_lead_id_leads_id_fk` FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `site_project_versions` ADD CONSTRAINT `site_project_versions_project_id_site_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `site_projects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `site_projects` ADD CONSTRAINT `site_projects_lead_id_leads_id_fk` FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `site_projects` ADD CONSTRAINT `site_projects_owner_user_id_users_id_fk` FOREIGN KEY (`owner_user_id`) REFERENCES `users`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `site_publications` ADD CONSTRAINT `site_publications_project_id_site_projects_id_fk` FOREIGN KEY (`project_id`) REFERENCES `site_projects`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `site_publications` ADD CONSTRAINT `site_publications_version_id_site_project_versions_id_fk` FOREIGN KEY (`version_id`) REFERENCES `site_project_versions`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `site_usage_project_idx` ON `site_ai_usage` (`project_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `site_usage_job_idx` ON `site_ai_usage` (`job_id`);--> statement-breakpoint
CREATE INDEX `site_usage_created_idx` ON `site_ai_usage` (`created_at`);--> statement-breakpoint
CREATE INDEX `site_assets_project_idx` ON `site_assets` (`project_id`,`deleted_at`);--> statement-breakpoint
CREATE INDEX `site_assets_checksum_idx` ON `site_assets` (`project_id`,`checksum`);--> statement-breakpoint
CREATE INDEX `site_events_job_idx` ON `site_generation_events` (`job_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `site_jobs_claim_idx` ON `site_generation_jobs` (`status`,`priority`,`created_at`);--> statement-breakpoint
CREATE INDEX `site_jobs_project_idx` ON `site_generation_jobs` (`project_id`,`status`);--> statement-breakpoint
CREATE INDEX `site_jobs_lease_idx` ON `site_generation_jobs` (`status`,`lease_expires_at`);--> statement-breakpoint
CREATE INDEX `site_outreach_project_idx` ON `site_outreach_messages` (`project_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `site_outreach_lead_idx` ON `site_outreach_messages` (`lead_id`);--> statement-breakpoint
CREATE INDEX `site_versions_project_idx` ON `site_project_versions` (`project_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `site_projects_lead_idx` ON `site_projects` (`lead_id`,`status`);--> statement-breakpoint
CREATE INDEX `site_projects_status_idx` ON `site_projects` (`status`,`updated_at`);--> statement-breakpoint
CREATE INDEX `site_projects_owner_idx` ON `site_projects` (`owner_user_id`);--> statement-breakpoint
CREATE INDEX `site_projects_updated_idx` ON `site_projects` (`updated_at`);--> statement-breakpoint
CREATE INDEX `site_publications_project_idx` ON `site_publications` (`project_id`,`status`);--> statement-breakpoint
CREATE INDEX `site_publications_slug_idx` ON `site_publications` (`slug`,`status`);