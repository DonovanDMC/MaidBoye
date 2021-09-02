CREATE TABLE `selfrolesjoined` (
	`id`         CHAR(12)      NOT NULL,
	`guild_id`   VARCHAR(21)   NOT NULL,
	`user_id`    VARCHAR(21)   NOT NULL,
	`role`       VARCHAR(21)   NOT NULL,
	PRIMARY KEY                (`id`),
	UNIQUE KEY   `id`          (`id`),
	UNIQUE KEY   `role_guild`  (`role`, `guild_id`),
	KEY          `role`        (`role`),
	KEY          `guild_id`    (`guild_id`),
	KEY          `user_id`     (`user_id`)
);
