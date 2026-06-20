import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent, waitFor } from "storybook/test";

import { CodeBlock } from "./code-block";

const meta = {
  component: CodeBlock,
  parameters: { layout: "padded" },
  tags: ["ai-generated"],
} satisfies Meta<typeof CodeBlock>;

export default meta;

type Story = StoryObj<typeof meta>;

/**
 * In a real doc, Shiki stamps `language-<lang>` onto the `<code>` (via
 * `addLanguageClass`), which the window chrome reads for its label. The stories
 * set that class by hand to mirror the rendered output.
 */
export const Yaml: Story = {
  render: () => (
    <CodeBlock>
      <code className="language-yaml">{`KAFKA_PROCESS_ROLES: broker,controller
KAFKA_CONTROLLER_QUORUM_VOTERS: 1@kafka:9094`}</code>
    </CodeBlock>
  ),
};

export const TypeScript: Story = {
  render: () => (
    <CodeBlock>
      <code className="language-ts">{`import { useSpring } from '@react-spring/web'

export default function Spring() {
  const [props, api] = useSpring(() => ({
    config: { tension: 170, friction: 26 } // no duration
  }))
}`}</code>
    </CodeBlock>
  ),
};

export const Copy: Story = {
  render: () => (
    <CodeBlock>
      <code className="language-bash">bun --filter docs dev</code>
    </CodeBlock>
  ),
  play: async ({ canvas }) => {
    /**
     * Clicking copy flips the affordance to its "Copied" state — proves the
     * click handler runs and the transient state renders. (The clipboard write
     * itself is environment-gated, so we assert on the visible label.)
     */
    const button = canvas.getByRole("button", { name: "Copy code" });
    await userEvent.click(button);
    await waitFor(() =>
      expect(canvas.getByRole("button", { name: "Copied" })).toBeVisible()
    );
  },
};
