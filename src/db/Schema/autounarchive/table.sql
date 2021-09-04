CREATE TABLE `autounarchive` (
	`id`         CHAR(12)        NOT NULL,
	`guild_id`   VARCHAR(21)     NOT NULL,
	`thread_id`  VARCHAR(21)     NOT NULL,
	PRIMARY KEY                  (`id`),
	UNIQUE KEY   `id`            (`id`),
	UNIQUE KEY   `guild_thread`  (`guild_id`, `thread_id`),
	KEY          `guild_id`      (`guild_id`),
	KEY          `thread_id`     (`thread_id`)
);
