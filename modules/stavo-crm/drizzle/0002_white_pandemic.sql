CREATE TABLE `meeting_reminders` (
	`id` varchar(26) NOT NULL,
	`meeting_id` varchar(26) NOT NULL,
	`offset_minutes` int NOT NULL,
	`remind_at` datetime(3) NOT NULL,
	`status` varchar(16) NOT NULL DEFAULT 'PENDING',
	`read_at` datetime(3),
	`dismissed_at` datetime(3),
	`canceled_at` datetime(3),
	`meeting_version` int NOT NULL,
	`created_at` datetime(3) NOT NULL,
	`updated_at` datetime(3) NOT NULL,
	CONSTRAINT `meeting_reminders_id` PRIMARY KEY(`id`),
	CONSTRAINT `meeting_reminders_unique` UNIQUE(`meeting_id`,`meeting_version`,`offset_minutes`)
);
--> statement-breakpoint
CREATE TABLE `meetings` (
	`id` varchar(26) NOT NULL,
	`lead_id` varchar(26) NOT NULL,
	`title` varchar(160) NOT NULL,
	`agenda` text,
	`internal_notes` text,
	`service_id` varchar(26),
	`start_at` datetime(3) NOT NULL,
	`end_at` datetime(3) NOT NULL,
	`timezone` varchar(64) NOT NULL DEFAULT 'America/Sao_Paulo',
	`meet_url` varchar(500) NOT NULL,
	`status` varchar(16) NOT NULL DEFAULT 'SCHEDULED',
	`outcome` text,
	`cancel_reason` varchar(500),
	`completed_at` datetime(3),
	`canceled_at` datetime(3),
	`no_show_at` datetime(3),
	`created_by` varchar(26) NOT NULL,
	`version` int NOT NULL DEFAULT 1,
	`created_at` datetime(3) NOT NULL,
	`updated_at` datetime(3) NOT NULL,
	CONSTRAINT `meetings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `lead_events` ADD `meeting_id` varchar(26);--> statement-breakpoint
ALTER TABLE `meeting_reminders` ADD CONSTRAINT `meeting_reminders_meeting_id_meetings_id_fk` FOREIGN KEY (`meeting_id`) REFERENCES `meetings`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `meetings` ADD CONSTRAINT `meetings_lead_id_leads_id_fk` FOREIGN KEY (`lead_id`) REFERENCES `leads`(`id`) ON DELETE restrict ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `meetings` ADD CONSTRAINT `meetings_service_id_services_id_fk` FOREIGN KEY (`service_id`) REFERENCES `services`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `meeting_reminders_due_idx` ON `meeting_reminders` (`status`,`remind_at`);--> statement-breakpoint
CREATE INDEX `meeting_reminders_meeting_idx` ON `meeting_reminders` (`meeting_id`,`status`);--> statement-breakpoint
CREATE INDEX `meetings_lead_idx` ON `meetings` (`lead_id`,`status`,`start_at`);--> statement-breakpoint
CREATE INDEX `meetings_window_idx` ON `meetings` (`status`,`start_at`,`end_at`);--> statement-breakpoint
CREATE INDEX `meetings_start_idx` ON `meetings` (`start_at`);--> statement-breakpoint
CREATE INDEX `lead_events_meeting_idx` ON `lead_events` (`meeting_id`,`occurred_at`);