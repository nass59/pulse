import type { MDXComponents } from "mdx/types";
import { type ComponentProps, isValidElement, type ReactElement } from "react";

import { Callout } from "@/components/docs/callout";
import { CodeBlock } from "@/components/docs/code-block";
import {
  AutoTopicFlow,
  ControllerRole,
  CoPartitionRouting,
  DependsOnRace,
  FanoutVsLog,
  GoroutineReadLoop,
  HealthcheckTimeline,
  KraftVsZookeeper,
  LiveMapFromLog,
  LogWithOffsets,
  OutboxFlow,
  PartitionContractTrap,
  QuorumFaultTolerance,
  ServerAuthoredStamp,
  VolumePersistence,
} from "@/components/docs/diagram";
import { Eyebrow } from "@/components/docs/eyebrow";
import { Hook } from "@/components/docs/hook";
import { PageHeader } from "@/components/docs/page-header";
import { PageNav } from "@/components/docs/page-nav";
import { Sources } from "@/components/docs/sources";
import { Table, Td, Th, Thead, Tr } from "@/components/docs/table";
import { Tag } from "@/components/docs/tag";
import { ConceptQuiz } from "@/components/interactive/concept-quiz";
import { KraftControllerElection } from "@/components/interactive/kraft-controller-election";
import { OutboxLab } from "@/components/interactive/outbox-lab";
import { SchemaEvolution } from "@/components/interactive/schema-evolution";
import { SystemTopology } from "@/components/interactive/system-topology";

/**
 * Server-side shim for fenced code blocks: reads the Shiki-stamped
 * `language-<lang>` class off the `<code>` child *here*, where MDX hands over
 * concrete elements, and forwards it to `CodeBlock` as a plain string prop.
 * `CodeBlock` (a client component) must not introspect `children` itself —
 * across the RSC boundary the child can arrive as an unresolved lazy
 * reference, making the introspection disagree between the SSR pass and
 * hydration (the code-block hydration-mismatch bug).
 */
const MdxPre = ({ children, ...props }: ComponentProps<"pre">) => {
  const codeClassName = isValidElement(children)
    ? (children as ReactElement<{ className?: string }>).props.className
    : undefined;
  return (
    <CodeBlock {...props} codeClassName={codeClassName}>
      {children}
    </CodeBlock>
  );
};

/**
 * Site-wide registry. Every `.mdx` page can use these by tag name without an
 * `import`. The interactive widgets carry their own `"use client"` boundary;
 * the MDX pages that embed them stay server components (the
 * server-component-with-client-leaf pattern proven on real content here).
 *
 * `pre` is mapped to the DevLab `CodeBlock` (via the `MdxPre` shim) so every
 * fenced code block in a doc renders dark with a copy affordance, without
 * per-page imports.
 */
const components: MDXComponents = {
  pre: MdxPre,
  table: Table,
  thead: Thead,
  tr: Tr,
  th: Th,
  td: Td,
  AutoTopicFlow,
  Callout,
  CodeBlock,
  ConceptQuiz,
  CoPartitionRouting,
  ControllerRole,
  DependsOnRace,
  Eyebrow,
  FanoutVsLog,
  GoroutineReadLoop,
  HealthcheckTimeline,
  Hook,
  KraftVsZookeeper,
  LiveMapFromLog,
  LogWithOffsets,
  OutboxFlow,
  PageHeader,
  PageNav,
  PartitionContractTrap,
  QuorumFaultTolerance,
  SchemaEvolution,
  ServerAuthoredStamp,
  Sources,
  Tag,
  VolumePersistence,
  KraftControllerElection,
  OutboxLab,
  SystemTopology,
};

export function useMDXComponents(): MDXComponents {
  return components;
}
