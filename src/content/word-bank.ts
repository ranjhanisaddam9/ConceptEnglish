/**
 * Vocabulary for phonics work: CVC words, words opening with a blend, and
 * digraph words.
 *
 * This is a teaching reference rather than sheet content — the lists are here
 * to be read, sorted and picked from when building word-family, blend and
 * digraph exercises later.
 *
 * Curated for Kindergarten to Grade 1. A word earns its place only if a child
 * this age can picture the thing it names, because every worksheet we build
 * from these lists is picture-based. That rules out three kinds of word:
 *
 *   - anything unsuitable for the age group (weapons, gambling, alcohol);
 *   - grammar words with nothing to picture — had, was, yet, put, set;
 *   - abstract or obscure nouns a five-year-old would need explained — bid,
 *     rig, sap, cog, nib.
 *
 * A word that is ambiguous in print can still earn its place if the picture
 * settles it: "can" is far more often the verb than the tin, but next to a
 * drawing of a tin there is nothing to mistake.
 *
 * It is deliberately not every CVC string in the language — add to the arrays
 * as you need them, keeping to the same bar.
 */

/**
 * Consonant–vowel–consonant words.
 *
 * Stored flat; the page derives the starting consonant, vowel and ending
 * consonant from each word, so adding one anywhere in the list is enough.
 */
export const CVC_WORDS: string[] = [
  // b
  "bag", "bat", "bed", "bin", "box", "bug", "bun", "bus",
  // c
  "cab", "can", "cap", "cat", "cup", "cut",
  // d
  "dad", "dam", "dig", "dog", "dot",
  // f
  "fan", "fog", "fox",
  // g
  // No "gem": its g is soft, and every other g in this list is hard.
  "gas", "gum",
  // h
  "hat", "hen", "hop", "hot", "hug", "hut",
  // j
  "jab", "jam", "jet", "jog", "jug",
  // k
  "kid", "kit",
  // l
  "lab", "lap", "leg", "lid", "lip", "log",
  // m
  "mad", "man", "map", "mat", "men", "mop", "mud", "mug",
  // n
  "nap", "net", "nut",
  // p
  "pad", "pan", "peg", "pen", "pet", "pin", "pot", "pup",
  // r
  "rag", "ram", "rat", "red", "rug", "run",
  // s
  "sad", "six", "sob", "sun",
  // t
  "tag", "tap", "ten", "tin", "tub",
  // v
  "van", "vet",
  // w
  "wax", "web", "wet", "wig", "win",
  // y
  "yes",
  // z
  "zip",
];

export const VOWEL_TEAM_CATEGORIES = [
  "magic_e",
  "long_vowel",
  "diphthong",
  "double_o",
  "y_vowel",
] as const;

export type VowelTeamCategory = (typeof VOWEL_TEAM_CATEGORIES)[number];

export interface VowelTeamWord {
  word: string;
  category: VowelTeamCategory;
  /** The spelling pattern: "a_e" for magic e, otherwise the pair itself. */
  pattern: string;
}

/**
 * Words where more than one letter makes the vowel sound.
 *
 * Category and pattern are written out rather than derived, because English
 * gives a parser nothing to go on: "cake", "rain" and "day" all say long a,
 * and "snow" and "cow" spell two different sounds the same way.
 *
 * The three categories are three different lessons:
 *
 *   magic_e     a silent e at the end reaches back and makes the vowel say
 *               its name — every word here ends vowel, consonant, e;
 *   long_vowel  two vowels together where the first says its name;
 *   diphthong   two vowels that glide from one sound into another, which is
 *               why "oi" and "ou" cannot be sounded out as a single held note.
 *
 * "ow" appears twice on purpose. In "snow" it is a long o; in "cow" it is a
 * true diphthong. Same two letters, two different sounds, two lessons.
 *
 * Ordered a, e, i, o, u for magic e, and then by pattern — the order they are
 * taught in, and the order the unit shows them.
 */
