import {
  ArrowRight,
  Box,
  Boxes,
  Braces,
  Check,
  Columns3,
  Crown,
  Database,
  FileCode,
  HardDrive,
  Inbox,
  ListChecks,
  type LucideIcon,
  Radio,
  ScrollText,
  Send,
  Server,
  Trash2,
  Users,
  X,
} from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Static diagram primitives for the docs surface. These are deliberately *not*
 * interactive — they are the cheap, high-value memorability tool the v1 polish
 * pass leans on (see `AGENTS.md`, "Diagrams everywhere, animation still gated").
 * Pure server components: no `"use client"`, no Motion, just layout + tokens, so
 * they render straight into MDX pages and travel for free in the static export.
 *
 * Each figure follows the DevLab a11y-safe colour pattern from `Tag`: category
 * colour shows as text + a hairline border on a transparent/tinted ground,
 * never as a low-contrast coloured fill behind body text.
 */

/** A bordered figure with an optional caption — the shared chrome every diagram sits in. */
export const DiagramFrame = ({
  caption,
  children,
  className,
}: {
  caption?: ReactNode;
  children: ReactNode;
  className?: string;
}) => (
  <figure className={cn("not-prose my-7", className)}>
    <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
      {children}
    </div>
    {caption ? (
      <figcaption className="mt-2.5 px-1 text-muted-foreground text-xs leading-relaxed">
        {caption}
      </figcaption>
    ) : null}
  </figure>
);

const tones = {
  neutral: "border-border text-muted-foreground",
  ink: "border-border text-foreground",
  yellow: "border-electric-yellow/50 text-yellow-ink dark:text-electric-yellow",
  green: "border-accent-green/50 text-accent-green",
  orange: "border-accent-orange/50 text-accent-orange",
} as const;

type Tone = keyof typeof tones;

/** A small labelled box — a node in a flow figure. */
const FlowBox = ({
  tone = "ink",
  mono,
  children,
}: {
  tone?: Tone;
  mono?: boolean;
  children: ReactNode;
}) => (
  <div
    className={cn(
      "flex flex-col items-center gap-1 rounded-xl border bg-transparent px-3.5 py-3 text-center text-sm",
      mono && "font-mono text-xs",
      tones[tone]
    )}
  >
    {children}
  </div>
);

const Connector = ({ label }: { label?: string }) => (
  <div className="flex shrink-0 flex-col items-center gap-1 text-muted-foreground">
    <ArrowRight className="size-5 rotate-90 sm:rotate-0" />
    {label ? (
      <span className="font-mono text-[10px] leading-none">{label}</span>
    ) : null}
  </div>
);

/* ------------------------------------------------------------------ */
/* Healthchecks — the start_period grace window on a probe timeline.    */
/* ------------------------------------------------------------------ */

interface Probe {
  at: string;
  ok: boolean;
  shielded: boolean;
}

const PROBES: Probe[] = [
  { at: "0s", ok: false, shielded: true },
  { at: "10s", ok: false, shielded: true },
  { at: "20s", ok: true, shielded: false },
  { at: "30s", ok: true, shielded: false },
  { at: "40s", ok: true, shielded: false },
];

/**
 * The Docker healthcheck timeline: probes fire on a fixed interval, but the ones
 * inside `start_period` are shielded — a failure there never counts toward
 * `retries`. The slow boot looks like a failure and Docker ignores it on purpose.
 */
