import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import { EventRide } from "./event-ride";

/**
 * The homepage centrepiece — hero, ticker belt, and the five-step payload
 * ride with its sticky inspector. The story renders the full flow on the
 * dark sheet; scroll the canvas to walk the steps.
 */
const meta = {
  component: EventRide,
  decorators: [
    (Story) => (
      <div className="dark bg-carbon-900">
        <Story />
      </div>
    ),
  ],
  parameters: { layout: "fullscreen" },
  tags: ["ai-generated"],
} satisfies Meta<typeof EventRide>;

export default meta;

type Story = StoryObj<typeof meta>;

export const FullRide: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText("You hit send.")).toBeVisible();
    await expect(canvas.getByText("You become history.")).toBeVisible();
    /** The default payload rides until the visitor types their own. */
    await expect(canvas.getByLabelText("chat message")).toBeVisible();
  },
};
