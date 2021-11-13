ALTER TABLE `users`
	CREATE COLUMN IF NOT EXISTS `id`                    VARCHAR(21)  NOT NULL,
	CREATE COLUMN IF NOT EXISTS `self_roles_joined`     MEDIUMTEXT   NOT NULL DEFAULT '[]',
	CREATE COLUMN IF NOT EXISTS `premium_kofi_email`    TINYTEXT     DEFAULT NULL,
	CREATE COLUMN IF NOT EXISTS `premium_months`        TINYINT(3)   UNSIGNED NOT NULL DEFAULT 0,
	CREATE COLUMN IF NOT EXISTS `premium_subscription`  TINYINT(1)   NOT NULL DEFAULT 0,
	CREATE COLUMN IF NOT EXISTS `premium_total`         SMALLINT(5)  UNSIGNED NOT NULL DEFAULT 0,
	CREATE COLUMN IF NOT EXISTS `marriage`              VARCHAR(21)  DEFAULT NULL,
	-- Indexes
	ADD UNIQUE INDEX IF NOT EXISTS `id`          (`id`),
	ADD INDEX IF NOT EXISTS `premium_kofi_email` (`premium_kofi_email`),
	ADD INDEX IF NOT EXISTS `marriage`           (`marriage`),
	-- Foreign Keys
	ADD CONSTRAINT `fk_users_marriage` FOREIGN KEY IF NOT EXISTS (`marriage`) REFERENCES `users` (`id`);
