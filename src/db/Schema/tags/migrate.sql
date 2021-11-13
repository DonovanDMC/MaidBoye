ALTER TABLE `tags`
	ADD COLUMN IF NOT EXISTS `id`           CHAR(12)     NOT NULL,
	ADD COLUMN IF NOT EXISTS `guild_id`     VARCHAR(21)  NOT NULL,
	ADD COLUMN IF NOT EXISTS `name`         TINYTEXT     NOT NULL,
	ADD COLUMN IF NOT EXISTS `content`      MEDIUMTEXT   NOT NULL,
	ADD COLUMN IF NOT EXISTS `created_at`   BIGINT(20)   UNSIGNED NOT NULL,
	ADD COLUMN IF NOT EXISTS `created_by`   VARCHAR(21)  NOT NULL,
	ADD COLUMN IF NOT EXISTS `modified_at`  BIGINT(20)   UNSIGNED DEFAULT NULL,
	ADD COLUMN IF NOT EXISTS `modified_by`  VARCHAR(21)  DEFAULT NULL,
	-- Indexes
	ADD UNIQUE INDEX IF NOT EXISTS `id`        (`id`),
	ADD UNIQUE INDEX IF NOT EXISTS `tag_guild` (`name`, `guild_id`) USING HASH,
	ADD INDEX IF NOT EXISTS        `name`      (`name`),
	ADD INDEX IF NOT EXISTS        `guild_id`  (`guild_id`),
	-- Foreign Keys
	ADD CONSTRAINT `fk_tags_guildid` FOREIGN KEY IF NOT EXISTS (`guild_id`) REFERENCES `guilds` (`id`);
