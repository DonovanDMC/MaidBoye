CREATE TABLE `levels` (
	`id`         CHAR(12)      NOT NULL,
	`guild_id`   VARCHAR(21)   NOT NULL,
	`user_id`    VARCHAR(21)   NOT NULL,
	`xp`         MEDIUMINT     NOT NULL DEFAULT 0,
	PRIMARY KEY                (`id`)
);
