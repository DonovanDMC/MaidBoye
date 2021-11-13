ALTER TABLE `selfroles`
	ADD COLUMN IF NOT EXISTS `id`        CHAR(12)     NOT NULL,
	ADD COLUMN IF NOT EXISTS `guild_id`  VARCHAR(21)  NOT NULL,
	ADD COLUMN IF NOT EXISTS `role`      VARCHAR(21)  NOT NULL,
	ADD COLUMN IF NOT EXISTS `added_at`  BIGINT(20)   UNSIGNED NOT NULL,
	ADD COLUMN IF NOT EXISTS `added_by`  VARCHAR(21)  NOT NULL,
	-- Indexes
	ADD UNIQUE INDEX IF NOT EXISTS `id`         (`id`),
	ADD UNIQUE INDEX IF NOT EXISTS `role_guild` (`role`, `guild_id`),
	ADD INDEX IF NOT EXISTS        `role`       (`role`),
	ADD INDEX IF NOT EXISTS        `guild_id`   (`guild_id`),
	-- Foreign Keys
	ADD CONSTRAINT `fk_selfroles_guildid` FOREIGN KEY IF NOT EXISTS (`guild_id`) REFERENCES `guilds` (`id`);
