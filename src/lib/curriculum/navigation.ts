import type { ContentItem } from "./types";

/**
 * The items either side of the current one, wrapping at both ends.
 *
 * Wrapping matches the arrow-key behaviour of ItemNav, so stepping never hits
 * a dead end mid-lesson.
 */
export function getNeighbours(
  items: ContentItem[],
  selectedItemId: string | null,
): { previous: ContentItem; next: ContentItem } | null {
  if (items.length < 2) return null;

  const index = Math.max(
    0,
    items.findIndex((item) => item.id === selectedItemId),
  );

  return {
    previous: items[(index - 1 + items.length) % items.length],
    next: items[(index + 1) % items.length],
  };
}
