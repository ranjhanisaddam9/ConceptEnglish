"use client";

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { cn } from "@/lib/utils";

/**
 * A labelled segmented control with classroom-sized tap targets.
 *
 * Used for the letter-case switch and the voice-accent switch — anything
 * where the teacher picks one of a short list of options.
 */

export interface SegmentedOption<T extends string> {
  value: T;
  label: string;
  /** Longer text used as the accessible name and tooltip. */
  description: string;
}

export interface SegmentedToggleProps<T extends string> {
  value: T;
  onChange: (value: T) => void;
  options: SegmentedOption<T>[];
  /** Small caption shown above the control. */
  caption: string;
  /**
   * Called when the already-selected option is pressed again. Lets a caller
   * treat a re-tap as "do that again" — regenerating a sheet, say — while the
   * selection itself stays put.
   */
  onReselect?: () => void;
  size?: "sm" | "lg";
  className?: string;
}

const SIZE_CLASSES = {
  sm: "h-10 min-w-16 px-4 text-sm sm:min-w-24",
  lg: "h-12 min-w-20 px-4 text-base sm:min-w-28 sm:px-5",
} as const;

export function SegmentedToggle<T extends string>({
  value,
  onChange,
  options,
  caption,
  onReselect,
  size = "lg",
  className,
}: SegmentedToggleProps<T>) {
  if (options.length < 2) return null;

  return (
    <div
      className={cn(
        // max-w-full and the scroller below: a five-option control is wider
        // than a phone, and a segmented control cannot wrap without its
        // rounded ends landing mid-row.
        "flex max-w-full flex-col items-center gap-1.5",
        className,
      )}
    >
      <span className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {caption}
      </span>
      <div className="max-w-full overflow-x-auto px-1 pb-1">
      <ToggleGroup
        type="single"
        value={value}
        // Radix clears the value when the active item is pressed again; keep
        // the current selection instead of leaving nothing selected, and let
        // the caller react to the re-tap.
        onValueChange={(next) => {
          if (next) onChange(next as T);
          else onReselect?.();
        }}
        spacing={0}
        variant="outline"
        aria-label={caption}
        className="rounded-full p-0"
      >
        {options.map((option) => (
          <ToggleGroupItem
            key={option.value}
            value={option.value}
            title={option.description}
            aria-label={option.description}
            className={cn(
              "font-medium first:rounded-l-full last:rounded-r-full",
              SIZE_CLASSES[size],
              "data-[state=on]:bg-primary data-[state=on]:text-primary-foreground",
            )}
          >
            {option.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
      </div>
    </div>
  );
}
