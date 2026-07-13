import {
  IconArrowRight,
  IconBox,
  IconBoxMultiple,
  IconBraces,
  IconBroadcast,
  IconCheck,
  IconColumns3,
  IconCrown,
  IconDatabase,
  IconDeviceFloppy,
  IconFileCode,
  IconHash,
  IconInbox,
  IconKey,
  IconListCheck,
  IconMessage,
  IconRubberStamp,
  IconScript,
  IconSend,
  IconServer,
  IconShare2,
  IconTrash,
  IconUsers,
  IconWifi,
  IconWifiOff,
  IconX,
  type TablerIcon,
} from "@tabler/icons-react";
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
  /** Go blue — the per-technology accent (ADR-0020), for /go-tier figures. */
  blue: "border-go-blue/50 text-go-ink dark:text-go-blue",
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
    <IconArrowRight className="size-5 rotate-90 sm:rotate-0" />
    {label ? (
      <span className="font-mono text-[10px] leading-none">{label}</span>
    ) : null}
  </div>
);

/* ------------------------------------------------------------------ */
/* Healthchecks — the start_period grace window on a probe timeline.    */
/* ------------------------------------------------------------------ */

type Probe = {
  at: string;
  ok: boolean;
  shielded: boolean;
};

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
                  <IconCheck className="size-4" />
                ) : (
                  <IconX className="size-4" />
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
      <IconArrowRight className="size-3 text-muted-foreground" />
      <span className="text-accent-orange">booting (probes fail, ignored)</span>
      <IconArrowRight className="size-3 text-muted-foreground" />
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
          <IconDatabase className="size-4" />
          broker · still booting
        </FlowBox>
        <Connector label="starts now" />
        <FlowBox mono tone="ink">
          <IconBox className="size-4" />
          consumer
        </FlowBox>
        <Connector label="first call" />
        <FlowBox mono tone="orange">
          <IconX className="size-4" />
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
          <IconDatabase className="size-4" />
          broker · probe green
        </FlowBox>
        <Connector label="waits" />
        <FlowBox mono tone="ink">
          <IconBox className="size-4" />
          consumer
        </FlowBox>
        <Connector label="first call" />
        <FlowBox mono tone="green">
          <IconCheck className="size-4" />
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
          <IconBox className="size-4" />
          postgres (v1)
        </FlowBox>
      </div>
      <div className="flex flex-col items-center gap-1.5">
        <span className="ds-eyebrow text-[10px]">after restart</span>
        <FlowBox mono tone="ink">
          <IconBox className="size-4" />
          postgres (v2)
        </FlowBox>
      </div>
    </div>

    <div className="my-2 flex justify-center font-mono text-[10px] text-muted-foreground">
      both mount ↓ the same volume ↓
    </div>

    <div className="flex items-center justify-center gap-2 rounded-xl border border-accent-green/40 bg-accent-green/[0.05] px-4 py-3 text-accent-green text-sm">
      <IconDeviceFloppy className="size-4" />
      <span className="font-mono text-xs">
        postgres_data — persists across restarts
      </span>
    </div>

    <div className="mt-4 grid grid-cols-2 gap-3 font-mono text-xs">
      <div className="flex items-center gap-2 rounded-lg border border-accent-green/40 px-3 py-2 text-accent-green">
        <IconCheck className="size-3.5 shrink-0" />
        <span>
          <span className="font-medium">down</span> — volume kept
        </span>
      </div>
      <div className="flex items-center gap-2 rounded-lg border border-destructive/40 px-3 py-2 text-destructive">
        <IconTrash className="size-3.5 shrink-0" />
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
          <IconSend className="size-4" />
          produce → pulse.smoke.test
        </FlowBox>
        <Connector label="unknown" />
        <FlowBox mono tone="ink">
          <IconDatabase className="size-4" />
          broker
        </FlowBox>
        <Connector label="auto-create" />
        <FlowBox mono tone="green">
          <IconCheck className="size-4" />
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
          <IconSend className="size-4" />
          produce → chat.mesages.v1
        </FlowBox>
        <Connector label="typo" />
        <FlowBox mono tone="ink">
          <IconDatabase className="size-4" />
          broker
        </FlowBox>
        <Connector label="auto-create" />
        <FlowBox mono tone="orange">
          <IconX className="size-4" />
          phantom topic · no consumer
        </FlowBox>
      </div>
    </div>
  </DiagramFrame>
);

