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

/**
 * What the child matches each picture to.
 *
 *   pattern — the letters the word is built on ("sh", "-at")
 *   word    — the whole spelling, which asks them to read it
 */
export type MatchAnswer = "pattern" | "word";

export function buildPatternMatchSheet(
  items: ContentItem[],
  illustrated: ReadonlySet<string>,
  seed: number,
  rowCount: number = PATTERN_MATCH_ROW_COUNT,
  answer: MatchAnswer = "pattern",
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
      chosen.map((candidate) =>
        answer === "word" ? candidate.word.toLowerCase() : candidate.pattern,
      ),
      random,
    ).map((text) => ({ text, colour: randomInk(random) })),
  };
}

/* -------------------------------------------------------------------------
   Match the picture to its vowel
   ------------------------------------------------------------------------- */

export interface VowelMatchSheet {
  rows: Array<{ id: string; picture: { src: string; alt: string } }>;
  /** The answer column: every vowel once, however many pictures there are. */
  vowels: Array<{ text: string; colour: string }>;
}

/**
 * Pictures down one side, the vowels down the other.
 *
 * Unlike the other matching sheets this is many-to-one — several pictures
 * share a vowel, and that is the exercise. So the vowels are listed once each
 * rather than shuffled to line up row by row.
 */
export function buildVowelMatchSheet(
  items: ContentItem[],
  illustrated: ReadonlySet<string>,
  seed: number,
  includeOo: boolean,
  rowCount: number = PATTERN_MATCH_ROW_COUNT,
): VowelMatchSheet {
  const random = mulberry32(seed);
  const chosen = selectPatternRows(items, random, rowCount, { illustrated });

  const vowels = [...SHORT_VOWEL_LETTERS, ...(includeOo ? ["oo"] : [])];

  return {
    rows: chosen
      .filter((candidate) => candidate.picture)
      .map((candidate) => ({
        id: candidate.id,
        picture: candidate.picture as { src: string; alt: string },
      })),
    vowels: vowels.map((text) => ({ text, colour: randomInk(random) })),
  };
}

const SHORT_VOWEL_LETTERS = ["a", "e", "i", "o", "u"];

/* -------------------------------------------------------------------------
   W2 — write the missing pattern
   ------------------------------------------------------------------------- */

/** Millimetres. */
export const PATTERN_WRITING_LAYOUT = {
  pictureBox: 22,
  /**
   * Between the picture and the word.
   *
   * Wide, so the two read as a picture and a separate thing to write rather
   * than one crowded row. Every word starts at the same distance in, which is
   * what lets a child run down the column reading only the blanks.
   */
  gap: 26,
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
  picture: { src: string; alt: string };
  word: string;
  slots: PatternSlot[];
  width: number;
  colour: string;
}

/**
 * Which letters the child fills in.
 *
 *   auto  — the pattern itself, or for a word family the sound in front of it
 *   vowel — only the vowel, so the question is "which vowel is in this word?"
 */
export type WritingBlank = "auto" | "vowel";

/** The vowel letters a family opens with: "at" -> "a", "ook" -> "oo". */
function familyVowel(family: string): string {
  return /^[aeiou]+/.exec(family)?.[0] ?? "";
}

export function buildPatternWritingSheet(
  items: ContentItem[],
  illustrated: ReadonlySet<string>,
  seed: number,
  rowCount: number = PATTERN_WRITING_ROW_COUNT,
  blank: WritingBlank = "auto",
): PatternWritingRow[] {
  const random = mulberry32(seed);
  // A picture is a welcome cue here but not the exercise, so an unillustrated
  // word still earns a row — it just prints without one.
  // The picture is how a child knows which word they are being asked for, so
  // a row without one is a guess rather than an exercise.
  const chosen = selectPatternRows(items, random, rowCount, {
    illustrated,
    literalOnly: true,
  });

  return chosen.map((candidate) => {
    const word = candidate.word.toLowerCase();
    const literal = literalLetters(candidate.pattern);

    // A family sheet blanks the sound at the *front* — the family is what
    // stays put, and swapping the opening letter is the whole lesson. Every
    // other pattern blanks itself. A vowel sheet blanks only the vowel,
    // wherever in the word it falls.
    const family = isFamily(candidate.pattern);

    let at: number;
    let blanked: string;
    if (blank === "vowel" && family) {
      blanked = familyVowel(literal);
      at = word.length - literal.length;
    } else if (family) {
      blanked = word.slice(0, word.length - literal.length);
      at = 0;
    } else {
      blanked = literal;
      at = word.indexOf(literal);
    }

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
      picture: candidate.picture as { src: string; alt: string },
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
export interface FluencyWord {
  text: string;
  /** Outline and lettering colour — one hue per word. */
  colour: string;
  /** Degrees to lean, so a row of balloons does not look stamped out. */
  tilt: number;
}

export interface FluencyGroup {
  label: string;
  words: FluencyWord[];
}

/** How far a balloon may lean either way. */
const MAX_TILT_DEGREES = 15;

/** How each word is dressed on the family reading sheet. */
export const WORD_SHAPES = [
  "plain",
  "balloon",
  "cloud",
  "train",
  "ufo",
] as const;

export type WordShape = (typeof WORD_SHAPES)[number];

export const WORD_SHAPE_OPTIONS = [
  {
    value: "plain" as const,
    label: "Boxes",
    description: "Each word in a plain rounded box",
  },
  {
    value: "balloon" as const,
    label: "Balloons",
    description: "Each word floating in a balloon",
  },
  {
    value: "cloud" as const,
    label: "Clouds",
    description: "Each word in a cloud — the roomiest shape, and the clearest",
  },
  {
    value: "train" as const,
    label: "Train",
    description: "The family as a train, one carriage per word",
  },
  {
    value: "ufo" as const,
    label: "Spaceships",
    description: "Each word riding in the window of a flying saucer",
  },
];

/**
 * The same words, kept in their families and ordered by opening consonant.
 *
 * Reading "cab jab lab" together is a different exercise from reading them
 * scattered: the child sees the ending hold still while the front sound
 * changes, which is the whole point of a family. Sorting rather than shuffling
 * makes that visible down the line as well as across it, so the word order is
 * fixed; only the colour and lean of each balloon are dealt fresh.
 */
export function buildFluencyGroups(
  items: ContentItem[],
  seed: number,
): FluencyGroup[] {
  const random = mulberry32(seed);

  return items
    .map((item) => ({
      label: item.primaryLabel,
      words: item.examples
        .map((example) => example.label.toLowerCase())
        .sort((a, b) => a.localeCompare(b))
        .map((text) => ({
          text,
          colour: randomInk(random),
          tilt: (random() * 2 - 1) * MAX_TILT_DEGREES,
        })),
    }))
    .filter((group) => group.words.length > 0);
}

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
