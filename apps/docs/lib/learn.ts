import {
  IconBook,
  IconRocket,
  IconSitemap,
  type TablerIcon,
} from "@tabler/icons-react";

/**
 * The Kafka pillar's path spine (ADR-0011, reorganized by ADR-0021): a short,
 * linear "Kafka from zero" track at `/kafka/path/*`. Unlike the concept shelves,
 * this is NOT build-state-gated — it teaches Kafka the technology generically, so
 * every step is `live` from day one. The pillar overview
 * (`components/docs/pillar-overview.tsx`) renders this as a numbered path, and the
 * sticky `<PathRail>` tracks position within it; each page links on via `<PageNav>`.
 */
export type LearnStep = {
  /** One-line, plain-language promise of the page. */
  blurb: string;
  href: string;
  icon: TablerIcon;
  /** Three-ish takeaways, shown on the index card. */
  takeaways: string[];
  title: string;
};

export const LEARN_STEPS: LearnStep[] = [
  {
    title: "What is Kafka?",
    blurb:
      "The problem it solves: every service wants to know when something happened, and wiring them point-to-point doesn't scale.",
    href: "/kafka/path/what-is-kafka",
    icon: IconBook,
    takeaways: [
      "Why N×M point-to-point integrations collapse",
      "“Almost everything is an event”",
      "Kafka as the shared log every service taps",
    ],
  },
  {
    title: "How it works",
    blurb:
      "The mechanism, four ideas deep: the append-only log, partitions, offsets, and consumer groups — with a live diagram for each.",
    href: "/kafka/path/how-it-works",
    icon: IconSitemap,
    takeaways: [
      "The log: append-only, replay-friendly, not a queue",
      "Partitions: the unit of parallelism and ordering",
      "Consumer groups: scale reads without losing messages",
    ],
  },
  {
    title: "Get started",
    blurb:
      "Hands-on: bring a real broker up with Docker and round-trip your first message with kcat — the exact Pulse Phase 0 setup.",
    href: "/kafka/path/getting-started",
    icon: IconRocket,
    takeaways: [
      "docker compose up → a healthy single-node broker",
      "Produce and consume with kcat, the universal Kafka REPL",
      "Read every flag: -P, -C, -b, -t — and what they do",
    ],
  },
];
