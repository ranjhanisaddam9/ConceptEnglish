/**
 * Generates the built-in curriculum artwork.
 *
 * Each word gets a small self-contained SVG: a soft pastel card with a large
 * emoji on it. No licensing to worry about, no network fetch, and it renders
 * identically offline in a classroom.
 *
 * The output files are named after the word, so replacing the placeholder art
 * with a real illustration later is just overwriting the file — no code or
 * content change is needed.
 *
 * Usage:
 *   node scripts/generate-artwork.mjs          # every letter
 *   node scripts/generate-artwork.mjs A B C    # only these letters
 */

import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(ROOT, "public", "curriculum", "examples");

/**
 * word -> emoji, grouped by letter.
 *
 * Words were chosen so that every one of them has a recognisable emoji; the
 * curriculum content in `src/content/` must use the same words.
 */
const ARTWORK = {
  A: { Apple: "🍎", Ant: "🐜", Aeroplane: "✈️" },
  B: { Ball: "⚽", Bat: "🦇", Banana: "🍌" },
  C: { Cat: "🐱", Car: "🚗", Cake: "🍰" },
  D: { Dog: "🐶", Duck: "🦆", Drum: "🥁" },
  E: { Egg: "🥚", Elephant: "🐘", Envelope: "✉️" },
  F: { Fish: "🐟", Frog: "🐸", Flower: "🌻" },
  G: { Goat: "🐐", Grapes: "🍇", Guitar: "🎸" },
  H: { Hat: "🎩", Horse: "🐴", House: "🏠" },
  I: { Icecream: "🍦", Insect: "🐛", Ice: "🧊" },
  J: { Jam: "🫙", Jug: "🏺", Jellyfish: "🪼" },
  K: { Kite: "🪁", Key: "🔑", Kangaroo: "🦘" },
  L: { Lion: "🦁", Leaf: "🍃", Lamp: "💡" },
  M: { Mango: "🥭", Mouse: "🐭", Milk: "🥛" },
  N: { Nest: "🪺", Nose: "👃", Net: "🥅" },
  O: { Octopus: "🐙", Orange: "🍊", Owl: "🦉" },
  P: { Parrot: "🦜", Pencil: "✏️", Panda: "🐼" },
  Q: { Queen: "👑", Quilt: "🛏️", Quill: "🪶" },
  R: { Rabbit: "🐰", Rose: "🌹", Ring: "💍" },
  S: { Sun: "☀️", Star: "⭐", Snake: "🐍" },
  T: { Tree: "🌳", Tiger: "🐯", Train: "🚂" },
  U: { Umbrella: "☂️", Uniform: "👕", Utensils: "🍴" },
  V: { Van: "🚐", Violin: "🎻", Volcano: "🌋" },
  W: { Watch: "⌚", Whale: "🐳", Window: "🪟" },
  X: { Xylophone: "🎼", "X-ray": "🩻", Fox: "🦊" },
  Y: { Yak: "🐃", "Yo-yo": "🪀", Yellow: "🟡" },
  Z: { Zebra: "🦓", Zip: "🤐", Zoo: "🦒" },
};

/** Must match `artworkSlug()` in src/content/artwork.ts. */
function slugify(word) {
  return word.toLowerCase().replace(/[^a-z0-9]/g, "");
}

/** Stable pastel hue per word, so the set looks varied but never garish. */
function hueFor(word) {
  let hash = 0;
  for (const char of word) hash = (hash * 31 + char.codePointAt(0)) % 360;
  return hash;
}

const EMOJI_FONTS = [
  "Apple Color Emoji",
  "Segoe UI Emoji",
  "Noto Color Emoji",
  "Android Emoji",
  "sans-serif",
].join(", ");

function svgFor(word, emoji) {
  const hue = hueFor(word);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128" role="img" aria-label="${word}">
  <rect width="128" height="128" rx="20" fill="hsl(${hue} 70% 93%)"/>
  <circle cx="64" cy="62" r="44" fill="hsl(${hue} 75% 97%)"/>
  <text x="64" y="66" font-size="66" text-anchor="middle" dominant-baseline="central" font-family="${EMOJI_FONTS}">${emoji}</text>
</svg>
`;
}

async function main() {
  const requested = process.argv.slice(2).map((letter) => letter.toUpperCase());
  const letters = requested.length ? requested : Object.keys(ARTWORK);

  await mkdir(OUT_DIR, { recursive: true });

  let written = 0;
  for (const letter of letters) {
    const words = ARTWORK[letter];
    if (!words) {
      console.warn(`No artwork defined for "${letter}" — skipping.`);
      continue;
    }

    for (const [word, emoji] of Object.entries(words)) {
      const file = path.join(OUT_DIR, `${slugify(word)}.svg`);
      await writeFile(file, svgFor(word, emoji), "utf8");
      written += 1;
    }
  }

  console.log(
    `Wrote ${written} file(s) to ${path.relative(ROOT, OUT_DIR)} for: ${letters.join(", ")}`,
  );
}

await main();
