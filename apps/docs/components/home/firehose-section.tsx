import { FullBleed } from "@/components/docs/full-bleed";
import { Firehose } from "@/components/interactive/firehose";

/**
 * The motivating-example band — the one deliberately dark "lab" moment in an
 * otherwise paper-editorial page, where DevLab's glow lives. Forced dark
 * (carbon) regardless of the active theme so the light → dark → light rhythm
 * holds. Server component; the animated `<Firehose>` is the client leaf.
 */
export const FirehoseSection = () => (
  <FullBleed className="bg-carbon-900 text-white">
    <div className="mx-auto max-w-4xl px-6 py-20 sm:py-24">
      <p className="font-medium font-mono text-[11px] text-electric-yellow uppercase tracking-[0.14em]">
        A motivating example
      </p>
      <h2 className="mt-3 text-balance font-bold text-3xl leading-[1.1] tracking-[-0.02em] sm:text-4xl">
        A creator goes live. The Channel floods.
      </h2>
      <p className="mt-4 max-w-2xl text-balance text-white/65 leading-relaxed">
        Tens of thousands of viewers arrive in seconds. Chat turns into a
        firehose — messages, reactions, joins and leaves, all at once. None of
        it can be lost, and three different services need to react to the same
        stream. That problem is why Kafka sits at the centre of Pulse.
      </p>

      <div className="mt-10">
        <Firehose />
      </div>
    </div>
  </FullBleed>
);
