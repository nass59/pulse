import {
  Columns3,
  Combine,
  HardDrive,
  HeartPulse,
  type LucideIcon,
  Mailbox,
  Network,
  ScrollText,
  ShieldCheck,
  UsersRound,
  Wand2,
} from "lucide-react";

/**
 * The single source of truth for the concept catalogue, shared by the homepage
 * roadmap (`components/home/concept-roadmap.tsx`) and the Concepts index
 * (`components/concepts/concept-index.tsx`). Build-state honesty lives here: a
 * concept with an `href` is `live` and links out; one without is `coming` —
 * dashed, dimmed, and never linked until its page ships (see `AGENTS.md`).
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
    title: "Named volumes",
    blurb: "How Postgres data outlives a container teardown.",
    href: "/concepts/named-volumes",
    icon: HardDrive,
  },
];

export const COMING_CONCEPTS: Concept[] = [
  {
    title: "Partitions & ordering",
    blurb: "The unit of parallelism — and its ordering price.",
    icon: Columns3,
  },
  {
    title: "Consumer groups",
    blurb: "Many readers, each message once. Mostly.",
    icon: UsersRound,
  },
  {
    title: "The log & offsets",
    blurb: "Why Kafka is a log, not a queue.",
    icon: ScrollText,
  },
  {
    title: "Schema compatibility",
    blurb: "Evolving events without breaking readers.",
    icon: ShieldCheck,
  },
  {
    title: "Transactional outbox",
    blurb: "Postgres truth, Kafka notification — atomically.",
    icon: Mailbox,
  },
  {
    title: "Stream–table joins",
    blurb: "Enriching a stream from changing state.",
    icon: Combine,
  },
];
