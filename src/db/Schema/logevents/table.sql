CREATE TABLE `logevents` (
	`id` CHAR(12) NOT NULL,
	`guild_id` VARCHAR(21) NOT NULL,
	`event` VARCHAR(20) NOT NULL,
	`webhook_id` VARCHAR(21) NOT NULL,
	`webhook_token` TINYTEXT NOT NULL,
	`webhook_channel_id` VARCHAR(21) NOT NULL,
	PRIMARY KEY (`id`),
	UNIQUE KEY `id` (`id`),
	UNIQUE KEY `guild_event_channel` (`guild_id`,`event`,`webhook_channel_id`),
	KEY `guild_id` (`guild_id`),
	KEY `event` (`event`),
	KEY `webhook_channel_id` (`webhook_channel_id`)
);
