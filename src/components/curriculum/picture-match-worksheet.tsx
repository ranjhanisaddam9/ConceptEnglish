"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import {
  playAnswerSound,
  playTapSound,
  startStretchSound,
  stopStretchSound,
} from "@/lib/curriculum/answer-sound";
import { AnswerMark } from "@/components/curriculum/answer-mark";
import { WorksheetToolbar } from "@/components/curriculum/worksheet-toolbar";
import {
  MatchAnchor,
  MatchAnchorDot,
} from "@/components/curriculum/match-anchor";
import { SegmentedToggle } from "@/components/curriculum/segmented-toggle";
import { WordSound } from "@/components/curriculum/word-sound";
import { WorksheetPage } from "@/components/curriculum/worksheet-page";
import { useLabelMode } from "@/hooks/use-preferences";
import { labelModeOptions } from "@/lib/curriculum/display";
import {
  CONSONANT_POSITION_OPTIONS,
  PICTURE_MATCH_GEOMETRY,
  PICTURE_MATCH_LAYOUT,
  buildPictureMatchSheet,
  type ConsonantPosition,
  type PictureMatchSheet,
} from "@/lib/curriculum/picture-match";
import { randomSheetSeed } from "@/lib/curriculum/sheet-order";
import type { ContentItem, Unit } from "@/lib/curriculum/types";
import { cn } from "@/lib/utils";

/**
 * "Match the picture to its letter" worksheet.
 *
 * Pictures on the left, the same letters shuffled on the right, and clear
 * space between the two columns for the child to rule lines across.
 *
 * On screen the sheet answers back. The dots beside the pictures pulse in
 * turn; tapping one draws a line out of it, the dots beside the letters take
 * over the pulsing, and tapping one of those lands the line green or red. None
 * of that prints — a worksheet that arrives already answered is not a
 * worksheet.
 */

export interface PictureMatchWorksheetProps {
  unit: Pick<Unit, "title" | "kind">;
  items: ContentItem[];
  /** Which letters to draw from, e.g. "consonant". */
  group: string;
  seed: number;
}

/** How long a line takes to run out to the dot it was aimed at. */
const LINE_STRETCH_MS = 320;

/** One line the child has drawn, and how it turned out. */
interface Attempt {
  /** Row of the picture it came from. */
  left: number;
  /** Row of the letter it landed on. */
  right: number;
  correct: boolean;
}

/**
 * Where a line's verdict is marked: out in the page margin beside the picture,
 * and nowhere else.
 *
 * A letter can be landed on by a line that was wrong and later by the one that
 * was right, so a mark out at that end says less about the letter than about
 * whoever last aimed at it — and two marks per line had children reading the
 * sheet as twice the questions.
 */
const MARK_STYLE = {
  left: "-9mm",
  width: "8mm",
  fontSize: "7mm",
  // The verdict arrives with the end of the line, not with the tap that sent
  // it — see the delay on the sound in chooseRight.
  animationDelay: `${LINE_STRETCH_MS}ms`,
} as const;

/**
 * The rows, and the lines drawn across them.
 *
 * Mounted fresh whenever the sheet is rebuilt, so lines belonging to questions
 * that are no longer being asked go with it.
 */
