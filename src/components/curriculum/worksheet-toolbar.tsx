"use client";

import { useId } from "react";
import { Printer, Shuffle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

/**
 * The bar of settings above a worksheet.
 *
 * Every sheet had its own copy of the same flex row, which drifted: captions
 * sat at different heights because the controls beneath them were different
 * sizes, and on a narrow screen the buttons wrapped away from the settings and
 * were left stranded mid-row. Print — the thing a teacher came to do — could
 * end up centred under a gap.
 *
 * So the bar has two zones. Settings gather on the left, actions pin to the
 * right, and because the actions are their own flex child they wrap as a pair
 * rather than one at a time. Everything stands on one 48px baseline, which is
 * both what makes the row read as a row and the floor for a target a finger
 * has to find.
 *
 * Screen only. A sheet on paper carries no settings.
 */

export interface WorksheetToolbarProps {
  /** The sheet's own settings — toggles, checkboxes. */
  children?: React.ReactNode;
  /**
   * Deals a fresh set of questions. Omitted by sheets where a reshuffle would
   * change nothing a teacher can see.
   */
  onNewSheet?: () => void;
  /**
   * Overridden where one press prints more than one page — there the count is
   * worth the words, because a teacher is about to spend that much paper.
   */
  printLabel?: string;
  className?: string;
}

export function WorksheetToolbar({
  children,
  onNewSheet,
  printLabel = "Print",
  className,
}: WorksheetToolbarProps) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 rounded-2xl border bg-card p-3 sm:flex-row sm:items-end sm:gap-6 print:hidden",
        className,
      )}
    >
      {children != null && (
        // items-end so a control with a caption above it and one without still
        // stand on the same line.
        <div className="flex flex-wrap items-end justify-center gap-x-6 gap-y-3 sm:justify-start">
          {children}
        </div>
      )}

      {/* ml-auto rather than justify-between: with no settings to push
          against, the actions still sit where they always sit. */}
      <div className="flex items-center justify-center gap-2 sm:ml-auto">
        {onNewSheet && (
          <Button
            type="button"
            variant="outline"
            size="lg"
            onClick={onNewSheet}
            className="h-12 px-5"
          >
            <Shuffle aria-hidden />
            New sheet
          </Button>
        )}

        <Button
          type="button"
          size="lg"
          onClick={() => window.print()}
          className="h-12 px-5"
        >
          <Printer aria-hidden />
          {printLabel}
        </Button>
      </div>
    </div>
  );
}

/**
 * An on/off setting in the toolbar.
 *
 * The whole pill is the target, so the box and its words are one thing to
 * press rather than a 20px square beside some text. Stands as tall as the
 * segmented controls it sits beside.
 */
export function ToolbarCheckbox({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}) {
  const id = useId();

  return (
    <label
      htmlFor={id}
      className="flex h-12 cursor-pointer items-center gap-2.5 rounded-full border px-5 text-sm font-medium hover:bg-accent"
    >
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(next) => onChange(next === true)}
        className="size-5"
      />
      {label}
    </label>
  );
}
