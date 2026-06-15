import type { ReactNode } from "react";

/**
 * The quiz catalogue — one quiz per *live* concept, keyed by the concept's
 * slug (the last segment of its `href` in `lib/concepts.ts`). It's the single
 * source of truth the `ConceptQuiz` widget reads, the same way the catalogue in
 * `lib/concepts.ts` drives the index. Build-state honesty carries over: a slug
 * only earns a quiz once its concept page ships, so there's no quiz for a
 * `coming` concept.
 *
 * Authoring convention: the correct option is written *first* (`answer: 0`) so
 * a question is easy to read and check at a glance. That's a data convention,
 * not what the reader sees — `ConceptQuiz` shuffles the display order with a
 * seeded permutation, so the right answer is never actually shown first.
 *
 * This is a `.tsx`, not a `.ts`, on purpose: question prompts and explanations
 * carry inline `<code>` and emphasis, so they're `ReactNode`, not strings. (The
 * "no literal backticks in lib/*.ts" rule still holds — inline code is a real
 * `<code>` element here, never a markdown backtick.) Explanations are where the
 * teaching lands, so each one leans on a concrete analogy the way the concept
 * pages do.
 */
export interface QuizQuestion {
  /** Index into `options` of the correct answer. */
  answer: number;
  /** Revealed after answering — the teaching beat, where the analogy lives. */
  explanation: ReactNode;
  id: string;
  options: ReactNode[];
  prompt: ReactNode;
}

export interface ConceptQuiz {
  questions: QuizQuestion[];
  /** A one-line, concept-flavoured tagline shown in the quiz header. */
  tagline: string;
}

