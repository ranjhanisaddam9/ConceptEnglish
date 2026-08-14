/**
 * Translation between database rows (snake_case) and domain objects
 * (camelCase). Keeping this in one place means the rest of the app never sees
 * a raw row shape.
 */

import type {
  ContentExampleRow,
  ContentItemRow,
  UnitRow,
} from "@/lib/supabase/database.types";

import { UNIT_KINDS } from "./types";
import type {
  ContentExample,
  ContentItem,
  Unit,
  UnitKind,
} from "./types";

function toUnitKind(value: string): UnitKind {
  return (UNIT_KINDS as readonly string[]).includes(value)
    ? (value as UnitKind)
    : "custom";
}

export function toUnit(row: UnitRow): Unit {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    kind: toUnitKind(row.kind),
    description: row.description,
    orderIndex: row.order_index,
    isPublished: row.is_published,
  };
}

export function toContentExample(row: ContentExampleRow): ContentExample {
  return {
    id: row.id,
    itemId: row.item_id,
    label: row.label,
    imageUrl: row.image_url,
    audioUrl: row.audio_url,
    speechText: row.speech_text,
    orderIndex: row.order_index,
  };
}

export function toContentItem(
  row: ContentItemRow,
  examples: ContentExample[] = [],
): ContentItem {
  return {
    id: row.id,
    unitId: row.unit_id,
    primaryLabel: row.primary_label,
    secondaryLabel: row.secondary_label,
    illustrationUrl: row.illustration_url,
    audioUrl: row.audio_url,
    speechText: row.speech_text,
    orderIndex: row.order_index,
    tags: row.tags ?? [],
    examples,
  };
}

/** Order by `order_index`, falling back to label so ties stay deterministic. */
export function byOrderIndex<T extends { orderIndex: number }>(a: T, b: T) {
  return a.orderIndex - b.orderIndex;
}
