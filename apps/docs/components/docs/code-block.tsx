"use client";

import { Check, Copy } from "lucide-react";
import { type ComponentProps, useRef, useState } from "react";

import { cn } from "@/lib/utils";

/**
 * Fenced code blocks render dark on every surface — terminal-style is part of
 * the DevLab identity (`--code-bg` is always carbon/black). Mapped onto the MDX
 * `pre` element, so every fenced block in a doc gets the dark chrome and a copy
 * affordance. The copy reads `textContent` off the rendered `<pre>`, so it
 * works without parsing the MDX children.
 */
export const CodeBlock = ({
  className,
  children,
  ...props
}: ComponentProps<"pre">) => {
  const preRef = useRef<HTMLPreElement>(null);
  const [copied, setCopied] = useState(false);

  const copy = async () => {
    const text = preRef.current?.textContent ?? "";
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="not-prose group/code relative my-6 overflow-hidden rounded-xl border border-carbon-600 bg-carbon-800 dark:bg-black">
      <button
        aria-label={copied ? "Copied" : "Copy code"}
        className="absolute top-3 right-3 inline-flex items-center gap-1.5 rounded-lg border border-carbon-600 bg-carbon-800 px-2.5 py-1.5 font-medium font-mono text-gray-400 text-xs opacity-0 transition-all hover:text-white focus-visible:opacity-100 group-hover/code:opacity-100"
        onClick={copy}
        type="button"
      >
        {copied ? (
          <Check className="size-3.5" />
        ) : (
          <Copy className="size-3.5" />
        )}
        {copied ? "Copied" : "Copy"}
      </button>
      <pre
        className={cn(
          "overflow-x-auto p-5 font-mono text-[12.5px] text-gray-300 leading-[1.7]",
          className
        )}
        ref={preRef}
        {...props}
      >
        {children}
      </pre>
    </div>
  );
};
