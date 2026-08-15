"use client";

import { useId, useMemo, useState } from "react";

import { ItemDetail } from "@/components/curriculum/item-detail";
import { ItemNav } from "@/components/curriculum/item-nav";
import { SegmentedToggle } from "@/components/curriculum/segmented-toggle";
import { itemLabel } from "@/lib/curriculum/display";
import { getNeighbours } from "@/lib/curriculum/navigation";
import { PATTERN_SETS } from "@/lib/curriculum/patterns";
import type { ContentItem, Unit } from "@/lib/curriculum/types";
import { cn } from "@/lib/utils";

/**
 * The Pattern Page, shared by Units 4, 5 and 6.
 *
 * Built like the Letter Page, but the thing being browsed is a *pattern* — a
 * word family, a vowel, a blend, a digraph — and the words that fit it are the
 * examples. Which patterns a unit offers comes from its `patternSet`, so a new
 * pattern unit needs an entry in `patterns.ts` and nothing here.
 *
 * The unit holds both cuts of its words at once, each item tagged with the cut
 * it belongs to, so switching filters rather than refetches. The card shows the
 * pattern on a plain tinted tile: there is no handwriting to model here, so no
 * ruling either.
 */

export interface PatternBrowserProps {
  unit: Pick<Unit, "id" | "title" | "kind" | "description" | "patternSet">;
  items: ContentItem[];
  showHeader?: boolean;
  className?: string;
}

export function PatternBrowser({
  unit,
  items,
  showHeader = true,
  className,
}: PatternBrowserProps) {
  const domId = useId();
  const panelId = `${domId}-panel`;

  const set = PATTERN_SETS[unit.patternSet ?? "short_vowels"];
  const options = set.options;
  const [pattern, setPattern] = useState<string>(options[0].value);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // A stored choice may not belong to this unit's set, so clamp to what it
  // actually offers.
  const activePattern =
    options.find((option) => option.value === pattern) ?? options[0];

  const visibleItems = useMemo(
    () => items.filter((item) => item.tags.includes(activePattern.value)),
    [items, activePattern],
  );

  // Resolved during render rather than synced in an effect, so switching
  // pattern — which replaces every item — simply falls back to the first one.
  const activeItem =
    visibleItems.find((item) => item.id === selectedId) ??
    visibleItems[0] ??
    null;

  const neighbours = getNeighbours(visibleItems, activeItem?.id ?? null);

  if (items.length === 0) {
    return (
      <div
        className={cn(
          "rounded-2xl border border-dashed p-10 text-center text-muted-foreground",
          className,
        )}
      >
        <p className="text-lg">This unit has no words yet.</p>
      </div>
    );
  }

  return (
    <div className={cn("flex flex-col gap-8", className)}>
      {showHeader && (
        <header className="flex flex-col items-center gap-2 text-center">
          <h1 className="font-heading text-3xl font-bold sm:text-4xl">
            {unit.title}
          </h1>
          {unit.description && (
            <p className="max-w-2xl text-muted-foreground">{unit.description}</p>
          )}
        </header>
      )}

      <div className="flex flex-col gap-6">
        {/* A unit with one way of grouping its words has nothing to toggle. */}
        {options.length > 1 && (
          <div className="flex flex-wrap items-start justify-center gap-x-10 gap-y-4">
            <SegmentedToggle
              caption={set.caption}
              size={set.size}
              value={activePattern.value}
              onChange={setPattern}
              options={options}
            />
          </div>
        )}

        <ItemNav
          items={visibleItems}
          selectedItemId={activeItem?.id ?? null}
          onSelect={setSelectedId}
          mode="primary"
          idPrefix={domId}
          panelId={panelId}
          reveal={set.reveal}
        />
      </div>

      {activeItem && (
        <ItemDetail
          // Remount on change so any in-flight audio and image state resets.
          key={activeItem.id}
          item={activeItem}
          kind={unit.kind}
          mode="primary"
          panelId={panelId}
          labelledBy={`${domId}-tab-${activeItem.id}`}
          examplesHeading={activePattern.heading(activeItem.primaryLabel)}
          // A pattern can gather far more words than a letter's three, so the
          // tiles go five across rather than three.
          exampleColumns={5}
          onPrevious={
            neighbours ? () => setSelectedId(neighbours.previous.id) : undefined
          }
          onNext={
            neighbours ? () => setSelectedId(neighbours.next.id) : undefined
          }
          previousLabel={
            neighbours ? itemLabel(neighbours.previous, "primary") : undefined
          }
          nextLabel={
            neighbours ? itemLabel(neighbours.next, "primary") : undefined
          }
          className="border-t pt-8"
        />
      )}
    </div>
  );
}
