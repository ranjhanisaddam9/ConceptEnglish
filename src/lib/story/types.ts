/**
 * Story characters and the shape of a story.
 *
 * Kept free of React so the placeholder rules below can be reasoned about —
 * and tested — without rendering anything.
 */

export const GENDERS = ["male", "female"] as const;

export type Gender = (typeof GENDERS)[number];

export const DEFAULT_GENDER: Gender = "male";

export function isGender(value: unknown): value is Gender {
  return typeof value === "string" && (GENDERS as readonly string[]).includes(value);
}

export const GENDER_OPTIONS = [
  {
    value: "male" as const,
    label: "Boy",
    description: "This character is a boy — he, him, his",
  },
  {
    value: "female" as const,
    label: "Girl",
    description: "This character is a girl — she, her, hers",
  },
];

export interface StoryCharacter {
  /** First name only. Blank until the teacher fills it in. */
  name: string;
  gender: Gender;
}

/** The pair every story is told about. */
export interface StoryCast {
  c1: StoryCharacter;
  c2: StoryCharacter;
}

/**
 * Stand-in names, used until the settings page has real ones.
 *
 * A story with `{c1_name}` still showing would read as broken to a child, so
 * the reader always has a name to put there.
 */
export const FALLBACK_NAMES = { c1: "Sam", c2: "Ada" } as const;

export interface Story {
  /** 1-10. Also names the artwork, e.g. 3 -> Story3_MF.jpg. */
  number: number;
  title: string;
  /** e.g. "Sci-Fi". Shown as a badge, kept out of the title so the heading
   *  and the side panel stay short. */
  genre?: string;
  /** The one-line lesson shown under the title. */
  moral: string;
  /**
   * The story, grouped into the blocks it is meant to be read in.
   *
   * Each inner array is one stanza — a run of lines that sit together on the
   * page with a break after it. Story 1 is three lines, three lines and one, so
   * the shape of the telling is data rather than something the reader has to
   * guess at from punctuation.
   *
   * Empty for a story that has not been written yet, which is how the index
   * knows to show it as still to come rather than linking to a blank page.
   */
  stanzas: string[][];
}
