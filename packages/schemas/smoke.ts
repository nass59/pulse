/**
 * Throwaway proof that codegen produces usable types: if a field is renamed in
 * the `.avsc` and regenerated, this stops compiling. That compile error — not a
 * runtime decode failure in another language — is the whole point of codegen.
 */

import type { ChatMessageSent, StreamEnded } from "./generated/ts";

const message: ChatMessageSent = {
  messageId: "8f3b2a10-0000-4000-8000-000000000000",
  channelId: "8f3b2a10-0000-4000-8000-000000000001",
  streamId: "8f3b2a10-0000-4000-8000-000000000002",
  userId: "8f3b2a10-0000-4000-8000-000000000003",
  body: "hello pulse",
  sentAt: Date.now(),
};

const ended: StreamEnded = {
  streamId: message.streamId,
  channelId: message.channelId,
  endedAt: Date.now(),
  reason: "NORMAL", // ← only NORMAL | CRASHED | MODERATED type-check here
};

console.log(message, ended);
