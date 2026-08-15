import { mulberry32, shuffled } from "./sheet-order";
import type { ContentItem } from "./types";
import { PAGE, randomInk } from "./worksheet";
import { rulingGeometry } from "./writing";

/**
 * Worksheets for the pattern units — digraphs, blends, vowel teams and
 * r-controlled vowels.
 *
 * These are simpler to build than the letter sheets, because a pattern unit's
 * item already *is* the answer: its label is the pattern and its examples are
 * the words that carry it. Nothing has to be inferred from the spelling.
 *
 * One item yields at most one row, so a sheet can never ask about the same
 * pattern twice.
 */

/**
 * The letters of a pattern, without its notation.
 *
 * A word family is written "-at" so it reads as an ending on the page, but the
 * hyphen is not in "cat".
 */
function literalLetters(pattern: string): string {
  return pattern.toLowerCase().replace(/[^a-z]/g, "");
}

/** Whether the pattern is a word family — an ending words are built onto. */
function isFamily(pattern: string): boolean {
  return pattern.startsWith("-");
}

export interface PatternCandidate {
  id: string;
  picture: { src: string; alt: string } | null;
  word: string;
  /** The pattern the word carries — the answer. */
  pattern: string;
}

/**
 * Picks one word per pattern.
 *
 * @param illustrated Words that actually have a picture file. Every item
 *   carries an imageUrl whether or not the file exists — the lesson page falls
 *   back to a tinted tile — but a matching sheet with empty boxes is no
 *   exercise at all, so the truth has to come from the folder.
 * @param literalOnly Keep only words the pattern literally appears in. The
 *   writing sheet needs this — it blanks the pattern out of the spelling, and
 *   "VCe" is a description rather than letters you could rub out.
 * @param needPicture Drop words with no picture.
 */
export function selectPatternRows(
  items: ContentItem[],
  random: () => number,
  rowCount: number,
  {
    illustrated,
    literalOnly = false,
    needPicture = true,
  }: {
    illustrated?: ReadonlySet<string>;
    literalOnly?: boolean;
    needPicture?: boolean;
  } = {},
): PatternCandidate[] {
  const hasPicture = (label: string) =>
    illustrated ? illustrated.has(label.toLowerCase()) : true;

  // One shuffled queue of usable words per pattern.
  const queues = items
    .map((item) => {
      const pattern = item.primaryLabel.toLowerCase();
      const literal = literalLetters(pattern);
      const usable = item.examples.filter((example) => {
        if (needPicture && !hasPicture(example.label)) return false;
        return !literalOnly || example.label.toLowerCase().includes(literal);
      });

      return shuffled(usable, random).map(
        (example): PatternCandidate => ({
          id: example.id,
          picture:
            example.imageUrl && hasPicture(example.label)
              ? { src: example.imageUrl, alt: example.label }
              : null,
          word: example.label,
          pattern: item.primaryLabel,
        }),
      );
    })
    .filter((queue) => queue.length > 0);

  // Round-robin, so every pattern appears once before any appears twice. A
  // unit with five digraphs would otherwise leave two thirds of the page
  // empty, while one with twenty blends still gets each of them at most once.
  const chosen: PatternCandidate[] = [];
  const order = shuffled(queues, random);

  while (chosen.length < rowCount) {
    const before = chosen.length;
    for (const queue of order) {
      if (chosen.length >= rowCount) break;
      const next = queue.shift();
      if (next) chosen.push(next);
    }
    if (chosen.length === before) break; // every queue is empty
  }

  return chosen;
}

/**
 * Reorders so nothing keeps its original position, or a child could rule
 * straight across without reading either column.
 */
function deranged<T>(values: T[], random: () => number): T[] {
  if (values.length < 2) return [...values];

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const candidate = shuffled(values, random);
    if (candidate.every((value, index) => value !== values[index])) {
      return candidate;
    }
  }
  return [...values.slice(1), values[0]];
}

/* -------------------------------------------------------------------------
   W1 — match the picture to its pattern
   ------------------------------------------------------------------------- */

/** Millimetres. */
export const PATTERN_MATCH_LAYOUT = {
  pictureBox: 24,
  patternBox: 30,
  rowHeight: 26,
  rowGap: 6,
  anchorRadius: 1.6,
} as const;

export const PATTERN_MATCH_ROW_COUNT = Math.floor(
  (PAGE.height - PAGE.margin * 2 - PAGE.headerHeight) /
    (PATTERN_MATCH_LAYOUT.rowHeight + PATTERN_MATCH_LAYOUT.rowGap),
);

export interface PatternMatchSheet {
  rows: Array<{ id: string; picture: { src: string; alt: string } }>;
  patterns: Array<{ text: string; colour: string }>;
}

