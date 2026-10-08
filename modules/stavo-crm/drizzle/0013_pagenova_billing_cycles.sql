CREATE TABLE `pagenova_billing_cycles` (
  `id` varchar(26) NOT NULL,
  `subscriber_id` varchar(128) NOT NULL,
  `starts_at` datetime NOT NULL,
  `ends_at` datetime NOT NULL,
  `provider` varchar(32) NOT NULL,
  `provider_reference` varchar(128) NOT NULL,
  `status` varchar(16) NOT NULL,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `pagenova_billing_cycles_provider_unique` (`provider`, `provider_reference`),
  KEY `pagenova_billing_cycles_subscriber_idx` (`subscriber_id`, `starts_at`)
);
