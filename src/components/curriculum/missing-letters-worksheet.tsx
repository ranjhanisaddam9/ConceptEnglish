"use client";

import { useMemo, useState } from "react";
import { Printer } from "lucide-react";

import { SegmentedToggle } from "@/components/curriculum/segmented-toggle";
import { WorksheetPage } from "@/components/curriculum/worksheet-page";
import { Button } from "@/components/ui/button";
import { useLabelMode } from "@/hooks/use-preferences";
import { labelModeOptions } from "@/lib/curriculum/display";
import {
  MISSING_LAYOUT,
  MISSING_MODE_OPTIONS,
  buildEntireSheet,
  buildRandomRows,
  missingInstruction,
  type MissingCell,
  type MissingMode,
  type MissingQuestion,
} from "@/lib/curriculum/missing-letters";
import { randomSheetSeed } from "@/lib/curriculum/sheet-order";
import type { ContentItem, Unit } from "@/lib/curriculum/types";
import { CONTENT_WIDTH, LETTER_SIZE, ROW_RULING } from "@/lib/curriculum/worksheet";
import { isUppercaseRun, splitByCase } from "@/lib/curriculum/writing";

/**
 * "Missing letters" worksheet — see lib/curriculum/missing-letters.ts for the
 * question shapes.
 *
 * Like the other printable sheets: generated from a seed so server and client
 * agree, paginated with Back/Next on screen, and printed as a complete set.
 */

export interface MissingLettersWorksheetProps {
  unit: Pick<Unit, "title">;
  items: ContentItem[];
  /**
   * Rolled per request on the server, so every visit gets a fresh sheet while
   * the first client render still matches the server's.
   */
  seed: number;
}

function QuestionRow({ question }: { question: MissingQuestion }) {
  return (
    <div
      className="flex items-center justify-around border-2 border-neutral-800 px-2"
      style={{ height: `${MISSING_LAYOUT.rowHeight}mm` }}
    >
      {question.cells.map((cell, index) =>
        cell.kind === "blank" ? (
          <span
            key={index}
            className="inline-block border-b-2 border-neutral-800"
            style={{
              width: `${MISSING_LAYOUT.slotWidth}mm`,
              height: `${MISSING_LAYOUT.slotHeight}mm`,
            }}
          />
        ) : (
          <span
            key={index}
            className="font-letter leading-none font-bold"
            style={{ fontSize: "9mm" }}
          >
            {cell.text}
          </span>
        ),
      )}
    </div>
  );
}

/** One ruled line of the alphabet, with gaps where letters are missing. */
function AlphabetLine({ cells }: { cells: MissingCell[] }) {
  const step = CONTENT_WIDTH / MISSING_LAYOUT.lettersPerLine;

  return (
    <svg
      viewBox={`0 0 ${CONTENT_WIDTH} ${ROW_RULING.height}`}
      width={`${CONTENT_WIDTH}mm`}
      height={`${ROW_RULING.height}mm`}
      aria-hidden
      className="block"
    >
      {[
        { y: ROW_RULING.line1, colour: "var(--writing-line-outer)" },
        { y: ROW_RULING.line2, colour: "var(--writing-line-inner)" },
        { y: ROW_RULING.line3, colour: "var(--writing-line-inner)" },
        { y: ROW_RULING.line4, colour: "var(--writing-line-outer)" },
      ].map(({ y, colour }) => (
        <line
          key={y}
          x1={0}
          x2={CONTENT_WIDTH}
          y1={y}
          y2={y}
          stroke={colour}
          strokeWidth={0.25}
          strokeOpacity={0.5}
        />
      ))}

      {cells.map((cell, index) =>
        cell.kind === "blank" ? (
          // A blank on the baseline, heavier than the ruling, so a gap reads
          // as "write here" rather than as an accidental empty space.
          <line
            key={index}
            x1={step * (index + 0.5) - MISSING_LAYOUT.entireBlankWidth / 2}
            x2={step * (index + 0.5) + MISSING_LAYOUT.entireBlankWidth / 2}
            y1={ROW_RULING.baseline}
            y2={ROW_RULING.baseline}
            stroke="var(--worksheet-ink)"
            strokeWidth={0.7}
          />
        ) : (
          <text
            key={index}
            x={step * (index + 0.5)}
            y={ROW_RULING.baseline}
            fontSize={LETTER_SIZE}
            fontWeight={700}
            textAnchor="middle"
            className="font-letter"
            fill="var(--worksheet-ink)"
          >
            {splitByCase(cell.text).map((run, runIndex) => (
              <tspan
                key={runIndex}
                fontSize={
                  isUppercaseRun(run)
                    ? LETTER_SIZE * ROW_RULING.capitalScale
                    : undefined
                }
              >
                {run}
              </tspan>
            ))}
          </text>
        ),
      )}
    </svg>
  );
}

