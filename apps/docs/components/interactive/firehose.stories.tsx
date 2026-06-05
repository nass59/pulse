import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import { Firehose } from "./firehose";

/**
 * The homepage motivating example. It auto-plays when in view and falls back to
 * a static composition under `prefers-reduced-motion`, so the test asserts the
 * structural labels that render in both states rather than the motion itself.
 */
const meta = {
  title: "Interactive/Firehose",
  component: Firehose,
  parameters: { layout: "padded" },
  tags: ["ai-generated"],
} satisfies Meta<typeof Firehose>;

export default meta;

type Story = StoryObj<typeof meta>;

const CHANNEL_LIVE = /channel · live/i;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText(CHANNEL_LIVE)).toBeVisible();
    await expect(canvas.getByText("analytics")).toBeVisible();
  },
};