export const VOWEL_TEAM_WORDS: VowelTeamWord[] = [
  // --- Magic e ---
  { word: "cake", category: "magic_e", pattern: "a_e" },
  { word: "cane", category: "magic_e", pattern: "a_e" },
  { word: "cape", category: "magic_e", pattern: "a_e" },
  { word: "game", category: "magic_e", pattern: "a_e" },
  { word: "gate", category: "magic_e", pattern: "a_e" },
  { word: "grape", category: "magic_e", pattern: "a_e" },
  { word: "lake", category: "magic_e", pattern: "a_e" },
  { word: "name", category: "magic_e", pattern: "a_e" },
  { word: "plane", category: "magic_e", pattern: "a_e" },
  { word: "plate", category: "magic_e", pattern: "a_e" },
  { word: "rake", category: "magic_e", pattern: "a_e" },
  { word: "scale", category: "magic_e", pattern: "a_e" },
  { word: "skate", category: "magic_e", pattern: "a_e" },
  { word: "snake", category: "magic_e", pattern: "a_e" },
  { word: "tape", category: "magic_e", pattern: "a_e" },
  { word: "whale", category: "magic_e", pattern: "a_e" },
  { word: "bike", category: "magic_e", pattern: "i_e" },
  { word: "bite", category: "magic_e", pattern: "i_e" },
  { word: "dive", category: "magic_e", pattern: "i_e" },
  { word: "five", category: "magic_e", pattern: "i_e" },
  { word: "hide", category: "magic_e", pattern: "i_e" },
  { word: "hike", category: "magic_e", pattern: "i_e" },
  { word: "hive", category: "magic_e", pattern: "i_e" },
  { word: "ice", category: "magic_e", pattern: "i_e" },
  { word: "kite", category: "magic_e", pattern: "i_e" },
  { word: "lime", category: "magic_e", pattern: "i_e" },
  { word: "line", category: "magic_e", pattern: "i_e" },
  { word: "mice", category: "magic_e", pattern: "i_e" },
  { word: "nine", category: "magic_e", pattern: "i_e" },
  { word: "pine", category: "magic_e", pattern: "i_e" },
  { word: "rice", category: "magic_e", pattern: "i_e" },
  { word: "ride", category: "magic_e", pattern: "i_e" },
  { word: "slide", category: "magic_e", pattern: "i_e" },
  { word: "time", category: "magic_e", pattern: "i_e" },
  { word: "vine", category: "magic_e", pattern: "i_e" },
  { word: "white", category: "magic_e", pattern: "i_e" },
  { word: "bone", category: "magic_e", pattern: "o_e" },
  { word: "cone", category: "magic_e", pattern: "o_e" },
  { word: "dome", category: "magic_e", pattern: "o_e" },
  { word: "globe", category: "magic_e", pattern: "o_e" },
  { word: "hole", category: "magic_e", pattern: "o_e" },
  { word: "home", category: "magic_e", pattern: "o_e" },
  { word: "hose", category: "magic_e", pattern: "o_e" },
  { word: "mole", category: "magic_e", pattern: "o_e" },
  { word: "nose", category: "magic_e", pattern: "o_e" },
  { word: "pole", category: "magic_e", pattern: "o_e" },
  { word: "rope", category: "magic_e", pattern: "o_e" },
  { word: "rose", category: "magic_e", pattern: "o_e" },
  { word: "slope", category: "magic_e", pattern: "o_e" },
  { word: "stone", category: "magic_e", pattern: "o_e" },
  { word: "cube", category: "magic_e", pattern: "u_e" },
  { word: "cute", category: "magic_e", pattern: "u_e" },
  { word: "flute", category: "magic_e", pattern: "u_e" },
  { word: "mule", category: "magic_e", pattern: "u_e" },
  { word: "rule", category: "magic_e", pattern: "u_e" },
  { word: "tube", category: "magic_e", pattern: "u_e" },

  // --- Long vowels ---
  { word: "chain", category: "long_vowel", pattern: "ai" },
  { word: "mail", category: "long_vowel", pattern: "ai" },
  { word: "nail", category: "long_vowel", pattern: "ai" },
  { word: "pail", category: "long_vowel", pattern: "ai" },
  { word: "rain", category: "long_vowel", pattern: "ai" },
  { word: "snail", category: "long_vowel", pattern: "ai" },
  { word: "tail", category: "long_vowel", pattern: "ai" },
  { word: "train", category: "long_vowel", pattern: "ai" },
  { word: "clay", category: "long_vowel", pattern: "ay" },
  { word: "day", category: "long_vowel", pattern: "ay" },
  { word: "hay", category: "long_vowel", pattern: "ay" },
  { word: "play", category: "long_vowel", pattern: "ay" },
  { word: "tray", category: "long_vowel", pattern: "ay" },
  { word: "beach", category: "long_vowel", pattern: "ea" },
  { word: "bean", category: "long_vowel", pattern: "ea" },
  { word: "leaf", category: "long_vowel", pattern: "ea" },
  { word: "meat", category: "long_vowel", pattern: "ea" },
  { word: "pea", category: "long_vowel", pattern: "ea" },
  { word: "peach", category: "long_vowel", pattern: "ea" },
  { word: "sea", category: "long_vowel", pattern: "ea" },
  { word: "seat", category: "long_vowel", pattern: "ea" },
  { word: "tea", category: "long_vowel", pattern: "ea" },
  { word: "bee", category: "long_vowel", pattern: "ee" },
  { word: "feet", category: "long_vowel", pattern: "ee" },
  { word: "green", category: "long_vowel", pattern: "ee" },
  { word: "heel", category: "long_vowel", pattern: "ee" },
  { word: "jeep", category: "long_vowel", pattern: "ee" },
  { word: "queen", category: "long_vowel", pattern: "ee" },
  { word: "sheep", category: "long_vowel", pattern: "ee" },
  { word: "sheet", category: "long_vowel", pattern: "ee" },
  { word: "sleep", category: "long_vowel", pattern: "ee" },
  { word: "three", category: "long_vowel", pattern: "ee" },
  { word: "tree", category: "long_vowel", pattern: "ee" },
  { word: "wheel", category: "long_vowel", pattern: "ee" },
  { word: "boat", category: "long_vowel", pattern: "oa" },
  { word: "coat", category: "long_vowel", pattern: "oa" },
  { word: "goat", category: "long_vowel", pattern: "oa" },
  { word: "road", category: "long_vowel", pattern: "oa" },
  { word: "soap", category: "long_vowel", pattern: "oa" },
  { word: "toad", category: "long_vowel", pattern: "oa" },
  { word: "blow", category: "long_vowel", pattern: "ow" },
  { word: "bow", category: "long_vowel", pattern: "ow" },
  { word: "crow", category: "long_vowel", pattern: "ow" },
  { word: "grow", category: "long_vowel", pattern: "ow" },
  { word: "snow", category: "long_vowel", pattern: "ow" },
  { word: "blue", category: "long_vowel", pattern: "ue" },
  { word: "glue", category: "long_vowel", pattern: "ue" },

  // --- Double o: one spelling, two sounds, named after their exemplars ---
  { word: "boot", category: "double_o", pattern: "moon" },
  { word: "broom", category: "double_o", pattern: "moon" },
  { word: "food", category: "double_o", pattern: "moon" },
  { word: "moon", category: "double_o", pattern: "moon" },
  { word: "pool", category: "double_o", pattern: "moon" },
  { word: "roof", category: "double_o", pattern: "moon" },
  { word: "spoon", category: "double_o", pattern: "moon" },
  { word: "tooth", category: "double_o", pattern: "moon" },
  { word: "zoo", category: "double_o", pattern: "moon" },
  { word: "book", category: "double_o", pattern: "book" },
  { word: "cook", category: "double_o", pattern: "book" },
  { word: "foot", category: "double_o", pattern: "book" },
  { word: "good", category: "double_o", pattern: "book" },
  { word: "hook", category: "double_o", pattern: "book" },
  { word: "look", category: "double_o", pattern: "book" },
  { word: "wood", category: "double_o", pattern: "book" },
  { word: "wool", category: "double_o", pattern: "book" },

  // --- y doing a vowel's job, at the end of a word ---
  { word: "cry", category: "y_vowel", pattern: "sky" },
  { word: "dry", category: "y_vowel", pattern: "sky" },
  { word: "fly", category: "y_vowel", pattern: "sky" },
  { word: "shy", category: "y_vowel", pattern: "sky" },
  { word: "sky", category: "y_vowel", pattern: "sky" },
  { word: "try", category: "y_vowel", pattern: "sky" },
  { word: "baby", category: "y_vowel", pattern: "baby" },
  { word: "funny", category: "y_vowel", pattern: "baby" },
  { word: "happy", category: "y_vowel", pattern: "baby" },
  { word: "jelly", category: "y_vowel", pattern: "baby" },
  { word: "puppy", category: "y_vowel", pattern: "baby" },
  { word: "sunny", category: "y_vowel", pattern: "baby" },

  // --- Diphthongs ---
  { word: "boil", category: "diphthong", pattern: "oi" },
  { word: "coin", category: "diphthong", pattern: "oi" },
  { word: "oil", category: "diphthong", pattern: "oi" },
  { word: "soil", category: "diphthong", pattern: "oi" },
  { word: "boy", category: "diphthong", pattern: "oy" },
  { word: "toy", category: "diphthong", pattern: "oy" },
  { word: "cloud", category: "diphthong", pattern: "ou" },
  { word: "house", category: "diphthong", pattern: "ou" },
  { word: "mouse", category: "diphthong", pattern: "ou" },
  { word: "mouth", category: "diphthong", pattern: "ou" },
  { word: "brown", category: "diphthong", pattern: "ow" },
  { word: "clown", category: "diphthong", pattern: "ow" },
  { word: "cow", category: "diphthong", pattern: "ow" },
  { word: "crown", category: "diphthong", pattern: "ow" },
  { word: "owl", category: "diphthong", pattern: "ow" },
  { word: "town", category: "diphthong", pattern: "ow" },
];

