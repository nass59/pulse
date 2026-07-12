import type { Metadata } from "next";
import localFont from "next/font/local";

import { Footer } from "@/components/docs/footer";
import { Header } from "@/components/docs/header";
import { PathRail } from "@/components/docs/path-rail";
import { ThemeScript, ThemeToggle } from "@/components/docs/theme-toggle";
import "./globals.css";

/**
 * DevLab's two typefaces, self-hosted as variable fonts (the brand files
 * shipped in the design bundle). Spline Sans carries all prose and UI;
 * JetBrains Mono carries code, eyebrows, labels, and numeric data.
 */
const splineSans = localFont({
  src: "./fonts/SplineSans-VariableFont_wght.ttf",
  variable: "--font-sans",
  weight: "300 700",
  display: "swap",
});

const jetbrainsMono = localFont({
  src: [
    {
      path: "./fonts/JetBrainsMono-VariableFont_wght.ttf",
      style: "normal",
      weight: "100 800",
    },
    {
      path: "./fonts/JetBrainsMono-Italic-VariableFont_wght.ttf",
      style: "italic",
      weight: "100 800",
    },
  ],
  variable: "--font-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Pulse docs",
  description: "Pulse — derived study artifact for the Kafka-learning project.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      className={`${splineSans.variable} ${jetbrainsMono.variable} h-full antialiased`}
      lang="en"
      suppressHydrationWarning
    >
      <head>
        <ThemeScript />
      </head>
      <body className="flex min-h-full flex-col overflow-x-clip">
        <Header />
        <PathRail />
        <main className="mx-auto w-full max-w-3xl flex-1 px-6">
          <article className="prose prose-slate dark:prose-invert max-w-none">
            {children}
          </article>
        </main>
        <Footer />
        <ThemeToggle />
      </body>
    </html>
  );
}
