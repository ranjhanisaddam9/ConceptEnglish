"use client";

import { useMemo, useState } from "react";
import { Printer, Shuffle } from "lucide-react";

import { SegmentedToggle } from "@/components/curriculum/segmented-toggle";
import { WordShapeMark } from "@/components/curriculum/word-shape";
import { WorksheetPage } from "@/components/curriculum/worksheet-page";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  FLUENCY_LAYOUT,
  PATTERN_MATCH_LAYOUT,
  PATTERN_WRITING_LAYOUT,
  PATTERN_WRITING_RULING,
  WORD_SHAPE_OPTIONS,
  buildFluencyGrid,
  buildFluencyGroups,
  type WordShape,
  buildPatternMatchSheet,
  buildPatternWritingSheet,
  buildVowelMatchSheet,
} from "@/lib/curriculum/pattern-sheets";
import { PATTERN_SETS } from "@/lib/curriculum/patterns";
import { randomSheetSeed } from "@/lib/curriculum/sheet-order";
import { CONTENT_WIDTH } from "@/lib/curriculum/worksheet";
import type { ContentItem, Unit } from "@/lib/curriculum/types";

/**
 * The three worksheets a pattern unit offers.
 *
 * All of them share the unit's own control — pick a category and the sheet is
 * built from those patterns — so a blends unit can print a sheet of opening
 * blends or one of closing blends without a second page of settings.
 */

export type PatternSheetKind = "match" | "write" | "vowel" | "fluency";

/** The oo families are a separate lesson, so they are opt-in. */
const OO_CATEGORY = "vowel-oo";

/**
 * The spelling sheet's answers sit inside a shape, which is taller than a line
 * of type — so its rows are taller and there are fewer of them.
 */
/**
 * The shape control shows each shape rather than naming it.
 *
 * "Cloud" and "Train" are quicker to recognise as drawings than as words, and
 * the option's description still names it for a screen reader and the tooltip.
 * Drawn in currentColor so the selected one inverts with its button.
 */
const SHAPE_OPTIONS_WITH_ICONS = WORD_SHAPE_OPTIONS.map((option) => ({
  ...option,
  icon: (
    <WordShapeMark
      word=""
      shape={option.value}
      widthMm={8}
      colour="currentColor"
      tilt={0}
    />
  ),
}));

const SHAPED_MATCH_ROWS = 6;
const SHAPED_ANSWER_WIDTH_MM = 30;
const SHAPED_ROW_HEIGHT_MM = 34;

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
  match: "Match the spelling",
  write: "Write the missing letters",
  vowel: "Match the vowel",
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
  const [includeOo, setIncludeOo] = useState(false);
  // Clouds on the spelling sheet, where the answer is a whole word and the
  // roomiest outline reads best; balloons on the reading sheet.
  const [shape, setShape] = useState<WordShape>(
    kind === "match" ? "cloud" : "balloon",
  );

  // The oo families are their own lesson, so the spelling sheet leaves them
  // out and the vowel sheet takes them only when asked.
  const options = set.options.filter((option) => option.value !== OO_CATEGORY);
  const [category, setCategory] = useState<string>(options[0].value);
  const active =
    options.find((option) => option.value === category) ?? options[0];

  // A vowel sheet asks "which vowel?", so it draws on every vowel at once
  // rather than one at a time.
  const scoped = useMemo(() => {
    if (kind !== "vowel") {
      return items.filter((item) => item.tags.includes(active.value));
    }
    return items.filter(
      (item) => includeOo || !item.tags.includes(OO_CATEGORY),
    );
  }, [items, active, kind, includeOo]);

  // A word-family unit is teaching whole words, so the child matches the
  // picture to its spelling rather than to a pattern.
  const isFamilyUnit = unit.patternSet === "short_vowels";

  const matchSheet = useMemo(
    () =>
      buildPatternMatchSheet(
        scoped,
        withPictures,
        sheetSeed,
        // A shaped answer is taller than a bare word, so fewer fit the page.
        isFamilyUnit ? SHAPED_MATCH_ROWS : undefined,
        isFamilyUnit ? "word" : "pattern",
      ),
    [scoped, withPictures, sheetSeed, isFamilyUnit],
  );
  const writingRows = useMemo(
    () =>
      buildPatternWritingSheet(
        scoped,
        withPictures,
        sheetSeed,
        undefined,
        // A word-family unit is teaching the vowel, so that is what the child
        // supplies — the consonants around it are the clue, not the question.
        isFamilyUnit ? "vowel" : "auto",
      ),
    [scoped, withPictures, sheetSeed, isFamilyUnit],
  );
  const vowelSheet = useMemo(
    () => buildVowelMatchSheet(scoped, withPictures, sheetSeed, includeOo),
    [scoped, withPictures, sheetSeed, includeOo],
  );
  const fluencyWords = useMemo(
    () => buildFluencyGrid(scoped, sheetSeed),
    [scoped, sheetSeed],
  );
  const fluencyGroups = useMemo(
    () => buildFluencyGroups(scoped, sheetSeed),
    [scoped, sheetSeed],
  );

  const instruction: Record<PatternSheetKind, string> = {
    match: isFamilyUnit
      ? "Draw a line from each picture to the word that spells it."
      : "Draw a line from each picture to the letters its word is built on.",
    write: "Write the missing letters to finish each word.",
    vowel: "Draw a line from each picture to the vowel you hear in its word.",
    fluency: isFamilyUnit
      ? "Read each family aloud. Only the first sound changes."
      : "Read each word aloud.",
  };

  const isEmpty =
    (kind === "match" && matchSheet.rows.length === 0) ||
    (kind === "write" && writingRows.length === 0) ||
    (kind === "vowel" && vowelSheet.rows.length === 0) ||
    (kind === "fluency" && fluencyWords.length === 0);

  return (
    <div className="flex flex-col gap-6">
      {/* ---- Controls (screen only) ---- */}
      <div className="flex flex-wrap items-end justify-center gap-x-8 gap-y-4 print:hidden">
        {kind !== "vowel" && options.length > 1 && (
          <SegmentedToggle
            caption={set.caption}
            // Tighter than on the lesson page: a worksheet's controls sit
            // above the sheet and should not compete with it.
            size={set.size === "sm" ? "xs" : set.size}
            value={active.value}
            onChange={setCategory}
            options={options}
          />
        )}

        {(kind === "fluency" || kind === "match" || kind === "vowel") &&
          isFamilyUnit && (
          <SegmentedToggle
            caption="Shape"
            size="xs"
            value={shape}
            onChange={setShape}
            options={SHAPE_OPTIONS_WITH_ICONS}
          />
        )}

        {kind === "vowel" && (
          <label className="flex h-12 cursor-pointer items-center gap-2.5 rounded-full border px-5 text-sm font-medium">
            <Checkbox
              checked={includeOo}
              onCheckedChange={(next) => setIncludeOo(next === true)}
            />
            Include oo
          </label>
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
          {kind === "match" && (
            <MatchRows
              sheet={matchSheet}
              shape={isFamilyUnit ? shape : undefined}
            />
          )}
          {kind === "write" && <WritingRows rows={writingRows} />}
          {kind === "vowel" && (
            <VowelMatchRows sheet={vowelSheet} shape={shape} />
          )}
          {kind === "fluency" &&
            (isFamilyUnit ? (
              <FluencyFamilies groups={fluencyGroups} shape={shape} />
            ) : (
              <FluencyGrid words={fluencyWords} />
            ))}
        </WorksheetPage>
      )}
    </div>
  );
}

