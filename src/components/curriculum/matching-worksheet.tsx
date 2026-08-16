"use client";

import { useId, useMemo, useState } from "react";
import { Printer } from "lucide-react";

import { playAnswerSound } from "@/lib/curriculum/answer-sound";
import { SegmentedToggle } from "@/components/curriculum/segmented-toggle";
import { StepButton } from "@/components/curriculum/step-button";
import { WorksheetPage } from "@/components/curriculum/worksheet-page";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  MATCH_DIRECTION_OPTIONS,
  MATCH_LAYOUT,
  MATCH_ORDER_OPTIONS,
  MATCH_PATTERN_OPTIONS,
  buildMatchSheets,
  matchInstruction,
  type MatchDirection,
  type MatchOrder,
  type MatchPattern,
  type MatchQuestion,
} from "@/lib/curriculum/matching";
import type { ContentItem, Unit } from "@/lib/curriculum/types";
import { cn } from "@/lib/utils";

/**
 * "Match the letters" worksheet.
 *
 * Every letter in the unit appears exactly once across the set, which at ten
 * questions a page comes to three pages for the alphabet. Back and Next move
 * through them on screen; printing produces the whole set.
 *
 * Sheets are generated from a seed rather than Math.random, so the server and
 * the browser agree on the first render and "New sheet" is just a new seed.
 */

export interface MatchingWorksheetProps {
  unit: Pick<Unit, "title">;
  items: ContentItem[];
}

/** Deterministic first render; the button replaces it on demand. */
const INITIAL_SEED = 1;

