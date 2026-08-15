import {
  BLEND_GROUPS,
  CVC_WORDS,
  DIGRAPH_GROUPS,
  type BlendGroup,
  type DigraphGroup,
} from "@/content/word-bank";

/**
 * Sorting and grouping for the phonics word bank.
 *
 * The two lists answer different questions, so they are ordered differently:
 * CVC words by their three sounds in order, which is what makes word families
 * fall out next to each other; blends by the consonant they start with and
 * then the letter blended onto it.
 */

export const WORD_BANK_LISTS = [
  "cvc",
  "blends",
  "digraphs",
  "pictures",
] as const;

export type WordBankList = (typeof WORD_BANK_LISTS)[number];

export const WORD_BANK_LIST_OPTIONS = [
  {
    value: "cvc" as const,
    label: "CVC words",
    description: "Three-letter words: consonant, vowel, consonant",
  },
  {
    value: "blends" as const,
    label: "Blends",
    description: "Words opening with two blended consonants",
  },
  {
    value: "digraphs" as const,
    label: "Digraphs",
    description: "Two letters making one new sound",
  },
  {
    value: "pictures" as const,
    label: "Pictures",
    description: "The artwork we already own, by family and by blend",
  },
];

export interface CvcWord {
  word: string;
  start: string;
  vowel: string;
  end: string;
  /** The word family this belongs to, e.g. "at" for cat. */
  family: string;
}

export interface CvcFamilyEntry {
  /** The rime, e.g. "at". */
  family: string;
  word: string;
}

export interface CvcGroup {
  /** The starting consonant these words share. */
  start: string;
  families: CvcFamilyEntry[];
}

export function parseCvc(word: string): CvcWord | null {
  const letters = word.trim().toLowerCase();
  if (letters.length !== 3) return null;

  const [start, vowel, end] = letters;
  return { word: letters, start, vowel, end, family: `${vowel}${end}` };
}

/**
 * CVC words by starting consonant, with the word family each one belongs to.
 *
 * A consonant reaches each family at most once — the start and the family are
 * the whole word — so every entry here is a single word, labelled with the
 * family it joins. That answers the question the sheets ask: given the letter
 * we are teaching, which families does it open?
 *
 * Starts at "b": no CVC word in the list opens with a vowel.
 */
export function cvcGroups(words: string[] = CVC_WORDS): CvcGroup[] {
  const parsed = words
    .map(parseCvc)
    .filter((entry): entry is CvcWord => entry !== null);

  const byStart = new Map<string, CvcFamilyEntry[]>();
  for (const entry of parsed) {
    const bucket = byStart.get(entry.start);
    const family = { family: entry.family, word: entry.word };
    if (bucket) bucket.push(family);
    else byStart.set(entry.start, [family]);
  }

  return [...byStart.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([start, families]) => ({
      start,
      families: families.sort((a, b) => a.family.localeCompare(b.family)),
    }));
}

/**
 * Two vowels working as one sound — the digraphs (ai, ea, oa) and the
 * diphthongs (oi, ou, ow), which are their own lesson.
 *
 * Split digraphs are deliberately absent: the vowels in "plane" and "stone"
 * are separated by a consonant, so nothing here matches them.
 */
const VOWEL_TEAMS = [
  "ai", "au", "aw", "ay",
  "ea", "ee", "ei", "eu", "ew", "ey",
  "ie",
  "oa", "oe", "oi", "oo", "ou", "ow", "oy",
  "ue", "ui",
];

/**
 * Whether a word carries a vowel digraph or diphthong.
 *
 * The u of a leading "qu" is dropped first. It is half of the /kw/ sound, not
 * a vowel, so without this "quiz" reads as carrying the "ui" team and "quilt"
 * would be barred from the blends unit.
 */
export function hasVowelTeam(word: string): boolean {
  const letters = word.toLowerCase().replace(/^qu/, "q");
  return VOWEL_TEAMS.some((team) => letters.includes(team));
}

/**
 * Words whose vowel is short despite the spelling, or long despite it.
 *
 * Too few to be worth a rule, and no rule would catch them anyway: "climb"
 * looks like a closed syllable and says long i; "glove" looks like magic e and
 * says short u.
 */
const IRREGULAR_VOWELS = new Set(["climb", "glove", "swan", "swap", "wash"]);

/**
 * Whether a word's vowel is a plain short one a child can read before the
 * vowel-teams unit.
 *
 * Excludes vowel teams, magic e, and open syllables ("ski", "sky"), all of
 * which are taught later. R-controlled vowels ("star", "scarf") are allowed:
 * the course never teaches them, so holding them back would not be sequencing
 * — it would just lose the words. See the audit note on r-controlled coverage.
 */
