CREATE TABLE `pagenova_generation_debits` (
  `id` varchar(26) NOT NULL,
  `subscriber_id` varchar(128) NOT NULL,
  `generation_id` varchar(128) NOT NULL,
  `cycle_start` datetime NOT NULL,
  `source` varchar(32) NOT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `pagenova_generation_debits_unique` (`subscriber_id`, `generation_id`)
);
