import { mulberry32, paginate, shuffled, type SheetOrder } from "./sheet-order";
import type { ContentItem } from "./types";
import { PAGE } from "./worksheet";

/**
 * "Match the letters" worksheet.
 *
 * Each question is a prompt letter in a square box, attached to a rectangle
 * holding five candidate letters — one correct, four distractors. The child
 * rings the one that matches.
 */

export const MATCH_DIRECTIONS = ["upper-to-lower", "lower-to-upper"] as const;

export type MatchDirection = (typeof MATCH_DIRECTIONS)[number];

export const MATCH_DIRECTION_OPTIONS = [
  {
    value: "upper-to-lower" as const,
    label: "A → a",
    description: "Show a capital letter, find the small letter",
  },
  {
    value: "lower-to-upper" as const,
    label: "a → A",
    description: "Show a small letter, find the capital letter",
  },
];

/**
 * How the child marks their answer.
 *
 *   circle — the options are plain letters, and the child rings the match
 *   colour — every option already sits in a circle, and the child colours in
 *            the one holding the match
 */
export const MATCH_ANSWER_MODES = ["circle", "colour"] as const;

export type MatchAnswerMode = (typeof MATCH_ANSWER_MODES)[number];

export const MATCH_ANSWER_OPTIONS = [
  {
    value: "circle" as const,
    label: "Circle it",
    description: "Children draw a circle around the matching letter",
  },
  {
    value: "colour" as const,
    label: "Colour it",
    description: "Every letter sits in a circle; children colour the matching one",
  },
];

// Order and the seeded shuffle are shared with the other worksheets.
export { SHEET_ORDER_OPTIONS as MATCH_ORDER_OPTIONS } from "./sheet-order";
export type { SheetOrder as MatchOrder } from "./sheet-order";

/** Millimetres. */
export const MATCH_LAYOUT = {
  /** The square box holding the prompt letter. */
  promptBox: 18,
  rowGap: 6,
  optionCount: 5,
  /** Diameter of the circle drawn round each option in "colour" mode. */
  optionCircle: 14,
} as const;

/**
 * Builds the printed instruction from the two settings, so the sheet always
 * says what the child is actually being asked to do.
 */
export function matchInstruction(
  direction: MatchDirection,
  answerMode: MatchAnswerMode,
  imageOnly = false,
): string {
  const shown = direction === "upper-to-lower" ? "capital letter" : "small letter";
  const wanted = direction === "upper-to-lower" ? "small letter" : "capital letter";

  // With the letter hidden, the picture is the whole question.
  const target = imageOnly
    ? `${wanted} that the picture begins with`
    : `${wanted} that matches the ${shown}`;

  return answerMode === "circle"
    ? `Draw a circle around the ${target}.`
    : `Colour the circle holding the ${target}.`;
}

const ROW_PITCH = MATCH_LAYOUT.promptBox + MATCH_LAYOUT.rowGap;

/** As many questions as fit on the page below the header. */
export const MATCH_ROW_COUNT = Math.floor(
  (PAGE.height - PAGE.margin * 2 - PAGE.headerHeight) / ROW_PITCH,
);

export interface MatchQuestion {
  id: string;
  /** Letter shown in the square box. */
  prompt: string;
  /** The option that matches the prompt. */
  answer: string;
  /** The five candidates, already shuffled. */
  options: string[];
  /**
   * The letter's picture — "A is for Apple" — so a child who cannot yet read
   * the letter still has a way in.
   */
  picture: { src: string; alt: string } | null;
}

/**
 * Builds the full set of pages covering every letter in the unit exactly once.
 *
 * 26 letters at ten questions a page comes to three pages. Sequential order
 * runs Aa–Zz; random shuffles the whole alphabet before splitting, so a
 * random set still covers all 26 rather than repeating some and dropping
 * others.
 */
export function buildMatchSheets(
  items: ContentItem[],
  direction: MatchDirection,
  order: SheetOrder,
  seed: number,
  rowsPerPage: number = MATCH_ROW_COUNT,
): MatchQuestion[][] {
  // Only letters that actually have both forms can be matched.
  const usable = items.filter(
    (item) => item.primaryLabel.trim() && item.secondaryLabel?.trim(),
  );
  if (usable.length < 2) return [];

  const random = mulberry32(seed);
  const promptOf = (item: ContentItem) =>
    direction === "upper-to-lower"
      ? item.primaryLabel
      : (item.secondaryLabel as string);
  const answerOf = (item: ContentItem) =>
    direction === "upper-to-lower"
      ? (item.secondaryLabel as string)
      : item.primaryLabel;

  const ordered =
    order === "random"
      ? shuffled(usable, random)
      : [...usable].sort((a, b) => a.orderIndex - b.orderIndex);

  const questions: MatchQuestion[] = ordered.map((item) => {
    const answer = answerOf(item);
    // Distractors are always drawn at random — the *order* setting controls
    // which letters are asked, not how hard each question is.
    const distractors = shuffled(
      usable.filter((other) => other.id !== item.id).map(answerOf),
      random,
    ).slice(0, MATCH_LAYOUT.optionCount - 1);

    const illustrated = item.examples.find((example) => example.imageUrl);

    return {
      id: item.id,
      prompt: promptOf(item),
      answer,
      options: shuffled([answer, ...distractors], random),
      picture: illustrated?.imageUrl
        ? { src: illustrated.imageUrl, alt: illustrated.label }
        : null,
    };
  });

  return paginate(questions, rowsPerPage);
}
