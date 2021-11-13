ALTER TABLE `levelroles`
	CREATE COLUMN IF NOT EXISTS `id`           CHAR(12)     NOT NULL,
	CREATE COLUMN IF NOT EXISTS `guild_id`     VARCHAR(21)  NOT NULL,
	CREATE COLUMN IF NOT EXISTS `role`         VARCHAR(21)  NOT NULL,
	CREATE COLUMN IF NOT EXISTS `xp_required`  MEDIUMINT    NOT NULL DEFAULT 0,
	-- Indexes
	ADD UNIQUE INDEX IF NOT EXISTS `id`          (`id`),
	ADD UNIQUE INDEX IF NOT EXISTS `guild_role`  (`guild_id`, `role`),
	ADD INDEX IF NOT EXISTS        `guild_id`    (`guild_id`),
	ADD INDEX IF NOT EXISTS        `role`        (`role`),
	ADD INDEX IF NOT EXISTS        `xp_required` (`xp_required`),
	-- Foreign Keys
	ADD CONSTRAINT `fk_levelroles_guildid` FOREIGN KEY IF NOT EXISTS (`guild_id`) REFERENCES `guilds` (`id`)
