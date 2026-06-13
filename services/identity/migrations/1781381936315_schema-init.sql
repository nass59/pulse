-- Up Migration
CREATE TABLE accounts (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    handle text UNIQUE NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE channels (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    account_id uuid NOT NULL REFERENCES accounts (id),
    slug text UNIQUE NOT NULL,
    title text NOT NULL,
    is_live boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE streams (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    channel_id uuid NOT NULL REFERENCES channels (id),
    title text NOT NULL,
    started_at timestamptz NOT NULL DEFAULT now(),
    ended_at timestamptz
);

CREATE UNIQUE INDEX one_active_stream_per_channel
    ON streams (channel_id)
    WHERE ended_at IS NULL;

CREATE TABLE outbox (
    id bigserial PRIMARY KEY,
    aggregate_type text NOT NULL,
    aggregate_id text NOT NULL,
    event_type text NOT NULL,
    payload bytea NOT NULL,
    topic text NOT NULL,
    partition_key text NOT NULL,
    created_at timestamptz NOT NULL DEFAULT now(),
    published_at timestamptz
);

CREATE INDEX outbox_unpublished
    ON outbox (id)
    WHERE published_at IS NULL;

-- Down Migration

DROP TABLE outbox;
DROP TABLE streams;
DROP TABLE channels;
DROP TABLE accounts;