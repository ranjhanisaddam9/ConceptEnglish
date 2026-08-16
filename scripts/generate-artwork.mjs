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
  A: { Apple: "🍎", Ant: "🐜", Ambulance: "🚑" },
  B: { Ball: "⚽", Bat: "🦇", Banana: "🍌" },
  C: { Cat: "🐱", Car: "🚗", Cake: "🍰" },
  D: { Dog: "🐶", Duck: "🦆", Drum: "🥁" },
  E: { Egg: "🥚", Elephant: "🐘", Envelope: "✉️" },
  F: { Fish: "🐟", Frog: "🐸", Flower: "🌻" },
  G: { Goat: "🐐", Grapes: "🍇", Guitar: "🎸" },
  H: { Hat: "🎩", Horse: "🐴", House: "🏠" },
  // Igloo and Ink are drawn by hand — see CUSTOM_ART.
  I: { Igloo: "", Insect: "🐛", Ink: "" },
  J: { Jam: "🫙", Jug: "🏺", Jellyfish: "🪼" },
  K: { Kite: "🪁", Key: "🔑", Kangaroo: "🦘" },
  L: { Lion: "🦁", Leaf: "🍃", Lamb: "🐑" },
  M: { Mango: "🥭", Mouse: "🐭", Milk: "🥛" },
  N: { Nest: "🪺", Nose: "👃", Net: "🥅" },
  O: { Octopus: "🐙", Orange: "🍊", Otter: "🦦" },
  P: { Parrot: "🦜", Pencil: "✏️", Panda: "🐼" },
  Q: { Queen: "👑", Quilt: "🛏️", Quill: "🪶" },
  R: { Rabbit: "🐰", Rose: "🌹", Ring: "💍" },
  S: { Sun: "☀️", Star: "⭐", Snake: "🐍" },
  T: { Tree: "🌳", Tiger: "🐯", Train: "🚂" },
  // Under is drawn by hand — see CUSTOM_ART.
  U: { Umbrella: "☂️", Up: "⬆️", Under: "" },
  V: { Van: "🚐", Violin: "🎻", Volcano: "🌋" },
  W: { Watch: "⌚", Web: "🕸️", Window: "🪟" },
  // x is taught at the end of a word; these are the same files the CVC unit
  // uses, so they are listed here and not in WORD_ART.
  X: { Box: "📦", Fox: "🦊", Six: "6️⃣" },
  Y: { Yacht: "⛵", "Yo-yo": "🪀", Yolk: "🍳" },
  Z: { Zebra: "🦓", Zip: "🤐", Zigzag: "➰" },
};

/**
 * Vocabulary artwork: CVC, blend and digraph words from the word bank.
 *
 * Separate from ARTWORK above because these are not tied to a letter — they
 * exist so the word-family and blend sheets have pictures to work with.
 *
 * Every emoji here is distinct. Two words sharing one picture (a mug and a cup
 * are both ☕) would be indistinguishable on a matching sheet, so where two
 * words compete for the same emoji only one is listed.
 */
