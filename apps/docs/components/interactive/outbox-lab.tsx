"use client";

import { Check, Database, Radio, TriangleAlert, X, Zap } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { type ReactNode, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * The dual-write bug, made tangible — and the outbox that closes it. You pick a
 * write strategy and a moment for the process to die, and watch where Postgres
 * (the canonical truth) and Kafka (what consumers saw) end up. The pairs are the
 * payload: the *same* crash that silently loses or ghosts an event under
 * dual-write either rolls back cleanly or merely duplicates under the outbox.
 *
 * Dynamics-shaped per ADR-0007: a parameter space (strategy × crash point) with
 * a visible effect (the two end-states + a verdict). Deterministic by design —
 * no time, no randomness — so SSR and hydration agree (the LogTape lesson).
 *
 * Build-state honest (AGENTS.md): `identity` runs the outbox today (issues 03–05
 * shipped), so this depicts the pattern Pulse actually uses; the failure modes
 * are the real ones the relay's at-least-once guarantee implies, not invented.
 */
type Strategy = "dual-write" | "outbox";

type StateKind = "ok" | "lost" | "ghost" | "dupe";

type EndState = {
  detail: string;
  kind: StateKind;
};

type Scenario = {
  /** The crash point — the pill label. */
  crash: string;
  id: string;
  /** What Kafka consumers ended up seeing. */
  kafka: EndState;
  /** What Postgres — the source of truth — ended up holding. */
  postgres: EndState;
  strategy: Strategy;
  /** The one-line takeaway under the result. */
  verdict: ReactNode;
};

const SCENARIOS: Scenario[] = [
  {
    id: "dw-none",
    strategy: "dual-write",
    crash: "No crash",
    postgres: { kind: "ok", detail: "channel is live" },
    kafka: { kind: "ok", detail: "StreamStarted delivered" },
    verdict: (
      <>
        Looks fine — and that's the trap. The DB commit and the{" "}
        <code>kafka.publish()</code> are two separate writes to two separate
        systems; nothing forces them to agree. It works until the gap between
        them gets unlucky.
      </>
    ),
  },
  {
    id: "dw-after-commit",
    strategy: "dual-write",
    crash: "Crash after COMMIT, before publish",
    postgres: { kind: "ok", detail: "channel is live" },
    kafka: { kind: "lost", detail: "no event ever sent" },
    verdict: (
      <>
        Postgres says the creator is live, but no <code>StreamStarted</code>{" "}
        ever reached Kafka — so followers are never notified and chat never
        spins up. The state changed and the world never heard about it. The{" "}
        <span className="text-foreground">lost-event</span> bug.
      </>
    ),
  },
  {
    id: "dw-publish-first",
    strategy: "dual-write",
    crash: "Publish first, crash before COMMIT",
    postgres: { kind: "ghost", detail: "rolled back — not live" },
    kafka: { kind: "ghost", detail: "StreamStarted delivered" },
    verdict: (
      <>
        Flip the order to dodge the lost event and you get the mirror bug: a{" "}
        <code>StreamStarted</code> went out for a stream that never committed.
        Consumers act on a stream that doesn't exist. The{" "}
        <span className="text-foreground">ghost-event</span> bug. There is no
        safe order for two systems.
      </>
    ),
  },
  {
    id: "ob-none",
    strategy: "outbox",
    crash: "No crash",
    postgres: { kind: "ok", detail: "channel live + outbox row" },
    kafka: { kind: "ok", detail: "StreamStarted delivered" },
    verdict: (
      <>
        The stream row, the <code>is_live</code> flag, and the event row all
        commit in <span className="text-foreground">one transaction</span>. The
        relay drains that outbox row to Kafka moments later. State and
        intent-to-publish can no longer disagree — they share a fate.
      </>
    ),
  },
  {
    id: "ob-before-commit",
    strategy: "outbox",
    crash: "Crash before COMMIT",
    postgres: { kind: "ok", detail: "rolled back — clean" },
    kafka: { kind: "ok", detail: "nothing sent — correct" },
    verdict: (
      <>
        The stream row <em>and</em> the outbox row roll back together — one
        transaction, one outcome. Nothing half-happened: the channel simply
        isn't live, and no phantom event escaped. Retry the request and move on.
      </>
    ),
  },
  {
    id: "ob-relay-crash",
    strategy: "outbox",
    crash: "Relay dies after Kafka ack, before marking done",
    postgres: { kind: "ok", detail: "channel live + outbox row" },
    kafka: { kind: "dupe", detail: "StreamStarted delivered twice" },
    verdict: (
      <>
        The event was published but never marked <code>published_at</code>, so
        on restart the relay claims the row again and re-sends it. Consumers see{" "}
        <code>StreamStarted</code> twice — that's{" "}
        <span className="text-foreground">at-least-once</span> delivery. It's
        not a bug to fix on the producer; it's why consumers must be idempotent.
      </>
    ),
  },
];

const STRATEGIES: { id: Strategy; label: string }[] = [
  { id: "dual-write", label: "Dual write" },
  { id: "outbox", label: "Transactional outbox" },
];

const KIND_TONE: Record<StateKind, { box: string; icon: string; tag: string }> =
  {
    ok: {
      box: "border-accent-green/40 bg-accent-green/[0.06]",
      icon: "text-accent-green",
      tag: "text-accent-green",
    },
    lost: {
      box: "border-destructive/40 bg-destructive/[0.06]",
      icon: "text-destructive",
      tag: "text-destructive",
    },
    ghost: {
      box: "border-destructive/40 bg-destructive/[0.06]",
      icon: "text-destructive",
      tag: "text-destructive",
    },
    dupe: {
      box: "border-accent-orange/40 bg-accent-orange/[0.07]",
      icon: "text-accent-orange",
      tag: "text-accent-orange",
    },
  };

/** The one-line agreement verdict above the explanation. */
const headlineFor = (kafkaKind: StateKind, consistent: boolean): string => {
  if (kafkaKind === "dupe") {
    return "Consistent — but delivered more than once";
  }
  if (consistent) {
    return "Postgres and Kafka agree";
  }
  return "Postgres and Kafka disagree";
};

const StateIcon = ({ kind }: { kind: StateKind }) => {
  if (kind === "ok") {
    return <Check className="size-4" />;
  }
  if (kind === "dupe") {
    return <TriangleAlert className="size-4" />;
  }
  return <X className="size-4" />;
};

/** One end-state chip — Postgres or Kafka after the dust settles. */
const EndStateChip = ({
  label,
  icon,
  state,
}: {
  icon: ReactNode;
  label: string;
  state: EndState;
}) => {
  const tone = KIND_TONE[state.kind];
  return (
    <div className={cn("flex-1 rounded-xl border p-3", tone.box)}>
      <div className="flex items-center gap-1.5 text-muted-foreground">
        <span className={tone.icon}>{icon}</span>
        <span className="ds-eyebrow text-[10px]">{label}</span>
      </div>
      <div className={cn("mt-2 flex items-center gap-1.5", tone.tag)}>
        <StateIcon kind={state.kind} />
        <span className="font-mono text-[11px] leading-tight">
          {state.detail}
        </span>
      </div>
    </div>
  );
};

export const OutboxLab = () => {
  const reduced = useReducedMotion();
  const [strategy, setStrategy] = useState<Strategy>("dual-write");
  const scenarios = SCENARIOS.filter((s) => s.strategy === strategy);
  const [activeId, setActiveId] = useState(SCENARIOS[0].id);
  const active = scenarios.find((s) => s.id === activeId) ?? scenarios[0];

  const pickStrategy = (next: Strategy) => {
    setStrategy(next);
    const first = SCENARIOS.find((s) => s.strategy === next);
    if (first) {
      setActiveId(first.id);
    }
  };

  const consistent = active.kafka.kind === "ok" || active.kafka.kind === "dupe";
  const headline = headlineFor(active.kafka.kind, consistent);

  return (
    <div className="not-prose my-6 rounded-2xl border bg-card p-5">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Zap className="size-4 text-electric-yellow" />
        <span className="ds-eyebrow text-[10px]">
          pick a write strategy, then a moment to crash
        </span>
      </div>

      {/* strategy — the two ways to write state + emit an event */}
      <div className="mt-3 inline-flex rounded-pill border border-border p-0.5">
        {STRATEGIES.map((s) => (
          <button
            className={cn(
              "rounded-pill px-3 py-1 font-mono text-[11px] transition-colors",
              strategy === s.id
                ? "bg-electric-yellow/15 text-yellow-ink dark:text-electric-yellow"
                : "text-muted-foreground hover:text-foreground"
            )}
            key={s.id}
            onClick={() => pickStrategy(s.id)}
            type="button"
          >
            {s.label}
          </button>
        ))}
      </div>

      {/* crash point — where the process dies */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {scenarios.map((s) => (
          <button
            className={cn(
              "rounded-pill border px-2.5 py-1 text-left font-mono text-[11px] transition-all",
              activeId === s.id
                ? "border-electric-yellow/60 bg-electric-yellow/10 text-yellow-ink dark:text-electric-yellow"
                : "border-border text-muted-foreground hover:border-foreground/30"
            )}
            key={s.id}
            onClick={() => setActiveId(s.id)}
            type="button"
          >
            {s.crash}
          </button>
        ))}
      </div>

      {/* where the two systems ended up */}
      <AnimatePresence initial={false} mode="wait">
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          initial={{ opacity: 0, y: reduced ? 0 : 6 }}
          key={active.id}
          transition={{ duration: reduced ? 0 : 0.18 }}
        >
          <div className="mt-4 flex flex-col gap-2 sm:flex-row">
            <EndStateChip
              icon={<Database className="size-3.5" />}
              label="Postgres · the truth"
              state={active.postgres}
            />
            <EndStateChip
              icon={<Radio className="size-3.5" />}
              label="Kafka · what consumers saw"
              state={active.kafka}
            />
          </div>

          <div
            className={cn(
              "mt-3 rounded-xl border p-3",
              consistent
                ? "border-border bg-muted/40"
                : "border-destructive/40 bg-destructive/[0.06]"
            )}
          >
            <p
              className={cn(
                "font-medium font-mono text-[10px] uppercase tracking-[0.08em]",
                consistent ? "text-muted-foreground" : "text-destructive"
              )}
            >
              {headline}
            </p>
            <p className="mt-1.5 text-muted-foreground text-xs leading-relaxed [&_code]:font-mono [&_code]:text-[11px] [&_code]:text-foreground">
              {active.verdict}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>

      <p className="mt-3 text-muted-foreground text-xs leading-relaxed">
        The outbox doesn't make Kafka exactly-once — it makes the{" "}
        <span className="text-foreground">database</span> the single thing that
        commits, then lets a relay deliver at-least-once. State can't drift from
        the event, and the only residue is the occasional duplicate, which
        idempotent consumers absorb.
      </p>
    </div>
  );
};
