CREATE TABLE `warnings` (
	`id`          CHAR(12)          NOT NULL,
	`guild_id`    VARCHAR(21)       NOT NULL,
	`user_id`     VARCHAR(21)       NOT NULL,
	`blame_id`    VARCHAR(21)       NOT NULL,
	`warning_id`  TINYINT(3)        UNSIGNED NOT NULL,
	`created_at`  BIGINT(20)        NOT NULL,
	`reason`      TINYTEXT          DEFAULT NULL,
	PRIMARY KEY                     (`id`)
);
