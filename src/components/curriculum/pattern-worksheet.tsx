"use client";

import { useMemo, useState } from "react";
import { Printer, Shuffle } from "lucide-react";

import { SegmentedToggle } from "@/components/curriculum/segmented-toggle";
import { WorksheetPage } from "@/components/curriculum/worksheet-page";
import { Button } from "@/components/ui/button";
import {
  FLUENCY_LAYOUT,
  PATTERN_MATCH_LAYOUT,
  PATTERN_WRITING_LAYOUT,
  PATTERN_WRITING_RULING,
  buildFluencyGrid,
  buildPatternMatchSheet,
  buildPatternWritingSheet,
} from "@/lib/curriculum/pattern-sheets";
import { PATTERN_SETS } from "@/lib/curriculum/patterns";
import { randomSheetSeed } from "@/lib/curriculum/sheet-order";
import type { ContentItem, Unit } from "@/lib/curriculum/types";

/**
 * The three worksheets a pattern unit offers.
 *
 * All of them share the unit's own control — pick a category and the sheet is
 * built from those patterns — so a blends unit can print a sheet of opening
 * blends or one of closing blends without a second page of settings.
 */

export type PatternSheetKind = "match" | "write" | "fluency";

export interface PatternWorksheetProps {
  unit: Pick<Unit, "title" | "patternSet">;
  items: ContentItem[];
  /** Words that actually have a picture file — see `selectPatternRows`. */
  illustrated: string[];
  kind: PatternSheetKind;
  seed: number;
}

/** The dot a line is drawn from or to. */
function Anchor() {
  return (
    <span
      className="shrink-0 rounded-full bg-neutral-800"
      style={{
        width: `${PATTERN_MATCH_LAYOUT.anchorRadius * 2}mm`,
        height: `${PATTERN_MATCH_LAYOUT.anchorRadius * 2}mm`,
      }}
    />
  );
}

const TITLES: Record<PatternSheetKind, string> = {
  match: "Match the picture",
  write: "Write the missing letters",
  fluency: "Read the words",
};

export function PatternWorksheet({
  unit,
  items,
  illustrated,
  kind,
  seed,
}: PatternWorksheetProps) {
  const set = PATTERN_SETS[unit.patternSet ?? "short_vowels"];
  const withPictures = useMemo(
    () => new Set(illustrated.map((word) => word.toLowerCase())),
    [illustrated],
  );
  const [sheetSeed, setSheetSeed] = useState(seed);
  const [category, setCategory] = useState<string>(set.options[0].value);

  const active =
    set.options.find((option) => option.value === category) ?? set.options[0];

  const scoped = useMemo(
    () => items.filter((item) => item.tags.includes(active.value)),
    [items, active],
  );

  const matchSheet = useMemo(
    () => buildPatternMatchSheet(scoped, withPictures, sheetSeed),
    [scoped, withPictures, sheetSeed],
  );
  const writingRows = useMemo(
    () => buildPatternWritingSheet(scoped, withPictures, sheetSeed),
    [scoped, withPictures, sheetSeed],
  );
  const fluencyWords = useMemo(
    () => buildFluencyGrid(scoped, sheetSeed),
    [scoped, sheetSeed],
  );

  const instruction: Record<PatternSheetKind, string> = {
    match: "Draw a line from each picture to the letters its word is built on.",
    write: "Write the missing letters to finish each word.",
    fluency: "Read each word aloud.",
  };

  const isEmpty =
    (kind === "match" && matchSheet.rows.length === 0) ||
    (kind === "write" && writingRows.length === 0) ||
    (kind === "fluency" && fluencyWords.length === 0);

  return (
    <div className="flex flex-col gap-6">
      {/* ---- Controls (screen only) ---- */}
      <div className="flex flex-wrap items-end justify-center gap-x-8 gap-y-4 print:hidden">
        {set.options.length > 1 && (
          <SegmentedToggle
            caption={set.caption}
            size={set.size}
            value={active.value}
            onChange={setCategory}
            options={set.options}
          />
        )}

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

      {isEmpty ? (
        <p className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
          No words here carry both a picture and letters that can be blanked
          out. Try another pattern.
        </p>
      ) : (
        <WorksheetPage
          title={`${unit.title} · ${TITLES[kind]}`}
          instruction={instruction[kind]}
        >
          {kind === "match" && <MatchRows sheet={matchSheet} />}
          {kind === "write" && <WritingRows rows={writingRows} />}
          {kind === "fluency" && <FluencyGrid words={fluencyWords} />}
        </WorksheetPage>
      )}
    </div>
  );
}

