CREATE TABLE public.modlog (
    id                 BIGSERIAL       PRIMARY KEY,
    created_at         TIMESTAMPTZ(3)  NOT NULL     DEFAULT CURRENT_TIMESTAMP(3),
    updated_at         TIMESTAMPTZ(3)  NULL,
	updated_by         BIGINT          NULL,
    case_id            INT             NOT NULL,
	guild_id           BIGINT          NOT NULL     REFERENCES public.guilds (id),
	channel_id         BIGINT          NULL,
	message_id         BIGINT          NULL         UNIQUE,
	strike_id          UUID            NULL         UNIQUE REFERENCES public.strikes (id),
	timed_id           UUID            NULL         REFERENCES public.timed (id) ON DELETE SET NULL,
	warning_id         UUID            NULL         REFERENCES public.warnings (id),
	target_id          BIGINT          NULL,
	blame_id           BIGINT          NOT NULL,
	reason             VARCHAR(500)    NULL,
	type               SMALLINT        NOT NULL,
	-- ban, softban
	delete_seconds     INT             NULL,
	-- clear warnings, delete warning
	amount             INT             NULL,
	deleted            BOOLEAN         NOT NULL     DEFAULT FALSE
);

CREATE UNIQUE INDEX ON public.modlog (case_id, guild_id);
CREATE INDEX ON public.modlog (case_id);
CREATE INDEX ON public.modlog (guild_id);
CREATE INDEX ON public.modlog (target_id);
CREATE INDEX ON public.modlog (blame_id);
CREATE INDEX ON public.modlog (timed_id);
