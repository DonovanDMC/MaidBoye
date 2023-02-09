ALTER TABLE public.guilds
    ADD COLUMN "welcome_message" TEXT NOT NULL DEFAULT 'Welcome {{user}} to {{guild}}!',
    -- 1: disable user mentions
    -- 2: disable role mentions
    -- 4: disable everyone/here mentions
    -- 16: wait for pending=false
    ADD COLUMN "welcome_modifiers" INT NOT NULL DEFAULT 23,
    ADD COLUMN "welcome_webhook_channel_id" BIGINT,
    ADD COLUMN "welcome_webhook_id" BIGINT,
    ADD COLUMN "welcome_webhook_token" TEXT;
