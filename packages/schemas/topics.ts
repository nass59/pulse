import type {
  ChatMessageSent,
  StreamEnded,
  StreamStarted,
  ViewerJoined,
  ViewerLeft,
} from "./generated/ts";

/**
 * The single source of truth mapping each event type to its Kafka topic.
 * TopicNameStrategy means the registry subject is `<topic>-value`. Producers,
 * consumers, and the registry publisher all import this map — there is no
 * hand-typed topic literal anywhere else in the monorepo, so the mapping cannot
 * drift (CONTEXT.md records the *domain* decisions per topic; this records the
 * mapping itself).
 */
export const EVENT_TOPICS = {
  StreamStarted: "stream.started.v1",
  StreamEnded: "stream.ended.v1",
  ChatMessageSent: "chat.messages.v1",
  ViewerJoined: "chat.presence.joined.v1",
  ViewerLeft: "chat.presence.left.v1",
} as const;

export type EventType = keyof typeof EVENT_TOPICS;
export type Topic = (typeof EVENT_TOPICS)[EventType];

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * The provisioning contract for each topic. Partition count is part of a keyed
 * topic's *contract*, not a runtime detail (ADR-0012): every `channelId`-keyed
 * topic shares 6 partitions so co-partitioned joins in `analytics` work without
 * a repartition, and changing the count later rehashes every key — a migration
 * (recreate + republish), not a config edit. `cleanupPolicy`/`retentionMs` are
 * set explicitly rather than inherited from broker defaults.
 */
interface TopicConfig {
  cleanupPolicy: "delete" | "compact";
  partitions: number;
  retentionMs: number;
}

/**
 * Co-located with the name map so the two cannot drift: `satisfies
 * Record<Topic, ...>` makes the compiler reject any topic in `EVENT_TOPICS`
 * that lacks a config here. `scripts/provision-topics.ts` is the executable
 * source of truth that turns this into real Kafka topics; the broker's
 * `auto.create.topics.enable` is `false` so a missing topic fails loudly
 * instead of being born at the 1-partition default.
 */
export const TOPIC_CONFIGS = {
  "stream.started.v1": {
    partitions: 6,
    cleanupPolicy: "delete",
    retentionMs: 7 * DAY_MS,
  },
  "stream.ended.v1": {
    partitions: 6,
    cleanupPolicy: "delete",
    retentionMs: 7 * DAY_MS,
  },
  "chat.messages.v1": {
    partitions: 6,
    cleanupPolicy: "delete",
    retentionMs: 7 * DAY_MS,
  },
  "chat.presence.joined.v1": {
    partitions: 6,
    cleanupPolicy: "delete",
    retentionMs: DAY_MS,
  },
  "chat.presence.left.v1": {
    partitions: 6,
    cleanupPolicy: "delete",
    retentionMs: DAY_MS,
  },
} as const satisfies Record<Topic, TopicConfig>;

/** Each event type → the shape codegen produced for its .avsc. */
export interface EventPayloads {
  ChatMessageSent: ChatMessageSent;
  StreamEnded: StreamEnded;
  StreamStarted: StreamStarted;
  ViewerJoined: ViewerJoined;
  ViewerLeft: ViewerLeft;
}

/** Drift guard: this line stops compiling if EventPayloads' keys ≠ EventType. */
type _KeysMatch = [keyof EventPayloads] extends [EventType]
  ? [EventType] extends [keyof EventPayloads]
    ? true
    : never
  : never;

const _keysMatch: _KeysMatch = true;
