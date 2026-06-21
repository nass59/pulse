import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { Eyebrow } from "@/components/docs/eyebrow";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * The landing hero — DevLab paper-editorial. A faint dotted field gives the
 * resting surface some atmosphere without competing with the dark "lab" firehose
 * that follows it. Server component; nothing here is interactive.
 */
export const Hero = () => (
  <header className="relative overflow-hidden">
    {/* faint dotted field — atmosphere, not noise */}
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 opacity-[0.5] [background-image:radial-gradient(var(--color-border)_1px,transparent_1px)] [background-size:26px_26px] [mask-image:radial-gradient(ellipse_70%_60%_at_50%_0%,black,transparent)]"
    />
    <div className="relative mx-auto max-w-3xl px-6 pt-20 pb-16 text-center sm:pt-28">
      <Eyebrow>Pulse · Learning in public</Eyebrow>

      <h1 className="mt-5 text-balance font-bold text-5xl text-foreground leading-[1.03] tracking-[-0.03em] sm:text-6xl">
        Learn <span className="ds-mark">Kafka</span> by building
        <br className="hidden sm:block" /> the system that needs it.
      </h1>

      <p className="mx-auto mt-6 max-w-xl text-balance text-lg text-muted-foreground leading-relaxed">
        Pulse is a Twitch-style livestream platform built one hard
        distributed-systems lesson at a time. These docs are the friendly read
        of what got built, why it works, and the ideas behind each decision.
      </p>

      <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
        <Link
          className={cn(buttonVariants({ size: "lg" }), "group/cta")}
          href="/kafka"
        >
          Start with Kafka
          <ArrowRight className="transition-transform group-hover/cta:translate-x-0.5" />
        </Link>
        <Link
          className={buttonVariants({ variant: "outline", size: "lg" })}
          href="/build"
        >
          See the build
        </Link>
      </div>

      <p className="mt-7 font-mono text-muted-foreground text-xs">
        3 services · polyglot (TS · Go · Kotlin) · Kafka backbone · Phase 0 live
      </p>
    </div>
  </header>
);
