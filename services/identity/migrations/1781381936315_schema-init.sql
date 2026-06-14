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

-- The "one active stream per channel" invariant, enforced by the DATABASE, not
-- the app. A partial unique index: rows with ended_at IS NULL (live streams)
-- must have a unique channel_id; ended streams are excluded, so a channel can
-- have unlimited history but at most one open stream. Two concurrent go-lives
-- race here -> one wins, the other gets 23505, which routes.ts turns into 409.
CREATE UNIQUE INDEX one_active_stream_per_channel
    ON streams (channel_id)
    WHERE ended_at IS NULL;

-- The transactional outbox. A staging table for events headed to Kafka, written
-- in the same transaction as the business change (see docs/outbox.md). Columns:
--   payload bytea  -- Avro + Confluent wire bytes; binary, so bytea not text
--   topic          -- destination Kafka topic, copied from @pulse/schemas/topics
--   partition_key  -- Kafka ordering key (channelId), distinct from aggregate_id
--   published_at   -- NULL until the relay produces it; the claim/done flag
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

-- Hot path for the relay: it polls "WHERE published_at IS NULL ORDER BY id"
-- every 500ms. A partial index on just the unpublished rows stays tiny (the
-- backlog, not the full history) so each poll is an index scan, not a seq scan
-- over every event ever emitted.
CREATE INDEX outbox_unpublished
    ON outbox (id)
    WHERE published_at IS NULL;

-- Down Migration

DROP TABLE outbox;
DROP TABLE streams;
DROP TABLE channels;
DROP TABLE accounts;