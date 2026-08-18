/**
 * Pattern units: the ways a unit can cut its word list.
 *
 * Units 4, 5 and 6 are the same page — browse a *pattern*, see the words that
 * fit it — differing only in what the patterns are. Rather than three near
 * identical components, a unit names its pattern set here and the one browser
 * reads it.
 *
 * A set is a control and the cuts it offers. Most sets cut the same words two
 * or three ways, so every word stays reachable whichever way round a class is
 * working. The short-vowel set is different: its control picks a *vowel*, and
 * the navigator beneath then holds that vowel's word families.
 */

export const PATTERN_SET_IDS = [
  "short_vowels",
  "vowel_teams",
  "blends",
  "digraphs",
  "r_controlled",
] as const;

export type PatternSetId = (typeof PATTERN_SET_IDS)[number];

/** The five short vowels, in the order they are taught. */
export const SHORT_VOWELS = ["a", "e", "i", "o", "u"] as const;

export interface PatternOption {
  /** Also the tag its items carry, which is how the browser filters. */
  value: string;
  label: string;
  description: string;
  /** Heading above the words, given the selected pattern's label. */
  heading: (label: string) => string;
}

export interface PatternSet {
  /** Small caption above the control. */
  caption: string;
  size?: "sm" | "lg";
  /**
   * Animate the navigator in when the control changes, one item after the
   * next. Worth it where the control genuinely reveals a new set — less so
   * where it just re-cuts the same words.
   */
  reveal?: boolean;
  options: PatternOption[];
}

export const PATTERN_SETS: Record<PatternSetId, PatternSet> = {
  // The one set whose control is not a cut of the words but a filter on them:
  // pick a vowel, and its families appear below.
  short_vowels: {
    caption: "Vowel",
    size: "sm",
    reveal: true,
    options: [
      ...SHORT_VOWELS.map((vowel) => ({
        value: `vowel-${vowel}`,
        label: vowel,
        description: `Word families with a short ${vowel}`,
        heading: (label: string) => `Words in the ${label} family`,
      })),
      // A sixth button, because the oo of "book" is a short vowel sound but is
      // not short u — "book" and "cup" do not rhyme.
      {
        value: "vowel-oo",
        label: "oo",
        description: "Word families with the short oo of book",
        heading: (label: string) => `Words in the ${label} family`,
      },
    ],
  },
  // Three separate lessons rather than two cuts of one list: a silent e, a
  // pair of vowels holding one sound, and a pair that glides between two.
  vowel_teams: {
    caption: "Pattern",
    options: [
    {
      value: "long_vowel",
      label: "Long Vowel",
      description:
        "The vowel says its name — two vowels together, or a silent e at the end",
      heading: (label) => `Words with ${label}`,
    },
    {
      value: "diphthong",
      label: "Diphthong",
      description: "Two vowels gliding from one sound into another",
      heading: (label) => `Words with ${label}`,
    },
    // y spells two sounds, so its groups are named after a word a child
    // already knows rather than after the letter.
    {
      value: "y_vowel",
      label: "y",
      description: "y at the end of a word, doing a vowel's job",
      heading: (label) => `Words where y sounds as it does in ${label}`,
    },
    ],
  },
  blends: {
    // Not "Pattern": these cut the same blends three ways rather than naming
    // three patterns, and two of the three are positions.
    caption: "Group by",
    options: [
    {
      value: "blend",
      label: "At the start",
      description: "Group words by the two letters they open with",
      heading: (label) => `Words starting with ${label}`,
    },
    {
      value: "final",
      label: "At the end",
      description: "Two consonants running together after the vowel",
      heading: (label) => `Words ending with ${label}`,
    },
    {
      value: "letter",
      label: "Letter",
      description: "Gather every opening blend that shares a first consonant",
      heading: (label) => `Blends starting with ${label}`,
    },
    ],
  },
  // One cut only: a digraph makes the same sound wherever it falls, so "ship"
  // and "fish" belong together. A set with a single option renders no toggle.
  digraphs: {
    caption: "Pattern",
    options: [
      {
        value: "digraph",
        label: "Digraph",
        description: "Two consonants making one sound",
        heading: (label) => `Words with ${label}`,
      },
    ],
  },
  // One cut: er, ir and ur say the same sound, and seeing all five together is
  // the point of the unit.
  r_controlled: {
    caption: "Pattern",
    options: [
      {
        value: "r_controlled",
        label: "Vowel + r",
        description: "An r after the vowel changes the sound it makes",
        heading: (label) => `Words with ${label}`,
      },
    ],
  },
};