function MatchRows({
  sheet,
  shape,
}: {
  sheet: ReturnType<typeof buildPatternMatchSheet>;
  /** Set to put each answer inside a drawing rather than printing it bare. */
  shape?: WordShape;
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
          style={{
            height: `${shape ? SHAPED_ROW_HEIGHT_MM : PATTERN_MATCH_LAYOUT.rowHeight}mm`,
          }}
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
          {shape ? (
            <WordShapeMark
              word={sheet.patterns[index]?.text ?? ""}
              shape={shape}
              widthMm={SHAPED_ANSWER_WIDTH_MM}
              colour={sheet.patterns[index]?.colour ?? "#334155"}
            />
          ) : (
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
          )}
        </div>
      ))}
    </div>
  );
}

/**
 * Pictures on the left, the vowels on the right.
 *
 * Many pictures share one vowel, so the two sides hold different numbers of
 * items and cannot be laid out as shared rows — each column distributes its
 * own, and the lines cross the gap between.
 */
function VowelMatchRows({
  sheet,
  shape,
}: {
  sheet: ReturnType<typeof buildVowelMatchSheet>;
  shape: WordShape;
}) {
  return (
    <div className="flex items-stretch" style={{ paddingTop: "6mm" }}>
      <div
        className="flex flex-col"
        style={{ gap: `${PATTERN_MATCH_LAYOUT.rowGap}mm` }}
      >
        {sheet.rows.map((row) => (
          <div
            key={row.id}
            className="flex items-center"
            style={{ height: `${SHAPED_ROW_HEIGHT_MM}mm` }}
          >
            {/* Plain picture: a frame around it competes with the shapes on
                the answer side, which are the things being chosen between. */}
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
          </div>
        ))}
      </div>

      {/* The blank middle is where the child rules the lines. */}
      <span className="flex-1" />

      {/* Held in from the right edge, so the ships sit on the page rather than
          against its margin. */}
      <div
        className="flex flex-col justify-around"
        style={{ marginRight: "14mm" }}
      >
        {sheet.vowels.map((vowel) => (
          <div key={vowel.text} className="flex items-center">
            <Anchor />
            <WordShapeMark
              word={vowel.text}
              shape={shape}
              widthMm={28}
              colour={vowel.colour}
            />
          </div>
        ))}
      </div>
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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={row.picture.src}
            alt={row.picture.alt}
            className="shrink-0 object-contain"
            style={{
              width: `${PATTERN_WRITING_LAYOUT.pictureBox}mm`,
              height: `${PATTERN_WRITING_LAYOUT.pictureBox}mm`,
            }}
          />

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

/**
 * The words kept in their families, one family per line.
 *
 * A single column down the page: a vowel holds few enough families to fit,
 * and one line per family is what makes the ending read as the thing that
 * stays put.
 */
function FluencyFamilies({
  groups,
  shape,
}: {
  groups: ReturnType<typeof buildFluencyGroups>;
  shape: WordShape;
}) {
  // The widest family decides the width, so every row lines up and the longest
  // one still fits inside the margins.
  const widest = Math.max(...groups.map((group) => group.words.length), 1);
  const wordWidth = Math.min(26, (CONTENT_WIDTH - 24) / widest);

  return (
    <div className="flex flex-col" style={{ paddingTop: "4mm" }}>
      {groups.map((group) => (
        <div
          key={group.label}
          className="flex items-center border-b border-neutral-200"
          style={{ gap: "2mm", paddingBottom: "1mm" }}
        >
          <span
            className="font-letter shrink-0 font-bold text-neutral-400"
            style={{ width: "22mm", fontSize: "9mm" }}
          >
            {group.label}
          </span>
          {group.words.map((word) => (
            <WordShapeMark
              key={word.text}
              word={word.text}
              shape={shape}
              widthMm={wordWidth}
              colour={word.colour}
              tilt={word.tilt}
            />
          ))}
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
