-- Durable binary media for deployments without an attached Railway volume.
-- Assets remain private and are only read using server-side storage keys.
CREATE TABLE IF NOT EXISTS `site_storage_blobs` (
  `scope` varchar(16) NOT NULL,
  `storage_key` varchar(255) NOT NULL,
  `data` mediumblob NOT NULL,
  `checksum` varchar(64) NOT NULL,
  `updated_at` datetime(3) NOT NULL,
  PRIMARY KEY (`scope`, `storage_key`)
);
