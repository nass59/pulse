"use client";

import {
  ArrowRight,
  Check,
  Gamepad2,
  RotateCcw,
  Trophy,
  X,
} from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { type ReactNode, useMemo, useState } from "react";

import { QUIZZES, type QuizQuestion } from "@/lib/quiz";
import { cn } from "@/lib/utils";

/**
 * "Check yourself" — the recall quiz that closes every live concept page. You
 * read the page, then a few questions probe whether the idea actually stuck:
 * pick an answer, get instant right/wrong feedback, and read the explanation
 * (where the analogy lands) before moving on. A score and a themed verdict cap
 * the run.
 *
 * Dynamics-shaped per ADR-0007: it's a flow over time (question → feedback →
 * next → result) with a visible effect at every step, not a declarative fact —
 * so it earns a client widget over prose. The data is the payload, sourced from
 * `lib/quiz.tsx` keyed by concept slug, the same way the concept index reads
 * `lib/concepts.ts`.
 *
 * Deterministic initial render (the LogTape lesson): always starts at question
 * 0 with nothing selected. Option order IS shuffled — otherwise the correct
 * answer is always "A" and you can cheese the whole quiz — but the shuffle is
 * seeded off the question id (plus the attempt count), never `Math.random()`
 * at render. That keeps the server and the first client render in lockstep (no
 * hydration mismatch) while still scrambling the answers, and re-seeds on "Run
 * it back" so a second attempt isn't muscle memory. Honours `useReducedMotion`.
 * No autoplay, so no IntersectionObserver gate is needed.
 */

/** Largest 31-bit prime — the modulus for both the hash and the PRNG below. */
const MODULUS = 2_147_483_647;

/**
 * A deterministic polynomial string hash — a stable seed from a question id.
 * Arithmetic-only (no bitwise ops, which this repo's linter prohibits) and
 * kept under `MODULUS` so every intermediate stays a safe integer.
 */
const hashString = (str: string): number => {
  let h = 0;
  for (const ch of str) {
    h = (h * 31 + ch.charCodeAt(0)) % MODULUS;
  }
  return h;
};

/**
 * A seeded Park–Miller (MINSTD) PRNG: `state → state * 48271 mod 2^31-1`. Tiny,
 * arithmetic-only, and deterministic, so a given seed always replays the same
 * stream — what keeps the shuffle identical across SSR and hydration.
 */
const seededRandom = (seed: number) => {
  let state = (seed % MODULUS) + 1;
  return () => {
    state = (state * 48_271) % MODULUS;
    return state / MODULUS;
  };
};

