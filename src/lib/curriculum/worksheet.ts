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
    label: "Blank",
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

/**
 * A random ink colour for a printed letter.
 *
 * Lightness and chroma are fixed and only the hue varies, so every letter
 * comes out equally readable on white paper however the dice fall. Takes the
 * sheet's seeded generator so a sheet always prints in the same colours.
 */
const INK_LIGHTNESS = 0.55;
const INK_CHROMA = 0.17;

export function randomInk(random: () => number): string {
  return `oklch(${INK_LIGHTNESS} ${INK_CHROMA} ${Math.floor(random() * 360)})`;
}

/**
 * The stretches of the hue circle left over once marking has taken its two.
 *
 * Green means right and red means wrong wherever a sheet answers back, so a
 * colour chosen for decoration has to keep clear of both or it reads as a
 * verdict. Forty degrees either side of each is cut out rather than the bare
 * minimum: a hue that merely borders green is a chartreuse a child glances at
 * and calls green. What is left is a band of ambers, and then everything from
 * teal round through blue and purple to pink.
 */
const UNRESERVED_HUE_SPANS = [
  { start: 67, width: 42 },
  { start: 189, width: 158 },
];

/**
 * A random ink colour that cannot be mistaken for a mark.
 *
 * Picked evenly across what the spans above leave, so the colours come out as
 * varied as randomInk's, minus the two families that mean something.
 */
export function randomUnreservedInk(random: () => number): string {
  const total = UNRESERVED_HUE_SPANS.reduce(
    (sum, span) => sum + span.width,
    0,
  );

  let offset = random() * total;
  let hue = UNRESERVED_HUE_SPANS[0].start;
  for (const span of UNRESERVED_HUE_SPANS) {
    if (offset < span.width) {
      hue = span.start + offset;
      break;
    }
    offset -= span.width;
  }

  return `oklch(${INK_LIGHTNESS} ${INK_CHROMA} ${Math.floor(hue)})`;
}

/**
 * The screen-only column holding a row's "say this word" button, in
 * millimetres.
 *
 * Fixed rather than left to the button's own size so a sheet that works out
 * its geometry from these constants — Unit 2's matching sheet draws its lines
 * that way — knows exactly how far the row's contents have been pushed along.
 * See components/curriculum/word-sound.
 *
 * The column and its gap together come to 12mm — a hair under the 48px button
 * they hold, which therefore overhangs by about a pixel at each side. That is
 * deliberate: a row's own contents are laid out to fill the page, so widening
 * this column to fit the button exactly pushed the far end of a choosing row
 * off the sheet.
 */
export const WORD_SOUND_WIDTH = 10;
export const WORD_SOUND_GAP = 2;
export const WORD_SOUND_COLUMN = WORD_SOUND_WIDTH + WORD_SOUND_GAP;

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
