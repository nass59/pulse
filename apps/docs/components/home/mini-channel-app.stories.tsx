import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import { MiniChannelApp } from "./mini-channel-app";

/**
 * The channel-page miniature always renders on the homepage's dark sheet, so
 * every story wraps it in the same forced-dark context.
 */
const meta = {
  component: MiniChannelApp,
  decorators: [
    (Story) => (
      <div className="dark w-80 bg-carbon-900 p-6">
        <Story />
      </div>
    ),
  ],
  parameters: { layout: "centered" },
  tags: ["ai-generated"],
} satisfies Meta<typeof MiniChannelApp>;

export default meta;

type Story = StoryObj<typeof meta>;

/** Uncontrolled — quietly simulates a live channel while in view. */
export const SelfDriving: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText("LIVE")).toBeVisible();
    await expect(canvas.getByText("nass")).toBeVisible();
  },
};

/** The hero configuration — a working message box wired to `onSend`. */
export const Interactive: Story = {
  args: { interactive: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByLabelText("chat message")).toBeVisible();
    await expect(canvas.getByLabelText("send message")).toBeVisible();
  },
};

/** Controlled — the ride's final step: your message came back. */
export const Controlled: Story = {
  args: {
    flash: true,
    messages: [
      { user: "ren", text: "POG" },
      { user: "ava", text: "clip that" },
      { user: "you", text: "let's gooo" },
    ],
    viewers: 1287,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("let's gooo")).toBeVisible();
    await expect(canvas.getByText("1,287")).toBeVisible();
  },
};
