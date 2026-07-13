"use client";

import { IconMoon, IconSun } from "@tabler/icons-react";
import { useEffect, useState } from "react";

/**
 * The persistent bottom-right theme FAB — a 48px carbon pill. Light is the
 * resting state (paper editorial); one click drops into the dark "lab" where
 * the yellow glow lives. The choice persists in `localStorage` and is applied
 * before paint by `ThemeScript`, so there is no flash.
 */
export const ThemeToggle = () => {
  const [isDark, setIsDark] = useState(false);

  /** Sync initial state from the class `ThemeScript` already applied. */
  useEffect(() => {
    setIsDark(document.documentElement.classList.contains("dark"));
  }, []);

  const toggle = () => {
    const next = !isDark;
    setIsDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  };

  return (
    <button
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      aria-pressed={isDark}
      className="fixed right-6 bottom-6 z-50 flex size-12 items-center justify-center rounded-pill border border-border bg-card text-foreground shadow-lg transition-all hover:scale-105 active:translate-y-px dark:shadow-glow-sm"
      onClick={toggle}
      type="button"
    >
      {isDark ? (
        <IconMoon className="size-5" />
      ) : (
        <IconSun className="size-5" />
      )}
    </button>
  );
};

/**
 * Inlined into `<head>` so the saved theme is applied before first paint —
 * avoids the light-to-dark flash a hydration-time toggle would cause. Defaults
 * to light when nothing is saved.
 */
export const ThemeScript = () => (
  <script
    // biome-ignore lint/security/noDangerouslySetInnerHtml: pre-hydration theme init must run before paint to avoid a flash
    dangerouslySetInnerHTML={{
      __html: `try{if(localStorage.theme==='dark')document.documentElement.classList.add('dark')}catch(e){}`,
    }}
  />
);
