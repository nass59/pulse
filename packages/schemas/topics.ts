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
