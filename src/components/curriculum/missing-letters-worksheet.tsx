"use client";

import { Fragment, useMemo, useState } from "react";

import { AnswerMark } from "@/components/curriculum/answer-mark";
import { WorksheetToolbar } from "@/components/curriculum/worksheet-toolbar";
import {
  GapBox,
  useGapAnswers,
  type GapAnswering,
} from "@/components/curriculum/gap-box";
import { SegmentedToggle } from "@/components/curriculum/segmented-toggle";
import { WorksheetPage } from "@/components/curriculum/worksheet-page";
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
import { cn } from "@/lib/utils";

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

/**
 * One "random" row — a run of letters with a single gap in it.
 *
 * The row is one question, so its tick or cross sits out in the margin beside
 * the whole row, the way Unit 1's matching sheet marks its questions.
 */
function QuestionRow({
  question,
  answering,
}: {
  question: MissingQuestion;
  answering: GapAnswering;
}) {
  const answer = answering.answers[question.gap.id];
  const isActive = answering.activeId === question.gap.id;
  const isOpen = answering.isOpen && isActive;
  return (
    <div
      className={cn(
        "relative flex items-center justify-around border-2 border-neutral-800 px-2",
        // Lifted above the rows below it so the panel hangs over them.
        isOpen && "z-10",
      )}
      style={{ height: `${MISSING_LAYOUT.rowHeight}mm` }}
    >
      {answer && (
        <AnswerMark
          correct={answer.correct}
          popKey={answer.letter}
          className="top-1/2 -translate-y-1/2"
          style={{ left: "-9mm", width: "8mm", fontSize: "7mm" }}
        />
      )}

      {question.cells.map((cell, index) =>
        cell.kind === "blank" ? (
          <GapBox
            key={index}
            question={cell.question}
            answer={answer}
            isActive={isActive}
            isOpen={isOpen}
            onOpen={answering.open}
            onChoose={answering.choose}
            onDismiss={answering.dismiss}
            letterSize={9}
            className={cn(
              "inline-block border-neutral-800",
              // A box standing in the gap replaces the write-here rule, so the
              // two are never drawn on top of each other. The rule is put back
              // unconditionally for print, where no box exists.
              !(isActive || answer) && "border-b-2",
              "print:border-b-2",
            )}
            style={{
              width: `${MISSING_LAYOUT.slotWidth}mm`,
              height: `${MISSING_LAYOUT.slotHeight}mm`,
            }}
          />
        ) : (
          <span
            key={index}
            className="font-letter leading-none font-bold"
            style={{ fontSize: "9mm", color: cell.colour }}
          >
            {cell.text}
          </span>
        ),
      )}
    </div>
  );
}

/** The rows of a "random" sheet, answered top to bottom. */
function AnswerableRows({ questions }: { questions: MissingQuestion[] }) {
  const answering = useGapAnswers(questions.map((question) => question.gap));

  return (
    <div
      className="flex flex-col"
      style={{
        gap: `${MISSING_LAYOUT.rowGap}mm`,
        paddingTop: `${MISSING_LAYOUT.rowGap}mm`,
      }}
    >
      {questions.map((question) => (
        <QuestionRow
          key={question.id}
          question={question}
          answering={answering}
        />
      ))}
    </div>
  );
}

/** Where a gap sits along a ruled line, in millimetres. */
const gapLeft = (index: number) =>
  (CONTENT_WIDTH / MISSING_LAYOUT.lettersPerLine) * (index + 0.5) -
  MISSING_LAYOUT.entireBlankWidth / 2;

/**
 * One ruled line of the alphabet, with gaps where letters are missing.
 *
 * This is the sheet as it prints. Answering happens in boxes laid over it —
 * see AnswerableAlphabet — which is why `answeredGaps` only ever takes the
 * write-here rule off the screen and never off the paper.
 */
