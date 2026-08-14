/**
 * Domain types for curriculum content.
 *
 * These are deliberately generic: a "content item" is a letter in Unit 1, but
 * it will be a number in Unit 2 and a sight word in Unit 3 without any schema
 * or type changes. Unit-specific vocabulary ("uppercase", "lowercase") lives in
 * `display.ts`, not here.
 */

export const UNIT_KINDS = [
  "letters",
  "numbers",
  "sight_words",
  "phonics",
  "custom",
] as const;

export type UnitKind = (typeof UNIT_KINDS)[number];

/**
 * Which of an item's two labels to render.
 *
 * letters:     primary = "A",  secondary = "a"
 * numbers:     primary = "1",  secondary = "one"
 * sight_words: primary = "the", secondary = null
 */
export const LABEL_MODES = ["primary", "secondary", "both"] as const;

export type LabelMode = (typeof LABEL_MODES)[number];

export interface Unit {
  id: string;
  title: string;
  slug: string;
  kind: UnitKind;
  description: string | null;
  orderIndex: number;
  isPublished: boolean;
}

export interface ContentExample {
  id: string;
  itemId: string;
  /** The example word, e.g. "Apple". */
  label: string;
  imageUrl: string | null;
  /** Pre-recorded audio. When present it is played instead of using TTS. */
  audioUrl: string | null;
  /** Overrides the generated phrase (default: "A for Apple"). */
  speechText: string | null;
  orderIndex: number;
}

export interface ContentItem {
  id: string;
  unitId: string;
  /** "A" for letters, "1" for numbers, "the" for sight words. */
  primaryLabel: string;
  /** "a" for letters, "one" for numbers, null when a unit has no second form. */
  secondaryLabel: string | null;
  illustrationUrl: string | null;
  /** Pre-recorded audio. When present it is played instead of using TTS. */
  audioUrl: string | null;
  /** Overrides what TTS says (default: primaryLabel). */
  speechText: string | null;
  orderIndex: number;
  /**
   * Free-form labels a unit can filter by. Unit 1 tags each letter with its
   * writing zone ("grass" / "sky" / "root"); a numbers unit could tag "odd" /
   * "even" without any change here.
   */
  tags: string[];
  examples: ContentExample[];
}

export interface UnitWithItems extends Unit {
  items: ContentItem[];
}

/** How many examples per item the admin UI encourages. Not a schema limit. */
export const RECOMMENDED_EXAMPLES_PER_ITEM = 3;
