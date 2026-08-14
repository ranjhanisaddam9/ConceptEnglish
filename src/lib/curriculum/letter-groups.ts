/**
 * Vowels and consonants.
 *
 * Expressed as item tags, the same mechanism the writing zones use, so the
 * navigator can filter on either without either concept being hard-wired into
 * a component.
 */

export const LETTER_GROUPS = ["vowel", "consonant"] as const;

export type LetterGroup = (typeof LETTER_GROUPS)[number];

const VOWELS = ["a", "e", "i", "o", "u"];

export function letterGroupFor(letter: string): LetterGroup {
  return VOWELS.includes(letter.trim().toLowerCase()) ? "vowel" : "consonant";
}

export const LETTER_GROUP_FILTER_OPTIONS = [
  { value: "all" as const, label: "All", description: "Show every letter" },
  {
    value: "vowel" as const,
    label: "Vowels",
    description: "Show only the vowels: a, e, i, o and u",
  },
  {
    value: "consonant" as const,
    label: "Consonants",
    description: "Show only the consonants",
  },
];

export type LetterGroupFilter =
  (typeof LETTER_GROUP_FILTER_OPTIONS)[number]["value"];

/** Wording for the label shown beside the big letter. */
export function letterGroupLabel(group: LetterGroup): string {
  return group === "vowel" ? "Vowel" : "Consonant";
}
