"use client";

import { useId, useMemo, useState } from "react";

import { ItemDetail } from "@/components/curriculum/item-detail";
import { ItemNav } from "@/components/curriculum/item-nav";
import { SegmentedToggle } from "@/components/curriculum/segmented-toggle";
import { useLabelMode } from "@/hooks/use-preferences";
import { itemLabel, labelModeOptions } from "@/lib/curriculum/display";
import {
  LETTER_GROUP_FILTER_OPTIONS,
  letterGroupLabel,
  type LetterGroup,
  type LetterGroupFilter,
} from "@/lib/curriculum/letter-groups";
import { getNeighbours } from "@/lib/curriculum/navigation";
import type { ContentItem, Unit } from "@/lib/curriculum/types";
import { ZONE_FILTER_OPTIONS, type ZoneFilter } from "@/lib/curriculum/writing";
import { cn } from "@/lib/utils";

/**
 * The Letter Page.
 *
 * Named for what it actually is — a browser for any unit's content — because
 * the same component will render Unit 2's numbers and Unit 3's sight words. It
 * takes data and nothing else: no fetching, no knowledge of the alphabet.
 *
 * Selection can be internal or controlled from outside, so an editing preview
 * can drive it with unsaved draft data.
 */

export interface UnitBrowserProps {
  unit: Pick<Unit, "id" | "title" | "kind" | "description">;
  items: ContentItem[];
  /** Controlled selection. Omit to let the component manage it. */
  selectedItemId?: string | null;
  onSelectItem?: (itemId: string) => void;
  showHeader?: boolean;
  className?: string;
}

export function UnitBrowser({
  unit,
  items,
  selectedItemId,
  onSelectItem,
  showHeader = true,
  className,
}: UnitBrowserProps) {
  const domId = useId();
  const panelId = `${domId}-panel`;

  const [internalSelectedId, setInternalSelectedId] = useState<string | null>(
    items[0]?.id ?? null,
  );

  const isControlled = selectedItemId !== undefined;
  const resolvedSelectedId = isControlled ? selectedItemId : internalSelectedId;

  const options = useMemo(
    () => labelModeOptions(unit.kind, items),
    [unit.kind, items],
  );

  // The voice/accent preference lives on the Settings page; the sound buttons
  // read it directly, so nothing about it is needed here.
  const { mode, setMode } = useLabelMode();

  // A stored preference may not apply to this unit (a sight-words unit has no
  // "lowercase"), so clamp to what this unit actually offers.
  const activeMode =
    options.find((option) => option.value === mode)?.value ??
    options[0]?.value ??
    "primary";

  // Vowels and consonants — always relevant in a letters unit.
  const [groupFilter, setGroupFilter] = useState<LetterGroupFilter>("all");
  const isLetters = unit.kind === "letters";

  // Writing-zone filter. Only meaningful while looking at lowercase letters,
  // where "grass", "sky" and "root" describe the shape of the letter.
  const [zoneFilter, setZoneFilter] = useState<ZoneFilter>("all");
  const showZoneFilter = isLetters && activeMode === "secondary";

  const visibleItems = useMemo(() => {
    return items.filter((item) => {
      if (isLetters && groupFilter !== "all" && !item.tags.includes(groupFilter)) {
        return false;
      }
      if (showZoneFilter && zoneFilter !== "all" && !item.tags.includes(zoneFilter)) {
        return false;
      }
      return true;
    });
  }, [items, isLetters, groupFilter, showZoneFilter, zoneFilter]);

  // Resolved during render rather than synced in an effect, so a selection
  // that disappears (filtered out, renamed, deleted) simply falls back to the
  // first visible item on the next render.
  const activeItem =
    visibleItems.find((item) => item.id === resolvedSelectedId) ??
    visibleItems[0] ??
    null;

  // Neighbours come from the visible (possibly filtered) list, so stepping
  // stays inside whatever the "Letter shape" filter is showing.
  const neighbours = getNeighbours(visibleItems, activeItem?.id ?? null);

  const handleSelect = (itemId: string) => {
    if (!isControlled) setInternalSelectedId(itemId);
    onSelectItem?.(itemId);
  };

  if (items.length === 0) {
    return (
      <div
        className={cn(
          "rounded-2xl border border-dashed p-10 text-center text-muted-foreground",
          className,
        )}
      >
        <p className="text-lg">This unit has no content yet.</p>
        <p className="mt-1 text-sm">Add items to this unit to see them here.</p>
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

      {/* ---- Top section: settings + navigator ---- */}
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-start justify-center gap-x-10 gap-y-4">
          <SegmentedToggle
            caption="Letters"
            value={activeMode}
            onChange={setMode}
            options={options}
          />
          {isLetters && (
            <SegmentedToggle
              caption="Sound"
              size="sm"
              value={groupFilter}
              onChange={setGroupFilter}
              options={LETTER_GROUP_FILTER_OPTIONS}
            />
          )}

          {showZoneFilter && (
            <SegmentedToggle
              caption="Letter shape"
              size="sm"
              value={zoneFilter}
              onChange={setZoneFilter}
              options={ZONE_FILTER_OPTIONS}
            />
          )}

        </div>

        <ItemNav
          items={visibleItems}
          selectedItemId={activeItem?.id ?? null}
          onSelect={handleSelect}
          mode={activeMode}
          idPrefix={domId}
          panelId={panelId}
          accentTag={isLetters ? "vowel" : undefined}
        />
      </div>

      {/* Vowels are all grass letters, so pairing them with Sky or Root
          legitimately leaves nothing to show. */}
      {visibleItems.length === 0 && (
        <p className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
          No letters match both of those choices.
        </p>
      )}

      {/* ---- Bottom section: the selected item ---- */}
      {activeItem && (
        <ItemDetail
          // Remount on change so any in-flight audio and image state resets.
          key={activeItem.id}
          item={activeItem}
          kind={unit.kind}
          mode={activeMode}
          panelId={panelId}
          labelledBy={`${domId}-tab-${activeItem.id}`}
          badge={
            isLetters
              ? letterGroupLabel(
                  (activeItem.tags.find((tag) =>
                    tag === "vowel" || tag === "consonant",
                  ) ?? "consonant") as LetterGroup,
                )
              : undefined
          }
          onPrevious={
            neighbours ? () => handleSelect(neighbours.previous.id) : undefined
          }
          onNext={neighbours ? () => handleSelect(neighbours.next.id) : undefined}
          previousLabel={
            neighbours ? itemLabel(neighbours.previous, activeMode) : undefined
          }
          nextLabel={
            neighbours ? itemLabel(neighbours.next, activeMode) : undefined
          }
          className="border-t pt-8"
        />
      )}
    </div>
  );
}
