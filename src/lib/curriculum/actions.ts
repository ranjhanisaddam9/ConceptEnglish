"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { createSupabaseServerClient } from "@/lib/supabase/server";

import { actionError, actionOk, type ActionResult } from "./action-result";
import { getAdminSession } from "./admin";
import {
  exampleFormSchema,
  itemFormSchema,
  unitFormSchema,
  type ExampleFormValues,
  type ItemFormValues,
  type UnitFormValues,
} from "./schemas";

/**
 * Write side of the curriculum. Every mutation re-checks the caller is an
 * admin: RLS is the real gate, this just produces a readable error instead of
 * a silent zero-row update.
 */

const DUPLICATE_KEY = "23505";

async function withAdmin<T>(
  run: (
    supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  ) => Promise<ActionResult<T>>,
): Promise<ActionResult<T>> {
  const session = await getAdminSession();

  switch (session.state) {
    case "unconfigured":
      return actionError(
        "Supabase is not configured. Add your project keys to .env.local.",
      );
    case "signed-out":
      return actionError("Your session expired. Please sign in again.");
    case "not-authorised":
      return actionError(
        "This account is not on the admin list. Add it to the admin_users table.",
      );
    case "admin":
      return run(await createSupabaseServerClient());
  }
}

/** Public pages and admin lists both need refreshing after any write. */
function revalidateCurriculum() {
  revalidatePath("/curriculum", "layout");
  revalidatePath("/admin", "layout");
}

function describe(error: { code?: string; message: string }, fallback: string) {
  if (error.code === DUPLICATE_KEY) {
    return "That slug is already in use. Pick a different one.";
  }
  return `${fallback} (${error.message})`;
}

// ---------------------------------------------------------------------------
// Units
// ---------------------------------------------------------------------------

export async function createUnitAction(
  values: UnitFormValues,
): Promise<ActionResult<{ id: string }>> {
  const parsed = unitFormSchema.safeParse(values);
  if (!parsed.success) return actionError("Please fix the highlighted fields.");

  return withAdmin(async (supabase) => {
    const { data, error } = await supabase
      .from("units")
      .insert({
        title: parsed.data.title,
        slug: parsed.data.slug,
        kind: parsed.data.kind,
        description: parsed.data.description,
        order_index: parsed.data.orderIndex,
        is_published: parsed.data.isPublished,
      })
      .select("id")
      .single();

    if (error) return actionError(describe(error, "Could not create the unit."));

    revalidateCurriculum();
    return actionOk({ id: data.id });
  });
}

export async function updateUnitAction(
  unitId: string,
  values: UnitFormValues,
): Promise<ActionResult> {
  const parsed = unitFormSchema.safeParse(values);
  if (!parsed.success) return actionError("Please fix the highlighted fields.");

  return withAdmin(async (supabase) => {
    const { error } = await supabase
      .from("units")
      .update({
        title: parsed.data.title,
        slug: parsed.data.slug,
        kind: parsed.data.kind,
        description: parsed.data.description,
        order_index: parsed.data.orderIndex,
        is_published: parsed.data.isPublished,
      })
      .eq("id", unitId);

    if (error) return actionError(describe(error, "Could not save the unit."));

    revalidateCurriculum();
    return actionOk();
  });
}

export async function deleteUnitAction(
  unitId: string,
): Promise<ActionResult> {
  return withAdmin(async (supabase) => {
    // Items and examples cascade via the foreign keys.
    const { error } = await supabase.from("units").delete().eq("id", unitId);
    if (error) return actionError(describe(error, "Could not delete the unit."));

    revalidateCurriculum();
    return actionOk();
  });
}

// ---------------------------------------------------------------------------
// Content items
// ---------------------------------------------------------------------------

export async function createItemAction(
  unitId: string,
  values: ItemFormValues,
): Promise<ActionResult<{ id: string }>> {
  const parsed = itemFormSchema.safeParse(values);
  if (!parsed.success) return actionError("Please fix the highlighted fields.");

  return withAdmin(async (supabase) => {
    const { data, error } = await supabase
      .from("content_items")
      .insert({
        unit_id: unitId,
        primary_label: parsed.data.primaryLabel,
        secondary_label: parsed.data.secondaryLabel,
        illustration_url: parsed.data.illustrationUrl,
        audio_url: parsed.data.audioUrl,
        speech_text: parsed.data.speechText,
        order_index: parsed.data.orderIndex,
      })
      .select("id")
      .single();

    if (error) return actionError(describe(error, "Could not add the item."));

    revalidateCurriculum();
    return actionOk({ id: data.id });
  });
}

export async function updateItemAction(
  itemId: string,
  values: ItemFormValues,
): Promise<ActionResult> {
  const parsed = itemFormSchema.safeParse(values);
  if (!parsed.success) return actionError("Please fix the highlighted fields.");

  return withAdmin(async (supabase) => {
    const { error } = await supabase
      .from("content_items")
      .update({
        primary_label: parsed.data.primaryLabel,
        secondary_label: parsed.data.secondaryLabel,
        illustration_url: parsed.data.illustrationUrl,
        audio_url: parsed.data.audioUrl,
        speech_text: parsed.data.speechText,
        order_index: parsed.data.orderIndex,
      })
      .eq("id", itemId);

    if (error) return actionError(describe(error, "Could not save the item."));

    revalidateCurriculum();
    return actionOk();
  });
}