/* ------------------------------------------------------------------ */
/* Explicit provisioning — the 1-partition mirage vs the real contract. */
/* ------------------------------------------------------------------ */

type ChannelKey = {
  dot: string;
  /** Illustrative partition under the 6-partition contract (toy placement). */
  grown: number;
  key: string;
  ring: string;
};

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
    {controller ? (
      <IconCrown className="size-4" />
    ) : (
      <IconServer className="size-4" />
    )}
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
        <IconListCheck className="size-3.5 shrink-0" />
        the cluster's metadata
      </li>
      {CONTROLLER_BOOKS.map((book) => (
        <li
          className="flex items-center gap-2 pl-1 text-foreground/80 text-xs"
          key={book}
        >
          <IconCheck className="size-3 shrink-0 text-accent-green" />
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
            <IconUsers className="size-4 shrink-0" />
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
            <IconScript className="size-4 shrink-0" />
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
          <IconSend className="size-4" />
          POST /go-live
        </FlowBox>
        <Connector label="BEGIN" />
        <FlowBox mono tone="green">
          <IconDatabase className="size-4" />
          <span className="leading-snug">
            streams + channels.is_live
            <br />+ outbox row
          </span>
        </FlowBox>
        <Connector label="COMMIT" />
        <FlowBox mono tone="ink">
          <IconCheck className="size-4" />
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
          <IconInbox className="size-4" />
          <span className="leading-snug">
            outbox WHERE
            <br />
            published_at IS NULL
          </span>
        </FlowBox>
        <Connector label="poll 500ms" />
        <FlowBox mono tone="ink">
          <IconBroadcast className="size-4" />
          stream.started.v1
        </FlowBox>
        <Connector label="on ack" />
        <FlowBox mono tone="green">
          <IconCheck className="size-4" />
          set published_at
        </FlowBox>
      </div>
    </div>
  </DiagramFrame>
);

/* ------------------------------------------------------------------ */
/* Smoke test — the run-it-yourself ladder for the identity pipeline.   */
/* ------------------------------------------------------------------ */

type Rung = {
  cmd: string;
  icon: TablerIcon;
  /** The payoff rung — the decoded event arriving — wears the yellow accent. */
  payoff?: boolean;
  /** The proof the step prints — what tells you it actually worked. */
  proof: string;
  /** The system this command brings online or exercises. */
  system: string;
};

const RUNGS: Rung[] = [
  {
    cmd: "just infra-up",
    icon: IconBoxMultiple,
    system: "Docker stack",
    proof: "4 containers, all healthy",
  },
  {
    cmd: "just schemas-publish",
    icon: IconFileCode,
    system: "Apicurio registry",
    proof: "5 Avro subjects registered",
  },
  {
    cmd: "just infra-topics",
    icon: IconColumns3,
    system: "Kafka topics",
    proof: "5 topics · 6 partitions each",
  },
  {
    cmd: "just identity-migrate",
    icon: IconDatabase,
    system: "Postgres",
    proof: "tables created · alice & bob seeded",
  },
  {
    cmd: "just identity-dev",
    icon: IconServer,
    system: "identity service",
    proof: "relay polling · :3100 live",
  },
  {
    cmd: "just identity-go-live alices-channel",
    icon: IconSend,
    system: "request path",
    proof: "200 · state + outbox row committed",
  },
  {
    cmd: "just identity-consume",
    icon: IconBraces,
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
              <IconCheck className="size-3.5 shrink-0" />
              <span>{rung.proof}</span>
            </div>
          </li>
        );
      })}
    </ol>
  </DiagramFrame>
);

type Quorum = {
  id: string;
  majority: number;
  pulse?: boolean;
  tolerates: number;
  voters: number;
};

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
                  {dot.inMajority ? <IconCheck className="size-3" /> : null}
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

/* ------------------------------------------------------------------ */
/* Server-authored events — client sends a body; the gateway stamps.    */
/* ------------------------------------------------------------------ */

type StampedField = {
  detail: string;
  field: string;
};

const STAMPED_FIELDS: StampedField[] = [
  { field: "messageId", detail: "server-minted UUIDv7" },
  { field: "userId", detail: "the connection's account — never the client's" },
  { field: "channelId + streamId", detail: "the wristband, captured at join" },
  { field: "sentAt", detail: "server receipt time — never a client clock" },
];

