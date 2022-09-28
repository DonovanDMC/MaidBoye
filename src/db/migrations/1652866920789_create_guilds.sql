CREATE TABLE public.guilds (
    id                         BIGINT             PRIMARY KEY,
    created_at                 TIMESTAMPTZ(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at                 TIMESTAMPTZ(3)     NULL,
    settings                   BIGINT             NOT NULL DEFAULT 0,
    modlog_webhook_id          BIGINT             NULL,
    modlog_webhook_token       TEXT               NULL,
    modlog_webhook_channel_id  BIGINT             NULL,
    selfroles                  BIGINT[]           NOT NULL DEFAULT '{}',
    leveling_roles             LEVELING_ROLE[]    NOT NULL DEFAULT '{}',
    tags                       JSONB              NOT NULL DEFAULT '{}'
);
