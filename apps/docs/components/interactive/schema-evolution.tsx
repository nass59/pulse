"use client";

import {
  Check,
  Minus,
  PencilLine,
  Plus,
  Replace,
  ShieldCheck,
  X,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { type ReactNode, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * The BACKWARD-compatibility gate, made tangible. You propose a change to a
 * registered schema and watch Apicurio accept it (200, registers a new version)
 * or reject it (409 Conflict) — with the *reason* spelled out as the one test
 * BACKWARD actually runs: can a consumer on the new schema still read a message
 * written under the old one?
 *
 * Dynamics-shaped per ADR-0007: a parameter space (the proposed change) with a
 * visible effect (the registry verdict). The `Add optional` vs `Add required`
 * pair is the payload — sitting them side by side makes "the default is what
 * makes an add safe" land without a paragraph.
 *
 * Build-state honest (AGENTS.md): the BACKWARD rule is *live* — all five Pulse
 * subjects are pinned to it today — so this depicts what the gate will do when
 * you evolve a schema, not a claim that Pulse has evolved one (the deliberate
 * break-it-in-CI drill is Phase 3). The rename scenario is the real 409 the
 * `viewerId → userId` collapse hit during first-schemas, not an invented one.
 */
type Field = {
  name: string;
  type: string;
};

/** `ChatMessageSent` as registered under `chat.messages.v1-value` (v1). */
const BASE_FIELDS: Field[] = [
  { name: "messageId", type: "string · uuid" },
  { name: "channelId", type: "string · uuid" },
  { name: "streamId", type: "string · uuid" },
  { name: "userId", type: "string · uuid" },
  { name: "body", type: "string" },
  { name: "sentAt", type: "long · timestamp-millis" },
];

type DiffKind = "same" | "add" | "remove" | "change";

type DiffLine = Field & {
  kind: DiffKind;
};

type Scenario = {
  compatible: boolean;
  /** The diff applied to the base schema. */
  diff: DiffLine[];
  icon: ReactNode;
  id: string;
  label: string;
  /** The new-reads-old reasoning behind the verdict. */
  why: ReactNode;
};

const same = (): DiffLine[] =>
  BASE_FIELDS.map((f) => ({ ...f, kind: "same" as const }));

const SCENARIOS: Scenario[] = [
  {
    id: "add-optional",
    label: "Add optional field",
    icon: <Plus />,
    compatible: true,
    diff: [
      ...same(),
      { name: "editedAt", type: '["null","long"] = null', kind: "add" },
    ],
    why: (
      <>
        A consumer on the new schema reading a message written before the change
        finds no <code>editedAt</code> — and falls back to its{" "}
        <span className="text-foreground">default</span>. Old data still
        decodes, so the gate lets it through.
      </>
    ),
  },
  {
    id: "add-required",
    label: "Add required field",
    icon: <Plus />,
    compatible: false,
    diff: [
      ...same(),
      { name: "replyTo", type: "string — no default", kind: "add" },
    ],
    why: (
      <>
        Same field, no default. Now a consumer on the new schema reading an old
        message has <span className="text-foreground">nothing</span> to put in{" "}
        <code>replyTo</code> and no default to fall back on — old data can't
        decode. The default is the entire difference.
      </>
    ),
  },
  {
    id: "remove",
    label: "Remove a field",
    icon: <Minus />,
    compatible: true,
    diff: same().map((l) =>
      l.name === "body" ? { ...l, kind: "remove" as const } : l
    ),
    why: (
      <>
        A consumer on the new schema simply ignores the <code>body</code> that
        old messages still carry. Dropping a field never strands a reader, so a
        delete is always backward-compatible.
      </>
    ),
  },
  {
    id: "rename",
    label: "Rename a field",
    icon: <PencilLine />,
    compatible: false,
    diff: same().flatMap((l) =>
      l.name === "userId"
        ? [
            { ...l, kind: "remove" as const },
            { name: "authorId", type: "string · uuid", kind: "add" as const },
          ]
        : [l]
    ),
    why: (
      <>
        Avro matches fields by <span className="text-foreground">name</span>, so
        a rename is a delete <em>plus</em> an add-without-default. The add half
        fails the same way as above — this is the exact 409 the{" "}
        <code>viewerId → userId</code> collapse hit during first-schemas.
      </>
    ),
  },
  {
    id: "retype",
    label: "Change a field's type",
    icon: <Replace />,
    compatible: false,
    diff: same().map((l) =>
      l.name === "body"
        ? { name: "body", type: "long — was string", kind: "change" as const }
        : l
    ),
    why: (
      <>
        <code>string</code> and <code>long</code> don't resolve into one
        another: a consumer on the new schema can't reinterpret the old string
        bytes as a number. Incompatible types are a hard reject.
      </>
    ),
  },
];

const KIND_STYLES: Record<DiffKind, { gutter: string; row: string }> = {
  same: { gutter: "text-muted-foreground/40", row: "text-muted-foreground" },
  add: {
    gutter: "text-accent-green",
    row: "text-foreground bg-accent-green/[0.07]",
  },
  remove: {
    gutter: "text-destructive",
    row: "text-muted-foreground line-through decoration-destructive/50 bg-destructive/[0.06]",
  },
  change: {
    gutter: "text-accent-orange",
    row: "text-foreground bg-accent-orange/[0.08]",
  },
};

const GUTTER: Record<DiffKind, string> = {
  same: " ",
  add: "+",
  remove: "-",
  change: "~",
};

export const SchemaEvolution = () => {
  const reduced = useReducedMotion();
  const [activeId, setActiveId] = useState(SCENARIOS[0].id);
  const active = SCENARIOS.find((s) => s.id === activeId) ?? SCENARIOS[0];

  return (
    <div className="not-prose my-6 rounded-2xl border bg-card p-5">
      <div className="flex items-center gap-2 text-muted-foreground">
        <ShieldCheck className="size-4 text-electric-yellow" />
        <span className="ds-eyebrow text-[10px]">
          propose a change to chat.messages.v1-value
        </span>
      </div>

      {/* the proposed change — pick one */}
      <div className="mt-3 flex flex-wrap gap-1.5">
        {SCENARIOS.map((s) => (
          <button
            className={cn(
              "inline-flex items-center gap-1.5 rounded-pill border px-2.5 py-1 font-mono text-[11px] transition-all [&_svg]:size-3",
              activeId === s.id
                ? "border-electric-yellow/60 bg-electric-yellow/10 text-yellow-ink dark:text-electric-yellow"
                : "border-border text-muted-foreground hover:border-foreground/30"
            )}
            key={s.id}
            onClick={() => setActiveId(s.id)}
            type="button"
          >
            {s.icon}
            {s.label}
          </button>
        ))}
      </div>

      {/* the resulting schema, as a diff */}
      <div className="mt-4 overflow-hidden rounded-xl border border-border bg-background">
        <div className="flex items-center justify-between border-border border-b px-3.5 py-2 font-mono text-[10px] text-muted-foreground">
          <span>ChatMessageSent — proposed</span>
          <span>pulse.events.v1</span>
        </div>
        <div className="p-1.5">
          {active.diff.map((line) => {
            const style = KIND_STYLES[line.kind];
            return (
              <div
                className={cn(
                  "flex items-center gap-2 rounded-md px-2 py-1 font-mono text-[11px] transition-colors",
                  style.row
                )}
                key={`${line.kind}-${line.name}`}
              >
                <span className={cn("w-2 shrink-0 text-center", style.gutter)}>
                  {GUTTER[line.kind]}
                </span>
                <span className="w-28 shrink-0 truncate">{line.name}</span>
                <span className="truncate text-[10px] opacity-70">
                  {line.type}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* the registry's verdict */}
      <AnimatePresence initial={false} mode="wait">
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "mt-4 flex items-start gap-2.5 rounded-xl border p-3",
            active.compatible
              ? "border-accent-green/40 bg-accent-green/[0.06]"
              : "border-destructive/40 bg-destructive/[0.06]"
          )}
          initial={{ opacity: 0, y: reduced ? 0 : 6 }}
          key={active.id}
          transition={{ duration: reduced ? 0 : 0.18 }}
        >
          <span
            className={cn(
              "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full",
              active.compatible
                ? "bg-accent-green/15 text-accent-green"
                : "bg-destructive/15 text-destructive"
            )}
          >
            {active.compatible ? (
              <Check className="size-3.5" />
            ) : (
              <X className="size-3.5" />
            )}
          </span>
          <div>
            <p
              className={cn(
                "font-medium font-mono text-[11px] uppercase tracking-[0.08em]",
                active.compatible ? "text-accent-green" : "text-destructive"
              )}
            >
              {active.compatible
                ? "POST …/versions → 200 · registered as v2"
                : "POST …/versions → 409 Conflict · rejected by BACKWARD"}
            </p>
            <p className="mt-1 text-muted-foreground text-xs leading-relaxed [&_code]:font-mono [&_code]:text-[11px] [&_code]:text-foreground">
              {active.why}
            </p>
          </div>
        </motion.div>
      </AnimatePresence>

      <p className="mt-3 text-muted-foreground text-xs leading-relaxed">
        BACKWARD runs exactly one test: can a consumer on the{" "}
        <span className="text-foreground">new</span> schema read a message
        written under the <span className="text-foreground">old</span> one? Add
        a field <em>with a default</em> and delete fields freely; add a required
        field, rename, or retype, and the gate stops you at publish time — not
        at 3 a.m. in production.
      </p>
    </div>
  );
};
