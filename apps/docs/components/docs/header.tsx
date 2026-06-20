import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

import { Logo } from "@/components/brand/logo";

const NAV = [
  { href: "/learn", label: "Learn" },
  { href: "/concepts", label: "Concepts" },
  { href: "/architecture", label: "Architecture" },
  { href: "/journey/foundations", label: "Journey" },
  { href: "/go", label: "Go" },
];

/**
 * Fixed glass header (65px). Backdrop blur over a translucent surface is a
 * DevLab signature; the underline-fade on nav links is the brand's standard
 * micro-interaction.
 */
export const Header = () => (
  <header className="sticky top-0 z-40 h-[65px] border-border border-b bg-background/80 backdrop-blur-xl">
    <div className="mx-auto flex h-full max-w-5xl items-center justify-between px-6">
      <Link aria-label="Pulse docs — home" href="/">
        <Logo />
      </Link>

      <nav className="flex items-center gap-1">
        {NAV.map((item) => (
          <Link
            className="rounded-md px-3 py-2 font-medium text-foreground/70 text-sm transition-colors hover:bg-muted hover:text-foreground"
            href={item.href}
            key={item.href}
          >
            {item.label}
          </Link>
        ))}
        <a
          className="ml-1 inline-flex items-center gap-1 rounded-md px-3 py-2 font-medium text-foreground/70 text-sm transition-colors hover:bg-muted hover:text-foreground"
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