export interface BlendGroup {
  /** The blend itself, e.g. "bl". */
  blend: string;
  words: string[];
}

/**
 * Words opening with a consonant blend — two consonants whose sounds are both
 * heard, unlike a digraph where they make one new sound.
 *
 * Ordered here for readability; the page sorts by starting consonant and then
 * by the letter blended with it.
 */
export const BLEND_GROUPS: BlendGroup[] = [
  { blend: "bl", words: ["black", "blanket", "block", "blue"] },
  { blend: "br", words: ["branch", "bread", "brick", "bridge", "brown", "brush"] },
  { blend: "cl", words: ["clap", "cliff", "climb", "clip", "clock", "cloud"] },
  { blend: "cr", words: ["crab", "crack", "crayon", "crib", "crow", "crown"] },
  { blend: "dr", words: ["dragon", "draw", "dress", "drink", "drop", "drum"] },
  {
    blend: "fl",
    words: ["flag", "flame", "flat", "flip", "floor", "flop", "flower"],
  },
  { blend: "fr", words: ["frame", "fresh", "friend", "frog", "frost"] },
  { blend: "gl", words: ["glad", "glass", "globe", "glove", "glue"] },
  // "grapes" rather than "grape" so it shares Unit 1's picture for G.
  { blend: "gr", words: ["grapes", "grass", "green", "grin"] },
  {
    blend: "pl",
    words: ["plan", "plane", "plant", "plate", "play", "plug", "plum"],
  },
  { blend: "pr", words: ["pram", "present", "press", "print"] },
  // qu is never a lone q: the u always follows, and together they say /kw/.
  { blend: "qu", words: ["quack", "queen", "quick", "quill", "quilt", "quiz"] },
  { blend: "sc", words: ["scab", "scarf", "school", "scooter"] },
  {
    blend: "sk",
    words: ["skate", "ski", "skid", "skin", "skip", "skirt", "sky"],
  },
  { blend: "sl", words: ["sled", "sleep", "slide", "slip", "slot", "slug"] },
  { blend: "sm", words: ["smash", "smell", "smile", "smoke"] },
  { blend: "sn", words: ["snail", "snake", "snap", "snip", "snow"] },
  { blend: "sp", words: ["spade", "spider", "spin", "spoon", "spot"] },
  { blend: "st", words: ["stamp", "star", "stick", "stone", "stop"] },
  { blend: "sw", words: ["swan", "sweet", "swim", "swing"] },
  { blend: "tr", words: ["train", "tray", "tree", "truck", "trunk"] },
  { blend: "tw", words: ["twelve", "twig", "twin"] },
];

