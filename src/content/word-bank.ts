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
  "bag", "bat", "bed", "bin", "bit", "box", "bud", "bug", "bun", "bus",
  // c
  "cab", "can", "cap", "cat", "cob", "cot", "cub", "cup", "cut",
  // d
  "dad", "den", "dig", "dip", "dog", "dot",
  // f
  "fan", "fig", "fin", "fit", "fix", "fog", "fox",
  // g
  // No "gem": its g is soft, and every other g in this list is hard.
  "gas", "gum",
  // h
  "hat", "hen", "hit", "hop", "hot", "hug", "hum", "hut",
  // j
  "jab", "jam", "jet", "job", "jog", "jug",
  // k
  "kid", "kit",
  // l
  "lap", "leg", "lid", "lip", "log",
  // m
  "mad", "man", "map", "mat", "men", "mix", "mop", "mud", "mug",
  // n
  "nap", "net", "nut",
  // p
  "pad", "pan", "pat", "peg", "pen", "pet", "pin", "pit", "pot", "pup",
  // r
  "rag", "ram", "rat", "red", "rub", "rug", "run",
  // s
  "sad", "sat", "sip", "sit", "six", "sob", "sum", "sun",
  // t
  "tag", "tap", "ten", "tin", "top", "tub",
  // v
  "van", "vet",
  // w
  "wag", "wax", "web", "wet", "wig", "win",
  // y
  "yam", "yes",
  // z
  "zip",
];

