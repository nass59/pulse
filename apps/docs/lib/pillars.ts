import type { TablerIcon } from "@tabler/icons-react";
import {
  type Concept,
  GO_CONCEPTS,
  KAFKA_CONCEPTS,
  KOTLIN_COMING_CONCEPTS,
} from "./concepts";
import { GO_STEPS } from "./go";
import { HARD_PARTS_STEPS } from "./hard-parts";
import { LEARN_STEPS } from "./learn";

/**
 * The learning pillars (ADR-0021, extended by ADR-0025). Each shares one shape
 * — an overview, an ordered track, and a `concepts/` reference — and one
 * accent: Kafka yellow, Go blue, Kotlin purple, and O'Reilly red for the
 * book-driven Distributed Systems pillar.
 */
export type PillarAccent = "kafka" | "go" | "kotlin" | "systems";

/** A lesson in a pillar's ordered path; the shape <PathRail/> needs. */
export type PathStep = {
  blurb: string;
  href: string;
  icon: TablerIcon;
  takeaways: string[];
  title: string;
};

export type PillarSpec = {
  accent: PillarAccent;
  comingConcepts: Concept[];
  concepts: Concept[];
  eyebrow: string;
  intro: string;
  /** The accent-tinted note under the intro: what this pillar teaches. */
  note: string;
  /** Base route of the ordered path, e.g. `/kafka/path`. */
  pathBase: string;
  steps: PathStep[];
  /** Title rendered as `lead <mark> tail`, the mark swiped in the accent. */
  title: { lead: string; mark: string; tail?: string };
};

export const PILLARS: Record<PillarAccent, PillarSpec> = {
  kafka: {
    accent: "kafka",
    eyebrow: "Kafka · the backbone",
    title: { lead: "Kafka, explained like a", mark: "friend", tail: "would" },
    intro:
      "The log every service taps, from zero. Start with the path if Kafka is new to you; dip into the concepts when the build shoves a specific idea in your face.",
    note: "The path teaches Kafka the technology — the diagrams show the universal mechanism. The concepts below are Pulse-specific: a lit card means Pulse actually runs that idea.",
    pathBase: "/kafka/path",
    steps: LEARN_STEPS,
    concepts: KAFKA_CONCEPTS,
    comingConcepts: [],
  },
  go: {
    accent: "go",
    eyebrow: "Go · the gateway language",
    title: { lead: "Go, explained from", mark: "TypeScript" },
    intro:
      "The handful of Go ideas you need to read the chat gateway and feel why Go fits a service holding thousands of live connections. Grounded in real chat code, not toy snippets.",
    note: "The path teaches Go the language. The concept below is a Pulse-specific networking pattern the gateway exercises.",
    pathBase: "/go/path",
    steps: GO_STEPS,
    concepts: GO_CONCEPTS,
    comingConcepts: [],
  },
  systems: {
    accent: "systems",
    eyebrow: "Distributed Systems · the discipline",
    title: {
      lead: "No best practices, only",
      mark: "trade-offs",
    },
    intro:
      "Readings from the architecture shelf — starting with Software Architecture: The Hard Parts — retold through Pulse. Each chapter maps a trade-off from the book onto a decision this system actually made, and shows what the losing option would have cost.",
    note: "The track follows the book and grows chapter by chapter as the reading does. The concepts shelf stays dark on purpose: a pattern one technology implements lives in that technology's pillar, so a card lights here only when Pulse runs something genuinely cross-service.",
    pathBase: "/distributed-systems/hard-parts",
    steps: HARD_PARTS_STEPS,
    concepts: [],
    comingConcepts: [],
  },
  kotlin: {
    accent: "kotlin",
    eyebrow: "Kotlin · stream processing",
    title: { lead: "Kotlin, when", mark: "analytics", tail: "ships" },
    intro:
      "The analytics service — Kotlin on Kafka Streams — is designed but not yet built. This pillar is the placeholder for that lesson: windowed aggregates, state stores, and stream–table joins, coming when the service does.",
    note: "Nothing here runs yet. The pillar is honest about its depth: Kafka is deep, Go is medium, Kotlin is designed-not-built. The path and concepts light up when analytics ships.",
    pathBase: "/kotlin/path",
    steps: [],
    concepts: [],
    comingConcepts: KOTLIN_COMING_CONCEPTS,
  },
};

/**
 * Ordered lesson tracks keyed for the sticky <PathRail/>: it matches the current
 * pathname against each `base` to render "you are here" only on `path/` pages.
 * Kotlin has no entry — its path is still `coming`.
 */
export const PILLAR_PATHS = [
  ...[PILLARS.kafka, PILLARS.go].map((p) => ({
    accent: p.accent,
    base: p.pathBase,
    label: `${p.eyebrow.split(" · ")[0]} path`,
    steps: p.steps,
  })),
  /**
   * The Hard Parts book track (ADR-0025) is ordered like a path, so it gets
   * the rail — labelled by the book, not the pillar, since each future book
   * will be its own track.
   */
  {
    accent: PILLARS.systems.accent,
    base: PILLARS.systems.pathBase,
    label: "Hard Parts",
    steps: PILLARS.systems.steps,
  },
];
