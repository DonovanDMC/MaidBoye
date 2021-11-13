CREATE TABLE `prefix` (
	`id`         CHAR(12)       NOT NULL,
	`guild_id`   VARCHAR(21)    NOT NULL,
	`value`      VARCHAR(25)    NOT NULL,
	`space`      TINYINT(1)     NOT NULL DEFAULT 0,
	PRIMARY KEY                 (`id`)
);
