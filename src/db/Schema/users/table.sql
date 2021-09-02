CREATE TABLE `users` (
	`id`                    VARCHAR(21)           NOT NULL,
	`self_roles_joined`     MEDIUMTEXT            NOT NULL DEFAULT '[]',
	`premium_kofi_email`    TINYTEXT              DEFAULT NULL,
	`premium_months`        TINYINT(3)            UNSIGNED NOT NULL DEFAULT 0,
	`premium_subscription`  TINYINT(1)            NOT NULL DEFAULT 0,
	`premium_total_amount`  SMALLINT(5)           UNSIGNED NOT NULL DEFAULT 0,
	`marriage`              VARCHAR(21)           DEFAULT NULL,
	PRIMARY KEY                                   (`id`),
	UNIQUE KEY              `id`                  (`id`),
	KEY                     `premium_kofi_email`  (`premium_kofi_email`),
	KEY                     `marriage`            (`marriage`)
);
