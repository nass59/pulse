"use client";

import { useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * The hero's rotating language word. Kafka stays the grammatical anchor of the
 * headline; this word cycles Go → Kotlin → TypeScript, each carrying its own
 * technology accent (ADR-0020's 2026-06-21 amendment — the accent doing its
 * most literal possible job). The hero surface stays neutral; only the word is
 * tinted, so Pulse still reads as a yellow brand at first paint.
 */
const WORDS = [
  { text: "Go", className: "text-go-blue" },
  { text: "Kotlin", className: "text-kotlin-purple" },
  { text: "TypeScript", className: "text-accent-blue" },
] as const;

const PERIOD_MS = 2400;
const SWAP_MS = 420;

export const RotatingWord = () => {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (reduce) {
      return;
    }
    let swap: ReturnType<typeof setTimeout>;
    const cycle = setInterval(() => {
      setVisible(false);
      swap = setTimeout(() => {
        setIndex((i) => (i + 1) % WORDS.length);
        setVisible(true);
      }, SWAP_MS);
    }, PERIOD_MS);
    return () => {
      clearInterval(cycle);
      clearTimeout(swap);
    };
  }, [reduce]);

  return (
    <>
      {/* Screen readers hear all three languages; the animation is visual-only. */}
      <span className="sr-only">{WORDS.map((w) => w.text).join(", ")}</span>
      <span
        aria-hidden="true"
        className="inline-grid overflow-hidden align-baseline"
      >
        {WORDS.map((word, i) => (
          <span
            className={cn(
              "col-start-1 row-start-1 transition-[transform,opacity,filter] duration-400 ease-out-strong",
              word.className,
              i === index && visible
                ? "translate-y-0 opacity-100 blur-none"
                : "translate-y-[0.35em] opacity-0 blur-[3px]",
              /** idle slots park above so the next word always enters upward */
              i !== index && "-translate-y-[0.35em]"
            )}
            key={word.text}
          >
            {word.text}
          </span>
        ))}
      </span>
    </>
  );
};
