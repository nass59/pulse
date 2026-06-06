"use client";

import { Gauge, Plus, Radio, Rewind } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * The append-only log, with two consumers reading at independent offsets — the
 * single most load-bearing idea in Kafka ("a log, not a queue"). Framed as F1
 * telemetry: a car emits a stream of packets in strict order; the pit wall reads
 * live at the head, while a strategy engine replays from the start. Both read
 * the *same* records and reading removes nothing.
 *
 * General pedagogy (ADR-0011): this depicts Kafka the mechanism, not Pulse's
 * system. Dynamics-shaped per ADR-0007 — a flow over time plus two offset
 * playheads you can move.
 */
const PACKETS = [
  "S1 28.4",
  "S2 31.9",
  "S3 26.1",
  "DRS on",
  "throttle 98%",
  "brake bias 54",
  "LAP 1:18.6",
  "tyre 92°C",
  "PIT now",
  "fuel −1.8kg",
];

const MAX = 11;
const TICK_MS = 1700;

interface Record {
  label: string;
  offset: number;
}

/**
 * Label is derived from the offset, not a mutable counter — so the seed records
 * render identically on the server and client and don't trip hydration.
 */
const makeRecord = (offset: number): Record => ({
  offset,
  label: PACKETS[offset % PACKETS.length],
});

const Playhead = ({
  layoutId,
  tone,
}: {
  layoutId: string;
  tone: "live" | "replay";
}) => (
  <motion.span
    className={cn(
      "absolute inset-x-0.5 top-0 flex h-1.5 items-center justify-center rounded-full",
      tone === "live" ? "bg-electric-yellow" : "bg-accent-blue"
    )}
    layoutId={layoutId}
    transition={{ type: "spring", stiffness: 420, damping: 34 }}
  />
);

export const LogTape = () => {
  const reduced = useReducedMotion();
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);
  const [records, setRecords] = useState<Record[]>(() => [
    makeRecord(0),
    makeRecord(1),
    makeRecord(2),
  ]);
  const [replay, setReplay] = useState(0);

  const head = records.length - 1;

  const append = useCallback(() => {
    setRecords((prev) =>
      prev.length >= MAX ? prev : [...prev, makeRecord(prev.length)]
    );
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) {
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.3 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  useEffect(() => {
    if (reduced || !inView || records.length >= MAX) {
      return;
    }
    const id = setTimeout(append, TICK_MS);
    return () => clearTimeout(id);
  }, [reduced, inView, records.length, append]);

  const full = records.length >= MAX;

  return (
    <div className="not-prose my-6 rounded-2xl border bg-card p-5" ref={ref}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <span className="ds-eyebrow text-[10px]">car #44 · telemetry log</span>
        <span className="font-mono text-[10px] text-muted-foreground">
          {records.length} records · offsets 0–{head}
        </span>
      </div>

      <div className="overflow-x-auto pb-1">
        <div className="min-w-[460px]">
          {/* the tape */}
          <ol className="flex gap-1">
            {records.map((r) => (
              <motion.li
                animate={{ opacity: 1, y: 0 }}
                className={cn(
                  "relative flex h-14 min-w-[40px] flex-1 flex-col items-center justify-center rounded-lg border pt-2 font-mono",
                  r.offset === head
                    ? "border-electric-yellow/60 bg-electric-yellow/[0.07]"
                    : "border-border bg-muted/40"
                )}
                initial={{ opacity: 0, y: -8 }}
                key={r.offset}
                transition={{ duration: reduced ? 0 : 0.25 }}
              >
                {r.offset === head && <Playhead layoutId="live" tone="live" />}
                {r.offset === replay && (
                  <Playhead layoutId="replay" tone="replay" />
                )}
                <span className="text-[8px] text-muted-foreground">
                  {r.offset}
                </span>
                <span className="mt-0.5 text-[9px] text-foreground leading-tight">
                  {r.label}
                </span>
              </motion.li>
            ))}
          </ol>
          <div className="mt-1 flex justify-between px-0.5 font-mono text-[9px] text-muted-foreground">
            <span>oldest · offset 0</span>
            <span>append end →</span>
          </div>
        </div>
      </div>

      {/* the two consumers */}
      <div className="mt-5 grid gap-2.5 sm:grid-cols-2">
        <div className="flex items-center gap-2.5 rounded-xl border border-electric-yellow/40 bg-electric-yellow/[0.05] px-3 py-2.5">
          <Radio className="size-4 shrink-0 text-yellow-ink dark:text-electric-yellow" />
          <div className="min-w-0">
            <p className="font-medium text-sm">Pit wall</p>
            <p className="font-mono text-[10px] text-muted-foreground">
              reads live · offset {head} (the head)
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2.5 rounded-xl border border-accent-blue/40 bg-accent-blue/[0.05] px-3 py-2.5">
          <Gauge className="size-4 shrink-0 text-accent-blue" />
          <div className="min-w-0">
            <p className="font-medium text-sm">Strategy replay</p>
            <p className="font-mono text-[10px] text-muted-foreground">
              reads history · offset {replay}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Button disabled={full} onClick={append} size="sm">
          <Plus /> Append packet
        </Button>
        <Button
          disabled={replay >= head}
          onClick={() => setReplay((o) => Math.min(head, o + 1))}
          size="sm"
          variant="outline"
        >
          Advance replay
        </Button>
        <Button
          disabled={replay === 0}
          onClick={() => setReplay(0)}
          size="sm"
          variant="ghost"
        >
          <Rewind /> Rewind to 0
        </Button>
      </div>

      <p className="mt-3 text-muted-foreground text-xs leading-relaxed">
        {full
          ? "Retention window full — a real broker would start dropping the oldest records. Notice the strategy engine can still replay everything still on the log: reading never removed it."
          : "Two consumers, one log, two independent positions. Advancing or rewinding the replay reader changes nothing for the pit wall — and the records stay put either way."}
      </p>
    </div>
  );
};
