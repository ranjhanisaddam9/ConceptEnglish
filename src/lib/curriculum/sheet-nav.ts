import type { Unit } from "./types";

/**
 * Which worksheets a unit offers, and what to call them.
 *
 * Lifted out of the side panel so the dashboard can count a unit's sheets
 * without restating the rules. One definition means a card that promises
 * "6 sheets" and a panel that lists six can never disagree.
 */

/** All a caller needs to know to work out a unit's sheets. */
export type UnitNav = Pick<
  Unit,
  "id" | "title" | "slug" | "kind" | "letterGroup" | "patternSet"
>;

export interface SheetLink {
  href: string;
  label: string;
}

/** "Vowels" or "Consonants", for naming a sheet after what it drills. */
function letterGroupNoun(group: Unit["letterGroup"]) {
  return group === "vowel" ? "Vowels" : "Consonants";
}

/**
 * Keyed on what the unit teaches rather than on its slug, so a future letters
 * or phonics unit picks up the same set without touching this file.
 */
export function worksheetsFor(unit: UnitNav, unitHref: string): SheetLink[] {
  switch (unit.kind) {
    case "letters":
      return [
        { href: `${unitHref}/worksheet`, label: "W1: Tracing" },
        { href: `${unitHref}/worksheet/match`, label: "W2: Match letters" },
        { href: `${unitHref}/worksheet/missing`, label: "W3: Missing Letters" },
      ];
    // A pattern unit teaches words rather than letters, so it offers the
    // letter-identifying sheet only when it says which letters it is about.
    case "word_patterns": {
      // The letter-identifying sheet only makes sense where the unit says
      // which letters it is about; the pattern sheets suit any of them.
      const sheets = unit.letterGroup
        ? [
            {
              href: `${unitHref}/worksheet/identify`,
              label: `Identify ${letterGroupNoun(unit.letterGroup)}`,
            },
          ]
        : [];
      // A word-family unit matches pictures to whole spellings, and gets a
      // sheet asking only for the vowel.
      const isFamilyUnit = unit.patternSet === "short_vowels";
      const rest = [
        // Identifying the vowel comes before matching a whole spelling.
        // A word-family unit matches pictures to vowels; matching them to a
        // whole spelling is what the writing sheet already asks for.
        ...(isFamilyUnit
          ? [{ href: `${unitHref}/worksheet/match-vowel`, label: "Match Vowel" }]
          : [
              {
                href: `${unitHref}/worksheet/pattern-match`,
                label: "Match pictures",
              },
            ]),
        { href: `${unitHref}/worksheet/choose`, label: "Choose the letters" },
        {
          href: `${unitHref}/worksheet/pattern-write`,
          label: "Write the letters",
        },
        { href: `${unitHref}/worksheet/fluency`, label: "Read the words" },
      ];

      return [...sheets, ...rest].map((sheet, index) => ({
        ...sheet,
        label: `W${index + 1}: ${sheet.label}`,
      }));
    }
    case "phonics": {
      // A phonics unit names its sheets after the letters it covers, so a
      // vowels unit reads "Matching Vowels", not "Matching Consonants".
      const isVowels = unit.letterGroup === "vowel";
      const noun = letterGroupNoun(unit.letterGroup);
      return [
        {
          href: `${unitHref}/worksheet/identify`,
          label: `W1: Identify ${noun}`,
        },
        // The picture sheets rest on words *beginning* or *ending* with the
        // letter, which only works for consonants — a vowel rarely sits at
        // either end of a word.
        ...(isVowels
          ? []
          : [
              {
                href: `${unitHref}/worksheet/picture-match`,
                label: `W2: Matching ${noun}`,
              },
              {
                href: `${unitHref}/worksheet/write-consonants`,
                label: `W3: Writing ${noun}`,
              },
            ]),
      ];
    }
    default:
      return [];
  }
}

/** "Unit 1 · Letters" reads as "Unit 1: Letters" in the panel. */
export function navUnitName(title: string) {
  const [number, ...rest] = title.split("·");
  return rest.length > 0 ? `${number.trim()}: ${rest.join("·").trim()}` : title;
}
