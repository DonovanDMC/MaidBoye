CREATE TABLE `timed` (
	`id`         CHAR(12)     NOT NULL,
	`type`       TINYTEXT     NOT NULL,
	`guild_id`   VARCHAR(21)  NOT NULL,
	`user_id`    VARCHAR(21)  NOT NULL,
	`time`       BIGINT(20)   NOT NULL,
	`expiry`     BIGINT(20)   NOT NULL,
	PRIMARY KEY               (`id`)
);
