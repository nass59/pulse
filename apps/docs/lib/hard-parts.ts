import { IconLink, IconScale, type TablerIcon } from "@tabler/icons-react";

/**
 * The "Software Architecture: The Hard Parts" chapter track (ADR-0025) — the
 * first book on the Distributed Systems shelf. Unlike the technology paths this
 * track grows with the reading: a chapter appears here only once its page is
 * written, so the rail is always honest about how far the book has been taken.
 *
 * ponytail: one book rides the single-track PillarSpec shape for now; grow this
 * into a per-book shelf (ADR-0025 §2) when the second book starts.
 */
export type ChapterStep = {
  /** One-line, plain-language promise of the page. */
  blurb: string;
  href: string;
  icon: TablerIcon;
  /** Three-ish takeaways, shown on the index card. */
  takeaways: string[];
  title: string;
};

export const HARD_PARTS_STEPS: ChapterStep[] = [
  {
    title: "When there are no best practices",
    blurb:
      "Chapter 1 — why hard problems have no correct answer, only trade-offs. Proved on the one question Pulse answers three different ways: where does truth live?",
    href: "/distributed-systems/hard-parts/no-best-practices",
    icon: IconScale,
    takeaways: [
      "One system, one question, three deliberate answers",
      "A real fitness function — and the half of its value Pulse leaves unclaimed",
      "Why written-down reasoning let a rejected name come back",
    ],
  },
  {
    title: "Discerning coupling",
    blurb:
      "Chapter 2 — static coupling is what you can't boot without; dynamic coupling is how quanta talk. Both tested for real: on chat's three startup dependencies, and on the synchronous check Pulse refused to make.",
    href: "/distributed-systems/hard-parts/discerning-coupling",
    icon: IconLink,
    takeaways: [
      "The boot test: chat dies without the registry, shrugs off the broker",
      "Three dials of dynamic coupling — and why one of them reads empty",
      "What a synchronous liveness check would have fused together",
    ],
  },
];
