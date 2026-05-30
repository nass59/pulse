import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import { Button } from "./button";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./card";

const meta = {
  component: Card,
  parameters: { layout: "centered" },
  tags: ["ai-generated"],
} satisfies Meta<typeof Card>;

export default meta;

type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => (
    <Card {...args} className="w-80">
      <CardHeader>
        <CardTitle>Consumer lag</CardTitle>
        <CardDescription>Messages behind the latest offset.</CardDescription>
      </CardHeader>
      <CardContent>1,204 records across 3 partitions.</CardContent>
      <CardFooter>
        <Button size="sm">Acknowledge</Button>
      </CardFooter>
    </Card>
  ),
  play: async ({ canvas }) => {
    /**
     * Asserts the composed slots actually rendered their content — a smoke test
     * that the header/content/footer tree mounted, not just the outer card div.
     */
    await expect(canvas.getByText("Consumer lag")).toBeVisible();
    await expect(
      canvas.getByRole("button", { name: "Acknowledge" })
    ).toBeVisible();
  },
};

export const WithAction: Story = {
  render: (args) => (
    <Card {...args} className="w-80">
      <CardHeader>
        <CardTitle>Topic: orders</CardTitle>
        <CardDescription>Retention 7d · 12 partitions</CardDescription>
        <CardAction>
          <Button aria-label="Topic settings" size="icon-sm" variant="ghost">
            ⋯
          </Button>
        </CardAction>
      </CardHeader>
      <CardContent>Replication factor 3.</CardContent>
    </Card>
  ),
};

export const Small: Story = {
  render: (args) => (
    <Card {...args} className="w-72" size="sm">
      <CardHeader>
        <CardTitle>Broker 2</CardTitle>
        <CardDescription>Healthy</CardDescription>
      </CardHeader>
      <CardContent>Leader for 4 partitions.</CardContent>
    </Card>
  ),
};