function MatchBoard({ sheet }: { sheet: PictureMatchSheet }) {
  /** The picture whose line is out, waiting on a letter. */
  const [chosen, setChosen] = useState<number | null>(null);
  const [attempts, setAttempts] = useState<Attempt[]>([]);
  const verdictTimers = useRef<number[]>([]);

  /**
   * Where the loose end of the line is, in the overlay's millimetres.
   *
   * Deliberately not cleared when a line lands: it is only ever drawn while a
   * picture is chosen, and keeping the last position means the next line
   * appears at the pointer straight away rather than waiting for it to move.
   * On a touchscreen a tap reports no movement at all, so nothing trails there
   * and the sheet behaves as it did before.
   */
  const overlay = useRef<SVGSVGElement>(null);
  const [looseEnd, setLooseEnd] = useState<{ x: number; y: number } | null>(
    null,
  );

  const boardHeight = PICTURE_MATCH_GEOMETRY.height(sheet.rows.length);

  useEffect(() => {
    // Nothing is being drawn, so there is nothing to follow — and no reason to
    // re-render the sheet on every mouse move.
    if (chosen === null) return;

    // Tracked on the window rather than the sheet, so the line keeps following
    // even when the pointer wanders off the page.
    const follow = (event: PointerEvent) => {
      const svg = overlay.current;
      if (!svg) return;

      const box = svg.getBoundingClientRect();
      if (!box.width || !box.height) return;

      // The overlay is laid out in millimetres, so client pixels have to be
      // scaled back into them before they can be drawn to.
      setLooseEnd({
        x:
          ((event.clientX - box.left) / box.width) *
          PICTURE_MATCH_GEOMETRY.width,
        y: ((event.clientY - box.top) / box.height) * boardHeight,
      });
    };

    window.addEventListener("pointermove", follow);
    return () => window.removeEventListener("pointermove", follow);
  }, [chosen, boardHeight]);

  useEffect(() => {
    const timers = verdictTimers.current;
    // Leaving mid-question would otherwise leave the held note sounding.
    return () => {
      stopStretchSound();
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  // A picture is finished once its line has landed, right or wrong. A letter
  // is only used up by a line that landed on it correctly, so a wrong guess
  // never takes a letter away from the picture it does belong to.
  const answered = new Set(attempts.map((attempt) => attempt.left));
  const claimed = new Set(
    attempts.filter((attempt) => attempt.correct).map((attempt) => attempt.right),
  );

  const chooseLeft = (index: number) => {
    if (answered.has(index)) return;

    // Tapping the chosen picture again puts the line away, so a misplaced tap
    // does not have to be answered before anything else can be.
    if (chosen === index) {
      setChosen(null);
      stopStretchSound();
      return;
    }

    setChosen(index);
    playTapSound();
    startStretchSound();
  };

  const chooseRight = (index: number) => {
    if (chosen === null || claimed.has(index)) return;

    stopStretchSound();
    playTapSound();

    const correct = sheet.letters[index].text === sheet.rows[chosen].letter;
    setAttempts((drawn) => [...drawn, { left: chosen, right: index, correct }]);
    setChosen(null);

    verdictTimers.current.push(
      window.setTimeout(() => playAnswerSound(correct), LINE_STRETCH_MS),
    );
  };

  return (
    <div
      className="relative flex flex-col"
      style={{
        gap: `${PICTURE_MATCH_LAYOUT.rowGap}mm`,
        paddingTop: `${PICTURE_MATCH_LAYOUT.rowGap}mm`,
      }}
    >
      {sheet.rows.map((row, index) => {
        const verdict =
          attempts.find((attempt) => attempt.left === index) ?? null;

        return (
          <div
            key={row.id}
            className="relative flex items-center"
            style={{ height: `${PICTURE_MATCH_LAYOUT.rowHeight}mm` }}
          >
            {verdict && (
              <AnswerMark
                correct={verdict.correct}
                className="top-1/2 -translate-y-1/2"
                style={MARK_STYLE}
              />
            )}

            {/* The word, said aloud, before anything else on the row — the
                question a child is answering. */}
            <WordSound word={row.picture.alt} />

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
            <MatchAnchor
              colour={sheet.anchorColours[index]}
              side="left"
              radius={PICTURE_MATCH_LAYOUT.anchorRadius}
              inset={PICTURE_MATCH_LAYOUT.anchorInset}
              label={`Draw a line from ${row.picture.alt}`}
              pulsing={chosen === null && !answered.has(index)}
              filled={chosen === index || answered.has(index)}
              pressed={chosen === index}
              disabled={answered.has(index)}
              onClick={() => chooseLeft(index)}
            />

            {/* The blank middle is where the child rules the line. */}
            <span className="flex-1" />

            {/* The answer is the dot and the letter together, in one target:
                a child aiming a line goes for the letter, not the small ring
                beside it. Hovering either lights up both — see the
                data-match-option rule in globals.css. */}
            <button
              type="button"
              data-match-option
              onClick={() => chooseRight(index)}
              disabled={chosen === null || claimed.has(index)}
              aria-label={`Join the line to ${sheet.letters[index].text}`}
              className={cn(
                "flex shrink-0 items-center rounded-full outline-none",
                "focus-visible:ring-4 focus-visible:ring-ring/60",
                chosen === null || claimed.has(index)
                  ? "cursor-default"
                  : "cursor-pointer",
              )}
            >
              <MatchAnchorDot
                colour={sheet.anchorColours[index]}
                radius={PICTURE_MATCH_LAYOUT.anchorRadius}
                pulsing={chosen !== null && !claimed.has(index)}
                // A wrong line touched this letter but did not settle on it,
                // so it stays an empty ring and stays available to its own
                // picture.
                filled={claimed.has(index)}
              />
              <span
                data-option-face
                className="font-letter flex shrink-0 items-center justify-center leading-none font-bold print:transform-none print:animate-none"
                style={{
                  width: `${PICTURE_MATCH_LAYOUT.letterBox}mm`,
                  marginLeft: `${PICTURE_MATCH_LAYOUT.anchorInset}mm`,
                  fontSize: "13mm",
                  color: sheet.letters[index].colour,
                }}
              >
                {sheet.letters[index].text}
              </span>
            </button>
          </div>
        );
      })}

      {/* The lines, over the rows rather than in them: one runs from any row to
          any other, so it belongs to the sheet and not to either end. Laid out
          in millimetres, like the page under it. */}
      <svg
        ref={overlay}
        viewBox={`0 0 ${PICTURE_MATCH_GEOMETRY.width} ${boardHeight}`}
        width={`${PICTURE_MATCH_GEOMETRY.width}mm`}
        height={`${boardHeight}mm`}
        aria-hidden
        className="pointer-events-none absolute top-0 left-0 print:hidden"
      >
        {/* The line still being drawn, trailing from the chosen picture to
            wherever the pointer is. Dashed and lighter than a landed line, so
            it reads as a line being pulled rather than one already ruled. */}
        {chosen !== null && looseEnd && (
          <line
            x1={PICTURE_MATCH_GEOMETRY.leftX}
            y1={PICTURE_MATCH_GEOMETRY.rowCentreY(chosen)}
            x2={looseEnd.x}
            y2={looseEnd.y}
            stroke="var(--worksheet-ink)"
            strokeWidth={0.7}
            strokeLinecap="round"
            strokeDasharray="2 1.8"
            strokeOpacity={0.7}
          />
        )}

        {attempts.map((attempt, index) => (
          <line
            key={index}
            data-match-line
            x1={PICTURE_MATCH_GEOMETRY.leftX}
            y1={PICTURE_MATCH_GEOMETRY.rowCentreY(attempt.left)}
            x2={PICTURE_MATCH_GEOMETRY.rightX}
            y2={PICTURE_MATCH_GEOMETRY.rowCentreY(attempt.right)}
            stroke={
              attempt.correct
                ? "var(--worksheet-right)"
                : "var(--worksheet-wrong)"
            }
            strokeWidth={0.9}
            strokeLinecap="round"
            // Normalised, so one dash offset draws every length of line.
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={0}
          />
        ))}
      </svg>
    </div>
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
      </WorksheetToolbar>

      {sheet.rows.length === 0 ? (
        <p className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
          No letters in this unit have both a picture and the right tag.
        </p>
      ) : (
        <WorksheetPage
          title={`${unit.title} · Match the picture`}
          instruction={instruction}
        >
          {/* A different sheet asks different questions, so the lines already
              drawn belong to one that no longer exists. Keying on what built
              it remounts the board and clears them. */}
          <MatchBoard
            key={`${position}-${labelMode}-${sheetSeed}`}
            sheet={sheet}
          />
        </WorksheetPage>
      )}
    </div>
  );
}
