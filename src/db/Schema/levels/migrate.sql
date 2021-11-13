ALTER TABLE `levels`
	ADD COLUMN IF NOT EXISTS `id`        CHAR(12)     NOT NULL,
	ADD COLUMN IF NOT EXISTS `guild_id`  VARCHAR(21)  NOT NULL,
	ADD COLUMN IF NOT EXISTS `user_id`   VARCHAR(21)  NOT NULL,
	ADD COLUMN IF NOT EXISTS `xp`        MEDIUMINT    NOT NULL DEFAULT 0,
	-- Indexes
	ADD UNIQUE INDEX IF NOT EXISTS `id`          (`id`),
	ADD UNIQUE INDEX IF NOT EXISTS `guild_user`  (`guild_id`, `user_id`),
	ADD INDEX IF NOT EXISTS        `guild_id`    (`guild_id`),
	ADD INDEX IF NOT EXISTS        `user_id`     (`user_id`),
	ADD INDEX IF NOT EXISTS        `xp`          (`xp`),
	-- Foreign Keys
	ADD CONSTRAINT `fk_levels_guildid` FOREIGN KEY IF NOT EXISTS (`guild_id`) REFERENCES `guilds` (`id`),
	ADD CONSTRAINT `fk_levels_userid`  FOREIGN KEY IF NOT EXISTS (`user_id`)  REFERENCES `users`  (`id`);
