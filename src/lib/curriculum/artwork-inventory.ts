import { readdir } from "node:fs/promises";
import path from "node:path";

import { artworkSlug, picturePath } from "@/content/artwork";
import {
  BLEND_GROUPS,
  CVC_WORDS,
  DIGRAPH_GROUPS,
  FINAL_BLEND_GROUPS,
  R_CONTROLLED_GROUPS,
  VOWEL_TEAM_WORDS,
} from "@/content/word-bank";
import type { PictureEntry } from "@/lib/curriculum/word-bank";

/**
 * What artwork we actually have.
 *
 * Read from the folder rather than from a hand-kept list, so the picture
 * stock-take can never claim something we do not own — and so dropping a new
 * SVG in `public/curriculum/examples/` is enough to make it appear.
 *
 * Server-only: it touches the filesystem.
 */

const ARTWORK_DIR = path.join(process.cwd(), "public", "curriculum", "examples");

/** Every word the curriculum might have a picture for. */
function candidateWords(extra: string[]): string[] {
  return [
    ...extra,
    ...CVC_WORDS,
    ...VOWEL_TEAM_WORDS.map((word) => word.word),
    ...BLEND_GROUPS.flatMap((group) => group.words),
    ...FINAL_BLEND_GROUPS.flatMap((group) => group.words),
    ...R_CONTROLLED_GROUPS.flatMap((group) => group.words),
    ...DIGRAPH_GROUPS.flatMap((group) => group.words),
  ];
}

/**
 * The pictures we own, as word/source pairs.
 *
 * @param extra Extra words to look for — the letter units' example words,
 *   which live in the curriculum rather than the word bank.
 */
export async function artworkInventory(
  extra: string[] = [],
): Promise<PictureEntry[]> {
  const files = await readdir(ARTWORK_DIR);
  const available = new Set(
    files
      .filter((file) => file.endsWith(".svg"))
      .map((file) => file.slice(0, -".svg".length)),
  );

  const seen = new Set<string>();
  const pictures: PictureEntry[] = [];

  for (const word of candidateWords(extra)) {
    const slug = artworkSlug(word);
    if (!available.has(slug) || seen.has(slug)) continue;

    seen.add(slug);
    pictures.push({ word, src: picturePath(word) });
  }

  return pictures.sort((a, b) => a.word.localeCompare(b.word));
}
