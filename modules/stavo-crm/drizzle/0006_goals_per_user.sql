ALTER TABLE `goals` ADD `user_id` varchar(26);--> statement-breakpoint
ALTER TABLE `goals` ADD CONSTRAINT `goals_user_id_users_id_fk` FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `goals_user_idx` ON `goals` (`user_id`);