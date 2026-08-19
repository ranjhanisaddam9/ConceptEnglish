import {
  FALLBACK_NAMES,
  type Gender,
  type StoryCast,
  type StoryCharacter,
} from "./types";

/**
 * Fills a story's placeholders in from the cast set in Settings.
 *
 * One story is written once and reads correctly for any pairing of a boy and
 * a girl, because every word that depends on who the characters are is a
 * token rather than a fixed word.
 *
 *   {c1_name}     the character's name
 *   {c1_sub}      subject pronoun    he / she
 *   {c1_obj}      object pronoun     him / her
 *   {c1_pos_adj}  possessive adj.    his / her
 *   {c1_pos_pro}  possessive pronoun his / hers
 *
 * Capitalising the C — {C1_sub} — capitalises the word, which is what a token
 * starting a sentence needs. Everything else about the token is the same.
 */

/** The four pronoun forms, per gender. */
const PRONOUNS: Record<Gender, Record<PronounSlot, string>> = {
  male: { sub: "he", obj: "him", pos_adj: "his", pos_pro: "his" },
  female: { sub: "she", obj: "her", pos_adj: "her", pos_pro: "hers" },
};

type PronounSlot = "sub" | "obj" | "pos_adj" | "pos_pro";

/**
 * Matches one placeholder.
 *
 * The case of the leading C is captured rather than matched case-insensitively
 * throughout, because it is the thing that decides capitalisation — while the
 * slot name after it is always lowercase.
 */
const TOKEN = /\{([Cc])([12])_(name|sub|obj|pos_adj|pos_pro)\}/g;

function capitalise(word: string) {
  return word.charAt(0).toUpperCase() + word.slice(1);
}

/**
 * The name to print for a character.
 *
 * A blank name falls back to a stand-in: a story showing a raw `{c1_name}`
 * would read as broken to a child, and the settings page is free to be empty.
 */
export function displayName(
  character: StoryCharacter,
  slot: "c1" | "c2",
): string {
  const trimmed = character.name.trim();
  return trimmed === "" ? FALLBACK_NAMES[slot] : trimmed;
}

/** Replaces every placeholder in one line of a story. */
export function fillLine(line: string, cast: StoryCast): string {
  return line.replace(TOKEN, (whole, c: string, index: string, slot: string) => {
    const key = index === "1" ? "c1" : "c2";
    const character = cast[key];
    if (!character) return whole;

    const word =
      slot === "name"
        ? displayName(character, key)
        : PRONOUNS[character.gender][slot as PronounSlot];

    // A name is already capitalised; only a pronoun has anything to do here.
    return c === "C" ? capitalise(word) : word;
  });
}

/** Replaces every placeholder in a list of lines. */
export function fillLines(lines: string[], cast: StoryCast): string[] {
  return lines.map((line) => fillLine(line, cast));
}

/** Replaces every placeholder in a whole story, keeping its grouping. */
export function fillStanzas(stanzas: string[][], cast: StoryCast): string[][] {
  return stanzas.map((stanza) => fillLines(stanza, cast));
}

/**
 * The artwork suffix for a cast, e.g. "MF" for a boy and a girl.
 *
 * First letter is character 1, second is character 2 — so MF and FM are
 * different pictures, matching the four files shipped per story.
 */
export function castVariant(cast: StoryCast): string {
  const letter = (gender: Gender) => (gender === "male" ? "M" : "F");
  return `${letter(cast.c1.gender)}${letter(cast.c2.gender)}`;
}

/** Where a story's picture lives, for the cast currently set. */
export function storyImagePath(storyNumber: number, cast: StoryCast): string {
  return `/story/Story${storyNumber}_${castVariant(cast)}.jpg`;
}

/**
 * The whole story as one string, for reading aloud.
 *
 * Lines within a stanza are separated by a newline and the stanzas by a blank
 * line, so the synthesiser draws breath where the page has a break rather
 * than running the story together.
 */
export function spokenStory(stanzas: string[][], cast: StoryCast): string {
  return fillStanzas(stanzas, cast)
    .map((stanza) => stanza.join("\n"))
    .join("\n\n");
}
