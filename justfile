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

# Run the docs site in dev mode (Next.js + Turbopack).
docs-dev:
    bun --filter '@pulse/docs' dev

# Build the docs site as a static export to apps/docs/out/.
docs-build:
    bun --filter '@pulse/docs' build

# Lint and format-check the workspace via Ultracite (Biome preset).
lint:
    bunx ultracite check

# Apply Ultracite (Biome) fixes across the workspace.
format:
    bunx ultracite fix