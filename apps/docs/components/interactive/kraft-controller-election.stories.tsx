import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent } from "storybook/test";

import { KraftControllerElection } from "./kraft-controller-election";

const meta = {
  title: "Interactive/KraftControllerElection",
  component: KraftControllerElection,
  parameters: { layout: "padded" },
} satisfies Meta<typeof KraftControllerElection>;

export default meta;

type Story = StoryObj<typeof meta>;

const RUN_BUTTON = /run boot sequence/i;

export const Default: Story = {};

export const RunsToHealthy: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: RUN_BUTTON }));
    /**
     * The sequence steps through four phases on timers. The health badge reads
     * "healthy" only in the final serving phase, so waiting for it proves the
     * broker booted all the way to controller-elected-and-serving. (The phase
     * titles all render in the static timeline, so they can't be used to detect
     * arrival at the end.)
     */
    await expect(
      await canvas.findByText("healthy", undefined, { timeout: 8000 })
    ).toBeInTheDocument();
  },
};
