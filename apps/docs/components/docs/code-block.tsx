"use client";

import { Check, Copy } from "lucide-react";
import {
  type ComponentProps,
  isValidElement,
  type ReactElement,
  useRef,
  useState,
} from "react";

import { cn } from "@/lib/utils";

/**
 * Human-readable window-chrome labels per fence language. Falls back to the raw
 * Shiki language id (e.g. an unmapped `rust` shows as `rust`), so a missing
 * entry degrades gracefully rather than hiding the label.
 */
const LANGUAGE_LABELS: Record<string, string> = {
  bash: "bash",
  sh: "shell",
  shell: "shell",
  go: "Go",
  ts: "TypeScript",
  tsx: "TSX",
  js: "JavaScript",
  jsx: "JSX",
  json: "JSON",
  yaml: "YAML",
  yml: "YAML",
  sql: "SQL",
  md: "Markdown",
  mdx: "MDX",
  text: "text",
  txt: "text",
};

/**
 * Pull the fence language out of a `language-<lang>` class. Shiki stamps this
 * onto the emitted `<code>` (and `<pre>`) when `addLanguageClass` is on in
 * `next.config.ts` — see ADR-0010. Returns the display label, or `null` when no
 * language is present (e.g. a bare ``` fence, or a hand-written Storybook
 * `<code>` with no class) so the chrome simply omits the label.
 */
const LANGUAGE_CLASS = /language-(\S+)/;

const languageLabel = (className: string | undefined): string | null => {
  const match = className?.match(LANGUAGE_CLASS);
  if (!match) {
    return null;
  }
  const lang = match[1];
  return LANGUAGE_LABELS[lang] ?? lang;
};

/**
 * Fenced code blocks render dark on every surface — terminal-style is part of
 * the DevLab identity (`--code-bg` is always carbon/black). Mapped onto the MDX
 * `pre` element, so every fenced block in a doc gets the window chrome and a
 * copy affordance. The copy reads `textContent` off the rendered `<pre>`, so it
 * works without parsing the MDX children.
 *
 * The DevLab code-block design (claude.ai/design — DevLab Design System) frames
 * the carbon surface as an editor window: a title bar with macOS traffic-light
 * dots, the fence's language as a mono olive label, and Copy living in the bar.
 *
 * Token colours come from Shiki (`@shikijs/rehype`, build-time — ADR-0010),
 * which hands this component a pre-highlighted `<code>` plus its own `className`
 * (`shiki …`) and an inline `style` carrying the theme's background + base
 * colour. This component is the *chrome only*: it keeps the carbon surface and
 * copy button, and neutralises Shiki's injected `background-color` so the
 * theme's per-token span colours show through against carbon, not the theme's
 * own backdrop.
 */
export const CodeBlock = ({
  className,
  children,
  style,
  ...props
}: ComponentProps<"pre">) => {
  const preRef = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);

  /**
   * The language class lands on the `<code>` child; fall back to the `<pre>`'s
   * own className (Shiki stamps both) so the label resolves either way.
   */
  const codeClassName = isValidElement(children)
    ? (children as ReactElement<{ className?: string }>).props.className
    : undefined;
  const label = languageLabel(codeClassName) ?? languageLabel(className);

  const copy = async () => {
    const text = preRef.current?.textContent ?? "";
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="not-prose my-6 overflow-hidden rounded-xl border border-carbon-600 bg-carbon-800 dark:bg-black">
      {/* Window title bar — traffic lights, language label, Copy. */}
      <div className="relative flex items-center justify-between border-carbon-600 border-b bg-carbon-850 px-3.5 py-2.5">
        <div aria-hidden="true" className="flex items-center gap-[7px]">
          <span className="block size-[11px] rounded-full bg-[#FF5F57]" />
          <span className="block size-[11px] rounded-full bg-[#FEBC2E]" />
          <span className="block size-[11px] rounded-full bg-[#28C840]" />
        </div>
        {label ? (
          <span className="absolute left-1/2 -translate-x-1/2 font-medium font-mono text-[11px] text-olive">
            {label}
          </span>
        ) : null}
        <button
          aria-label={copied ? "Copied" : "Copy code"}
          className="inline-flex items-center gap-1.5 font-medium font-mono text-[11px] text-olive transition-colors hover:text-white"
          onClick={copy}
          type="button"
        >
          {copied ? <Check className="size-3" /> : <Copy className="size-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre
        className={cn(
          "overflow-x-auto p-4 font-mono text-[12.5px] text-gray-300 leading-[1.65]",
          className
        )}
        ref={preRef}
        // Drop Shiki's theme background so the carbon chrome shows; keep the
        // rest of its inline style (base text colour) for un-tokenised text.
        style={{ ...style, backgroundColor: "transparent" }}
        {...props}
      >
        {children}
      </pre>
    </div>
  );
};
