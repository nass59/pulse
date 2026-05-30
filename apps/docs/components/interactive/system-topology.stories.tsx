import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import { SystemTopology } from "./system-topology";

const meta = {
  title: "Interactive/SystemTopology",
  component: SystemTopology,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof SystemTopology>;

export default meta;

type Story = StoryObj<typeof meta>;

const LIVE_LEGEND = /live \(running today\)/i;
const PLANNED_LEGEND = /planned \(designed, not yet built\)/i;

export const Default: Story = {
  play: async ({ canvas }) => {
    /** The live infra and the planned services both render as nodes. */
    await expect(canvas.getByText("Kafka")).toBeInTheDocument();
    await expect(canvas.getByText("identity")).toBeInTheDocument();
    /** The legend explains the build-state encoding. */
    await expect(canvas.getByText(LIVE_LEGEND)).toBeInTheDocument();
    await expect(canvas.getByText(PLANNED_LEGEND)).toBeInTheDocument();
  },
};
