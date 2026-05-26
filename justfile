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