function MatchRows({
  sheet,
}: {
  sheet: ReturnType<typeof buildPatternMatchSheet>;
}) {
  return (
    <div
      className="flex flex-col"
      style={{
        gap: `${PATTERN_MATCH_LAYOUT.rowGap}mm`,
        paddingTop: `${PATTERN_MATCH_LAYOUT.rowGap}mm`,
      }}
    >
      {sheet.rows.map((row, index) => (
        <div
          key={row.id}
          className="flex items-center"
          style={{ height: `${PATTERN_MATCH_LAYOUT.rowHeight}mm` }}
        >
          {/* Plain <img> so the asset prints at its exact size — see the note
              in worksheet-page.tsx. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={row.picture.src}
            alt={row.picture.alt}
            className="shrink-0 object-contain"
            style={{
              width: `${PATTERN_MATCH_LAYOUT.pictureBox}mm`,
              height: `${PATTERN_MATCH_LAYOUT.pictureBox}mm`,
            }}
          />
          <Anchor />

          {/* The blank middle is where the child rules the line. */}
          <span className="flex-1" />

          <Anchor />
          <span
            className="font-letter flex shrink-0 items-center justify-center leading-none font-bold"
            style={{
              width: `${PATTERN_MATCH_LAYOUT.patternBox}mm`,
              fontSize: "11mm",
              color: sheet.patterns[index]?.colour,
            }}
          >
            {sheet.patterns[index]?.text}
          </span>
        </div>
      ))}
    </div>
  );
}

function WritingRows({
  rows,
}: {
  rows: ReturnType<typeof buildPatternWritingSheet>;
}) {
  const ruling = PATTERN_WRITING_RULING;

  return (
    <div
      className="flex flex-col"
      style={{
        gap: `${PATTERN_WRITING_LAYOUT.rowGap}mm`,
        paddingTop: `${PATTERN_WRITING_LAYOUT.rowGap}mm`,
      }}
    >
      {rows.map((row) => (
        <div
          key={row.id}
          className="flex items-center"
          style={{
            height: `${PATTERN_WRITING_LAYOUT.rowHeight}mm`,
            gap: `${PATTERN_WRITING_LAYOUT.gap}mm`,
          }}
        >
          {row.picture && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={row.picture.src}
              alt={row.picture.alt}
              className="shrink-0 object-contain"
              style={{
                width: `${PATTERN_WRITING_LAYOUT.pictureBox}mm`,
                height: `${PATTERN_WRITING_LAYOUT.pictureBox}mm`,
              }}
            />
          )}

          <svg
            viewBox={`0 0 ${row.width} ${ruling.height}`}
            style={{ width: `${row.width}mm`, height: `${ruling.height}mm` }}
            role="img"
            aria-label={`Write ${row.word}`}
          >
            {/* The blank sits on a line of its own so it reads as somewhere to
                write rather than a gap in the word. */}
            {row.slots
              .filter((slot) => slot.isBlank)
              .map((slot) => (
                <line
                  key={`blank-${slot.centre}`}
                  x1={slot.centre - slot.width / 2 + 1.5}
                  x2={slot.centre + slot.width / 2 - 1.5}
                  y1={ruling.baseline}
                  y2={ruling.baseline}
                  stroke="var(--worksheet-ink, #1f2937)"
                  strokeWidth={0.5}
                />
              ))}

            {row.slots
              .filter((slot) => !slot.isBlank)
              .map((slot) => (
                <text
                  key={`slot-${slot.centre}`}
                  x={slot.centre}
                  y={ruling.baseline}
                  textAnchor="middle"
                  fontFamily="Andika"
                  fontWeight={700}
                  fontSize={PATTERN_WRITING_LAYOUT.letterSize}
                  fill={row.colour}
                >
                  {slot.text}
                </text>
              ))}
          </svg>
        </div>
      ))}
    </div>
  );
}

function FluencyGrid({ words }: { words: string[] }) {
  return (
    <div
      className="grid"
      style={{
        gridTemplateColumns: `repeat(${FLUENCY_LAYOUT.columns}, 1fr)`,
        paddingTop: "6mm",
      }}
    >
      {words.map((word) => (
        <span
          key={word}
          className="font-letter flex items-center justify-center border-b border-neutral-200 font-bold"
          style={{
            height: `${FLUENCY_LAYOUT.rowHeight}mm`,
            fontSize: "8mm",
          }}
        >
          {word.toLowerCase()}
        </span>
      ))}
    </div>
  );
}
