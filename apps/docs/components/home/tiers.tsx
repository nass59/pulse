import type { LucideIcon } from "lucide-react";
import { ArrowRight, Boxes, Map as MapIcon, Sparkles } from "lucide-react";
import Link from "next/link";

interface Tier {
  blurb: string;
  href: string;
  icon: LucideIcon;
  title: string;
}

const TIERS: Tier[] = [
  {
    title: "Concepts",
    blurb:
      "The distributed-systems ideas, one page each — explained like a friend would, with a diagram instead of a wall of text.",
    href: "/concepts",
    icon: Sparkles,
  },
  {
    title: "Architecture",
    blurb:
      "The system topology and the infrastructure under it. What runs, what talks to what, and what's still on the drawing board.",
    href: "/architecture",
    icon: Boxes,
  },
  {
    title: "Journey",
    blurb:
      "Progress by phase: lessons unlocked, issues closed, and the war stories worth remembering.",
    href: "/journey/foundations",
    icon: MapIcon,
  },
];

/** The three reading tiers as navigation cards. Server component. */
export const Tiers = () => (
  <section className="mx-auto max-w-5xl px-6 py-16">
    <div className="grid gap-4 md:grid-cols-3">
      {TIERS.map((tier) => {
        const Icon = tier.icon;
        return (
          <Link
            className="group/tier flex flex-col rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-0.5 hover:border-electric-yellow/50 hover:shadow-md dark:hover:shadow-glow-sm"
            href={tier.href}
            key={tier.href}
          >
            <Icon className="size-5 text-yellow-ink dark:text-electric-yellow" />
            <h3 className="mt-4 flex items-center gap-1.5 font-semibold text-foreground text-lg tracking-[-0.01em]">
              {tier.title}
              <ArrowRight className="size-4 text-muted-foreground opacity-0 transition-all group-hover/tier:translate-x-0.5 group-hover/tier:opacity-100" />
            </h3>
            <p className="mt-2 text-muted-foreground text-sm leading-relaxed">
              {tier.blurb}
            </p>
          </Link>
        );
      })}
    </div>
  </section>
);
