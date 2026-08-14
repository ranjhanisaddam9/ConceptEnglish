import type { Metadata } from "next";
import { Andika, Geist, Geist_Mono } from "next/font/google";

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * Andika (SIL) is used wherever a child reads or copies a letter — the
 * alphabet buttons, the writing lines, the example words.
 *
 * It is designed for early literacy: a single-storey 'a' and 'g' matching how
 * children are taught to form them, and traditional ascender/descender
 * proportions that make the four-line ruling come out evenly.
 * The surrounding interface stays on Geist.
 */
const andika = Andika({
  variable: "--font-andika",
  subsets: ["latin"],
  weight: ["400", "700"],
});

export const metadata: Metadata = {
  title: "Concept English",
  description:
    "Kindergarten to Grade 1 English curriculum — letters, sounds and words.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    // suppressHydrationWarning covers only these two elements' own attributes,
    // not their children: browser extensions inject attributes here between the
    // server response and hydration (ColorZilla's cz-shortcut-listen, for
    // instance), which React would otherwise report as a mismatch. Real
    // mismatches inside the app still surface.
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${andika.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col" suppressHydrationWarning>
        {/* Required by shadcn's Tooltip, which the collapsed sidebar uses. */}
        <TooltipProvider>{children}</TooltipProvider>
        <Toaster position="top-center" richColors />
      </body>
    </html>
  );
}
