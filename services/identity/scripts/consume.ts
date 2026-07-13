/**
 * Dev helper: subscribe to one topic, decode each registry-encoded value via
 * the Schema Registry, and pretty-print it. This is the *eyeball* end of the
 * smoke test — run it to SEE the events the relay drained to Kafka arrive as
 * readable JSON, which closes the loop the producer-only service couldn't.
 *
 * Deliberately NOT a real service consumer. It joins a throwaway random group
 * and reads `fromBeginning` every run, so `just identity-consume` always shows
 * the whole topic. No offset commits, no idempotency, no retries, no graceful
 * rebalance handling — when Pulse grows a real consumer it will look nothing
 * like this. The point here is only to make the wire-format human-readable.
 */
import { CompressionCodecs, CompressionTypes, Kafka } from "kafkajs";
import { config } from "../src/config";
import { registry } from "../src/registry";

/**
 * Compression is chosen by the PRODUCER but must be understood by the CONSUMER —
 * it's stamped in the record-batch header, not negotiated. `chat`'s Go producer
 * compresses with zstd (producer.go), which librdkafka and the JVM client speak
 * natively but KafkaJS does not: it ships gzip only and throws
 * `KafkaJSNotImplemented: ZSTD compression not implemented` on anything else.
 * Registering a codec here is what lets a TypeScript tool read a topic a Go
 * service wrote. Bun has zstd in its runtime, so this needs no dependency — the
 * published `@kafkajs/zstd` wraps a node-gyp addon that won't build under Bun.
 */
CompressionCodecs[CompressionTypes.ZSTD] = () => ({
  compress: ({ buffer }: { buffer: Buffer }) =>
    Promise.resolve(Bun.zstdCompressSync(buffer)),
  decompress: (buffer: Buffer) =>
    Promise.resolve(Bun.zstdDecompressSync(buffer)),
});

const topic = process.argv[2] ?? "stream.started.v1";

const kafka = new Kafka({
  clientId: "identity-consume-cli",
  brokers: config.kafkaBrokers.split(","),
});

/**
 * A fresh random group id per run is what makes this an eyeballing tool rather
 * than a service: no two runs share a committed offset, so `fromBeginning`
 * truly replays the whole topic every time instead of resuming where a prior
 * run left off.
 */
const consumer = kafka.consumer({
  groupId: `identity-consume-cli-${crypto.randomUUID()}`,
});

const shutdown = async () => {
  await consumer.disconnect();
  process.exit(0);
};

process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

await consumer.connect();
await consumer.subscribe({ topic, fromBeginning: true });

console.log(`consuming ${topic} — Ctrl-C to stop\n`);

await consumer.run({
  eachMessage: async ({ message, partition }) => {
    /**
     * registry.decode reverses exactly what outbox.writeEvent's registry.encode
     * wrote: it reads the magic byte + schema id off the front, fetches that
     * schema, and returns the decoded record. Same client, same Apicurio.
     */
    const value = message.value ? await registry.decode(message.value) : null;

    console.log(
      JSON.stringify(
        {
          partition,
          offset: message.offset,
          key: message.key?.toString(),
          value,
        },
        null,
        2
      )
    );
  },
});
