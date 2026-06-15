import type { MDXComponents } from "mdx/types";

import { Callout } from "@/components/docs/callout";
import { CodeBlock } from "@/components/docs/code-block";
import {
  AutoTopicFlow,
  ControllerRole,
  DependsOnRace,
  HealthcheckTimeline,
  KraftVsZookeeper,
  OutboxFlow,
  PartitionContractTrap,
  QuorumFaultTolerance,
  VolumePersistence,
} from "@/components/docs/diagram";
import { Eyebrow } from "@/components/docs/eyebrow";
import { Hook } from "@/components/docs/hook";
import { PageHeader } from "@/components/docs/page-header";
import { PageNav } from "@/components/docs/page-nav";
import { Sources } from "@/components/docs/sources";
import { Table, Td, Th, Thead, Tr } from "@/components/docs/table";
import { Tag } from "@/components/docs/tag";
import { KraftControllerElection } from "@/components/interactive/kraft-controller-election";
import { OutboxLab } from "@/components/interactive/outbox-lab";
import { SchemaEvolution } from "@/components/interactive/schema-evolution";
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
  table: Table,
  thead: Thead,
  tr: Tr,
  th: Th,
  td: Td,
  AutoTopicFlow,
  Callout,
  CodeBlock,
  ControllerRole,
  DependsOnRace,
  Eyebrow,
  HealthcheckTimeline,
  Hook,
  KraftVsZookeeper,
  OutboxFlow,
  PageHeader,
  PageNav,
  PartitionContractTrap,
  QuorumFaultTolerance,
  SchemaEvolution,
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
