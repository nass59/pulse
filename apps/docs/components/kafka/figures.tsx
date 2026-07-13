import {
  IconArrowRight,
  IconInbox,
  IconScript,
  IconTerminal2,
} from "@tabler/icons-react";

import { DiagramFrame } from "@/components/docs/diagram";
import { cn } from "@/lib/utils";

/**
 * Static figures for the `Learn` track (ADR-0011). Pure server components — no
 * `"use client"`, no Motion — so they render straight into MDX and travel free
 * in the static export, matching `components/docs/diagram.tsx`. These teach the
 * universal Kafka mechanism, never Pulse's topology; the interactive widgets in
 * `components/interactive/` carry the dynamics-shaped concepts.
 */

/* ------------------------------------------------------------------ */
/* Why Kafka exists — N×M point-to-point wiring vs one shared log.       */
/* ------------------------------------------------------------------ */

const PRODUCERS = ["uploads", "likes", "follows", "comments"];
const CONSUMERS = ["feed", "notifications", "analytics", "search"];

/** Vertically centre N labels across a fixed-height SVG column. */
const lane = (i: number, n: number, height: number) =>
  (height / (n + 1)) * (i + 1);

const NodePill = ({
  x,
  y,
  label,
  anchor,
}: {
  anchor: "start" | "end";
  label: string;
  x: number;
  y: number;
}) => (
  <text
    className="fill-foreground font-mono text-[11px]"
    dominantBaseline="middle"
    textAnchor={anchor}
    x={x}
    y={y}
  >
    {label}
  </text>
);

const Panel = ({
  title,
  tone,
  children,
}: {
  children: React.ReactNode;
  title: string;
  tone: "bad" | "good";
}) => (
  <div className="flex flex-col gap-2">
    <div className="flex items-center justify-between">
      <span className="ds-eyebrow text-[10px]">{title}</span>
      <span
        className={cn(
          "font-mono text-[10px]",
          tone === "bad" ? "text-destructive" : "text-accent-green"
        )}
      >
        {tone === "bad" ? "N × M wires" : "N + M wires"}
      </span>
    </div>
    {children}
  </div>
);

/**
 * The motivating picture: four sources each talking to four sinks is sixteen
 * brittle point-to-point connections; route everything through one log and it
 * collapses to N + M. The Instagram-flavoured labels make the "everything is an
 * event" framing concrete.
 */
export const IntegrationSpaghetti = () => {
  const H = 168;
  const W = 280;
  const leftX = 56;
  const rightX = W - 56;

  return (
    <DiagramFrame caption="Left: every producer wired to every consumer — 4 × 4 = 16 connections, and each new service multiplies the mess. Right: everyone publishes to (or reads from) one log, so it's 4 + 4. That collapse is the whole pitch.">
      <div className="grid gap-6 sm:grid-cols-2">
        <Panel title="without a log" tone="bad">
          <svg aria-hidden="true" className="w-full" viewBox={`0 0 ${W} ${H}`}>
            <title>Tangled point-to-point connections</title>
            {PRODUCERS.flatMap((p, pi) =>
              CONSUMERS.map((c, ci) => (
                <line
                  className="stroke-destructive/35"
                  key={`${p}-${c}`}
                  strokeWidth={1}
                  x1={leftX + 4}
                  x2={rightX - 4}
                  y1={lane(pi, PRODUCERS.length, H)}
                  y2={lane(ci, CONSUMERS.length, H)}
                />
              ))
            )}
            {PRODUCERS.map((p, i) => (
              <NodePill
                anchor="end"
                key={p}
                label={p}
                x={leftX}
                y={lane(i, PRODUCERS.length, H)}
              />
            ))}
            {CONSUMERS.map((c, i) => (
              <NodePill
                anchor="start"
                key={c}
                label={c}
                x={rightX}
                y={lane(i, CONSUMERS.length, H)}
              />
            ))}
          </svg>
        </Panel>

        <Panel title="with a log" tone="good">
          <svg aria-hidden="true" className="w-full" viewBox={`0 0 ${W} ${H}`}>
            <title>Producers and consumers connected through one log</title>
            {PRODUCERS.map((p, i) => (
              <line
                className="stroke-accent-green/45"
                key={`pl-${p}`}
                strokeWidth={1.25}
                x1={leftX + 4}
                x2={W / 2 - 22}
                y1={lane(i, PRODUCERS.length, H)}
                y2={H / 2}
              />
            ))}
            {CONSUMERS.map((c, i) => (
              <line
                className="stroke-accent-green/45"
                key={`cl-${c}`}
                strokeWidth={1.25}
                x1={W / 2 + 22}
                x2={rightX - 4}
                y1={H / 2}
                y2={lane(i, CONSUMERS.length, H)}
              />
            ))}
            <rect
              className="fill-electric-yellow/10 stroke-electric-yellow/60"
              height={40}
              rx={8}
              width={48}
              x={W / 2 - 24}
              y={H / 2 - 20}
            />
            <text
              className="fill-yellow-ink font-mono text-[9px] uppercase tracking-wider dark:fill-electric-yellow"
              dominantBaseline="middle"
              textAnchor="middle"
              x={W / 2}
              y={H / 2}
            >
              log
            </text>
            {PRODUCERS.map((p, i) => (
              <NodePill
                anchor="end"
                key={p}
                label={p}
                x={leftX}
                y={lane(i, PRODUCERS.length, H)}
              />
            ))}
            {CONSUMERS.map((c, i) => (
              <NodePill
                anchor="start"
                key={c}
                label={c}
                x={rightX}
                y={lane(i, CONSUMERS.length, H)}
              />
            ))}
          </svg>
        </Panel>
      </div>
    </DiagramFrame>
  );
};

