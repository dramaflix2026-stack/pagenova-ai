CREATE TABLE IF NOT EXISTS `pagenova_revoked_orders` (
  `provider` varchar(32) NOT NULL,
  `provider_order_id` varchar(128) NOT NULL,
  `reason` varchar(16) NOT NULL,
  `revoked_at` datetime NOT NULL,
  PRIMARY KEY (`provider`, `provider_order_id`)
);
