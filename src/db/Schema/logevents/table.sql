CREATE TABLE `logevents` (
	`id` CHAR(12) NOT NULL,
	`guild_id` VARCHAR(21) NOT NULL,
	`event` VARCHAR(20) NOT NULL,
	`channel` VARCHAR(21) NOT NULL,
	PRIMARY KEY (`id`),
	UNIQUE KEY `id` (`id`),
	UNIQUE KEY `guild_event_channel` (`guild_id`,`event`,`channel`),
	KEY `guild_id` (`guild_id`),
	KEY `event` (`event`),
	KEY `channel` (`channel`)
);
