# Known issue: kafkajs `TimeoutNegativeWarning` on Bun

On startup you'll see, once per connection:

```
TimeoutNegativeWarning: -<epoch-ms> is a negative number. Timeout duration was set to 1.
  at scheduleCheckPendingRequests (kafkajs/src/network/requestQueue/index.js)
```

**It is cosmetic.** kafkajs's request queue computes a timer delay that comes out
negative; Node silently clamps it, Bun emits this warning and clamps it to 1ms.
Produces and connects succeed normally. No kafkajs env var silences it — it is
Bun's warning about kafkajs's internal timer, not a kafkajs warning.

The partitioner warning is different and _is_ silenced, via
`KAFKAJS_NO_PARTITIONER_WARNING=1` in `.env` (we intentionally keep the
Java-compatible v2 partitioner — see ADR-0014).

**Clean fix, deferred:** swap kafkajs for `@confluentinc/kafka-javascript`
(librdkafka-backed) — no JS timer quirk, and it carries its own Schema Registry
client. Deferred because kafkajs is simpler to read while learning, and the swap
would need the `murmur2_random` partitioner setting from ADR-0014.
