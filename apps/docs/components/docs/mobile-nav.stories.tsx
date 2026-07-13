import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, screen, userEvent, within } from "storybook/test";

import { MobileNav } from "./mobile-nav";

/**
 * The small-screen navigation drawer. The trigger only renders below `md`,
 * so the story uses a mobile viewport to make it visible and exercisable.
 */
const meta = {
  component: MobileNav,
  globals: { viewport: { value: "mobile1" } },
  parameters: { layout: "fullscreen" },
  tags: ["ai-generated"],
} satisfies Meta<typeof MobileNav>;

export default meta;

type Story = StoryObj<typeof meta>;

export const OpensAndListsLinks: Story = {
  args: {
    items: [
      { href: "/kafka", label: "Kafka" },
      { href: "/go", label: "Go" },
      { href: "/kotlin", label: "Kotlin" },
      { href: "/build", label: "The Build" },
    ],
  },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByLabelText("Open navigation"));
    /** The drawer portals to document.body, outside the story canvas. */
    const drawer = within(await screen.findByRole("dialog"));
    await expect(drawer.getByText("Kafka")).toBeVisible();
    await expect(drawer.getByText("The Build")).toBeVisible();
    await expect(drawer.getByText("GitHub")).toBeVisible();
  },
};
