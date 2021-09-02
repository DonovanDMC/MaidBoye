CREATE TABLE `warnings` (
	`id`          CHAR(12)          NOT NULL,
	`guild_id`    VARCHAR(21)       NOT NULL,
	`user_id`     VARCHAR(21)       NOT NULL,
	`blame_id`    VARCHAR(21)       NOT NULL,
	`warning_id`  TINYINT(3)        UNSIGNED NOT NULL,
	`created_at`  BIGINT(20)        NOT NULL,
	`reason`      TINYTEXT          DEFAULT NULL,
	PRIMARY KEY                     (`id`),
	UNIQUE KEY    `id`              (`id`),
	UNIQUE KEY    `guild_user_wid`  (`guild_id`, `user_id`, `warning_id`),
	KEY           `guild_id`        (`guild_id`),
	KEY           `user_id`         (`user_id`),
	KEY           `blame_id`        (`blame_id`),
	KEY           `warning_id`      (`warning_id`)
);
