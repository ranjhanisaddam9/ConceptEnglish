import {
  isUppercaseRun,
  rulingGeometry,
  splitByCase,
} from "@/lib/curriculum/writing";
import { cn } from "@/lib/utils";

/**
 * A letter drawn on four-line handwriting ruling, the way it appears in a
 * writing copy.
 *
 * The line positions come from the font's own metrics (see FONT_METRICS), so
 * capitals and tall letters land exactly on the top line, every lowercase
 * letter fills the grass band, and descenders reach exactly the bottom line.
 */

// Geometry in SVG user units, with the glyph drawn at font-size 100.
const FONT_SIZE = 100;
const PADDING = 18;
const WIDTH = 260;

const RULING = rulingGeometry(FONT_SIZE, PADDING);

export interface WritingLinesProps {
  /** The glyph(s) to draw, e.g. "A", "a" or "Aa". */
  text: string;
  /** Announced to screen readers in place of the drawing. */
  label: string;
  className?: string;
}

export function WritingLines({ text, label, className }: WritingLinesProps) {
  return (
    <svg
      viewBox={`0 0 ${WIDTH} ${RULING.height}`}
      role="img"
      aria-label={label}
      className={cn("h-auto w-full", className)}
    >
      {/* The four lines, on no background: outer pair red, inner pair blue,
          as ruled in a writing copy. */}
      {[
        { y: RULING.line1, colour: "var(--writing-line-outer)" },
        { y: RULING.line2, colour: "var(--writing-line-inner)" },
        { y: RULING.line3, colour: "var(--writing-line-inner)" },
        { y: RULING.line4, colour: "var(--writing-line-outer)" },
      ].map(({ y, colour }) => (
        <line
          key={y}
          x1={0}
          x2={WIDTH}
          y1={y}
          y2={y}
          stroke={colour}
          strokeWidth={2}
          strokeOpacity={0.5}
        />
      ))}

      <text
        x={WIDTH / 2}
        y={RULING.baseline}
        fontSize={FONT_SIZE}
        fontWeight={700}
        textAnchor="middle"
        className="font-letter fill-foreground"
      >
        {splitByCase(text).map((run, index) => (
          <tspan
            key={`${run}-${index}`}
            fontSize={
              isUppercaseRun(run) ? FONT_SIZE * RULING.capitalScale : undefined
            }
          >
            {run}
          </tspan>
        ))}
      </text>
    </svg>
  );
}
