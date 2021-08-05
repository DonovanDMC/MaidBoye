CREATE TABLE `selfroles` (
	`id` CHAR(12) NOT NULL,
	`guild_id` VARCHAR(21) NOT NULL,
	`role` VARCHAR(21) NOT NULL,
	`added_at` BIGINT(20) UNSIGNED NOT NULL,
	`added_by` VARCHAR(21) NOT NULL,
	PRIMARY KEY (`id`),
	UNIQUE KEY `id` (`id`),
	UNIQUE KEY `role_guild` (`role`,`guild_id`),
	KEY `role` (`role`),
	KEY `guild_id` (`guild_id`)
);
