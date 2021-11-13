ALTER TABLE `guilds`
	ADD COLUMN IF NOT EXISTS `id`                                VARCHAR(21)  NOT NULL,
	ADD COLUMN IF NOT EXISTS `modlog_enabled`                    TINYINT(1)   NOT NULL DEFAULT 0,
	ADD COLUMN IF NOT EXISTS `modlog_case_editing_enabled`       TINYINT(1)   NOT NULL DEFAULT 1,
	ADD COLUMN IF NOT EXISTS `modlog_case_deleting_enabled`      TINYINT(1)   NOT NULL DEFAULT 0,
	ADD COLUMN IF NOT EXISTS `modlog_edit_others_cases_enabled`  TINYINT(1)   NOT NULL DEFAULT 0,
	ADD COLUMN IF NOT EXISTS `modlog_webhook_id`                 VARCHAR(21)  DEFAULT NULL,
	ADD COLUMN IF NOT EXISTS `modlog_webhook_token`              TINYTEXT     DEFAULT NULL,
	ADD COLUMN IF NOT EXISTS `modlog_webhook_channel_id`         VARCHAR(21)  DEFAULT NULL,
	ADD COLUMN IF NOT EXISTS `settings_default_yiff_type`        TINYTEXT     NOT NULL DEFAULT 'gay',
	ADD COLUMN IF NOT EXISTS `settings_yiff_thumbnail_type`      TINYTEXT     NOT NULL DEFAULT 'image',
	ADD COLUMN IF NOT EXISTS `settings_mute_role`                VARCHAR(21)  DEFAULT NULL,
	ADD COLUMN IF NOT EXISTS `settings_command_images`           TINYINT(1)   NOT NULL DEFAULT 0,
	ADD COLUMN IF NOT EXISTS `settings_snipe_disabled`           TINYINT(1)   NOT NULL DEFAULT 0,
	ADD COLUMN IF NOT EXISTS `settings_delete_mod_commands`      TINYINT(1)   NOT NULL DEFAULT 0,
	ADD COLUMN IF NOT EXISTS `settings_announce_level_up`        TINYINT(1)   NOT NULL DEFAULT 0,
	ADD COLUMN IF NOT EXISTS `settings_auto_sourcing`            TINYINT(1)   NOT NULL DEFAULT 0,
	-- Indexes
	ADD UNIQUE INDEX IF NOT EXISTS `id` (`id`);
