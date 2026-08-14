import "server-only";

import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createSupabaseServerClient } from "@/lib/supabase/server";

import { byOrderIndex, toContentExample, toContentItem, toUnit } from "./mappers";
import { CURRICULUM, findUnit } from "@/content/curriculum";
import type { ContentItem, Unit, UnitWithItems } from "./types";

/**
 * Read side of the curriculum.
 *
 * Today the app runs without a database: every function reads the in-repo
 * content in `src/content/curriculum.ts`. The Supabase branches below are the
 * seam for later — they activate as soon as the env vars are present, so no
 * page or component has to branch on "is the database set up".
 *
 * Content is fetched with three flat queries rather than one nested select.
 * Units are small (tens of rows), and flat queries keep the hand-maintained
 * database types honest without depending on relationship inference.
 */

export async function listUnits(): Promise<Unit[]> {
  if (!isSupabaseConfigured) {
    return CURRICULUM.map(
      (unit): Unit => ({
        id: unit.id,
        title: unit.title,
        slug: unit.slug,
        kind: unit.kind,
        description: unit.description,
        orderIndex: unit.orderIndex,
        isPublished: unit.isPublished,
      }),
    ).sort(byOrderIndex);
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("units")
    .select("*")
    .order("order_index", { ascending: true });

  if (error) throw new Error(`Failed to load units: ${error.message}`);
  return (data ?? []).map(toUnit);
}

export async function getUnitBySlug(slug: string): Promise<UnitWithItems | null> {
  if (!isSupabaseConfigured) return findUnit(slug);

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("units")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (error) throw new Error(`Failed to load unit "${slug}": ${error.message}`);
  if (!data) return null;

  const unit = toUnit(data);
  return { ...unit, items: await listItemsForUnit(unit.id) };
}

export async function getUnitById(id: string): Promise<UnitWithItems | null> {
  if (!isSupabaseConfigured) {
    return CURRICULUM.find((unit) => unit.id === id) ?? null;
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase
    .from("units")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(`Failed to load unit: ${error.message}`);
  if (!data) return null;

  const unit = toUnit(data);
  return { ...unit, items: await listItemsForUnit(unit.id) };
}

export async function listItemsForUnit(unitId: string): Promise<ContentItem[]> {
  if (!isSupabaseConfigured) {
    return CURRICULUM.find((unit) => unit.id === unitId)?.items ?? [];
  }

  const supabase = await createSupabaseServerClient();

  const { data: itemRows, error: itemError } = await supabase
    .from("content_items")
    .select("*")
    .eq("unit_id", unitId)
    .order("order_index", { ascending: true });

  if (itemError) {
    throw new Error(`Failed to load content items: ${itemError.message}`);
  }
  if (!itemRows?.length) return [];

  const { data: exampleRows, error: exampleError } = await supabase
    .from("content_examples")
    .select("*")
    .in(
      "item_id",
      itemRows.map((row) => row.id),
    )
    .order("order_index", { ascending: true });

  if (exampleError) {
    throw new Error(`Failed to load examples: ${exampleError.message}`);
  }

  const examplesByItem = new Map<string, ReturnType<typeof toContentExample>[]>();
  for (const row of exampleRows ?? []) {
    const example = toContentExample(row);
    const bucket = examplesByItem.get(example.itemId);
    if (bucket) bucket.push(example);
    else examplesByItem.set(example.itemId, [example]);
  }

  return itemRows
    .map((row) =>
      toContentItem(row, (examplesByItem.get(row.id) ?? []).sort(byOrderIndex)),
    )
    .sort(byOrderIndex);
}

export async function getItemById(itemId: string): Promise<ContentItem | null> {
  if (!isSupabaseConfigured) {
    return (
      CURRICULUM.flatMap((unit) => unit.items).find(
        (item) => item.id === itemId,
      ) ?? null
    );
  }

  const supabase = await createSupabaseServerClient();

  const { data: itemRow, error } = await supabase
    .from("content_items")
    .select("*")
    .eq("id", itemId)
    .maybeSingle();

  if (error) throw new Error(`Failed to load content item: ${error.message}`);
  if (!itemRow) return null;

  const { data: exampleRows, error: exampleError } = await supabase
    .from("content_examples")
    .select("*")
    .eq("item_id", itemId)
    .order("order_index", { ascending: true });

  if (exampleError) {
    throw new Error(`Failed to load examples: ${exampleError.message}`);
  }

  return toContentItem(
    itemRow,
    (exampleRows ?? []).map(toContentExample).sort(byOrderIndex),
  );
}

