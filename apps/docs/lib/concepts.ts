import {
  Columns3,
  Combine,
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
  UsersRound,
  Wand2,
} from "lucide-react";

/**
 * The single source of truth for the concept catalogue, rendered by the
 * Concepts index (`components/concepts/concept-index.tsx`). The homepage
 * roadmap groups these concepts by phase via its own `lib/roadmap.ts`. Build-
 * state honesty lives here: a concept with an `href` is `live` and links out;
 * one without is `coming` — dashed, dimmed, and never linked until its page
 * ships (see `AGENTS.md`).
 */
export interface Concept {
  /** One-line, plain-language hook. */
  blurb: string;
  /** Present ⇒ the page exists ⇒ the concept is `live`. */
  href?: string;
  icon: LucideIcon;
  /** Carries an interactive widget (earns the dynamics-shaped filter). */
  interactive?: boolean;
  title: string;
}

export const LIVE_CONCEPTS: Concept[] = [
  {
    title: "KRaft mode",
    blurb: "Kafka without ZooKeeper — a broker that elects itself controller.",
    href: "/concepts/kraft-mode",
    icon: Network,
    interactive: true,
  },
  {
    title: "Healthchecks",
    blurb: "“Started” isn't “ready” — and the grace window between them.",
    href: "/concepts/healthchecks",
    icon: HeartPulse,
  },
  {
    title: "Auto topic creation",
    blurb: "The convenience that quietly eats a typo in production.",
    href: "/concepts/auto-topic-creation",
    icon: Wand2,
  },
  {
    title: "Explicit topic provisioning",
    blurb: "Partition count is a contract — a 1-partition default lies.",
    href: "/concepts/explicit-topic-provisioning",
    icon: SlidersHorizontal,
  },
  {
    title: "Named volumes",
    blurb: "How Postgres data outlives a container teardown.",
    href: "/concepts/named-volumes",
    icon: HardDrive,
  },
  {
    title: "Schema compatibility",
    blurb: "Evolving events without breaking readers.",
    href: "/concepts/schema-compatibility",
    icon: ShieldCheck,
    interactive: true,
  },
  {
    title: "Transactional outbox",
    blurb: "Postgres truth, Kafka notification — atomically.",
    href: "/concepts/transactional-outbox",
    icon: Mailbox,
    interactive: true,
  },
  {
    title: "Partitions & ordering",
    blurb: "The unit of parallelism — and its ordering price.",
    href: "/concepts/partitions-and-ordering",
    icon: Columns3,
  },
  {
    title: "Consumer groups",
    blurb: "Many readers, each message once — and state rebuilt from the log.",
    href: "/concepts/consumer-groups",
    icon: UsersRound,
  },
  {
    title: "The log & offsets",
    blurb: "Why Kafka is a log, not a queue — and replay from the start.",
    href: "/concepts/the-log-and-offsets",
    icon: ScrollText,
  },
  {
    title: "Server-authored events",
    blurb: "The client supplies a body; the gateway stamps the truth.",
    href: "/concepts/server-authored-events",
    icon: Stamp,
  },
  {
    title: "WebSocket fan-out",
    blurb: "Best-effort delivery to live tabs; the log is the durable record.",
    href: "/concepts/websocket-fanout",
    icon: Share2,
  },
];

export const COMING_CONCEPTS: Concept[] = [
  {
    title: "Stream–table joins",
    blurb: "Enriching a stream from changing state.",
    icon: Combine,
  },
];
