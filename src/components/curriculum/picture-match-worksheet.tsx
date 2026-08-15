"use client";

import { useMemo, useState } from "react";
import { Printer, Shuffle } from "lucide-react";

import { SegmentedToggle } from "@/components/curriculum/segmented-toggle";
import { WorksheetPage } from "@/components/curriculum/worksheet-page";
import { Button } from "@/components/ui/button";
import { useLabelMode } from "@/hooks/use-preferences";
import { labelModeOptions } from "@/lib/curriculum/display";
import {
  CONSONANT_POSITION_OPTIONS,
  PICTURE_MATCH_LAYOUT,
  buildPictureMatchSheet,
  type ConsonantPosition,
} from "@/lib/curriculum/picture-match";
import { randomSheetSeed } from "@/lib/curriculum/sheet-order";
import type { ContentItem, Unit } from "@/lib/curriculum/types";

/**
 * "Match the picture to its letter" worksheet.
 *
 * Pictures on the left, the same letters shuffled on the right, and clear
 * space between the two columns for the child to rule lines across.
 */

export interface PictureMatchWorksheetProps {
  unit: Pick<Unit, "title" | "kind">;
  items: ContentItem[];
  /** Which letters to draw from, e.g. "consonant". */
  group: string;
  seed: number;
}

/** The dot a line is drawn from or to. */
function Anchor() {
  return (
    <span
      className="shrink-0 rounded-full bg-neutral-800"
      style={{
        width: `${PICTURE_MATCH_LAYOUT.anchorRadius * 2}mm`,
        height: `${PICTURE_MATCH_LAYOUT.anchorRadius * 2}mm`,
      }}
    />
  );
}

export function PictureMatchWorksheet({
  unit,
  items,
  group,
  seed,
}: PictureMatchWorksheetProps) {
  const [sheetSeed, setSheetSeed] = useState(seed);
  const [position, setPosition] = useState<ConsonantPosition>("starting");

  const { mode, setMode } = useLabelMode();
  // A row pairs one picture with one letter, so the answer column shows a
  // single form — "Bb" would put two letters in the box being matched.
  const modeOptions = labelModeOptions(unit.kind, items).filter(
    (option) => option.value !== "both",
  );
  const labelMode =
    modeOptions.find((option) => option.value === mode)?.value ??
    modeOptions[0]?.value ??
    "primary";

  const sheet = useMemo(
    () => buildPictureMatchSheet(items, group, position, labelMode, sheetSeed),
    [items, group, position, labelMode, sheetSeed],
  );

  const instruction =
    position === "starting"
      ? "Draw a line from each picture to the letter it begins with."
      : "Draw a line from each picture to the letter it ends with.";

  return (
    <div className="flex flex-col gap-6">
      {/* ---- Controls (screen only) ---- */}
      <div className="flex flex-wrap items-end justify-center gap-x-8 gap-y-4 print:hidden">
        <SegmentedToggle
          caption="Letters"
          value={labelMode}
          onChange={setMode}
          options={modeOptions}
        />
        <SegmentedToggle
          caption="Consonant"
          value={position}
          onChange={setPosition}
          options={CONSONANT_POSITION_OPTIONS}
        />

        <Button
          type="button"
          variant="outline"
          size="lg"
          onClick={() => setSheetSeed(randomSheetSeed())}
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

      {sheet.rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
          No letters in this unit have both a picture and the right tag.
        </p>
      ) : (
        <WorksheetPage
          title={`${unit.title} · Match the picture`}
          instruction={instruction}
        >
          <div
            className="flex flex-col"
            style={{
              gap: `${PICTURE_MATCH_LAYOUT.rowGap}mm`,
              paddingTop: `${PICTURE_MATCH_LAYOUT.rowGap}mm`,
            }}
          >
            {sheet.rows.map((row, index) => (
              <div
                key={row.id}
                className="flex items-center"
                style={{ height: `${PICTURE_MATCH_LAYOUT.rowHeight}mm` }}
              >
                {/* Kept as a plain <img> so the asset prints at its exact
                    size — see the note in worksheet-page.tsx. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={row.picture.src}
                  alt={row.picture.alt}
                  className="shrink-0 object-contain"
                  style={{
                    width: `${PICTURE_MATCH_LAYOUT.pictureBox}mm`,
                    height: `${PICTURE_MATCH_LAYOUT.pictureBox}mm`,
                  }}
                />
                <Anchor />

                {/* The blank middle is where the child rules the line. */}
                <span className="flex-1" />

                <Anchor />
                <span
                  className="font-letter flex shrink-0 items-center justify-center leading-none font-bold"
                  style={{
                    width: `${PICTURE_MATCH_LAYOUT.letterBox}mm`,
                    fontSize: "13mm",
                    color: sheet.letters[index].colour,
                  }}
                >
                  {sheet.letters[index].text}
                </span>
              </div>
            ))}
          </div>
        </WorksheetPage>
      )}
    </div>
  );
}
