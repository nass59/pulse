import { type LucideIcon, Package, Plug, Waypoints } from "lucide-react";

/**
 * The `Go` track spine (ADR-0020): a short, linear "Go for a TypeScript
 * engineer" path. Like `lib/learn.ts` and unlike `lib/concepts.ts`, this is NOT
 * build-state-gated — it teaches Go the language, so every step is `live` from
 * day one. The difference from `Learn` is the accent: the `/go` tier is themed
 * in Go blue (`--color-go-blue`), the per-technology accent, where `Learn` and
 * the rest of the site are electric-yellow.
 *
 * Each page is grounded in the real `chat` service the chat-mvp epic shipped, so
 * the idioms land on code that genuinely runs rather than toy snippets. The index
 * (`components/go/go-path.tsx`) renders this as a numbered path; each page links
 * to the next via `<PageNav>`.
 */
export interface GoStep {
  /** One-line, plain-language promise of the page. */
  blurb: string;
  href: string;
  icon: LucideIcon;
  /** Three-ish takeaways, shown on the index card. */
  takeaways: string[];
  title: string;
}

export const GO_STEPS: GoStep[] = [
  {
    title: "The shape of a service",
    blurb:
      "Packages, errors as values (no try/catch), structs over classes, and the standard library's surprisingly capable net/http — the Go mental model for a TS brain.",
    href: "/go/the-shape-of-a-service",
    icon: Package,
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
    href: "/go/goroutines-and-channels",
    icon: Waypoints,
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
    href: "/go/the-cgo-kafka-client",
    icon: Plug,
    takeaways: [
      "cgo lets Go call C — and makes the build need a C toolchain",
      "Delivery confirmations arrive asynchronously, on a channel",
      "Struct tags map Go fields to Avro names — casing bites",
    ],
  },
];
