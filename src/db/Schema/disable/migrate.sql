ALTER TABLE `disable`
	CREATE COLUMN IF NOT EXISTS `id`            CHAR(12)     NOT NULL,
	CREATE COLUMN IF NOT EXISTS `guild_id`      VARCHAR(21)  DEFAULT NULL,
	CREATE COLUMN IF NOT EXISTS `type`          BIT(2)       NOT NULL,
	CREATE COLUMN IF NOT EXISTS `filter_value`  TINYTEXT     DEFAULT NULL,
	CREATE COLUMN IF NOT EXISTS `value`         VARCHAR(21)  DEFAULT NULL,
	CREATE COLUMN IF NOT EXISTS `filter_type`   BIT(2)       NOT NULL,
	-- Indexes
	ADD UNIQUE INDEX IF NOT EXISTS `id`               (`id`),
	ADD UNIQUE INDEX IF NOT EXISTS `exact_entry_type` (`type`, `filter_type`, `value`, `filter_value`),
	ADD INDEX IF NOT EXISTS        `guild_id`         (`guild_id`),
	-- Foreign Keys
	ADD CONSTRAINT `fk_disable_guildid` FOREIGN KEY IF NOT EXISTS (`guild_id`) REFERENCES `guilds` (`id`);
