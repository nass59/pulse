# Pulse — root command runner.
#
# See ADR-0005 for the "why this not Turborepo" reasoning.
# Run `just --list` for the table of contents.
#
# Recipe naming convention (load-bearing — keep it consistent as recipes are added):
#   <service>-<verb>    e.g. identity-dev, chat-test, analytics-build
#   infra-<verb>        e.g. infra-up, infra-down, infra-logs
#   <verb>-all          e.g. test-all, build-all
#   <generator>         e.g. codegen-schemas

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

# Apply identity's DB migrations (schema + seeded alice/bob channels). Needs `infra-up` and a services/identity/.env.
identity-migrate:
    bun --cwd services/identity migrate up

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

# Run the docs site in dev mode (Next.js + Turbopack).
docs-dev:
    bun --cwd apps/docs dev

# Build the docs site as a static export to apps/docs/out/.
docs-build:
    bun --cwd apps/docs build

# Run Storybook (interactive components in isolation) on localhost:6006.
docs-storybook:
    bun --cwd apps/docs storybook

# Lint and format-check the workspace via Ultracite (Biome preset).
lint:
    bunx ultracite check

# Apply Ultracite (Biome) fixes across the workspace.
format:
    bunx ultracite fix