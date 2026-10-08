CREATE TABLE `pagenova_subscriber_usage` (
  `id` varchar(26) NOT NULL,
  `subscriber_id` varchar(128) NOT NULL,
  `cycle_start` datetime NOT NULL,
  `cycle_end` datetime NOT NULL,
  `meter` varchar(32) NOT NULL,
  `request_count` int NOT NULL DEFAULT 0,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `pagenova_subscriber_usage_unique` (`subscriber_id`,`cycle_start`,`meter`)
);
CREATE TABLE `pagenova_generation_debits` (
  `id` varchar(26) NOT NULL,
  `subscriber_id` varchar(128) NOT NULL,
  `generation_id` varchar(128) NOT NULL,
  `cycle_start` datetime NOT NULL,
  `source` varchar(32) NOT NULL,
  `created_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `pagenova_generation_debits_unique` (`subscriber_id`,`generation_id`)
);
