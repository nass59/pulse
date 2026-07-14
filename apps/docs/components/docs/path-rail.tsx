"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { PILLAR_PATHS, type PillarAccent } from "@/lib/pillars";
import { cn } from "@/lib/utils";

/**
 * The sticky path-progress rail (ADR-0021). Hub-driven navigation means there is
 * no persistent sidebar — so an ordered lesson page loses its "you are here in
 * the sequence" wayfinding. This rail buys it back, but ONLY on `path/` pages: it
 * matches the current pathname against the registered pillar paths and renders
 * nothing anywhere else (concepts, The Build, the homepage are not sequences).
 *
 * Client component because it reads `usePathname`; it sits in the root layout
 * just under the fixed header and self-hides when the route isn't a path.
 */
const ACTIVE: Record<PillarAccent, string> = {
  kafka:
    "border-electric-yellow bg-electric-yellow/15 text-yellow-ink dark:text-electric-yellow",
  go: "border-go-blue bg-go-blue/15 text-go-ink dark:text-go-blue",
  kotlin:
    "border-kotlin-purple bg-kotlin-purple/15 text-kotlin-ink dark:text-kotlin-purple",
  systems:
    "border-systems-red bg-systems-red/15 text-systems-ink dark:text-systems-red",
};

export const PathRail = () => {
  const pathname = usePathname();
  const path = PILLAR_PATHS.find((p) => pathname?.startsWith(p.base));

  if (!path) {
    return null;
  }

  const currentIndex = path.steps.findIndex((s) => s.href === pathname);

  return (
    <div className="sticky top-[65px] z-30 border-border border-b bg-background/80 backdrop-blur-xl">
      <nav
        aria-label={`${path.label} progress`}
        className="mx-auto flex max-w-5xl items-center gap-3 overflow-x-auto px-6 py-2.5"
      >
        <span className="shrink-0 font-medium font-mono text-[10px] text-muted-foreground uppercase tracking-[0.14em]">
          {path.label}
        </span>
        <ol className="flex items-center gap-1.5">
          {path.steps.map((step, i) => {
            const isActive = i === currentIndex;
            return (
              <li className="flex items-center gap-1.5" key={step.href}>
                <Link
                  aria-current={isActive ? "step" : undefined}
                  className={cn(
                    "flex items-center gap-1.5 whitespace-nowrap rounded-pill border px-2.5 py-1 font-medium text-xs no-underline transition-colors",
                    isActive
                      ? ACTIVE[path.accent]
                      : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                  href={step.href}
                >
                  <span className="font-mono tabular-nums opacity-60">
                    0{i + 1}
                  </span>
                  {step.title}
                </Link>
                {i < path.steps.length - 1 && (
                  <span aria-hidden className="text-border text-xs">
                    ·
                  </span>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
};
