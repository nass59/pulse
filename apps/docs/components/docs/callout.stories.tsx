import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import { Callout } from "./callout";

const meta = {
  component: Callout,
  parameters: { layout: "padded" },
  tags: ["ai-generated"],
} satisfies Meta<typeof Callout>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Note: Story = {
  args: {
    children: "A neutral framing aside — the default variant.",
  },
};

export const KeyConcept: Story = {
  args: {
    variant: "key",
    children:
      "KRaft folds metadata management into Kafka itself — one fewer distributed system to operate.",
  },
  play: async ({ canvas }) => {
    /**
     * The label text is derived from the variant, not passed in — proves the
     * variant→label mapping resolved rather than a hardcoded string.
     */
    await expect(canvas.getByText("Key Concept")).toBeVisible();
  },
};

export const PerformanceNote: Story = {
  args: {
    variant: "perf",
    children:
      "Compacted topics trade history for the latest value per key — cheap reads, no replay of every event.",
  },
};

export const LessonLearned: Story = {
  args: {
    variant: "lesson",
    children:
      "Bitnami moved its free images behind a paywall; the silent pull failure is why the Compose file is a reproducibility contract.",
  },
};

export const FootgunInProduction: Story = {
  args: {
    variant: "footgun",
    children:
      "Auto-topic-creation papers over a missing topic in dev and bites you with a silently mis-partitioned topic in prod.",
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Footgun in Production")).toBeVisible();
  },
};

export const CustomTitle: Story = {
  args: {
    variant: "lesson",
    title: "Apicurio -mem deleted in v3 — pinned to v2.6.x",
    children:
      "An explicit title overrides the variant's default label while keeping its icon and accent.",
  },
};
