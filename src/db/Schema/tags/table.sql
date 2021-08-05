CREATE TABLE `tags` (
	`id` CHAR(12) NOT NULL,
	`guild_id` VARCHAR(21) NOT NULL,
	`name` TINYTEXT NOT NULL,
	`content` mediumtext NOT NULL,
	`created_at` BIGINT(20) UNSIGNED NOT NULL,
	`created_by` VARCHAR(21) NOT NULL,
	`modified_at` BIGINT(20) UNSIGNED DEFAULT NULL,
	`modified_by` VARCHAR(21) DEFAULT NULL,
	PRIMARY KEY (`id`),
	UNIQUE KEY `id` (`id`),
	UNIQUE KEY `tag_guild` (`name`,`guild_id`) USING HASH,
	KEY `name` (`name`),
	KEY `guild_id` (`guild_id`)
);