export async function deleteItemAction(itemId: string): Promise<ActionResult> {
  return withAdmin(async (supabase) => {
    const { error } = await supabase
      .from("content_items")
      .delete()
      .eq("id", itemId);

    if (error) return actionError(describe(error, "Could not delete the item."));

    revalidateCurriculum();
    return actionOk();
  });
}

export async function moveItemAction(
  itemId: string,
  direction: "up" | "down",
): Promise<ActionResult> {
  return withAdmin(async (supabase) => {
    const { data: item, error: loadError } = await supabase
      .from("content_items")
      .select("id, unit_id")
      .eq("id", itemId)
      .single();

    if (loadError) return actionError(describe(loadError, "Could not reorder."));

    const { data: siblings, error: siblingError } = await supabase
      .from("content_items")
      .select("id, order_index")
      .eq("unit_id", item.unit_id)
      .order("order_index", { ascending: true })
      .order("created_at", { ascending: true });

    if (siblingError) {
      return actionError(describe(siblingError, "Could not reorder."));
    }

    const reordered = swapNeighbour(
      siblings.map((row) => row.id),
      itemId,
      direction,
    );
    if (!reordered) return actionOk();

    const error = await renumber(supabase, "content_items", reordered);
    if (error) return actionError(describe(error, "Could not reorder."));

    revalidateCurriculum();
    return actionOk();
  });
}

// ---------------------------------------------------------------------------
// Examples
// ---------------------------------------------------------------------------

export async function createExampleAction(
  itemId: string,
  values: ExampleFormValues,
): Promise<ActionResult<{ id: string }>> {
  const parsed = exampleFormSchema.safeParse(values);
  if (!parsed.success) return actionError("Please fix the highlighted fields.");

  return withAdmin(async (supabase) => {
    const { data, error } = await supabase
      .from("content_examples")
      .insert({
        item_id: itemId,
        label: parsed.data.label,
        image_url: parsed.data.imageUrl,
        audio_url: parsed.data.audioUrl,
        speech_text: parsed.data.speechText,
        order_index: parsed.data.orderIndex,
      })
      .select("id")
      .single();

    if (error) return actionError(describe(error, "Could not add the word."));

    revalidateCurriculum();
    return actionOk({ id: data.id });
  });
}

export async function updateExampleAction(
  exampleId: string,
  values: ExampleFormValues,
): Promise<ActionResult> {
  const parsed = exampleFormSchema.safeParse(values);
  if (!parsed.success) return actionError("Please fix the highlighted fields.");

  return withAdmin(async (supabase) => {
    const { error } = await supabase
      .from("content_examples")
      .update({
        label: parsed.data.label,
        image_url: parsed.data.imageUrl,
        audio_url: parsed.data.audioUrl,
        speech_text: parsed.data.speechText,
        order_index: parsed.data.orderIndex,
      })
      .eq("id", exampleId);

    if (error) return actionError(describe(error, "Could not save the word."));

    revalidateCurriculum();
    return actionOk();
  });
}

export async function deleteExampleAction(
  exampleId: string,
): Promise<ActionResult> {
  return withAdmin(async (supabase) => {
    const { error } = await supabase
      .from("content_examples")
      .delete()
      .eq("id", exampleId);

    if (error) return actionError(describe(error, "Could not delete the word."));

    revalidateCurriculum();
    return actionOk();
  });
}

export async function moveExampleAction(
  exampleId: string,
  direction: "up" | "down",
): Promise<ActionResult> {
  return withAdmin(async (supabase) => {
    const { data: example, error: loadError } = await supabase
      .from("content_examples")
      .select("id, item_id")
      .eq("id", exampleId)
      .single();

    if (loadError) return actionError(describe(loadError, "Could not reorder."));

    const { data: siblings, error: siblingError } = await supabase
      .from("content_examples")
      .select("id, order_index")
      .eq("item_id", example.item_id)
      .order("order_index", { ascending: true })
      .order("created_at", { ascending: true });

    if (siblingError) {
      return actionError(describe(siblingError, "Could not reorder."));
    }

    const reordered = swapNeighbour(
      siblings.map((row) => row.id),
      exampleId,
      direction,
    );
    if (!reordered) return actionOk();

    const error = await renumber(supabase, "content_examples", reordered);
    if (error) return actionError(describe(error, "Could not reorder."));

    revalidateCurriculum();
    return actionOk();
  });
}

// ---------------------------------------------------------------------------
// Auth
// ---------------------------------------------------------------------------

export async function signOutAction() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}

// ---------------------------------------------------------------------------
// Ordering helpers
// ---------------------------------------------------------------------------

/** Returns the new id order, or null when the move would fall off the end. */
function swapNeighbour(
  ids: string[],
  id: string,
  direction: "up" | "down",
): string[] | null {
  const index = ids.indexOf(id);
  const target = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || target < 0 || target >= ids.length) return null;

  const next = [...ids];
  [next[index], next[target]] = [next[target], next[index]];
  return next;
}

/**
 * Rewrites `order_index` as 1..n over the given ids.
 *
 * Renumbering the whole list rather than swapping two values keeps ordering
 * stable even when rows share an index — which happens after a bulk import or
 * when someone types the same number into two forms.
 */
async function renumber(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  table: "content_items" | "content_examples",
  orderedIds: string[],
) {
  const results = await Promise.all(
    orderedIds.map((id, index) =>
      supabase
        .from(table)
        .update({ order_index: index + 1 })
        .eq("id", id),
    ),
  );

  return results.find((result) => result.error)?.error ?? null;
}
