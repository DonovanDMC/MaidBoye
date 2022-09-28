CREATE TABLE public.stats (
    id                             UUID            PRIMARY KEY  DEFAULT gen_random_uuid(),
    created_at                     TIMESTAMPTZ(3)  NOT NULL     DEFAULT CURRENT_TIMESTAMP(3),
    updated_at                     TIMESTAMPTZ(3)  NULL,
    session_id                     UUID            NOT NULL,
	type                           INT             NOT NULL     DEFAULT 0,
    tags                           TEXT[]          NOT NULL     DEFAULT '{}',
    payload                        INT             NULL,
    event                          TEXT            NULL,
    status_code                    INT             NULL,
    status_message                 TEXT            NULL,
    restriction                    TEXT            NULL,
    interaction_type               INT             NULL,
    interaction_type_name          TEXT            NULL,
    application_command_type       INT             NULL,
    application_command_type_name  TEXT            NULL,
    shard_id                       INT             NULL,
    close_code                     INT             NULL,
    sauce_simularity               INT             NULL,
    sauce_method                   TEXT            NULL,
    sauce_attempted                TEXT[]          NULL
);

CREATE INDEX ON public.stats (session_id);
CREATE INDEX ON public.stats (type);
CREATE INDEX ON public.stats (event);