export function isShortVowelWord(word: string): boolean {
  const letters = word.toLowerCase().replace(/^qu/, "q");
  if (IRREGULAR_VOWELS.has(word.toLowerCase())) return false;
  if (hasVowelTeam(letters)) return false;
  if (/[aeiou][^aeiouy]e$/.test(letters)) return false;
  if (/[aeiouy]$/.test(letters)) return false;
  return true;
}

export interface BlendLetterGroup {
  /** The consonant every blend in here starts with. */
  start: string;
  blends: BlendGroup[];
}

/** Blends grouped by their first letter, then ordered by the second. */
export function blendGroups(groups: BlendGroup[] = BLEND_GROUPS): BlendLetterGroup[] {
  const byStart = new Map<string, BlendGroup[]>();

  for (const group of groups) {
    const start = group.blend[0];
    const bucket = byStart.get(start);
    if (bucket) bucket.push(group);
    else byStart.set(start, [group]);
  }

  return [...byStart.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([start, blends]) => ({
      start,
      blends: blends.sort((a, b) => a.blend.localeCompare(b.blend)),
    }));
}

export interface DigraphPositionGroup {
  position: "start" | "end";
  label: string;
  digraphs: DigraphGroup[];
}

/** Digraphs split by where they sit in the word, then ordered alphabetically. */
export function digraphGroups(
  groups: DigraphGroup[] = DIGRAPH_GROUPS,
): DigraphPositionGroup[] {
  return (
    [
      { position: "start" as const, label: "At the start" },
      { position: "end" as const, label: "At the end" },
    ]
      .map(({ position, label }) => ({
        position,
        label,
        digraphs: groups
          .filter((group) => group.position === position)
          .sort((a, b) => a.digraph.localeCompare(b.digraph)),
      }))
      // A position with nothing listed should not print an empty heading.
      .filter((group) => group.digraphs.length > 0)
  );
}

export interface PictureEntry {
  word: string;
  src: string;
}

export interface FamilyPictures {
  /** The rime these share, e.g. "at" for bat, cat, hat. */
  family: string;
  pictures: PictureEntry[];
}

/**
 * The pictures we already own that happen to be CVC words, grouped by family.
 *
 * A stock-take rather than a word list: this is what a picture-based word
 * family sheet could actually be built from today.
 */
export function picturesByFamily(pictures: PictureEntry[]): FamilyPictures[] {
  const byFamily = new Map<string, PictureEntry[]>();

  for (const picture of pictures) {
    const parsed = parseCvc(picture.word);
    if (!parsed) continue;
    if (VOWELS.has(parsed.start) || VOWELS.has(parsed.end)) continue;

    const bucket = byFamily.get(parsed.family);
    if (bucket) bucket.push(picture);
    else byFamily.set(parsed.family, [picture]);
  }

  return [...byFamily.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([family, entries]) => ({
      family,
      pictures: entries.sort((a, b) => a.word.localeCompare(b.word)),
    }));
}

export interface BlendPictures {
  blend: string;
  pictures: PictureEntry[];
}

/** The pictures we own whose word opens with a blend, grouped by that blend. */
export function picturesByBlend(
  pictures: PictureEntry[],
  groups: BlendGroup[] = BLEND_GROUPS,
): BlendPictures[] {
  const blends = [...new Set(groups.map((group) => group.blend))].sort();

  return blends
    .map((blend) => ({
      blend,
      pictures: pictures
        .filter((picture) => picture.word.toLowerCase().startsWith(blend))
        .sort((a, b) => a.word.localeCompare(b.word)),
    }))
    .filter((group) => group.pictures.length > 0);
}

export interface DigraphPictures {
  digraph: string;
  position: "start" | "end";
  /** e.g. "sh at the start". */
  label: string;
  pictures: PictureEntry[];
}

/**
 * The pictures we own whose word carries a digraph, grouped by the digraph and
 * the end of the word it sits at.
 *
 * Split by position because the same pair is a different lesson at each end —
 * "ship" and "fish" are not taught together.
 */
export function picturesByDigraph(
  pictures: PictureEntry[],
  groups: DigraphGroup[] = DIGRAPH_GROUPS,
): DigraphPictures[] {
  const byWord = new Map(
    pictures.map((picture) => [picture.word.toLowerCase(), picture]),
  );

  return groups
    .map((group) => ({
      digraph: group.digraph,
      position: group.position,
      label: `${group.digraph} at the ${group.position}`,
      pictures: group.words
        .map((word) => byWord.get(word.toLowerCase()))
        .filter((picture): picture is PictureEntry => picture !== undefined)
        .sort((a, b) => a.word.localeCompare(b.word)),
    }))
    .filter((group) => group.pictures.length > 0)
    .sort(
      (a, b) =>
        // Starting digraphs first, then alphabetically within each end.
        Number(a.position === "end") - Number(b.position === "end") ||
        a.digraph.localeCompare(b.digraph),
    );
}

const VOWELS = new Set(["a", "e", "i", "o", "u"]);
