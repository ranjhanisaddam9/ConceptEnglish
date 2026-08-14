/**
 * Four-line handwriting ruling — the "copy" a child writes letters into.
 *
 * Four lines make three bands:
 *
 *   ── line 1 ──── red ───  ┐ sky   (ascenders and capitals reach up here)
 *   ── line 2 ──── blue ──  ┤ grass (every lowercase letter fills this band)
 *   ── line 3 ──── blue ──  ┤ root  (descenders hang down here; the baseline)
 *   ── line 4 ──── red ───  ┘
 *
 * The bands are not shaded — the zone names are taught through the "Letter
 * shape" filter rather than through colour.
 *
 * So: grass letters sit between lines 2 and 3, sky letters cover lines 1–3,
 * and root letters cover lines 2–4.
 */

export const WRITING_ZONES = ["grass", "sky", "root"] as const;

export type WritingZone = (typeof WRITING_ZONES)[number];

/**
 * Font metrics as a fraction of font-size, measured from the letter font
 * (Andika, bold — see app/layout.tsx) with canvas `measureText`:
 *
 *   ctx.font = "700 100px Andika";
 *   ctx.measureText("b").actualBoundingBoxAscent / 100  // -> 0.79
 *
 * The ruling is derived from these, which is why letters land exactly on the
 * lines. Re-measure and update these numbers if the letter font changes.
 */
export const FONT_METRICS = {
  /** Top of 'b', 'd', 'l' — the top line. */
  ascender: 0.79,
  /**
   * Top of 'A', 'H'. Shorter than the ascender in this font, so capitals are
   * drawn slightly larger to reach the top line — handwriting teaches capitals
   * and tall letters as the same height.
   */
  capHeight: 0.72,
  /** Top of 'a', 'c', 'x' — the grass band. */
  xHeight: 0.5,
  /** Bottom of 'p' and 'q', the deepest descenders. */
  descender: 0.24,
} as const;

export interface RulingGeometry {
  /** Top line — where ascenders and (scaled) capitals reach. */
  line1: number;
  /** Top of the grass band. */
  line2: number;
  /** The baseline letters sit on. */
  line3: number;
  /** Bottom line — where descenders reach. */
  line4: number;
  /** Same as line3; named for use as an SVG text `y`. */
  baseline: number;
  /** Total height including the padding above line 1 and below line 4. */
  height: number;
  /**
   * Capitals are shorter than ascenders in this font, so they are drawn at
   * this multiple of the base size to reach the top line — handwriting
   * teaches capitals and tall letters as the same height.
   */
  capitalScale: number;
}

/**
 * Line positions for a ruling drawn at a given letter size.
 *
 * Shared by the letter card and the worksheet so the two can never drift
 * apart. Units are whatever the caller is working in — the card uses
 * arbitrary SVG units, the worksheet uses millimetres.
 */
export function rulingGeometry(fontSize: number, padding = 0): RulingGeometry {
  const baseline = padding + FONT_METRICS.ascender * fontSize;

  return {
    line1: padding,
    line2: baseline - FONT_METRICS.xHeight * fontSize,
    line3: baseline,
    line4: baseline + FONT_METRICS.descender * fontSize,
    baseline,
    height: baseline + FONT_METRICS.descender * fontSize + padding,
    capitalScale: FONT_METRICS.ascender / FONT_METRICS.capHeight,
  };
}

/** Splits "Aa" into ["A", "a"] so each run can be sized independently. */
export function splitByCase(text: string): string[] {
  return text.match(/\p{Lu}+|[^\p{Lu}]+/gu) ?? [];
}

export function isUppercaseRun(run: string): boolean {
  return /\p{Lu}/u.test(run);
}

/**
 * Which band each lowercase letter occupies.
 *
 * Anything not listed is a grass letter, which is the majority case.
 */
const SKY_LETTERS = ["b", "d", "f", "h", "k", "l", "t"];
const ROOT_LETTERS = ["g", "j", "p", "q", "y"];

export function writingZoneFor(lowercaseLetter: string): WritingZone {
  const letter = lowercaseLetter.trim().toLowerCase();
  if (SKY_LETTERS.includes(letter)) return "sky";
  if (ROOT_LETTERS.includes(letter)) return "root";
  return "grass";
}

export const ZONE_FILTER_OPTIONS = [
  {
    value: "all" as const,
    label: "All",
    description: "Show every lowercase letter",
  },
  {
    value: "grass" as const,
    label: "Grass",
    description: "Letters that sit between the middle two lines",
  },
  {
    value: "sky" as const,
    label: "Sky",
    description: "Tall letters that reach the top line",
  },
  {
    value: "root" as const,
    label: "Root",
    description: "Letters with a tail below the baseline",
  },
];

export type ZoneFilter = (typeof ZONE_FILTER_OPTIONS)[number]["value"];
