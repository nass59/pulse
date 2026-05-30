"use client";

import { motion } from "motion/react";
import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type Health = "unhealthy" | "healthy";

interface Phase {
  clock: string;
  detail: string;
  health: Health;
  id: string;
  /** True while this phase falls inside Kafka's healthcheck `start_period`. */
  inStartPeriod: boolean;
  title: string;
}

/**
 * The real boot of Pulse's single-node KRaft broker, as configured in
 * `infra/docker-compose.yaml` (`KAFKA_PROCESS_ROLES=broker,controller`,
 * `KAFKA_CONTROLLER_QUORUM_VOTERS=1@kafka:9094`). Nothing here is invented:
 * the timings mirror the `start_period: 20s` healthcheck and the foundations/02
 * lesson that a single-node KRaft cluster needs a few seconds to elect itself
 * controller before it can serve.
 */
const phases: Phase[] = [
  {
    id: "starting",
    clock: "t = 0s",
    title: "container starts",
    detail:
      "The broker process boots. There is no controller yet — the cluster has no leader and cannot serve metadata requests.",
    health: "unhealthy",
    inStartPeriod: true,
  },
  {
    id: "initialising",
    clock: "t ≈ 8s",
    title: "KRaft initialising",
    detail:
      "The node reads its metadata log and prepares an election. The healthcheck is already probing and failing — this flapping is expected, not a fault.",
    health: "unhealthy",
    inStartPeriod: true,
  },
  {
    id: "elected",
    clock: "t ≈ 14s",
    title: "elects itself controller",
    detail:
      "With a single voter (1@kafka:9094) the quorum is trivially itself. The node wins the election and assumes the controller role in-process — no ZooKeeper involved.",
    health: "unhealthy",
    inStartPeriod: true,
  },
  {
    id: "ready",
    clock: "t ≈ 20s",
    title: "serving — healthcheck green",
    detail:
      "kafka-topics.sh --list now succeeds. The 20s start_period shielded every earlier failure from counting against the container, so it never flapped to a hard `unhealthy`.",
    health: "healthy",
    inStartPeriod: false,
  },
];

const STEP_MS = 1100;
const LAST = phases.length - 1;

const stepClass = (index: number, step: number) => {
  if (index === step) {
    return "border-primary bg-primary/5";
  }
  if (index < step) {
    return "border-border bg-muted/50";
  }
  return "border-border bg-background";
};

const buttonLabel = (step: number, running: boolean) => {
  if (step === -1) {
    return "Run boot sequence";
  }
  return running ? "Running…" : "Replay";
};

const HealthBadge = ({ health }: { health: Health }) => (
  <span
    className={cn(
      "rounded-full px-2 py-0.5 font-medium text-xs",
      health === "healthy"
        ? "bg-green-100 text-green-700"
        : "bg-amber-100 text-amber-700"
    )}
  >
    {health}
  </span>
);

export const KraftControllerElection = () => {
  const [step, setStep] = useState(-1);
  const running = step >= 0 && step < LAST;

  useEffect(() => {
    if (step < 0 || step >= LAST) {
      return;
    }
    const id = setTimeout(() => setStep(step + 1), STEP_MS);
    return () => clearTimeout(id);
  }, [step]);

  const start = useCallback(() => setStep(0), []);
  const reset = useCallback(() => setStep(-1), []);

  const active = step >= 0 ? phases[step] : null;
  const unhealthy = active?.health === "unhealthy";

  return (
    <div className="not-prose my-6 rounded-xl border bg-card p-5">
      <div className="flex items-center gap-4">
        <motion.div
          animate={unhealthy ? { scale: [1, 1.12, 1] } : { scale: 1 }}
          className={cn(
            "flex size-16 shrink-0 items-center justify-center rounded-full border-2 text-center font-mono text-[11px] leading-tight",
            active === null && "border-border text-muted-foreground",
            unhealthy && "border-amber-400 bg-amber-50 text-amber-700",
            active?.health === "healthy" &&
              "border-green-500 bg-green-50 text-green-700"
          )}
          transition={{
            duration: 1,
            ease: "easeInOut",
            repeat: unhealthy ? Number.POSITIVE_INFINITY : 0,
          }}
        >
          broker 1
        </motion.div>

        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-medium">
              {active ? active.title : "ready to boot"}
            </span>
            <HealthBadge health={active?.health ?? "unhealthy"} />
            {active && (
              <span className="font-mono text-foreground/70 text-xs">
                {active.clock}
              </span>
            )}
          </div>
          <p className="mt-1 text-foreground/80 text-sm">
            {active
              ? active.detail
              : "Single-node KRaft. Press run to watch the broker elect itself controller and the healthcheck go green."}
          </p>
        </div>
      </div>

      <ol className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {phases.map((phase, index) => (
          <li
            className={cn(
              "rounded-md border px-2 py-1.5 text-center text-xs transition-colors",
              stepClass(index, step)
            )}
            key={phase.id}
          >
            <div className="font-mono text-foreground/70 text-xs">
              {phase.clock}
            </div>
            <div className="mt-0.5 font-medium">{phase.title}</div>
            {phase.inStartPeriod && (
              <div className="mt-1 font-mono text-amber-700 text-xs">
                start_period
              </div>
            )}
          </li>
        ))}
      </ol>

      <div className="mt-4 flex gap-2">
        <Button disabled={running} onClick={start} size="sm">
          {buttonLabel(step, running)}
        </Button>
        {step !== -1 && (
          <Button onClick={reset} size="sm" variant="outline">
            Reset
          </Button>
        )}
      </div>
    </div>
  );
};
