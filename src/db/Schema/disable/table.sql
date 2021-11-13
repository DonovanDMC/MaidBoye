CREATE TABLE `disable` (
	`id`            CHAR(12)            NOT NULL,
	`guild_id`      VARCHAR(21)         DEFAULT NULL,
	`type`          BIT(2)              NOT NULL,
	`filter_value`  TINYTEXT            DEFAULT NULL,
	`value`         VARCHAR(21)         DEFAULT NULL,
	`filter_type`   BIT(2)              NOT NULL,
	PRIMARY KEY                         (`id`)
	
);
