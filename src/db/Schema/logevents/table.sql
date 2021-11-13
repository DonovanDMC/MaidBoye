CREATE TABLE `logevents` (
	`id`                  CHAR(12)               NOT NULL,
	`guild_id`            VARCHAR(21)            NOT NULL,
	`event`               VARCHAR(20)            NOT NULL,
	`webhook_id`          VARCHAR(21)            NOT NULL,
	`webhook_token`       TINYTEXT               NOT NULL,
	`webhook_channel_id`  VARCHAR(21)            NOT NULL,
	PRIMARY KEY                                  (`id`)
);
