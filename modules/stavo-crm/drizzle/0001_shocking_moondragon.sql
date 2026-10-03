ALTER TABLE `leads` ADD `owner_user_id` varchar(26);--> statement-breakpoint
ALTER TABLE `users` ADD `name` varchar(120) DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `role` varchar(16) DEFAULT 'OWNER' NOT NULL;--> statement-breakpoint
ALTER TABLE `leads` ADD CONSTRAINT `leads_owner_user_id_users_id_fk` FOREIGN KEY (`owner_user_id`) REFERENCES `users`(`id`) ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE INDEX `leads_owner_idx` ON `leads` (`owner_user_id`);--> statement-breakpoint
-- Os leads que ja existiam foram todos trazidos pelo administrador original.
-- Sem este passo eles ficariam sem dono, e qualquer colaborador novo poderia
-- assumi-los sem querer.
UPDATE `leads`
   SET `owner_user_id` = (
         SELECT `id` FROM `users` WHERE `role` = 'OWNER' ORDER BY `created_at` LIMIT 1
       )
 WHERE `owner_user_id` IS NULL;
