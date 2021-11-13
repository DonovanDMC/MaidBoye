ALTER TABLE `blacklist`
	ADD COLUMN IF NOT EXISTS `id`              CHAR(12)     NOT NULL,
	ADD COLUMN IF NOT EXISTS `guild_id`        VARCHAR(21)  DEFAULT NULL,
	ADD COLUMN IF NOT EXISTS `user_id`         VARCHAR(21)  DEFAULT NULL,
	ADD COLUMN IF NOT EXISTS `type`            TINYINT(1)   NOT NULL,
	ADD COLUMN IF NOT EXISTS `reason`          TINYTEXT     DEFAULT NULL,
	ADD COLUMN IF NOT EXISTS `notice_shown`    TINYINT(1)   NOT NULL DEFAULT 0,
	ADD COLUMN IF NOT EXISTS `expire_time`     BIGINT(20)   NOT NULL DEFAULT 0,
	ADD COLUMN IF NOT EXISTS `created_by`      VARCHAR(21)  NOT NULL,
	ADD COLUMN IF NOT EXISTS `created_by_tag`  TINYTEXT     NOT NULL,
	ADD COLUMN IF NOT EXISTS `created_at`      BIGINT(20)   NOT NULL,
	ADD COLUMN IF NOT EXISTS `report`          TINYTEXT     DEFAULT NULL,
	-- Indexes
	ADD UNIQUE INDEX IF NOT EXISTS `id`          (`id`),
	ADD INDEX IF NOT EXISTS        `guild_id`    (`guild_id`),
	ADD INDEX IF NOT EXISTS        `user_id`     (`user_id`),
	ADD INDEX IF NOT EXISTS        `created_by`  (`created_by`),
	ADD INDEX IF NOT EXISTS        `expire_time` (`expire_time`),
	-- Foreign Keys
	ADD CONSTRAINT `fk_blacklist_guildid` FOREIGN KEY IF NOT EXISTS (`guild_id`) REFERENCES `guilds` (`id`),
	ADD CONSTRAINT `fk_blacklist_userid`  FOREIGN KEY IF NOT EXISTS (`user_id`)  REFERENCES `users`  (`id`);
