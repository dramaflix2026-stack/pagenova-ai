CREATE TABLE `workspace_members` (
	`workspace_id` varchar(26) NOT NULL,
	`user_id` varchar(26) NOT NULL,
	`role` varchar(16) NOT NULL DEFAULT 'EMPLOYEE',
	`status` varchar(16) NOT NULL DEFAULT 'ACTIVE',
	`created_at` datetime(3) NOT NULL,
	`updated_at` datetime(3) NOT NULL,
	CONSTRAINT `workspace_members_workspace_id_user_id_pk` PRIMARY KEY(`workspace_id`,`user_id`)
);
--> statement-breakpoint
CREATE TABLE `workspaces` (
	`id` varchar(26) NOT NULL,
	`external_owner_id` varchar(128),
	`name` varchar(160) NOT NULL,
	`slug` varchar(120),
	`status` varchar(16) NOT NULL DEFAULT 'ACTIVE',
	`created_at` datetime(3) NOT NULL,
	`updated_at` datetime(3) NOT NULL,
	CONSTRAINT `workspaces_id` PRIMARY KEY(`id`),
	CONSTRAINT `workspaces_external_owner_unique` UNIQUE(`external_owner_id`),
	CONSTRAINT `workspaces_slug_unique` UNIQUE(`slug`)
);
--> statement-breakpoint
ALTER TABLE `auth_sessions` ADD `workspace_id` varchar(26);--> statement-breakpoint
ALTER TABLE `users` ADD `external_auth_id` varchar(128);--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_external_auth_id_unique` UNIQUE(`external_auth_id`);--> statement-breakpoint
ALTER TABLE `workspace_members` ADD CONSTRAINT `workspace_members_workspace_id_workspaces_id_fk` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE `workspace_members` ADD CONSTRAINT `workspace_members_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `workspace_members_user_idx` ON `workspace_members` (`user_id`,`status`);--> statement-breakpoint
CREATE INDEX `workspace_members_workspace_idx` ON `workspace_members` (`workspace_id`,`status`);--> statement-breakpoint
CREATE INDEX `workspaces_status_idx` ON `workspaces` (`status`);--> statement-breakpoint
ALTER TABLE `auth_sessions` ADD CONSTRAINT `auth_sessions_workspace_id_workspaces_id_fk` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `auth_sessions_workspace_idx` ON `auth_sessions` (`workspace_id`);