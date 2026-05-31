import type { Meta, StoryObj } from "@storybook/nextjs-vite";

/**
 * DevLab visual foundations — the raw tokens behind every component. These
 * stories are the canonical reference for the colour scale, the two-typeface
 * system, the spacing/radii grid, and the signature yellow glow. Flip the
 * theme toolbar to see how the same tokens resolve on the dark "lab" surface.
 */
const meta: Meta = {
  title: "Design System/Foundations",
  parameters: { layout: "fullscreen" },
  tags: ["ai-generated"],
};

export default meta;

type Story = StoryObj;

const Swatch = ({
  name,
  varName,
  ring,
}: {
  name: string;
  varName: string;
  ring?: boolean;
}) => (
  <div className="flex flex-col gap-1.5">
    <div
      className={`h-16 w-full rounded-xl ${ring ? "ring-1 ring-border" : ""}`}
      style={{ background: `var(${varName})` }}
    />
    <span className="font-medium font-mono text-foreground text-xs">
      {name}
    </span>
    <span className="font-mono text-[10px] text-muted-foreground">
      {varName}
    </span>
  </div>
);

const Section = ({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) => (
  <section className="flex flex-col gap-4">
    <p className="ds-eyebrow">{label}</p>
    {children}
  </section>
);

export const Colors: Story = {
  render: () => (
    <div className="flex flex-col gap-10 bg-background p-10 text-foreground">
      <Section label="Brand">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Swatch name="Electric Yellow" varName="--color-electric-yellow" />
          <Swatch name="Yellow Ink" varName="--color-yellow-ink" />
          <Swatch name="Yellow Tint" ring varName="--color-yellow-tint" />
          <Swatch name="Olive" varName="--color-olive" />
        </div>
      </Section>
      <Section label="Carbon · warm neutral scale">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-6">
          <Swatch name="carbon-900" varName="--color-carbon-900" />
          <Swatch name="carbon-850" varName="--color-carbon-850" />
          <Swatch name="carbon-800" varName="--color-carbon-800" />
          <Swatch name="carbon-750" varName="--color-carbon-750" />
          <Swatch name="carbon-700" varName="--color-carbon-700" />
          <Swatch name="carbon-600" varName="--color-carbon-600" />
        </div>
      </Section>
      <Section label="Paper · light surfaces">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Swatch name="paper-0" ring varName="--color-paper-0" />
          <Swatch name="paper-50" ring varName="--color-paper-50" />
          <Swatch name="paper-100" ring varName="--color-paper-100" />
          <Swatch name="paper-200" ring varName="--color-paper-200" />
        </div>
      </Section>
      <Section label="Category accents · signifiers only">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <Swatch name="blue · logic/TS" varName="--color-accent-blue" />
          <Swatch
            name="purple · animation/UI"
            varName="--color-accent-purple"
          />
          <Swatch name="green · online" varName="--color-accent-green" />
          <Swatch name="orange · warning" varName="--color-accent-orange" />
        </div>
      </Section>
    </div>
  ),
};

export const Typography: Story = {
  render: () => (
    <div className="flex flex-col gap-8 bg-background p-10 text-foreground">
      <div className="flex flex-col gap-1">
        <span className="ds-eyebrow">UI Engineering</span>
        <p className="ds-hero">
          Fluid interfaces with <span className="ds-mark">spring physics</span>
        </p>
      </div>
      <div className="flex flex-col gap-3">
        <h1 className="font-bold text-2xl tracking-[-0.02em]">
          Heading 1 — Spline Sans 700, tight tracking
        </h1>
        <h2 className="font-bold text-xl tracking-[-0.015em]">
          Heading 2 — the dense, engineered feel
        </h2>
        <p className="font-light text-lg text-muted-foreground leading-relaxed">
          Lead — Spline Sans 300 carries long article leads at a comfortable,
          airy reading measure.
        </p>
        <p className="max-w-prose text-[0.9375rem] leading-relaxed">
          Body settles at a comfortable size in warm grey. Real API names live
          inline in mono: <code className="font-mono">backface-visibility</code>
          , <code className="font-mono">aria-label</code>. The brand never
          hand-waves the technical detail.
        </p>
        <p className="ds-eyebrow">Eyebrow · uppercase mono label</p>
        <pre className="rounded-xl bg-carbon-800 p-4 font-mono text-gray-300 text-sm dark:bg-black">
          {
            "const election = useControllerElection();\n// JetBrains Mono — everything the machine reads"
          }
        </pre>
      </div>
    </div>
  ),
};

export const SpacingAndRadii: Story = {
  render: () => (
    <div className="flex flex-col gap-10 bg-background p-10 text-foreground">
      <Section label="Radii">
        <div className="flex flex-wrap items-end gap-6">
          {[
            { name: "sm 8px", cls: "rounded-sm" },
            { name: "md 10px", cls: "rounded-md" },
            { name: "lg 16px", cls: "rounded-[16px]" },
            { name: "xl 24px", cls: "rounded-3xl" },
            { name: "pill", cls: "rounded-pill" },
          ].map((r) => (
            <div className="flex flex-col items-center gap-2" key={r.name}>
              <div
                className={`size-20 border border-electric-yellow/40 bg-electric-yellow/10 ${r.cls}`}
              />
              <span className="font-mono text-muted-foreground text-xs">
                {r.name}
              </span>
            </div>
          ))}
        </div>
      </Section>
      <Section label="Spacing · 4px base grid">
        <div className="flex items-end gap-4">
          {[4, 8, 12, 16, 24, 32, 48].map((s) => (
            <div className="flex flex-col items-center gap-2" key={s}>
              <div
                className="bg-electric-yellow"
                style={{ height: s, width: s }}
              />
              <span className="font-mono text-[10px] text-muted-foreground">
                {s}
              </span>
            </div>
          ))}
        </div>
      </Section>
    </div>
  ),
};

export const ShadowsAndGlow: Story = {
  render: () => (
    <div className="flex flex-col gap-10 bg-background p-10 text-foreground">
      <Section label="Elevation · light shadows">
        <div className="flex flex-wrap gap-8">
          {["shadow-sm", "shadow-md", "shadow-lg"].map((s) => (
            <div
              className={`flex size-28 items-center justify-center rounded-2xl bg-card font-mono text-muted-foreground text-xs ${s}`}
              key={s}
            >
              {s}
            </div>
          ))}
        </div>
      </Section>
      <Section label="The yellow glow · depth-as-light on dark">
        <div className="ds-stage flex flex-wrap gap-8 rounded-2xl p-10">
          {[
            { name: "glow-sm", cls: "shadow-glow-sm" },
            { name: "glow-md", cls: "shadow-glow-md" },
            { name: "glow-lg", cls: "shadow-glow-lg" },
          ].map((g) => (
            <div
              className={`flex size-28 items-center justify-center rounded-pill bg-electric-yellow font-mono text-xs text-yellow-ink ${g.cls}`}
              key={g.name}
            >
              {g.name}
            </div>
          ))}
        </div>
      </Section>
    </div>
  ),
};