/** A seeded Fisher–Yates permutation of [0, n) — the display order of options. */
const shuffledIndices = (n: number, seed: number): number[] => {
  const rand = seededRandom(seed);
  const order = Array.from({ length: n }, (_, i) => i);
  for (let i = n - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  return order;
};

type Verdict = {
  note: string;
  title: string;
  tone: "gold" | "green" | "amber" | "red";
};

/** Map a score onto a themed, sports/game-flavoured verdict. */
const verdictFor = (score: number, total: number): Verdict => {
  if (score === total) {
    return {
      tone: "gold",
      title: "Flawless lap — pole position",
      note: "You own this one. Nothing left to re-read here.",
    };
  }
  const ratio = score / total;
  if (ratio >= 0.75) {
    return {
      tone: "green",
      title: "Podium finish",
      note: "Solid grasp — just a couple of details to tighten.",
    };
  }
  if (ratio >= 0.5) {
    return {
      tone: "amber",
      title: "Made the cut",
      note: "You left points on the table. Worth another lap?",
    };
  }
  return {
    tone: "red",
    title: "Rough qualifying",
    note: "Re-read the page above, then run it back — it'll click.",
  };
};

const VERDICT_TONE: Record<Verdict["tone"], string> = {
  gold: "border-electric-yellow/50 bg-electric-yellow/[0.08] text-yellow-ink dark:text-electric-yellow",
  green: "border-accent-green/50 bg-accent-green/[0.06] text-accent-green",
  amber: "border-accent-orange/50 bg-accent-orange/[0.07] text-accent-orange",
  red: "border-destructive/50 bg-destructive/[0.06] text-destructive",
};

/** The verdict title's text colour, kept separate from the icon chip's box. */
const VERDICT_TITLE_TONE: Record<Verdict["tone"], string> = {
  gold: "text-yellow-ink dark:text-electric-yellow",
  green: "text-accent-green",
  amber: "text-accent-orange",
  red: "text-destructive",
};

/**
 * The accent the widget wears (ADR-0020 per-technology accent). `yellow` is the
 * default Kafka/brand accent used on concept pages; `blue` is Go blue, used by
 * the `/go` tier so the quiz matches the page it closes.
 */
type Accent = "yellow" | "blue";

const ACCENT: Record<Accent, { btn: string; dot: string; icon: string }> = {
  yellow: {
    icon: "text-electric-yellow",
    dot: "bg-electric-yellow",
    btn: "bg-electric-yellow text-yellow-ink hover:shadow-glow-sm",
  },
  blue: {
    icon: "text-go-blue",
    dot: "bg-go-blue",
    btn: "bg-go-blue text-go-ink hover:shadow-glow-go-sm",
  },
};

type DotState = "correct" | "wrong" | "current" | "todo";

/** What a single progress dot represents, given where the run stands. */
const dotStateFor = (
  index: number,
  current: number,
  selection: number | null,
  answer: number
): DotState => {
  if (index === current) {
    return "current";
  }
  if (selection === null) {
    return "todo";
  }
  return selection === answer ? "correct" : "wrong";
};

/** Each progress dot reflects what happened on that question. */
const dotClass = (state: DotState, accent: Accent): string => {
  if (state === "correct") {
    return "bg-accent-green";
  }
  if (state === "wrong") {
    return "bg-destructive";
  }
  if (state === "current") {
    return cn("w-5", ACCENT[accent].dot);
  }
  return "bg-border";
};

/** One answer option — its look is fully derived from whether/what was chosen. */
const OptionButton = ({
  answered,
  chosen,
  correct,
  index,
  label,
  onPick,
}: {
  answered: boolean;
  chosen: boolean;
  correct: boolean;
  index: number;
  label: ReactNode;
  onPick: () => void;
}) => {
  const revealCorrect = answered && correct;
  const revealWrong = answered && chosen && !correct;
  const dimmed = answered && !(correct || chosen);

  return (
    <button
      aria-pressed={chosen}
      className={cn(
        "ds-rich flex w-full items-center gap-3 rounded-xl border p-3 text-left text-sm transition-all",
        !answered &&
          "border-border hover:-translate-y-px hover:border-foreground/30 hover:bg-muted/40",
        revealCorrect && "border-accent-green/50 bg-accent-green/[0.06]",
        revealWrong && "border-destructive/50 bg-destructive/[0.06]",
        dimmed && "border-border opacity-55"
      )}
      disabled={answered}
      onClick={onPick}
      type="button"
    >
      <span
        className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded-md border font-medium font-mono text-[11px]",
          revealCorrect && "border-accent-green/50 text-accent-green",
          revealWrong && "border-destructive/50 text-destructive",
          !answered && "border-border text-muted-foreground"
        )}
      >
        {revealCorrect && <Check className="size-3.5" />}
        {revealWrong && <X className="size-3.5" />}
        {!answered && String.fromCharCode(65 + index)}
        {dimmed && String.fromCharCode(65 + index)}
      </span>
      <span className={cn("leading-snug", dimmed && "text-muted-foreground")}>
        {label}
      </span>
    </button>
  );
};

