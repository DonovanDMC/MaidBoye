CREATE TABLE `timed` (
	`id` CHAR(12) NOT NULL,
	`type` TINYTEXT NOT NULL,
	`guild_id` VARCHAR(21) NOT NULL,
	`user_id` VARCHAR(21) NOT NULL,
	`time` BIGINT(20) NOT NULL,
	`expiry` BIGINT(20) NOT NULL,
	PRIMARY KEY (`id`),
	UNIQUE KEY `id` (`id`),
	KEY `type` (`type`),
	KEY `guild_id` (`guild_id`),
	KEY `user_id` (`user_id`),
	KEY `expiry` (`expiry`)
);
