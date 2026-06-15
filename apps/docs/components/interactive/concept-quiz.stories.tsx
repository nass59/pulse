import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, userEvent } from "storybook/test";

import { ConceptQuiz } from "./concept-quiz";

const meta = {
  title: "Interactive/ConceptQuiz",
  component: ConceptQuiz,
  parameters: { layout: "padded" },
  args: { slug: "kraft-mode" },
} satisfies Meta<typeof ConceptQuiz>;

export default meta;

type Story = StoryObj<typeof meta>;

const FIRST_PROMPT = /before kraft/i;
const CORRECT_OPTION = /separate zookeeper ensemble/i;
const WRONG_OPTION = /a redis cache/i;
const CORRECT_LABEL = /^correct$/i;
const WRONG_LABEL = /^not quite$/i;
const NEXT_BUTTON = /next question/i;

export const Default: Story = {
  play: async ({ canvas }) => {
    /** Deterministic open: question one is on screen, nothing answered yet. */
    await expect(canvas.getByText(FIRST_PROMPT)).toBeInTheDocument();
  },
};

export const CorrectAnswerRevealsExplanation: Story = {
  play: async ({ canvas }) => {
    /** Picking the right option flips to a "Correct" verdict + a Next control. */
    await userEvent.click(canvas.getByRole("button", { name: CORRECT_OPTION }));
    await expect(canvas.getByText(CORRECT_LABEL)).toBeInTheDocument();
    await expect(
      canvas.getByRole("button", { name: NEXT_BUTTON })
    ).toBeInTheDocument();
  },
};

export const WrongAnswerIsMarked: Story = {
  play: async ({ canvas }) => {
    /** A wrong pick reads "Not quite" — and the explanation still teaches. */
    await userEvent.click(canvas.getByRole("button", { name: WRONG_OPTION }));
    await expect(canvas.getByText(WRONG_LABEL)).toBeInTheDocument();
  },
};
