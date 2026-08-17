import { itemLabel } from "./display";
import { gapQuestion, type GapQuestion } from "./gap-question";
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

export type MissingCell =
  | { kind: "letter"; text: string; colour: string }
  | { kind: "blank"; question: GapQuestion };

export interface MissingQuestion {
  id: string;
  /** Cells rendered left to right inside the row's rectangle. */
  cells: MissingCell[];
  /**
   * The row's single gap (see LINE_BLANKS) — the same object its blank cell
   * carries. A row is one question, so it has exactly one of these.
   */
  gap: GapQuestion;
}

function blank(question: GapQuestion): MissingCell {
  return { kind: "blank", question };
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
  const labels = ordered.map((item) => itemLabel(item, labelMode));

  // Distinct starting letters, so two rows can never be the same run.
  const starts = shuffled(
    Array.from({ length: ordered.length - runLength + 1 }, (_, index) => index),
    random,
  ).slice(0, rowCount);

  return starts.map((start) => {
    const hidden = pickIndexes(runLength, blanks, random);

    const [gapOffset] = hidden;
    const shown = new Set(
      Array.from({ length: runLength }, (_, offset) => offset)
        .filter((offset) => !hidden.has(offset))
        .map((offset) => labels[start + offset]),
    );

    const gap = gapQuestion(
      `line-${start}`,
      labels[start + gapOffset],
      labels,
      shown,
      random,
    );

    return {
      id: `line-${start}`,
      gap,
      cells: Array.from({ length: runLength }, (_, offset) =>
        hidden.has(offset) ? blank(gap) : letter(labels[start + offset], random),
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
 * One gap per ruled line, so every line asks exactly one question, and never
 * two gaps running — a child reads a gap from the letters either side of it,
 * and a line break does not stop two gaps being neighbours in the alphabet.
 * The first and last letters always show, so the run is anchored at both ends.
 */
function chooseHidden(length: number, random: () => number) {
  const perLine = MISSING_LAYOUT.lettersPerLine;

  /** The letters on the line starting at `start` that a gap could take. */
  const openOn = (start: number, after: number) =>
    Array.from(
      { length: Math.max(0, Math.min(perLine, length - start)) },
      (_, offset) => start + offset,
    ).filter(
      (index) =>
        // Gaps sit between the ends, never on them.
        index > 0 &&
        index < length - 1 &&
        // Never two in a row, across a line break as much as within a line.
        index !== after + 1,
    );

  const hidden = new Set<number>();
  let previous = -2;

  for (let start = 0; start < length; start += perLine) {
    const candidates = shuffled(openOn(start, previous), random);

    // Taking the last letter of a line would strand the next line's first,
    // which on a short final line can be its only choice. Prefer a gap that
    // leaves the next line something to ask.
    const chosen =
      candidates.find(
        (index) =>
          start + perLine >= length || openOn(start + perLine, index).length > 0,
      ) ?? candidates[0];

    if (chosen === undefined) continue;
    hidden.add(chosen);
    previous = chosen;
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

  const random = mulberry32(seed);
  const hidden = chooseHidden(ordered.length, random);
  const labels = ordered.map((item) => itemLabel(item, labelMode));

  // Which ruled line a letter lands on — the letters sharing a gap's line are
  // the ones on show beside it.
  const lineOf = (index: number) =>
    Math.floor(index / MISSING_LAYOUT.lettersPerLine);

  const cells: MissingCell[] = labels.map((label, index) => {
    if (!hidden.has(index)) return letter(label, random);

    const shown = new Set(
      labels.filter(
        (_, other) => !hidden.has(other) && lineOf(other) === lineOf(index),
      ),
    );
    return blank(gapQuestion(`gap-${index}`, label, labels, shown, random));
  });

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
