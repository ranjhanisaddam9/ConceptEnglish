"use client";

import { useCallback, useEffect, useRef } from "react";

import { itemLabel } from "@/lib/curriculum/display";
import type { ContentItem, LabelMode } from "@/lib/curriculum/types";
import { cn } from "@/lib/utils";

/**
 * The alphabet navigator: one large button per item in the unit.
 *
 * Built from the unit's data, so a unit with 26 letters, 10 numbers or 40
 * sight words all render correctly without changing this file.
 *
 * Implemented as an ARIA tablist with roving tabindex: arrow keys move
 * between letters, which matters for keyboard and switch-device users.
 */

export interface ItemNavProps {
  items: ContentItem[];
  selectedItemId: string | null;
  onSelect: (itemId: string) => void;
  mode: LabelMode;
  /** Namespace for the generated element ids, so several navs can coexist. */
  idPrefix: string;
  /** Id of the panel this nav controls, for aria-controls. */
  panelId: string;
  /**
   * Items carrying this tag get a distinct tint, so a group stays visible at
   * a glance even when nothing is filtered out.
   */
  accentTag?: string;
  className?: string;
}

export function ItemNav({
  items,
  selectedItemId,
  onSelect,
  mode,
  idPrefix,
  panelId,
  accentTag,
  className,
}: ItemNavProps) {
  const buttonRefs = useRef(new Map<string, HTMLButtonElement>());

  const selectedIndex = items.findIndex((item) => item.id === selectedItemId);

  // Keep the active letter visible when the row is scrolled horizontally.
  useEffect(() => {
    if (!selectedItemId) return;
    buttonRefs.current.get(selectedItemId)?.scrollIntoView({
      block: "nearest",
      inline: "center",
      behavior: "smooth",
    });
  }, [selectedItemId]);

  const moveTo = useCallback(
    (index: number) => {
      const target = items.at(index % items.length);
      if (!target) return;
      onSelect(target.id);
      buttonRefs.current.get(target.id)?.focus();
    },
    [items, onSelect],
  );

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (selectedIndex < 0) return;

    switch (event.key) {
      case "ArrowRight":
      case "ArrowDown":
        event.preventDefault();
        moveTo(selectedIndex + 1);
        break;
      case "ArrowLeft":
      case "ArrowUp":
        event.preventDefault();
        moveTo(selectedIndex - 1 < 0 ? items.length - 1 : selectedIndex - 1);
        break;
      case "Home":
        event.preventDefault();
        moveTo(0);
        break;
      case "End":
        event.preventDefault();
        moveTo(items.length - 1);
        break;
    }
  };

  if (items.length === 0) return null;

  return (
    <div
      role="tablist"
      aria-label="Choose a letter"
      onKeyDown={handleKeyDown}
      className={cn(
        // One scrollable row on phones, wrapping grid from tablet up.
        "flex flex-nowrap gap-2 overflow-x-auto px-1 pb-2",
        "sm:flex-wrap sm:justify-center sm:overflow-x-visible sm:pb-0",
        className,
      )}
    >
      {items.map((item) => {
        const isSelected = item.id === selectedItemId;
        const isAccented = Boolean(accentTag && item.tags.includes(accentTag));
        return (
          <button
            key={item.id}
            ref={(node) => {
              if (node) buttonRefs.current.set(item.id, node);
              else buttonRefs.current.delete(item.id);
            }}
            type="button"
            role="tab"
            id={`${idPrefix}-tab-${item.id}`}
            aria-controls={panelId}
            aria-selected={isSelected}
            tabIndex={isSelected ? 0 : -1}
            onClick={() => onSelect(item.id)}
            className={cn(
              // Large tap targets: 56px on phones, 64px from tablet up.
              "font-letter flex h-14 min-w-14 shrink-0 items-center justify-center rounded-2xl px-3",
              "text-2xl font-bold sm:h-16 sm:min-w-16 sm:text-3xl",
              "outline-none focus-visible:ring-4 focus-visible:ring-ring/60",
              "motion-safe:transition-all motion-safe:active:scale-95",
              isSelected && "bg-primary text-primary-foreground shadow-lg",
              !isSelected &&
                (isAccented
                  ? "bg-[var(--vowel-tint)] text-foreground ring-2 ring-[var(--vowel-ring)] hover:brightness-97"
                  : "bg-card text-foreground ring-1 ring-foreground/10 hover:bg-muted"),
            )}
          >
            {itemLabel(item, mode)}
          </button>
        );
      })}
    </div>
  );
}
