"use client";

import { IconMinus, IconPlus, IconUser } from "@tabler/icons-react";
import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Consumer groups: how you scale reads without processing a message twice.
 * Within one group, each partition is owned by exactly one consumer; add a
 * consumer and Kafka rebalances partitions across the group; add more consumers
 * than partitions and the extras sit idle.
 *
 * Framed as the NBA: four game feeds (partitions) fan out to a pool of box-score
 * workers (one consumer group). Spin up more workers to keep up on a busy night;
 * past four, the fifth has nothing to do. Dynamics-shaped per ADR-0007: a
 * parameter space (group size) with a visible effect (the assignment).
 */
const PARTITIONS = [
  { id: 0, game: "LAL–BOS" },
  { id: 1, game: "GSW–DEN" },
  { id: 2, game: "MIA–NYK" },
  { id: 3, game: "PHX–DAL" },
];

const MIN = 1;
const MAX = 5;

const CONSUMER_TONES = [
  "border-accent-blue/50 bg-accent-blue/[0.06] text-accent-blue",
  "border-accent-green/50 bg-accent-green/[0.06] text-accent-green",
  "border-accent-orange/50 bg-accent-orange/[0.06] text-accent-orange",
  "border-accent-purple/50 bg-accent-purple/[0.06] text-accent-purple",
  "border-foreground/30 bg-foreground/[0.04] text-foreground",
];

export const ConsumerGroupRebalance = () => {
  const reduced = useReducedMotion();
  const [size, setSize] = useState(2);

  /** Round-robin assignment: partition p → consumer p % size (Kafka's range/round-robin idea). */
  const owners = Array.from({ length: size }, (_, c) =>
    PARTITIONS.filter((p) => p.id % size === c)
  );

  return (
    <div className="not-prose my-6 rounded-2xl border bg-card p-5">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <span className="ds-eyebrow text-[10px]">
          group <span className="text-foreground">box-score</span> ·{" "}
          {PARTITIONS.length} partitions
        </span>
        <span className="font-mono text-[10px] text-muted-foreground">
          {size} consumer{size > 1 ? "s" : ""}
        </span>
      </div>

      <div
        className="grid gap-2"
        style={{
          gridTemplateColumns: `repeat(${Math.min(size, MAX)}, minmax(0, 1fr))`,
        }}
      >
        {owners.map((parts, c) => {
          const idle = parts.length === 0;
          return (
            <div
              className={cn(
                "flex min-h-[132px] flex-col rounded-xl border p-2.5",
                idle
                  ? "border-border border-dashed bg-transparent"
                  : CONSUMER_TONES[c % CONSUMER_TONES.length]
              )}
              // biome-ignore lint/suspicious/noArrayIndexKey: consumers are positional within the group
              key={c}
            >
              <div className="mb-2 flex items-center gap-1.5">
                <IconUser
                  className={cn("size-3.5", idle && "text-muted-foreground")}
                />
                <span
                  className={cn(
                    "font-mono text-[10px]",
                    idle && "text-muted-foreground"
                  )}
                >
                  consumer {c}
                </span>
              </div>

              {idle ? (
                <div className="flex flex-1 items-center justify-center text-center font-mono text-[10px] text-muted-foreground">
                  idle —<br />
                  no partition
                </div>
              ) : (
                <div className="flex flex-col gap-1.5">
                  {parts.map((p) => (
                    <motion.div
                      className="rounded-lg border border-current/30 bg-card px-2 py-1.5"
                      key={p.id}
                      layout={!reduced}
                      layoutId={`part-${p.id}`}
                      transition={{
                        type: "spring",
                        stiffness: 380,
                        damping: 32,
                      }}
                    >
                      <div className="font-mono text-[10px] text-muted-foreground">
                        P{p.id}
                      </div>
                      <div className="font-medium text-[11px] text-foreground">
                        {p.game}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <Button
          disabled={size <= MIN}
          onClick={() => setSize((s) => Math.max(MIN, s - 1))}
          size="sm"
          variant="outline"
        >
          <IconMinus /> Remove consumer
        </Button>
        <Button
          disabled={size >= MAX}
          onClick={() => setSize((s) => Math.min(MAX, s + 1))}
          size="sm"
        >
          <IconPlus /> Add consumer
        </Button>
      </div>

      <p className="mt-3 text-muted-foreground text-xs leading-relaxed">
        {size > PARTITIONS.length
          ? "More consumers than partitions: the extra one sits idle. The partition is the unit of parallelism, so four partitions cap you at four useful workers in a group."
          : "Each partition is owned by exactly one consumer in the group, so no game is double-counted. Add a worker and Kafka rebalances — the partitions glide to their new owner."}
      </p>
    </div>
  );
};
