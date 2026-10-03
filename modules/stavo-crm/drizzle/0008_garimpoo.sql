CREATE TABLE `garimpoo_members` (
	`id` varchar(26) NOT NULL,
	`email` varchar(254) NOT NULL,
	`name` varchar(160),
	`phone` varchar(32),
	`status` varchar(16) NOT NULL DEFAULT 'PENDING',
	`source` varchar(16) NOT NULL DEFAULT 'CAKTO',
	`last_order_id` varchar(120),
	`cakto_customer_id` varchar(120),
	`password_hash` varchar(255),
	`daily_search_limit` int,
	`purchased_at` datetime(3),
	`activated_at` datetime(3),
	`last_login_at` datetime(3),
	`revoked_at` datetime(3),
	`revoked_reason` varchar(32),
	`created_at` datetime(3) NOT NULL,
	`updated_at` datetime(3) NOT NULL,
	CONSTRAINT `garimpoo_members_id` PRIMARY KEY(`id`),
	CONSTRAINT `garimpoo_members_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `garimpoo_search_log` (
	`id` varchar(26) NOT NULL,
	`member_id` varchar(26) NOT NULL,
	`niche` varchar(120) NOT NULL,
	`city` varchar(120),
	`state` varchar(80),
	`result_count` int NOT NULL DEFAULT 0,
	`page_number` int NOT NULL DEFAULT 1,
	`ip_hash` varchar(64),
	`created_at` datetime(3) NOT NULL,
	CONSTRAINT `garimpoo_search_log_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `garimpoo_sessions` (
	`id` varchar(26) NOT NULL,
	`member_id` varchar(26) NOT NULL,
	`token_hash` varchar(64) NOT NULL,
	`device_id` varchar(64) NOT NULL,
	`device_label` varchar(120),
	`ip_hash` varchar(64),
	`created_at` datetime(3) NOT NULL,
	`last_seen_at` datetime(3) NOT NULL,
	`expires_at` datetime(3) NOT NULL,
	`revoked_at` datetime(3),
	`revoked_reason` varchar(32),
	CONSTRAINT `garimpoo_sessions_id` PRIMARY KEY(`id`),
	CONSTRAINT `garimpoo_sessions_token_unique` UNIQUE(`token_hash`)
);
--> statement-breakpoint
CREATE TABLE `garimpoo_webhook_events` (
	`id` varchar(26) NOT NULL,
	`provider` varchar(16) NOT NULL DEFAULT 'CAKTO',
	`external_id` varchar(160) NOT NULL,
	`event_type` varchar(60) NOT NULL,
	`order_id` varchar(120),
	`email` varchar(254),
	`status` varchar(16) NOT NULL,
	`outcome` varchar(255),
	`received_at` datetime(3) NOT NULL,
	CONSTRAINT `garimpoo_webhook_events_id` PRIMARY KEY(`id`),
	CONSTRAINT `garimpoo_webhook_external_unique` UNIQUE(`provider`,`external_id`)
);
--> statement-breakpoint
ALTER TABLE `garimpoo_search_log` ADD CONSTRAINT `garimpoo_search_log_member_id_garimpoo_members_id_fk` FOREIGN KEY (`member_id`) REFERENCES `garimpoo_members`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `garimpoo_sessions` ADD CONSTRAINT `garimpoo_sessions_member_id_garimpoo_members_id_fk` FOREIGN KEY (`member_id`) REFERENCES `garimpoo_members`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `garimpoo_members_status_idx` ON `garimpoo_members` (`status`);--> statement-breakpoint
CREATE INDEX `garimpoo_search_member_idx` ON `garimpoo_search_log` (`member_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `garimpoo_sessions_member_idx` ON `garimpoo_sessions` (`member_id`,`revoked_at`);--> statement-breakpoint
CREATE INDEX `garimpoo_webhook_email_idx` ON `garimpoo_webhook_events` (`email`);