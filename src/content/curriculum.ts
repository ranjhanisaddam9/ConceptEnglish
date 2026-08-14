/**
 * The curriculum content, in code.
 *
 * This is the source of truth while the app runs without a database. The
 * shapes are the same domain types the (parked) Supabase data layer produces,
 * so pointing the app at a database later is a configuration change rather
 * than a rewrite — see `src/lib/curriculum/queries.ts`.
 *
 * Adding a unit: add another entry to CURRICULUM.
 * Changing a word: update it here *and* in `scripts/generate-artwork.mjs`,
 *                  then re-run `node scripts/generate-artwork.mjs` so the
 *                  picture exists. A word with no picture file falls back to
 *                  a tinted tile rather than breaking.
 */

import type { ContentItem, UnitWithItems } from "@/lib/curriculum/types";
import { letterGroupFor } from "@/lib/curriculum/letter-groups";
import { writingZoneFor } from "@/lib/curriculum/writing";

import { picturePath } from "./artwork";

type LetterEntry = {
  upper: string;
  lower: string;
  /** Example words. Each one needs a matching file in the artwork folder. */
  examples: string[];
};

const LETTERS: LetterEntry[] = [
  { upper: "A", lower: "a", examples: ["Apple", "Ant", "Aeroplane"] },
  { upper: "B", lower: "b", examples: ["Ball", "Bat", "Banana"] },
  { upper: "C", lower: "c", examples: ["Cat", "Car", "Cake"] },
  { upper: "D", lower: "d", examples: ["Dog", "Duck", "Drum"] },
  { upper: "E", lower: "e", examples: ["Egg", "Elephant", "Envelope"] },
  { upper: "F", lower: "f", examples: ["Fish", "Frog", "Flower"] },
  { upper: "G", lower: "g", examples: ["Goat", "Grapes", "Guitar"] },
  { upper: "H", lower: "h", examples: ["Hat", "Horse", "House"] },
  { upper: "I", lower: "i", examples: ["Icecream", "Insect", "Ice"] },
  { upper: "J", lower: "j", examples: ["Jam", "Jug", "Jellyfish"] },
  { upper: "K", lower: "k", examples: ["Kite", "Key", "Kangaroo"] },
  { upper: "L", lower: "l", examples: ["Lion", "Leaf", "Lamp"] },
  { upper: "M", lower: "m", examples: ["Mango", "Mouse", "Milk"] },
  { upper: "N", lower: "n", examples: ["Nest", "Nose", "Net"] },
  { upper: "O", lower: "o", examples: ["Octopus", "Orange", "Owl"] },
  { upper: "P", lower: "p", examples: ["Parrot", "Pencil", "Panda"] },
  { upper: "Q", lower: "q", examples: ["Queen", "Quilt", "Quill"] },
  { upper: "R", lower: "r", examples: ["Rabbit", "Rose", "Ring"] },
  { upper: "S", lower: "s", examples: ["Sun", "Star", "Snake"] },
  { upper: "T", lower: "t", examples: ["Tree", "Tiger", "Train"] },
  { upper: "U", lower: "u", examples: ["Umbrella", "Uniform", "Utensils"] },
  { upper: "V", lower: "v", examples: ["Van", "Violin", "Volcano"] },
  { upper: "W", lower: "w", examples: ["Watch", "Whale", "Window"] },
  { upper: "X", lower: "x", examples: ["Xylophone", "X-ray", "Fox"] },
  { upper: "Y", lower: "y", examples: ["Yak", "Yo-yo", "Yellow"] },
  { upper: "Z", lower: "z", examples: ["Zebra", "Zip", "Zoo"] },
];

const UNIT_1_ID = "unit-1";

const unit1Items: ContentItem[] = LETTERS.map((letter, index) => {
  const itemId = `${UNIT_1_ID}-${letter.lower}`;

  return {
    id: itemId,
    unitId: UNIT_1_ID,
    primaryLabel: letter.upper,
    secondaryLabel: letter.lower,
    // The letter itself is shown on handwriting ruling rather than as a
    // picture, so no illustration is set here. The field stays available if a
    // decorated letter image is wanted later.
    illustrationUrl: null,
    audioUrl: null,
    speechText: null,
    orderIndex: index + 1,
    // The band of the writing ruling the lowercase form occupies, and whether
    // the letter is a vowel. Both drive filters on the letter page.
    tags: [writingZoneFor(letter.lower), letterGroupFor(letter.lower)],
    examples: letter.examples.map((label, exampleIndex) => ({
      id: `${itemId}-${exampleIndex + 1}`,
      itemId,
      label,
      imageUrl: picturePath(label),
      audioUrl: null,
      speechText: null,
      orderIndex: exampleIndex + 1,
    })),
  };
});

export const CURRICULUM: UnitWithItems[] = [
  {
    id: UNIT_1_ID,
    title: "Unit 1 · Letters",
    slug: "unit-1",
    kind: "letters",
    description:
      "Letter recognition, letter sounds, and three example words for every letter.",
    orderIndex: 1,
    isPublished: true,
    items: unit1Items,
  },
];

export function findUnit(slug: string): UnitWithItems | null {
  return CURRICULUM.find((unit) => unit.slug === slug) ?? null;
}
