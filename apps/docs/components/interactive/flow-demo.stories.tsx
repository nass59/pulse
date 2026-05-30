import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { FlowDemo } from "./flow-demo";

const meta = {
  title: "Interactive/FlowDemo",
  component: FlowDemo,
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof FlowDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