export function MissingLettersWorksheet({
  unit,
  items,
  seed,
}: MissingLettersWorksheetProps) {
  const [mode, setMode] = useState<MissingMode>("random");

  // The server rolls the first seed per request, so a plain page load already
  // gives a fresh sheet. Touching the Question control re-rolls it again, so
  // tapping Random or Entire always produces a different set of gaps.
  const [sheetSeed, setSheetSeed] = useState(seed);
  const reroll = () => setSheetSeed(randomSheetSeed());

  const handleModeChange = (next: MissingMode) => {
    setMode(next);
    reroll();
  };

  const { mode: storedLabelMode, setMode: setLabelMode } = useLabelMode();
  const labelOptions = labelModeOptions("letters", items);
  const labelMode =
    labelOptions.find((option) => option.value === storedLabelMode)?.value ??
    "primary";

  const isEntire = mode === "entire";

  // Both question shapes are a single sheet: Random fills one page with
  // distinct runs, and Entire is the alphabet once over.
  const questions = useMemo(
    () => (isEntire ? [] : buildRandomRows(items, labelMode, sheetSeed)),
    [isEntire, items, labelMode, sheetSeed],
  );

  const entire = useMemo(
    () => (isEntire ? buildEntireSheet(items, labelMode, sheetSeed) : null),
    [isEntire, items, labelMode, sheetSeed],
  );

  const instruction = missingInstruction(mode);
  const title = `${unit.title} · Missing letters`;

  return (
    <div className="flex flex-col gap-6">
      {/* ---- Controls (screen only) ---- */}
      <div className="flex flex-wrap items-end justify-center gap-x-8 gap-y-4 print:hidden">
        <SegmentedToggle
          caption="Letters"
          value={labelMode}
          onChange={setLabelMode}
          options={labelOptions}
        />
        <SegmentedToggle
          caption="Question"
          size="sm"
          value={mode}
          onChange={handleModeChange}
          onReselect={reroll}
          options={MISSING_MODE_OPTIONS}
        />
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

      {isEntire && entire ? (
        <WorksheetPage title={title} instruction={instruction}>
          <div
            className="flex flex-col"
            style={{
              gap: `${MISSING_LAYOUT.lineGap}mm`,
              paddingTop: `${MISSING_LAYOUT.lineGap}mm`,
            }}
          >
            {entire.lines.map((line, index) => (
              <AlphabetLine key={index} cells={line} />
            ))}
          </div>
        </WorksheetPage>
      ) : questions.length === 0 ? (
        <p className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
          This unit does not have enough letters for these questions.
        </p>
      ) : (
        <WorksheetPage title={title} instruction={instruction}>
          <div
            className="flex flex-col"
            style={{
              gap: `${MISSING_LAYOUT.rowGap}mm`,
              paddingTop: `${MISSING_LAYOUT.rowGap}mm`,
            }}
          >
            {questions.map((question) => (
              <QuestionRow key={question.id} question={question} />
            ))}
          </div>
        </WorksheetPage>
      )}
    </div>
  );
}
