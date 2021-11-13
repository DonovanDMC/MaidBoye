CREATE TABLE `blacklist` (
	`id`              CHAR(12)       NOT NULL,
	`guild_id`        VARCHAR(21)    DEFAULT NULL,
	`user_id`         VARCHAR(21)    DEFAULT NULL,
	`type`            TINYINT(1)     NOT NULL,
	`reason`          TINYTEXT       DEFAULT NULL,
	`notice_shown`    TINYINT(1)     NOT NULL DEFAULT 0,
	`expire_time`     BIGINT(20)     NOT NULL DEFAULT 0,
	`created_by`      VARCHAR(21)    NOT NULL,
	`created_by_tag`  TINYTEXT       NOT NULL,
	`created_at`      BIGINT(20)     NOT NULL,
	`report`          TINYTEXT       DEFAULT NULL,
	PRIMARY KEY                      (`id`)
);