export const VOWEL_TEAM_CATEGORIES = [
  "long_vowel",
  "diphthong",
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
 * The categories are separate lessons:
 *
 *   long_vowel  the vowel says its name. Either two vowels together, or the
 *               VCe pattern, where a silent e at the end reaches back over one
 *               consonant to do the same job;
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
  // --- VCe: vowel, consonant, silent e ---
  { word: "cake", category: "long_vowel", pattern: "VCe" },
  { word: "cane", category: "long_vowel", pattern: "VCe" },
  { word: "cape", category: "long_vowel", pattern: "VCe" },
  { word: "game", category: "long_vowel", pattern: "VCe" },
  { word: "gate", category: "long_vowel", pattern: "VCe" },
  { word: "grape", category: "long_vowel", pattern: "VCe" },
  { word: "lake", category: "long_vowel", pattern: "VCe" },
  { word: "name", category: "long_vowel", pattern: "VCe" },
  { word: "plane", category: "long_vowel", pattern: "VCe" },
  { word: "plate", category: "long_vowel", pattern: "VCe" },
  { word: "rake", category: "long_vowel", pattern: "VCe" },
  { word: "scale", category: "long_vowel", pattern: "VCe" },
  { word: "skate", category: "long_vowel", pattern: "VCe" },
  { word: "snake", category: "long_vowel", pattern: "VCe" },
  { word: "tape", category: "long_vowel", pattern: "VCe" },
  { word: "whale", category: "long_vowel", pattern: "VCe" },
  { word: "bike", category: "long_vowel", pattern: "VCe" },
  { word: "bite", category: "long_vowel", pattern: "VCe" },
  { word: "dive", category: "long_vowel", pattern: "VCe" },
  { word: "five", category: "long_vowel", pattern: "VCe" },
  { word: "hide", category: "long_vowel", pattern: "VCe" },
  { word: "hike", category: "long_vowel", pattern: "VCe" },
  { word: "hive", category: "long_vowel", pattern: "VCe" },
  { word: "ice", category: "long_vowel", pattern: "VCe" },
  { word: "kite", category: "long_vowel", pattern: "VCe" },
  { word: "lime", category: "long_vowel", pattern: "VCe" },
  { word: "line", category: "long_vowel", pattern: "VCe" },
  { word: "mice", category: "long_vowel", pattern: "VCe" },
  { word: "nine", category: "long_vowel", pattern: "VCe" },
  { word: "pine", category: "long_vowel", pattern: "VCe" },
  { word: "rice", category: "long_vowel", pattern: "VCe" },
  { word: "ride", category: "long_vowel", pattern: "VCe" },
  { word: "slide", category: "long_vowel", pattern: "VCe" },
  { word: "time", category: "long_vowel", pattern: "VCe" },
  { word: "vine", category: "long_vowel", pattern: "VCe" },
  { word: "white", category: "long_vowel", pattern: "VCe" },
  { word: "bone", category: "long_vowel", pattern: "VCe" },
  { word: "cone", category: "long_vowel", pattern: "VCe" },
  { word: "dome", category: "long_vowel", pattern: "VCe" },
  { word: "globe", category: "long_vowel", pattern: "VCe" },
  { word: "hole", category: "long_vowel", pattern: "VCe" },
  { word: "home", category: "long_vowel", pattern: "VCe" },
  { word: "hose", category: "long_vowel", pattern: "VCe" },
  { word: "mole", category: "long_vowel", pattern: "VCe" },
  { word: "nose", category: "long_vowel", pattern: "VCe" },
  { word: "pole", category: "long_vowel", pattern: "VCe" },
  { word: "rope", category: "long_vowel", pattern: "VCe" },
  { word: "rose", category: "long_vowel", pattern: "VCe" },
  { word: "slope", category: "long_vowel", pattern: "VCe" },
  { word: "stone", category: "long_vowel", pattern: "VCe" },
  { word: "cube", category: "long_vowel", pattern: "VCe" },
  { word: "cute", category: "long_vowel", pattern: "VCe" },
  { word: "flute", category: "long_vowel", pattern: "VCe" },
  { word: "mule", category: "long_vowel", pattern: "VCe" },
  { word: "rule", category: "long_vowel", pattern: "VCe" },
  { word: "tube", category: "long_vowel", pattern: "VCe" },

  // --- Two vowels together ---
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

  // The long oo of "moon". Its short twin, the oo of "book", is a short vowel
  // and lives with them — see SHORT_OO_WORDS.
  { word: "boot", category: "long_vowel", pattern: "oo" },
  { word: "broom", category: "long_vowel", pattern: "oo" },
  { word: "food", category: "long_vowel", pattern: "oo" },
  { word: "moon", category: "long_vowel", pattern: "oo" },
  { word: "pool", category: "long_vowel", pattern: "oo" },
  { word: "roof", category: "long_vowel", pattern: "oo" },
  { word: "spoon", category: "long_vowel", pattern: "oo" },
  { word: "tooth", category: "long_vowel", pattern: "oo" },
  { word: "zoo", category: "long_vowel", pattern: "oo" },

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

export interface ShortOoWord {
  word: string;
  /** The rime it shares, e.g. "ook" for book. */
  family: string;
}

/**
 * The short oo of "book" — /ʊ/, not the /uː/ of "moon".
 *
 * A held, short sound, so it sits with the short vowels rather than with the
 * vowel teams. It is not short u, though: "book" and "cup" do not rhyme, which
 * is why it gets a button of its own beside a, e, i, o and u rather than being
 * filed under one of them.
 */
export const SHORT_OO_WORDS: ShortOoWord[] = [
  { word: "book", family: "ook" },
  { word: "cook", family: "ook" },
  { word: "hook", family: "ook" },
  { word: "look", family: "ook" },
  { word: "took", family: "ook" },
  { word: "good", family: "ood" },
  { word: "hood", family: "ood" },
  { word: "stood", family: "ood" },
  { word: "wood", family: "ood" },
  { word: "foot", family: "oot" },
  { word: "wool", family: "ool" },
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
  { blend: "tr", words: ["train", "trap", "tray", "tree", "truck", "trunk"] },
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
  // Children meet "er" at the end of a word far more often than inside one,
  // so this group is the two-syllable case. It is the first place in the
  // course where a word has more than one beat.
  {
    pattern: "er",
    words: [
      "her", "tiger", "water", "farmer", "flower", "ladder", "letter",
      "sister",
    ],
  },
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
    // "whip" is out: it reads as the thing you hit with. "when" and "which"
    // carry the sound and are two of the commonest words a child will meet.
    words: ["when", "which", "whisk", "whisker"],
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