function QuestionRow({
  question,
  pattern,
  imageOnly,
}: {
  question: MatchQuestion;
  pattern: MatchPattern;
  imageOnly: boolean;
}) {
  const encircled = pattern === "colour";
  // Only hide the letter when there is actually a picture to ask about.
  const hideLetter = imageOnly && question.picture !== null;

  // Answering happens on screen only. Nothing here prints: a worksheet that
  // arrives with the answers already marked is not a worksheet.
  const [chosen, setChosen] = useState<number | null>(null);
  const isCorrect =
    chosen !== null && question.options[chosen].text === question.answer;

  const choose = (index: number) => {
    // A second choice replaces the first rather than adding to it.
    setChosen(index);
    playAnswerSound(question.options[index].text === question.answer);
  };

  return (
    <div
      className="relative flex"
      style={{ height: `${MATCH_LAYOUT.promptBox}mm` }}
    >
      {chosen !== null && (
        <span
          data-answer-mark
          aria-live="polite"
          className={cn(
            "absolute top-1/2 -translate-y-1/2 text-center leading-none font-bold print:hidden",
            isCorrect ? "text-green-600" : "text-red-600",
          )}
          style={{ left: "-9mm", width: "8mm", fontSize: "7mm" }}
        >
          {isCorrect ? "✓" : "✗"}
          <span className="sr-only">
            {isCorrect ? "Correct" : "Try again"}
          </span>
        </span>
      )}

      {/* The letter's picture, in its own square to the left of the letter. */}
      <div
        className="flex shrink-0 items-center justify-center border-2 border-neutral-800 p-1"
        style={{ width: `${MATCH_LAYOUT.promptBox}mm` }}
      >
        {question.picture && (
          /* Kept as a plain <img> so the asset prints at its exact size —
             see the note in worksheet-page.tsx. */
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={question.picture.src}
            alt={question.picture.alt}
            className="size-full object-contain"
          />
        )}
      </div>

      {!hideLetter && (
        <div
          className="flex shrink-0 items-center justify-center border-2 border-l-0 border-neutral-800"
          style={{ width: `${MATCH_LAYOUT.promptBox}mm` }}
        >
          <span
            className="font-letter leading-none font-bold"
            style={{ fontSize: "11mm", color: question.promptColour }}
          >
            {question.prompt}
          </span>
        </div>
      )}

      <div className="flex flex-1 items-center justify-around border-2 border-l-0 border-neutral-800 px-2">
        {question.options.map((option, index) => {
          const picked = chosen === index;
          return (
            <button
              key={`${option.text}-${index}`}
              type="button"
              onClick={() => choose(index)}
              aria-pressed={picked}
              className={cn(
                "font-letter flex items-center justify-center leading-none font-bold",
                "outline-none focus-visible:ring-4 focus-visible:ring-ring/60",
                // On paper this is just a letter; on screen it answers back.
                "motion-safe:transition-transform motion-safe:duration-150",
                "cursor-pointer print:transform-none",
                // A ringed option carries its own colour as the signal, so it
                // only needs a nudge; a bare letter has nothing but its size.
                encircled ? "hover:scale-[1.2]" : "hover:scale-[1.3]",
                // In circle mode the child's job is to draw a ring, so
                // choosing draws one for them. The ring is always in the
                // layout and merely transparent until then, so nothing shifts
                // and the printed sheet is unchanged.
                !encircled && "rounded-full border-2 border-transparent",
                // In colour mode every option is already ringed, and the child
                // fills in the right one.
                encircled && "rounded-full border-2 border-neutral-800",
                encircled && "hover:bg-[color-mix(in_oklch,currentColor,transparent_75%)]",
              )}
              style={{
                ...(encircled
                  ? {
                      width: `${MATCH_LAYOUT.optionCircle}mm`,
                      height: `${MATCH_LAYOUT.optionCircle}mm`,
                      fontSize: "8mm",
                      color: option.colour,
                    }
                  : {
                      // Snug around the letter — the ring is a mark the child
                      // made, not a box the letter sits in.
                      width: `${MATCH_LAYOUT.optionCircle * 0.75}mm`,
                      height: `${MATCH_LAYOUT.optionCircle * 0.75}mm`,
                      fontSize: "9mm",
                      color: option.colour,
                    }),
                // Set here rather than as a utility class: the hover variant
                // owns the same property, and the two were cancelling out.
                ...(picked
                  ? { transform: encircled ? "scale(1.2)" : "scale(1.05)" }
                  : {}),
                ...(picked && !encircled
                  ? { borderColor: option.colour }
                  : {}),
                // A quarter-strength wash, so the letter still reads through
                // whatever the child has filled in.
                ...(picked && encircled
                  ? {
                      backgroundColor: `color-mix(in oklch, ${option.colour}, transparent 75%)`,
                    }
                  : {}),
              }}
            >
              {option.text}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function MatchingWorksheet({ unit, items }: MatchingWorksheetProps) {
  const [direction, setDirection] = useState<MatchDirection>("upper-to-lower");
  const [pattern, setPattern] = useState<MatchPattern>("circle");
  const [imageOnly, setImageOnly] = useState(false);
  const imageOnlyId = useId();
  const [order, setOrder] = useState<MatchOrder>("sequential");
  const [seed, setSeed] = useState(INITIAL_SEED);
  const [pageIndex, setPageIndex] = useState(0);

  const pages = useMemo(
    () => buildMatchSheets(items, direction, order, seed),
    [items, direction, order, seed],
  );

  // Clamped during render rather than synced in an effect, so a shorter set
  // never leaves the view pointing past the end.
  const currentPage = pages.length === 0 ? 0 : Math.min(pageIndex, pages.length - 1);

  const instruction = matchInstruction(direction, pattern, imageOnly);

  // Clamped, not wrapped: page 1 has no "back" and the last page has no
  // "next", so the set reads as a document rather than a carousel.
  const goToPage = (next: number) =>
    setPageIndex(Math.min(Math.max(next, 0), pages.length - 1));

  // Choosing Random reshuffles. Without this the seed would never change, so
  // "Random" would only ever produce one fixed arrangement.
  const handleOrderChange = (next: MatchOrder) => {
    setOrder(next);
    if (next === "random") {
      setSeed(Math.floor(Math.random() * 1_000_000_000));
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* ---- Controls (screen only) ---- */}
      <div className="flex flex-wrap items-end justify-center gap-x-8 gap-y-4 print:hidden">
        <SegmentedToggle
          caption="Match"
          value={direction}
          onChange={setDirection}
          options={MATCH_DIRECTION_OPTIONS}
        />
        <SegmentedToggle
          caption="Pattern"
          value={pattern}
          onChange={setPattern}
          options={MATCH_PATTERN_OPTIONS}
        />

        {/* Sits beside Pattern because it changes the same thing — the shape
            of a question — but combines with either marking style. */}
        <div className="flex h-12 items-center gap-2">
          <Checkbox
            id={imageOnlyId}
            checked={imageOnly}
            onCheckedChange={(checked) => setImageOnly(checked === true)}
            className="size-5"
          />
          <Label htmlFor={imageOnlyId} className="text-base">
            Image only
          </Label>
        </div>
        <SegmentedToggle
          caption="Order"
          value={order}
          onChange={handleOrderChange}
          options={MATCH_ORDER_OPTIONS}
        />

        <Button
          type="button"
          size="lg"
          onClick={() => window.print()}
          className="h-12 px-5"
        >
          <Printer aria-hidden />
          {pages.length > 1 ? `Print all ${pages.length} pages` : "Print worksheet"}
        </Button>
      </div>

      {pages.length === 0 ? (
        <p className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
          This unit has no letters with both a capital and a small form.
        </p>
      ) : (
        <>
          <div className="flex items-center justify-center gap-2 sm:gap-4 print:block">
            {pages.length > 1 && (
              // Kept in the layout but invisible at the first page, so the
              // sheet stays centred instead of jumping sideways.
              <StepButton
                direction="previous"
                targetLabel={`page ${currentPage}`}
                onClick={() => goToPage(currentPage - 1)}
                className={cn("print:hidden", currentPage === 0 && "invisible")}
              />
            )}

            {pages.map((questions, index) => (
              <WorksheetPage
                key={index}
                title={`${unit.title} · Match the letters`}
                instruction={`${instruction}  (Page ${index + 1} of ${pages.length})`}
                hiddenOnScreen={index !== currentPage}
                breakAfter={index < pages.length - 1}
              >
                <div
                  className="flex flex-col"
                  style={{
                    gap: `${MATCH_LAYOUT.rowGap}mm`,
                    paddingTop: `${MATCH_LAYOUT.rowGap}mm`,
                  }}
                >
                  {questions.map((question) => (
                    <QuestionRow
                      // Rebuilding the sheet — a new order, direction or
                      // shuffle — asks different questions, so any answers
                      // already marked belong to a sheet that no longer
                      // exists. Keying on what built it remounts the rows and
                      // clears them.
                      key={`${direction}-${order}-${seed}-${question.id}`}
                      question={question}
                      pattern={pattern}
                      imageOnly={imageOnly}
                    />
                  ))}
                </div>
              </WorksheetPage>
            ))}

            {pages.length > 1 && (
              <StepButton
                direction="next"
                targetLabel={`page ${currentPage + 2}`}
                onClick={() => goToPage(currentPage + 1)}
                className={cn(
                  "print:hidden",
                  currentPage === pages.length - 1 && "invisible",
                )}
              />
            )}
          </div>

          <p className="text-center text-sm text-muted-foreground print:hidden">
            Page {currentPage + 1} of {pages.length} ·{" "}
            {pages.reduce((total, page) => total + page.length, 0)} letters across
            the set
          </p>
        </>
      )}
    </div>
  );
}
