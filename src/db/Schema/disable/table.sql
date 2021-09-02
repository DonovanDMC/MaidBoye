CREATE TABLE `disable` (
	`id`            CHAR(12)            NOT NULL,
	`guild_id`      VARCHAR(21)         DEFAULT NULL,
	`type`          BIT(2)              NOT NULL,
	`filter_value`  TINYTEXT            DEFAULT NULL,
	`value`         VARCHAR(21)         DEFAULT NULL,
	`filter_type`   BIT(2)              NOT NULL,
	PRIMARY KEY                         (`id`),
	UNIQUE KEY      `id`                (`id`),
	KEY             `guild_id`          (`guild_id`),
	UNIQUE KEY      `exact_entry_type`  (`type`, `filter_type`, `value`, `filter_value`)
);
