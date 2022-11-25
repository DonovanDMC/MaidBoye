CREATE TABLE public.autoposting (
    id             UUID            PRIMARY KEY,
    created_at     TIMESTAMPTZ(3)  NOT NULL      DEFAULT CURRENT_TIMESTAMP(3),
    updated_at     TIMESTAMPTZ(3)  NULL,
	guild_id       BIGINT          NOT NULL      REFERENCES public.guilds (id),
    time           INT             NOT NULL,
	type           INT             NOT NULL,
	webhook_id     BIGINT          NOT NULL,
	webhook_token  TEXT            NOT NULL,
	channel_id     BIGINT          NOT NULL
);

CREATE INDEX ON public.autoposting (guild_id, type);