export const HealthcheckTimeline = () => (
  <DiagramFrame caption="Probes run the whole time; the amber ones fall inside start_period — failures there are ignored, so a slow boot never trips the retry counter. Once the broker answers, normal counting begins.">
    <div className="flex items-center justify-between">
      <span className="ds-eyebrow text-[10px]">probe timeline</span>
      <span className="ds-eyebrow text-[10px] text-accent-orange">
        start_period 20s
      </span>
    </div>

    <div className="mt-5">
      <ol className="flex items-stretch justify-between gap-1">
        {PROBES.map((probe) => (
          <li
            className="flex flex-1 flex-col items-center gap-1.5"
            key={probe.at}
          >
            {/*
             * Every probe's circle sits in an equally-sized box so the row stays
             * aligned; only the shielded probes light theirs up. Wrapping the
             * circle (rather than overlaying the column) keeps the dashed box
             * centred on the cross both horizontally and vertically.
             */}
            <div
              className={cn(
                "rounded-lg border border-transparent p-2",
                probe.shielded &&
                  "border-accent-orange/40 border-dashed bg-accent-orange/[0.06]"
              )}
            >
              <span
                className={cn(
                  "flex size-7 items-center justify-center rounded-full border",
                  probe.ok
                    ? "border-accent-green/50 text-accent-green"
                    : "border-accent-orange/50 text-accent-orange"
                )}
              >
                {probe.ok ? (
                  <Check className="size-4" />
                ) : (
                  <X className="size-4" />
                )}
              </span>
            </div>
            <span className="font-mono text-[10px] text-muted-foreground">
              {probe.at}
            </span>
            <span
              className={cn(
                "font-mono text-[9px] leading-none",
                probe.shielded ? "text-accent-orange" : "text-accent-green"
              )}
            >
              {probe.shielded ? "shielded" : "counts"}
            </span>
          </li>
        ))}
      </ol>
    </div>

    <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-1 border-border border-t pt-3 font-mono text-[11px]">
      <span className="text-muted-foreground">container started</span>
      <ArrowRight className="size-3 text-muted-foreground" />
      <span className="text-accent-orange">booting (probes fail, ignored)</span>
      <ArrowRight className="size-3 text-muted-foreground" />
      <span className="text-accent-green">ready · healthcheck green</span>
    </div>
  </DiagramFrame>
);

/**
 * The cross-service payoff of "started vs ready". A dependent service wired with
 * `service_started` is released the instant the broker process exists — before it
 * can serve — so its first call races a half-booted broker. `service_healthy`
 * blocks until the probe is green. This is the generic Compose pattern: Pulse
 * dropped its one artificial edge in foundations/02, so its first real consumers
 * are where `service_healthy` will earn its keep — not a live edge it has today.
 */
export const DependsOnRace = () => (
  <DiagramFrame caption="Both wire a service behind the broker. service_started releases it the moment the broker process exists — before it can serve — so the first call races a half-booted broker. service_healthy waits for the green probe. Same dependency, one race condition apart.">
    <div className="flex flex-col gap-1.5">
      <span className="ds-eyebrow text-[10px] text-accent-orange">
        depends_on: service_started — races the boot
      </span>
      <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
        <FlowBox mono tone="orange">
          <Database className="size-4" />
          broker · still booting
        </FlowBox>
        <Connector label="starts now" />
        <FlowBox mono tone="ink">
          <Box className="size-4" />
          consumer
        </FlowBox>
        <Connector label="first call" />
        <FlowBox mono tone="orange">
          <X className="size-4" />
          connection refused
        </FlowBox>
      </div>
    </div>

    <div className="mt-5 flex flex-col gap-1.5 border-border border-t pt-5">
      <span className="ds-eyebrow text-[10px] text-accent-green">
        depends_on: service_healthy — waits for ready
      </span>
      <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
        <FlowBox mono tone="green">
          <Database className="size-4" />
          broker · probe green
        </FlowBox>
        <Connector label="waits" />
        <FlowBox mono tone="ink">
          <Box className="size-4" />
          consumer
        </FlowBox>
        <Connector label="first call" />
        <FlowBox mono tone="green">
          <Check className="size-4" />
          connected
        </FlowBox>
      </div>
    </div>
  </DiagramFrame>
);

/* ------------------------------------------------------------------ */
/* Named volumes — the container is ephemeral, the volume persists.     */
/* ------------------------------------------------------------------ */

/**
 * Two Postgres containers across a restart mount the *same* named volume. The
 * container is throwaway; the data lives in the volume, which outlives it. The
 * one dangerous switch — `down -v` — is what actually deletes the volume.
 */
