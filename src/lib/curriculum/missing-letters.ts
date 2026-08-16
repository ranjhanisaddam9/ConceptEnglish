import { itemLabel } from "./display";
import { mulberry32, shuffled } from "./sheet-order";
import type { ContentItem, LabelMode } from "./types";
import { PAGE, ROW_RULING, randomInk } from "./worksheet";

/**
 * "Missing letters" worksheet.
 *
 *   random  A ___ C D ___    fill the gaps in short runs from anywhere in the
 *                            alphabet, a different set on every visit
 *   entire  the whole alphabet on writing lines, with gaps
 */

export const MISSING_MODES = ["random", "entire"] as const;

export type MissingMode = (typeof MISSING_MODES)[number];

export const MISSING_MODE_OPTIONS = [
  {
    value: "random" as const,
    label: "Random",
    description: "Fill the gaps in short runs of letters",
  },
  {
    value: "entire" as const,
    label: "Entire",
    description: "Complete the whole alphabet on writing lines",
  },
];

/** Millimetres. */
export const MISSING_LAYOUT = {
  rowGap: 6,
  rowHeight: 18,
  /** A write-here slot. */
  slotWidth: 22,
  slotHeight: 13,
  /** How many letters sit on one ruled line in "entire" mode. */
  lettersPerLine: 3,
  lineGap: 8,
  /** Width of the blank drawn on the baseline where a letter is missing. */
  entireBlankWidth: 13,
} as const;

const ROW_PITCH = MISSING_LAYOUT.rowHeight + MISSING_LAYOUT.rowGap;

export const MISSING_ROW_COUNT = Math.floor(
  (PAGE.height - PAGE.margin * 2 - PAGE.headerHeight) / ROW_PITCH,
);

/** "line" shows a short consecutive run with some of it blanked out. */
const LINE_RUN = { standard: 5, both: 3 } as const;
/**
 * One gap per row, whichever case is showing.
 *
 * A row is a single question: the child reads the run either side of the gap
 * and names the one letter missing from it. Two gaps in a short run leave too
 * little to read from, and make the row two questions wearing one number.
 */
const LINE_BLANKS = { standard: 1, both: 1 } as const;

/** Roughly this share of the alphabet is blanked in "entire" mode. */
const ENTIRE_MISSING_SHARE = 0.35;

/** A child needs a run of letters to read from, so never blank three in a row. */
const MAX_CONSECUTIVE_MISSING = 2;

export type MissingCell =
  | { kind: "letter"; text: string; colour: string }
  | { kind: "blank" };

export interface MissingQuestion {
  id: string;
  /** Cells rendered left to right inside the row's rectangle. */
  cells: MissingCell[];
}

function blank(): MissingCell {
  return { kind: "blank" };
}

function letter(text: string, random: () => number): MissingCell {
  return { kind: "letter", text, colour: randomInk(random) };
}

/** Picks `count` distinct indexes below `length`. */
function pickIndexes(length: number, count: number, random: () => number) {
  return new Set(
    shuffled(
      Array.from({ length }, (_, index) => index),
      random,
    ).slice(0, count),
  );
}

/**
 * Builds one sheet of "random" questions.
 *
 * Each row starts at a randomly chosen letter, and the starts are drawn
 * without replacement so no run appears twice on the page.
 */
export function buildRandomRows(
  items: ContentItem[],
  labelMode: LabelMode,
  seed: number,
  rowCount: number = MISSING_ROW_COUNT,
): MissingQuestion[] {
  const ordered = [...items].sort((a, b) => a.orderIndex - b.orderIndex);

  const runLength = labelMode === "both" ? LINE_RUN.both : LINE_RUN.standard;
  const blanks = labelMode === "both" ? LINE_BLANKS.both : LINE_BLANKS.standard;
  if (ordered.length < runLength) return [];

  const random = mulberry32(seed);

  // Distinct starting letters, so two rows can never be the same run.
  const starts = shuffled(
    Array.from({ length: ordered.length - runLength + 1 }, (_, index) => index),
    random,
  ).slice(0, rowCount);

  return starts.map((start) => {
    const hidden = pickIndexes(runLength, blanks, random);

    return {
      id: `line-${start}`,
      cells: Array.from({ length: runLength }, (_, offset) =>
        hidden.has(offset)
          ? blank()
          : letter(itemLabel(ordered[start + offset], labelMode), random),
      ),
    };
  });
}

export interface EntireSheet {
  /** Ruled lines, each holding a few letters or gaps. */
  lines: MissingCell[][];
  missingCount: number;
}

/**
 * Chooses which letters to blank out of the alphabet.
 *
 * Two rules keep the sheet solvable: the first and last letters always show,
 * so the run is anchored at both ends, and no more than two letters in a row
 * are ever blank.
 */
function chooseHidden(length: number, target: number, random: () => number) {
  const hidden = new Set<number>();
  // Never the first or the last — gaps sit between them.
  const candidates = shuffled(
    Array.from({ length: Math.max(0, length - 2) }, (_, index) => index + 1),
    random,
  );

  const runAround = (index: number) => {
    let run = 1;
    for (let i = index - 1; i >= 0 && hidden.has(i); i -= 1) run += 1;
    for (let i = index + 1; i < length && hidden.has(i); i += 1) run += 1;
    return run;
  };

  for (const index of candidates) {
    if (hidden.size >= target) break;
    hidden.add(index);
    if (runAround(index) > MAX_CONSECUTIVE_MISSING) hidden.delete(index);
  }

  return hidden;
}

/** The whole alphabet laid out on writing lines with letters removed. */
export function buildEntireSheet(
  items: ContentItem[],
  labelMode: LabelMode,
  seed: number,
): EntireSheet {
  const ordered = [...items].sort((a, b) => a.orderIndex - b.orderIndex);
  const target = Math.max(
    1,
    Math.round(ordered.length * ENTIRE_MISSING_SHARE),
  );

  const random = mulberry32(seed);
  const hidden = chooseHidden(ordered.length, target, random);

  const cells: MissingCell[] = ordered.map((item, index) =>
    hidden.has(index) ? blank() : letter(itemLabel(item, labelMode), random),
  );

  const lines: MissingCell[][] = [];
  for (let start = 0; start < cells.length; start += MISSING_LAYOUT.lettersPerLine) {
    lines.push(cells.slice(start, start + MISSING_LAYOUT.lettersPerLine));
  }

  return { lines, missingCount: hidden.size };
}

/** Height of one ruled line plus its gap, in millimetres. */
export const ENTIRE_LINE_PITCH = ROW_RULING.height + MISSING_LAYOUT.lineGap;

export function missingInstruction(mode: MissingMode): string {
  return mode === "random"
    ? "Write the letters that are missing from each line."
    : "Fill in the letters that are missing from the alphabet.";
}
