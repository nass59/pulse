import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import { MobileNav } from "@/components/docs/mobile-nav";

const NAV = [
  { href: "/kafka", label: "Kafka" },
  { href: "/go", label: "Go" },
  { href: "/kotlin", label: "Kotlin" },
  { href: "/build", label: "The Build" },
];

/**
 * Fixed drafting-sheet header (65px) — the top edge of the drawing, echoing
 * the homepage title block: full-height cells split by electric-yellow
 * hairlines, mono uppercase labels. Backdrop blur over a translucent surface
 * stays from the original glass header so content scrolls under it.
 */
export const Header = () => (
  <header className="sticky top-0 z-40 border-electric-yellow/25 border-b bg-background/80 backdrop-blur-xl">
    <div className="mx-auto flex h-[65px] max-w-[88rem] items-stretch justify-between pl-6">
      <Link
        aria-label="Pulse docs — home"
        className="flex items-center"
        href="/"
      >
        <Logo />
      </Link>

      <MobileNav items={NAV} />

      <nav className="hidden items-stretch md:flex">
        {NAV.map((item) => (
          <Link
            className="flex w-24 items-center justify-center border-electric-yellow/15 border-l font-medium font-mono text-[11px] text-foreground/70 uppercase tracking-[0.14em] transition-colors hover:bg-electric-yellow/[0.06] hover:text-foreground sm:w-32"
            href={item.href}
            key={item.href}
          >
            {item.label}
          </Link>
        ))}
        <a
          className="flex w-24 items-center justify-center gap-1.5 border-electric-yellow/15 border-l font-medium font-mono text-[11px] text-foreground/70 uppercase tracking-[0.14em] transition-colors hover:bg-electric-yellow/[0.06] hover:text-foreground sm:w-32"
          href="https://github.com/nass59/pulse"
          rel="noreferrer"
          target="_blank"
        >
          GitHub
          <ArrowUpRight className="size-3.5" />
        </a>
      </nav>
    </div>
  </header>
);
