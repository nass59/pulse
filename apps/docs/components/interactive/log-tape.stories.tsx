import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent } from "storybook/test";

import { LogTape } from "./log-tape";

const meta = {
  title: "Interactive/LogTape",
  component: LogTape,
  parameters: { layout: "padded" },
} satisfies Meta<typeof LogTape>;

export default meta;

type Story = StoryObj<typeof meta>;

const ADVANCE_BUTTON = /advance replay/i;
const OFFSET_ONE = /offset 1/;

export const Default: Story = {};

export const ReplayMovesIndependently: Story = {
  play: async ({ canvas }) => {
    /**
     * The strategy reader starts at offset 0. Advancing it must move only its
     * own offset — the proof that two consumers hold independent positions over
     * the same log.
     */
    await userEvent.click(canvas.getByRole("button", { name: ADVANCE_BUTTON }));
    await expect(await canvas.findByText(OFFSET_ONE)).toBeInTheDocument();
  },
};
