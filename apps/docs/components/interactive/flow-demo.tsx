"use client";

import { Background, type Edge, type Node, ReactFlow } from "@xyflow/react";

/**
 * xyflow's stylesheet is imported here, colocated with the only component that
 * needs it — not globally — so the dependency travels with its consumer.
 */
import "@xyflow/react/dist/style.css";

/**
 * A trivial 3-node / 2-edge graph echoing the kcat smoke test:
 * producer → topic → consumer. Exists to prove @xyflow/react renders in the
 * docs app; not a real topology widget (ADR-0007's dynamics-shaped filter).
 */
const nodes: Node[] = [
  { id: "producer", position: { x: 0, y: 40 }, data: { label: "producer" } },
  { id: "topic", position: { x: 180, y: 40 }, data: { label: "topic" } },
  { id: "consumer", position: { x: 360, y: 40 }, data: { label: "consumer" } },
];

const edges: Edge[] = [
  { id: "producer-topic", source: "producer", target: "topic" },
  { id: "topic-consumer", source: "topic", target: "consumer" },
];

export const FlowDemo = () => {
  /**
   * xyflow needs an explicitly-sized container; without a height it renders 0px
   * tall and looks broken.
   */
  return (
    <div className="h-96 w-full rounded-lg border">
      <ReactFlow edges={edges} fitView nodes={nodes}>
        <Background />
      </ReactFlow>
    </div>
  );
};
