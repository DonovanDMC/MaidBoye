CREATE TABLE `levelroles` (
	`id` CHAR(12) NOT NULL,
	`guild_id` VARCHAR(21) NOT NULL,
	`role` VARCHAR(21) NOT NULL,
	`xp_required` MEDIUMINT NOT NULL DEFAULT 0,
	PRIMARY KEY (`id`),
	UNIQUE KEY `id` (`id`),
	UNIQUE KEY `guild_role` (`guild_id`, `role`),
	KEY `guild_id` (`guild_id`),
	KEY `role` (`role`),
	KEY `xp_required` (`xp_required`)
);
