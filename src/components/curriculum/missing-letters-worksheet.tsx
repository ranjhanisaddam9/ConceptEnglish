"use client";

import { Fragment, useMemo, useState, type CSSProperties } from "react";
import { Printer } from "lucide-react";

import { SegmentedToggle } from "@/components/curriculum/segmented-toggle";
import { WorksheetPage } from "@/components/curriculum/worksheet-page";
import { Button } from "@/components/ui/button";
import { useLabelMode } from "@/hooks/use-preferences";
import { playAnswerSound } from "@/lib/curriculum/answer-sound";
import { labelModeOptions } from "@/lib/curriculum/display";
import {
  MISSING_LAYOUT,
  MISSING_MODE_OPTIONS,
  buildEntireSheet,
  buildRandomRows,
  missingInstruction,
  type GapQuestion,
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

/** What the child put in a gap, and whether it was the right letter. */
interface GapAnswer {
  letter: string;
  correct: boolean;
}

/**
 * The four letters offered for the gap, in a panel hanging under it.
 *
 * Hand-drawn rather than a positioned popover library: the panel only ever
 * needs to sit directly below the gap and point up at it, which is two lines
 * of CSS, and a portalled panel would be one more thing to keep off the paper.
 */
function Suggestions({
  options,
  onChoose,
  onDismiss,
}: {
  options: string[];
  onChoose: (option: string) => void;
  onDismiss: () => void;
}) {
  return (
    <>
      {/* Tapping anywhere else closes the panel. Whatever letter is already in
          the box then stands as the child's answer. */}
      <span
        aria-hidden
        onClick={onDismiss}
        className="fixed inset-0 z-40 cursor-default print:hidden"
      />

      <span
        role="dialog"
        aria-label="Choose the missing letter"
        className="absolute top-full left-1/2 z-50 -translate-x-1/2 print:hidden"
        style={{ marginTop: "2mm" }}
      >
        <span
          className="flex rounded-md border border-neutral-300 bg-white shadow-lg"
          style={{ gap: "1.5mm", padding: "1.5mm" }}
        >
          {options.map((option, index) => (
            <button
              key={`${option}-${index}`}
              type="button"
              onClick={() => onChoose(option)}
              className="font-letter flex cursor-pointer items-center justify-center rounded leading-none font-bold text-neutral-900 outline-none hover:bg-neutral-100 focus-visible:ring-4 focus-visible:ring-ring/60"
              style={{
                minWidth: "11mm",
                height: "11mm",
                padding: "0 1mm",
                fontSize: "7mm",
              }}
            >
              {option}
            </button>
          ))}
        </span>

        {/* Drawn after the panel so its white body covers the panel's top
            edge, leaving a point rather than a diamond on a line. */}
        <span
          aria-hidden
          className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 rotate-45 border-t border-l border-neutral-300 bg-white"
          style={{ width: "3mm", height: "3mm" }}
        />
      </span>
    </>
  );
}

/**
 * A gap that can be answered on screen.
 *
 * Three states: waiting its turn (nothing drawn — whatever the sheet already
 * put there stands), being asked (an outlined box washed through with its
 * colour, which will not sit still), and answered (the same box emptied out,
 * with the chosen letter in it).
 *
 * None of it prints. A worksheet that arrives with the answers already marked
 * is not a worksheet, so everything drawn here is print:hidden.
 */
function GapBox({
  question,
  answer,
  isActive,
  isOpen,
  onOpen,
  onChoose,
  onDismiss,
  letterSize,
  className,
  style,
}: {
  question: GapQuestion;
  answer: GapAnswer | undefined;
  /** True while this is the gap waiting on the child. */
  isActive: boolean;
  isOpen: boolean;
  onOpen: () => void;
  onChoose: (option: string) => void;
  onDismiss: () => void;
  /** Millimetres — the sheet's own letters, so the fill matches them. */
  letterSize: number;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span className={cn("relative", className)} style={style}>
      {isActive && (
        <button
          type="button"
          data-blank-pulse
          onClick={onOpen}
          aria-label="Choose the missing letter"
          className="absolute inset-0 cursor-pointer rounded-sm outline-none focus-visible:ring-4 focus-visible:ring-ring/60 print:hidden"
          style={{
            border: `2px solid ${question.colour}`,
            backgroundColor: `color-mix(in oklch, ${question.colour}, transparent 75%)`,
          }}
        />
      )}

      {/* Answered and done with: the gap has been filled in, so nothing is
          being asked of it any more. */}
      {answer && !isActive && (
        <span
          aria-hidden
          className="absolute inset-0 rounded-sm print:hidden"
          style={{ border: `2px solid ${question.colour}` }}
        />
      )}

      {answer && (
        <span
          className="font-letter pointer-events-none absolute inset-0 flex items-center justify-center leading-none font-bold print:hidden"
          style={{ fontSize: `${letterSize}mm`, color: question.colour }}
        >
          {answer.letter}
        </span>
      )}

      {isOpen && (
        <Suggestions
          options={question.options}
          onChoose={onChoose}
          onDismiss={onDismiss}
        />
      )}
    </span>
  );
}

/** The tick or cross beside an answered question. */
function AnswerMark({
  answer,
  className,
  style,
}: {
  answer: GapAnswer;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <span
      // Remounted per letter so a second wrong guess pops the cross again
      // rather than leaving the first one sitting there.
      key={answer.letter}
      data-answer-mark
      aria-live="polite"
      className={cn(
        "absolute text-center leading-none font-bold print:hidden",
        answer.correct ? "text-green-600" : "text-red-600",
        className,
      )}
      style={style}
    >
      {answer.correct ? "✓" : "✗"}
      <span className="sr-only">{answer.correct ? "Correct" : "Try again"}</span>
    </span>
  );
}

/**
 * Answering a sheet's gaps, one at a time and in reading order.
 *
 * Shared by both question shapes, because a gap is a gap: the state lives
 * above the gaps rather than inside them because only one is live at a time,
 * and finishing one is what starts the next. The component holding this is
 * remounted whenever the sheet is rebuilt — see where it is keyed — so a new
 * sheet starts clean.
 */
function useGapAnswers(gaps: GapQuestion[]) {
  const [answers, setAnswers] = useState<Record<string, GapAnswer>>({});
  const [activeIndex, setActiveIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const active = gaps[activeIndex] ?? null;

  const choose = (option: string) => {
    if (!active) return;

    const correct = option === active.answer;
    playAnswerSound(correct);
    setAnswers((previous) => ({
      ...previous,
      [active.id]: { letter: option, correct },
    }));

    // A wrong letter goes in the box but leaves the panel open, so the child
    // can try again. The right one settles the question.
    if (correct) {
      setIsOpen(false);
      setActiveIndex((index) => index + 1);
    }
  };

  const dismiss = () => {
    setIsOpen(false);
    // Tapping away only settles the question if a letter is already in the
    // box; otherwise it is still waiting to be answered.
    if (active && answers[active.id]) setActiveIndex((index) => index + 1);
  };

  return {
    answers,
    activeId: active?.id ?? null,
    isOpen,
    open: () => setIsOpen(true),
    choose,
    dismiss,
  };
}

type GapAnswering = ReturnType<typeof useGapAnswers>;

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
          answer={answer}
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
                    answer={answer}
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
