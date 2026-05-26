# Media plane sits outside Kafka

Video and audio bytes are carried over a dedicated media plane (RTMP/WebRTC ingest, HLS/DASH/LL-HLS delivery via a media server). Kafka is reserved for the control plane: stream lifecycle, chat, follows, presence, analytics, moderation, notifications. The control plane *observes* the media plane via lifecycle events (`StreamStarted`, `StreamEnded`, `ViewerJoined`) but never transports media frames.

## Considered options

- **Push video frames through Kafka.** Rejected — Kafka is not designed for sub-second multimedia transport; latency, throughput, and codec semantics are wrong. Every production livestream system separates these planes.
- **Single-plane "everything is an event" purity.** Rejected as architecturally confused. The thesis "almost everything is an event" only holds for the control plane; the media plane is a different problem with its own protocols.

## Consequences

- Two distinct infrastructure tracks: media server (e.g. MediaMTX, nginx-rtmp, LiveKit) and Kafka cluster.
- The media plane is mocked in early MVP (a placeholder player); real ingest is added later without affecting the control-plane architecture.
- Operational boundary: media-plane incidents do not propagate into Kafka topics and vice versa.
