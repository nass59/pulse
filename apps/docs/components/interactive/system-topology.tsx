"use client";

import { Background, type Edge, type Node, ReactFlow } from "@xyflow/react";

/**
 * xyflow's stylesheet is imported here, colocated with the only component that
 * needs it — not globally — so the dependency travels with its consumer.
 */
import "@xyflow/react/dist/style.css";

/**
 * The target control-plane topology from CONTEXT.md, with Phase 0 build-state
 * encoded honestly: the four infra pieces actually run today (`live`); the three
 * services are designed but not yet built (`planned`). Crucially, no edges are
 * `live` yet — Phase 0 stood up four isolated containers; nothing produces or
 * consumes until the services land. Each future epic flips a node (and its
 * edges) from planned to live.
 */
type BuildState = "live" | "planned";

const liveNode = {
  border: "1px solid var(--color-border)",
  background: "var(--color-card)",
  color: "var(--color-foreground)",
  borderRadius: 10,
  fontSize: 12,
  width: 150,
};

const plannedNode = {
  ...liveNode,
  border: "1px dashed var(--color-muted-foreground)",
  background: "transparent",
  color: "var(--color-muted-foreground)",
  opacity: 0.75,
};

const nodeStyle = (state: BuildState) =>
  state === "live" ? liveNode : plannedNode;

const label = (name: string, sub: string) => (
  <div className="text-center leading-tight">
    <div className="font-medium">{name}</div>
    <div className="text-[10px] opacity-70">{sub}</div>
  </div>
);

const nodes: Node[] = [
  {
    id: "identity",
    position: { x: 0, y: 0 },
    data: { label: label("identity", "planned · TS") },
    style: nodeStyle("planned"),
  },
  {
    id: "chat",
    position: { x: 0, y: 150 },
    data: { label: label("chat", "planned · Go") },
    style: nodeStyle("planned"),
  },
  {
    id: "analytics",
    position: { x: 0, y: 300 },
    data: { label: label("analytics", "planned · Kotlin") },
    style: nodeStyle("planned"),
  },
  {
    id: "kafka",
    position: { x: 320, y: 150 },
    data: { label: label("Kafka", "live · KRaft :9092") },
    style: nodeStyle("live"),
  },
  {
    id: "apicurio",
    position: { x: 320, y: 320 },
    data: { label: label("Apicurio", "live · registry :8080") },
    style: nodeStyle("live"),
  },
  {
    id: "postgres",
    position: { x: 640, y: 0 },
    data: { label: label("Postgres", "live · :5432") },
    style: nodeStyle("live"),
  },
  {
    id: "redis",
    position: { x: 640, y: 300 },
    data: { label: label("Redis", "live · :6379") },
    style: nodeStyle("live"),
  },
];

/**
 * Every edge is `planned`: it requires a service that does not exist yet.
 * Rendered dashed + animated so the diagram reads as "wiring to come."
 */
const plannedEdge = {
  animated: true,
  style: { strokeDasharray: "5 5", stroke: "var(--color-muted-foreground)" },
  labelStyle: { fontSize: 10, fill: "var(--color-muted-foreground)" },
};

const edges: Edge[] = [
  {
    id: "identity-postgres",
    source: "identity",
    target: "postgres",
    label: "canonical store + outbox",
    ...plannedEdge,
  },
  {
    id: "identity-kafka",
    source: "identity",
    target: "kafka",
    label: "AccountCreated, StreamStarted…",
    ...plannedEdge,
  },
  {
    id: "chat-kafka",
    source: "chat",
    target: "kafka",
    label: "ChatMessageSent, ViewerJoined…",
    ...plannedEdge,
  },
  {
    id: "chat-redis",
    source: "chat",
    target: "redis",
    label: "ring-buffer projection",
    ...plannedEdge,
  },
  {
    id: "kafka-analytics",
    source: "kafka",
    target: "analytics",
    label: "consume → windowed aggregates",
    ...plannedEdge,
  },
  {
    id: "apicurio-identity",
    source: "apicurio",
    target: "identity",
    label: "Avro schemas (all services)",
    ...plannedEdge,
  },
];

const LegendDot = ({ state }: { state: BuildState }) => (
  <span
    className={
      state === "live"
        ? "inline-block size-3 rounded-sm border border-border bg-card"
        : "inline-block size-3 rounded-sm border border-muted-foreground border-dashed"
    }
  />
);

export const SystemTopology = () => (
  <div className="not-prose my-6">
    <div className="mb-2 flex flex-wrap items-center gap-4 text-muted-foreground text-xs">
      <span className="flex items-center gap-1.5">
        <LegendDot state="live" /> live (running today)
      </span>
      <span className="flex items-center gap-1.5">
        <LegendDot state="planned" /> planned (designed, not yet built)
      </span>
      <span>
        Edges are dashed because every flow needs a service that does not exist
        yet.
      </span>
    </div>
    <div className="h-[28rem] w-full rounded-lg border bg-muted/20">
      <ReactFlow
        edges={edges}
        fitView
        nodes={nodes}
        nodesConnectable={false}
        nodesDraggable={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background />
      </ReactFlow>
    </div>
  </div>
);
