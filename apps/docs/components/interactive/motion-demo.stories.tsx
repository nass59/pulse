import type { Meta, StoryObj } from "@storybook/nextjs-vite";

import { MotionDemo } from "./motion-demo";

const meta = {
  title: "Interactive/MotionDemo",
  component: MotionDemo,
  parameters: { layout: "centered" },
} satisfies Meta<typeof MotionDemo>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {};
