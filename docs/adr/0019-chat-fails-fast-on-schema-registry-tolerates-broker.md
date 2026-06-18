# chat fails fast on an unreachable schema registry, but tolerates a transient broker at boot

`chat`'s producer treats its two startup dependencies **asymmetrically**. If the
**schema registry** (Apicurio) is unreachable at boot, `producer.New` returns an
error and the process **exits** — it never starts listening. If the **broker**
(Kafka) is unreachable at boot, the process **starts normally**, accepts WebSocket
connections, and lets librdkafka buffer and retry deliveries in the background.

## Why this needs stating

The two behaviours look inconsistent — a future reader will ask "why does `chat`
die when Apicurio is down but shrug when Kafka is down?" — so the reasoning is
worth recording before someone "fixes" the asymmetry into uniformity.

The asymmetry follows from *when* and *how* each dependency is needed:

- **The schema is needed synchronously, at construction.** Every value on
  `chat.messages.v1` is Avro wrapped in the Confluent wire format — a 5-byte header
  carrying the **schema id** fetched from the registry (ADR-0004). Without that
  fetch there is no id to stamp and no parsed schema to encode against: the producer
  cannot author a single well-formed message. A gateway that cannot encode its own
  messages must not accept connections — because the WebSocket fan-out is only
  best-effort *on the premise that the log is the durable record* (ADR-0018). If
  nothing can reach the log, that premise collapses and every fanned-out message is
  silently absent from the source of truth. Refusing to start is the only stance
  consistent with the source-of-truth model.
- **The broker is a delivery target, not a construction-time input.** librdkafka
  connects lazily and is explicitly built to buffer produces and reconnect across
  broker blips. Killing a gateway holding thousands of live sockets over a transient
  broker hiccup would be a worse failure than briefly queueing messages that the
  delivery-report path will either flush on recovery or log loudly on failure. The
  durability guarantee is preserved differently here: a produce that never lands is
  *logged*, not silently dropped.

So: the schema is a hard precondition for authoring the record at all; the broker is
a recoverable destination for an already-authored record. Same goal (never silently
lose a message from the log), different mechanism per dependency.

## Consequences

- **Deploy/ops contract:** `chat` will crash-loop if Apicurio is down or the
  `chat.messages.v1-value` subject is unregistered — that is intended fail-fast, not
  a bug. Provision the registry and publish schemas before rolling `chat`.
- A prolonged broker outage is *not* fail-fast: `chat` stays up, sockets stay live,
  and produces accumulate then fail delivery (logged). Live fan-out keeps working
  (it is in-process); only the durable record lags. This matches ADR-0018's split
  between the fast path (socket) and the truth (log).
- The schema is fetched **once at startup and cached**; the registry is not on the
  per-message path, so its availability matters only at boot (and on redeploy).
- If `chat` later needs to survive a registry blip at boot (e.g. to decouple its
  rollout from Apicurio's), the reversal is a bounded change: retry-with-backoff in
  `New`, or defer the first fetch until the first produce. Recorded here so that is a
  deliberate future choice, not an accident.