export const QUIZZES: Record<string, ConceptQuiz> = {
  "kraft-mode": {
    tagline: "Kafka fired its referee and started keeping its own score.",
    questions: [
      {
        id: "kraft-zookeeper",
        prompt:
          "Before KRaft, what ran alongside Kafka to store cluster metadata and elect the controller?",
        options: [
          "A separate ZooKeeper ensemble",
          "A Postgres database",
          "A Redis cache",
          "Nothing — Kafka always managed its own metadata",
        ],
        answer: 0,
        explanation: (
          <>
            ZooKeeper was a whole second distributed system you had to run,
            tune, and keep in sync with the brokers. Picture a football match
            that needs a separate VAR control room in another city — one more
            crew that can fail, and one more thing to keep on the same page as
            the players on the pitch.
          </>
        ),
      },
      {
        id: "kraft-metadata-home",
        prompt: "In KRaft mode, where does cluster metadata actually live?",
        options: [
          "In an internal Kafka log the controllers replicate via Raft",
          "In a config file on every broker's disk",
          "Still in ZooKeeper, just bundled into the process",
          "In environment variables",
        ],
        answer: 0,
        explanation: (
          <>
            KRaft keeps metadata as just another replicated log — the exact
            primitive Kafka already lives and breathes — kept consistent by the{" "}
            <strong>Raft</strong> consensus protocol. The league table now lives
            on the same scoreboard everyone's already watching, not in a back
            office that has to phone in the score.
          </>
        ),
      },
      {
        id: "kraft-single-node",
        prompt:
          "Pulse runs one node that is both broker and sole controller. What's the honest fault-tolerance story?",
        options: [
          "No failover — lose the node and the cluster stops; a real quorum needs 3 or 5 voters",
          "It's fully fault-tolerant out of the box",
          "ZooKeeper still covers the failover behind the scenes",
          "Two nodes would be the ideal quorum",
        ],
        answer: 0,
        explanation: (
          <>
            A quorum only survives failures with an <em>odd</em> number of
            voters — 3 tolerates losing 1, 5 tolerates losing 2. One controller
            is one referee: if they faint, the match is over. Pulse runs
            single-node on purpose for local dev; production would stand up a
            3-voter quorum.
          </>
        ),
      },
      {
        id: "kraft-win",
        prompt: "The headline operational win of KRaft over the ZooKeeper era?",
        options: [
          "One system to run, plus faster failover and metadata propagation",
          "Support for more client languages",
          "Larger maximum message size",
          "Exactly-once delivery for free",
        ],
        answer: 0,
        explanation: (
          <>
            Fewer moving parts means fewer things to operate, monitor, and break
            — and controller failover and metadata changes propagate faster
            without the round-trip to ZooKeeper. It's a team running one
            playbook instead of constantly syncing two.
          </>
        ),
      },
    ],
  },

  healthchecks: {
    tagline: "Engine on isn't the same as out on track.",
    questions: [
      {
        id: "hc-started-ready",
        prompt: "A container reports “started”. Can it serve traffic yet?",
        options: [
          "Not necessarily — “started” isn't “ready”",
          "Yes, started always means ready",
          "Only if it's a database",
          "Only after its first restart",
        ],
        answer: 0,
        explanation: (
          <>
            The process being up says nothing about whether it has connected to
            Postgres, warmed its caches, or finished migrations. An F1 car with
            the engine fired is <em>started</em> — but it isn't <em>ready</em>{" "}
            until it's left the pit lane and is up to temperature.
          </>
        ),
      },
      {
        id: "hc-liveness-readiness",
        prompt: "Liveness versus readiness — what's the split?",
        options: [
          "Liveness: is it alive or should I restart it? Readiness: can it take requests right now?",
          "They're two names for the same check",
          "Liveness is for databases, readiness for APIs",
          "Readiness is what restarts a stuck container",
        ],
        answer: 0,
        explanation: (
          <>
            A failed <strong>liveness</strong> check means “restart me”; a
            failed <strong>readiness</strong> check means “keep me, but don't
            send traffic yet”. A sub jogging the touchline is alive but not
            ready to be on the pitch — you don't substitute them off, you just
            don't pass to them yet.
          </>
        ),
      },
      {
        id: "hc-depends-on",
        prompt:
          "Why doesn't a plain depends_on stop your app from racing the database?",
        options: [
          "It waits for the container to start, not to be healthy — you need condition: service_healthy",
          "It only takes effect in production",
          "It waits far too long by default",
          "It restarts both services on any error",
        ],
        answer: 0,
        explanation: (
          <>
            <code>depends_on</code> alone just orders container <em>startup</em>
            ; the database process can be “up” while still refusing connections.
            Gating on <code>condition: service_healthy</code> makes Compose wait
            for the healthcheck to pass — the difference between “the keeper
            walked onto the pitch” and “the keeper is set for kickoff”.
          </>
        ),
      },
      {
        id: "hc-grace",
        prompt: "What is the start period (grace window) for?",
        options: [
          "A boot window where failing checks don't count against the container yet",
          "A hard timeout after which the app is always killed",
          "The interval between two consecutive checks",
          "A period where traffic is allowed unconditionally",
        ],
        answer: 0,
        explanation: (
          <>
            Slow boots — migrations, JIT warmup — would trip the healthcheck and
            spiral into a restart loop. The grace window says “give it a moment
            before we start judging,” like not booking a player for being
            slightly out of position in the opening seconds.
          </>
        ),
      },
    ],
  },

  "auto-topic-creation": {
    tagline: "The convenience that turns a typo into a brand-new topic.",
    questions: [
      {
        id: "atc-typo",
        prompt: (
          <>
            Auto-create is on. You produce to <code>chat.mesages.v1</code> (note
            the typo). What happens?
          </>
        ),
        options: [
          "Kafka silently creates a new topic and your events flow into the void",
          "Kafka rejects the produce with a clear error",
          "Kafka autocorrects to the closest existing topic",
          "The producer crashes on startup",
        ],
        answer: 0,
        explanation: (
          <>
            With <code>auto.create.topics.enable=true</code>, any topic you name
            springs into existence — typo and all. No error, no warning. It's
            fat-fingering a Twitch channel name and having the platform quietly
            spin up an empty channel: your stream goes nowhere and nothing
            complains.
          </>
        ),
      },
      {
        id: "atc-config",
        prompt:
          "When Kafka auto-creates a topic, what configuration does it get?",
        options: [
          "The broker defaults — typically 1 partition and default replication",
          "Exactly what the producer requested",
          "A copy of the most similar existing topic",
          "None — it stays unconfigured until you fix it",
        ],
        answer: 0,
        explanation: (
          <>
            Auto-created topics inherit broker defaults, which usually means a
            single partition and default retention — almost never what the
            workload actually needs. The topic exists, but its shape is an
            accident nobody chose.
          </>
        ),
      },
      {
        id: "atc-why-off",
        prompt: "The main reason to disable auto-create in production?",
        options: [
          "Typos make ghost topics and real topics get accidental config — you lose the contract",
          "It's measurably slower to produce",
          "It uses noticeably more disk",
          "It only ever breaks consumers, never producers",
        ],
        answer: 0,
        explanation: (
          <>
            Turning it off forces every topic to be created deliberately, with
            an owner and a known partition count. The topic list stays a curated
            roster instead of whatever names got typed — and a typo fails{" "}
            <em>loudly</em> instead of hiding.
          </>
        ),
      },
    ],
  },

  "explicit-topic-provisioning": {
    tagline: "Partition count is a contract you sign at kickoff.",
    questions: [
      {
        id: "etp-contract",
        prompt:
          "Why call partition count a “contract” rather than just a performance knob?",
        options: [
          "It caps consumer-group parallelism and defines the ordering domains — changing it later reshuffles keys",
          "Because Kafka bills you per partition",
          "Because it can never be changed once set",
          "Because consumers have to vote on it",
        ],
        answer: 0,
        explanation: (
          <>
            Partitions are the unit of parallelism (one consumer per partition,
            per group) <em>and</em> the unit of ordering (order holds within a
            partition, not across). It's the number of checkout lanes you build
            into a stadium — decided up front, and painful to renumber once the
            crowd is inside.
          </>
        ),
      },
      {
        id: "etp-one-lie",
        prompt:
          "A topic left at the default 1 partition — what does that quietly “lie” about?",
        options: [
          "That you can't scale past one consumer, while implying a total ordering you never chose",
          "That the data is replicated three times",
          "That messages can be larger than usual",
          "Nothing — one partition is fine everywhere",
        ],
        answer: 0,
        explanation: (
          <>
            One partition means a single consumer in a group can ever read it —
            no horizontal scaling — and accidental global ordering. The default
            looks harmless and silently caps your throughput at one lane.
          </>
        ),
      },
      {
        id: "etp-bump-later",
        prompt:
          "Can you just bump the partition count later on a keyed topic with no downside?",
        options: [
          "No — more partitions changes the key→partition mapping, breaking per-key ordering for existing keys",
          "Yes, it's always safe to increase",
          "Only if you delete the topic first",
          "Only the consumers need a restart",
        ],
        answer: 0,
        explanation: (
          <>
            Keys hash to partitions, so adding partitions sends a key to a{" "}
            <em>new</em> partition while its old messages stay put — per-key
            ordering breaks at the seam. That's why you provision deliberately
            up front, like seeding a tournament bracket before the games rather
            than re-seeding it at half-time.
          </>
        ),
      },
    ],
  },

  "named-volumes": {
    tagline: "The save file your database writes to between sessions.",
    questions: [
      {
        id: "nv-teardown",
        prompt: (
          <>
            No named volume. You run <code>docker compose down</code> then{" "}
            <code>up</code>. What happens to the Postgres data?
          </>
        ),
        options: [
          "Gone — the container's writable layer is destroyed along with it",
          "Preserved automatically by Docker",
          "Baked back into the image",
          "Moved into a Kafka topic",
        ],
        answer: 0,
        explanation: (
          <>
            A container's filesystem dies with the container. Without a volume,
            every <code>down</code> is quitting a video game without saving —
            the run is wiped. A named volume is the memory card the save
            persists to.
          </>
        ),
      },
      {
        id: "nv-vs-bind",
        prompt: "Named volume versus bind mount — what's the difference?",
        options: [
          "A named volume is Docker-managed in its own area; a bind mount maps a specific host path",
          "They're identical under the hood",
          "Bind mounts are always faster and safer",
          "Named volumes can't actually persist data",
        ],
        answer: 0,
        explanation: (
          <>
            Named volumes are Docker-managed and portable across any machine
            that runs the compose file; bind mounts pin to an exact folder on
            your host (great for source you're editing live). For database data
            you want the managed, portable one.
          </>
        ),
      },
      {
        id: "nv-down-v",
        prompt: (
          <>
            What does <code>docker compose down -v</code> do that plain{" "}
            <code>down</code> doesn't?
          </>
        ),
        options: [
          "It also removes named volumes — wiping the persisted data",
          "Nothing different, just faster",
          "It only stops the containers more gently",
          "It removes the pulled images",
        ],
        answer: 0,
        explanation: (
          <>
            Plain <code>down</code> keeps your volumes (the save survives); the{" "}
            <code>-v</code> flag deletes them too. It's the “erase all save
            data” option — handy for a clean slate, dangerous by reflex.
          </>
        ),
      },
    ],
  },

  "schema-compatibility": {
    tagline:
      "Change the contract without breaking everyone who already signed it.",
    questions: [
      {
        id: "sc-backward-means",
        prompt:
          "Under BACKWARD compatibility, a new schema version must be able to read data written with…?",
        options: [
          "The previous schema version (new readers, old data)",
          "Only the exact same schema version",
          "Any future schema version",
          "No older data at all",
        ],
        answer: 0,
        explanation: (
          <>
            BACKWARD means new code can read old events. It's a Netflix app
            update that must still play the episodes you downloaded under the
            previous version — upgrade the reader, keep the old data readable.
          </>
        ),
      },
      {
        id: "sc-new-field",
        prompt:
          "You add a new field to an event under BACKWARD compatibility. What must it have?",
        options: [
          "A default value, so records written without it still decode",
          "A globally unique name only",
          "Nothing special at all",
          "A “required” flag",
        ],
        answer: 0,
        explanation: (
          <>
            Old events don't carry the new field, so the reader needs a{" "}
            <strong>default</strong> to fill in when it's missing. No default
            means old data can't be decoded — which is exactly what BACKWARD
            forbids.
          </>
        ),
      },
      {
        id: "sc-not-compatible",
        prompt: "Which change is NOT backward compatible?",
        options: [
          "Adding a new required field with no default",
          "Adding an optional field that has a default",
          "Improving a field's documentation",
          "Reordering two unrelated fields",
        ],
        answer: 0,
        explanation: (
          <>
            A required, default-less field makes every old record suddenly
            “invalid” to the new reader — the precise thing BACKWARD bans. The
            registry rejects it before it can reach a consumer.
          </>
        ),
      },
      {
        id: "sc-why-registry",
        prompt:
          "Why register schemas in a registry instead of just sharing a file?",
        options: [
          "The registry enforces compatibility — it rejects a breaking change before it ships",
          "It compresses the messages on the wire",
          "It speeds up the network path",
          "It stores the actual event payloads",
        ],
        answer: 0,
        explanation: (
          <>
            The registry is the referee: it checks every new schema against the
            policy and blocks incompatible ones at publish time, so producers
            and consumers can't quietly drift apart. Pulse runs Apicurio with{" "}
            <code>BACKWARD</code> set per subject.
          </>
        ),
      },
    ],
  },

  "transactional-outbox": {
    tagline: "One write, no lost events — Postgres truth, Kafka broadcast.",
    questions: [
      {
        id: "to-dual-write",
        prompt: "The dual-write problem is…?",
        options: [
          "Writing to the DB then publishing to Kafka as two separate steps — a crash in between leaves them disagreeing",
          "Writing the same row to the database twice",
          "Two databases competing for the same write",
          "Producing messages faster than Kafka can accept them",
        ],
        answer: 0,
        explanation: (
          <>
            Two independent systems, two separate writes, and a gap you can
            crash inside. Commit-then-publish can <em>lose</em> the event;
            publish-then-commit can <em>ghost</em> one. There is no safe order
            for two systems.
          </>
        ),
      },
      {
        id: "to-fix",
        prompt: "How does the outbox actually close that gap?",
        options: [
          "The event is written as a row in the same DB transaction as the state change — both commit or neither does",
          "It retries the Kafka publish more aggressively",
          "It publishes to Kafka first, then writes the DB",
          "It runs a two-phase commit across Postgres and Kafka",
        ],
        answer: 0,
        explanation: (
          <>
            “We need to publish this” becomes a row you commit alongside the
            business change. State and intent-to-publish share one transaction,
            one fate. A separate <strong>relay</strong> drains the outbox to
            Kafka afterwards.
          </>
        ),
      },
      {
        id: "to-at-least-once",
        prompt:
          "The relay sometimes delivers the same event twice. Why is that acceptable?",
        options: [
          "It's at-least-once delivery; idempotent consumers dedupe by event id",
          "It's a bug that must be fully eliminated on the producer",
          "Kafka silently removes the duplicates itself",
          "The relay drops every duplicate before sending",
        ],
        answer: 0,
        explanation: (
          <>
            If the relay dies after Kafka acks but before marking the row
            published, it re-sends on restart. You know this as a viewer: Twitch
            occasionally pings “alice went live” twice, and a well-built app
            shows it once. Dedupe is the consumer's job.
          </>
        ),
      },
      {
        id: "to-truth",
        prompt: "Postgres and Kafka — which one is the source of truth?",
        options: [
          "Postgres is canonical truth (the scoreboard); Kafka is the derived notification stream (the commentary)",
          "Kafka is the source of truth once events flow",
          "Both are equally canonical",
          "Neither — Redis holds the truth",
        ],
        answer: 0,
        explanation: (
          <>
            You query Postgres to <em>know</em> whether alice is live right now;
            you subscribe to Kafka to <em>learn</em> that something changed. If
            they ever disagree, Postgres wins and Kafka gets re-derived.
          </>
        ),
      },
      {
        id: "to-no-direct-send",
        prompt: (
          <>
            Why must the request handler never call <code>producer.send()</code>{" "}
            directly?
          </>
        ),
        options: [
          "It reintroduces the dual-write crash window — handlers write rows, the relay writes to Kafka",
          "It's simply slower than the relay",
          "Kafka rejects writes from a request handler",
          "It would duplicate every event",
        ],
        answer: 0,
        explanation: (
          <>
            The instant the handler talks to Kafka, you're back to two systems
            and a gap between them — the exact bug the outbox exists to kill.
            That line never blurs: handlers commit rows, the relay publishes.
          </>
        ),
      },
    ],
  },
};