/* ------------------------------------------------------------------ */
/* Orientation — the three roles around the log.                        */
/* ------------------------------------------------------------------ */

const OFFSETS = [0, 1, 2, 3, 4, 5];

/**
 * The whole vocabulary in one row: a producer appends records to the right end
 * of the log; consumers read from any offset they like, at their own pace,
 * without removing anything. Everything else on the page elaborates this.
 */
export const ProducerLogConsumer = () => (
  <DiagramFrame caption="A producer only ever appends — to the right end. Consumers read from whatever offset they're at, at their own speed, and reading changes nothing. The record stays put for the next reader.">
    <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center">
      <div className="flex flex-col items-center gap-1.5 rounded-xl border border-border px-4 py-3 text-center">
        <IconTerminal2 className="size-4 text-muted-foreground" />
        <span className="font-medium text-sm">producer</span>
        <span className="font-mono text-[10px] text-muted-foreground">
          appends →
        </span>
      </div>

      <IconArrowRight className="mx-auto size-4 rotate-90 text-muted-foreground sm:rotate-0" />

      <div className="flex-1">
        <div className="mb-1 flex items-center justify-between px-1">
          <span className="ds-eyebrow text-[10px]">the log — one topic</span>
          <span className="font-mono text-[10px] text-muted-foreground">
            append end →
          </span>
        </div>
        <ol className="flex gap-1">
          {OFFSETS.map((o) => (
            <li
              className={cn(
                "flex h-12 flex-1 flex-col items-center justify-center rounded-md border font-mono",
                o === OFFSETS.length - 1
                  ? "border-electric-yellow/60 bg-electric-yellow/10 text-yellow-ink dark:text-electric-yellow"
                  : "border-border bg-muted/40 text-muted-foreground"
              )}
              key={o}
            >
              <IconScript className="size-3.5 opacity-60" />
              <span className="mt-0.5 text-[10px]">{o}</span>
            </li>
          ))}
        </ol>
        <div className="mt-1 flex justify-between px-1 font-mono text-[10px] text-muted-foreground">
          <span>offset 0 — oldest</span>
          <span>newest</span>
        </div>
      </div>

      <IconArrowRight className="mx-auto size-4 rotate-90 text-muted-foreground sm:rotate-0" />

      <div className="flex flex-col items-center gap-1.5 rounded-xl border border-border px-4 py-3 text-center">
        <IconInbox className="size-4 text-muted-foreground" />
        <span className="font-medium text-sm">consumer</span>
        <span className="font-mono text-[10px] text-muted-foreground">
          reads at its offset
        </span>
      </div>
    </div>
  </DiagramFrame>
);

/* ------------------------------------------------------------------ */
/* Getting started — the kcat produce/consume round-trip.               */
/* ------------------------------------------------------------------ */

/**
 * The Phase 0 smoke test as a picture: one terminal pipes a line into the topic,
 * another reads it back from the beginning. Proof the local broker is real
 * before any service is written (`foundations/03`).
 */
export const RoundTrip = () => (
  <DiagramFrame caption="Terminal A pipes one line into the topic; Terminal B reads it straight back. If this round-trips, your broker is real — and nothing you build on top is debugging a broken substrate.">
    <div className="grid items-stretch gap-3 sm:grid-cols-[1fr_auto_1fr]">
      <div className="rounded-xl border border-border bg-muted/30 p-3">
        <div className="flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
          <IconTerminal2 className="size-3" /> terminal A · produce
        </div>
        <code className="mt-2 block font-mono text-[11px] text-foreground leading-relaxed">
          echo "hello pulse" |<br />
          kcat -P -t pulse.smoke.test
        </code>
      </div>

      <div className="flex flex-col items-center justify-center gap-1">
        <div className="flex size-11 items-center justify-center rounded-xl border border-electric-yellow/60 bg-electric-yellow/10">
          <IconScript className="size-5 text-yellow-ink dark:text-electric-yellow" />
        </div>
        <span className="font-mono text-[9px] text-muted-foreground">
          broker
        </span>
      </div>

      <div className="rounded-xl border border-border bg-muted/30 p-3">
        <div className="flex items-center gap-1.5 font-mono text-[10px] text-muted-foreground uppercase tracking-wider">
          <IconInbox className="size-3" /> terminal B · consume
        </div>
        <code className="mt-2 block font-mono text-[11px] text-foreground leading-relaxed">
          kcat -C -t pulse.smoke.test
          <br />
          -o beginning -e
        </code>
        <div className="mt-2 flex items-center gap-1.5 font-mono text-[11px] text-accent-green">
          <IconArrowRight className="size-3" /> hello pulse
        </div>
      </div>
    </div>
  </DiagramFrame>
);
