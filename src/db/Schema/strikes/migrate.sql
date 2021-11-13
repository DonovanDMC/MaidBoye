ALTER TABLE `strikes`
	ADD COLUMN IF NOT EXISTS `id`          CHAR(12)     NOT NULL,
	ADD COLUMN IF NOT EXISTS `group_id`    CHAR(12)     NOT NULL,
	ADD COLUMN IF NOT EXISTS `guild_id`    VARCHAR(21)  NOT NULL,
	ADD COLUMN IF NOT EXISTS `user_id`     VARCHAR(21)  NOT NULL,
	ADD COLUMN IF NOT EXISTS `created_by`  VARCHAR(21)  NOT NULL,
	ADD COLUMN IF NOT EXISTS `created_at`  BIGINT(20)   UNSIGNED NOT NULL,
	-- Indexes
	ADD UNIQUE INDEX IF NOT EXISTS `id`         (`id`),
	ADD INDEX IF NOT EXISTS        `guild_id`   (`guild_id`),
	ADD INDEX IF NOT EXISTS        `user_id`    (`user_id`),
	ADD INDEX IF NOT EXISTS        `created_by` (`created_by`),
	ADD INDEX IF NOT EXISTS        `group_id`   (`group_id`),
	-- Foreign Keys
	ADD CONSTRAINT `fk_strikes_guildid`   FOREIGN KEY IF NOT EXISTS (`guild_id`)   REFERENCES `guilds` (`id`),
	ADD CONSTRAINT `fk_strikes_userid`    FOREIGN KEY IF NOT EXISTS (`user_id`)    REFERENCES `users`  (`id`),
	ADD CONSTRAINT `fk_strikes_createdby` FOREIGN KEY IF NOT EXISTS (`created_by`) REFERENCES `users`  (`id`);
