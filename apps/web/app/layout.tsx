import type { Metadata } from "next";
import { TRPCReactProvider } from "@/trpc/client";

export const metadata: Metadata = { title: "Pulse" };

interface Props {
  children: React.ReactNode;
}

export default function RootLayout({ children }: Props) {
  return (
    <html lang="en">
      <body>
        <TRPCReactProvider>{children}</TRPCReactProvider>
      </body>
    </html>
  );
}
