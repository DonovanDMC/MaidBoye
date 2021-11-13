ALTER TABLE `timed`
	ADD COLUMN IF NOT EXISTS `id`        CHAR(12)     NOT NULL,
	ADD COLUMN IF NOT EXISTS `type`      TINYTEXT     NOT NULL,
	ADD COLUMN IF NOT EXISTS `guild_id`  VARCHAR(21)  NOT NULL,
	ADD COLUMN IF NOT EXISTS `user_id`   VARCHAR(21)  NOT NULL,
	ADD COLUMN IF NOT EXISTS `time`      BIGINT(20)   NOT NULL,
	ADD COLUMN IF NOT EXISTS `expiry`    BIGINT(20)   NOT NULL,
	-- Indexes
	ADD UNIQUE INDEX IF NOT EXISTS `id`       (`id`),
	ADD INDEX IF NOT EXISTS        `type`     (`type`),
	ADD INDEX IF NOT EXISTS        `guild_id` (`guild_id`),
	ADD INDEX IF NOT EXISTS        `user_id`  (`user_id`),
	ADD INDEX IF NOT EXISTS        `expiry`   (`expiry`),
	-- Foreign Keys
	ADD CONSTRAINT `fk_timed_guildid` FOREIGN KEY IF NOT EXISTS (`guild_id`) REFERENCES `guilds` (`id`),
	ADD CONSTRAINT `fk_timed_userid` FOREIGN KEY IF NOT EXISTS (`user_id`) REFERENCES `users` (`id`);
