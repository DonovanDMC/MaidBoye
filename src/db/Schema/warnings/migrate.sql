ALTER TABLE `warnings`
	CREATE COLUMN IF NOT EXISTS `id`          CHAR(12)     NOT NULL,
	CREATE COLUMN IF NOT EXISTS `guild_id`    VARCHAR(21)  NOT NULL,
	CREATE COLUMN IF NOT EXISTS `user_id`     VARCHAR(21)  NOT NULL,
	CREATE COLUMN IF NOT EXISTS `blame_id`    VARCHAR(21)  NOT NULL,
	CREATE COLUMN IF NOT EXISTS `warning_id`  TINYINT(3)   UNSIGNED NOT NULL,
	CREATE COLUMN IF NOT EXISTS `created_at`  BIGINT(20)   NOT NULL,
	CREATE COLUMN IF NOT EXISTS `reason`      TINYTEXT     DEFAULT NULL,
	-- Indexes
	ADD UNIQUE INDEX IF NOT EXISTS `id`             (`id`),
	ADD UNIQUE INDEX IF NOT EXISTS `guild_user_wid` (`guild_id`, `user_id`, `warning_id`),
	ADD UNIQUE INDEX IF NOT EXISTS `guild_id`       (`guild_id`),
	ADD UNIQUE INDEX IF NOT EXISTS `user_id`        (`user_id`),
	ADD UNIQUE INDEX IF NOT EXISTS `blame_id`       (`blame_id`),
	ADD UNIQUE INDEX IF NOT EXISTS `warning_id`     (`warning_id`),
	-- Foreign Keys
	ADD CONSTRAINT `fk_warnings_guildid` FOREIGN KEY IF NOT EXISTS (`guild_id`) REFERENCES `guilds` (`id`),
	ADD CONSTRAINT `fk_warnings_userid`  FOREIGN KEY IF NOT EXISTS (`user_id`)  REFERENCES `users`  (`id`),
	ADD CONSTRAINT `fk_warnings_blameid` FOREIGN KEY IF NOT EXISTS (`blame_id`) REFERENCES `users`  (`id`);