export const VolumePersistence = () => (
  <DiagramFrame caption="The container is disposable; the data lives in the volume beneath it. docker compose down replaces the container and keeps the volume. Only down -v deletes the data.">
    <div className="grid grid-cols-2 gap-4">
      <div className="flex flex-col items-center gap-1.5">
        <span className="ds-eyebrow text-[10px]">before restart</span>
        <FlowBox mono tone="neutral">
          <Box className="size-4" />
          postgres (v1)
        </FlowBox>
      </div>
      <div className="flex flex-col items-center gap-1.5">
        <span className="ds-eyebrow text-[10px]">after restart</span>
        <FlowBox mono tone="ink">
          <Box className="size-4" />
          postgres (v2)
        </FlowBox>
      </div>
    </div>

    <div className="my-2 flex justify-center font-mono text-[10px] text-muted-foreground">
      both mount ↓ the same volume ↓
    </div>

    <div className="flex items-center justify-center gap-2 rounded-xl border border-accent-green/40 bg-accent-green/[0.05] px-4 py-3 text-accent-green text-sm">
      <HardDrive className="size-4" />
      <span className="font-mono text-xs">
        postgres_data — persists across restarts
      </span>
    </div>

    <div className="mt-4 grid grid-cols-2 gap-3 font-mono text-xs">
      <div className="flex items-center gap-2 rounded-lg border border-accent-green/40 px-3 py-2 text-accent-green">
        <Check className="size-3.5 shrink-0" />
        <span>
          <span className="font-medium">down</span> — volume kept
        </span>
      </div>
      <div className="flex items-center gap-2 rounded-lg border border-destructive/40 px-3 py-2 text-destructive">
        <Trash2 className="size-3.5 shrink-0" />
        <span>
          <span className="font-medium">down -v</span> — volume wiped
        </span>
      </div>
    </div>
  </DiagramFrame>
);

/* ------------------------------------------------------------------ */
/* Auto topic creation — the convenience and the matching footgun.      */
/* ------------------------------------------------------------------ */

/**
 * Producing to an unknown topic silently creates it. Locally that is one fewer
 * ceremony; in production the *same* behaviour turns a typo into a phantom topic
 * that no consumer reads — the failure surfaces later, far from its cause.
 */
export const AutoTopicFlow = () => (
  <DiagramFrame caption="A produce to a name that doesn't exist creates the topic with default settings. Handy locally; in production a typo becomes a silent phantom topic, so real clusters turn auto-creation off.">
    <div className="flex flex-col gap-1.5">
      <span className="ds-eyebrow text-[10px] text-accent-green">
        the convenience
      </span>
      <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
        <FlowBox mono tone="neutral">
          <Send className="size-4" />
          produce → pulse.smoke.test
        </FlowBox>
        <Connector label="unknown" />
        <FlowBox mono tone="ink">
          <Database className="size-4" />
          broker
        </FlowBox>
        <Connector label="auto-create" />
        <FlowBox mono tone="green">
          <Check className="size-4" />
          topic exists
        </FlowBox>
      </div>
    </div>

    <div className="mt-5 flex flex-col gap-1.5 border-border border-t pt-5">
      <span className="ds-eyebrow text-[10px] text-accent-orange">
        the footgun
      </span>
      <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
        <FlowBox mono tone="orange">
          <Send className="size-4" />
          produce → chat.mesages.v1
        </FlowBox>
        <Connector label="typo" />
        <FlowBox mono tone="ink">
          <Database className="size-4" />
          broker
        </FlowBox>
        <Connector label="auto-create" />
        <FlowBox mono tone="orange">
          <X className="size-4" />
          phantom topic · no consumer
        </FlowBox>
      </div>
    </div>
  </DiagramFrame>
);

/* ------------------------------------------------------------------ */
/* Explicit provisioning — the 1-partition mirage vs the real contract. */
/* ------------------------------------------------------------------ */

interface ChannelKey {
  dot: string;
  /** Illustrative partition under the 6-partition contract (toy placement). */
  grown: number;
  key: string;
  ring: string;
}

/**
 * Four channel keys. `grown` is where each lands once the topic is provisioned
 * at its contracted six partitions — a toy placement (not real murmur2), but it
 * makes the lesson exact: three of the four leave P0, so anything written while
 * the topic was a 1-partition default is now in the wrong place.
 */
const CHANNEL_KEYS: ChannelKey[] = [
  {
    key: "alices-channel",
    dot: "bg-accent-blue",
    ring: "border-accent-blue/50 text-accent-blue",
    grown: 0,
  },
  {
    key: "danas-channel",
    dot: "bg-accent-purple",
    ring: "border-accent-purple/50 text-accent-purple",
    grown: 1,
  },
  {
    key: "bobs-channel",
    dot: "bg-accent-green",
    ring: "border-accent-green/50 text-accent-green",
    grown: 3,
  },
  {
    key: "carols-channel",
    dot: "bg-accent-orange",
    ring: "border-accent-orange/50 text-accent-orange",
    grown: 5,
  },
];

