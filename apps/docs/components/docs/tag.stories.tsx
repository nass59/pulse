import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { Activity, GraduationCap, Zap } from "lucide-react";
import { expect } from "storybook/test";

import { Tag } from "./tag";

const meta = {
  component: Tag,
  parameters: { layout: "centered" },
  tags: ["ai-generated"],
} satisfies Meta<typeof Tag>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Editorial: Story = {
  args: { children: "Kafka", hash: true },
  play: async ({ canvas }) => {
    /** The `#` prefix is rendered by the component, not part of children. */
    await expect(canvas.getByText("#")).toBeVisible();
    await expect(canvas.getByText("Kafka")).toBeVisible();
  },
};

export const WithIcon: Story = {
  args: { children: "Intermediate", icon: GraduationCap, accent: "orange" },
};

export const Accents: Story = {
  args: { children: "Tag" },
  render: () => (
    <div className="flex flex-wrap gap-2">
      <Tag accent="yellow" icon={Zap}>
        Brand
      </Tag>
      <Tag accent="blue">TypeScript</Tag>
      <Tag accent="purple">Animation</Tag>
      <Tag accent="green" icon={Activity}>
        System Online
      </Tag>
      <Tag accent="orange">Intermediate</Tag>
      <Tag>Neutral</Tag>
    </div>
  ),
};