/**
 * Blends that close a word rather than open it.
 *
 * Held separately because they are a distinct lesson: a child who can read
 * "stop" cannot necessarily read "nest" — hearing two consonants run together
 * after the vowel is harder than hearing them before it.
 *
 * "nk" lives here rather than with the digraphs. It is two sounds, /ŋ/ then
 * /k/, so it was never a digraph at all.
 */
export const FINAL_BLEND_GROUPS: BlendGroup[] = [
  {
    blend: "nd",
    words: ["and", "band", "bend", "hand", "land", "pond", "sand", "send"],
  },
  { blend: "nk", words: ["bank", "pink", "sink", "tank", "wink"] },
  { blend: "nt", words: ["ant", "hunt", "mint", "tent"] },
  { blend: "mp", words: ["bump", "camp", "jump", "lamp", "ramp"] },
  { blend: "sk", words: ["desk", "mask", "tusk"] },
  { blend: "st", words: ["dust", "fast", "fist", "last", "list", "nest", "vest"] },
  { blend: "ft", words: ["gift", "lift", "raft", "soft"] },
  { blend: "lt", words: ["belt", "melt", "salt"] },
  { blend: "lk", words: ["milk", "silk"] },
  { blend: "lp", words: ["gulp", "help"] },
];

export interface RControlledGroup {
  /** The vowel and its r, e.g. "ar". */
  pattern: string;
  words: string[];
}

