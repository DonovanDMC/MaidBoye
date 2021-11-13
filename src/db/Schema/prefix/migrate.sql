ALTER TABLE `prefix`
	CREATE COLUMN IF NOT EXISTS `id`        CHAR(12)     NOT NULL,
	CREATE COLUMN IF NOT EXISTS `guild_id`  VARCHAR(21)  NOT NULL,
	CREATE COLUMN IF NOT EXISTS `value`     VARCHAR(25)  NOT NULL,
	CREATE COLUMN IF NOT EXISTS `space`     TINYINT(1)   NOT NULL DEFAULT 0,
	-- Indexes
	ADD UNIQUE INDEX IF NOT EXISTS `id`          (`id`),
	ADD UNIQUE INDEX IF NOT EXISTS `value_guild` (`value`, `guild_id`),
	ADD INDEX IF NOT EXISTS        `guild_id`    (`guild_id`),
	-- Foreign Keys
	ADD CONSTRAINT `fk_prefix_guildid` FOREIGN KEY IF NOT EXISTS (`guild_id`) REFERENCES `guilds` (`id`);
