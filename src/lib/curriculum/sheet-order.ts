/**
 * Whether a printable sheet runs through the alphabet in order or shuffled.
 * Shared by every worksheet type so the control means the same thing on each.
 */

export const SHEET_ORDERS = ["sequential", "random"] as const;

export type SheetOrder = (typeof SHEET_ORDERS)[number];

export const SHEET_ORDER_OPTIONS = [
  {
    value: "sequential" as const,
    label: "Aa – Zz",
    description: "Letters in alphabetical order",
  },
  {
    value: "random" as const,
    label: "Random",
    description: "Letters shuffled across the pages",
  },
];

/**
 * Small seeded generator.
 *
 * Seeded rather than Math.random so the server and the browser render the
 * same sheet, and so a re-roll is a single state change rather than a source
 * of hydration mismatches.
 */
export function mulberry32(seed: number) {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffled<T>(values: T[], random: () => number): T[] {
  const copy = [...values];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * A fresh seed for a printable sheet.
 *
 * Deliberately impure, and called from a Server Component so it runs once per
 * request: reloading the page then yields a different sheet. Kept in a named
 * function so the intent is explicit rather than looking like a stray
 * Math.random() in a render path.
 */
export function randomSheetSeed(): number {
  return Math.floor(Math.random() * 1_000_000_000);
}

/** Splits a flat list of questions into pages. */
export function paginate<T>(questions: T[], perPage: number): T[][] {
  const pages: T[][] = [];
  for (let start = 0; start < questions.length; start += perPage) {
    pages.push(questions.slice(start, start + perPage));
  }
  return pages;
}