export function buildPatternMatchSheet(
  items: ContentItem[],
  illustrated: ReadonlySet<string>,
  seed: number,
  rowCount: number = PATTERN_MATCH_ROW_COUNT,
): PatternMatchSheet {
  const random = mulberry32(seed);
  const chosen = selectPatternRows(items, random, rowCount, { illustrated });

  const rows = chosen
    .filter((candidate) => candidate.picture)
    .map((candidate) => ({
      id: candidate.id,
      picture: candidate.picture as { src: string; alt: string },
    }));

  return {
    rows,
    patterns: deranged(
      chosen.map((candidate) => candidate.pattern),
      random,
    ).map((text) => ({ text, colour: randomInk(random) })),
  };
}

/* -------------------------------------------------------------------------
   W2 — write the missing pattern
   ------------------------------------------------------------------------- */

/** Millimetres. */
export const PATTERN_WRITING_LAYOUT = {
  pictureBox: 22,
  gap: 8,
  rowGap: 6,
  rowHeight: 22,
  letterSize: 12,
  slotWidth: 9,
  /** Per blanked character; a child's first attempt is bigger than the type. */
  blankPerCharacter: 9,
  blankPadding: 7,
} as const;

export const PATTERN_WRITING_ROW_COUNT = Math.floor(
  (PAGE.height - PAGE.margin * 2 - PAGE.headerHeight) /
    (PATTERN_WRITING_LAYOUT.rowHeight + PATTERN_WRITING_LAYOUT.rowGap),
);

export const PATTERN_WRITING_RULING = rulingGeometry(
  PATTERN_WRITING_LAYOUT.letterSize,
);

export interface PatternSlot {
  text: string;
  centre: number;
  width: number;
  isBlank: boolean;
}

export interface PatternWritingRow {
  id: string;
  picture: { src: string; alt: string } | null;
  word: string;
  slots: PatternSlot[];
  width: number;
  colour: string;
}

export function buildPatternWritingSheet(
  items: ContentItem[],
  illustrated: ReadonlySet<string>,
  seed: number,
  rowCount: number = PATTERN_WRITING_ROW_COUNT,
): PatternWritingRow[] {
  const random = mulberry32(seed);
  // A picture is a welcome cue here but not the exercise, so an unillustrated
  // word still earns a row — it just prints without one.
  const chosen = selectPatternRows(items, random, rowCount, {
    illustrated,
    literalOnly: true,
    needPicture: false,
  });

  return chosen.map((candidate) => {
    const word = candidate.word.toLowerCase();
    const literal = literalLetters(candidate.pattern);

    // A family sheet blanks the sound at the *front* — the family is what
    // stays put, and swapping the opening letter is the whole lesson. Every
    // other pattern blanks itself.
    const family = isFamily(candidate.pattern);
    const at = family ? 0 : word.indexOf(literal);
    const blanked = family ? word.slice(0, word.length - literal.length) : literal;

    // The word laid out slot by slot, with the pattern replaced by one wide
    // blank, so the ruling stops exactly where the word does.
    const pieces: Array<{ text: string; isBlank: boolean }> = [
      ...[...word.slice(0, at)].map((text) => ({ text, isBlank: false })),
      { text: blanked, isBlank: true },
      ...[...word.slice(at + blanked.length)].map((text) => ({
        text,
        isBlank: false,
      })),
    ];

    let offset = 0;
    const slots = pieces.map((piece) => {
      const width = piece.isBlank
        ? piece.text.length * PATTERN_WRITING_LAYOUT.blankPerCharacter +
          PATTERN_WRITING_LAYOUT.blankPadding
        : PATTERN_WRITING_LAYOUT.slotWidth;
      const slot = { ...piece, centre: offset + width / 2, width };
      offset += width;
      return slot;
    });

    return {
      id: candidate.id,
      picture: candidate.picture,
      word: candidate.word,
      slots,
      width: offset,
      colour: randomInk(random),
    };
  });
}

/* -------------------------------------------------------------------------
   W3 — word reading grid
   ------------------------------------------------------------------------- */

export const FLUENCY_LAYOUT = {
  columns: 5,
  rows: 10,
  rowHeight: 22,
} as const;

/**
 * Every word in the unit, shuffled into a grid to be read aloud.
 *
 * Deliberately without pictures: the point is to read the word, and a picture
 * beside it lets a child name the picture instead.
 */
export function buildFluencyGrid(items: ContentItem[], seed: number): string[] {
  const random = mulberry32(seed);
  const words = [
    ...new Set(
      items.flatMap((item) => item.examples.map((example) => example.label)),
    ),
  ];
  return shuffled(words, random).slice(
    0,
    FLUENCY_LAYOUT.columns * FLUENCY_LAYOUT.rows,
  );
}
