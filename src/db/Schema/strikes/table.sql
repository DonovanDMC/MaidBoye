CREATE TABLE `strikes` (
	`id`          CHAR(12)      NOT NULL,
	`group_id`    CHAR(12)      NOT NULL,
	`guild_id`    VARCHAR(21)   NOT NULL,
	`user_id`     VARCHAR(21)   NOT NULL,
	`created_by`  VARCHAR(21)   NOT NULL,
	`created_at`  BIGINT(20)    UNSIGNED NOT NULL,
	PRIMARY KEY                 (`id`)
);
