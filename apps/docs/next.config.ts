import createMDX from "@next/mdx";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  pageExtensions: ["ts", "tsx", "md", "mdx"],
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
 */
const withMDX = createMDX({
  options: {
    remarkPlugins: ["remark-gfm"],
    rehypePlugins: [["@shikijs/rehype", { theme: "vesper" }]],
  },
});

export default withMDX(nextConfig);
