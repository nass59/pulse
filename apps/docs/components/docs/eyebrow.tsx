import { cn } from "@/lib/utils";

/**
 * An UPPERCASE mono eyebrow — DevLab's section/kicker label that sits above a
 * heading (e.g. `UI ENGINEERING`, `SPRING PLAYGROUND`). Olive by default.
 */
export const Eyebrow = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => <p className={cn("ds-eyebrow", className)}>{children}</p>;