function AlphabetLine({
  cells,
  answeredGaps,
}: {
  cells: MissingCell[];
  /** Ids of gaps currently covered by a box on screen. */
  answeredGaps: Set<string>;
}) {
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
            // A box standing in the gap replaces the write-here rule, so the
            // two are never drawn on top of each other. Screen only — on paper
            // there is no box, so the rule always prints.
            className={cn(
              answeredGaps.has(cell.question.id) && "hidden print:block",
            )}
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
            fill={cell.colour}
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

/**
 * The whole alphabet, answered gap by gap in reading order.
 *
 * The ruled lines stay exactly as they print — SVG, untouched — and the boxes
 * are laid over them in the same millimetres the SVG is drawn in, so a box
 * lands squarely on the gap it belongs to.
 */
function AnswerableAlphabet({ lines }: { lines: MissingCell[][] }) {
  const gaps = useMemo(
    () =>
      lines.flatMap((line) =>
        line.flatMap((cell) => (cell.kind === "blank" ? [cell.question] : [])),
      ),
    [lines],
  );

  const answering = useGapAnswers(gaps);

  const covered = new Set(
    gaps
      .filter((gap) => answering.activeId === gap.id || answering.answers[gap.id])
      .map((gap) => gap.id),
  );

  return (
    <div
      className="flex flex-col"
      style={{
        gap: `${MISSING_LAYOUT.lineGap}mm`,
        paddingTop: `${MISSING_LAYOUT.lineGap}mm`,
      }}
    >
      {lines.map((line, lineIndex) => (
        <div
          key={lineIndex}
          className="relative"
          style={{
            width: `${CONTENT_WIDTH}mm`,
            height: `${ROW_RULING.height}mm`,
          }}
        >
          <AlphabetLine cells={line} answeredGaps={covered} />

          {line.map((cell, index) => {
            if (cell.kind !== "blank") return null;

            const answer = answering.answers[cell.question.id];
            const isActive = answering.activeId === cell.question.id;

            return (
              <Fragment key={index}>
                <GapBox
                  question={cell.question}
                  answer={answer}
                  isActive={isActive}
                  isOpen={answering.isOpen && isActive}
                  onOpen={answering.open}
                  onChoose={answering.choose}
                  onDismiss={answering.dismiss}
                  letterSize={9}
                  className="absolute print:hidden"
                  style={{
                    // The gap runs from the top line down to the baseline —
                    // the same band a capital would fill.
                    left: `${gapLeft(index)}mm`,
                    top: `${ROW_RULING.line1}mm`,
                    width: `${MISSING_LAYOUT.entireBlankWidth}mm`,
                    height: `${ROW_RULING.baseline - ROW_RULING.line1}mm`,
                  }}
                />

                {/* Every gap is its own question here, so the mark rides on
                    the gap rather than out in the margin. */}
                {answer && (
                  <AnswerMark
                    correct={answer.correct}
                    popKey={answer.letter}
                    style={{
                      left: `${gapLeft(index) + MISSING_LAYOUT.entireBlankWidth - 1}mm`,
                      top: "-1.5mm",
                      fontSize: "5mm",
                    }}
                  />
                )}
              </Fragment>
            );
          })}
        </div>
      ))}
    </div>
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
      <WorksheetToolbar>
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
      </WorksheetToolbar>

      {isEntire && entire ? (
        <WorksheetPage title={title} instruction={instruction}>
          <AnswerableAlphabet
            // Keyed like the rows below, and for the same reason: a rebuilt
            // sheet asks different questions, so old answers go with it.
            key={`${mode}-${labelMode}-${sheetSeed}`}
            lines={entire.lines}
          />
        </WorksheetPage>
      ) : questions.length === 0 ? (
        <p className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
          This unit does not have enough letters for these questions.
        </p>
      ) : (
        <WorksheetPage title={title} instruction={instruction}>
          <AnswerableRows
            // Rebuilding the sheet — a new seed, mode or case — asks different
            // questions, so answers already given belong to a sheet that no
            // longer exists. Keying on what built it clears them.
            key={`${mode}-${labelMode}-${sheetSeed}`}
            questions={questions}
          />
        </WorksheetPage>
      )}
    </div>
  );
}
