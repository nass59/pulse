import type { Preview } from "@storybook/nextjs-vite";

// Pull in the app's Tailwind v4 theme so utility classes (and shadcn tokens)
// render identically in Storybook as in the site.
import "../app/globals.css";

const preview: Preview = {
  /**
   * Generate an autodocs Docs page for every component. Storybook pulls each
   * page's description from the JSDoc block above the component, so documented
   * components (e.g. the interactive demos) get prose for free.
   */
  tags: ["autodocs"],

  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: "todo",
    },
  },
};

export default preview;
