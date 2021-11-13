ALTER TABLE `autounarchive`
	ADD COLUMN IF NOT EXISTS `id`         CHAR(12)     NOT NULL,
	ADD COLUMN IF NOT EXISTS `guild_id`   VARCHAR(21)  NOT NULL,
	ADD COLUMN IF NOT EXISTS `thread_id`  VARCHAR(21)  NOT NULL,
	-- Indexes
	ADD UNIQUE INDEX IF NOT EXISTS `id`           (`id`),
	ADD UNIQUE INDEX IF NOT EXISTS `guild_thread` (`guild_id`, `thread_id`),
	ADD INDEX IF NOT EXISTS        `guild_id`     (`guild_id`),
	ADD INDEX IF NOT EXISTS        `thread_id`    (`thread_id`),
	-- Foreign Keys
	ADD CONSTRAINT `fk_autounarchive_guildid` FOREIGN KEY IF NOT EXISTS (`guild_id`) REFERENCES `guilds` (`id`);
