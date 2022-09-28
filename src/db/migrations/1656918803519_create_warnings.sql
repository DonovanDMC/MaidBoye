CREATE TABLE public.warnings (
    id          UUID            PRIMARY KEY,
    created_at  TIMESTAMPTZ(3)  NOT NULL      DEFAULT CURRENT_TIMESTAMP(3),
    updated_at  TIMESTAMPTZ(3)  NULL,
	guild_id    BIGINT          NOT NULL      REFERENCES public.guilds (id),
	user_id     BIGINT          NOT NULL      REFERENCES public.users (id),
	blame_id    BIGINT          NOT NULL      REFERENCES public.users (id),
	warning_id  INT             NOT NULL,
	reason      TEXT            NOT NULL
);

CREATE UNIQUE INDEX ON public.warnings (guild_id, user_id, warning_id);
CREATE INDEX ON public.warnings (guild_id);
CREATE INDEX ON public.warnings (user_id);
CREATE INDEX ON public.warnings (blame_id);
CREATE INDEX ON public.warnings (warning_id);
