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
ALTER TABLE `users` ADD `external_auth_id` varchar(128);
--> statement-breakpoint
ALTER TABLE `auth_sessions` ADD `workspace_id` varchar(26);
--> statement-breakpoint
ALTER TABLE `app_settings` ADD `workspace_id` varchar(26);
--> statement-breakpoint
ALTER TABLE `audit_log` ADD `workspace_id` varchar(26);
--> statement-breakpoint
ALTER TABLE `lead_sources` ADD `workspace_id` varchar(26);
--> statement-breakpoint
ALTER TABLE `stages` ADD `workspace_id` varchar(26);
--> statement-breakpoint
ALTER TABLE `loss_reasons` ADD `workspace_id` varchar(26);
--> statement-breakpoint
ALTER TABLE `services` ADD `workspace_id` varchar(26);
--> statement-breakpoint
ALTER TABLE `leads` ADD `workspace_id` varchar(26);
--> statement-breakpoint
ALTER TABLE `lead_identity_keys` ADD `workspace_id` varchar(26);
--> statement-breakpoint
ALTER TABLE `goals` ADD `workspace_id` varchar(26);
--> statement-breakpoint
ALTER TABLE `import_jobs` ADD `workspace_id` varchar(26);
--> statement-breakpoint
ALTER TABLE `search_runs` ADD `workspace_id` varchar(26);
--> statement-breakpoint
ALTER TABLE `meetings` ADD `workspace_id` varchar(26);
--> statement-breakpoint
ALTER TABLE `sales` ADD `workspace_id` varchar(26);
--> statement-breakpoint
ALTER TABLE `subscriptions` ADD `workspace_id` varchar(26);
--> statement-breakpoint
ALTER TABLE `receivables` ADD `workspace_id` varchar(26);
--> statement-breakpoint
ALTER TABLE `payments` ADD `workspace_id` varchar(26);
--> statement-breakpoint
ALTER TABLE `site_projects` ADD `workspace_id` varchar(26);
--> statement-breakpoint
ALTER TABLE `users` ADD CONSTRAINT `users_external_auth_id_unique` UNIQUE(`external_auth_id`);
--> statement-breakpoint
ALTER TABLE `workspace_members` ADD CONSTRAINT `workspace_members_workspace_id_workspaces_id_fk` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `workspace_members` ADD CONSTRAINT `workspace_members_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `auth_sessions` ADD CONSTRAINT `auth_sessions_workspace_id_workspaces_id_fk` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `app_settings` ADD CONSTRAINT `app_settings_workspace_id_workspaces_id_fk` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `audit_log` ADD CONSTRAINT `audit_log_workspace_id_workspaces_id_fk` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `lead_sources` ADD CONSTRAINT `lead_sources_workspace_id_workspaces_id_fk` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `stages` ADD CONSTRAINT `stages_workspace_id_workspaces_id_fk` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `loss_reasons` ADD CONSTRAINT `loss_reasons_workspace_id_workspaces_id_fk` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `services` ADD CONSTRAINT `services_workspace_id_workspaces_id_fk` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `leads` ADD CONSTRAINT `leads_workspace_id_workspaces_id_fk` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `lead_identity_keys` ADD CONSTRAINT `lead_identity_keys_workspace_id_workspaces_id_fk` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `goals` ADD CONSTRAINT `goals_workspace_id_workspaces_id_fk` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `import_jobs` ADD CONSTRAINT `import_jobs_workspace_id_workspaces_id_fk` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `search_runs` ADD CONSTRAINT `search_runs_workspace_id_workspaces_id_fk` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `meetings` ADD CONSTRAINT `meetings_workspace_id_workspaces_id_fk` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `sales` ADD CONSTRAINT `sales_workspace_id_workspaces_id_fk` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `subscriptions` ADD CONSTRAINT `subscriptions_workspace_id_workspaces_id_fk` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `receivables` ADD CONSTRAINT `receivables_workspace_id_workspaces_id_fk` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `payments` ADD CONSTRAINT `payments_workspace_id_workspaces_id_fk` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
ALTER TABLE `site_projects` ADD CONSTRAINT `site_projects_workspace_id_workspaces_id_fk` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces`(`id`) ON DELETE cascade ON UPDATE no action;
--> statement-breakpoint
CREATE INDEX `workspace_members_user_idx` ON `workspace_members` (`user_id`,`status`);
--> statement-breakpoint
CREATE INDEX `workspace_members_workspace_idx` ON `workspace_members` (`workspace_id`,`status`);
--> statement-breakpoint
CREATE INDEX `workspaces_status_idx` ON `workspaces` (`status`);
--> statement-breakpoint
CREATE INDEX `auth_sessions_workspace_idx` ON `auth_sessions` (`workspace_id`);
--> statement-breakpoint
CREATE INDEX `audit_log_workspace_idx` ON `audit_log` (`workspace_id`);
--> statement-breakpoint
CREATE INDEX `lead_sources_workspace_idx` ON `lead_sources` (`workspace_id`);
--> statement-breakpoint
CREATE INDEX `stages_workspace_idx` ON `stages` (`workspace_id`);
--> statement-breakpoint
CREATE INDEX `loss_reasons_workspace_idx` ON `loss_reasons` (`workspace_id`);
--> statement-breakpoint
CREATE INDEX `services_workspace_idx` ON `services` (`workspace_id`);
--> statement-breakpoint
CREATE INDEX `leads_workspace_idx` ON `leads` (`workspace_id`);
--> statement-breakpoint
CREATE INDEX `lead_identity_keys_workspace_idx` ON `lead_identity_keys` (`workspace_id`);
--> statement-breakpoint
CREATE INDEX `goals_workspace_idx` ON `goals` (`workspace_id`);
--> statement-breakpoint
CREATE INDEX `import_jobs_workspace_idx` ON `import_jobs` (`workspace_id`);
--> statement-breakpoint
CREATE INDEX `search_runs_workspace_idx` ON `search_runs` (`workspace_id`);
--> statement-breakpoint
CREATE INDEX `meetings_workspace_idx` ON `meetings` (`workspace_id`);
--> statement-breakpoint
CREATE INDEX `sales_workspace_idx` ON `sales` (`workspace_id`);
--> statement-breakpoint
CREATE INDEX `subscriptions_workspace_idx` ON `subscriptions` (`workspace_id`);
--> statement-breakpoint
CREATE INDEX `receivables_workspace_idx` ON `receivables` (`workspace_id`);
--> statement-breakpoint
CREATE INDEX `payments_workspace_idx` ON `payments` (`workspace_id`);
--> statement-breakpoint
CREATE INDEX `site_projects_workspace_idx` ON `site_projects` (`workspace_id`);
