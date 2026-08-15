# Concept English

A Kindergarten-to-Grade-1 English phonics course, built as a web app. Eight
units take a child from recognising letters to reading r-controlled vowels,
each with a browsable lesson page and — for the letter units — printable A4
worksheets.

## Running it

```bash
npm install
npm run dev
```

The app runs at `http://localhost:3000` with no configuration and no database.

| Script | What it does |
| --- | --- |
| `npm run dev` | Development server |
| `npm run build` | Production build |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | Type check |
| `node scripts/generate-artwork.mjs` | Regenerate every picture |

## How the content is organised

All teaching content lives in `src/content/`. There is no CMS and no database
to seed — editing a word list and reloading is the whole workflow.

- **`word-bank.ts`** — the vocabulary. CVC words, initial and final blends,
  digraphs, vowel teams, and r-controlled words. Each list carries a comment
  explaining what earns a word its place; read it before adding one.
- **`curriculum.ts`** — the eight units, and the code that turns those word
  lists into browsable items. Unit order is `orderIndex`; ids and slugs follow
  the same numbering.
- **`artwork.ts`** — where pictures live, and how a word maps to its file.

### The units

| # | Unit | What it groups by |
| --- | --- | --- |
| 1 | Letters | All 26, with three example words each |
| 2 | Consonants | The 21 consonants |
| 3 | Vowels | Pick a vowel — including the short `oo` of "book" — see its families |
| 4 | Consonant Digraph | `ch sh th wh ck` |
| 5 | Consonant Blends | Opening blend, final blend, or first letter |
| 6 | Vowel Teams | Long vowel (`VCe` and the teams), diphthong, `y` |
| 7 | R-Controlled Vowels | `ar or er ir ur` |

Units 3–7 share one component, `PatternBrowser`. A unit names a *pattern set*
in `src/lib/curriculum/patterns.ts` and the browser reads it, so adding an
eighth pattern unit means adding data, not a component.

A pattern set carries its own control: caption, button size, and whether the
navigator should reveal its items one after the next. Unit 3 is the set whose
control filters rather than re-cuts — picking a vowel reveals that vowel's
families beneath.

### Sequencing rules the content enforces

The order units are taught in is not decoration — later units rely on earlier
ones, and the builders enforce that rather than trusting the word lists:

- Unit 4 shows only short-vowel words no longer than five letters, so a digraph
  is the one new thing on the page.
- Unit 5 rejects vowel teams, magic e and open syllables via
  `isShortVowelWord()`, because all three are taught afterwards in Unit 6.
- Every example word in Units 1–3 must open with the sound the letter makes.
  "Ice" begins with the letter i but says /aɪ/, which teaches the opposite of
  what an i card is for. x is the exception and is taught at the end of a word.

## Artwork

Pictures are self-contained SVGs in `public/curriculum/examples/`, named after
the word (`apple.svg`). Most are an emoji on a tinted card; a handful — igloo,
ink, under, zip, jam, uniform, zigzag, lap — are drawn by hand because Unicode
has nothing that means the word.

Add a word to `scripts/generate-artwork.mjs` and re-run it. Two rules:

1. **No two words may share an emoji.** A matching worksheet with two identical
   pictures has no right answer.
2. **The emoji must mean the word.** 🫙 is a jar, not jam. 🖨️ is a printer, not
   "print".

To replace a placeholder with real illustration, overwrite the file. No code
changes.

The Word bank page (`/word-bank`) reads the folder at request time and reports
what actually exists, so it can never claim a picture the app does not have.

## Stack

Next.js 16 (App Router, Turbopack), React 19, TypeScript, Tailwind v4,
shadcn/ui. Worksheets are laid out in millimetres and print to A4 via
`@page { size: A4 }`.

Note that this Next.js version renames `middleware.ts` to `proxy.ts`. See
`AGENTS.md` — the docs bundled in `node_modules/next/dist/docs/` are the
authority, not older tutorials.

## Supabase (parked)

`supabase/` holds migrations, RLS policies and a seed, and
`src/lib/curriculum/queries.ts` has a Supabase branch beside every content-file
branch. None of it runs: the branches activate only when
`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are set.

The seed has drifted from `src/content/curriculum.ts` and would need
regenerating before use.

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

## Deploying

Push to GitHub and import the repo into Vercel. The build needs no environment
variables — artwork is committed, and content is compiled in. No git remote is
configured yet.

Each unit is labelled Kindergarten or Grade 1. Units 1–4 are the Kindergarten
course; 5–7 are Grade 1, and nobody should hand vowel teams to a five-year-old
because the front page says Kindergarten.

## Worksheets

Every sheet is laid out in millimetres and prints to A4. Units 1 and 2 have
letter sheets of their own; Units 3–7 share three built from their patterns:

- **Match pictures** — pictures one side, patterns the other, ruled across.
- **Write the letters** — the word with its pattern blanked onto ruling. A
  word-family unit blanks the *front* of the word instead, because swapping the
  opening sound is what a family teaches.
- **Read the words** — a grid to read aloud, deliberately without pictures.

Two rules the sheets depend on. Answers are **deranged**, never left level with
their own picture, or a child can rule straight across without reading. And a
matching sheet only ever uses words with a real picture file — every item
carries an `imageUrl` whether or not the file exists, so the truth comes from
`artworkInventory()` reading the folder, not from the content.

## Not built yet

- **Magic e maker** for Unit 6 — `can → cane`, `tap → tape`, two boxes and a
  picture each. Needs a new layout and a few word pairs (`hope`, `made`).
- **Sort sheets** — start/end, short/long, which-sound. Five sheets sharing one
  two-column layout.
- The admin shell. `/admin` was specified as a template dashboard for access
  control later, not CRUD.
