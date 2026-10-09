ALTER TABLE `pagenova_subscription_cycles`
  ADD COLUMN `provider_order_id` varchar(128) NULL,
  ADD UNIQUE KEY `pagenova_subscription_cycles_provider_order_unique` (`provider`, `provider_order_id`);
