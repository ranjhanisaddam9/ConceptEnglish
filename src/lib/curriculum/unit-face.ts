import { picturePath } from "@/content/artwork";

import type { Unit } from "./types";

/**
 * How a unit presents itself on the dashboard and in the side panel.
 *
 * A five-year-old picks a unit by its colour and its picture long before they
 * can read "R-Controlled Vowels". Both are derived from what the unit teaches
 * — never from its slug — so an eighth unit gets a face without an edit here,
 * and the colour a card wears is the same colour its dot wears in the panel.
 */

/** Matches the ramps defined in globals.css. */
export const UNIT_ACCENTS = [
  "coral",
  "blue",
  "green",
  "amber",
  "violet",
  "teal",
] as const;

export type UnitAccent = (typeof UNIT_ACCENTS)[number];

export type UnitFace = Pick<
  Unit,
  "kind" | "letterGroup" | "patternSet" | "orderIndex"
>;

/**
 * The card's colour.
 *
 * Position in the course rather than subject matter: the point is that two
 * cards sitting side by side never wear the same colour, which is what makes
 * the grid scannable at a glance.
 */
export function unitAccent(unit: Pick<UnitFace, "orderIndex">): UnitAccent {
  const index = Math.max(0, unit.orderIndex - 1);
  return UNIT_ACCENTS[index % UNIT_ACCENTS.length];
}

/**
 * A word from the unit's own vocabulary, drawn from the built-in artwork.
 *
 * Picked so the picture is something the unit actually teaches — "ship" is a
 * digraph word, "bird" is r-controlled — rather than generic classroom
 * clip-art. Falls back to a star for a kind with nothing better to say.
 */
function mascotWord(unit: Pick<UnitFace, "kind" | "letterGroup" | "patternSet">) {
  switch (unit.kind) {
    case "letters":
      return "apple";
    case "phonics":
      return unit.letterGroup === "vowel" ? "ant" : "bee";
    case "word_patterns":
      switch (unit.patternSet) {
        case "short_vowels":
          return "cat";
        case "digraphs":
          return "ship";
        case "blends":
          return "block";
        case "vowel_teams":
          return "boat";
        case "r_controlled":
          return "bird";
        default:
          return "star";
      }
    default:
      return "star";
  }
}

/** Path to the unit's mascot picture, under `public/curriculum/examples`. */
export function unitMascot(
  unit: Pick<UnitFace, "kind" | "letterGroup" | "patternSet">,
) {
  return picturePath(mascotWord(unit));
}
