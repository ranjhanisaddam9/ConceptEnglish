import type { WordShape } from "@/lib/curriculum/pattern-sheets";

/**
 * A word wearing a shape, for the family reading sheet.
 *
 * Drawn as outlines with no fill: these print on a classroom printer, often
 * onto coloured paper, and an unfilled balloon costs no toner and leaves the
 * word the darkest thing in it. Each one takes its own colour and its own
 * slight lean, so a row reads as a handful of balloons rather than a stamp
 * repeated.
 *
 * Every shape uses the same 100x110 viewBox so a row lines up however they are
 * mixed, and the lean is applied inside that box so nothing clips at the edge.
 */

/**
 * Long words need smaller type to sit inside the same shape.
 *
 * A single letter gets the largest size of all — it is the answer a child is
 * looking for across the page, so it earns the room the dome gives it.
 */
function fontSize(word: string): number {
  if (word.length === 1) return 24;
  return word.length <= 3 ? 21 : word.length === 4 ? 18 : 15;
}

/** How far a floating shape may lean either way. */
const MAX_TILT_DEGREES = 15;

/**
 * A lean read off the word itself.
 *
 * Sheets that deal their own colours pass a seeded tilt; the rest get this,
 * which varies shape to shape without needing a seed threaded through, and
 * gives the same answer on the server and in the browser.
 */
function derivedTilt(word: string): number {
  // FNV-1a rather than a plain sum: "a", "e" and "i" differ by a few character
  // codes, and a weaker mix leans all five vowels the same way.
  let hash = 2166136261;
  for (const character of word) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return (((hash >>> 0) % 2000) / 1000 - 1) * MAX_TILT_DEGREES;
}

/** Where the word sits in each shape, chosen to centre it in the clear area. */
const TEXT_BASELINE: Record<WordShape, number> = {
  plain: 58,
  balloon: 50,
  cloud: 58,
  train: 52,
  ufo: 46,
};

/**
 * The clear area inside each shape, for a picture rather than a word.
 *
 * Squares, because the artwork is square. Sized to leave the outline visible
 * all the way round — a picture that touches the edge stops reading as
 * something held inside the shape.
 */
const ICON_BOX: Record<WordShape, { cx: number; cy: number; size: number }> = {
  plain: { cx: 50, cy: 53, size: 38 },
  balloon: { cx: 50, cy: 45, size: 44 },
  cloud: { cx: 50, cy: 52, size: 34 },
  train: { cx: 50, cy: 46, size: 36 },
  ufo: { cx: 50, cy: 40, size: 30 },
};

export function WordShapeMark({
  word,
  iconSrc,
  shape,
  widthMm,
  colour,
  // No default: it has to stay undefined for the derived lean to kick in.
  tilt,
}: {
  word: string;
  /** Show this picture inside the shape instead of the word. */
  iconSrc?: string;
  shape: WordShape;
  widthMm: number;
  colour: string;
  /** Degrees. Left out, one is derived from the word itself. */
  tilt?: number;
}) {
  // Things that float lean; things that sit on the ground do not.
  const canLean = shape === "balloon" || shape === "ufo";
  const lean = canLean ? (tilt ?? derivedTilt(word)) : 0;
  const icon = ICON_BOX[shape];

  return (
    <svg
      viewBox="0 0 100 110"
      style={{ width: `${widthMm}mm`, height: `${widthMm * 1.1}mm` }}
      role="img"
      aria-label={word}
    >
      {/* A leaning shape turns about its own centre rather than the middle of
          the box, so what it holds stays where the shape is — and the word or
          picture is drawn outside this group, upright, because a tilted word
          is a harder word to read. */}
      <g transform={`rotate(${lean.toFixed(2)} 50 45)`}>
        {shape === "plain" && (
          <rect
            x="6"
            y="28"
            width="88"
            height="50"
            rx="10"
            fill="none"
            stroke={colour}
            strokeWidth={2.5}
          />
        )}

        {shape === "balloon" && (
          <>
            <ellipse
              cx="50"
              cy="45"
              rx="35"
              ry="41"
              fill="none"
              stroke={colour}
              strokeWidth={2.5}
            />
            {/* knot, then the string */}
            <polygon points="45,85 55,85 50,93" fill={colour} />
            <path
              d="M50 93 q7 7 0 14"
              fill="none"
              stroke={colour}
              strokeWidth={2}
              strokeLinecap="round"
            />
          </>
        )}

        {shape === "cloud" && (
          // One closed path rather than overlapping circles, so no seams show
          // through an unfilled outline.
          <path
            d="M26 74 C13 74 11 57 23 53 C21 36 42 27 52 38 C60 27 80 32 79 47 C91 48 92 69 79 74 Z"
            fill="none"
            stroke={colour}
            strokeWidth={2.5}
            strokeLinejoin="round"
          />
        )}

        {shape === "train" && (
          <>
            {/* Couplers run to the very edge of the box so carriages standing
                side by side read as one train. */}
            <path
              d="M0 70 H10 M90 70 H100"
              stroke={colour}
              strokeWidth={2.5}
              strokeLinecap="round"
            />
            <rect
              x="9"
              y="24"
              width="82"
              height="44"
              rx="6"
              fill="none"
              stroke={colour}
              strokeWidth={2.5}
            />
            <path d="M9 34 H91" stroke={colour} strokeWidth={1.6} />
            <circle
              cx="30"
              cy="80"
              r="10"
              fill="none"
              stroke={colour}
              strokeWidth={2.5}
            />
            <circle
              cx="70"
              cy="80"
              r="10"
              fill="none"
              stroke={colour}
              strokeWidth={2.5}
            />
          </>
        )}

        {shape === "ufo" && (
          <>
            {/* Glass dome the word rides in, then the saucer in front of it.
                The dome is drawn wide and tall so the letter inside keeps
                clear air on every side rather than touching the glass. */}
            <path
              d="M14 62 a36 40 0 0 1 72 0 Z"
              fill="none"
              stroke={colour}
              strokeWidth={2.5}
            />
            <ellipse
              cx="50"
              cy="64"
              rx="46"
              ry="11"
              fill="#fff"
              stroke={colour}
              strokeWidth={2.5}
            />
            <circle cx="26" cy="67" r="3.2" fill={colour} />
            <circle cx="50" cy="68" r="3.2" fill={colour} />
            <circle cx="74" cy="67" r="3.2" fill={colour} />
            <path
              d="M34 75 L27 97 M66 75 L73 97"
              stroke={colour}
              strokeWidth={1.6}
              strokeDasharray="3 4"
              strokeLinecap="round"
            />
          </>
        )}
      </g>

      {iconSrc ? (
        <image
          href={iconSrc}
          x={icon.cx - icon.size / 2}
          y={icon.cy - icon.size / 2}
          width={icon.size}
          height={icon.size}
          preserveAspectRatio="xMidYMid meet"
        />
      ) : (
        <text
          x="50"
          y={TEXT_BASELINE[shape]}
          textAnchor="middle"
          fontFamily="Andika"
          fontWeight={700}
          fontSize={fontSize(word)}
          fill={colour}
        >
          {word}
        </text>
      )}
    </svg>
  );
}
