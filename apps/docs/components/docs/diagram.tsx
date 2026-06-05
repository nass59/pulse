import {
  ArrowRight,
  Box,
  Check,
  Database,
  HardDrive,
  Send,
  Trash2,
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
  <DiagramFrame caption="Probes run the whole time. The amber window is start_period — failures there are ignored, so a slow boot never trips the retry counter. Once the broker answers, normal counting begins.">
    <div className="flex items-center justify-between">
      <span className="ds-eyebrow text-[10px]">probe timeline</span>
      <span className="ds-eyebrow text-[10px] text-accent-orange">
        start_period 20s
      </span>
    </div>

    <div className="relative mt-5">
      {/* the shielded window */}
      <div className="absolute top-0 bottom-7 left-0 w-2/5 rounded-lg border border-accent-orange/40 border-dashed bg-accent-orange/[0.06]" />

      <ol className="relative flex items-stretch justify-between gap-1">
        {PROBES.map((probe) => (
          <li
            className="flex flex-1 flex-col items-center gap-1.5"
            key={probe.at}
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
