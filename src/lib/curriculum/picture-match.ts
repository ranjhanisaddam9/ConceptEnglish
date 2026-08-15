import { itemLabel } from "./display";
import { mulberry32, shuffled } from "./sheet-order";
import type { ContentItem, LabelMode } from "./types";
import { PAGE, randomInk } from "./worksheet";

/**
 * "Match the picture to its letter" worksheet.
 *
 * Pictures run down the left of the page and letters down the right, in a
 * different order, with empty space between for the child to rule lines
 * across.
 */

/**
 * Which end of the word the letter comes from.
 *
 *   starting — the picture's word begins with the letter (Lion → L)
 *   ending   — the picture's word ends with it (Nest → T)
 */
export const CONSONANT_POSITIONS = ["starting", "ending"] as const;

export type ConsonantPosition = (typeof CONSONANT_POSITIONS)[number];

export const CONSONANT_POSITION_OPTIONS = [
  {
    value: "starting" as const,
    label: "Starting",
    description: "Match each picture to the letter its word begins with",
  },
  {
    value: "ending" as const,
    label: "Ending",
    description: "Match each picture to the letter its word ends with",
  },
];

/** Millimetres. */
export const PICTURE_MATCH_LAYOUT = {
  /** Square holding the picture. */
  pictureBox: 24,
  /** Square holding the letter. */
  letterBox: 24,
  rowHeight: 26,
  rowGap: 6,
  /** The dot each line is drawn from and to. */
  anchorRadius: 1.6,
} as const;

const ROW_PITCH =
  PICTURE_MATCH_LAYOUT.rowHeight + PICTURE_MATCH_LAYOUT.rowGap;

export const PICTURE_MATCH_ROW_COUNT = Math.floor(
  (PAGE.height - PAGE.margin * 2 - PAGE.headerHeight) / ROW_PITCH,
);

export interface PictureMatchRow {
  id: string;
  picture: { src: string; alt: string };
  /** The letter this picture belongs to — the answer. */
  letter: string;
}

export interface PictureMatchSheet {
  /** Left-hand column, in the order the pictures appear. */
  rows: PictureMatchRow[];
  /** Right-hand column: the same letters in a different order. */
  letters: Array<{ text: string; colour: string }>;
}

/**
 * Reorders so nothing keeps its original position.
 *
 * A plain shuffle can leave a letter level with its own picture, which a child
 * could pair off by ruling straight across without reading either.
 */
function deranged<T>(values: T[], random: () => number): T[] {
  if (values.length < 2) return [...values];

  for (let attempt = 0; attempt < 20; attempt += 1) {
    const candidate = shuffled(values, random);
    if (candidate.every((value, index) => value !== values[index])) {
      return candidate;
    }
  }

  // Rotating by one is a derangement by construction.
  return [...values.slice(1), values[0]];
}

/**
 * Letters never asked about as an ending.
 *
 * None of them makes its own consonant sound at the end of a word: 'h' comes
 * as part of "sh" or "ch" (Fish, Watch), 'w' as part of "ow" (Window, Yellow),
 * and a final 'y' is heard as a vowel (X-ray, Key). Asking a child to hear
 * them would teach the wrong thing.
 */
const EXCLUDED_ENDINGS = new Set(["h", "w", "y"]);

/** The last letter of a word, ignoring hyphens and the like. */
function finalLetter(word: string): string | null {
  const letters = word.toLowerCase().match(/[a-z]/g);
  return letters ? letters[letters.length - 1] : null;
}

export interface PictureCandidate {
  id: string;
  picture: { src: string; alt: string };
  /** Lowercase letter this picture answers to. */
  key: string;
}

/** Letters indexed by their lowercase form, for looking a key back up. */
export function lettersByKey(items: ContentItem[]): Map<string, ContentItem> {
  const byLetter = new Map<string, ContentItem>();
  for (const item of items) {
    const key = (item.secondaryLabel || item.primaryLabel).trim().toLowerCase();
    if (key) byLetter.set(key, item);
  }
  return byLetter;
}

/**
 * Picks the pictures for a sheet: one per answer letter, so no letter can be
 * asked about twice.
 *
 * Shared by the matching and writing worksheets, which ask about the same
 * pictures in different ways.
 */
export function selectPictureRows(
  items: ContentItem[],
  group: string,
  position: ConsonantPosition,
  random: () => number,
  rowCount: number,
): PictureCandidate[] {
  const byLetter = lettersByKey(items);
  const candidates: PictureCandidate[] = [];

  for (const item of items) {
    // Only a letter's first picture is ever used — the one shown against that
    // letter on the lesson page and on Unit 1's matching sheet. Drawing on the
    // other example words would put pictures in front of a child that they
    // have not met as that letter's picture.
    const example = item.examples.find(entry => entry.imageUrl);
    if (!example?.imageUrl) continue;

    // Starting: the picture belongs to its own letter. Ending: the picture
    // belongs to whatever letter its word finishes on.
    const key =
      position === "starting"
        ? (item.secondaryLabel || item.primaryLabel).trim().toLowerCase()
        : finalLetter(example.label);
    if (!key) continue;
    if (position === "ending" && EXCLUDED_ENDINGS.has(key)) continue;

    // Only letters carrying the requested tag qualify, so an "ending
    // consonant" sheet never shows a word ending in a vowel.
    if (!byLetter.get(key)?.tags.includes(group)) continue;

    candidates.push({
      id: example.id,
      picture: { src: example.imageUrl, alt: example.label },
      key,
    });
  }

  const byKey = new Map<string, PictureCandidate[]>();
  for (const candidate of candidates) {
    const bucket = byKey.get(candidate.key);
    if (bucket) bucket.push(candidate);
    else byKey.set(candidate.key, [candidate]);
  }

  return shuffled([...byKey.values()], random)
    .slice(0, rowCount)
    .map((bucket) => bucket[Math.floor(random() * bucket.length)]);
}

export function buildPictureMatchSheet(
  items: ContentItem[],
  group: string,
  position: ConsonantPosition,
  labelMode: LabelMode,
  seed: number,
  rowCount: number = PICTURE_MATCH_ROW_COUNT,
): PictureMatchSheet {
  const random = mulberry32(seed);
  const byLetter = lettersByKey(items);
  const chosen = selectPictureRows(items, group, position, random, rowCount);

  if (chosen.length === 0) return { rows: [], letters: [] };

  const rows: PictureMatchRow[] = chosen.map((candidate) => {
    const item = byLetter.get(candidate.key);
    return {
      id: candidate.id,
      picture: candidate.picture,
      letter: item
        ? itemLabel(item, labelMode)
        : candidate.key.toUpperCase(),
    };
  });

  return {
    rows,
    letters: deranged(
      rows.map((row) => row.letter),
      random,
    ).map((text) => ({ text, colour: randomInk(random) })),
  };
}
