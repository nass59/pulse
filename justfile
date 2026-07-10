# Pulse — root command runner.
#
# See ADR-0005 for the "why this not Turborepo" reasoning.
# Run `just --list` for the table of contents.
#
# Recipe naming convention (load-bearing — keep it consistent as recipes are added):
#   <service>-<verb>  e.g. identity-dev, chat-test, analytics-build
#   infra-<verb>      e.g. infra-up, infra-down, infra-logs
#   <verb>-all        e.g. test-all, build-all
#   <generator>       e.g. codegen-schemas
#
# Don't echo each recipe's command line before running it — the underlying tool
# (bun prints `$ <cmd>`, docker prints its own) already shows what ran, so just's
# echo is pure duplication. `just --list` stays the table of contents.

set quiet := true

# Show the list of recipes. Default when running `just` with no args.
default:
	@just --list

# Bring the local infra stack up (Kafka, Apicurio, Postgres, Redis).
infra-up:
	docker compose -f infra/docker-compose.yaml up -d

# Bring the whole local environment up and ready in one shot: start infra and wait on
# healthchecks, then (the `&&` post-deps) migrate + seed Postgres, publish schemas,
# provision Kafka topics. Idempotent — migrate's ledger, byte-identical schema
# registration, and topic-exists checks are all no-ops — so it's safe on a fresh clone
# or an already-running stack.
# One-shot "get me to a working state" — infra + migrate + schemas + topics. Run after `infra-down`/a clone.
up-all: && identity-migrate schemas-publish infra-topics
	docker compose -f infra/docker-compose.yaml up -d --wait

# Take the local infra stack down. Keeps the Postgres volume (add `-v` to wipe).
infra-down:
	docker compose -f infra/docker-compose.yaml down

# Show status of the local infra stack.
infra-ps:
	docker compose -f infra/docker-compose.yaml ps

# Tail logs from the local infra stack. Pass a service name to scope: `just infra-logs kafka`.
infra-logs service="":
	docker compose -f infra/docker-compose.yaml logs -f {{service}}

# Generate TypeScript types from the Avro schemas into packages/schemas/generated/.
codegen-schemas:
	bun --cwd packages/schemas codegen

# Publish every .avsc to the local Apicurio registry (needs `infra-up` first).
schemas-publish:
	bun --cwd packages/schemas publish-schemas

# Idempotent. Run after `infra-up`, before `identity-dev` — auto-create is off, so a
# missing topic fails loudly instead of being born at the 1-partition broker default.
# Provision every Kafka topic at its contracted partition count + retention (ADR-0012).
infra-topics:
	bun --cwd packages/schemas provision-topics

# Apply identity's DB migrations (schema + seeded alice/bob channels). Needs `infra-up` and a services/identity/.env.
identity-migrate:
	bun --cwd services/identity migrate up

# Reset Postgres to a clean, freshly-migrated state, then re-run migrations + seed
# (the `&&` post-dependency). Drops the `public` schema — tables AND node-pg-migrate's
# ledger — so it's the cure for migration-ledger drift ("relation already exists").
# Destructive but dev-only; wipes Postgres only, leaves Kafka topics untouched. Needs `infra-up`.
db-reset: && identity-migrate
	docker compose -f infra/docker-compose.yaml exec -T postgres psql -U postgres -d pulse -c "DROP SCHEMA public CASCADE; CREATE SCHEMA public;"

# Nuke ALL local state and rebuild from scratch: `down -v` wipes the named volumes
# (Postgres + Kafka) and recreates Apicurio's in-memory store, then `up-all` brings
# everything back and re-bootstraps it. Clears every place stale state can hide at
# once: registry subjects, Kafka topic data, AND the Postgres outbox (which stores
# *pre-encoded* event bytes — purging Kafka alone leaves an undelivered old-schema
# row that the relay resurrects on boot).
# The full nuke — registry + topics + Postgres/outbox + analytics local state. Destructive, dev-only; stop `identity-dev` first.
reset-all: && up-all analytics-reset
	docker compose -f infra/docker-compose.yaml down -v

# Wipe analytics' local Kafka Streams state — the embedded RocksDB store + checkpoint
# under build/kafka-streams (host fs, so `down -v` can't reach it). Rebuildable by
# replay, so safe whenever the app is stopped: this is the deliberate cure for a stale
# local checkpoint pointing at changelog offsets a cluster wipe deleted. NOT done on
# every boot — issue 04's restart-recovery relies on this state SURVIVING normal restarts.
analytics-reset:
	rm -rf services/analytics/build/kafka-streams

# Run the identity service in watch mode: HTTP on :3100 + the outbox relay polling.
identity-dev:
	bun --cwd services/identity dev

# Stage one StreamStarted into the outbox so the relay drains it to Kafka. Run while `identity-dev` is up.
identity-stage-event:
	bun --cwd services/identity stage-event

# Decode-and-print events on a topic (the eyeball end of the smoke test). Defaults to stream.started.v1.
identity-consume topic="stream.started.v1":
	bun --cwd services/identity consume {{topic}}

# POST go-live for a channel slug (default seeded `alices-channel`). Prints body + status: 200 / 404 / 409-already-live.
identity-go-live slug="alices-channel":
	curl -s -X POST localhost:3100/channels/{{slug}}/go-live -w '\n%{http_code}\n'

# POST end-stream for a channel slug (default `alices-channel`). Prints body + status: 200 / 404 / 409-not-live.
identity-end-stream slug="alices-channel":
	curl -s -X POST localhost:3100/channels/{{slug}}/end-stream -w '\n%{http_code}\n'

# Run the chat WebSocket gateway: HTTP/WS on :8081. Needs infra + a live channel (`identity-go-live`).
chat-dev:
	cd services/chat && go run .

# Run the analytics Kafka Streams topology + Ktor query API on :8082. Needs infra + presence events.
analytics-dev:
	cd services/analytics && ./gradlew run

# Run the docs site in dev mode (Next.js + Turbopack) on :3002 — 3000 is reserved for apps/web (ADR-0023).
docs-dev:
	bun --cwd apps/docs dev

# Build the docs site as a static export to apps/docs/out/.
docs-build:
	bun --cwd apps/docs build

# Run the web site in dev mode (Next.js + Turbopack) on :3000.
web-dev:
	bun --cwd apps/web dev

# Run Storybook (interactive components in isolation) on localhost:6006.
docs-storybook:
	bun --cwd apps/docs storybook

# Lint and format-check the workspace via Ultracite (Biome preset).
lint:
	bunx ultracite check

# Apply Ultracite (Biome) fixes across the workspace.
format:
	bunx ultracite fix
