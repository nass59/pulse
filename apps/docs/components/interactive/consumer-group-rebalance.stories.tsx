import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent } from "storybook/test";

import { ConsumerGroupRebalance } from "./consumer-group-rebalance";

const meta = {
  title: "Interactive/ConsumerGroupRebalance",
  component: ConsumerGroupRebalance,
  parameters: { layout: "padded" },
} satisfies Meta<typeof ConsumerGroupRebalance>;

export default meta;

type Story = StoryObj<typeof meta>;

const ADD_BUTTON = /add consumer/i;
/** Unique to the idle consumer column — the paragraph below also says "idle". */
const IDLE_LABEL = /no partition/i;

export const Default: Story = {};

export const ExtraConsumerGoesIdle: Story = {
  play: async ({ canvas }) => {
    /**
     * Four partitions cap useful parallelism at four. Growing the group to five
     * must leave the fifth consumer with no partition — the visible ceiling.
     */
    /** Re-query each time: the button re-renders, so a captured node goes stale. */
    for (let i = 0; i < 3; i++) {
      await userEvent.click(canvas.getByRole("button", { name: ADD_BUTTON }));
    }
    await expect(await canvas.findByText(IDLE_LABEL)).toBeInTheDocument();
  },
};
