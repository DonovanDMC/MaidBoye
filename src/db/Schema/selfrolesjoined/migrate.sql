ALTER TABLE `selfrolesjoined`
	ADD COLUMN IF NOT EXISTS `id`        CHAR(12)     NOT NULL,
	ADD COLUMN IF NOT EXISTS `guild_id`  VARCHAR(21)  NOT NULL,
	ADD COLUMN IF NOT EXISTS `user_id`   VARCHAR(21)  NOT NULL,
	ADD COLUMN IF NOT EXISTS `role`      VARCHAR(21)  NOT NULL,
	-- Indexes
	ADD UNIQUE INDEX IF NOT EXISTS `id`         (`id`),
	ADD UNIQUE INDEX IF NOT EXISTS `role_guild` (`role`, `guild_id`),
	ADD INDEX IF NOT EXISTS        `role`       (`role`),
	ADD INDEX IF NOT EXISTS        `guild_id`   (`guild_id`),
	ADD INDEX IF NOT EXISTS        `user_id`    (`user_id`),
	-- Foreign Keys
	ADD CONSTRAINT `fk_selfrolesjoined_guildid` FOREIGN KEY IF NOT EXISTS (`guild_id`) REFERENCES `guilds` (`id`),
	ADD CONSTRAINT `fk_selfrolesjoined_userid`  FOREIGN KEY IF NOT EXISTS (`user_id`)  REFERENCES `users`  (`id`);