/**
 * The server-authored invariant in one figure. The client's WS frame carries a
 * single field — `body`. The gateway stamps every other field onto the event
 * before it ever reaches Kafka, so authorship can't be forged and a message
 * can't be backdated. `channelId`/`streamId` come from the "wristband" captured
 * at join time (the connection remembers which channel it joined), not a per-
 * message lookup.
 */
export const ServerAuthoredStamp = () => (
  <DiagramFrame caption="The client's whole contribution is body. The gateway stamps identity, timing, and the channel/stream the socket joined (its wristband) — so the event is the server's testimony, not the client's claim. Nothing the client sends can forge a userId or backdate a message.">
    <div className="flex flex-col items-stretch gap-3 lg:flex-row lg:items-center">
      <FlowBox mono tone="neutral">
        <IconMessage className="size-4" />
        <span className="leading-snug">
          client frame
          <br />
          {'{ body: "gg" }'}
        </span>
      </FlowBox>

      <Connector label="WS frame" />

      <div className="flex flex-1 flex-col gap-2 rounded-xl border border-electric-yellow/40 bg-yellow-tint p-3 dark:border-electric-yellow/25 dark:bg-electric-yellow/[0.06]">
        <span className="flex items-center gap-1.5 font-mono text-[10px] text-yellow-ink uppercase tracking-wider dark:text-electric-yellow">
          <IconRubberStamp className="size-3.5" />
          the gateway stamps
        </span>
        <ul className="flex flex-col gap-1">
          {STAMPED_FIELDS.map((f) => (
            <li className="flex items-baseline gap-2 text-xs" key={f.field}>
              <code className="shrink-0 font-mono text-foreground">
                {f.field}
              </code>
              <span className="text-[11px] text-muted-foreground leading-snug">
                {f.detail}
              </span>
            </li>
          ))}
        </ul>
      </div>

      <Connector label="produce" />

      <FlowBox mono tone="green">
        <IconBroadcast className="size-4" />
        <span className="leading-snug">
          ChatMessageSent
          <br />
          chat.messages.v1
        </span>
      </FlowBox>
    </div>
  </DiagramFrame>
);

/* ------------------------------------------------------------------ */
/* The log & offsets — append-only cells, independent reader cursors.    */
/* ------------------------------------------------------------------ */

type LogReader = {
  at: number;
  label: string;
  tone: "green" | "orange";
};

const LOG_CELLS = ["m0", "m1", "m2", "m3", "m4", "m5"];
const LOG_READERS: LogReader[] = [
  { label: "live tail", at: 5, tone: "green" },
  { label: "replay from start", at: 1, tone: "orange" },
];

/**
 * Why Kafka is a log, not a queue. The producer only ever appends at the tail;
 * nothing is removed on read. Each reader keeps its *own* offset cursor, so two
 * consumers sit at different places in the same log — one at the live tail,
 * another replaying from the start — without disturbing each other. Reading is
 * just advancing your cursor; "replay" is moving it back.
 */
export const LogWithOffsets = () => (
  <DiagramFrame caption="A queue deletes on read; a log doesn't. The producer appends at the tail, and every reader carries its own offset — so a fresh consumer can replay from offset 0 while a caught-up one sits at the tail, reading the very same records. That independence is exactly what lets chat rebuild its state from the beginning at every boot.">
    <div className="flex items-center justify-between">
      <span className="ds-eyebrow text-[10px]">
        chat.messages.v1 · partition 2
      </span>
      <span className="flex items-center gap-1.5 font-mono text-[10px] text-accent-green">
        <IconSend className="size-3.5" />
        append-only →
      </span>
    </div>

    <div className="mt-4 flex gap-1.5">
      {LOG_CELLS.map((cell, i) => (
        <div className="flex flex-1 flex-col items-center gap-1" key={cell}>
          <div className="flex h-10 w-full items-center justify-center rounded-lg border border-border bg-muted/30 font-mono text-foreground text-xs">
            {cell}
          </div>
          <span className="font-mono text-[10px] text-muted-foreground">
            {i}
          </span>
        </div>
      ))}
    </div>

    <div className="mt-4 flex flex-col gap-2 border-border border-t pt-3">
      {LOG_READERS.map((r) => (
        <div className="flex items-center gap-3" key={r.label}>
          <span
            className={cn(
              "flex items-center gap-1.5 rounded-pill border px-2 py-0.5 font-mono text-[10px]",
              r.tone === "green"
                ? "border-accent-green/50 text-accent-green"
                : "border-accent-orange/50 text-accent-orange"
            )}
          >
            <IconScript className="size-3" />
            {r.label}
          </span>
          <span className="font-mono text-[10px] text-muted-foreground">
            offset = {r.at}
          </span>
        </div>
      ))}
    </div>
  </DiagramFrame>
);