const QuestionView = ({
  accent,
  attempt,
  chosen,
  onNext,
  onPick,
  question,
  isLast,
}: {
  accent: Accent;
  attempt: number;
  chosen: number | null;
  isLast: boolean;
  onNext: () => void;
  onPick: (index: number) => void;
  question: QuizQuestion;
}) => {
  const answered = chosen !== null;
  const correct = chosen === question.answer;

  /**
   * The order options are shown in — a seeded permutation of their original
   * indices, so the correct answer isn't always first. Seeded off the question
   * id (deterministic for SSR) plus the attempt (re-shuffles on "Run it back").
   * `onPick` still receives the *original* index, so the answer key never moves.
   */
  const order = useMemo(
    () =>
      shuffledIndices(
        question.options.length,
        hashString(question.id) + attempt * 0x9e_37_79_b1
      ),
    [question.id, question.options.length, attempt]
  );

  return (
    <div>
      <p className="font-medium text-base text-foreground leading-snug [&_code]:font-mono [&_code]:text-[0.85em]">
        {question.prompt}
      </p>

      <div className="mt-4 flex flex-col gap-2">
        {order.map((originalIndex, displayIndex) => (
          <OptionButton
            answered={answered}
            chosen={chosen === originalIndex}
            correct={originalIndex === question.answer}
            index={displayIndex}
            key={originalIndex}
            label={question.options[originalIndex]}
            onPick={() => onPick(originalIndex)}
          />
        ))}
      </div>

      <AnimatePresence>
        {answered && (
          <motion.div
            animate={{ opacity: 1, height: "auto" }}
            className="overflow-hidden"
            exit={{ opacity: 0, height: 0 }}
            initial={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
          >
            <div className="mt-3 rounded-xl border border-border bg-muted/40 p-3.5">
              <p
                className={cn(
                  "font-medium font-mono text-[10px] uppercase tracking-[0.1em]",
                  correct ? "text-accent-green" : "text-destructive"
                )}
              >
                {correct ? "Correct" : "Not quite"}
              </p>
              <div className="ds-rich mt-1.5 text-muted-foreground text-sm leading-relaxed [&_code]:text-foreground [&_strong]:text-foreground">
                {question.explanation}
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              <button
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-pill px-4 py-1.5 font-medium font-mono text-[12px] transition-all",
                  ACCENT[accent].btn
                )}
                onClick={onNext}
                type="button"
              >
                {isLast ? "See results" : "Next question"}
                <ArrowRight className="size-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const ResultsView = ({
  onRestart,
  questions,
  selections,
}: {
  onRestart: () => void;
  questions: QuizQuestion[];
  selections: (number | null)[];
}) => {
  const score = questions.reduce(
    (acc, q, i) => acc + (selections[i] === q.answer ? 1 : 0),
    0
  );
  const verdict = verdictFor(score, questions.length);

  return (
    <div className="text-center">
      <span
        className={cn(
          "mx-auto flex size-12 items-center justify-center rounded-2xl border",
          VERDICT_TONE[verdict.tone]
        )}
      >
        <Trophy className="size-6" />
      </span>
      <p className="mt-4 font-bold text-3xl text-foreground tracking-[-0.02em]">
        {score}
        <span className="text-muted-foreground"> / {questions.length}</span>
      </p>
      <p
        className={cn(
          "mt-1 font-medium font-mono text-[11px] uppercase tracking-[0.1em]",
          VERDICT_TITLE_TONE[verdict.tone]
        )}
      >
        {verdict.title}
      </p>
      <p className="mx-auto mt-2 max-w-sm text-muted-foreground text-sm leading-relaxed">
        {verdict.note}
      </p>

      <div className="mt-5 flex flex-wrap justify-center gap-1.5">
        {questions.map((q, i) => (
          <span
            className={cn(
              "size-2 rounded-full",
              selections[i] === q.answer ? "bg-accent-green" : "bg-destructive"
            )}
            key={q.id}
          />
        ))}
      </div>

      <button
        className="mt-6 inline-flex items-center gap-1.5 rounded-pill border border-border px-4 py-1.5 font-medium font-mono text-[12px] text-muted-foreground transition-colors hover:border-foreground/40 hover:text-foreground"
        onClick={onRestart}
        type="button"
      >
        <RotateCcw className="size-3.5" />
        Run it back
      </button>
    </div>
  );
};

export const ConceptQuiz = ({
  slug,
  accent = "yellow",
}: {
  accent?: Accent;
  slug: string;
}) => {
  const reduced = useReducedMotion();
  const quiz = QUIZZES[slug];
  const total = quiz?.questions.length ?? 0;

  const [current, setCurrent] = useState(0);
  const [finished, setFinished] = useState(false);
  /** Bumps on every "Run it back" so the option shuffle re-seeds per attempt. */
  const [attempt, setAttempt] = useState(0);
  const [selections, setSelections] = useState<(number | null)[]>(() =>
    Array.from({ length: total }, () => null)
  );

  if (!quiz) {
    return null;
  }

  const pick = (index: number) => {
    if (selections[current] !== null) {
      return;
    }
    setSelections((prev) => {
      const next = [...prev];
      next[current] = index;
      return next;
    });
  };

  const advance = () => {
    if (current < total - 1) {
      setCurrent((c) => c + 1);
    } else {
      setFinished(true);
    }
  };

  const restart = () => {
    setSelections(Array.from({ length: total }, () => null));
    setCurrent(0);
    setFinished(false);
    setAttempt((a) => a + 1);
  };

  return (
    <div className="not-prose my-8 rounded-2xl border bg-card p-5 sm:p-6">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Gamepad2 className={cn("size-4", ACCENT[accent].icon)} />
        <span className="ds-eyebrow text-[10px]">Check yourself</span>
      </div>
      <p className="mt-2 text-foreground text-sm leading-relaxed">
        {quiz.tagline}
      </p>

      {/* progress: dots + counter, hidden once you reach the results */}
      {!finished && (
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            {quiz.questions.map((q, i) => {
              const state = dotStateFor(i, current, selections[i], q.answer);
              return (
                <span
                  className={cn(
                    "h-1.5 w-2 rounded-full transition-all",
                    dotClass(state, accent)
                  )}
                  key={q.id}
                />
              );
            })}
          </div>
          <span className="font-mono text-[11px] text-muted-foreground">
            {current + 1} / {total}
          </span>
        </div>
      )}

      <AnimatePresence initial={false} mode="wait">
        <motion.div
          animate={{ opacity: 1, y: 0 }}
          className="mt-4"
          initial={{ opacity: 0, y: reduced ? 0 : 6 }}
          key={finished ? "results" : current}
          transition={{ duration: reduced ? 0 : 0.2 }}
        >
          {finished ? (
            <ResultsView
              onRestart={restart}
              questions={quiz.questions}
              selections={selections}
            />
          ) : (
            <QuestionView
              accent={accent}
              attempt={attempt}
              chosen={selections[current]}
              isLast={current === total - 1}
              onNext={advance}
              onPick={pick}
              question={quiz.questions[current]}
            />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
};
