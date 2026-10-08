CREATE TABLE `pagenova_subscriber_usage` (
  `id` varchar(26) NOT NULL,
  `subscriber_id` varchar(128) NOT NULL,
  `cycle_start` datetime NOT NULL,
  `cycle_end` datetime NOT NULL,
  `meter` varchar(32) NOT NULL,
  `request_count` int NOT NULL DEFAULT 0,
  `updated_at` datetime NOT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `pagenova_subscriber_usage_unique` (`subscriber_id`, `cycle_start`, `meter`)
);
