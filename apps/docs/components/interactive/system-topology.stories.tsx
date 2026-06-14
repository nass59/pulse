import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent } from "storybook/test";

import { SystemTopology } from "./system-topology";

const meta = {
  title: "Interactive/SystemTopology",
  component: SystemTopology,
  parameters: { layout: "padded" },
} satisfies Meta<typeof SystemTopology>;

export default meta;

type Story = StoryObj<typeof meta>;

const PROMPT = /inspect the contracts it owns/i;
const IDENTITY_NODE = /^identity$/;
const CHAT_NODE = /^chat$/;

export const Default: Story = {
  play: async ({ canvas }) => {
    /** At rest the panel invites exploration rather than pinning a node. */
    await expect(canvas.getByText(PROMPT)).toBeInTheDocument();
    /** The backbone and the live service both render as nodes. */
    await expect(canvas.getByText("Kafka")).toBeInTheDocument();
  },
};

export const ClickIdentityShowsLiveContracts: Story = {
  play: async ({ canvas }) => {
    /**
     * Clicking the one live service pins its panel and lists the real topics it
     * produces today — sourced from EVENT_TOPICS, so this can't drift.
     */
    await userEvent.click(canvas.getByText(IDENTITY_NODE));
    await expect(canvas.getByText("StreamStarted")).toBeInTheDocument();
    await expect(canvas.getByText("stream.started.v1")).toBeInTheDocument();
  },
};

export const ClickChatShowsPlannedContracts: Story = {
  play: async ({ canvas }) => {
    /**
     * A planned service still names its designed contracts — the schemas exist
     * in packages/schemas even though no Go code produces them yet.
     */
    await userEvent.click(canvas.getByText(CHAT_NODE));
    await expect(canvas.getByText("ChatMessageSent")).toBeInTheDocument();
    await expect(canvas.getByText("chat.messages.v1")).toBeInTheDocument();
  },
};
