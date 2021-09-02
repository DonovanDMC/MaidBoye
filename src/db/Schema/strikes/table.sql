CREATE TABLE `strikes` (
	`id`          CHAR(12)      NOT NULL,
	`group_id`    CHAR(12)      NOT NULL,
	`guild_id`    VARCHAR(21)   NOT NULL,
	`user_id`     VARCHAR(21)   NOT NULL,
	`created_by`  VARCHAR(21)   NOT NULL,
	`created_at`  BIGINT(20)    UNSIGNED NOT NULL,
	PRIMARY KEY                 (`id`),
	UNIQUE KEY    `id`          (`id`),
	KEY           `guild_id`    (`guild_id`),
	KEY           `user_id`     (`user_id`),
	KEY           `created_by`  (`created_by`),
	KEY           `group_id`    (`group_id`)
);
