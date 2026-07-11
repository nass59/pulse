import {
  Columns3,
  Combine,
  Database,
  HardDrive,
  HeartPulse,
  type LucideIcon,
  Mailbox,
  Network,
  ScrollText,
  Share2,
  ShieldCheck,
  SlidersHorizontal,
  Stamp,
  Timer,
  UsersRound,
  Wand2,
} from "lucide-react";

/**
 * The concept catalogues, split per pillar (ADR-0021). Each pillar's overview
 * renders its own `concepts` shelf; this file is the single source of truth for
 * all of them. Build-state honesty lives here: a concept with an `href` is `live`
 * and links out; one without is `coming` — dashed, dimmed, and never linked until
 * its page ships (see `AGENTS.md`).
 *
 * The split mirrors the ADR-0021 reassignment: pure-Kafka ideas and the
 * Kafka-adjacent patterns sit under the Kafka pillar; the Go networking pattern
 * moves to Go; infrastructure concepts that belong to the running system rather
 * than a technology move to The Build.
 */
export type Concept = {
  /** One-line, plain-language hook. */
  blurb: string;
  /** Present ⇒ the page exists ⇒ the concept is `live`. */
  href?: string;
  icon: LucideIcon;
  /** Carries an interactive widget (earns the dynamics-shaped filter). */
  interactive?: boolean;
  title: string;
};

/**
 * Kafka pillar — pure-Kafka concepts plus the Kafka-adjacent patterns (outbox,
 * server-authored events). Ordered roughly as the build met them: the log first,
 * then the patterns layered on top.
 */
export const KAFKA_CONCEPTS: Concept[] = [
  {
    title: "The log & offsets",
    blurb: "Why Kafka is a log, not a queue — and replay from the start.",
    href: "/kafka/concepts/the-log-and-offsets",
    icon: ScrollText,
  },
  {
    title: "Partitions & ordering",
    blurb: "The unit of parallelism — and its ordering price.",
    href: "/kafka/concepts/partitions-and-ordering",
    icon: Columns3,
  },
  {
    title: "Consumer groups",
    blurb: "Many readers, each message once — and state rebuilt from the log.",
    href: "/kafka/concepts/consumer-groups",
    icon: UsersRound,
  },
  {
    title: "KRaft mode",
    blurb: "Kafka without ZooKeeper — a broker that elects itself controller.",
    href: "/kafka/concepts/kraft-mode",
    icon: Network,
    interactive: true,
  },
  {
    title: "Auto topic creation",
    blurb: "The convenience that quietly eats a typo in production.",
    href: "/kafka/concepts/auto-topic-creation",
    icon: Wand2,
  },
  {
    title: "Explicit topic provisioning",
    blurb: "Partition count is a contract — a 1-partition default lies.",
    href: "/kafka/concepts/explicit-topic-provisioning",
    icon: SlidersHorizontal,
  },
  {
    title: "Schema compatibility",
    blurb: "Evolving events without breaking readers.",
    href: "/kafka/concepts/schema-compatibility",
    icon: ShieldCheck,
    interactive: true,
  },
  {
    title: "Transactional outbox",
    blurb: "Postgres truth, Kafka notification — atomically.",
    href: "/kafka/concepts/transactional-outbox",
    icon: Mailbox,
    interactive: true,
  },
  {
    title: "Server-authored events",
    blurb: "The client supplies a body; the gateway stamps the truth.",
    href: "/kafka/concepts/server-authored-events",
    icon: Stamp,
  },
];

/** Go pillar — networking patterns the `chat` gateway exercises. */
export const GO_CONCEPTS: Concept[] = [
  {
    title: "WebSocket fan-out",
    blurb: "Best-effort delivery to live tabs; the log is the durable record.",
    href: "/go/concepts/websocket-fanout",
    icon: Share2,
  },
];

/**
 * The Build — infrastructure concepts that belong to the running system rather
 * than to one technology pillar.
 */
export const BUILD_CONCEPTS: Concept[] = [
  {
    title: "Healthchecks",
    blurb: "“Started” isn't “ready” — and the grace window between them.",
    href: "/build/architecture/healthchecks",
    icon: HeartPulse,
  },
  {
    title: "Named volumes",
    blurb: "How Postgres data outlives a container teardown.",
    href: "/build/architecture/named-volumes",
    icon: HardDrive,
  },
];

/**
 * Kotlin pillar — the `analytics` (Kafka Streams) concepts, all `coming` until
 * the service ships. They make the pillar's depth asymmetry honest: designed,
 * not built.
 */
export const KOTLIN_COMING_CONCEPTS: Concept[] = [
  {
    title: "Windowed aggregates",
    blurb: "Counting concurrent viewers over a sliding window of events.",
    icon: Timer,
  },
  {
    title: "State stores",
    blurb: "RocksDB-backed local state, recoverable by replay.",
    icon: Database,
  },
  {
    title: "Stream–table joins",
    blurb: "Enriching a stream from changing state.",
    icon: Combine,
  },
];
