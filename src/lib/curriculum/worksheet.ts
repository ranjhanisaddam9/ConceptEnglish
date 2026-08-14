import { rulingGeometry } from "./writing";

/**
 * Printable handwriting worksheet geometry.
 *
 * All measurements are in millimetres, and the SVG rows use millimetres as
 * their user units, so what is laid out here is literally what prints.
 */

export const WORKSHEET_STYLES = ["tracing", "dots", "empty"] as const;

export type WorksheetStyle = (typeof WORKSHEET_STYLES)[number];

export const WORKSHEET_STYLE_OPTIONS = [
  {
    value: "tracing" as const,
    label: "Tracing",
    description: "Grey letters on every line for the child to trace over",
  },
  {
    value: "dots" as const,
    label: "Dots",
    description: "Dotted letters on every line for the child to join up",
  },
  {
    value: "empty" as const,
    label: "Empty",
    description: "Blank lines for the child to write on unaided",
  },
];

/** A4, in millimetres. */
export const PAGE = {
  width: 210,
  height: 297,
  margin: 14,
  /** Room for the worksheet title and the child's name line. */
  headerHeight: 26,
} as const;

export const CONTENT_WIDTH = PAGE.width - PAGE.margin * 2; // 182mm

/** Letter size chosen so the ruling is about 18mm tall — kindergarten scale. */
export const LETTER_SIZE = 17.5;

export const ROW_GAP = 8;

/**
 * The "dots" practice style.
 *
 * Dots are placed along the letter's centre line (see letter-skeleton.ts), so
 * a stem carries one line of dots — the same letter with its stroke turned
 * dotted, rather than its outline traced.
 */
export const DOT_RADIUS = 0.62;

/** Gap between dot centres, in millimetres. */
export const DOT_SPACING = 2.6;

/** The same spacing expressed in em, which is what the skeleton works in. */
export const DOT_SPACING_EM = DOT_SPACING / LETTER_SIZE;

/** Matches the font stack applied by the `font-letter` utility. */
export const LETTER_FONT_FAMILY = "Andika";

/** Guide letters are drawn at the bold weight, like the model. */
export const GUIDE_FONT_WEIGHT = 700;

export const ROW_RULING = rulingGeometry(LETTER_SIZE);

const ROW_PITCH = ROW_RULING.height + ROW_GAP;

/** As many ruled rows as fit on the page below the header. */
export const ROW_COUNT = Math.floor(
  (PAGE.height - PAGE.margin * 2 - PAGE.headerHeight) / ROW_PITCH,
);

/**
 * Where the model letters sit along a row.
 *
 * Three per line, evenly distributed, so the group reads as centred rather
 * than crowded to one side.
 */
export const LETTER_POSITIONS = [1 / 6, 3 / 6, 5 / 6].map(
  (fraction) => CONTENT_WIDTH * fraction,
);
