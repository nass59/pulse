package pulse.analytics

import io.confluent.kafka.serializers.AbstractKafkaSchemaSerDeConfig
import io.confluent.kafka.serializers.KafkaAvroDeserializerConfig
import io.confluent.kafka.streams.serdes.avro.SpecificAvroSerde
import io.ktor.http.HttpStatusCode
import io.ktor.serialization.kotlinx.json.json
import io.ktor.server.application.call
import io.ktor.server.application.install
import io.ktor.server.engine.embeddedServer
import io.ktor.server.netty.Netty
import io.ktor.server.plugins.contentnegotiation.ContentNegotiation
import io.ktor.server.response.respond
import io.ktor.server.routing.get
import io.ktor.server.routing.routing
import kotlinx.serialization.Serializable
import org.apache.kafka.common.serialization.Serdes
import org.apache.kafka.common.utils.Bytes
import org.apache.kafka.streams.KafkaStreams
import org.apache.kafka.streams.KeyValue
import org.apache.kafka.streams.StoreQueryParameters
import org.apache.kafka.streams.StreamsBuilder
import org.apache.kafka.streams.StreamsConfig
import org.apache.kafka.streams.errors.InvalidStateStoreException
import org.apache.kafka.streams.kstream.Consumed
import org.apache.kafka.streams.kstream.Grouped
import org.apache.kafka.streams.kstream.KStream
import org.apache.kafka.streams.kstream.KTable
import org.apache.kafka.streams.kstream.Materialized
import org.apache.kafka.streams.kstream.Produced
import org.apache.kafka.streams.kstream.TimeWindows
import org.apache.kafka.streams.kstream.Windowed
import org.apache.kafka.streams.state.QueryableStoreTypes
import org.apache.kafka.streams.state.WindowStore
import pulse.events.v1.ViewerCount
import pulse.events.v1.ViewerJoined
import pulse.events.v1.ViewerLeft
import java.time.Duration
import java.time.Instant
import java.util.Properties
import java.util.UUID

/**
 * The presence-window parameters (ADR-0022), declared ONCE so the topology that
 * writes the store and the query that reads it can never disagree on W. If these
 * drift, the query's "fully-elapsed" test silently reads the wrong window.
 */
private val WINDOW_SIZE: Duration = Duration.ofSeconds(60)    // W — the presence horizon
private val WINDOW_ADVANCE: Duration = Duration.ofSeconds(10) // how often a new window opens
private val WINDOW_GRACE: Duration = Duration.ofSeconds(10)   // late-record tolerance after close

private const val STORE_NAME = "viewers-per-stream"

/**
 * The JSON body of GET /health. @Serializable lets the kotlinx.serialization
 * plugin generate the encoder at compile time; Ktor's ContentNegotiation then
 * turns `call.respond(HealthResponse(...))` into `{"state":"RUNNING"}`.
 *
 * `state` is the KafkaStreams lifecycle state — CREATED, REBALANCING, RUNNING,
 * ERROR, ... — surfaced so `/health` reflects the topology, not just "the web
 * server answered." (Issue 04 AC: "/health includes the topology state.")
 */
@Serializable
data class HealthResponse(val state: String)

/**
 * JSON body of GET /streams/{id}/viewers.
 * `windowEnd` is null when count is 0 (no elapsed window for this stream).
 * Serialized as an ISO-8601 string rather than epoch millis so the API is
 * human-legible; the client can parse it back to an instant.
 */
@Serializable
data class ViewerCountResponse(val streamId: String, val count: Int, val windowEnd: String?)

/** JSON body for 503s. */
@Serializable
data class ErrorResponse(val error: String)

