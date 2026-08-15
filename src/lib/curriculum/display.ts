/**
 * Presentation helpers that translate the generic domain model into the
 * vocabulary of a specific unit kind.
 *
 * This is the one file that knows "primary label means uppercase in a letters
 * unit". Adding Unit 2 means adding a branch here, not a new page component.
 */

import type {
  ContentExample,
  ContentItem,
  LabelMode,
  UnitKind,
} from "./types";

export interface LabelModeOption {
  value: LabelMode;
  /** Short label for the toggle control, e.g. "Uppercase". */
  label: string;
  /** Accessible description, e.g. "Show capital letters". */
  description: string;
}

const LABEL_MODE_OPTIONS: Record<UnitKind, LabelModeOption[]> = {
  letters: [
    { value: "primary", label: "Uppercase", description: "Show capital letters" },
    { value: "secondary", label: "Lowercase", description: "Show small letters" },
    { value: "both", label: "Both", description: "Show capital and small letters" },
  ],
  numbers: [
    { value: "primary", label: "Numeral", description: "Show the digit" },
    { value: "secondary", label: "Word", description: "Show the number word" },
    { value: "both", label: "Both", description: "Show the digit and the word" },
  ],
  sight_words: [
    { value: "primary", label: "Word", description: "Show the word" },
    { value: "secondary", label: "Alternate", description: "Show the alternate form" },
    { value: "both", label: "Both", description: "Show both forms" },
  ],
  // A phonics unit works through the same letters, so it uses the same words
  // for their two forms.
  phonics: [
    { value: "primary", label: "Uppercase", description: "Show capital letters" },
    { value: "secondary", label: "Lowercase", description: "Show small letters" },
    { value: "both", label: "Both", description: "Show capital and small letters" },
  ],
  // A pattern unit's items are patterns — "-ab", "a", "bl", "sh" — which have
  // only one form. The unit offers a pattern toggle instead; see `patterns.ts`.
  word_patterns: [
    { value: "primary", label: "Pattern", description: "Show the pattern" },
  ],
  custom: [
    { value: "primary", label: "Primary", description: "Show the primary form" },
    { value: "secondary", label: "Secondary", description: "Show the secondary form" },
    { value: "both", label: "Both", description: "Show both forms" },
  ],
};

export function labelModeOptions(
  kind: UnitKind,
  items: Pick<ContentItem, "secondaryLabel">[] = [],
): LabelModeOption[] {
  const options = LABEL_MODE_OPTIONS[kind] ?? LABEL_MODE_OPTIONS.custom;
  // A unit whose items have no second form (sight words, phonics blends)
  // should not offer modes that would render nothing.
  const hasSecondary = items.some((item) => Boolean(item.secondaryLabel?.trim()));
  if (items.length > 0 && !hasSecondary) {
    return options.filter((option) => option.value === "primary");
  }
  return options;
}

/** The text to display for an item under the current mode, e.g. "A" / "a" / "Aa". */
export function itemLabel(
  item: Pick<ContentItem, "primaryLabel" | "secondaryLabel">,
  mode: LabelMode,
): string {
  const primary = item.primaryLabel;
  const secondary = item.secondaryLabel?.trim() || null;

  if (!secondary) return primary;

  switch (mode) {
    case "primary":
      return primary;
    case "secondary":
      return secondary;
    case "both":
      return `${primary}${secondary}`;
  }
}

/**
 * The text to display for an example word under the current mode.
 *
 * Only letter units re-case example words — "APPLE" / "apple" / "Apple". For
 * every other unit kind the word is shown exactly as it was entered.
 */
export function exampleLabel(
  example: Pick<ContentExample, "label">,
  mode: LabelMode,
  kind: UnitKind,
): string {
  if (kind !== "letters") return example.label;

  switch (mode) {
    case "primary":
      return example.label.toUpperCase();
    case "secondary":
      return example.label.toLowerCase();
    case "both":
      return example.label;
  }
}

/** What the item's sound button should say. */
export function itemSpeechText(
  item: Pick<ContentItem, "primaryLabel" | "speechText">,
): string {
  return item.speechText?.trim() || item.primaryLabel;
}

/** What an example's sound button should say, e.g. "A for Apple". */
export function exampleSpeechText(
  item: Pick<ContentItem, "primaryLabel">,
  example: Pick<ContentExample, "label" | "speechText">,
): string {
  return example.speechText?.trim() || `${item.primaryLabel} for ${example.label}`;
}

/**
 * A stable pastel background for an item or example that has no artwork yet,
 * so a freshly seeded page still looks intentional rather than broken.
 */
export function placeholderTint(seed: string): string {
  let hash = 0;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 31 + seed.charCodeAt(i)) % 360;
  }
  return `oklch(0.92 0.07 ${hash})`;
}
