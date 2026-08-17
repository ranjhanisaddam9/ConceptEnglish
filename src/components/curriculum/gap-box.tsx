"use client";

import { useState, type CSSProperties } from "react";

import { playAnswerSound } from "@/lib/curriculum/answer-sound";
import type { GapQuestion } from "@/lib/curriculum/gap-question";
import { cn } from "@/lib/utils";

/**
 * Answering a gap on screen.
 *
 * Shared by every sheet built around a missing letter, so a gap behaves the
 * same wherever a child meets one: Unit 1's missing-letters sheet and Unit 2's
 * writing sheet both hang their blanks off this.
 *
 * Nothing here prints. A worksheet that arrives with the answers already filled
 * in is not a worksheet, so everything drawn is print:hidden.
 */

/** What the child put in a gap, and whether it was the right letter. */
export interface GapAnswer {
  letter: string;
  correct: boolean;
}

/**
 * How far a gap box stands outside the band its letter fills, in millimetres.
 *
 * Used by the sheets that lay a box over a ruled word. The box has to be
 * taller than the letter is, or a capital drawn at the word's own size fills
 * it corner to corner and reads as cramped. Standing it off the top line and
 * the baseline by the same amount keeps the letter inside the box the size it
 * is everywhere else on the row.
 */
export const GAP_BOX_PADDING = 2;

/**
 * The letters offered for the gap, in a panel hanging under it.
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
 */
export function GapBox({
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

/**
 * Answering a sheet's gaps, one at a time and in reading order.
 *
 * The state lives above the gaps rather than inside them because only one is
 * live at a time, and finishing one is what starts the next. The component
 * holding this is remounted whenever the sheet is rebuilt — see where it is
 * keyed — so a new sheet starts clean.
 */
export function useGapAnswers(gaps: GapQuestion[]) {
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

export type GapAnswering = ReturnType<typeof useGapAnswers>;
