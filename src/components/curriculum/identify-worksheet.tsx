"use client";

import { useMemo, useState } from "react";

import { AnswerMark } from "@/components/curriculum/answer-mark";
import { SegmentedToggle } from "@/components/curriculum/segmented-toggle";
import { WorksheetPage } from "@/components/curriculum/worksheet-page";
import { WorksheetToolbar } from "@/components/curriculum/worksheet-toolbar";
import { useLabelMode } from "@/hooks/use-preferences";
import { playAnswerSound } from "@/lib/curriculum/answer-sound";
import { labelModeOptions } from "@/lib/curriculum/display";
import {
  IDENTIFY_LAYOUT,
  buildIdentifySheet,
  identifyInstruction,
  type IdentifyCell,
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

/** Millimetres — the tick or cross that sits on the ring. */
const MARK_SIZE = 5;

/**
 * Where a mark sits on the ring: up and to the right, at 45°, half of it
 * inside the circle and half out, the way a teacher marks beside the ring
 * rather than on top of the letter.
 */
const MARK_OFFSET = {
  left: (IDENTIFY_LAYOUT.ring / 2) * (1 + Math.SQRT1_2) - MARK_SIZE / 2,
  top: (IDENTIFY_LAYOUT.ring / 2) * (1 - Math.SQRT1_2) - MARK_SIZE / 2,
};

/**
 * One letter in the grid, which the child can ring on screen.
 *
 * The sheet asks them to circle every consonant, so tapping draws the circle
 * they would have drawn: a solid ring washed through with the letter's own
 * colour. Tapping again rubs it out, because a hunt has no running order and a
 * mis-tap should not be final.
 *
 * None of it prints — the sheet comes off the printer as bare letters.
 */
function LetterCell({
  cell,
  ringed,
  onToggle,
}: {
  cell: IdentifyCell;
  ringed: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      data-hover-pulse
      onClick={onToggle}
      aria-pressed={ringed}
      aria-label={`${cell.letter}${ringed ? ", circled" : ""}`}
      className="relative flex cursor-pointer items-center justify-center rounded-full outline-none focus-visible:ring-4 focus-visible:ring-ring/60 print:transform-none"
      style={{
        width: `${IDENTIFY_LAYOUT.ring}mm`,
        height: `${IDENTIFY_LAYOUT.ring}mm`,
      }}
    >
      {ringed && (
        <span
          aria-hidden
          className="absolute inset-0 rounded-full print:hidden"
          style={{
            border: `2px solid ${cell.colour}`,
            backgroundColor: `color-mix(in oklch, ${cell.colour}, transparent 80%)`,
          }}
        />
      )}

      <span
        className="font-letter relative leading-none font-bold"
        style={{
          fontSize: "16mm",
          color: cell.colour,
          transform: `rotate(${cell.tilt}deg)`,
        }}
      >
        {cell.letter}
      </span>

      {ringed && (
        <AnswerMark
          correct={cell.isTarget}
          style={{
            left: `${MARK_OFFSET.left}mm`,
            top: `${MARK_OFFSET.top}mm`,
            width: `${MARK_SIZE}mm`,
            fontSize: `${MARK_SIZE}mm`,
          }}
        />
      )}
    </button>
  );
}

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

  // Which letters the child has ringed. A fresh grid clears them, so this is
  // keyed on what built the sheet the way the other answerable sheets are.
  const [ringed, setRinged] = useState<ReadonlySet<string>>(new Set());
  const sheetKey = `${labelMode}-${sheetSeed}`;
  const [builtFrom, setBuiltFrom] = useState(sheetKey);
  if (builtFrom !== sheetKey) {
    setBuiltFrom(sheetKey);
    setRinged(new Set());
  }

  const toggleRing = (cell: IdentifyCell) => {
    const next = new Set(ringed);
    if (next.delete(cell.id)) {
      // Rubbing a ring out is a correction, not an answer — it says nothing.
      setRinged(next);
      return;
    }

    next.add(cell.id);
    setRinged(next);
    playAnswerSound(cell.isTarget);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* ---- Controls (screen only) ---- */}
      <WorksheetToolbar onNewSheet={reroll}>
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
      </WorksheetToolbar>

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
              <LetterCell
                key={cell.id}
                cell={cell}
                ringed={ringed.has(cell.id)}
                onToggle={() => toggleRing(cell)}
              />
            ))}
          </div>
        </WorksheetPage>
      )}
    </div>
  );
}
