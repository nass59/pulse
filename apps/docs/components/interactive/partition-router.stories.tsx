import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent } from "storybook/test";

import { PartitionRouter } from "./partition-router";

const meta = {
  title: "Interactive/PartitionRouter",
  component: PartitionRouter,
  parameters: { layout: "padded" },
} satisfies Meta<typeof PartitionRouter>;

export default meta;

type Story = StoryObj<typeof meta>;

const SCATTER_BUTTON = /one from every match/i;
const EVENT_LABEL = /goal|card|sub|xG/;

export const Default: Story = {};

export const ScatterRoutesRecords: Story = {
  play: async ({ canvas }) => {
    /**
     * Sending one event per match drops four records into the partition lanes;
     * each carries an event label, so finding any of them proves routing ran.
     */
    await userEvent.click(canvas.getByRole("button", { name: SCATTER_BUTTON }));
    const records = await canvas.findAllByText(EVENT_LABEL);
    expect(records.length).toBeGreaterThan(0);
  },
};
