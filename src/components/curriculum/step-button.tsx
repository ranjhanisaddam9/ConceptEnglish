"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Round icon button for stepping to the previous or next letter.
 *
 * Sits beside the letter card and beside the worksheet page, so the same
 * gesture moves through a unit wherever you are.
 */

export interface StepButtonProps {
  direction: "previous" | "next";
  /** The letter being stepped to, used for the accessible name. */
  targetLabel: string;
  onClick: () => void;
  className?: string;
}

export function StepButton({
  direction,
  targetLabel,
  onClick,
  className,
}: StepButtonProps) {
  const Icon = direction === "previous" ? ChevronLeft : ChevronRight;
  const description =
    direction === "previous"
      ? `Previous: ${targetLabel}`
      : `Next: ${targetLabel}`;

  return (
    <Button
      type="button"
      variant="outline"
      onClick={onClick}
      aria-label={description}
      title={description}
      className={cn(
        "size-14 shrink-0 rounded-full [&_svg]:size-7",
        "motion-safe:transition-transform motion-safe:active:scale-95",
        className,
      )}
    >
      <Icon aria-hidden />
    </Button>
  );
}
