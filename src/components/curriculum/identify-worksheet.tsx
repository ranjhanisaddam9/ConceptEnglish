"use client";

import { useMemo, useState } from "react";
import { Printer, Shuffle } from "lucide-react";

import { SegmentedToggle } from "@/components/curriculum/segmented-toggle";
import { WorksheetPage } from "@/components/curriculum/worksheet-page";
import { Button } from "@/components/ui/button";
import { useLabelMode } from "@/hooks/use-preferences";
import { labelModeOptions } from "@/lib/curriculum/display";
import {
  IDENTIFY_LAYOUT,
  buildIdentifySheet,
  identifyInstruction,
  type IdentifyTarget,
} from "@/lib/curriculum/identify-letters";
import { randomSheetSeed } from "@/lib/curriculum/sheet-order";
import type { ContentItem, Unit } from "@/lib/curriculum/types";

/**
 * "Identify the vowels / consonants" worksheet.
 *
 * One page, no pagination: the grid fills the sheet. The seed arrives from the
 * server so every visit gets fresh letters, and touching either control
 * re-rolls it.
 */

export interface IdentifyWorksheetProps {
  unit: Pick<Unit, "title" | "kind">;
  /** The whole alphabet — the child has to tell one group from the other. */
  items: ContentItem[];
  /** Which group to hunt for, fixed by the unit rather than chosen here. */
  target: IdentifyTarget;
  seed: number;
}

export function IdentifyWorksheet({
  unit,
  items,
  target,
  seed,
}: IdentifyWorksheetProps) {
  const [sheetSeed, setSheetSeed] = useState(seed);
  const reroll = () => setSheetSeed(randomSheetSeed());

  const { mode, setMode } = useLabelMode();
  const modeOptions = labelModeOptions(unit.kind, items);
  const labelMode =
    modeOptions.find((option) => option.value === mode)?.value ??
    modeOptions[0]?.value ??
    "primary";

  const cells = useMemo(
    () => buildIdentifySheet(items, target, labelMode, sheetSeed),
    [items, target, labelMode, sheetSeed],
  );

  const targetCount = cells.filter((cell) => cell.isTarget).length;

  return (
    <div className="flex flex-col gap-6">
      {/* ---- Controls (screen only) ---- */}
      <div className="flex flex-wrap items-end justify-center gap-x-8 gap-y-4 print:hidden">
        <SegmentedToggle
          caption="Letters"
          value={labelMode}
          onChange={(next) => {
            setMode(next);
            reroll();
          }}
          onReselect={reroll}
          options={modeOptions}
        />
        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={reroll}
          className="h-12 px-5"
        >
          <Shuffle aria-hidden />
          New sheet
        </Button>

        <Button
          type="button"
          size="lg"
          onClick={() => window.print()}
          className="h-12 px-5"
        >
          <Printer aria-hidden />
          Print worksheet
        </Button>
      </div>

      {cells.length === 0 ? (
        <p className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
          This unit has no letters marked as vowels or consonants.
        </p>
      ) : (
        <WorksheetPage
          title={`${unit.title} · Identify letters`}
          instruction={identifyInstruction(target, targetCount)}
        >
          {/* A grid rather than rows of flex, so a part-filled last row sits
              under its own columns instead of spreading across the page. */}
          <div
            className="grid place-items-center"
            style={{
              gridTemplateColumns: `repeat(${IDENTIFY_LAYOUT.columns}, 1fr)`,
              gridAutoRows: `${IDENTIFY_LAYOUT.rowHeight}mm`,
              gap: `${IDENTIFY_LAYOUT.rowGap}mm`,
              paddingTop: `${IDENTIFY_LAYOUT.rowGap}mm`,
            }}
          >
            {cells.map((cell) => (
              <span
                key={cell.id}
                className="font-letter inline-block leading-none font-bold"
                style={{
                  fontSize: "16mm",
                  color: cell.colour,
                  transform: `rotate(${cell.tilt}deg)`,
                }}
              >
                {cell.letter}
              </span>
            ))}
          </div>
        </WorksheetPage>
      )}
    </div>
  );
}