fun main() {
  val props = Properties().apply {
    put(StreamsConfig.APPLICATION_ID_CONFIG, "pulse-analytics")
    put(StreamsConfig.BOOTSTRAP_SERVERS_CONFIG, "localhost:9092")
    put(StreamsConfig.DEFAULT_KEY_SERDE_CLASS_CONFIG, Serdes.String()::class.java)
    put(StreamsConfig.DEFAULT_VALUE_SERDE_CLASS_CONFIG, Serdes.String()::class.java)
    /**
     * Disable record caching so every count change is forwarded to the peek
     * immediately. With the default cache, the demo only emits on the commit
     * interval (~30s) and it looks like nothing is happening.
     */
    put(StreamsConfig.STATESTORE_CACHE_MAX_BYTES_CONFIG, 0L)
    /**
     *Pin the state store to a stable, gitignored dir so the OS can't wipe the
     * local RocksDB cache + checkpoint between runs. build/ is already gitignored.
     */
    put(StreamsConfig.STATE_DIR_CONFIG, "build/kafka-streams")
  }

  val registryUrl = "http://localhost:8080/apis/ccompat/v7"
  val serdeConfig = mapOf(
    AbstractKafkaSchemaSerDeConfig.SCHEMA_REGISTRY_URL_CONFIG to registryUrl,
    KafkaAvroDeserializerConfig.SPECIFIC_AVRO_READER_CONFIG to true,
  )

  val joinedSerde = SpecificAvroSerde<ViewerJoined>().apply { configure(serdeConfig, false) }
  val leftSerde = SpecificAvroSerde<ViewerLeft>().apply { configure(serdeConfig, false) }
  val viewerCountSerde = SpecificAvroSerde<ViewerCount>().apply {
    configure(mapOf(AbstractKafkaSchemaSerDeConfig.SCHEMA_REGISTRY_URL_CONFIG to registryUrl), false)
  }

  val builder = StreamsBuilder()

  /**
   * Presence is keyed by channelId (ADR-0012). Re-key each side to streamId and
   * tag it as a signed delta: a join is +1, a leave is -1.
   */
  val joins = builder.stream("chat.presence.joined.v1", Consumed.with(Serdes.String(), joinedSerde))
    .map { _, e -> KeyValue(e.streamId.toString(), 1) }

  val leaves = builder.stream("chat.presence.left.v1", Consumed.with(Serdes.String(), leftSerde))
    .map { _, e -> KeyValue(e.streamId.toString(), -1) }

  /**
   * One stream of ±1 deltas keyed by streamId. The .map changed the key, so the
   * groupByKey below is the repartition point (murmur2, ADR-0014).
   */
  val deltas: KStream<String, Int> = joins.merge(leaves)

  /**
   * Hopping window: a 60s presence horizon advancing every 10s (ADR-0022).
   * A join counts for 60s then ages out, so a lost ViewerLeft self-heals
   * rather than inflating the count forever. The grace period is how long the
   * window keeps accepting late / out-of-order presence after it closes.
   */
  val counts: KTable<Windowed<String>, Int> = deltas
    .groupByKey(Grouped.with(Serdes.String(), Serdes.Integer()))
    .windowedBy(
      TimeWindows.ofSizeAndGrace(Duration.ofSeconds(60), Duration.ofSeconds(10))
        .advanceBy(Duration.ofSeconds(10))
    )
    .aggregate(
      { 0 },
      { _, delta, running -> running + delta },
      // Named store -> issue 04 queries "viewers-per-stream" over HTTP.
      Materialized.`as`<String, Int, WindowStore<Bytes, ByteArray>>("viewers-per-stream")
        .withKeySerde(Serdes.String())
        .withValueSerde(Serdes.Integer()),
    )

  /**
   * Each ±1 lands in 6 overlapping windows (60s / 10s), so you'll see ~6 lines
   * per event — one per live window. The "current" count is the freshest
   * FULLY-ELAPSED window (windowStart + 60s <= now), NOT the most recent start:
   * a just-started window has barely any of the horizon in it (ADR-0022 →
   * "Reading now"). Issue 04's query relies on that; this peek just dumps them all.
   */
  val countStream = counts.toStream()

  // peek — dump every live window so you can watch the fold happen
  countStream.foreach { key, count ->
    println("stream=${key.key()} window=${key.window().start()} count=$count")
  }

  // project the windowed key into a domain Avro event, keyed by streamId
  countStream
    .map { key, count ->
      KeyValue(
        key.key(),
        ViewerCount.newBuilder()
          .setStreamId(UUID.fromString(key.key()))
          .setWindowStart(Instant.ofEpochMilli(key.window().start()))
          .setWindowEnd(Instant.ofEpochMilli(key.window().end()))
          .setCount(count)
          .build(),
      )
    }
    .to("analytics.viewer-count.v1", Produced.with(Serdes.String(), viewerCountSerde))

  val streams = KafkaStreams(builder.build(), props)

  /**
   * The HTTP door into this JVM (interactive queries). Ktor with the Netty
   * engine, bound on 8082. `embeddedServer(...)` only BUILDS the server — nothing
   * binds the socket until .start() below.
   *
   * The trailing lambda is the "application module": everything the server does.
   *  - install(ContentNegotiation){ json() } turns typed responses into JSON.
   *  - routing { ... } declares the URL map. `call` (inside get{}) is the
   *    request/response handle; `call.respond(x)` serializes x and sends it.
   *
   * NOTE: `streams` is captured by this lambda (a closure), so the route can read
   * the live topology state. Right now /health is the only route; the
   * /streams/{id}/viewers query lands in Step 2.
   */
  val server = embeddedServer(Netty, port = 8082) {
    install(ContentNegotiation) { json() }
    routing {
      // Liveness: always 200, body carries the topology state (issue 04 AC).
      get("/health") {
        call.respond(HealthResponse(streams.state().name))
      }

      /**
       * The interactive query — the point of the whole lesson. Reads the
       * embedded RocksDB store directly; no Postgres, no re-consuming the log.
       */
      get("/streams/{streamId}/viewers") {
        val streamId = call.parameters["streamId"]!! // path segment: always present

        /**
         * Gate: the store does not exist until the instance reaches RUNNING.
         * Querying earlier throws — so we answer 503 "warming up" instead.
         * (This is the REBALANCING you watched in /health during Step 1.)
         */
        if (streams.state() != KafkaStreams.State.RUNNING) {
          call.respond(
            HttpStatusCode.ServiceUnavailable,
            ErrorResponse("streams not running: ${streams.state()}")
          )
          return@get
        }

        val now = Instant.now()

        try {
          /**
           * Get a READ-ONLY handle to the windowed store by name + type. Fetch
           * the handle per request: a rebalance can invalidate an old handle,
           * and re-fetching is how interactive queries stay correct across them.
           */
          val store = streams.store(
            StoreQueryParameters.fromNameAndType(
              STORE_NAME,
              QueryableStoreTypes.windowStore<String, Int>(),
            ),
          )

          /**
           * fetch(key, from, to) returns EVERY window for this key whose start
           * falls in [from, to], as (windowStartMillis -> count), ascending.
           * We scan them and keep the freshest one that has FULLY ELAPSED
           * (windowStart + W <= now) — the newest closed window, which holds the
           * complete trailing-W horizon. The iterator is Closeable; `.use`
           * is Kotlin's try-with-resources, so it always closes.
           *
           * NOTE: `now` is wall-clock, but windows are event-time. With local,
           * low-lag input they line up; under heavy consumer lag you'd reconcile
           * against stream-time. MVP accepts wall-clock (ADR-0022).
           */
          var bestStart = Long.MIN_VALUE
          var bestCount = 0

          store.fetch(streamId, now.minus(WINDOW_SIZE.multipliedBy(2)), now).use { iter ->
            for (kv in iter) {
              val windowStart = kv.key
              val elapsed = windowStart + WINDOW_SIZE.toMillis() <= now.toEpochMilli()

              if (elapsed && windowStart > bestStart) {
                bestStart = windowStart
                bestCount = kv.value
              }
            }
          }

          /**
           * Freshness guard: a fully-elapsed populated window is only "now" if it
           * ended recently. When a stream goes silent no newer window is ever
           * materialized (empty windows aren't stored), so the last populated
           * window lingers in the 2W fetch range and would report stale-high for
           * up to ~2W. The freshest fully-elapsed window normally ends within
           * `advance` of now; if the newest one we have ended more than
           * advance+grace ago, the stream has gone quiet and the horizon-correct
           * answer is 0 (ADR-0022 → "Reading now": the count means "joined within
           * the last W", so a window describing an older horizon is not "now").
           */
          val stale = bestStart != Long.MIN_VALUE &&
            now.toEpochMilli() - (bestStart + WINDOW_SIZE.toMillis()) >
            WINDOW_ADVANCE.toMillis() + WINDOW_GRACE.toMillis()

          if (bestStart == Long.MIN_VALUE || stale) {
            /**
             * No fresh fully-elapsed window: unknown streamId, a live-but-empty
             * stream, or everyone aged out / the stream went silent — analytics
             * cannot tell them apart (it consumes no lifecycle events), so all are
             * 0, not 404 (ADR-0022 → "Absence is 0").
             */
            call.respond(ViewerCountResponse(streamId, 0, null))
          } else {
            /**
             * Clamp at 0: a delta-window can go negative when a leave's matching
             * join fell in an earlier, non-overlapping window (a lone -1). A
             * negative viewer count is not a thing to hand a client.
             */
            val count = maxOf(0, bestCount)
            val windowEnd = Instant.ofEpochMilli(bestStart + WINDOW_SIZE.toMillis())

            call.respond(ViewerCountResponse(streamId, count, windowEnd.toString()))
          }
        } catch (e: InvalidStateStoreException) {
          // A rebalance began between the state check and the fetch: retryable.
          call.respond(
            HttpStatusCode.ServiceUnavailable,
            ErrorResponse("store unavailable, retry: ${e.message}")
          )
        }
      }
    }
  }

  /**
   * One shutdown hook for BOTH lifecycles. On SIGTERM/SIGINT (installDist run —
   * remember `gradle run` swallows SIGINT, learning-record 0001): stop the HTTP
   * server first (drain in-flight requests, 1s grace / 2s hard timeout), then
   * close Streams (flush + checkpoint RocksDB) so restart replays less.
   */
  Runtime.getRuntime().addShutdownHook(Thread {
    println("shutting down")
    server.stop(gracePeriodMillis = 1_000, timeoutMillis = 2_0000)
    streams.close()
  })

  /**
   * Start order matters. streams.start() RETURNS immediately (the topology runs
   * on its own background threads), giving the store a head start toward RUNNING.
   * Then server.start(wait = true) BLOCKS the main thread — that block is what
   * keeps the JVM alive and is the natural place for main() to park.
   */
  streams.start()
  server.start(wait = true)
}
