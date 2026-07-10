"use client";

import { useQuery } from "@tanstack/react-query";
import { use } from "react";
import { useTRPC } from "@/trpc/client";

interface Props {
  params: Promise<{ slug: string }>;
}

export default function ChannelPage({ params }: Props) {
  const { slug } = use(params);
  const trpc = useTRPC();
  const channel = useQuery(trpc.channel.get.queryOptions({ slug }));

  if (channel.isPending) {
    return <p>Loading...</p>;
  }

  if (channel.error) {
    return <p>Channel not found.</p>;
  }

  return (
    <main>
      <h1>{channel.data.title}</h1>
      <p>{channel.data.isLive ? "🔴 LIVE" : "Offline"}</p>
    </main>
  );
}
