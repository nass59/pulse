import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent } from "storybook/test";

import { OutboxLab } from "./outbox-lab";

const meta = {
  title: "Interactive/OutboxLab",
  component: OutboxLab,
  parameters: { layout: "padded" },
} satisfies Meta<typeof OutboxLab>;

export default meta;

type Story = StoryObj<typeof meta>;

const LOST_EVENT_CRASH = /crash after commit, before publish/i;
const OUTBOX_STRATEGY = /transactional outbox/i;
const RELAY_CRASH = /relay dies after kafka ack/i;
const AGREE_VERDICT = /postgres and kafka agree/i;
const DISAGREE_VERDICT = /postgres and kafka disagree/i;
const DUPE_VERDICT = /delivered more than once/i;

export const Default: Story = {
  play: async ({ canvas }) => {
    /** Dual-write with no crash looks consistent — the trap the widget springs. */
    await expect(canvas.getByText(AGREE_VERDICT)).toBeInTheDocument();
  },
};

export const DualWriteLosesEvent: Story = {
  play: async ({ canvas }) => {
    /**
     * The load-bearing lesson: a crash between COMMIT and publish leaves Postgres
     * and Kafka disagreeing — the lost-event bug the outbox exists to kill.
     */
    await userEvent.click(
      canvas.getByRole("button", { name: LOST_EVENT_CRASH })
    );
    await expect(canvas.getByText(DISAGREE_VERDICT)).toBeInTheDocument();
  },
};

export const OutboxDuplicatesButStaysConsistent: Story = {
  play: async ({ canvas }) => {
    /**
     * Switch to the outbox and crash the relay mid-publish: the systems still
     * agree, the only residue is a duplicate — at-least-once made visible.
     */
    await userEvent.click(
      canvas.getByRole("button", { name: OUTBOX_STRATEGY })
    );
    await userEvent.click(canvas.getByRole("button", { name: RELAY_CRASH }));
    await expect(canvas.getByText(DUPE_VERDICT)).toBeInTheDocument();
  },
};
