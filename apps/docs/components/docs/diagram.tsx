import {
  ArrowRight,
  Box,
  Check,
  Crown,
  Database,
  HardDrive,
  ListChecks,
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
