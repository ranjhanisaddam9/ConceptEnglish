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
import {
  letterGroupFor,
  type LetterGroup,
} from "@/lib/curriculum/letter-groups";
import {
  isShortVowelWord,
  parseCvc,
  type CvcWord,
} from "@/lib/curriculum/word-bank";
import { writingZoneFor } from "@/lib/curriculum/writing";

import { picturePath } from "./artwork";
import {
  BLEND_GROUPS,
  CVC_WORDS,
  DIGRAPH_GROUPS,
  FINAL_BLEND_GROUPS,
  R_CONTROLLED_GROUPS,
  SHORT_OO_WORDS,
  VOWEL_TEAM_CATEGORIES,
  VOWEL_TEAM_WORDS,
} from "./word-bank";

type LetterEntry = {
  upper: string;
  lower: string;
  /**
   * Example words. Each one needs a matching file in the artwork folder.
   *
   * Every word must open with the sound the letter makes, not merely with the
   * letter: "ice" begins with the letter i but says /aɪ/, which teaches the
   * opposite of what an i card is for.
   */
  examples: string[];
  /**
   * Set when the letter's sound is taught at the end of a word instead.
   *
   * Only x needs this. No English word begins with /ks/ — "xylophone" says
   * /z/, "X-ray" is the letter's name — so x is taught through box, fox, six.
   */
  soundAtEnd?: boolean;
};

const LETTERS: LetterEntry[] = [
  { upper: "A", lower: "a", examples: ["Apple", "Ant", "Ambulance"] },
  { upper: "B", lower: "b", examples: ["Ball", "Bat", "Banana"] },
  { upper: "C", lower: "c", examples: ["Cat", "Car", "Cake"] },
  { upper: "D", lower: "d", examples: ["Dog", "Duck", "Drum"] },
  { upper: "E", lower: "e", examples: ["Egg", "Elephant", "Envelope"] },
  { upper: "F", lower: "f", examples: ["Fish", "Frog", "Flower"] },
  { upper: "G", lower: "g", examples: ["Goat", "Grapes", "Guitar"] },
  { upper: "H", lower: "h", examples: ["Hat", "Horse", "House"] },
  { upper: "I", lower: "i", examples: ["Igloo", "Insect", "Ink"] },
  { upper: "J", lower: "j", examples: ["Jam", "Jug", "Jellyfish"] },
  { upper: "K", lower: "k", examples: ["Kite", "Key", "Kangaroo"] },
  { upper: "L", lower: "l", examples: ["Lion", "Leaf", "Lamb"] },
  { upper: "M", lower: "m", examples: ["Mango", "Mouse", "Milk"] },
  { upper: "N", lower: "n", examples: ["Nest", "Nose", "Net"] },
  { upper: "O", lower: "o", examples: ["Octopus", "Orange", "Otter"] },
  { upper: "P", lower: "p", examples: ["Parrot", "Pencil", "Panda"] },
  { upper: "Q", lower: "q", examples: ["Queen", "Quilt", "Quill"] },
  { upper: "R", lower: "r", examples: ["Rabbit", "Rose", "Ring"] },
  { upper: "S", lower: "s", examples: ["Sun", "Star", "Snake"] },
  { upper: "T", lower: "t", examples: ["Tree", "Tiger", "Train"] },
  { upper: "U", lower: "u", examples: ["Umbrella", "Up", "Under"] },
  { upper: "V", lower: "v", examples: ["Van", "Violin", "Volcano"] },
  { upper: "W", lower: "w", examples: ["Watch", "Web", "Window"] },
  {
    upper: "X",
    lower: "x",
    examples: ["Box", "Fox", "Six"],
    soundAtEnd: true,
  },
  { upper: "Y", lower: "y", examples: ["Yacht", "Yo-yo", "Yolk"] },
  { upper: "Z", lower: "z", examples: ["Zebra", "Zip", "Zigzag"] },
];

/**
 * Builds a unit's letters.
 *
 * Every unit draws on the same 26 letters defined above — Unit 1 for
 * recognising and writing all of them, Unit 2 for consonant sounds, Unit 3 for
 * vowels — so they are written once and filtered per unit here.
 */
