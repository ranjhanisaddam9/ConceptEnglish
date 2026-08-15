"use client";

import { useId, useMemo, useState } from "react";
import { Printer, Shuffle } from "lucide-react";

import { SegmentedToggle } from "@/components/curriculum/segmented-toggle";
import { WorksheetPage } from "@/components/curriculum/worksheet-page";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useLabelMode } from "@/hooks/use-preferences";
import { labelModeOptions } from "@/lib/curriculum/display";
import {
  CONSONANT_POSITION_OPTIONS,
  type ConsonantPosition,
} from "@/lib/curriculum/picture-match";
import { randomSheetSeed } from "@/lib/curriculum/sheet-order";
import type { ContentItem, Unit } from "@/lib/curriculum/types";
import {
  WRITING_LAYOUT,
  WRITING_RULING,
  buildWritingSheet,
  type WritingRow,
} from "@/lib/curriculum/writing-consonants";

/**
 * "Write the missing consonant" worksheet.
 *
 * The picture on the left, the word spelled out on four-line ruling on the
 * right with one consonant missing for the child to write in.
 */

export interface WritingConsonantsWorksheetProps {
  unit: Pick<Unit, "title" | "kind">;
  items: ContentItem[];
  group: string;
  seed: number;
}

/**
 * The word, with a ruled gap where the answer goes.
 *
 * Every row is drawn on the same canvas width — that of the longest word on
 * the sheet — so the words share a left edge while the column as a whole sits
 * over on the right of the page.
 */
function WordRow({
  row,
  columnWidth,
  letterOnly,
}: {
  row: WritingRow;
  columnWidth: number;
  letterOnly: boolean;
}) {
  const { letterSize } = WRITING_LAYOUT;

  // With the spelling hidden there is nothing to align to, so the lone blank
  // is centred in the column instead.
  const slots = letterOnly
    ? row.slots
        .filter((slot) => slot.isBlank)
        .map((slot) => ({ ...slot, centre: columnWidth / 2 }))
    : row.slots;

  return (
    <svg
      viewBox={`0 0 ${columnWidth} ${WRITING_RULING.height}`}
      width={`${columnWidth}mm`}
      height={`${WRITING_RULING.height}mm`}
      aria-hidden
      className="block shrink-0"
    >
      {slots.map((slot, index) =>
        slot.isBlank ? (
          // The one rule left on the page: the line the answer is written on.
          <line
            key={index}
            x1={slot.centre - slot.width * 0.4}
            x2={slot.centre + slot.width * 0.4}
            y1={WRITING_RULING.line3}
            y2={WRITING_RULING.line3}
            stroke="var(--worksheet-ink)"
            strokeWidth={0.7}
          />
        ) : (
          <text
            key={index}
            x={slot.centre}
            y={WRITING_RULING.baseline}
            fontSize={
              /\p{Lu}/u.test(slot.character)
                ? letterSize * WRITING_RULING.capitalScale
                : letterSize
            }
            fontWeight={700}
            textAnchor="middle"
            className="font-letter"
            fill={row.colour}
          >
            {slot.character}
          </text>
        ),
      )}
    </svg>
  );
}

export function WritingConsonantsWorksheet({
  unit,
  items,
  group,
  seed,
}: WritingConsonantsWorksheetProps) {
  const [sheetSeed, setSheetSeed] = useState(seed);
  const [position, setPosition] = useState<ConsonantPosition>("starting");
  const [letterOnly, setLetterOnly] = useState(false);
  const letterOnlyId = useId();

  const { mode, setMode } = useLabelMode();
  // "Both" is meaningless here: a word is spelled in one case or the other,
  // not in both at once.
  const modeOptions = labelModeOptions(unit.kind, items).filter(
    (option) => option.value !== "both",
  );
  const labelMode =
    modeOptions.find((option) => option.value === mode)?.value ??
    modeOptions[0]?.value ??
    "primary";

  const rows = useMemo(
    () => buildWritingSheet(items, group, position, labelMode, sheetSeed),
    [items, group, position, labelMode, sheetSeed],
  );

  // All words share the left edge of the longest one on the sheet; with only
  // the blank showing, every row is the width of that blank.
  const columnWidth = letterOnly
    ? WRITING_LAYOUT.blankWidth
    : rows.reduce((widest, row) => Math.max(widest, row.width), 0);

  // With the spelling hidden the child works from the picture, so the wording
  // has to change with it.
  const subject = letterOnly ? "picture" : "word";
  const instruction =
    position === "starting"
      ? `Write the letter each ${subject} begins with.`
      : `Write the letter each ${subject} ends with.`;

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

        <div className="flex h-12 items-center gap-2">
          <Checkbox
            id={letterOnlyId}
            checked={letterOnly}
            onCheckedChange={(checked) => setLetterOnly(checked === true)}
            className="size-5"
          />
          <Label htmlFor={letterOnlyId} className="text-base">
            Letter only
          </Label>
        </div>

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

      {rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
          No letters in this unit have both a picture and the right tag.
        </p>
      ) : (
        <WorksheetPage
          title={`${unit.title} · Write the consonant`}
          instruction={instruction}
        >
          <div
            className="flex flex-col"
            style={{
              gap: `${WRITING_LAYOUT.rowGap}mm`,
              paddingTop: `${WRITING_LAYOUT.rowGap}mm`,
            }}
          >
            {rows.map((row) => (
              // Picture hard left, ruled word hard right, nothing in between.
              <div
                key={row.id}
                className="flex items-center justify-between"
                style={{
                  height: `${WRITING_LAYOUT.rowHeight}mm`,
                  gap: `${WRITING_LAYOUT.gap}mm`,
                }}
              >
                {/* Kept as a plain <img> so the asset prints at its exact
                    size — see the note in worksheet-page.tsx. */}
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={row.picture.src}
                  alt={row.picture.alt}
                  className="shrink-0 object-contain"
                  style={{
                    width: `${WRITING_LAYOUT.pictureBox}mm`,
                    height: `${WRITING_LAYOUT.pictureBox}mm`,
                  }}
                />
                <WordRow
                  row={row}
                  columnWidth={columnWidth}
                  letterOnly={letterOnly}
                />
              </div>
            ))}
          </div>
        </WorksheetPage>
      )}
    </div>
  );
}
