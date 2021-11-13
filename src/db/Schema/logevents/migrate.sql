ALTER TABLE `logevents`
	CREATE COLUMN IF NOT EXISTS `id`                  CHAR(12)     NOT NULL,
	CREATE COLUMN IF NOT EXISTS `guild_id`            VARCHAR(21)  NOT NULL,
	CREATE COLUMN IF NOT EXISTS `event`               VARCHAR(20)  NOT NULL,
	CREATE COLUMN IF NOT EXISTS `webhook_id`          VARCHAR(21)  NOT NULL,
	CREATE COLUMN IF NOT EXISTS `webhook_token`       TINYTEXT     NOT NULL,
	CREATE COLUMN IF NOT EXISTS `webhook_channel_id`  VARCHAR(21)  NOT NULL,
	-- Indexes
	ADD UNIQUE INDEX IF NOT EXISTS `id`                  (`id`),
	ADD UNIQUE INDEX IF NOT EXISTS `guild_event_channel` (`guild_id`,`event`,`webhook_channel_id`),
	ADD INDEX IF NOT EXISTS        `guild_id`            (`guild_id`),
	ADD INDEX IF NOT EXISTS        `event`               (`event`),
	ADD INDEX IF NOT EXISTS        `webhook_channel_id`  (`webhook_channel_id`),
	-- Foreign Keys
	ADD CONSTRAINT `fk_logevents_guildid` FOREIGN KEY IF NOT EXISTS (`guild_id`) REFERENCES `guilds` (`id`);
