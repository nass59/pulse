"use client";

import {
  IconArrowUpRight,
  IconBrandGithub,
  IconMenu2,
} from "@tabler/icons-react";
import Link from "next/link";

import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerTitle,
  DrawerTrigger,
} from "@/components/ui/drawer";

/**
 * Small-screen navigation — a bottom drawer speaking the same drafting-sheet
 * language as the header and title block: hairline-ruled cells, mono
 * uppercase labels. Every link is a DrawerClose so navigating also dismisses
 * the sheet; the trigger is a header cell that only exists below `md`, where
 * the desktop cells would overflow.
 */
const linkCell =
  "flex items-center gap-1.5 border-electric-yellow/15 border-t px-6 py-4 font-medium font-mono text-[12px] text-foreground/80 uppercase tracking-[0.14em] transition-colors hover:bg-electric-yellow/[0.06] hover:text-foreground";

export const MobileNav = ({
  items,
}: {
  items: { href: string; label: string }[];
}) => (
  <Drawer showSwipeHandle>
    <DrawerTrigger
      aria-label="Open navigation"
      className="flex w-16 items-center justify-center border-electric-yellow/15 border-l text-foreground/70 transition-colors hover:bg-electric-yellow/[0.06] hover:text-foreground md:hidden"
    >
      <IconMenu2 className="size-4" />
    </DrawerTrigger>
    <DrawerContent className="border-electric-yellow/25 bg-background">
      <DrawerTitle className="px-6 pt-4 pb-3 font-mono text-[9px] text-muted-foreground tracking-[0.2em]">
        NAVIGATE
      </DrawerTitle>
      <nav className="flex flex-col pb-[max(env(safe-area-inset-bottom),0.75rem)]">
        {items.map((item) => (
          <DrawerClose
            className={linkCell}
            key={item.href}
            nativeButton={false}
            render={<Link href={item.href} />}
          >
            {item.label}
          </DrawerClose>
        ))}
        <DrawerClose
          className={linkCell}
          nativeButton={false}
          render={
            <a
              href="https://github.com/nass59/pulse"
              rel="noreferrer"
              target="_blank"
            />
          }
        >
          <IconBrandGithub className="size-4" />
          GitHub
          <IconArrowUpRight className="size-3.5" />
        </DrawerClose>
      </nav>
    </DrawerContent>
  </Drawer>
);
