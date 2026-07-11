import { cn } from "@/lib/utils";

/**
 * The DevLab flask — the single most-used brand glyph. Extracted verbatim from
 * the Figma source (`assets/icons/p1/Icon-2.svg`); it inherits `currentColor`,
 * so it takes the ink colour of whatever sits it (black on the yellow brand
 * mark, yellow when it glows on dark).
 */
export const Flask = ({ className }: { className?: string }) => (
  <svg
    aria-hidden="true"
    className={className}
    fill="none"
    viewBox="0 0 15.048 15"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M 1.69 15 C 0.982 15 0.479 14.684 0.18 14.052 C -0.119 13.42 -0.046 12.833 0.399 12.292 L 5.024 6.667 L 5.024 1.667 L 4.19 1.667 C 3.954 1.667 3.756 1.587 3.597 1.427 C 3.437 1.267 3.357 1.069 3.357 0.833 C 3.357 0.597 3.437 0.399 3.597 0.24 C 3.756 0.08 3.954 0 4.19 0 L 10.857 0 C 11.093 0 11.291 0.08 11.451 0.24 C 11.611 0.399 11.69 0.597 11.69 0.833 C 11.69 1.069 11.611 1.267 11.451 1.427 C 11.291 1.587 11.093 1.667 10.857 1.667 L 10.024 1.667 L 10.024 6.667 L 14.649 12.292 C 15.093 12.833 15.166 13.42 14.868 14.052 C 14.569 14.684 14.065 15 13.357 15 L 1.69 15 L 1.69 15 M 1.69 13.333 L 13.357 13.333 L 8.357 7.25 L 8.357 1.667 L 6.69 1.667 L 6.69 7.25 L 1.69 13.333 L 1.69 13.333"
      fill="currentColor"
      fillRule="nonzero"
    />
  </svg>
);

type LogoProps = {
  className?: string;
  /** Show the "DevLab" wordmark beside the flask mark. */
  showWordmark?: boolean;
};

/**
 * The brand lockup: a flask inside a yellow circle (glowing on dark) next to
 * the DevLab wordmark, where ".ui" picks up the yellow accent.
 */
export const Logo = ({ showWordmark = true, className }: LogoProps) => (
  <span className={cn("inline-flex items-center gap-2.5", className)}>
    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-electric-yellow text-yellow-ink shadow-glow-sm dark:shadow-glow-md">
      <Flask className="size-3.5" />
    </span>
    {showWordmark ? (
      <span className="font-bold text-[17px] tracking-[-0.02em]">
        DevLab<span className="text-electric-yellow">.ui</span>
      </span>
    ) : null}
  </span>
);
