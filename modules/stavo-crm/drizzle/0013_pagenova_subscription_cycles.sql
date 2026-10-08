CREATE TABLE `pagenova_subscription_cycles` (
  `id` varchar(26) NOT NULL,
  `subscriber_id` varchar(128) NOT NULL,
  `cycle_start` datetime NOT NULL,
  `cycle_end` datetime NOT NULL,
  `status` varchar(16) NOT NULL,
  `provider` varchar(32) NOT NULL,
  `provider_reference` varchar(128) NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `pagenova_subscription_cycles_unique` (`subscriber_id`, `cycle_start`),
  KEY `pagenova_subscription_cycles_lookup` (`subscriber_id`, `status`, `cycle_end`)
);