/**
 * Vowels changed by an r following them.
 *
 * Neither short nor long: the r swallows the vowel, so "car" is not "cat" with
 * a different ending. That is why these need their own unit rather than
 * sitting quietly inside the blend and digraph lists.
 *
 * er, ir and ur all say the same sound. Meeting them together is the lesson.
 */
export const R_CONTROLLED_GROUPS: RControlledGroup[] = [
  {
    pattern: "ar",
    words: [
      "arm", "art", "barn", "car", "card", "dark", "farm", "hard",
      "jar", "park", "scarf", "shark", "star", "yard",
    ],
  },
  {
    pattern: "or",
    words: [
      "born", "cord", "corn", "fork", "horn", "north", "short", "sport",
      "storm", "torch",
    ],
  },
  { pattern: "er", words: ["fern", "her", "herd", "perch"] },
  {
    pattern: "ir",
    words: ["bird", "dirt", "first", "girl", "shirt", "skirt", "third"],
  },
  {
    pattern: "ur",
    words: ["burn", "curl", "hurt", "nurse", "purse", "surf", "turn"],
  },
];

export interface DigraphGroup {
  /** The pair itself, e.g. "sh". */
  digraph: string;
  /** Which end of the word it sits at. */
  position: "start" | "end";
  words: string[];
}

/**
 * Digraphs — two letters making one new sound, unlike a blend where both
 * sounds are still heard. "sh" is not s-then-h; "ck" is a single /k/.
 *
 * Listed at both ends of the word, because most of them behave differently
 * depending on where they fall, and several only ever appear at the end.
 *
 * Every word here keeps a short vowel, because digraphs are taught before long
 * vowels are: a child meeting "sheep" here would be decoding two new things at
 * once. That cost the "ph" group, which has no short-vowel word at this level —
 * phone, photo and photograph all say long o. It also cost "shark" and
 * "thorn", whose vowels are r-controlled rather than short. "whisker" stays:
 * its stressed vowel is a short i, and the "er" is an unstressed schwa.
 *
 * "ng" and "nk" are left out. "nk" is not a digraph at all — it is two sounds,
 * /ŋ/ then /k/ — and "ng", though a true digraph, changes the vowel in front
 * of it, which makes it a lesson of its own rather than one of this set.
 */
export const DIGRAPH_GROUPS: DigraphGroup[] = [
  {
    digraph: "ch",
    position: "start",
    // No "chair": its "ai" is a vowel team, taught two units later.
    words: [
      "cherry",
      "chest",
      "chick",
      "chicken",
      "chin",
      "chip",
      "chop",
    ],
  },
  {
    digraph: "sh",
    position: "start",
    words: ["shed", "shell", "ship", "shop", "shut"],
  },
  {
    digraph: "th",
    position: "start",
    // The last four are the voiced th of "this", not the breathy th of
    // "thin" — the same two letters carrying two different sounds.
    words: ["thick", "thin", "thumb", "that", "them", "then", "this"],
  },
  {
    digraph: "wh",
    position: "start",
    words: ["whip", "whisk", "whisker"],
  },
  {
    digraph: "ch",
    position: "end",
    words: ["bench", "branch", "lunch", "match", "patch", "watch"],
  },
  {
    digraph: "ck",
    position: "end",
    words: ["back", "duck", "kick", "lock", "rock", "sock"],
  },
  {
    digraph: "sh",
    position: "end",
    words: ["brush", "dish", "fish", "push", "wish"],
  },
  {
    digraph: "th",
    position: "end",
    words: ["bath", "cloth", "month", "moth", "path", "with"],
  },
];
