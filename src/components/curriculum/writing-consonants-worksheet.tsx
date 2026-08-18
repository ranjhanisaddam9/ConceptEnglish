"use client";

import { useMemo, useState } from "react";

import { AnswerMark } from "@/components/curriculum/answer-mark";
import { ToolbarCheckbox, WorksheetToolbar } from "@/components/curriculum/worksheet-toolbar";
import {
  GAP_BOX_PADDING,
  GapBox,
  useGapAnswers,
  type GapAnswering,
} from "@/components/curriculum/gap-box";
import { SegmentedToggle } from "@/components/curriculum/segmented-toggle";
import { WordSound } from "@/components/curriculum/word-sound";
import { WorksheetPage } from "@/components/curriculum/worksheet-page";
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
import { cn } from "@/lib/utils";

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
 *
 * The ruling stays exactly as it prints — SVG, untouched — and the box a child
 * answers in is laid over it in the same millimetres the SVG is drawn in, so
 * the box lands squarely on the gap it belongs to.
 */
function WordRow({
  row,
  columnWidth,
  letterOnly,
  answering,
}: {
  row: WritingRow;
  columnWidth: number;
  letterOnly: boolean;
  answering: GapAnswering;
}) {
  const { letterSize } = WRITING_LAYOUT;

  // With the spelling hidden there is nothing to align to, so the lone blank
  // is centred in the column instead.
  const slots = letterOnly
    ? row.slots
        .filter((slot) => slot.isBlank)
        .map((slot) => ({ ...slot, centre: columnWidth / 2 }))
    : row.slots;

  const blank = slots.find((slot) => slot.isBlank);
  const answer = answering.answers[row.gap.id];
  const isActive = answering.activeId === row.gap.id;
  // A box standing in the gap replaces the write-here rule, so the two are
  // never drawn on top of each other. Screen only — on paper there is no box,
  // so the rule always prints.
  const covered = isActive || Boolean(answer);

  return (
    <div
      className="relative shrink-0"
      style={{
        width: `${columnWidth}mm`,
        height: `${WRITING_RULING.height}mm`,
      }}
    >
      <svg
        viewBox={`0 0 ${columnWidth} ${WRITING_RULING.height}`}
        width={`${columnWidth}mm`}
        height={`${WRITING_RULING.height}mm`}
        aria-hidden
        className="block"
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
              className={cn(covered && "hidden print:block")}
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

      {blank && (
        <GapBox
          question={row.gap}
          answer={answer}
          isActive={isActive}
          isOpen={answering.isOpen && isActive}
          onOpen={answering.open}
          onChoose={answering.choose}
          onDismiss={answering.dismiss}
          // The same size the word's own letters are drawn at, capitals
          // included — the answer is one of the letters of the word, so it has
          // no business being smaller than the rest of it.
          letterSize={
            /\p{Lu}/u.test(row.gap.answer)
              ? letterSize * WRITING_RULING.capitalScale
              : letterSize
          }
          className="absolute print:hidden"
          style={{
            // The band a capital fills — top line down to the baseline the
            // letter is written on — with room around it.
            left: `${blank.centre - blank.width / 2}mm`,
            top: `${WRITING_RULING.line1 - GAP_BOX_PADDING}mm`,
            width: `${blank.width}mm`,
            height: `${WRITING_RULING.baseline - WRITING_RULING.line1 + GAP_BOX_PADDING * 2}mm`,
          }}
        />
      )}
    </div>
  );
}

/**
 * The rows, answered top to bottom.
 *
 * One gap is live at a time and finishing it starts the next, so the state
 * sits here rather than in the rows — the same arrangement Unit 1's
 * missing-letters sheet uses, and the same hook driving it.
 */
function AnswerableRows({
  rows,
  columnWidth,
  letterOnly,
}: {
  rows: WritingRow[];
  columnWidth: number;
  letterOnly: boolean;
}) {
  const answering = useGapAnswers(rows.map((row) => row.gap));

  return (
    <div
      className="flex flex-col"
      style={{
        gap: `${WRITING_LAYOUT.rowGap}mm`,
        paddingTop: `${WRITING_LAYOUT.rowGap}mm`,
      }}
    >
      {rows.map((row) => {
        const answer = answering.answers[row.gap.id];
        const isOpen = answering.isOpen && answering.activeId === row.gap.id;

        return (
          // Picture hard left, ruled word hard right, nothing in between.
          <div
            key={row.id}
            className={cn(
              "relative flex items-center justify-between",
              // Lifted above the rows below it so the panel hangs over them.
              isOpen && "z-10",
            )}
            style={{
              height: `${WRITING_LAYOUT.rowHeight}mm`,
              gap: `${WRITING_LAYOUT.gap}mm`,
            }}
          >
            {/* A row is one question, so its mark sits out in the margin
                beside the whole row. */}
            {answer && (
              <AnswerMark
                correct={answer.correct}
                popKey={answer.letter}
                className="top-1/2 -translate-y-1/2"
                style={{ left: "-9mm", width: "8mm", fontSize: "7mm" }}
              />
            )}

            {/* The word, said aloud, before anything else on the row. */}
            <WordSound word={row.picture.alt} />

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
              answering={answering}
            />
          </div>
        );
      })}
    </div>
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
      <WorksheetToolbar onNewSheet={() => setSheetSeed(randomSheetSeed())}>
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

        <ToolbarCheckbox
          checked={letterOnly}
          onChange={setLetterOnly}
          label="Letter only"
        />
      </WorksheetToolbar>

      {rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
          No letters in this unit have both a picture and the right tag.
        </p>
      ) : (
        <WorksheetPage
          title={`${unit.title} · Write the consonant`}
          instruction={instruction}
        >
          {/* Rebuilding the sheet — a new seed, position or case — asks
              different questions, so answers already given belong to a sheet
              that no longer exists. Keying on what built it clears them.
              "Letter only" is deliberately not in the key: it hides the
              spelling but asks the very same questions. */}
          <AnswerableRows
            key={`${position}-${labelMode}-${sheetSeed}`}
            rows={rows}
            columnWidth={columnWidth}
            letterOnly={letterOnly}
          />
        </WorksheetPage>
      )}
    </div>
  );
}
