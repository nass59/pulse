import type { MDXComponents } from "mdx/types";

import { Callout } from "@/components/docs/callout";
import { Sources } from "@/components/docs/sources";
import { KraftControllerElection } from "@/components/interactive/kraft-controller-election";
import { SystemTopology } from "@/components/interactive/system-topology";

/**
 * Site-wide registry. Every `.mdx` page can use these by tag name without an
 * `import`. The interactive widgets carry their own `"use client"` boundary;
 * the MDX pages that embed them stay server components (the
 * server-component-with-client-leaf pattern proven on real content here).
 */
const components: MDXComponents = {
  Callout,
  Sources,
  KraftControllerElection,
  SystemTopology,
};

export function useMDXComponents(): MDXComponents {
  return components;
}
