CREATE TABLE public.users (
    id                 BIGINT          PRIMARY KEY,
    created_at         TIMESTAMPTZ(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    updated_at         TIMESTAMPTZ(3)  NULL,
    preferences        BIGINT          NOT NULL DEFAULT 0,
    marriage_partners  TEXT[]          NOT NULL DEFAULT '{}',
    levels             JSONB           NOT NULL DEFAULT '{}'
);
