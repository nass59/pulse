import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent } from "storybook/test";

import { SchemaEvolution } from "./schema-evolution";

const meta = {
  title: "Interactive/SchemaEvolution",
  component: SchemaEvolution,
  parameters: { layout: "padded" },
} satisfies Meta<typeof SchemaEvolution>;

export default meta;

type Story = StoryObj<typeof meta>;

const ADD_REQUIRED_BUTTON = /add required field/i;
const REJECTED_VERDICT = /rejected by backward/i;
const ACCEPTED_VERDICT = /registered as v2/i;

export const Default: Story = {
  play: async ({ canvas }) => {
    /** The default scenario (add optional field) is backward-compatible. */
    await expect(canvas.getByText(ACCEPTED_VERDICT)).toBeInTheDocument();
  },
};

export const RequiredFieldRejected: Story = {
  play: async ({ canvas }) => {
    /**
     * Switching to "add required field" — same field, no default — flips the
     * registry verdict to a 409, which is the load-bearing lesson of the widget.
     */
    await userEvent.click(
      canvas.getByRole("button", { name: ADD_REQUIRED_BUTTON })
    );
    await expect(canvas.getByText(REJECTED_VERDICT)).toBeInTheDocument();
  },
};
