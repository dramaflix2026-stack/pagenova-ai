CREATE TABLE `pagenova_workspace_usage` (
  `id` varchar(26) NOT NULL,
  `workspace_id` varchar(26) NOT NULL,
  `billing_month` varchar(7) NOT NULL,
  `meter` varchar(32) NOT NULL,
  `request_count` int NOT NULL DEFAULT 0,
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `pagenova_workspace_usage_unique` (`workspace_id`, `billing_month`, `meter`),
  CONSTRAINT `pagenova_workspace_usage_workspace_fk` FOREIGN KEY (`workspace_id`) REFERENCES `workspaces` (`id`) ON DELETE CASCADE
);
