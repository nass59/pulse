/**
 * The single source of truth for the homepage roadmap — the phase spine that
 * `.scratch/ROADMAP.md` describes, translated into a public, build-state-honest
 * shape. Three candidate visualisations (`components/home/roadmap/*`) all read
 * from here.
 *
 * Honesty rules carried over from `AGENTS.md`:
 *  - Status is hand-set from the real issue tracker, never invented progress.
 *    `foundations/` and `first-schemas/` are both shipped, so Phase 0 is
 *    `shipped` and Phase 1 — First Light — is now `current` ("you are here");
 *    everything after it is `planned`.
 *  - `items` with an `href` are `live` concept pages and link out; the rest are
 *    `coming` — rendered dashed/dimmed, never linked, until their page ships.
 *  - Effort is weekend-scale, the way the roadmap actually measures itself.
 *    There are deliberately no calendar dates to invent.
 *  - `.scratch/` issues are local-only, so nothing here links into them; phase
 *    names, lessons and "ships when" are safe derived prose.
 */
export type PhaseStatus = "shipped" | "current" | "planned";

export interface PhaseItem {
  /**
   * Only meaningful inside the `current` phase, where the spine shows the work
   * in flight: `true` shipped, `false` still in progress. Undefined elsewhere.
   */
  done?: boolean;
  /** Present ⇒ a shipped concept page ⇒ `live` and linkable. */
  href?: string;
  /** Short label — a concept name or a sub-epic topic. */
  label: string;
}

export interface Phase {
  /** Weekend-scale estimate, calendar-free on purpose. */
  effort: string;
  items: PhaseItem[];
  /** The one dominant architectural lesson — the learning payload. */
  lesson: string;
  /** Phase number, 0–4. */
  n: number;
  name: string;
  /** The concrete done-definition, surfaced on expand/hover. */
  shipsWhen: string;
  status: PhaseStatus;
}

export const PHASES: Phase[] = [
  {
    n: 0,
    name: "Foundations",
    lesson: "The substrate — Kafka, enforced schemas, a reproducible dev box.",
    effort: "~1 weekend",
    status: "shipped",
    shipsWhen:
      "docker compose up brings up Kafka + Apicurio + Postgres + Redis, a kcat message round-trips, and TypeScript codegen builds from the five registered schemas.",
    items: [
      { label: "KRaft mode", href: "/kafka/concepts/kraft-mode", done: true },
      {
        label: "Healthchecks",
        href: "/build/architecture/healthchecks",
        done: true,
      },
      {
        label: "Auto topic creation",
        href: "/kafka/concepts/auto-topic-creation",
        done: true,
      },
      {
        label: "Explicit topic provisioning",
        href: "/kafka/concepts/explicit-topic-provisioning",
        done: true,
      },
      {
        label: "Named volumes",
        href: "/build/architecture/named-volumes",
        done: true,
      },
      {
        label: "Schema compatibility",
        href: "/kafka/concepts/schema-compatibility",
        done: true,
      },
    ],
  },
  {
    n: 1,
    name: "First Light",
    lesson:
      "Cross-language event-driven contracts. “Almost everything is an event,” made real.",
    effort: "3–4 weekends",
    status: "current",
    shipsWhen:
      "In a browser: flip a channel live, see a player + chat box, send messages other tabs receive in real time, and watch the viewer count tick — all routed through Kafka.",
    items: [
      {
        label: "Transactional outbox",
        href: "/kafka/concepts/transactional-outbox",
        done: true,
      },
      {
        label: "The log & offsets",
        href: "/kafka/concepts/the-log-and-offsets",
        done: true,
      },
      {
        label: "Partitions & ordering",
        href: "/kafka/concepts/partitions-and-ordering",
        done: true,
      },
      {
        label: "Consumer groups",
        href: "/kafka/concepts/consumer-groups",
        done: true,
      },
      {
        label: "Server-authored events",
        href: "/kafka/concepts/server-authored-events",
        done: true,
      },
      {
        label: "WebSocket fan-out",
        href: "/go/concepts/websocket-fanout",
        done: true,
      },
      { label: "Stream–table joins", done: false },
    ],
  },
  {
    n: 2,
    name: "Scale lessons",
    lesson:
      "Projections off the log — compacted topics and derived storage. Why “Kafka as source of truth” forces specific UX.",
    effort: "3–4 weekends",
    status: "planned",
    shipsWhen:
      "Two chat nodes fan out through a Redis ring buffer, ended streams archive to object storage, and moderation redactions join in via a compacted topic.",
    items: [
      { label: "Redis ring buffer & fan-out" },
      { label: "Chat archiver → object storage" },
      { label: "Compacted redactions (KStream–KTable)" },
    ],
  },
  {
    n: 3,
    name: "Hard parts",
    lesson:
      "The patterns that separate “uses Kafka” from “production-grade on Kafka.”",
    effort: "4+ weekends",
    status: "planned",
    shipsWhen:
      "A fourth service notifies followers on StreamStarted with idempotent consumers, poison messages land in a dead-letter topic, and one chat message can be traced end-to-end across all three languages.",
    items: [
      { label: "Follow graph + CDC outbox" },
      { label: "Notifications fan-out" },
      { label: "DLQ & retries" },
      { label: "Observability across 3 languages" },
      { label: "Schema-evolution drill" },
    ],
  },
  {
    n: 4,
    name: "Advanced",
    lesson:
      "An open menu — the real media plane and beyond, when you get there.",
    effort: "open-ended",
    status: "planned",
    shipsWhen:
      "Whatever you pick ships: real RTMP ingest + HLS delivery, recommendations on more Kafka Streams, ML-enriched moderation, or multi-region.",
    items: [
      { label: "Real media plane (RTMP/HLS)" },
      { label: "Recommendations" },
      { label: "Moderation (ML)" },
      { label: "Multi-region" },
    ],
  },
];
