ALTER TABLE `site_ai_usage` ADD `stop_reason` varchar(40);--> statement-breakpoint
ALTER TABLE `site_ai_usage` ADD `effort` varchar(12);--> statement-breakpoint
ALTER TABLE `site_ai_usage` ADD `prompt_version` varchar(32);--> statement-breakpoint
ALTER TABLE `site_ai_usage` ADD `schema_version` varchar(32);--> statement-breakpoint
ALTER TABLE `site_ai_usage` ADD `attempts` int;--> statement-breakpoint
ALTER TABLE `site_ai_usage` ADD `content_blocks` varchar(200);--> statement-breakpoint
ALTER TABLE `site_ai_usage` ADD `output_bytes` int;--> statement-breakpoint
ALTER TABLE `site_ai_usage` ADD `validation_issues` int;--> statement-breakpoint
ALTER TABLE `site_ai_usage` ADD `error_code` varchar(40);