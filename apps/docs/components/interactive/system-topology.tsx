"use client";

import { EVENT_TOPICS, type EventType } from "@pulse/schemas/topics";
import {
  Background,
  BaseEdge,
  type Edge,
  EdgeLabelRenderer,
  type EdgeProps,
  getSmoothStepPath,
  Handle,
  MarkerType,
  type Node,
  type NodeMouseHandler,
  type NodeProps,
  Position,
  ReactFlow,
} from "@xyflow/react";
import {
  BarChart3,
  Database,
  Fingerprint,
  Layers,
  type LucideIcon,
  MessagesSquare,
  Network,
  ShieldCheck,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useCallback, useMemo, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * xyflow's stylesheet is imported here, colocated with the only component that
 * needs it — not globally — so the dependency travels with its consumer.
 */
import "@xyflow/react/dist/style.css";

/**
 * The control-plane topology from CONTEXT.md, rebuilt as an explorable graph:
 * hover a node to trace its flows (the rest dims), click to pin a contract panel
 * that names the exact events it owns. Kafka is drawn as the central backbone the
 * glossary calls it, with each service's local store beside its owner.
 *
 * Build state is encoded honestly (AGENTS.md): the four infra pieces and
 * `identity` run today (`live`); `chat` and `analytics` are designed-not-built
 * (`planned`), and every edge that needs them stays dashed. The panel's event
 * lists come straight from `EVENT_TOPICS` in `@pulse/schemas/topics` — the same
 * map producers and the registry publisher import — so the diagram can never
 * claim a contract the codebase doesn't actually define. Five topics exist
 * today; new schemas appear here automatically when they land.
 */
type BuildState = "live" | "planned";

type NodeId =
  | "apicurio"
  | "analytics"
  | "chat"
  | "identity"
  | "kafka"
  | "postgres"
  | "redis";

interface HandleSpec {
  id: string;
  position: Position;
  type: "source" | "target";
}

interface TopicFlow {
  event: EventType;
  state: BuildState;
  topic: string;
}

/** Resolve an event to its real topic from the canonical map — never hand-typed. */
const flow = (event: EventType, state: BuildState): TopicFlow => ({
  event,
  state,
  topic: EVENT_TOPICS[event],
});

const STREAM_FLOWS: TopicFlow[] = [
  flow("StreamStarted", "live"),
  flow("StreamEnded", "live"),
];
const CHAT_FLOWS: TopicFlow[] = [
  flow("ChatMessageSent", "planned"),
  flow("ViewerJoined", "planned"),
  flow("ViewerLeft", "planned"),
];
const ALL_FLOWS: TopicFlow[] = [...STREAM_FLOWS, ...CHAT_FLOWS];

interface FlowGroup {
  items: TopicFlow[];
  label: string;
}

interface NodeSpec {
  flows: FlowGroup[];
  handles: HandleSpec[];
  icon: LucideIcon;
  id: NodeId;
  label: string;
  /** The mono sub-line on the node card. */
  meta: string;
  notes?: string[];
  position: { x: number; y: number };
  /** One-line role in the system. */
  role: string;
  /** The source-of-truth model, for services and stores. */
  sot?: string;
  /** The Kafka backbone gets a taller card + partition motif. */
  spine?: boolean;
  state: BuildState;
}

const NODE_SPECS: NodeSpec[] = [
  {
    id: "apicurio",
    label: "Apicurio",
    meta: "registry · :8080",
    state: "live",
    icon: ShieldCheck,
    position: { x: 300, y: 0 },
    handles: [{ type: "source", position: Position.Bottom, id: "b" }],
    role: "Schema registry — the referee every service resolves Avro schemas from.",
    notes: ["Confluent-compatible; BACKWARD compatibility enforced in CI."],
    flows: [{ label: "Governs subjects", items: ALL_FLOWS }],
  },
  {
    id: "postgres",
    label: "Postgres",
    meta: ":5432",
    state: "live",
    icon: Database,
    position: { x: 0, y: 130 },
    handles: [{ type: "target", position: Position.Right, id: "r" }],
    role: "identity's canonical store.",
    notes: [
      "Holds streams, channels, and the outbox table — the truth identity emits from.",
    ],
    flows: [],
  },
  {
    id: "identity",
    label: "identity",
    meta: "service · TS · live",
    state: "live",
    icon: Fingerprint,
    position: { x: 210, y: 130 },
    handles: [
      { type: "target", position: Position.Top, id: "t" },
      { type: "source", position: Position.Left, id: "l" },
      { type: "source", position: Position.Right, id: "r" },
    ],
    role: "Accounts, channels, and the follow graph. The user-facing API.",
    sot: "Postgres is canonical — events leave via the transactional outbox.",
    flows: [{ label: "Produces", items: STREAM_FLOWS }],
  },
  {
    id: "redis",
    label: "Redis",
    meta: ":6379",
    state: "live",
    icon: Layers,
    position: { x: 0, y: 300 },
    handles: [{ type: "target", position: Position.Right, id: "r" }],
    role: "chat's read projection.",
    notes: [
      "Per-channel last-N ring buffer for mid-stream-join UX. Never the source of truth.",
    ],
    flows: [],
  },
  {
    id: "chat",
    label: "chat",
    meta: "service · Go · planned",
    state: "planned",
    icon: MessagesSquare,
    position: { x: 210, y: 300 },
    handles: [
      { type: "source", position: Position.Left, id: "l" },
      { type: "source", position: Position.Right, id: "r" },
    ],
    role: "WebSocket gateway and chat ingestion. Thousands of connections per node.",
    sot: "Kafka is the source of truth — reads are served from projections.",
    flows: [{ label: "Produces", items: CHAT_FLOWS }],
  },
  {
    id: "kafka",
    label: "Kafka",
    meta: "KRaft · :9092",
    state: "live",
    icon: Network,
    spine: true,
    position: { x: 480, y: 150 },
    handles: [
      { type: "target", position: Position.Left, id: "l" },
      { type: "source", position: Position.Right, id: "r" },
    ],
    role: "The control-plane backbone — every event crosses it.",
    notes: [
      "Single broker, KRaft mode. One topic per event type (TopicNameStrategy).",
    ],
    flows: [{ label: "Carries", items: ALL_FLOWS }],
  },
  {
    id: "analytics",
    label: "analytics",
    meta: "service · Kotlin · planned",
    state: "planned",
    icon: BarChart3,
    position: { x: 710, y: 215 },
    handles: [{ type: "target", position: Position.Left, id: "l" }],
    role: "Kafka Streams aggregator. No external API beyond a query layer.",
    sot: "No original state — its stores are views over upstream topics, recovered by replay.",
    notes: [
      "Produces windowed aggregates — concurrent viewers, chat rate, top streams — as compacted topics (not yet defined).",
    ],
    flows: [{ label: "Consumes", items: ALL_FLOWS }],
  },
];

const SPEC_BY_ID = Object.fromEntries(
  NODE_SPECS.map((s) => [s.id, s])
) as Record<NodeId, NodeSpec>;

interface EdgeDef {
  id: string;
  label: string;
  source: NodeId;
  sourceHandle: string;
  target: NodeId;
  targetHandle: string;
  tone: BuildState;
}

/**
 * Edge labels are deliberately short summaries — the panel carries the precise
 * event names. A `live` edge runs today; a `planned` edge needs a service that
 * doesn't exist yet (dashed, and only animated while it's the focused flow).
 */
const EDGE_DEFS: EdgeDef[] = [
  {
    id: "apicurio-identity",
    source: "apicurio",
    sourceHandle: "b",
    target: "identity",
    targetHandle: "t",
    label: "Avro schemas",
    tone: "live",
  },
  {
    id: "identity-postgres",
    source: "identity",
    sourceHandle: "l",
    target: "postgres",
    targetHandle: "r",
    label: "canonical + outbox",
    tone: "live",
  },
  {
    id: "identity-kafka",
    source: "identity",
    sourceHandle: "r",
    target: "kafka",
    targetHandle: "l",
    label: "stream lifecycle",
    tone: "live",
  },
  {
    id: "chat-redis",
    source: "chat",
    sourceHandle: "l",
    target: "redis",
    targetHandle: "r",
    label: "ring buffer",
    tone: "planned",
  },
  {
    id: "chat-kafka",
    source: "chat",
    sourceHandle: "r",
    target: "kafka",
    targetHandle: "l",
    label: "chat + presence",
    tone: "planned",
  },
  {
    id: "kafka-analytics",
    source: "kafka",
    sourceHandle: "r",
    target: "analytics",
    targetHandle: "l",
    label: "consume → aggregates",
    tone: "planned",
  },
];

type Emphasis = "off" | "on" | "rest";

type TopoNode = Node<
  { dimmed: boolean; focused: boolean; spec: NodeSpec },
  "topo"
>;
type TopoEdge = Edge<
  { emphasis: Emphasis; label: string; tone: BuildState },
  "topo"
>;

/* ------------------------------------------------------------------ */
/* Custom node — a labelled card that follows the diagram a11y pattern. */
/* ------------------------------------------------------------------ */

/** Node shell border/glow: focus wins, else green for live / dashed-muted for planned. */
const nodeShellClass = (focused: boolean, live: boolean): string => {
  if (focused) {
    return "border-electric-yellow bg-electric-yellow/[0.04] shadow-glow-sm";
  }
  return live
    ? "border-accent-green/50"
    : "border-muted-foreground/40 border-dashed";
};

/** Node icon colour follows the same precedence: focus → live → planned. */
const nodeIconClass = (focused: boolean, live: boolean): string => {
  if (focused) {
    return "text-electric-yellow";
  }
  return live ? "text-accent-green" : "text-muted-foreground";
};

const TopoNodeView = ({ data }: NodeProps<TopoNode>) => {
  const { spec, focused, dimmed } = data;
  const Icon = spec.icon;
  const live = spec.state === "live";

  return (
    <div
      className={cn(
        "relative flex w-[150px] flex-col items-center gap-1 rounded-xl border bg-transparent px-3.5 text-center transition-all duration-200",
        spec.spine ? "py-4" : "py-2.5",
        nodeShellClass(focused, live),
        dimmed && "opacity-35"
      )}
    >
      {spec.handles.map((h) => (
        <Handle
          className="!h-1.5 !w-1.5 !min-w-0 !min-h-0 !border-0 !bg-transparent"
          id={h.id}
          isConnectable={false}
          key={`${h.type}-${h.id}`}
          position={h.position}
          type={h.type}
        />
      ))}

      {spec.spine ? (
        <span className="ds-eyebrow text-[8px] text-accent-green leading-none">
          backbone
        </span>
      ) : null}

      <div
        className={cn(
          "flex items-center justify-center gap-1.5",
          live || focused ? "text-foreground" : "text-muted-foreground"
        )}
      >
        <Icon className={cn("size-4 shrink-0", nodeIconClass(focused, live))} />
        <span className="font-medium text-sm">{spec.label}</span>
      </div>

      <span className="font-mono text-[10px] text-muted-foreground leading-none">
        {spec.meta}
      </span>

      {spec.spine ? (
        <div aria-hidden className="mt-1 flex gap-0.5">
          {[0, 1, 2].map((i) => (
            <span
              className="h-2.5 w-0.5 rounded-full bg-accent-green/40"
              key={i}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
};

/* ------------------------------------------------------------------ */
/* Custom edge — smooth-step path + a pill label, themed to the tokens. */
/* ------------------------------------------------------------------ */

const TopoEdgeView = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  style,
  data,
}: EdgeProps<TopoEdge>) => {
  const [path, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: 12,
  });
  const emphasis = data?.emphasis ?? "rest";

  return (
    <>
      <BaseEdge id={id} markerEnd={markerEnd} path={path} style={style} />
      <EdgeLabelRenderer>
        <div
          className={cn(
            "pointer-events-none absolute rounded-pill border bg-card px-2 py-0.5 font-mono text-[9px] leading-none transition-opacity duration-200",
            data?.tone === "live"
              ? "border-accent-green/40 text-accent-green"
              : "border-muted-foreground/30 border-dashed text-muted-foreground",
            emphasis === "on" && "border-electric-yellow/60 text-foreground",
            emphasis === "off" && "opacity-20"
          )}
          style={{
            transform: `translate(-50%, -50%) translate(${labelX}px, ${labelY}px)`,
          }}
        >
          {data?.label}
        </div>
      </EdgeLabelRenderer>
    </>
  );
};

const nodeTypes = { topo: TopoNodeView };
const edgeTypes = { topo: TopoEdgeView };

/** The set of node ids one hop from the focused node — kept lit alongside it. */
const neighboursOf = (focusId: NodeId | null): Set<NodeId> => {
  const set = new Set<NodeId>();
  if (!focusId) {
    return set;
  }
  for (const e of EDGE_DEFS) {
    if (e.source === focusId) {
      set.add(e.target);
    }
    if (e.target === focusId) {
      set.add(e.source);
    }
  }
  return set;
};

/** An edge is `on` if it touches the focus, `off` if something else has focus. */
const emphasisFor = (e: EdgeDef, focusId: NodeId | null): Emphasis => {
  if (focusId === null) {
    return "rest";
  }
  return e.source === focusId || e.target === focusId ? "on" : "off";
};

const EMPHASIS_OPACITY: Record<Emphasis, number> = {
  off: 0.12,
  on: 1,
  rest: 0.8,
};

const strokeFor = (tone: BuildState): string =>
  tone === "live"
    ? "var(--color-accent-green)"
    : "var(--color-muted-foreground)";

/** Derive the fully-styled xyflow edge for the current focus state. */
const buildEdge = (
  e: EdgeDef,
  focusId: NodeId | null,
  reduced: boolean | null
): TopoEdge => {
  const emphasis = emphasisFor(e, focusId);
  const stroke = strokeFor(e.tone);
  const planned = e.tone === "planned";
  return {
    id: e.id,
    type: "topo",
    source: e.source,
    target: e.target,
    sourceHandle: e.sourceHandle,
    targetHandle: e.targetHandle,
    animated: planned && emphasis === "on" && !reduced,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      color: stroke,
      width: 16,
      height: 16,
    },
    style: {
      stroke,
      strokeWidth: emphasis === "on" ? 2 : 1.5,
      strokeDasharray: planned ? "5 5" : undefined,
      opacity: EMPHASIS_OPACITY[emphasis],
    },
    data: { label: e.label, tone: e.tone, emphasis },
  };
};

/* ------------------------------------------------------------------ */
/* The contract panel — what a node owns, surfaced on click.            */
/* ------------------------------------------------------------------ */

const StatePill = ({ state }: { state: BuildState }) =>
  state === "live" ? (
    <span className="rounded-pill border border-accent-green/50 px-1.5 py-0.5 font-mono text-[9px] text-accent-green uppercase tracking-wider">
      live
    </span>
  ) : (
    <span className="rounded-pill border border-muted-foreground/40 border-dashed px-1.5 py-0.5 font-mono text-[9px] text-muted-foreground uppercase tracking-wider">
      planned
    </span>
  );

const TopicRow = ({ item }: { item: TopicFlow }) => (
  <li className="flex items-center gap-2">
    <span
      className={cn(
        "size-1.5 shrink-0 rounded-full",
        item.state === "live" ? "bg-accent-green" : "bg-muted-foreground/50"
      )}
    />
    <span className="font-medium text-foreground text-xs">{item.event}</span>
    <span className="ml-auto font-mono text-[10px] text-muted-foreground">
      {item.topic}
    </span>
  </li>
);

const PanelBody = ({ spec }: { spec: NodeSpec }) => {
  const Icon = spec.icon;
  const live = spec.state === "live";
  return (
    <div className="flex flex-col gap-3">
      <div>
        <div className="flex items-center gap-2">
          <Icon
            className={cn(
              "size-4 shrink-0",
              live ? "text-accent-green" : "text-muted-foreground"
            )}
          />
          <span className="font-medium text-foreground text-sm">
            {spec.label}
          </span>
          <span className="ml-auto">
            <StatePill state={spec.state} />
          </span>
        </div>
        <span className="mt-1 block font-mono text-[10px] text-muted-foreground">
          {spec.meta}
        </span>
      </div>

      <p className="text-muted-foreground text-xs leading-relaxed">
        {spec.role}
      </p>

      {spec.sot ? (
        <div className="rounded-lg border border-border bg-muted/30 px-2.5 py-1.5">
          <span className="ds-eyebrow text-[8px]">source of truth</span>
          <p className="mt-0.5 text-foreground text-xs leading-snug">
            {spec.sot}
          </p>
        </div>
      ) : null}

      {spec.flows.map((group) => (
        <div key={group.label}>
          <span className="ds-eyebrow text-[9px]">{group.label}</span>
          <ul className="mt-1.5 flex flex-col gap-1.5">
            {group.items.map((item) => (
              <TopicRow item={item} key={item.topic} />
            ))}
          </ul>
        </div>
      ))}

      {spec.notes?.map((note) => (
        <p className="text-muted-foreground text-xs leading-relaxed" key={note}>
          {note}
        </p>
      ))}
    </div>
  );
};

const LegendRow = ({ state }: { state: BuildState }) => (
  <span className="flex items-center gap-2 text-muted-foreground text-xs">
    <span
      className={cn(
        "inline-block size-3 shrink-0 rounded-[4px] border",
        state === "live"
          ? "border-accent-green/60"
          : "border-muted-foreground/50 border-dashed"
      )}
    />
    {state === "live"
      ? "live · running today"
      : "planned · designed, not built"}
  </span>
);

const PanelPrompt = () => (
  <div className="flex h-full flex-col gap-3">
    <span className="ds-eyebrow text-[9px]">the control plane</span>
    <p className="text-muted-foreground text-xs leading-relaxed">
      Seven pieces, one event backbone.{" "}
      <span className="text-foreground">Hover</span> a node to trace its flows;{" "}
      <span className="text-foreground">click</span> one to inspect the
      contracts it owns.
    </p>
    <div className="mt-auto flex flex-col gap-2 border-border border-t pt-3">
      <LegendRow state="live" />
      <LegendRow state="planned" />
    </div>
  </div>
);

const ContractPanel = ({
  spec,
  reduced,
}: {
  reduced: boolean | null;
  spec: NodeSpec | null;
}) => (
  <AnimatePresence initial={false} mode="wait">
    <motion.div
      animate={{ opacity: 1, y: 0 }}
      className="flex h-full flex-col"
      initial={{ opacity: 0, y: reduced ? 0 : 6 }}
      key={spec?.id ?? "prompt"}
      transition={{ duration: reduced ? 0 : 0.18 }}
    >
      {spec ? <PanelBody spec={spec} /> : <PanelPrompt />}
    </motion.div>
  </AnimatePresence>
);

export const SystemTopology = () => {
  const reduced = useReducedMotion();
  const [selectedId, setSelectedId] = useState<NodeId | null>(null);
  const [hoveredId, setHoveredId] = useState<NodeId | null>(null);

  /** Hover wins for graph emphasis; the panel stays pinned to the click. */
  const focusId = hoveredId ?? selectedId;

  const nodes = useMemo<TopoNode[]>(() => {
    const neighbours = neighboursOf(focusId);
    return NODE_SPECS.map((spec) => ({
      id: spec.id,
      type: "topo",
      position: spec.position,
      draggable: false,
      data: {
        spec,
        focused: spec.id === focusId,
        dimmed:
          focusId !== null && spec.id !== focusId && !neighbours.has(spec.id),
      },
    }));
  }, [focusId]);

  const edges = useMemo<TopoEdge[]>(
    () => EDGE_DEFS.map((e) => buildEdge(e, focusId, reduced)),
    [focusId, reduced]
  );

  const onNodeClick = useCallback<NodeMouseHandler<TopoNode>>((_, node) => {
    const id = node.id as NodeId;
    setSelectedId((current) => (current === id ? null : id));
  }, []);

  const onNodeMouseEnter = useCallback<NodeMouseHandler<TopoNode>>(
    (_, node) => setHoveredId(node.id as NodeId),
    []
  );

  const selectedSpec = selectedId ? SPEC_BY_ID[selectedId] : null;

  return (
    /**
     * The graph wants more room than the prose column gives it, so on large
     * screens it breaks out symmetrically past the `max-w-3xl` body: `left-1/2`
     * plus a centred translate re-centres a wider block on the viewport axis
     * (the body column is itself centred), capped at the viewport minus gutters.
     * Below `lg` it stays full-column — the panel stacks beneath it there anyway.
     */
    <div className="not-prose my-8 lg:relative lg:left-1/2 lg:w-[min(88rem,calc(100vw-2rem))] lg:-translate-x-1/2">
      <div className="grid gap-3 lg:grid-cols-[1fr_19rem]">
        <div className="h-[24rem] overflow-hidden rounded-2xl border border-border bg-muted/20 sm:h-[28rem] lg:h-[34rem]">
          <ReactFlow<TopoNode, TopoEdge>
            className="!bg-transparent"
            edges={edges}
            edgesFocusable={false}
            edgeTypes={edgeTypes}
            fitView
            fitViewOptions={{ padding: 0.16 }}
            nodes={nodes}
            nodesConnectable={false}
            nodesDraggable={false}
            nodeTypes={nodeTypes}
            onNodeClick={onNodeClick}
            onNodeMouseEnter={onNodeMouseEnter}
            onNodeMouseLeave={() => setHoveredId(null)}
            onPaneClick={() => setSelectedId(null)}
            panOnDrag={false}
            panOnScroll={false}
            preventScrolling={false}
            proOptions={{ hideAttribution: true }}
            zoomOnDoubleClick={false}
            zoomOnPinch={false}
            zoomOnScroll={false}
          >
            <Background color="var(--color-border)" gap={22} size={1} />
          </ReactFlow>
        </div>

        <aside className="min-h-[10rem] rounded-2xl border border-border bg-card p-4 lg:min-h-0">
          <ContractPanel reduced={reduced} spec={selectedSpec} />
        </aside>
      </div>

      <p className="mt-2.5 px-1 text-muted-foreground text-xs leading-relaxed">
        Solid green nodes and edges run today; dashed ones still need a service
        that doesn't exist yet. Event names come straight from the registered
        Kafka topics, so the diagram can't claim a contract the code hasn't
        built.
      </p>
    </div>
  );
};
