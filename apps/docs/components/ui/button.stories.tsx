import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import { Button } from "./button";

const meta = {
  component: Button,
  parameters: { layout: "centered" },
  tags: ["ai-generated"],
} satisfies Meta<typeof Button>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: { children: "Order now" },
  play: async ({ canvas }) => {
    /**
     * getByRole with an accessible name proves the `children` prop rendered as
     * the button's label — not just that *a* button mounted.
     */
    await expect(
      canvas.getByRole("button", { name: "Order now" })
    ).toBeVisible();
  },
};

export const Outline: Story = {
  args: { children: "Cancel", variant: "outline" },
};

export const Secondary: Story = {
  args: { children: "Save draft", variant: "secondary" },
};

export const Ghost: Story = {
  args: { children: "Dismiss", variant: "ghost" },
};

export const Destructive: Story = {
  args: { children: "Delete", variant: "destructive" },
};

export const Link: Story = {
  args: { children: "Learn more", variant: "link" },
};

export const Small: Story = {
  args: { children: "Compact", size: "sm" },
};

export const Large: Story = {
  args: { children: "Roomy", size: "lg" },
};

export const Disabled: Story = {
  args: { children: "Unavailable", disabled: true },
  play: async ({ canvas }) => {
    /**
     * Proves the `disabled` prop reaches the native button and is exposed to
     * assistive tech — the render alone wouldn't catch a dropped attribute.
     */
    await expect(
      canvas.getByRole("button", { name: "Unavailable" })
    ).toBeDisabled();
  },
};

export const CssCheck: Story = {
  args: { children: "Submit" },
  play: async ({ canvas }) => {
    const button = canvas.getByRole("button", { name: "Submit" });
    /**
     * DevLab buttons are stadium-shaped: the base class carries `rounded-pill`,
     * which resolves to var(--radius-pill) → 9999px. A concrete computed value
     * is the only proof that Tailwind compiled AND the DevLab theme variables
     * from globals.css actually loaded into the preview — toBeVisible would pass
     * even on a completely unstyled button.
     */
    await expect(getComputedStyle(button).borderRadius).toBe("9999px");
  },
};
