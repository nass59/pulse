# the viewer frontend is a separate Next app with a tRPC BFF, not static files on identity

The Phase-1 viewer page lives in its own Bun-workspace app, `apps/web`
(`@pulse/web`), a Next 16 / React 19 project sibling to `apps/docs`. Its data
layer is a **tRPC backend-for-frontend that runs inside `apps/web` itself**: the
React client calls typed tRPC procedures, and those procedures — executing on the
Next server — do plain server-side `fetch`es to `identity` and `analytics` and
shape the result for the page. The chat WebSocket is the one exception: the
browser opens it straight to `chat` (`ws://…:8081/ws/:slug`), since tRPC/HTTP
does not carry the socket. The channel page is a single `'use client'` component;
nothing about it is server-rendered.

This reverses the `frontend-mvp` PRD as originally written ("pure vanilla JS, no
build step, served as static files by `identity`").

## Why this needs stating

The PRD's vanilla-JS-on-identity choice was a real laziness call, and a
reasonable one: one origin, no second app, no build step. A future reader who
sees a whole Next app — with a tRPC layer — where the PRD promised a static
`.html` will ask what changed. Two things did.

First, the maintainer is TypeScript-fluent. The "look how little frontend you
need" lesson lands for someone learning the browser; here it just swaps a
familiar toolchain for an unfamiliar constraint. The actual Phase-1 lesson — the
polyglot backend collapses to plain HTTP + WebSocket at the browser boundary —
is identical either way.

Second, this frontend is not throwaway. It is the instrument the maintainer will
debug Phase 2 with — watching two chat nodes desync is far more legible in a real
app than in a hand-rolled page — so it should sit on a substrate built to grow,
not one built to delete.

## Why tRPC, and where its boundary is

The temptation with tRPC in a polyglot system is to reach across the language
boundary — to try to type the Kotlin `analytics` or Go `chat` calls. That does
not work and is not attempted: tRPC types are TypeScript types, and the only TS
that `apps/web`'s router imports is **its own**. The typed contract is strictly
React-client ↔ web-server; on the far side of a procedure the web server talks to
the polyglot services over untyped `fetch`, exactly as it would talk to any
foreign system. Pulse's cross-language contracts continue to live in Avro schemas
and documented HTTP (ADR-0011), untouched by this choice.

Within that boundary tRPC earns its place: it replaces the `fetch` + React Query
+ hand-written response types the page would otherwise need (React Query is
required regardless, for the 5-second viewer-count poll), and it removes the
per-endpoint `app/api/*` route folders — procedures live in one router behind a
single catch-all mount.

## Considered options

- **Vanilla JS served by `identity` (rejected).** The PRD's original plan. One
  origin, zero new infrastructure, but a dead-end substrate the maintainer
  outgrows the moment Phase 2 needs a real debugging surface, and a toolchain
  that is friction rather than economy for a TS-fluent author.

- **A route inside `apps/docs` (rejected).** Reuses the existing Next app, one
  fewer dev server. But `docs` is the learning journal and has a homepage
  redesign in flight; folding the product surface into it couples two things that
  change on different cadences for no gain.

- **Separate `apps/web`, browser calls the backends directly (rejected).**
  Either cross-origin `fetch` (forcing CORS headers onto both `identity` in TS
  and `analytics` in Kotlin — backend churn across two languages) or a
  `next.config` `rewrites()` proxy (dumb path-forwarding, no place to shape or
  aggregate). Both leave the client writing hand-typed `fetch` against foreign
  services.

- **Separate `apps/web` with a tRPC BFF (chosen).** The browser holds one typed
  contract to the web app's own server; that server fans out to the polyglot
  services server-side. No CORS (server-to-server fetch is exempt), no
  per-endpoint route folders, typed client calls with React Query built in, and a
  real seam to aggregate or cache at when Phase 2 needs it.

## Consequences

- **The WebSocket is the exception to the typed BFF.** tRPC carries HTTP request/
  response, not a persistent socket, so the chat stream connects straight from the
  browser to `chat` on `:8081`. That call is untyped and un-BFF'd; `chat` may
  still enforce an `Origin` check server-side.

- **`/api` shrinks to one catch-all, it does not vanish.** Next App Router still
  needs a single `app/api/trpc/[trpc]/route.ts` to mount the tRPC fetch adapter.
  Every actual endpoint is a procedure in the router, not a folder — but the mount
  itself is one unavoidable route file.

- **The BFF's server-side fetch targets are dev-loop config.** The procedures
  fetch `identity`/`analytics` at their `localhost` ports; that wiring is a
  local-development convenience. A real deployment resolves those via service
  discovery or a gateway — this ADR records the seam, not a production routing
  decision.

- **`identity` no longer serves the page.** The read endpoint the BFF needs
  (`GET /channels/:slug`) is still `identity`'s to build — moving the browser
  behind a BFF changes who calls identity, not who owns the data.

- **Another dev server in the run loop.** `apps/web` is a third thing to start
  alongside the services. Acceptable cost for a durable frontend; noted so the
  `justfile`/dev recipes account for it.

- **Keep the RSC/server-prefetch dance out of the MVP.** tRPC has a React Server
  Component integration that prefetches on the server and hydrates. The MVP page
  is a single `'use client'` component with plain `useQuery`; the server-prefetch
  setup is a later optimization, not a Phase-1 requirement.
