"use client";

import type { CSSProperties } from "react";

import { cn } from "@/lib/utils";

/**
 * The tick or cross beside a question answered on screen.
 *
 * Shared by every sheet that can be answered, so right and wrong look the same
 * wherever a child meets them. Nothing here prints: a worksheet that arrives
 * with the answers already marked is not a worksheet.
 *
 * Position it however suits the sheet — the mark-pop keyframes own `transform`
 * and land on `none`, but Tailwind's translate utilities compile to the
 * standalone `translate` property, so the two do not fight.
 */
export function AnswerMark({
  correct,
  /** Changing this re-pops the mark; pass the answer that produced it. */
  popKey,
  className,
  style,
}: {
  correct: boolean;
  popKey?: string;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      key={popKey}
      data-answer-mark
      aria-live="polite"
      className={cn(
        "absolute text-center leading-none font-bold print:hidden",
        correct ? "text-green-600" : "text-red-600",
        className,
      )}
      style={style}
    >
      {correct ? "✓" : "✗"}
      <span className="sr-only">{correct ? "Correct" : "Try again"}</span>
    </span>
  );
}