function buildLetterItems(
  unitId: string,
  group?: LetterGroup,
): ContentItem[] {
  return LETTERS.filter(
    (letter) => !group || letterGroupFor(letter.lower) === group,
  ).map((letter, index) => {
  const itemId = `${unitId}-${letter.lower}`;

  return {
    id: itemId,
    unitId,
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
    // the letter is a vowel. Both drive filters on the letter page. The third
    // tag, when present, changes the heading above the example words.
    tags: [
      writingZoneFor(letter.lower),
      letterGroupFor(letter.lower),
      ...(letter.soundAtEnd ? ["ending-sound"] : []),
    ],
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
}

/**
 * One item of a pattern unit: the pattern itself, and the words that fit it.
 *
 * The pattern is carried as a tag so a unit can hold two cuts of the same word
 * list at once and the page can switch between them by filtering — the same
 * mechanism Unit 1 uses for writing zones.
 */
function buildPatternItem(
  unitId: string,
  pattern: string,
  key: string,
  label: string,
  orderIndex: number,
  words: string[],
  /** What the sound button says. Defaults to the label. */
  speechText = label,
  /**
   * Long form of the pattern, shown on the card where the navigator's label is
   * shorthand — "VCe" on the button, "Vowel + Consonant + e" on the card.
   */
  expanded?: string,
): ContentItem {
  const itemId = `${unitId}-${pattern}-${key}`;

  return {
    id: itemId,
    unitId,
    primaryLabel: label,
    secondaryLabel: expanded ?? null,
    illustrationUrl: null,
    audioUrl: null,
    speechText,
    orderIndex,
    tags: [pattern],
    examples: words.map((word, index) => ({
      id: `${itemId}-${index + 1}`,
      itemId,
      label: word,
      imageUrl: picturePath(word),
      audioUrl: null,
      // Without this the button would say "-ab for cab".
      speechText: word,
      orderIndex: index + 1,
    })),
  };
}

/**
 * Fewest words a family needs to earn a place in the unit.
 *
 * A family of one cannot do the thing a family is for — swap the opening sound
 * and read a new word — so "-eb" with only "web" in it is a word card wearing
 * a family's clothes. Those words keep their place in the word bank.
 */
const MIN_FAMILY_SIZE = 2;

function countInFamily(words: CvcWord[], family: string): number {
  return words.filter((word) => word.family === family).length;
}

/**
 * The short-vowel unit: one item per word family.
 *
 * Each family is tagged with its vowel, which is what the unit's control picks
 * — choose "a" and the -ab, -ad, -ag … families appear. A family belongs to
 * exactly one vowel, since the vowel is the first letter of the rime.
 */
function buildCvcItems(unitId: string): ContentItem[] {
  const words = CVC_WORDS.map(parseCvc).filter(
    (word): word is CvcWord => word !== null,
  );

  const families = [...new Set(words.map((word) => word.family))]
    .filter((family) => countInFamily(words, family) >= MIN_FAMILY_SIZE)
    .sort();

  const cvcItems = families.map((family, index) =>
    buildPatternItem(
      unitId,
      `vowel-${family[0]}`,
      family,
      `-${family}`,
      index + 1,
      words
        .filter((word) => word.family === family)
        .sort((a, b) => a.start.localeCompare(b.start))
        .map((word) => word.word),
      family,
    ),
  );

  // The short oo of "book" joins them under a button of its own. Its words are
  // four letters rather than three, so they carry their family rather than
  // having it parsed out.
  const ooFamilies = [...new Set(SHORT_OO_WORDS.map((entry) => entry.family))]
    .filter(
      (family) =>
        SHORT_OO_WORDS.filter((entry) => entry.family === family).length >=
        MIN_FAMILY_SIZE,
    )
    .sort();

  const ooItems = ooFamilies.map((family, index) =>
    buildPatternItem(
      unitId,
      "vowel-oo",
      family,
      `-${family}`,
      index + 1,
      SHORT_OO_WORDS.filter((entry) => entry.family === family)
        .map((entry) => entry.word)
        .sort(),
      family,
    ),
  );

  return [...cvcItems, ...ooItems];
}

/** The consonants a word opens with, e.g. "pl" for "plate". */
function openingConsonants(word: string): string {
  return /^[^aeiou]*/.exec(word)?.[0] ?? "";
}

/**
 * Orders the VCe group: by vowel, then by the consonant sitting between the
 * vowel and the silent e, then by the consonant the word opens with.
 *
 * All three legs are read off the word rather than stored, since a VCe word is
 * exactly vowel-consonant-e at its end. Sorting this way gathers the rhyming
 * runs — "cake, lake, rake, snake" then "gate, plate, skate" — which is what
 * makes the pattern visible down the column.
 */
function sortVce(words: string[]): string[] {
  const vowel = (word: string) => "aeiou".indexOf(word.at(-3) ?? "");
  const beforeE = (word: string) => word.at(-2) ?? "";
  return [...words].sort(
    (a, b) =>
      vowel(a) - vowel(b) ||
      beforeE(a).localeCompare(beforeE(b)) ||
      openingConsonants(a).localeCompare(openingConsonants(b)) ||
      a.localeCompare(b),
  );
}

/**
 * The vowel-teams unit: each category holding its own patterns.
 *
 * Unlike the other pattern units these are not cuts of one list — a word
 * belongs to one pattern only — so the toggle picks a lesson rather than a
 * viewpoint.
 */
function buildVowelTeamItems(unitId: string): ContentItem[] {
  return VOWEL_TEAM_CATEGORIES.flatMap((category) => {
    const words = VOWEL_TEAM_WORDS.filter((word) => word.category === category);
    // Source order is the teaching order: a, e, i, o, u then ai, ay, ea …
    const patterns = [...new Set(words.map((word) => word.pattern))];

    return patterns.map((pattern, index) => {
      const members = words
        .filter((word) => word.pattern === pattern)
        .map((word) => word.word);

      return buildPatternItem(
        unitId,
        category,
        pattern,
        pattern,
        index + 1,
        pattern === "VCe" ? sortVce(members) : [...members].sort(),
        // "VCe" spelled out is meaningless aloud; the rule has a name.
        pattern === "VCe" ? "magic e" : pattern,
        pattern === "VCe" ? "Vowel + Consonant + e" : undefined,
      );
    });
  });
}

/**
 * The blends unit: one item per blend, then one per consonant those blends
 * open with.
 *
 * The second cut is what a class working through "b" needs — bl and br
 * together — rather than meeting them a fortnight apart.
 */
/** Longest word the blends unit will show. */
const MAX_BLEND_WORD_LENGTH = 5;

/**
 * The words this unit teaches a blend with.
 *
 * The lesson is the two consonants at the front, so the vowel behind them
 * stays one a child can already read: short only, and nothing long enough to
 * become a decoding exercise in itself.
 *
 * Magic-e words are excluded even though they read cleanly to an adult —
 * "smile" and "plane" are taught in the vowel-teams unit, which comes after
 * this one, so a child meeting them here has not been given the rule yet.
 *
 * Shortest first, so each blend opens with its easiest word.
 */
function blendWordsFor(words: string[]): string[] {
  return words
    .filter(
      (word) =>
        word.length <= MAX_BLEND_WORD_LENGTH && isShortVowelWord(word),
    )
    .sort((a, b) => a.length - b.length || a.localeCompare(b));
}

function buildBlendItems(unitId: string): ContentItem[] {
  const blends = [...BLEND_GROUPS].sort((a, b) =>
    a.blend.localeCompare(b.blend),
  );

  const blendItems = blends.map((group, index) =>
    buildPatternItem(
      unitId,
      "blend",
      group.blend,
      group.blend,
      index + 1,
      blendWordsFor(group.words),
    ),
  );

  const finalItems = FINAL_BLEND_GROUPS.map((group, index) =>
    buildPatternItem(
      unitId,
      "final",
      group.blend,
      group.blend,
      index + 1,
      blendWordsFor(group.words),
    ),
  );

  const letters = [...new Set(blends.map((group) => group.blend[0]))].sort();

  const letterItems = letters.map((letter, index) =>
    buildPatternItem(
      unitId,
      "letter",
      letter,
      letter,
      index + 1,
      blends
        .filter((group) => group.blend[0] === letter)
        .flatMap((group) => blendWordsFor(group.words)),
    ),
  );

  return [...blendItems, ...finalItems, ...letterItems];
}

/** The r-controlled unit: one item per vowel-plus-r pair. */
function buildRControlledItems(unitId: string): ContentItem[] {
  return R_CONTROLLED_GROUPS.map((group, index) =>
    buildPatternItem(
      unitId,
      "r_controlled",
      group.pattern,
      group.pattern,
      index + 1,
      [...group.words].sort((a, b) => a.length - b.length || a.localeCompare(b)),
    ),
  );
}

/**
 * The digraphs unit: one item per pair, wherever in the word it falls.
 *
 * The word bank keeps its start/end split — that is a reference list, and
 * where a digraph sits is worth seeing there. Here they are merged, because a
 * digraph makes the same sound at either end and a child meeting "sh" should
 * meet "ship" and "fish" in one sitting.
 */
/**
 * Longest word this unit will show.
 *
 * The unit is about hearing one new sound, so the word around it stays short
 * enough to decode in a breath. Applied here rather than in the word bank —
 * the bank is a reference and "cherry" and "chicken" belong in it.
 */
const MAX_DIGRAPH_WORD_LENGTH = 5;

function buildDigraphItems(unitId: string): ContentItem[] {
  // Source order is the teaching order: the pairs that can open a word first
  // (ch, sh, th, wh), then the three that only ever close one (ck, ng, nk).
  // Alphabetical would bury wh at the end and lift ck above sh.
  const digraphs = [...new Set(DIGRAPH_GROUPS.map((group) => group.digraph))];

  return digraphs.map((digraph, index) =>
    buildPatternItem(unitId, "digraph", digraph, digraph, index + 1, [
      // A Set keeps insertion order, so the start words stay in front.
      ...new Set(
        DIGRAPH_GROUPS.filter((group) => group.digraph === digraph)
          // Words opening with the pair come before words closing with it.
          .sort(
            (a, b) =>
              Number(a.position === "end") - Number(b.position === "end"),
          )
          .flatMap((group) =>
            group.words
              .filter((word) => word.length <= MAX_DIGRAPH_WORD_LENGTH)
              // Shortest first, so each group opens with its easiest word.
              .sort((a, b) => a.length - b.length || a.localeCompare(b)),
          ),
      ),
    ]),
  );
}

export const CURRICULUM: UnitWithItems[] = [
  {
    id: "unit-1",
    title: "Unit 1 · Letters",
    slug: "unit-1",
    stage: "Kindergarten",
    kind: "letters",
    description:
      "Where reading starts. Every letter, the sound it makes, and three words that begin with it.",
    orderIndex: 1,
    isPublished: true,
    items: buildLetterItems("unit-1"),
  },
  {
    id: "unit-2",
    title: "Unit 2 · Consonants",
    slug: "unit-2",
    stage: "Kindergarten",
    kind: "phonics",
    letterGroup: "consonant",
    description:
      "The twenty-one consonants on their own. A check on what Unit 1 taught, rather than new ground.",
    orderIndex: 2,
    isPublished: true,
    items: buildLetterItems("unit-2", "consonant"),
  },
  {
    id: "unit-3",
    title: "Unit 3 · Vowels",
    slug: "unit-3",
    stage: "Kindergarten",
    kind: "word_patterns",
    patternSet: "short_vowels",
    // Names the group of letters the unit is about, which is what its
    // letter-identifying worksheet targets.
    letterGroup: "vowel",
    description:
      "The first real reading. Pick a vowel and see the families it builds — change the front sound, read a new word.",
    orderIndex: 3,
    isPublished: true,
    items: buildCvcItems("unit-3"),
  },
  {
    id: "unit-4",
    title: "Unit 4 · Consonant Digraph",
    slug: "unit-4",
    stage: "Kindergarten",
    kind: "word_patterns",
    patternSet: "digraphs",
    description:
      "The first time letters stop saying what they say alone: two consonants, one new sound.",
    orderIndex: 4,
    isPublished: true,
    items: buildDigraphItems("unit-4"),
  },
  {
    id: "unit-5",
    title: "Unit 5 · Consonant Blends",
    slug: "unit-5",
    stage: "Grade 1",
    kind: "word_patterns",
    patternSet: "blends",
    description:
      "Two consonants run together with both sounds still heard — at the start of a word, and at the end.",
    orderIndex: 5,
    isPublished: true,
    items: buildBlendItems("unit-5"),
  },
  {
    id: "unit-6",
    title: "Unit 6 · Vowel Teams",
    slug: "unit-6",
    stage: "Grade 1",
    kind: "word_patterns",
    patternSet: "vowel_teams",
    description:
      "The vowel says its name. A silent e reaching back, two vowels holding one sound, and two that glide.",
    orderIndex: 6,
    isPublished: true,
    items: buildVowelTeamItems("unit-6"),
  },
  {
    id: "unit-7",
    title: "Unit 7 · R-Controlled Vowels",
    slug: "unit-7",
    stage: "Grade 1",
    kind: "word_patterns",
    patternSet: "r_controlled",
    description:
      "The last of the single-syllable patterns. An r after the vowel changes it — neither short nor long.",
    orderIndex: 7,
    isPublished: true,
    items: buildRControlledItems("unit-7"),
  },
];

export function findUnit(slug: string): UnitWithItems | null {
  return CURRICULUM.find((unit) => unit.slug === slug) ?? null;
}
