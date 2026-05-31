import type { MDXComponents } from "mdx/types";

import { Callout } from "@/components/docs/callout";
import { CodeBlock } from "@/components/docs/code-block";
import { Eyebrow } from "@/components/docs/eyebrow";
import { Sources } from "@/components/docs/sources";
import { Tag } from "@/components/docs/tag";
import { KraftControllerElection } from "@/components/interactive/kraft-controller-election";
import { SystemTopology } from "@/components/interactive/system-topology";

/**
 * Site-wide registry. Every `.mdx` page can use these by tag name without an
 * `import`. The interactive widgets carry their own `"use client"` boundary;
 * the MDX pages that embed them stay server components (the
 * server-component-with-client-leaf pattern proven on real content here).
 *
 * `pre` is mapped to the DevLab `CodeBlock` so every fenced code block in a doc
 * renders dark with a copy affordance, without per-page imports.
 */
const components: MDXComponents = {
  pre: CodeBlock,
  Callout,
  CodeBlock,
  Eyebrow,
  Sources,
  Tag,
  KraftControllerElection,
  SystemTopology,
};

export function useMDXComponents(): MDXComponents {
  return components;
}
