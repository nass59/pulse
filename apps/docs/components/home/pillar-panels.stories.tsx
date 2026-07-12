import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import { PillarPanels } from "./pillar-panels";

/**
 * The per-pillar widget row — Kafka replay, Go fan-out, Kotlin hopping
 * windows, each washed with its technology's accent. Forced-dark like its
 * homepage host.
 */
const meta = {
  component: PillarPanels,
  decorators: [
    (Story) => (
      <div className="dark bg-carbon-900">
        <Story />
      </div>
    ),
  ],
  parameters: { layout: "fullscreen" },
  tags: ["ai-generated"],
} satisfies Meta<typeof PillarPanels>;

export default meta;

type Story = StoryObj<typeof meta>;

export const AllThree: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Replay from any offset")).toBeVisible();
    await expect(
      canvas.getByText("One goroutine per connection")
    ).toBeVisible();
    await expect(
      canvas.getByText("Hopping windows over presence")
    ).toBeVisible();
    /** The Kafka panel's offset scrubber is real, not decorative. */
    await expect(canvas.getByLabelText("consumer offset")).toBeVisible();
  },
};
