CREATE TABLE `selfrolesjoined` (
	`id`         CHAR(12)      NOT NULL,
	`guild_id`   VARCHAR(21)   NOT NULL,
	`user_id`    VARCHAR(21)   NOT NULL,
	`role`       VARCHAR(21)   NOT NULL,
	PRIMARY KEY                (`id`)
);
