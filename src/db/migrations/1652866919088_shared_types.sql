CREATE EXTENSION pgcrypto;
CREATE TYPE LEVELING_ROLE AS (
	role  TEXT,
	level INT
);
