import type { Preview } from "@storybook/nextjs-vite";
import localFont from "next/font/local";
import { useEffect } from "react";

// Pull in the app's Tailwind v4 theme so utility classes (and the DevLab
// tokens) render identically in Storybook as on the site.
import "../app/globals.css";

/**
 * The fonts are loaded in `app/layout.tsx`, which Storybook never renders — so
 * the `--font-sans` / `--font-mono` variables would be unset here and type
 * would fall back to system-ui. Re-declare the same self-hosted variable fonts
 * and hang their `.variable` classes on the decorator wrapper so every story
 * gets DevLab's Spline Sans + JetBrains Mono.
 */
const splineSans = localFont({
  src: "../app/fonts/SplineSans-VariableFont_wght.ttf",
  variable: "--font-sans",
  weight: "300 700",
  display: "swap",
});

const jetbrainsMono = localFont({
  src: [
    {
      path: "../app/fonts/JetBrainsMono-VariableFont_wght.ttf",
      style: "normal",
      weight: "100 800",
    },
    {
      path: "../app/fonts/JetBrainsMono-Italic-VariableFont_wght.ttf",
      style: "italic",
      weight: "100 800",
    },
  ],
  variable: "--font-mono",
  display: "swap",
});

const preview: Preview = {
  /**
   * Generate an autodocs Docs page for every component. Storybook pulls each
   * page's description from the JSDoc block above the component, so documented
   * components (e.g. the interactive demos) get prose for free.
   */
  tags: ["autodocs"],

  /**
   * A theme toolbar mirroring the docs site: light "paper" is the resting
   * state, one click drops into the dark "lab" where the yellow glow lives.
   * Toggling sets the `.dark` class on the root so the DevLab tokens cascade.
   */
  globalTypes: {
    theme: {
      description: "DevLab surface",
      defaultValue: "light",
      toolbar: {
        title: "Theme",
        icon: "mirror",
        items: [
          { value: "light", title: "Light (paper)", icon: "sun" },
          { value: "dark", title: "Dark (lab)", icon: "moon" },
        ],
        dynamicTitle: true,
      },
    },
  },

  decorators: [
    (Story, context) => {
      const theme = context.globals.theme as "light" | "dark";
      useEffect(() => {
        document.documentElement.classList.toggle("dark", theme === "dark");
        document.body.style.backgroundColor = "var(--background)";
        document.body.style.color = "var(--foreground)";
      }, [theme]);
      return (
        <div
          className={`${splineSans.variable} ${jetbrainsMono.variable} font-sans`}
        >
          <Story />
        </div>
      );
    },
  ],

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
