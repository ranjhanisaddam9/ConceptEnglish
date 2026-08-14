"use client";

import type { ReactNode } from "react";

import { PAGE } from "@/lib/curriculum/worksheet";
import { cn } from "@/lib/utils";

/**
 * The A4 sheet itself, shared by every worksheet type.
 *
 * Laid out in millimetres so what is on screen is what prints; the print
 * rules in globals.css strip everything around it.
 */

export interface WorksheetPageProps {
  title: string;
  instruction: string;
  /** Optional picture shown between the title and the name line. */
  picture?: { src: string; alt: string } | null;
  /** Only set where something needs to reference the page by id. */
  id?: string;
  /** Hidden on screen but still printed — used for multi-page sets. */
  hiddenOnScreen?: boolean;
  /** Start a new sheet of paper after this page when printing. */
  breakAfter?: boolean;
  children: ReactNode;
}

export function WorksheetPage({
  title,
  instruction,
  picture,
  id,
  hiddenOnScreen = false,
  breakAfter = false,
  children,
}: WorksheetPageProps) {
  return (
    <div
      className={cn(
        "overflow-x-auto print:overflow-visible",
        // Kept in the DOM so printing produces the whole set, not just the
        // page currently on screen.
        hiddenOnScreen && "hidden print:block",
      )}
    >
      <div
        id={id}
        data-worksheet-page
        className="mx-auto flex flex-col bg-white text-neutral-900 shadow-lg ring-1 ring-black/10 print:shadow-none print:ring-0"
        style={{
          width: `${PAGE.width}mm`,
          minHeight: `${PAGE.height}mm`,
          padding: `${PAGE.margin}mm`,
          breakAfter: breakAfter ? "page" : undefined,
        }}
      >
        <header
          className="flex items-center justify-between gap-6 border-b border-neutral-300 pb-3"
          style={{ height: `${PAGE.headerHeight}mm` }}
        >
          <div className="min-w-0">
            <p className="font-heading truncate text-lg font-bold">{title}</p>
            <p className="text-xs text-neutral-500">{instruction}</p>
          </div>

          {picture && (
            /* next/image would rewrite this through the optimiser at a size
               chosen for the screen; the worksheet needs the asset at exact
               print size. */
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={picture.src}
              alt={picture.alt}
              className="shrink-0"
              style={{ height: `${PAGE.headerHeight - 8}mm` }}
            />
          )}

          <p className="text-sm whitespace-nowrap text-neutral-500">
            Name: ______________
          </p>
        </header>

        {children}
      </div>
    </div>
  );
}
