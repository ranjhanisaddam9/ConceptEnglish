import { mulberry32, shuffled } from "./sheet-order";
import type { ContentItem, LabelMode } from "./types";
import { PAGE, randomInk } from "./worksheet";

/**
 * "Identify the vowels / consonants" worksheet.
 *
 * A grid of letters drawn at random from the whole alphabet; the child rings
 * every letter of the chosen kind.
 */

export const IDENTIFY_TARGETS = ["vowel", "consonant"] as const;

export type IdentifyTarget = (typeof IDENTIFY_TARGETS)[number];

export const IDENTIFY_TARGET_OPTIONS = [
  {
    value: "vowel" as const,
    label: "Vowels",
    description: "Find the vowels among the letters",
  },
  {
    value: "consonant" as const,
    label: "Consonants",
    description: "Find the consonants among the letters",
  },
];

/**
 * Millimetres, except `columns`.
 *
 * Cells are generous because a sheet holds the alphabet once over — 26 letters
 * rather than a full grid — so there is room to spare on the page.
 */
export const IDENTIFY_LAYOUT = {
  columns: 6,
  rowHeight: 38,
  rowGap: 6,
} as const;

const ROW_PITCH = IDENTIFY_LAYOUT.rowHeight + IDENTIFY_LAYOUT.rowGap;

export const IDENTIFY_ROW_COUNT = Math.floor(
  (PAGE.height - PAGE.margin * 2 - PAGE.headerHeight) / ROW_PITCH,
);

/**
 * Letters are printed in mixed colours at mixed angles, so a child has to read
 * the letterform rather than spot a repeating shape in a tidy grid.
 */
const MAX_TILT_DEGREES = 30;

export interface IdentifyCell {
  id: string;
  letter: string;
  isTarget: boolean;
  /** CSS colour for this letter. */
  colour: string;
  /** Rotation in degrees, between -30 and +30. */
  tilt: number;
}

/**
 * Builds one grid of letters.
 *
 * Every letter appears exactly once, so the sheet is the alphabet shuffled.
 * No letter can repeat, which also fixes how many targets a sheet can hold:
 * there are only five vowels, so a vowel hunt has five answers and a consonant
 * hunt has twenty-one.
 */
export function buildIdentifySheet(
  items: ContentItem[],
  target: IdentifyTarget,
  labelMode: LabelMode,
  seed: number,
): IdentifyCell[] {
  const usable = items.filter((item) => item.primaryLabel.trim());
  const hasTarget = usable.some((item) => item.tags.includes(target));
  if (!hasTarget) return [];

  const random = mulberry32(seed);

  const label = (item: ContentItem): string => {
    const upper = item.primaryLabel;
    const lower = item.secondaryLabel?.trim() || upper;

    switch (labelMode) {
      case "primary":
        return upper;
      case "secondary":
        return lower;
      case "both":
        // "Both" mixes the cases across the grid rather than printing "Aa" in
        // every cell — recognising a vowel in either case is the exercise.
        return random() < 0.5 ? upper : lower;
    }
  };

  return shuffled(usable, random).map((item) => ({
    id: item.id,
    letter: label(item),
    isTarget: item.tags.includes(target),
    colour: randomInk(random),
    tilt: Math.round((random() * 2 - 1) * MAX_TILT_DEGREES),
  }));
}

export function identifyInstruction(
  target: IdentifyTarget,
  targetCount: number,
): string {
  const noun = target === "vowel" ? "vowel" : "consonant";
  return `Draw a circle around every ${noun}. There are ${targetCount} to find.`;
}