const WORD_ART = {
  // --- CVC ---
  // "box", "fox", "six", "web" and "watch" are drawn by the letter map above,
  // and the file is named after the word, so they are already found here.
  bag: "🎒", bed: "🛏️", bin: "🗑️", bug: "🐞", bun: "🥐", bus: "🚌",
  cab: "🚕", can: "🥫", cap: "🧢", cup: "☕", cut: "✂️",
  dad: "👨", dig: "⛏️", dot: "⚫",
  fan: "🪭", fog: "🌫️",
  gas: "⛽",
  hen: "🐔", hot: "🔥", hug: "🤗", hut: "🛖",
  jab: "🥊",
  kid: "🧒", kit: "🧰",
  // "lap" is drawn by hand — see CUSTOM_ART.
  lab: "🔬", lap: "", leg: "🦵", lip: "👄", log: "🪵",
  mad: "😠", man: "🧍", map: "🗺️", men: "👬", mop: "🧹",
  nap: "😴", nut: "🥜",
  pad: "📝", pan: "🥘", pen: "🖊️", pet: "🐕", pin: "📌", pot: "🍲",
  ram: "🐏", rat: "🐀", red: "🟥", run: "🏃",
  sad: "😢", sob: "😭",
  // "tin" shares its picture with "can", so only "can" carries one.
  tag: "🏷️", tap: "🚰", ten: "🔟", tub: "🛁",
  vet: "🩺",
  wax: "🕯️", win: "🏆",
  // Homes for pictures the letter cards no longer own: "ice" and "whale" are
  // magic-e words, "owl" is a diphthong.
  ice: "🧊", whale: "🐳", owl: "🦉",

  // Words filling out the thin word families. Only the ones a five-year-old
  // can name from the picture alone — "hit", "sit" and "rub" are actions with
  // nothing to draw, so they carry a tinted tile instead.
  fix: "🔧", mix: "🥣", job: "👷", sum: "➕", bud: "🌱", yam: "🍠",
  ladder: "🪜", farmer: "🧑‍🌾",
  // New blend words.
  cliff: "⛰️", clip: "📎", plug: "🔌", trap: "🪤",

  // --- Final blends ---
  hand: "✋", bank: "🏦", pink: "🩷", wink: "😉", tent: "⛺",
  camp: "🏕️", lamp: "💡", mask: "🎭", vest: "🦺", fist: "✊",
  salt: "🧂", wind: "💨",

  // --- R-controlled vowels ---
  arm: "💪", card: "🃏", dark: "🌑", farm: "🚜", shark: "🦈",
  corn: "🌽", fork: "🍴", horn: "📯", storm: "⛈️", torch: "🔦",
  bird: "🐦", girl: "👧", shirt: "👕",
  hurt: "🤕", nurse: "🧑‍⚕️", purse: "👛", surf: "🏄",

  // --- Double o and y ---
  moon: "🌙", boot: "🥾", tooth: "🦷",
  book: "📕", cook: "👨‍🍳", hook: "🪝", look: "👀", wool: "🧶",
  fly: "🪰", baby: "👶", jelly: "🍮",

  // --- Blends ---
  black: "⬛", block: "🧱", blue: "🟦",
  bread: "🍞", bridge: "🌉", brown: "🟫", brush: "🖌️",
  clap: "👏", climb: "🧗", clock: "🕐", cloud: "☁️",
  crab: "🦀", crayon: "🖍️", crow: "🐦‍⬛", crown: "👑",
  dragon: "🐉", dress: "👗", drink: "🥤", drop: "💧",
  flag: "🚩",
  frame: "🖼️", friend: "👫",
  globe: "🌍", glove: "🧤",
  grass: "🌿", green: "🟩", grin: "😃",
  plane: "🛩️", plant: "🪴", plate: "🍽️",
  present: "🎁",
  scarf: "🧣", school: "🏫", scooter: "🛴",
  skate: "⛸️", ski: "🎿",
  sled: "🛷", slide: "🛝",
  smile: "😊",
  snail: "🐌", snow: "❄️",
  spider: "🕷️", spoon: "🥄",
  stamp: "📮", stop: "🛑",
  swan: "🦢", sweet: "🍬", swim: "🏊",
  truck: "🚚",
  twin: "👯",

  // --- Long vowels ---
  // Words already illustrated elsewhere (cake, snake, plate, skate, plane,
  // whale, train, snail, tree, three, sheep, green, queen, wheel, beach, leaf,
  // wheat, white, kite, slide, ice, phone, nose, rose, goat, snow, crow, blue)
  // are not repeated here — the file is named after the word, so they are
  // already found.
  lake: "🏞️", game: "🎮", scale: "⚖️", chain: "⛓️", rain: "🌧️",
  bee: "🐝", jeep: "🚙", feet: "🦶", sea: "🌊", tea: "🍵", pea: "🫛",
  peach: "🍑", meat: "🥩", seat: "💺",
  bike: "🚲", nine: "9️⃣", pine: "🌲", time: "⏰", five: "5️⃣", dive: "🤿",
  rice: "🍚",
  bone: "🦴", coat: "🧥", road: "🛣️", bow: "🎀", rope: "🪢", boat: "🛥️",
  flute: "🪈",
  bean: "🫘", mail: "📬", pail: "🪣", soap: "🧼",

  // --- Diphthongs ---
  coin: "🪙", boy: "👦", toy: "🧸",
  cow: "🐄", clown: "🤡", town: "🏘️",

  // --- Digraphs ---
  // Words that left the digraph list when it dropped to short vowels — sheep,
  // three, wheat, wheel, white, beach, phone — are still illustrated because
  // the long-vowel unit uses them.
  cherry: "🍒", chick: "🐤", chicken: "🐓", chip: "🍟",
  shell: "🐚", ship: "🚢", shop: "🏪",
  thumb: "👍",
  lunch: "🍱",
  lock: "🔒", rock: "🪨", sock: "🧦",
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

/** A zip, drawn open at the foot with the slider part-way down. */
function zipArt() {
  const teeth = [];
  for (let y = 20; y <= 62; y += 9) {
    // Alternating sides interlock into a closed chain.
    teeth.push(`<rect x="50" y="${y}" width="16" height="5" rx="2.5" fill="#e2e8f0"/>`);
    teeth.push(
      `<rect x="62" y="${y + 4.5}" width="16" height="5" rx="2.5" fill="#cbd5e1"/>`,
    );
  }

  return `
  <!-- tapes -->
  <rect x="34" y="14" width="20" height="100" rx="5" fill="#4a5568"/>
  <rect x="74" y="14" width="20" height="100" rx="5" fill="#4a5568"/>
  <!-- closed teeth -->
  ${teeth.join("\n  ")}
  <!-- slider and pull -->
  <rect x="46" y="70" width="36" height="18" rx="5" fill="#94a3b8" stroke="#475569" stroke-width="2"/>
  <rect x="57" y="88" width="14" height="22" rx="6" fill="none" stroke="#475569" stroke-width="5"/>`;
}

/** A school uniform: collared shirt with a tie. */
function uniformArt() {
  return `
  <!-- sleeves -->
  <path d="M42 48 L27 60 L35 74 L46 63 Z" fill="#33608f"/>
  <path d="M86 48 L101 60 L93 74 L82 63 Z" fill="#33608f"/>
  <!-- body -->
  <rect x="40" y="46" width="48" height="58" rx="7" fill="#4c86c6"/>
  <!-- collar -->
  <polygon points="48,46 64,64 60,42" fill="#f8fafc"/>
  <polygon points="80,46 64,64 68,42" fill="#f8fafc"/>
  <!-- tie -->
  <rect x="59.5" y="58" width="9" height="9" rx="2" fill="#b91c1c"/>
  <polygon points="60,67 68,67 66.5,90 64,96 61.5,90" fill="#dc2626"/>`;
}

/**
 * A lap: a child seated side-on with a book resting across their thighs.
 *
 * Drawn in profile because a lap only exists when someone is sitting — the
 * horizontal thigh under the book is the whole idea, and it reads at thumbnail
 * size where a front-on figure would not.
 */
function lapArt() {
  return `
  <!-- lower leg and foot, behind the body -->
  <rect x="83" y="82" width="15" height="31" rx="6" fill="#2b5079"/>
  <rect x="77" y="105" width="27" height="11" rx="5" fill="#3f4a5f"/>
  <!-- torso: a lighter shirt, so the seated bend is visible against the
       trousers rather than merging into one blue block -->
  <rect x="35" y="42" width="27" height="45" rx="10" fill="#5b9ad9"/>
  <!-- thigh: the lap itself -->
  <rect x="49" y="70" width="49" height="18" rx="9" fill="#2b5079"/>
  <!-- head -->
  <circle cx="48" cy="30" r="13" fill="#f2c6a0"/>
  <path d="M35 29a13 13 0 0 1 26 0 21 21 0 0 0-26 0Z" fill="#3f4a5f"/>
  <!-- book resting on the lap, outlined so it lifts off both -->
  <rect x="57" y="52" width="38" height="18" rx="2" fill="#c9372c"
    stroke="#fdf6ec" stroke-width="2.5"/>
  <rect x="60" y="63" width="32" height="5" rx="1.5" fill="#fdf6ec"/>
  <!-- arm reaching down to the book -->
  <path d="M58 50 L71 56" stroke="#f2c6a0" stroke-width="9" stroke-linecap="round"/>`;
}

/**
 * A jar of jam: red preserve behind glass, under a cloth-covered lid.
 *
 * Drawn because 🫙 is literally the *jar* emoji — an empty one. It was standing
 * in for "jam", which left nothing for "jar" itself and never showed the jam.
 */
function jamArt() {
  return `
  <!-- jar body -->
  <rect x="38" y="44" width="52" height="64" rx="11" fill="#eef2f7"
    stroke="#8b98a9" stroke-width="2.5"/>
  <!-- the jam, filling all but the top -->
  <path d="M40.5 64 H87.5 V97 a9 9 0 0 1-9 9 H49.5 a9 9 0 0 1-9-9 Z" fill="#b52c4c"/>
  <rect x="47" y="72" width="34" height="19" rx="3" fill="#fdf6ec"/>
  <!-- neck, then the cloth cover tied over it -->
  <rect x="45" y="34" width="38" height="12" rx="4" fill="#e2e8f0"
    stroke="#8b98a9" stroke-width="2.5"/>
  <path d="M42 37 C46 16, 82 16, 86 37 Z" fill="#dc6a63"/>
  <circle cx="55" cy="29" r="2.5" fill="#fdf6ec"/>
  <circle cx="66" cy="25" r="2.5" fill="#fdf6ec"/>
  <circle cx="76" cy="30" r="2.5" fill="#fdf6ec"/>
  <rect x="42" y="34" width="44" height="5" rx="2.5" fill="#8a5a3b"/>`;
}

/**
 * An igloo: a snow dome of stacked blocks with an arched tunnel.
 *
 * Drawn because Unicode has no igloo, and short i has almost no picturable
 * word — every emoji candidate (ice, icecream) says long i instead.
 */
function iglooArt() {
  return `
  <rect x="14" y="98" width="100" height="14" rx="7" fill="#cfe3fb"/>
  <path d="M18 100 A46 44 0 0 1 110 100 Z" fill="#f8fafc"
    stroke="#7c8b9e" stroke-width="3"/>
  <!-- block courses, each cut to the width of the dome at that height -->
  <path d="M23 80 H105 M38 64 H90" stroke="#bcc9d8" stroke-width="2.2"/>
  <path d="M41 100 V80 M64 100 V80 M87 100 V80 M50 80 V64 M78 80 V64"
    stroke="#bcc9d8" stroke-width="2.2"/>
  <path d="M52 100 A12 16 0 0 1 76 100 Z" fill="#5b6b7f"/>`;
}

/** A bottle of ink with a drop falling beside it. */
function inkArt() {
  return `
  <path d="M38 60 H90 V96 a10 10 0 0 1-10 10 H48 a10 10 0 0 1-10-10 Z"
    fill="#dbeafe" stroke="#64748b" stroke-width="2.5"/>
  <path d="M40.5 74 H87.5 V96 a8 8 0 0 1-8 8 H48.5 a8 8 0 0 1-8-8 Z"
    fill="#1e3a8a"/>
  <rect x="54" y="46" width="20" height="16" rx="3" fill="#dbeafe"
    stroke="#64748b" stroke-width="2.5"/>
  <rect x="48" y="34" width="32" height="13" rx="4" fill="#334155"/>
  <path d="M101 48 C107 58 107 63 101 67 C95 63 95 58 101 48 Z" fill="#1e3a8a"/>`;
}

/**
 * Under: a ball beneath a table.
 *
 * A preposition needs a relationship drawn, not an object — the ball only
 * means "under" because the table is above it.
 */
function underArt() {
  return `
  <rect x="18" y="103" width="92" height="8" rx="4" fill="#e2e8f0"/>
  <rect x="24" y="50" width="80" height="11" rx="4" fill="#b98a5a"/>
  <rect x="30" y="61" width="9" height="43" rx="3" fill="#8a5a3b"/>
  <rect x="89" y="61" width="9" height="43" rx="3" fill="#8a5a3b"/>
  <circle cx="64" cy="87" r="16" fill="#dc6a63"/>
  <path d="M48 87 h32" stroke="#fdf6ec" stroke-width="2.5"/>
  <path d="M64 71 a22 22 0 0 1 0 32" fill="none" stroke="#fdf6ec"
    stroke-width="2.5"/>`;
}

/** A bold zigzag stroke. */
function zigzagArt() {
  return `
  <polyline points="26,86 45,40 64,86 83,40 102,86" fill="none"
    stroke="#3f4a5f" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>`;
}

/**
 * Words drawn by hand because no emoji depicts them.
 *
 * Unicode has no zipper — the nearest is a zipper-mouth *face* — and nothing
 * depicts a zigzag either, so both shapes are drawn instead, on the same
 * tinted card as the emoji artwork.
 */
const CUSTOM_ART = {
  Zip: zipArt,
  Zigzag: zigzagArt,
  // 👕 reads as "t-shirt", not "uniform".
  Uniform: uniformArt,
  // Nothing in Unicode is a lap; the nearest, 🦵, is just a leg.
  lap: lapArt,
  // 🫙 is an empty jar — it belongs to "jar", not to "jam".
  Jam: jamArt,
  // Short i and short u are the two letters with almost nothing picturable.
  Igloo: iglooArt,
  Ink: inkArt,
  Under: underArt,
};

function svgFor(word, emoji) {
  const hue = hueFor(word);
  const custom = CUSTOM_ART[word];
  const art = custom
    ? custom()
    : `<text x="64" y="66" font-size="66" text-anchor="middle" dominant-baseline="central" font-family="${EMOJI_FONTS}">${emoji}</text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128" width="128" height="128" role="img" aria-label="${word}">
  <rect width="128" height="128" rx="20" fill="hsl(${hue} 70% 93%)"/>
  <circle cx="64" cy="62" r="44" fill="hsl(${hue} 75% 97%)"/>
  ${art}
</svg>
`;
}

async function write(word, emoji) {
  await writeFile(
    path.join(OUT_DIR, `${slugify(word)}.svg`),
    svgFor(word, emoji),
    "utf8",
  );
}

async function main() {
  const args = process.argv.slice(2);
  // "words" selects the vocabulary set; bare letters select letter examples.
  const wordsOnly = args.includes("words");
  const requested = args
    .filter((arg) => arg !== "words")
    .map((letter) => letter.toUpperCase());

  await mkdir(OUT_DIR, { recursive: true });

  let written = 0;

  if (!wordsOnly) {
    const letters = requested.length ? requested : Object.keys(ARTWORK);
    for (const letter of letters) {
      const words = ARTWORK[letter];
      if (!words) {
        console.warn(`No artwork defined for "${letter}" — skipping.`);
        continue;
      }
      for (const [word, emoji] of Object.entries(words)) {
        await write(word, emoji);
        written += 1;
      }
    }
  }

  // The vocabulary set comes along on a full run, and on an explicit "words".
  if (wordsOnly || requested.length === 0) {
    for (const [word, emoji] of Object.entries(WORD_ART)) {
      await write(word, emoji);
      written += 1;
    }
  }

  console.log(`Wrote ${written} file(s) to ${path.relative(ROOT, OUT_DIR)}.`);
}

await main();
