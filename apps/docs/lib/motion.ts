/**
 * Shared motion values. The strong ease-out is the site's one deliberate
 * curve for entrances and content swaps — the CSS twin lives in globals.css
 * as `--ease-out-strong` (utility: `ease-out-strong`). Keep the two in sync.
 */
export const EASE_OUT_STRONG: [number, number, number, number] = [
  0.23, 1, 0.32, 1,
];
