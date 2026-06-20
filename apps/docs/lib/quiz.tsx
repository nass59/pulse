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
 *
 * The `/go` tier (ADR-0020) reads from this same catalogue, keyed by
 * `go-<page-slug>` (e.g. `go-goroutines-and-channels`), and renders the widget
 * with `accent="blue"`. Same data shape, different accent.
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

  "the-log-and-offsets": {
    tagline: "Kafka doesn't hand out messages — it lets you read the tape.",
    questions: [
      {
        id: "log-not-queue",
        prompt:
          "What happens to a record after a consumer reads it from a Kafka topic?",
        options: [
          "Nothing — it stays on the log until retention expires; reading doesn't remove it",
          "It's deleted, like popping off a queue",
          "It's moved to a “processed” topic",
          "It's hidden from every other consumer",
        ],
        answer: 0,
        explanation: (
          <>
            A classic queue is a pile of tickets — take one and it's gone. A
            Kafka log is a DVR of the match: pressing play doesn't erase the
            recording, and someone else can watch the same moment later. Reading
            never consumes; only retention ages records out.
          </>
        ),
      },
      {
        id: "log-offset",
        prompt: "What is an offset?",
        options: [
          "A per-consumer cursor — the position in the partition a reader has reached",
          "A global clock shared by all consumers",
          "The number of partitions in a topic",
          "How long a record is kept before deletion",
        ],
        answer: 0,
        explanation: (
          <>
            An offset is just “which frame am I on.” Each consumer keeps its
            own, so two readers can sit at totally different points in the same
            partition — one at the live edge, one still catching up — like two
            people watching the same Twitch VOD from different timestamps.
          </>
        ),
      },
      {
        id: "log-replay",
        prompt: (
          <>
            chat boots with <code>auto.offset.reset=earliest</code> and no
            committed offset. Where does it start reading?
          </>
        ),
        options: [
          "From offset 0 — it replays the whole partition from the beginning",
          "From the latest record only",
          "From a random offset",
          "It refuses to start without a committed offset",
        ],
        answer: 0,
        explanation: (
          <>
            With no offset to resume from, <code>earliest</code> rewinds to the
            start of the tape. That's not a bug — it's how chat rebuilds its
            entire live-channel picture from scratch every boot. Replay is just
            moving the cursor back to zero.
          </>
        ),
      },
      {
        id: "log-independence",
        prompt: "Why can analytics and chat both read the same topic freely?",
        options: [
          "Each keeps its own offsets, so one reader's progress never affects another's",
          "Kafka duplicates the topic per consumer",
          "Only one of them is actually allowed to read it",
          "They take turns, one record at a time",
        ],
        answer: 0,
        explanation: (
          <>
            Because the log isn't consumed by reading, any number of independent
            readers can tap it at their own pace — the same broadcast feed piped
            to the commentary booth, the stats team, and the highlights editor
            at once, each scrubbing to wherever they need.
          </>
        ),
      },
    ],
  },

  "partitions-and-ordering": {
    tagline: "One key, one lane — order holds inside a lane, never across.",
    questions: [
      {
        id: "po-ordering-scope",
        prompt:
          "Across what scope does Kafka actually guarantee message order?",
        options: [
          "Within a single partition — never across partitions of a topic",
          "Across the whole topic, always",
          "Across the whole cluster",
          "Only if there's exactly one consumer",
        ],
        answer: 0,
        explanation: (
          <>
            Order is a per-partition promise, not a topic-wide one. Think of
            each partition as one checkout lane: people in a lane are strictly
            in order, but there's no defined order <em>between</em> lanes.
            That's why what you key by matters so much.
          </>
        ),
      },
      {
        id: "po-key-choice",
        prompt: "Why does chat key its messages by channelId?",
        options: [
          "So every event for one channel lands on the same partition and stays totally ordered",
          "To spread one channel's messages across all partitions for speed",
          "Because Kafka requires a UUID key",
          "To make messages smaller on the wire",
        ],
        answer: 0,
        explanation: (
          <>
            Same key → same partition → one ordered lane per channel. Viewers in
            alice's chat see messages in the order the gateway received them,
            because they're all queued in a single lane. Key by something random
            and a channel's own messages would scatter and could arrive jumbled.
          </>
        ),
      },
      {
        id: "po-copartition",
        prompt:
          "chat keys messages, presence, AND consumes lifecycle all by channelId. What does that buy?",
        options: [
          "Co-partitioning — a channel's related events share a partition, so analytics can join them without a repartition",
          "Nothing — it's just a naming convention",
          "Smaller topics",
          "Exactly-once delivery",
        ],
        answer: 0,
        explanation: (
          <>
            When several topics use the same key, a given channel's records line
            up on the <em>same</em> partition number across all of them. That's
            co-partitioning — the precondition for a stream–table join
            downstream, like keeping one team's fixtures, results, and squad
            sheet all filed under the same club so you can cross-reference
            without reshuffling.
          </>
        ),
      },
      {
        id: "po-repartition",
        prompt:
          "Why is the partition count treated as a contract fixed up front?",
        options: [
          "Adding partitions rehashes keys to new partitions, breaking per-key ordering at the seam",
          "Kafka charges per partition",
          "Partitions can never be added at all",
          "Consumers vote on the count at runtime",
        ],
        answer: 0,
        explanation: (
          <>
            A key maps to a partition by hashing modulo the partition count.
            Change the count and existing keys hash somewhere new — their old
            records stay put, their new ones land elsewhere, and the single
            ordered lane splits. It's re-seeding the bracket at half-time: the
            games already played don't move.
          </>
        ),
      },
    ],
  },

  "consumer-groups": {
    tagline: "Don't ask who's live — replay the log and find out yourself.",
    questions: [
      {
        id: "cg-what",
        prompt: "What is a consumer group?",
        options: [
          "A set of consumers that share a topic's partitions, each partition read by exactly one member",
          "A group chat for Kafka operators",
          "A backup copy of a topic",
          "The list of producers writing to a topic",
        ],
        answer: 0,
        explanation: (
          <>
            A consumer group is how you scale reads: partitions are dealt out
            among the members like marking assignments in defence — each
            attacker (partition) is picked up by exactly one defender
            (consumer), so the work is shared and nothing is double-marked.
          </>
        ),
      },
      {
        id: "cg-state-from-log",
        prompt:
          "How does chat learn which channels are live, instead of calling identity over HTTP?",
        options: [
          "It consumes the stream-lifecycle topics and folds the events into an in-memory map",
          "It queries identity's database directly",
          "It polls a /live HTTP endpoint every second",
          "It guesses from the channel slug",
        ],
        answer: 0,
        explanation: (
          <>
            This is the philosophical shift: not <em>asking</em> “is alice
            live?” but <em>learning</em> it from the event stream. chat folds{" "}
            <code>StreamStarted</code>/<code>StreamEnded</code> into a map — the
            same way you'd reconstruct the score by replaying the match events
            rather than phoning the stadium.
          </>
        ),
      },
      {
        id: "cg-ephemeral",
        prompt: (
          <>
            chat uses a fresh group id each boot (
            <code>chat-gateway-{"<host>-<boot>"}</code>) with{" "}
            <code>earliest</code>. Why a new group every time?
          </>
        ),
        options: [
          "So it always replays the full log and rebuilds complete state, never resuming from a stale committed offset",
          "To hide from the Kafka admin tools",
          "Because group ids must be globally unique forever",
          "To consume each message exactly once across reboots",
        ],
        answer: 0,
        explanation: (
          <>
            A durable group would resume from its last commit and miss the
            history it needs to know who's live. A throwaway group with{" "}
            <code>earliest</code> guarantees a clean, full replay every boot —
            chat wants the <em>whole</em> story each time it wakes up, not where
            it left off.
          </>
        ),
      },
      {
        id: "cg-eventual",
        prompt:
          "The liveness gate is “eventually consistent.” What's the accepted consequence?",
        options: [
          "A connect just after a real go-live can be rejected until chat consumes the StreamStarted event",
          "Messages are permanently lost",
          "Two channels can be live with the same id",
          "identity has to block until chat catches up",
        ],
        answer: 0,
        explanation: (
          <>
            chat lags identity by its own consumer lag, so there's a sliver of
            time where a channel is genuinely live but chat hasn't heard yet —
            connect and you get a <code>1008</code>. It's VAR taking a beat to
            confirm the goal; the client just retries. The alternative — a
            synchronous call back to identity — is exactly the coupling we're
            avoiding.
          </>
        ),
      },
    ],
  },

  "server-authored-events": {
    tagline: "The client gets a microphone, not a keyboard for the record.",
    questions: [
      {
        id: "sa-client-supplies",
        prompt:
          "When a viewer sends a chat message, what does the client actually supply?",
        options: [
          "Only the message body — nothing else",
          "The full event: id, userId, timestamp, channel, and body",
          "The userId and timestamp, but not the body",
          "A signed, tamper-proof event envelope",
        ],
        answer: 0,
        explanation: (
          <>
            The client's whole contribution is the text. Everything else —{" "}
            <code>messageId</code>, <code>userId</code>, the channel/stream
            identity, <code>sentAt</code> — is stamped by the gateway. The
            viewer speaks into a mic; the gateway is the official scorer who
            writes what actually goes in the record.
          </>
        ),
      },
      {
        id: "sa-why",
        prompt: "Why let the server author every field but the body?",
        options: [
          "Authorship can't be forged and a message can't be backdated",
          "It makes the payload bigger",
          "Kafka requires server-side timestamps",
          "It lets clients pick their own message ids",
        ],
        answer: 0,
        explanation: (
          <>
            If the client supplied <code>userId</code> or <code>sentAt</code>,
            anyone could impersonate another viewer or fake the timing. Stamping
            them server-side makes forgery impossible by construction — like a
            match official recording the goal time, not the player claiming it.
          </>
        ),
      },
      {
        id: "sa-wristband",
        prompt: (
          <>
            The gateway stamps <code>channelId</code>/<code>streamId</code> from
            the connection's “wristband.” What is that?
          </>
        ),
        options: [
          "The channel/stream identity captured once at join time and remembered on the connection",
          "A token the client sends with every message",
          "A fresh live-map lookup performed per message",
          "A random id minted for each message",
        ],
        answer: 0,
        explanation: (
          <>
            When the socket passes the liveness gate at join, the gateway pins
            that channel and stream onto the connection — a festival wristband
            you're given at the gate and that's checked all night. Every message
            reads the wristband, not a per-message lookup, so identity can't
            drift mid-session.
          </>
        ),
      },
      {
        id: "sa-receipt-time",
        prompt: (
          <>
            <code>sentAt</code> is the server's receipt time, never the client's
            clock. What does that guarantee?
          </>
        ),
        options: [
          "A channel's messages are totally ordered as the gateway saw them, with no skewed client clocks",
          "Messages arrive faster",
          "Clients in other timezones are rejected",
          "The timestamp can be anything the client wants",
        ],
        answer: 0,
        explanation: (
          <>
            Client clocks lie — they're wrong, skewed, or spoofed. Anchoring{" "}
            <code>sentAt</code> to the gateway's own clock means one authority
            times every message in a channel, so the order is the order the
            server witnessed. Same reason the finish line, not each runner's
            watch, records the race.
          </>
        ),
      },
    ],
  },

  "websocket-fanout": {
    tagline: "The live push is a courtesy; the log is the promise.",
    questions: [
      {
        id: "wf-two-things",
        prompt:
          "When a message arrives, the gateway does two things. What are they?",
        options: [
          "Produce it to Kafka (durable), and fan it out in memory to other sockets on the same node (live push)",
          "Write it to Postgres, then email subscribers",
          "Only broadcast it to other tabs — Kafka is optional",
          "Only produce to Kafka — there is no live push",
        ],
        answer: 0,
        explanation: (
          <>
            One arrival, two destinations: the durable log everyone can trust,
            and an instant in-memory broadcast to viewers already connected
            here. The log is the official record; the fan-out is the stadium
            big-screen replay — nice to have live, but not where the result is
            kept.
          </>
        ),
      },
      {
        id: "wf-best-effort",
        prompt: "Why is the in-memory fan-out called “best-effort”?",
        options: [
          "If a socket is slow or dead the live push can be dropped — the durable record still lives in the log",
          "It retries forever until every viewer acks",
          "It's the only delivery path, so it must never fail",
          "It writes to disk before sending",
        ],
        answer: 0,
        explanation: (
          <>
            The push is fire-and-forget: a wedged connection doesn't get to hold
            up the room, so its live copy may be missed. That's fine precisely
            because the message is already safely on the log — the viewer can
            recover it from history. Durability lives in one place, on purpose.
          </>
        ),
      },
      {
        id: "wf-single-node",
        prompt:
          "Two viewers on the same channel but connected to different gateway nodes. Does the in-memory fan-out reach both?",
        options: [
          "No — fan-out is single-node, so a viewer on another node misses the live push",
          "Yes, the fan-out is cluster-wide",
          "Yes, Kafka relays it between nodes automatically",
          "Only if they share a browser",
        ],
        answer: 0,
        explanation: (
          <>
            The map of connections lives in one process, so the broadcast only
            reaches sockets on <em>that</em> node. It's a group chat that only
            pings people in the same room — anyone in another room finds out by
            checking the log. The MVP runs one node on purpose to make this
            limit visible.
          </>
        ),
      },
      {
        id: "wf-phase2",
        prompt: "How does Phase 2 close the cross-node gap?",
        options: [
          "A Redis pub/sub layer (and ring buffer) so nodes relay live messages to each other",
          "By forcing all viewers onto one node forever",
          "By making Kafka push directly to browsers",
          "By deleting the in-memory fan-out entirely",
        ],
        answer: 0,
        explanation: (
          <>
            Redis becomes the shared megaphone between nodes: each gateway
            publishes to a channel, every node subscribes, and the live push
            crosses node boundaries. You feel the single-node limit first,{" "}
            <em>then</em> earn the fix — which is the whole point of shipping
            the stepping stone before the solution.
          </>
        ),
      },
    ],
  },

  "go-the-shape-of-a-service": {
    tagline: "Same instincts as TypeScript, three habits unlearned.",
    questions: [
      {
        id: "go-errors",
        prompt: "How does idiomatic Go report that something went wrong?",
        options: [
          "It returns an error value alongside the result, and the caller checks it",
          "It throws an exception you catch with try/catch",
          "It sets a global errno you read after the call",
          "It logs and silently continues",
        ],
        answer: 0,
        explanation: (
          <>
            There's no <code>try/catch</code>. A function returns{" "}
            <code>(value, error)</code> and you handle the error right there
            with <code>if err != nil</code>. The error is part of the signature,
            in plain sight — like a striker who has to acknowledge every offside
            flag before play continues, not one raised in a separate booth.
          </>
        ),
      },
      {
        id: "go-no-classes",
        prompt:
          "Go has no classes. What models “a thing with data and behaviour”?",
        options: [
          "A struct, with methods defined on it and interfaces it satisfies implicitly",
          "A class, just spelled differently",
          "Only free functions — Go has no methods",
          "A prototype chain like JavaScript",
        ],
        answer: 0,
        explanation: (
          <>
            You declare a <code>struct</code> for the data and hang methods off
            it. Interfaces are satisfied <em>implicitly</em> — if a type has the
            right methods it fits the interface, no <code>implements</code>{" "}
            keyword. It's being picked for the five-a-side because you can play
            the position, not because you signed a form saying you would.
          </>
        ),
      },
      {
        id: "go-stdlib",
        prompt:
          "What does Pulse's chat service use to run its HTTP/WebSocket server and structured logs?",
        options: [
          "The standard library — net/http and log/slog, no framework",
          "Express, ported to Go",
          "A heavyweight web framework with a CLI",
          "A third-party logger and router it had to vendor",
        ],
        answer: 0,
        explanation: (
          <>
            Go's stdlib is unusually capable: <code>net/http</code> is a real
            production server and <code>log/slog</code> does structured JSON
            logs — so the service stays tiny with almost no dependencies. Coming
            from npm, the surprise is how much ships in the box.
          </>
        ),
      },
    ],
  },

  "go-goroutines-and-channels": {
    tagline: "A thread so cheap you spawn one per fan, and a pipe to talk.",
    questions: [
      {
        id: "go-goroutine",
        prompt: "What is a goroutine?",
        options: [
          "A function running concurrently, scheduled by Go onto OS threads — cheap enough to have thousands",
          "A heavyweight OS thread, one per CPU core",
          "A separate process Go forks",
          "A callback queued on an event loop, like in Node",
        ],
        answer: 0,
        explanation: (
          <>
            Start one with <code>go f()</code>. They're so light that one per
            WebSocket connection is normal — chat holds thousands at once. Think
            of every fan in the stadium following the match on their own, all at
            the same time, without the venue hiring a staffer per seat.
          </>
        ),
      },
      {
        id: "go-channel",
        prompt: "How do goroutines safely pass data to each other in Go?",
        options: [
          "Over channels — typed pipes that synchronise sender and receiver",
          "By sharing a global variable and hoping for the best",
          "Through localStorage",
          "They can't communicate at all",
        ],
        answer: 0,
        explanation: (
          <>
            “Don't communicate by sharing memory; share memory by
            communicating.” A channel is a typed pipe: one goroutine sends, the
            other receives, and Go handles the handoff. chat's write pump ranges
            over a channel of outbound bytes — a conveyor belt feeding one
            worker, no shared-state scramble.
          </>
        ),
      },
      {
        id: "go-context",
        prompt: (
          <>
            Why does chat wrap each connection's write pump in a{" "}
            <code>context.WithCancel</code>?
          </>
        ),
        options: [
          "So when the connection ends, cancel() stops the write pump and the goroutine doesn't leak",
          "To make the writes faster",
          "Because channels require a context",
          "To retry failed writes forever",
        ],
        answer: 0,
        explanation: (
          <>
            A goroutine that never returns is a leak — memory that piles up per
            dead connection. The read loop calls <code>cancel()</code> on
            disconnect; the write pump's <code>{"<-ctx.Done()"}</code> fires and
            it exits cleanly. It's the manager pulling a player the moment the
            whistle goes, so nobody's left jogging an empty pitch.
          </>
        ),
      },
    ],
  },

  "go-the-cgo-kafka-client": {
    tagline: "Go calling C calling Kafka — power, and a tax at the door.",
    questions: [
      {
        id: "go-cgo",
        prompt: (
          <>
            <code>confluent-kafka-go</code> wraps librdkafka, a C library. What
            does that imply for the build?
          </>
        ),
        options: [
          "It uses cgo, so building needs a C toolchain on the machine",
          "Nothing — it's pure Go under the hood",
          "It only runs inside Docker",
          "It downloads a prebuilt binary at runtime",
        ],
        answer: 0,
        explanation: (
          <>
            cgo lets Go call into C, which buys the fastest, most complete Kafka
            client there is — at the cost of a C compiler in the build and
            slower first compiles (the “cgo tax”). It's fielding a world-class
            import who needs a work visa sorted before kickoff.
          </>
        ),
      },
      {
        id: "go-delivery",
        prompt:
          "How does the producer learn whether a message actually reached Kafka?",
        options: [
          "Asynchronously — a delivery report arrives later on a channel, not as a return value",
          "Synchronously — produce blocks until the broker acks",
          "It never finds out",
          "By polling the topic for its own message",
        ],
        answer: 0,
        explanation: (
          <>
            <code>Produce</code> just enqueues; the confirmation comes back
            later on a delivery channel you drain in a goroutine — the exact
            goroutine-plus-channel pattern again. You hand your parcel to the
            courier and get the “delivered” notification afterwards, rather than
            standing at the door until it arrives.
          </>
        ),
      },
      {
        id: "go-tag-casing",
        prompt: (
          <>
            The Avro schema field is <code>messageId</code> but the wire output
            came out wrong until a struct tag was fixed. What bit?
          </>
        ),
        options: [
          "The avro struct tag's casing must match the schema exactly",
          "Go can't encode UUIDs at all",
          "Avro field names must be uppercase",
          "The struct field must be unexported",
        ],
        answer: 0,
        explanation: (
          <>
            Go's exported field is <code>MessageID</code> (Go's initialism
            convention), but the Avro wire name is <code>messageId</code> — and
            the <code>avro</code> struct tag is what bridges the two. Get the
            casing wrong and the field silently serialises under the wrong name.
            It's spelling a teammate's name wrong on the team sheet: looks fine
            to you, but the system can't match it.
          </>
        ),
      },
    ],
  },
};
