CREATE TABLE public.timed (
    id          UUID            PRIMARY KEY,
    created_at  TIMESTAMPTZ(3)  NOT NULL     DEFAULT CURRENT_TIMESTAMP(3),
    updated_at  TIMESTAMPTZ(3)  NULL,
	type        SMALLINT        NOT NULL,
	guild_id    BIGINT          NOT NULL     REFERENCES public.guilds (id),
	user_id     BIGINT          NOT NULL     REFERENCES public.users (id),
	time        INT             NOT NULL,
	expires_at  TIMESTAMPTZ(3)  NOT NULL,
	renewed_at  TIMESTAMPTZ(3)  NULL
);
