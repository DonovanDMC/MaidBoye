CREATE TABLE `guilds` (
	`id`                                VARCHAR(21)  NOT NULL,
	`modlog_enabled`                    TINYINT(1)   NOT NULL DEFAULT 0,
	`modlog_case_editing_enabled`       TINYINT(1)   NOT NULL DEFAULT 1,
	`modlog_case_deleting_enabled`      TINYINT(1)   NOT NULL DEFAULT 0,
	`modlog_edit_others_cases_enabled`  TINYINT(1)   NOT NULL DEFAULT 0,
	`modlog_webhook_id`                 VARCHAR(21)  DEFAULT NULL,
	`modlog_webhook_token`              TINYTEXT     DEFAULT NULL,
	`modlog_webhook_channel_id`         VARCHAR(21)  DEFAULT NULL,
	`settings_default_yiff_type`        TINYTEXT     NOT NULL DEFAULT 'gay',
	`settings_yiff_thumbnail_type`      TINYTEXT     NOT NULL DEFAULT 'image',
	`settings_mute_role`                VARCHAR(21)  DEFAULT NULL,
	`settings_command_images`           TINYINT(1)   NOT NULL DEFAULT 0,
	`settings_snipe_disabled`           TINYINT(1)   NOT NULL DEFAULT 0,
	`settings_delete_mod_commands`      TINYINT(1)   NOT NULL DEFAULT 0,
	`settings_announce_level_up`        TINYINT(1)   NOT NULL DEFAULT 0,
	PRIMARY KEY                                      (`id`),
	UNIQUE KEY                          `id`         (`id`)
);
