import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import {
  AutoTopicFlow,
  ControllerRole,
  CoPartitionRouting,
  DependsOnRace,
  FanoutVsLog,
  GoroutineReadLoop,
  HealthcheckTimeline,
  KraftVsZookeeper,
  LiveMapFromLog,
  LogWithOffsets,
  QuorumFaultTolerance,
  ServerAuthoredStamp,
  VolumePersistence,
} from "./diagram";

/**
 * The static concept figures. These are server components with no interactivity
 * (the dynamics-shaped filter keeps animation off declarative concepts), so the
 * stories are visual references plus a smoke check that each figure renders its
 * key labels.
 */
const meta = {
  title: "Docs/Diagram",
  parameters: { layout: "padded" },
  tags: ["ai-generated"],
} satisfies Meta;

export default meta;

type Story = StoryObj;

const START_PERIOD = /start_period 20s/i;
const DOWN_V = /volume wiped/i;
const FOOTGUN = /the footgun/i;
const CONTROLLER_BOOKS = /the cluster's metadata/i;
const ZOOKEEPER_CLERK = /zookeeper ensemble — the clerk/i;
const CONNECTION_REFUSED = /connection refused/i;
const GATEWAY_STAMPS = /^the gateway stamps$/;
const REPLAY_FROM_START = /replay from start/i;
const ONE_ORDERED_CHANNEL = /one ordered channel/i;
const LIVE_CHANNEL_MAP = /live-channel map/i;
const BEST_EFFORT = /best-effort · live push/i;
const WRITE_PUMP = /goroutine · write pump/i;

export const Healthcheck: Story = {
  render: () => <HealthcheckTimeline />,
  play: async ({ canvas }) => {
    await expect(canvas.getByText(START_PERIOD)).toBeVisible();
  },
};

export const Volume: Story = {
  render: () => <VolumePersistence />,
  play: async ({ canvas }) => {
    await expect(canvas.getByText(DOWN_V)).toBeVisible();
  },
};

export const AutoTopic: Story = {
  render: () => <AutoTopicFlow />,
  play: async ({ canvas }) => {
    await expect(canvas.getByText(FOOTGUN)).toBeVisible();
  },
};

export const Controller: Story = {
  render: () => <ControllerRole />,
  play: async ({ canvas }) => {
    await expect(canvas.getByText(CONTROLLER_BOOKS)).toBeVisible();
  },
};

export const KraftVsZooKeeper: Story = {
  render: () => <KraftVsZookeeper />,
  play: async ({ canvas }) => {
    await expect(canvas.getByText(ZOOKEEPER_CLERK)).toBeVisible();
  },
};

export const Quorum: Story = {
  render: () => <QuorumFaultTolerance />,
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Pulse")).toBeVisible();
  },
};

export const DependsOn: Story = {
  render: () => <DependsOnRace />,
  play: async ({ canvas }) => {
    await expect(canvas.getByText(CONNECTION_REFUSED)).toBeVisible();
  },
};

export const ServerAuthored: Story = {
  render: () => <ServerAuthoredStamp />,
  play: async ({ canvas }) => {
    await expect(canvas.getByText(GATEWAY_STAMPS)).toBeVisible();
  },
};

export const LogOffsets: Story = {
  render: () => <LogWithOffsets />,
  play: async ({ canvas }) => {
    await expect(canvas.getByText(REPLAY_FROM_START)).toBeVisible();
  },
};

export const CoPartition: Story = {
  render: () => <CoPartitionRouting />,
  play: async ({ canvas }) => {
    await expect(canvas.getByText(ONE_ORDERED_CHANNEL)).toBeVisible();
  },
};

export const LiveMap: Story = {
  render: () => <LiveMapFromLog />,
  play: async ({ canvas }) => {
    await expect(canvas.getByText(LIVE_CHANNEL_MAP)).toBeVisible();
  },
};

export const Fanout: Story = {
  render: () => <FanoutVsLog />,
  play: async ({ canvas }) => {
    await expect(canvas.getByText(BEST_EFFORT)).toBeVisible();
  },
};

/** Go-tier figure — exercises the Go-blue accent token (ADR-0020). */
export const GoroutineLoop: Story = {
  render: () => <GoroutineReadLoop />,
  play: async ({ canvas }) => {
    await expect(canvas.getByText(WRITE_PUMP)).toBeVisible();
  },
};