/* ------------------------------------------------------------------ */
/* Partitions & ordering — one key, one partition, co-partitioned types. */
/* ------------------------------------------------------------------ */

type KeyedEvent = {
  icon: TablerIcon;
  label: string;
  topic: string;
};

const ALICE_EVENTS: KeyedEvent[] = [
  { label: "ChatMessageSent", topic: "chat.messages.v1", icon: IconMessage },
  { label: "ViewerJoined", topic: "chat.presence.joined.v1", icon: IconUsers },
  { label: "StreamStarted", topic: "stream.started.v1", icon: IconBroadcast },
];

/**
 * The partition contract that makes chat work. Every event about alice's channel
 * — a message, a presence join, a lifecycle change, across *four different
 * topics* — is keyed by the same `channelId`, so murmur2 routes them all to the
 * same partition number. That co-partitioning is what gives a channel total
 * ordering and lets `analytics` join its streams later without a repartition.
 * A different channel hashes to a different partition; the two never interleave.
 */
export const CoPartitionRouting = () => (
  <DiagramFrame caption="Key by channelId and murmur2 sends every event about one channel — message, presence, lifecycle, across four topics — to the same partition number. Same partition means one ordered queue per channel, and it means analytics can join chat against stream-state later without shuffling data around. bob's channel hashes elsewhere; the two streams never cross.">
    <div className="grid gap-4 sm:grid-cols-[1fr_auto_auto]">
      <div className="flex flex-col gap-1.5">
        <span className="ds-eyebrow text-[10px] text-accent-blue">
          all keyed by alices-channelId
        </span>
        <div className="flex flex-col gap-1.5">
          {ALICE_EVENTS.map((e) => {
            const Icon = e.icon;
            return (
              <div
                className="flex items-center gap-2 rounded-lg border border-border px-3 py-2"
                key={e.label}
              >
                <Icon className="size-3.5 shrink-0 text-muted-foreground" />
                <span className="font-medium text-foreground text-xs">
                  {e.label}
                </span>
                <span className="ml-auto font-mono text-[10px] text-muted-foreground">
                  {e.topic}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex flex-row items-center justify-center gap-1 sm:flex-col">
        <span className="flex items-center gap-1 font-mono text-[10px] text-muted-foreground">
          <IconHash className="size-3" />
          murmur2
        </span>
        <IconArrowRight className="size-5 rotate-90 text-muted-foreground sm:rotate-0" />
      </div>

      <div className="flex items-center justify-center rounded-xl border border-accent-green/50 bg-accent-green/[0.05] px-5 py-3 text-accent-green">
        <div className="flex flex-col items-center gap-0.5">
          <IconKey className="size-4" />
          <span className="font-mono text-sm">P2</span>
          <span className="font-mono text-[9px] text-muted-foreground">
            one ordered channel
          </span>
        </div>
      </div>
    </div>
  </DiagramFrame>
);

/* ------------------------------------------------------------------ */
/* Consumer groups — replay the lifecycle log into a live-channel map.  */
/* ------------------------------------------------------------------ */

type LifecycleFold = {
  channel: string;
  kind: "started" | "ended";
};

const LIFECYCLE_LOG: LifecycleFold[] = [
  { channel: "alice", kind: "started" },
  { channel: "bob", kind: "started" },
  { channel: "alice", kind: "ended" },
  { channel: "carol", kind: "started" },
];

/**
 * How chat answers "is this channel live?" without ever asking identity. At
 * boot, it joins a *fresh, per-process* consumer group and replays
 * `stream.started.v1` / `stream.ended.v1` from the very beginning, folding each
 * event into an in-memory live-channel map. start adds, end removes — so after
 * the replay the map holds exactly the currently-live channels. It learned the
 * state from the log, not a synchronous call.
 */
export const LiveMapFromLog = () => (
  <DiagramFrame caption="A fresh consumer group each boot, auto.offset.reset=earliest: chat replays the whole lifecycle log and folds it down — StreamStarted adds a channel, StreamEnded removes it. What's left is the set of live channels, learned entirely from the log. No HTTP call to identity, ever — that decoupling is the whole point.">
    <div className="flex items-center justify-between">
      <span className="ds-eyebrow text-[10px]">
        group: chat-gateway-${"{host}"}-${"{boot}"}
      </span>
      <span className="font-mono text-[10px] text-muted-foreground">
        auto.offset.reset=earliest
      </span>
    </div>

    <div className="mt-4 flex flex-col items-stretch gap-3 lg:flex-row lg:items-center">
      <div className="flex flex-1 flex-col gap-1.5">
        <span className="font-mono text-[10px] text-muted-foreground">
          replay from offset 0 →
        </span>
        <div className="flex flex-col gap-1">
          {LIFECYCLE_LOG.map((e) => (
            <div
              className={cn(
                "flex items-center gap-2 rounded-lg border px-3 py-1.5 font-mono text-[11px]",
                e.kind === "started"
                  ? "border-accent-green/40 text-accent-green"
                  : "border-destructive/40 text-destructive"
              )}
              key={`${e.channel}-${e.kind}`}
            >
              {e.kind === "started" ? (
                <IconBroadcast className="size-3.5 shrink-0" />
              ) : (
                <IconX className="size-3.5 shrink-0" />
              )}
              <span>
                {e.kind === "started" ? "StreamStarted" : "StreamEnded"}
              </span>
              <span className="ml-auto text-muted-foreground">{e.channel}</span>
            </div>
          ))}
        </div>
      </div>

      <Connector label="fold" />

      <div className="flex flex-col gap-1.5 rounded-xl border border-accent-green/50 bg-accent-green/[0.05] p-3">
        <span className="flex items-center gap-1.5 font-mono text-[10px] text-accent-green uppercase tracking-wider">
          <IconListCheck className="size-3.5" />
          live-channel map
        </span>
        <div className="flex flex-wrap gap-1.5">
          {["bob", "carol"].map((c) => (
            <span
              className="rounded-pill border border-accent-green/50 px-2 py-0.5 font-mono text-[10px] text-accent-green"
              key={c}
            >
              {c} · live
            </span>
          ))}
          <span className="rounded-pill border border-border border-dashed px-2 py-0.5 font-mono text-[10px] text-muted-foreground line-through">
            alice
          </span>
        </div>
      </div>
    </div>
  </DiagramFrame>
);

/* ------------------------------------------------------------------ */
/* WebSocket fan-out — best-effort live push, the log is the truth.     */
/* ------------------------------------------------------------------ */

/**
 * The two destinations of one chat message, and why only one of them is durable.
 * On receipt the gateway does two things: it produces to Kafka (the canonical,
 * replayable record every reader can trust) and it fans the message out in
 * memory to the *other sockets on this node* (an instant live push). The fan-out
 * is best-effort and single-node: a viewer connected to a different gateway node
 * won't get the in-memory push — they rely on the log and its projections. The
 * MVP runs one node on purpose; Phase 2 closes the cross-node gap with Redis.
 */
export const FanoutVsLog = () => (
  <DiagramFrame caption="One message, two fates. Producing to Kafka is the durable record — replayable, every reader's source of truth. The in-memory fan-out is a best-effort live push to other tabs on the same node; a viewer on another node misses it and falls back to the log. Single-node is the deliberate MVP limit Phase 2 fixes with Redis.">
    <div className="flex justify-center">
      <FlowBox mono tone="ink">
        <IconMessage className="size-4" />
        message arrives on a socket
      </FlowBox>
    </div>

    <div className="my-3 flex justify-center font-mono text-[10px] text-muted-foreground">
      the gateway does both ↓
    </div>

    <div className="grid gap-3 sm:grid-cols-2">
      <div className="flex flex-col gap-2 rounded-xl border border-accent-green/50 bg-accent-green/[0.05] p-3">
        <span className="flex items-center gap-1.5 font-mono text-[10px] text-accent-green uppercase tracking-wider">
          <IconScript className="size-3.5" />
          durable · the log
        </span>
        <p className="text-foreground/80 text-xs leading-relaxed">
          Produce to <code className="font-mono">chat.messages.v1</code>. The
          canonical record — replayable, archived, the source of truth for
          history and every projection.
        </p>
      </div>

      <div className="flex flex-col gap-2 rounded-xl border border-accent-orange/50 bg-accent-orange/[0.05] p-3">
        <span className="flex items-center gap-1.5 font-mono text-[10px] text-accent-orange uppercase tracking-wider">
          <IconShare2 className="size-3.5" />
          best-effort · live push
        </span>
        <p className="text-foreground/80 text-xs leading-relaxed">
          Write to the other sockets on <em>this node</em>. Instant, but lost on
          a slow/dead socket — and invisible to viewers on another node.
        </p>
      </div>
    </div>

    <div className="mt-3 grid gap-3 sm:grid-cols-2">
      <div className="flex items-center gap-2 rounded-lg border border-accent-green/40 px-3 py-2 font-mono text-[11px] text-accent-green">
        <IconWifi className="size-3.5 shrink-0" />
        same node · gets the live push
      </div>
      <div className="flex items-center gap-2 rounded-lg border border-muted-foreground/40 border-dashed px-3 py-2 font-mono text-[11px] text-muted-foreground">
        <IconWifiOff className="size-3.5 shrink-0" />
        another node · reads the log (Phase 2: Redis)
      </div>
    </div>
  </DiagramFrame>
);

/* ------------------------------------------------------------------ */
/* Go — a goroutine per connection: read loop + write pump + cancel.    */
/* ------------------------------------------------------------------ */

/**
 * Why Go fits a WebSocket gateway. Each viewer connection gets two goroutines —
 * a read loop pulling frames off the socket, and a write pump draining an
 * outbound channel back to it — wired together by a typed channel. A
 * `context.WithCancel` ties their lifetimes: when the read loop ends (the viewer
 * leaves), it calls `cancel()`, the write pump's `<-ctx.Done()` fires, and it
 * exits — no leaked goroutine. This figure is Go-the-language, so it wears the
 * Go-blue accent (ADR-0020), not Pulse's Kafka yellow.
 */
export const GoroutineReadLoop = () => (
  <DiagramFrame caption="One connection, two goroutines: a read loop and a write pump, joined by a typed channel. A goroutine is cheap enough that one-per-connection is normal. context.WithCancel links their fates — when the read loop ends, cancel() stops the write pump, so a disconnect never leaks a goroutine.">
    <div className="flex justify-center">
      <FlowBox mono tone="blue">
        <IconMessage className="size-4" />
        viewer socket
      </FlowBox>
    </div>

    <div className="my-3 flex justify-center font-mono text-[10px] text-muted-foreground">
      go gateway spawns two goroutines ↓
    </div>

    <div className="grid items-stretch gap-3 sm:grid-cols-[1fr_auto_1fr]">
      <div className="flex flex-col gap-2 rounded-xl border border-go-blue/40 p-3">
        <span className="font-mono text-[10px] text-go-ink uppercase tracking-wider dark:text-go-blue">
          goroutine · read loop
        </span>
        <p className="font-mono text-[11px] text-muted-foreground leading-relaxed">
          for {"{"} read frame → produce + fan-out {"}"}
        </p>
        <span className="font-mono text-[10px] text-accent-orange">
          on EOF → cancel()
        </span>
      </div>

      <div className="flex flex-row items-center justify-center gap-1 sm:flex-col">
        <span className="rounded-pill border border-border px-2 py-0.5 font-mono text-[9px] text-muted-foreground">
          chan []byte
        </span>
        <IconArrowRight className="size-4 rotate-90 text-muted-foreground sm:rotate-0" />
      </div>

      <div className="flex flex-col gap-2 rounded-xl border border-go-blue/40 p-3">
        <span className="font-mono text-[10px] text-go-ink uppercase tracking-wider dark:text-go-blue">
          goroutine · write pump
        </span>
        <p className="font-mono text-[11px] text-muted-foreground leading-relaxed">
          select {"{"} case b := &lt;-send / case &lt;-ctx.Done() {"}"}
        </p>
        <span className="font-mono text-[10px] text-accent-green">
          ctx cancelled → return (no leak)
        </span>
      </div>
    </div>
  </DiagramFrame>
);
