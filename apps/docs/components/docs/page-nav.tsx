import { ArrowLeft, ArrowRight } from "lucide-react";
import Link from "next/link";

import { cn } from "@/lib/utils";

/**
 * Prev/next navigation cards closing a content page — the shared version of the
 * hand-rolled "Go deeper" card that lived inline in `architecture/page.mdx`.
 * Turns the live pages into a readable arc (the "show off the concepts to learn"
 * the brief asks for) and is the single place this affordance is styled.
 *
 * Either side is optional: a page with only a `next` renders one card pinned to
 * the right column so the forward motion stays on the right. Cards carry the
 * DevLab hover lift + yellow glow on dark.
 */
type NavLink = {
  blurb?: string;
  href: string;
  title: string;
};

const NavCard = ({
  link,
  direction,
}: {
  link: NavLink;
  direction: "prev" | "next";
}) => {
  const isNext = direction === "next";
  const Arrow = isNext ? ArrowRight : ArrowLeft;
  return (
    <Link
      className={cn(
        "group/nav flex flex-col gap-2 rounded-2xl border border-border bg-card p-5 no-underline transition-all hover:-translate-y-0.5 hover:border-electric-yellow/50 hover:shadow-md dark:hover:shadow-glow-sm",
        isNext ? "items-end text-right sm:col-start-2" : "items-start"
      )}
      href={link.href}
    >
      <span
        className={cn(
          "flex items-center gap-1.5 font-medium font-mono text-[10px] text-muted-foreground uppercase tracking-[0.12em]",
          isNext ? "flex-row" : "flex-row-reverse"
        )}
      >
        {isNext ? "Next" : "Previous"}
        <Arrow
          aria-hidden
          className={cn(
            "size-3 transition-transform",
            isNext
              ? "group-hover/nav:translate-x-0.5"
              : "group-hover/nav:-translate-x-0.5"
          )}
        />
      </span>
      <span className="font-semibold text-foreground tracking-[-0.01em]">
        {link.title}
      </span>
      {link.blurb ? (
        <span className="text-muted-foreground text-sm leading-relaxed">
          {link.blurb}
        </span>
      ) : null}
    </Link>
  );
};

export const PageNav = ({ prev, next }: { prev?: NavLink; next?: NavLink }) => (
  <nav className="not-prose mt-14 grid gap-4 border-border border-t pt-8 sm:grid-cols-2">
    {prev ? <NavCard direction="prev" link={prev} /> : null}
    {next ? <NavCard direction="next" link={next} /> : null}
  </nav>
);
