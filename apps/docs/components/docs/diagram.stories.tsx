import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import {
  AutoTopicFlow,
  ControllerRole,
  DependsOnRace,
  HealthcheckTimeline,
  KraftVsZookeeper,
  QuorumFaultTolerance,
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
