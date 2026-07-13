import {
  IconPackage,
  IconPlug,
  IconRoute,
  type TablerIcon,
} from "@tabler/icons-react";

/**
 * The Go pillar's path spine (ADR-0020, reorganized by ADR-0021): a short, linear
 * "Go for a TypeScript engineer" track at `/go/path/*`. Like the Kafka path and
 * unlike the concept shelves, this is NOT build-state-gated — it teaches Go the
 * language, so every step is `live` from day one. Its accent is Go blue
 * (`--color-go-blue`), the per-technology accent, where Kafka is electric-yellow
 * and Kotlin is purple.
 *
 * Each page is grounded in the real `chat` service the chat-mvp epic shipped, so
 * the idioms land on code that genuinely runs rather than toy snippets. The pillar
 * overview (`components/docs/pillar-overview.tsx`) renders this as a numbered path,
 * with the sticky `<PathRail>` tracking position; each page links on via `<PageNav>`.
 */
export type GoStep = {
  /** One-line, plain-language promise of the page. */
  blurb: string;
  href: string;
  icon: TablerIcon;
  /** Three-ish takeaways, shown on the index card. */
  takeaways: string[];
  title: string;
};

export const GO_STEPS: GoStep[] = [
  {
    title: "The shape of a service",
    blurb:
      "Packages, errors as values (no try/catch), structs over classes, and the standard library's surprisingly capable net/http — the Go mental model for a TS brain.",
    href: "/go/path/the-shape-of-a-service",
    icon: IconPackage,
    takeaways: [
      "Errors are returned values you handle, not exceptions you throw",
      "No classes — structs plus methods, and interfaces are implicit",
      "net/http and log/slog ship in the stdlib; the service is tiny",
    ],
  },
  {
    title: "Goroutines & channels",
    blurb:
      "The reason Go fits a WebSocket gateway: a goroutine per connection, channels to move messages between them, and context to cancel cleanly without leaking.",
    href: "/go/path/goroutines-and-channels",
    icon: IconRoute,
    takeaways: [
      "A goroutine is a near-free thread; one per connection is normal",
      "Channels are typed pipes — the safe way goroutines talk",
      "context.WithCancel kills the write pump so nothing leaks",
    ],
  },
  {
    title: "The cgo Kafka client",
    blurb:
      "confluent-kafka-go wraps the C library librdkafka, so the build crosses into C. Delivery reports over a channel, the cgo build tax, and the Avro struct-tag gotcha.",
    href: "/go/path/the-cgo-kafka-client",
    icon: IconPlug,
    takeaways: [
      "cgo lets Go call C — and makes the build need a C toolchain",
      "Delivery confirmations arrive asynchronously, on a channel",
      "Struct tags map Go fields to Avro names — casing bites",
    ],
  },
];
