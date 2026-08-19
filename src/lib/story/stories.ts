import type { Story } from "./types";

/**
 * The ten stories, in reading order.
 *
 * A story is written once, with placeholders where a name or a pronoun goes,
 * and reads correctly for whichever cast the teacher set in Settings. See
 * `placeholders.ts` for the tokens.
 *
 * Every story runs to seven lines, grouped three, three and one: two beats of
 * three and then the moral on its own. `stanzas` carries that shape, so the
 * page lays a story out from the data rather than guessing at it.
 *
 * Stories with no lines yet are listed but not readable: the index shows them
 * as still to come rather than linking to an empty page, so the shape of the
 * course is visible from the start.
 */
export const STORIES: Story[] = [
  {
    number: 1,
    title: "The Sky Pod",
    genre: "Sci-Fi",
    moral: "Unity & Teamwork",
    stanzas: [
      [
        "{c1_name} sat in a big blue sky pod.",
        "{c2_name} ran fast to get in next to {c1_obj}.",
        "The red cog in the box got in a jam.",
      ],
      [
        "{C2_name} did fix the cog with {c2_pos_adj} pin.",
        "\"You and I can win if we try,\" {c2_sub} said.",
        "The sky pod did fly up, up to the sun.",
      ],
      ["It was {c1_pos_pro} and {c2_pos_pro} to win as one."],
    ],
  },
  {
    number: 2,
    title: "The Red Pen",
    genre: "School Life",
    moral: "Honesty & Telling Truth",
    stanzas: [
      [
        "{c1_name} had a new red pen on the mat.",
        "{c2_name} saw the pen and put it in {c2_pos_adj} bag.",
        "{C2_sub} felt bad in {c2_pos_adj} gut to hide it.",
      ],
      [
        "\"The red pen is in my bag,\" {c2_sub} said.",
        "{C2_sub} gave the pen back to {c1_obj} now.",
        "{c1_name} gave a hug to {c2_obj} with joy.",
      ],
      ["To tell the truth is the best way to be."],
    ],
  },
  { number: 3, title: "", moral: "", stanzas: [] },
  { number: 4, title: "", moral: "", stanzas: [] },
  { number: 5, title: "", moral: "", stanzas: [] },
  { number: 6, title: "", moral: "", stanzas: [] },
  { number: 7, title: "", moral: "", stanzas: [] },
  { number: 8, title: "", moral: "", stanzas: [] },
  { number: 9, title: "", moral: "", stanzas: [] },
  { number: 10, title: "", moral: "", stanzas: [] },
];

/** True once a story has been written and can be opened. */
export function isReadable(story: Story): boolean {
  return story.stanzas.length > 0;
}

export function getStory(storyNumber: number): Story | undefined {
  return STORIES.find((story) => story.number === storyNumber);
}

/**
 * What to call a story in a list.
 *
 * An unwritten story has no title to show, so it is named by its number
 * alone rather than by a placeholder pretending to be one.
 */
export function storyLabel(story: Story): string {
  return story.title
    ? `Story ${story.number}: ${story.title}`
    : `Story ${story.number}`;
}
