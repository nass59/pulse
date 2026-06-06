import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent } from "storybook/test";

import { RoadmapPhaseDrawers } from "./phase-drawers";

const meta = {
  title: "Home/RoadmapPhaseDrawers",
  component: RoadmapPhaseDrawers,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof RoadmapPhaseDrawers>;

export default meta;

type Story = StoryObj<typeof meta>;

const KRAFT_MODE = /KRaft mode/i;
const FIRST_LIGHT = /First Light/i;

export const Default: Story = {
  play: async ({ canvas }) => {
    /** The current phase is open by default, so its live concept links show. */
    await expect(canvas.getByText("Foundations")).toBeInTheDocument();
    await expect(
      canvas.getByRole("link", { name: KRAFT_MODE })
    ).toBeInTheDocument();
    /** Its in-flight, not-yet-shipped concept is present but unlinked. */
    await expect(canvas.getByText("Schema compatibility")).toBeInTheDocument();
  },
};

export const OpensAPlannedPhase: Story = {
  play: async ({ canvas }) => {
    /** A planned phase starts collapsed: its concepts aren't in the tree yet. */
    await expect(canvas.queryByText("Transactional outbox")).toBeNull();
    /** Opening "First Light" reveals them. */
    await userEvent.click(canvas.getByRole("button", { name: FIRST_LIGHT }));
    await expect(canvas.getByText("Transactional outbox")).toBeInTheDocument();
  },
};
