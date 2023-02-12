ALTER TABLE public.guilds
    ADD COLUMN "welcome_join_message" TEXT NOT NULL DEFAULT 'Welcome {{user}} to **{{guild}}**!',
    ADD COLUMN "welcome_leave_message" TEXT NOT NULL DEFAULT '{{user}} left **{{guild}}**.',
    -- 1: join enabled
    -- 2: leave enabled
    -- 4: disable user mentions
    -- 8: disable role mentions
    -- 16: disable everyone/here mentions
    -- 64: wait for pending=false
    ADD COLUMN "welcome_modifiers" INT NOT NULL DEFAULT 351,
    ADD COLUMN "welcome_webhook_channel_id" BIGINT,
    ADD COLUMN "welcome_webhook_id" BIGINT,
    ADD COLUMN "welcome_webhook_token" TEXT;
