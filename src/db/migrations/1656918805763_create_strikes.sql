CREATE TABLE public.strikes (
    id          UUID            PRIMARY KEY,
    created_at  TIMESTAMPTZ(3)  NOT NULL      DEFAULT CURRENT_TIMESTAMP(3),
    updated_at  TIMESTAMPTZ(3)  NULL,
	guild_id    BIGINT          NOT NULL      REFERENCES public.guilds (id),
	user_id     BIGINT          NOT NULL      REFERENCES public.users (id),
	blame_id    BIGINT          NULL          REFERENCES public.users (id),
	amount      INT             NOT NULL      DEFAULT 1,
	type        SMALLINT        NOT NULL      DEFAULT 0
);

CREATE INDEX ON public.strikes (guild_id);
CREATE INDEX ON public.strikes (user_id);
