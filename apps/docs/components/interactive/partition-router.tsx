"use client";

import { Send, Shuffle } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Partitions: the unit of parallelism and the unit of ordering. A topic is split
 * into N partitions; a record's key is hashed to choose one, so every record for
 * the same key lands in the same partition and stays ordered — while different
 * keys spread across partitions for throughput.
 *
 * Framed as the World Cup: the key is the match, so every event for ARG–FRA
 * (goals, cards, subs) is replayable in the order it happened, no matter how
 * many matches run in parallel. Dynamics-shaped per ADR-0007: a parameter space
 * (the partition count) with a visible effect on routing.
 */
type Match = {
  dot: string;
  key: string;
  ring: string;
};

const MATCHES: Match[] = [
  {
    key: "ARG–FRA",
    ring: "border-accent-blue/50 text-accent-blue",
    dot: "bg-accent-blue",
  },
  {
    key: "BRA–GER",
    ring: "border-accent-green/50 text-accent-green",
    dot: "bg-accent-green",
  },
  {
    key: "ESP–ITA",
    ring: "border-accent-orange/50 text-accent-orange",
    dot: "bg-accent-orange",
  },
  {
    key: "ENG–USA",
    ring: "border-accent-purple/50 text-accent-purple",
    dot: "bg-accent-purple",
  },
];

const EVENTS = ["⚽ goal", "🟨 card", "🔁 sub", "📊 xG"];

/** Stable string hash — the toy stand-in for Kafka's default key partitioner. */
const hashKey = (s: string) => {
  let h = 0;
  for (const ch of s) {
    h = (h * 31 + ch.charCodeAt(0)) % 1_000_000_007;
  }
  return h;
};

let recordSeq = 0;

type PartRecord = {
  dot: string;
  id: number;
  key: string;
  text: string;
};

const COUNTS = [2, 3, 4];

export const PartitionRouter = () => {
  const reduced = useReducedMotion();
  const [count, setCount] = useState(3);
  const [selected, setSelected] = useState(MATCHES[0].key);
  const [lanes, setLanes] = useState<PartRecord[][]>(() =>
    Array.from({ length: 3 }, () => [])
  );
  const [lastHit, setLastHit] = useState<number | null>(null);

  const repartition = useCallback((n: number) => {
    setCount(n);
    setLanes(Array.from({ length: n }, () => []));
    setLastHit(null);
  }, []);

  const send = useCallback(
    (key: string) => {
      const match = MATCHES.find((m) => m.key === key) ?? MATCHES[0];
      const target = hashKey(key) % count;
      const record: PartRecord = {
        id: recordSeq++,
        key,
        dot: match.dot,
        text: EVENTS[Math.floor(Math.random() * EVENTS.length)],
      };
      setLanes((prev) =>
        prev.map((lane, i) => (i === target ? [...lane, record] : lane))
      );
      setLastHit(target);
    },
    [count]
  );

  const scatter = useCallback(() => {
    for (const m of MATCHES) {
      send(m.key);
    }
  }, [send]);

  return (
    <div className="not-prose my-6 rounded-2xl border bg-card p-5">
      {/* controls: which match, how many partitions */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <span className="ds-eyebrow text-[10px]">the key — pick a match</span>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {MATCHES.map((m) => (
              <button
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-1 font-mono text-[11px] transition-all",
                  m.ring,
                  selected === m.key
                    ? "bg-foreground/[0.06] ring-1 ring-foreground/15"
                    : "opacity-70 hover:opacity-100"
                )}
                key={m.key}
                onClick={() => setSelected(m.key)}
                type="button"
              >
                <span className={cn("size-1.5 rounded-full", m.dot)} />
                {m.key}
              </button>
            ))}
          </div>
        </div>

        <div className="sm:text-right">
          <span className="ds-eyebrow text-[10px]">partitions</span>
          <div className="mt-2 flex gap-1.5 sm:justify-end">
            {COUNTS.map((n) => (
              <button
                className={cn(
                  "size-7 rounded-lg border font-mono text-xs transition-colors",
                  count === n
                    ? "border-electric-yellow/60 bg-electric-yellow/10 text-yellow-ink dark:text-electric-yellow"
                    : "border-border text-muted-foreground hover:border-foreground/30"
                )}
                key={n}
                onClick={() => repartition(n)}
                type="button"
              >
                {n}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* the partition lanes */}
      <div
        className="mt-5 grid gap-2"
        style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}
      >
        {lanes.map((lane, i) => {
          const isHit = lastHit === i;
          return (
            <div
              className={cn(
                "min-h-[124px] rounded-xl border p-2 transition-colors",
                isHit
                  ? "border-electric-yellow/60 bg-electric-yellow/[0.05]"
                  : "border-border border-dashed"
              )}
              // biome-ignore lint/suspicious/noArrayIndexKey: partitions are positional and stable for a given count
              key={i}
            >
              <div className="mb-1.5 flex items-center justify-between font-mono text-[10px] text-muted-foreground">
                <span>P{i}</span>
                <span>{lane.length}</span>
              </div>
              <div className="flex flex-col gap-1">
                <AnimatePresence initial={false}>
                  {lane.map((r) => (
                    <motion.div
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-1.5 rounded-md border border-border bg-card px-1.5 py-1 font-mono text-[10px]"
                      initial={{ opacity: 0, y: reduced ? 0 : -6 }}
                      key={r.id}
                    >
                      <span
                        className={cn("size-1.5 shrink-0 rounded-full", r.dot)}
                      />
                      <span className="truncate text-foreground">{r.text}</span>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button onClick={() => send(selected)} size="sm">
          <Send /> Send {selected} event
        </Button>
        <Button onClick={scatter} size="sm" variant="outline">
          <Shuffle /> One from every match
        </Button>
      </div>

      <p className="mt-3 text-muted-foreground text-xs leading-relaxed">
        Keep sending the same match: every event lands in the{" "}
        <span className="text-foreground">same partition</span>, so its goals
        and cards stay in order. Change the partition count and the routing
        reshuffles — which is exactly why ordering is promised{" "}
        <span className="text-foreground">within a partition</span>, never
        across the whole topic.
      </p>
    </div>
  );
};
