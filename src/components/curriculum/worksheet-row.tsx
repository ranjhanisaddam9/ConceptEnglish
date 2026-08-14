"use client";

import type { SkeletonDot } from "@/lib/curriculum/letter-skeleton";
import {
  CONTENT_WIDTH,
  DOT_RADIUS,
  LETTER_POSITIONS,
  LETTER_SIZE,
  ROW_RULING,
} from "@/lib/curriculum/worksheet";
import { isUppercaseRun, splitByCase } from "@/lib/curriculum/writing";

/**
 * One ruled row of a worksheet, drawn in millimetres so it prints true to
 * size on A4.
 *
 *   model — the teacher's example, in full ink
 *   trace — pale letters the child writes over
 *   dots  — the same letter with its stroke turned dotted
 *   blank — ruling only
 */

export type RowVariant = "model" | "trace" | "dots" | "blank";

export interface WorksheetRowProps {
  glyph: string;
  variant: RowVariant;
  /** Centre-line dots for `glyph`, in em units. Required by the dots variant. */
  dots?: SkeletonDot[] | null;
}

function glyphRuns(glyph: string) {
  return splitByCase(glyph).map((run, index) => (
    <tspan
      key={`${run}-${index}`}
      fontSize={
        isUppercaseRun(run) ? LETTER_SIZE * ROW_RULING.capitalScale : undefined
      }
    >
      {run}
    </tspan>
  ));
}

export function WorksheetRow({ glyph, variant, dots }: WorksheetRowProps) {
  return (
    <svg
      viewBox={`0 0 ${CONTENT_WIDTH} ${ROW_RULING.height}`}
      width={`${CONTENT_WIDTH}mm`}
      height={`${ROW_RULING.height}mm`}
      aria-hidden
      className="block"
    >
      {[
        { y: ROW_RULING.line1, colour: "var(--writing-line-outer)" },
        { y: ROW_RULING.line2, colour: "var(--writing-line-inner)" },
        { y: ROW_RULING.line3, colour: "var(--writing-line-inner)" },
        { y: ROW_RULING.line4, colour: "var(--writing-line-outer)" },
      ].map(({ y, colour }) => (
        <line
          key={y}
          x1={0}
          x2={CONTENT_WIDTH}
          y1={y}
          y2={y}
          stroke={colour}
          strokeWidth={0.25}
          strokeOpacity={0.5}
        />
      ))}

      {LETTER_POSITIONS.map((x) => {
        if (variant === "blank") return null;

        if (variant === "dots") {
          // Dots sit on the letter's centre line, scaled from em to mm.
          return (dots ?? []).map((dot, index) => (
            <circle
              key={`${x}-${index}`}
              cx={x + dot.x * LETTER_SIZE}
              cy={ROW_RULING.baseline + dot.y * LETTER_SIZE}
              r={DOT_RADIUS}
              fill="var(--worksheet-guide)"
            />
          ));
        }

        return (
          <text
            key={x}
            x={x}
            y={ROW_RULING.baseline}
            fontSize={LETTER_SIZE}
            textAnchor="middle"
            className="font-letter"
            fontWeight={variant === "trace" ? 400 : 700}
            fill={
              variant === "model"
                ? "var(--worksheet-ink)"
                : "var(--worksheet-guide)"
            }
          >
            {glyphRuns(glyph)}
          </text>
        );
      })}
    </svg>
  );
}
