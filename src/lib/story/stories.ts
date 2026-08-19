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
 * A story is readable as soon as it has lines. Its four pictures may not have
 * arrived yet — the reader falls back to a plain panel for a picture it cannot
 * load, so a script can go in before the artwork does and starts showing it
 * the moment the files land in public/story.
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
  {
    number: 3,
    title: "The Mud Hut",
    genre: "Village Life",
    moral: "Cleanliness & Responsibility",
    stanzas: [
      [
        "{c1_name} and {c2_name} ran out in wet mud.",
        "{C1_pos_adj} box fell in the muck and got bad.",
        "\"Our hut is not neat,\" {c1_name} said.",
      ],
      [
        "{c2_name} got a big mop and a dry rag.",
        "{C1_sub} got a tub of hot suds to rub the hut.",
        "Now the hut is neat, dim, and dry.",
      ],
      ["It is fun to keep the home tidy and new."],
    ],
  },
  {
    number: 4,
    title: "The Sea Pup",
    genre: "Ocean Adventure",
    moral: "Kindness to Animals",
    stanzas: [
      [
        "{c1_name} saw a pup stuck in an old net.",
        "{c2_name} ran fast to the wet sand to help.",
        "{C2_sub} did pat the pup on {c2_pos_adj} wet top.",
      ],
      [
        "{c1_name} did cut the net off {c1_pos_adj} fin.",
        "The pup did hop and dip in the blue sea.",
        "{C2_sub} did wave to the pup as it swam.",
      ],
      ["To be kind to all is the best joy."],
    ],
  },
  {
    number: 5,
    title: "The Hot Dune",
    genre: "Desert Life",
    moral: "Patience & Gratitude",
    stanzas: [
      [
        "The sun was hot on the red sand dune.",
        "{c2_name} felt {c2_pos_adj} lip get dry and hot.",
        "\"We must wait for the cool sky,\" {c1_name} said.",
      ],
      [
        "The two sat on a mat by a big rock.",
        "The cool fog did roll in at six.",
        "{c1_name} gave {c2_obj} a clay jug to sip.",
      ],
      ["It pays to wait and have calm in you."],
    ],
  },
  {
    number: 6,
    title: "The Magic Gem",
    genre: "Fantasy",
    moral: "Justice & Fair Sharing",
    stanzas: [
      [
        "{c1_name} saw a red gem glow in a dark pit.",
        "{c2_name} got a long rod to tap it out.",
        "\"Do not keep all of it,\" {c1_name} did say.",
      ],
      [
        "{c2_name} cut the big gem in two bits.",
        "One bit is for {c1_obj} and one for {c2_obj}.",
        "It gave a warm, safe glow to both.",
      ],
      ["A fair plan will win the day for all."],
    ],
  },
  {
    number: 7,
    title: "The Dark Den",
    genre: "Adventure",
    moral: "Courage & Bravery",
    stanzas: [
      [
        "A dark den lay at the top of the hill.",
        "{c1_name} felt shy to go in the dark.",
        "{c2_name} lit a wax dip to shed light.",
      ],
      [
        "\"Take my hand,\" {c2_name} said to {c1_obj}.",
        "A tiny bat did fly out of the den.",
        "{C1_sub} was bold and did not run off.",
      ],
      ["Be brave and you can win any test."],
    ],
  },
  {
    number: 8,
    title: "The Red Jam Jar",
    genre: "Kitchen Life",
    moral: "Self-Control & Discipline",
    stanzas: [
      [
        "A jar of red jam sat on the low bar.",
        "{c1_name} did lick {c1_pos_adj} lip to eat it.",
        "\"Wait for mom to ask,\" {c2_name} said.",
      ],
      [
        "{c1_name} put {c1_pos_adj} hand back down.",
        "The bun was cut in two for the meal.",
        "Mom gave each of them a big dip of jam.",
      ],
      ["Good self rule will lead to sweet joy."],
    ],
  },
  {
    number: 9,
    title: "Kind Words",
    genre: "Schoolyard",
    moral: "Respect & Avoiding Backbiting",
    stanzas: [
      [
        "A new boy, Dan, sat all by his cot.",
        "A sly lad ran to say bad talk of him.",
        "\"Do not mock him,\" {c1_name} did say.",
      ],
      [
        "{c2_name} went to Dan and sat by his side.",
        "{C2_sub} gave Dan {c2_pos_adj} red toy bus.",
        "{c1_name} ran to join in the fun game.",
      ],
      ["Say only good, or say no word at all."],
    ],
  },
  {
    number: 10,
    title: "The Robot Pet",
    genre: "Sci-Fi",
    moral: "Responsibility & Care",
    stanzas: [
      [
        "{c1_name} got a toy bot in a big box.",
        "The bot can run, hop, and wag its tip.",
        "\"It must plug in to get fuel,\" {c2_name} said.",
      ],
      [
        "{c1_name} did plug the bot to the hub.",
        "{C2_sub} put it in its cozy dry cot.",
        "The bot did hum and buzz with pure joy.",
      ],
      ["Duty and care make all toys work well."],
    ],
  },
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
