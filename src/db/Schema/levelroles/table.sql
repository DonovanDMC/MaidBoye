CREATE TABLE `levelroles` (
	`id`           CHAR(12)       NOT NULL,
	`guild_id`     VARCHAR(21)    NOT NULL,
	`role`         VARCHAR(21)    NOT NULL,
	`xp_required`  MEDIUMINT      NOT NULL DEFAULT 0,
	PRIMARY KEY                   (`id`)
);
