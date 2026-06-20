import createMDX from "@next/mdx";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  pageExtensions: ["ts", "tsx", "md", "mdx"],
  /**
   * `@pulse/schemas` ships raw `.ts` source (its `./topics` export points at
   * `topics.ts`, not a build artefact), so Next must transpile it like first-party
   * code. This lets `<SystemTopology>` import the canonical `EVENT_TOPICS` map
   * directly — the diagram's event list is then provably in sync with the real
   * Kafka topics, never a hand-copied duplicate that can drift.
   */
  transpilePackages: ["@pulse/schemas"],
};

/**
 * Plugins are named as strings, not imported references: Next 16 builds with
 * Turbopack, which serialises the MDX loader config across the JS↔Rust boundary
 * and so cannot accept function values (only string names + serialisable
 * options). See ADR-0010.
 *
 * - `remark-gfm` turns `| … |` markdown into real <table> elements, which then
 *   flow through the styled Table components mapped in `mdx-components.tsx`.
 * - `@shikijs/rehype` highlights fenced code at build time (zero client JS,
 *   accurate TextMate grammars). One dark theme — the code surface is always
 *   carbon — whose token colours show through; `CodeBlock` owns the chrome.
 *   `addLanguageClass` stamps `language-<lang>` onto the emitted `<code>` (a
 *   serialisable boolean, so it survives the Turbopack JS↔Rust boundary unlike a
 *   transformer function); `CodeBlock` reads it to label the window chrome with
 *   the fence's language.
 */
const withMDX = createMDX({
  options: {
    remarkPlugins: ["remark-gfm"],
    rehypePlugins: [
      ["@shikijs/rehype", { theme: "vesper", addLanguageClass: true }],
    ],
  },
});

export default withMDX(nextConfig);
