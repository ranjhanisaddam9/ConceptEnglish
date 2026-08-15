import { mulberry32 } from "./sheet-order";
import {
  selectPictureRows,
  type ConsonantPosition,
} from "./picture-match";
import type { ContentItem, LabelMode } from "./types";
import { PAGE, randomInk } from "./worksheet";
import { rulingGeometry } from "./writing";

/**
 * "Write the missing consonant" worksheet.
 *
 * Same pictures as the matching sheet, but instead of choosing a letter from a
 * column the child writes it: the word is spelled out on four-line ruling with
 * the starting or ending consonant left blank.
 */

/** Millimetres. */
export const WRITING_LAYOUT = {
  pictureBox: 22,
  /** Gap between the picture and the ruled word. */
  gap: 8,
  rowGap: 6,
  /** Height of a row — the picture is the taller of the two halves. */
  rowHeight: 22,
  /** Letter size for the spelled-out word. */
  letterSize: 12,
  /** Each character sits in its own slot, so the blank lines up. */
  slotWidth: 9,
  /** The blank is wider than a letter — a child's first attempt is big. */
  blankWidth: 16,
} as const;

const ROW_PITCH = WRITING_LAYOUT.rowHeight + WRITING_LAYOUT.rowGap;

export const WRITING_ROW_COUNT = Math.floor(
  (PAGE.height - PAGE.margin * 2 - PAGE.headerHeight) / ROW_PITCH,
);

/** Ruling for the word, sized to the letters written on it. */
export const WRITING_RULING = rulingGeometry(WRITING_LAYOUT.letterSize);

export interface WritingSlot {
  character: string;
  /** Centre of the slot, in millimetres from the start of the word. */
  centre: number;
  width: number;
  isBlank: boolean;
}

export interface WritingRow {
  id: string;
  picture: { src: string; alt: string };
  slots: WritingSlot[];
  /** Total width of the word, so the ruling stops where the word does. */
  width: number;
  /** One colour for the whole word, so it still reads as a word. */
  colour: string;
}

function caseWord(word: string, labelMode: LabelMode): string {
  switch (labelMode) {
    case "primary":
      return word.toUpperCase();
    case "secondary":
      return word.toLowerCase();
    case "both":
      return word;
  }
}

/** Index of the first or last actual letter, skipping hyphens and spaces. */
function targetIndex(characters: string[], position: ConsonantPosition): number {
  const isLetter = (character: string) => /[a-z]/i.test(character);

  if (position === "starting") {
    return characters.findIndex(isLetter);
  }
  for (let i = characters.length - 1; i >= 0; i -= 1) {
    if (isLetter(characters[i])) return i;
  }
  return -1;
}

export function buildWritingSheet(
  items: ContentItem[],
  group: string,
  position: ConsonantPosition,
  labelMode: LabelMode,
  seed: number,
  rowCount: number = WRITING_ROW_COUNT,
): WritingRow[] {
  const random = mulberry32(seed);
  const chosen = selectPictureRows(items, group, position, random, rowCount);

  return chosen
    .map((candidate) => {
      const characters = [...caseWord(candidate.picture.alt, labelMode)];
      const blankIndex = targetIndex(characters, position);
      if (blankIndex < 0) return null;

      // Lay the word out slot by slot so the ruling can stop exactly where the
      // word does, and the blank can be wider than a letter.
      let offset = 0;
      const slots: WritingSlot[] = characters.map((character, index) => {
        const isBlank = index === blankIndex;
        const width = isBlank
          ? WRITING_LAYOUT.blankWidth
          : WRITING_LAYOUT.slotWidth;
        const slot = { character, centre: offset + width / 2, width, isBlank };
        offset += width;
        return slot;
      });

      return {
        id: candidate.id,
        picture: candidate.picture,
        slots,
        width: offset,
        colour: randomInk(random),
      };
    })
    .filter((row): row is WritingRow => row !== null);
}