const SIX_PARTITIONS = [0, 1, 2, 3, 4, 5];

const KeyChip = ({ channel }: { channel: ChannelKey }) => (
  <span
    className={cn(
      "inline-flex items-center gap-1.5 rounded-pill border bg-transparent px-2 py-0.5 font-mono text-[10px]",
      channel.ring
    )}
  >
    <span className={cn("size-1.5 rounded-full", channel.dot)} />
    {channel.key}
  </span>
);

/**
 * The headline trap. Auto-create hands you a 1-partition topic where every key
 * funnels into P0 — so ordering looks flawless because there's nowhere else to
 * go. Provision the contracted six and the same keys rehash across them, so the
 * topic born at the wrong count isn't a smaller copy of the real one: it's a
 * different topic whose keys all need re-homing. A migration, not a config edit.
 */
export const PartitionContractTrap = () => (
  <DiagramFrame caption="Toy key placement, but the lesson is exact: a topic auto-created at one partition isn't a smaller copy of the contracted one — it's a different topic whose keys all live in P0. Provision the six partitions the design calls for and the same keys rehash across them, so everything already written to P0 is now in the wrong place. That's a migration, not a config edit.">
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="ds-eyebrow text-[10px] text-accent-orange">
            auto-created · 1 partition
          </span>
          <span className="font-mono text-[10px] text-accent-orange">
            the mirage
          </span>
        </div>
        <div className="flex flex-1 flex-col gap-2 rounded-xl border border-accent-orange/40 p-3">
          <div className="flex items-center justify-between font-mono text-[10px] text-muted-foreground">
            <span>P0</span>
            <span>{CHANNEL_KEYS.length}</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {CHANNEL_KEYS.map((c) => (
              <KeyChip channel={c} key={c.key} />
            ))}
          </div>
          <p className="mt-1 font-mono text-[10px] text-accent-orange leading-relaxed">
            looks perfectly ordered — because there's nowhere else to go
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="ds-eyebrow text-[10px] text-accent-green">
            contracted · 6 partitions
          </span>
          <span className="font-mono text-[10px] text-accent-green">
            the real topic
          </span>
        </div>
        <div className="flex flex-1 flex-col gap-1.5 rounded-xl border border-accent-green/40 p-3">
          {SIX_PARTITIONS.map((p) => {
            const here = CHANNEL_KEYS.filter((c) => c.grown === p);
            return (
              <div className="flex items-center gap-2" key={p}>
                <span className="w-6 shrink-0 font-mono text-[10px] text-muted-foreground">
                  P{p}
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {here.length > 0 ? (
                    here.map((c) => <KeyChip channel={c} key={c.key} />)
                  ) : (
                    <span className="font-mono text-[10px] text-muted-foreground/40">
                      —
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  </DiagramFrame>
);

/* ------------------------------------------------------------------ */
/* KRaft — the controller's job, and where its metadata lives.          */
/* ------------------------------------------------------------------ */

const BROKERS = [1, 2, 3];

/** A broker node; the controller wears a crown and the electric-yellow accent. */
const BrokerChip = ({
  id,
  controller = false,
}: {
  controller?: boolean;
  id: number;
}) => (
  <div
    className={cn(
      "flex flex-col items-center gap-1 rounded-lg border bg-transparent px-2 py-2 text-center font-mono text-[11px]",
      controller
        ? "border-electric-yellow/60 text-yellow-ink dark:text-electric-yellow"
        : "border-border text-muted-foreground"
    )}
  >
    {controller ? <Crown className="size-4" /> : <Server className="size-4" />}
    broker {id}
    {controller ? (
      <span className="font-medium text-[9px] uppercase tracking-wider">
        controller
      </span>
    ) : null}
  </div>
);

const CONTROLLER_BOOKS = [
  "which brokers are alive right now",
  "every topic and its partitions",
  "the leader of each partition",
];

/**
 * Before the ZooKeeper-vs-KRaft contrast even makes sense, the reader needs the
 * job itself: one node in the cluster keeps the authoritative books. This figure
 * names that node (the controller) and lists exactly what it tracks.
 */
export const ControllerRole = () => (
  <DiagramFrame caption="Every Kafka cluster elects one broker as the controller — the node that keeps the authoritative books. Lose track of who's alive or who leads a partition and the cluster can't route a single message.">
    <span className="ds-eyebrow text-[10px]">the cluster</span>
    <div className="mt-2 grid grid-cols-3 gap-2">
      {BROKERS.map((id) => (
        <BrokerChip controller={id === 1} id={id} key={id} />
      ))}
    </div>

    <div className="my-3 flex justify-center font-mono text-[10px] text-muted-foreground">
      broker 1 keeps ↓
    </div>

    <ul className="flex flex-col gap-1.5 rounded-xl border border-electric-yellow/40 bg-yellow-tint p-3 dark:border-electric-yellow/20 dark:bg-electric-yellow/[0.06]">
      <li className="flex items-center gap-2 font-mono text-[11px] text-yellow-ink dark:text-electric-yellow">
        <ListChecks className="size-3.5 shrink-0" />
        the cluster's metadata
      </li>
      {CONTROLLER_BOOKS.map((book) => (
        <li
          className="flex items-center gap-2 pl-1 text-foreground/80 text-xs"
          key={book}
        >
          <Check className="size-3 shrink-0 text-accent-green" />
          {book}
        </li>
      ))}
    </ul>
  </DiagramFrame>
);

/**
 * The headline before/after: where cluster metadata physically lives. Old Kafka
 * parked it in a separate ZooKeeper ensemble — a second distributed system to
 * operate. KRaft folds it into a Raft-replicated log inside the brokers. This
 * depicts the two ways Kafka *can* run; Pulse runs the right-hand model (with a
 * single broker), so neither side is claimed as Pulse's live topology.
 */
export const KraftVsZookeeper = () => (
  <DiagramFrame caption="Old Kafka kept the metadata in a separate ZooKeeper ensemble — a whole second system to deploy and operate. KRaft moves it into a Raft-replicated log inside the brokers: one system instead of two. Pulse runs KRaft from day one.">
    <div className="grid gap-4 sm:grid-cols-2">
      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="ds-eyebrow text-[10px]">before · zookeeper</span>
          <span className="font-mono text-[10px] text-accent-orange">
            two systems
          </span>
        </div>
        <div className="flex flex-1 flex-col gap-2 rounded-xl border border-border p-3">
          <div className="grid grid-cols-3 gap-1.5">
            {BROKERS.map((id) => (
              <BrokerChip id={id} key={id} />
            ))}
          </div>
          <div className="flex justify-center font-mono text-[10px] text-muted-foreground">
            ↕ metadata over the network
          </div>
          <div className="flex items-center justify-center gap-2 rounded-lg border border-accent-orange/50 px-3 py-2.5 text-accent-orange">
            <Users className="size-4 shrink-0" />
            <span className="font-mono text-[11px]">
              ZooKeeper ensemble — the clerk
            </span>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <div className="flex items-center justify-between">
          <span className="ds-eyebrow text-[10px]">now · kraft</span>
          <span className="font-mono text-[10px] text-accent-green">
            one system
          </span>
        </div>
        <div className="flex flex-1 flex-col gap-2 rounded-xl border border-accent-green/40 p-3">
          <div className="grid grid-cols-3 gap-1.5">
            {BROKERS.map((id) => (
              <BrokerChip controller={id === 1} id={id} key={id} />
            ))}
          </div>
          <div className="flex justify-center font-mono text-[10px] text-muted-foreground">
            ↕ replicated among the brokers
          </div>
          <div className="flex items-center justify-center gap-2 rounded-lg border border-accent-green/50 px-3 py-2.5 text-accent-green">
            <ScrollText className="size-4 shrink-0" />
            <span className="font-mono text-[11px]">
              internal Raft metadata log
            </span>
          </div>
        </div>
      </div>
    </div>
  </DiagramFrame>
);

/* ------------------------------------------------------------------ */
/* Transactional outbox — two planes: one atomic write, one async relay.*/
/* ------------------------------------------------------------------ */

/**
 * The outbox's whole shape in one figure. The request path commits the state
 * change AND the event row in a single Postgres transaction, then returns — it
 * never touches Kafka. A separate relay polls the unpublished rows and delivers
 * them. Splitting the diagram into two planes is the lesson: the request can't
 * fail because Kafka is slow, and the event can't be lost because it committed
 * with the state. This is the live `identity → Postgres → Kafka` path today.
 */
export const OutboxFlow = () => (
  <DiagramFrame caption="One transaction commits the stream, the is_live flag, and the event row together — then the handler returns. A separate relay drains unpublished rows to Kafka and marks them done. The request path never waits on Kafka; the event can never outlive a rolled-back write.">
    <div className="flex flex-col gap-1.5">
      <span className="ds-eyebrow text-[10px] text-accent-green">
        the request path · one transaction
      </span>
      <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
        <FlowBox mono tone="neutral">
          <Send className="size-4" />
          POST /go-live
        </FlowBox>
        <Connector label="BEGIN" />
        <FlowBox mono tone="green">
          <Database className="size-4" />
          <span className="leading-snug">
            streams + channels.is_live
            <br />+ outbox row
          </span>
        </FlowBox>
        <Connector label="COMMIT" />
        <FlowBox mono tone="ink">
          <Check className="size-4" />
          200 streamId
        </FlowBox>
      </div>
    </div>

    <div className="mt-5 flex flex-col gap-1.5 border-border border-t pt-5">
      <span className="ds-eyebrow text-[10px] text-electric-yellow">
        the delivery path · async relay
      </span>
      <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center">
        <FlowBox mono tone="neutral">
          <Inbox className="size-4" />
          <span className="leading-snug">
            outbox WHERE
            <br />
            published_at IS NULL
          </span>
        </FlowBox>
        <Connector label="poll 500ms" />
        <FlowBox mono tone="ink">
          <Radio className="size-4" />
          stream.started.v1
        </FlowBox>
        <Connector label="on ack" />
        <FlowBox mono tone="green">
          <Check className="size-4" />
          set published_at
        </FlowBox>
      </div>
    </div>
  </DiagramFrame>
);

/* ------------------------------------------------------------------ */
/* Smoke test — the run-it-yourself ladder for the identity pipeline.   */
/* ------------------------------------------------------------------ */

interface Rung {
  cmd: string;
  icon: LucideIcon;
  /** The payoff rung — the decoded event arriving — wears the yellow accent. */
  payoff?: boolean;
  /** The proof the step prints — what tells you it actually worked. */
  proof: string;
  /** The system this command brings online or exercises. */
  system: string;
}

const RUNGS: Rung[] = [
  {
    cmd: "just infra-up",
    icon: Boxes,
    system: "Docker stack",
    proof: "4 containers, all healthy",
  },
  {
    cmd: "just schemas-publish",
    icon: FileCode,
    system: "Apicurio registry",
    proof: "5 Avro subjects registered",
  },
  {
    cmd: "just infra-topics",
    icon: Columns3,
    system: "Kafka topics",
    proof: "5 topics · 6 partitions each",
  },
  {
    cmd: "just identity-migrate",
    icon: Database,
    system: "Postgres",
    proof: "tables created · alice & bob seeded",
  },
  {
    cmd: "just identity-dev",
    icon: Server,
    system: "identity service",
    proof: "relay polling · :3100 live",
  },
  {
    cmd: "just identity-go-live alices-channel",
    icon: Send,
    system: "request path",
    proof: "200 · state + outbox row committed",
  },
  {
    cmd: "just identity-consume",
    icon: Braces,
    system: "Kafka → your terminal",
    proof: "StreamStarted prints, decoded",
    payoff: true,
  },
];

/**
 * The whole tutorial as one glanceable stepper: each `just` recipe, the system
 * it brings online, and the proof it prints. It's the race engineer's telemetry
 * check — bring each channel up, confirm its signal, and only the last rung (the
 * decoded event landing in your terminal) is the green light that the end-to-end
 * pipeline is real. Static by design: the dynamics live in the interactive
 * `OutboxLab` on the outbox concept page; this is the operator's runbook map.
 */
export const SmokeTestLadder = () => (
  <DiagramFrame caption="Seven commands, top to bottom. Each brings one system online and prints its own proof — so when a run breaks, you know exactly which rung failed. infra-topics is non-optional now that auto-create is off: skip it and go-live produces to a topic that doesn't exist. The last rung is the only one that proves the whole chain: a real event, decoded, in your terminal.">
    <ol className="flex flex-col gap-2">
      {RUNGS.map((rung) => {
        const Icon = rung.icon;
        return (
          <li
            className={cn(
              "flex flex-col gap-3 rounded-xl border p-3.5 sm:flex-row sm:items-center sm:gap-4",
              rung.payoff
                ? "border-electric-yellow/50 bg-yellow-tint dark:border-electric-yellow/25 dark:bg-electric-yellow/[0.06]"
                : "border-border"
            )}
            key={rung.cmd}
          >
            <div className="flex min-w-0 items-center gap-3 sm:basis-1/2">
              <span
                className={cn(
                  "flex size-6 shrink-0 items-center justify-center rounded-md border font-mono text-[11px]",
                  rung.payoff
                    ? "border-electric-yellow/60 text-yellow-ink dark:text-electric-yellow"
                    : "border-border text-muted-foreground"
                )}
              >
                {RUNGS.indexOf(rung) + 1}
              </span>
              <code className="truncate font-mono text-foreground text-xs">
                {rung.cmd}
              </code>
            </div>

            <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground sm:basis-1/4">
              <Icon className="size-3.5 shrink-0" />
              <span className="truncate">{rung.system}</span>
            </div>

            <div
              className={cn(
                "flex items-center gap-1.5 font-mono text-[11px] sm:basis-1/4 sm:justify-end",
                rung.payoff
                  ? "text-yellow-ink dark:text-electric-yellow"
                  : "text-accent-green"
              )}
            >
              <Check className="size-3.5 shrink-0" />
              <span>{rung.proof}</span>
            </div>
          </li>
        );
      })}
    </ol>
  </DiagramFrame>
);

interface Quorum {
  id: string;
  majority: number;
  pulse?: boolean;
  tolerates: number;
  voters: number;
}

const QUORUMS: Quorum[] = [
  { id: "q1", voters: 1, majority: 1, tolerates: 0, pulse: true },
  { id: "q3", voters: 3, majority: 2, tolerates: 1 },
  { id: "q5", voters: 5, majority: 3, tolerates: 2 },
];

/** The voter dots for one quorum row — filled ones are the majority needed. */
const voterDots = (q: Quorum) =>
  Array.from({ length: q.voters }, (_, i) => ({
    dotId: `${q.id}-${i}`,
    inMajority: i < q.majority,
  }));

/**
 * The fault-tolerance dial. Raft commits a metadata change only when a majority
 * of voters agree, so a quorum survives losing fewer than half its voters. Pulse
 * runs a single voter — instant, unopposed election, zero tolerance — and that's
 * the honest build state. Deliberately *static*: `AGENTS.md` forbids animating
 * the multi-voter cluster Pulse doesn't run, so the figure explains the dial
 * without pretending the larger quorum is live.
 */
export const QuorumFaultTolerance = () => (
  <DiagramFrame caption="Raft commits a metadata change only once a majority of voters agree, so a quorum survives losing fewer than half of them. Pulse runs a single voter: the majority is one, the election is instant, and it tolerates zero failures. Growing the voter list is the only change needed — the mechanism is identical.">
    <div className="flex flex-col gap-2.5">
      {QUORUMS.map((q) => (
        <div
          className={cn(
            "flex flex-col gap-2 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between",
            q.pulse
              ? "border-electric-yellow/50 bg-yellow-tint dark:bg-electric-yellow/[0.06]"
              : "border-border"
          )}
          key={q.id}
        >
          <div className="flex items-center gap-3">
            <div className="flex gap-1">
              {voterDots(q).map((dot) => (
                <span
                  className={cn(
                    "flex size-6 items-center justify-center rounded-full border",
                    dot.inMajority
                      ? "border-accent-green/60 text-accent-green"
                      : "border-border text-muted-foreground"
                  )}
                  key={dot.dotId}
                >
                  {dot.inMajority ? <Check className="size-3" /> : null}
                </span>
              ))}
            </div>
            <span className="font-mono text-foreground text-sm">
              {q.voters} voter{q.voters > 1 ? "s" : ""}
            </span>
            {q.pulse ? (
              <span className="rounded-pill border border-electric-yellow/60 px-2 py-0.5 font-mono text-[10px] text-yellow-ink uppercase tracking-wider dark:text-electric-yellow">
                Pulse
              </span>
            ) : null}
          </div>
          <div className="flex gap-4 font-mono text-[11px] text-muted-foreground">
            <span>majority {q.majority}</span>
            <span>
              tolerates {q.tolerates} failure{q.tolerates === 1 ? "" : "s"}
            </span>
          </div>
        </div>
      ))}
    </div>
  </DiagramFrame>
);
