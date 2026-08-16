"use client";

import { useMemo, useState } from "react";
import { Printer, Shuffle } from "lucide-react";

import { SegmentedToggle } from "@/components/curriculum/segmented-toggle";
import { StepButton } from "@/components/curriculum/step-button";
import { WordShapeMark } from "@/components/curriculum/word-shape";
import { WorksheetPage } from "@/components/curriculum/worksheet-page";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  PATTERN_MATCH_LAYOUT,
  PATTERN_WRITING_LAYOUT,
  PATTERN_WRITING_RULING,
  CHOICE_MARK_OPTIONS,
  FLUENCY_ROWS_PER_PAGE,
  WORD_SHAPE_OPTIONS,
  buildChoiceSheet,
  buildFluencyGroups,
  type ChoiceMark,
  type WordShape,
  buildPatternMatchSheet,
  buildPatternWritingSheet,
  buildVowelMatchSheet,
} from "@/lib/curriculum/pattern-sheets";
import { PATTERN_SETS } from "@/lib/curriculum/patterns";
import {
  mulberry32,
  randomSheetSeed,
  shuffled,
} from "@/lib/curriculum/sheet-order";
import { CONTENT_WIDTH } from "@/lib/curriculum/worksheet";
import type { ContentItem, Unit } from "@/lib/curriculum/types";
import { cn } from "@/lib/utils";

/**
 * The three worksheets a pattern unit offers.
 *
 * All of them share the unit's own control — pick a category and the sheet is
 * built from those patterns — so a blends unit can print a sheet of opening
 * blends or one of closing blends without a second page of settings.
 */

export type PatternSheetKind =
  | "match"
  | "write"
  | "vowel"
  | "choose"
  | "fluency";

/** The oo families are a separate lesson, so they are opt-in. */
const OO_CATEGORY = "vowel-oo";

/** The blends unit's by-first-consonant cut. */
const LETTER_CATEGORY = "letter";

/**
 * Eight of the twenty-one blends open with s, so a sheet drawn at random comes
 * out looking like an s-blend sheet. This caps them, and offers the s-blends
 * on their own for when that is the lesson.
 */
const BLEND_SET_OPTIONS = [
  {
    value: "random" as const,
    label: "Random",
    description: "A spread of blends, holding s ones back",
  },
  {
    value: "s" as const,
    label: "S blends",
    description: "Only blends that open with s",
  },
];

/**
 * How many s-blends a "random" sheet may hold.
 *
 * The reading sheet keeps none at all — it prints one row per blend, and an s
 * row among them invites a child to read down the s column instead of across.
 * The choosing sheet allows one, placed last, so the shape is met once without
 * colouring the whole page.
 */
const MAX_S_BLENDS: Record<PatternSheetKind, number> = {
  match: 2,
  write: 2,
  vowel: 2,
  choose: 1,
  fluency: 0,
};

const isSBlend = (item: ContentItem) =>
  item.primaryLabel.length === 2 && item.primaryLabel.startsWith("s");

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
const CHOICE_ROW_HEIGHT_MM = 30;

const VOWEL_MATCH_ROWS = 6;
const VOWEL_MATCH_ROW_HEIGHT_MM = 36;
const SHAPED_ANSWER_WIDTH_MM = 30;
const SHAPED_ROW_HEIGHT_MM = 36;

export interface PatternWorksheetProps {
  unit: Pick<Unit, "title" | "patternSet">;
  items: ContentItem[];
  /** Words that actually have a picture file — see `selectPatternRows`. */
  illustrated: string[];
  kind: PatternSheetKind;
  seed: number;
}

/**
 * A word with a ruled gap where its pattern should be.
 *
 * Printed under the picture, so the line a child draws across the page is an
 * answer they have already worked out and written down.
 */
function BlankedWord({
  before,
  after,
  blankLength,
}: {
  before: string;
  after: string;
  blankLength: number;
}) {
  return (
    <span className="font-letter leading-none font-bold" style={{ fontSize: "7mm" }}>
      {before}
      <span
        className="mx-[0.6mm] inline-block border-b-[0.6mm] border-neutral-800 align-baseline"
        style={{ width: `${blankLength * 5}mm` }}
      />
      {after}
    </span>
  );
}

/**
 * Picture, the spelling with a gap, then the letters to choose between.
 *
 * In "colour" mode every option is drawn inside a ring, so the child fills one
 * in; in "circle" mode they are bare and the child draws the ring themselves.
 */
function ChoiceRows({
  sheet,
  mark,
}: {
  sheet: ReturnType<typeof buildChoiceSheet>;
  mark: ChoiceMark;
}) {
  return (
    <div className="flex flex-col" style={{ paddingTop: "4mm" }}>
      {sheet.rows.map((row) => (
        <div
          key={row.id}
          className="flex items-center border-b border-neutral-200"
          style={{ height: `${CHOICE_ROW_HEIGHT_MM}mm`, gap: "8mm" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={row.picture.src}
            alt={row.picture.alt}
            className="shrink-0 object-contain"
            style={{ width: "20mm", height: "20mm" }}
          />

          <span className="shrink-0" style={{ width: "34mm" }}>
            <BlankedWord
              before={row.before}
              after={row.after}
              blankLength={row.blankLength}
            />
          </span>

          <div className="flex flex-1 justify-end" style={{ gap: "6mm" }}>
            {row.options.map((option) => (
              <span
                key={option}
                className="font-letter flex items-center justify-center leading-none font-bold"
                style={{
                  width: "16mm",
                  height: "16mm",
                  fontSize: "7mm",
                  border:
                    mark === "colour" ? "0.6mm solid #1f2937" : undefined,
                  borderRadius: mark === "colour" ? "50%" : undefined,
                }}
              >
                {option}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
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
  choose: "Choose the missing letters",
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
  const [mark, setMark] = useState<ChoiceMark>("circle");
  const [blendSet, setBlendSet] = useState<"random" | "s">("random");
  const [page, setPage] = useState(0);

  // The oo families are their own lesson, so the spelling sheet leaves them
  // out and the vowel sheet takes them only when asked. The blends unit's
  // "Letter" cut gathers bl and br under a b — useful for browsing, but on a
  // choosing or reading sheet it would offer a single consonant as the answer
  // to a blend, or print the same word under two headings.
  const options = set.options.filter(
    (option) =>
      option.value !== OO_CATEGORY &&
      !(
        option.value === LETTER_CATEGORY &&
        (kind === "choose" || kind === "fluency")
      ),
  );
  const [category, setCategory] = useState<string>(options[0].value);
  const active =
    options.find((option) => option.value === category) ?? options[0];

  // Sheets that ask "which vowel?" draw on every vowel at once rather than one
  // at a time — picking the vowel first would give the answer away.
  const asksForTheVowel =
    kind === "vowel" ||
    ((kind === "write" || kind === "choose") &&
      unit.patternSet === "short_vowels");

  const inCategory = useMemo(() => {
    if (!asksForTheVowel) {
      return items.filter((item) => item.tags.includes(active.value));
    }
    return items.filter(
      (item) => includeOo || !item.tags.includes(OO_CATEGORY),
    );
  }, [items, active, asksForTheVowel, includeOo]);

  const choosesBlendSet =
    unit.patternSet === "blends" &&
    (kind === "choose" || kind === "write" || kind === "fluency");

  const scoped = useMemo(() => {
    if (!choosesBlendSet) return inCategory;
    if (blendSet === "s") return inCategory.filter(isSBlend);

    // Keep every other blend, and only a couple of the s ones, so a random
    // sheet is a spread rather than eight variations on s.
    const random = mulberry32(sheetSeed);
    const capped = shuffled(inCategory.filter(isSBlend), random).slice(
      0,
      MAX_S_BLENDS[kind],
    );
    return inCategory.filter((item) => !isSBlend(item)).concat(capped);
  }, [inCategory, choosesBlendSet, blendSet, sheetSeed, kind]);

  // A word-family unit is teaching whole words, so the child matches the
  // picture to its spelling rather than to a pattern.
  const isFamilyUnit = unit.patternSet === "short_vowels";

  const matchSheet = useMemo(
    () =>
      // A picture with its spelling beneath, answered by a shape, is a taller
      // row than a picture beside a letter — so fewer fit the page.
      buildPatternMatchSheet(
        scoped,
        withPictures,
        sheetSeed,
        SHAPED_MATCH_ROWS,
      ),
    [scoped, withPictures, sheetSeed],
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
    () =>
      buildVowelMatchSheet(
        scoped,
        withPictures,
        sheetSeed,
        includeOo,
        // A picture with its spelling under it is a taller row than a picture
        // alone, so fewer fit the page.
        VOWEL_MATCH_ROWS,
      ),
    [scoped, withPictures, sheetSeed, includeOo],
  );
  const choiceSheet = useMemo(
    () => buildChoiceSheet(scoped, withPictures, sheetSeed, isFamilyUnit),
    [scoped, withPictures, sheetSeed, isFamilyUnit],
  );
  // The one s-blend a random choosing sheet allows goes at the foot of the
  // page, so the sheet reads as a spread with s met once at the end.
  const choiceRows = useMemo(() => {
    if (!(choosesBlendSet && blendSet === "random")) return choiceSheet.rows;
    const isS = (answer: string) =>
      answer.length === 2 && answer.startsWith("s");
    return [...choiceSheet.rows].sort(
      (a, b) => Number(isS(a.answer)) - Number(isS(b.answer)),
    );
  }, [choiceSheet, choosesBlendSet, blendSet]);

  const fluencyGroups = useMemo(
    () => buildFluencyGroups(scoped, sheetSeed),
    [scoped, sheetSeed],
  );

  // A unit with more patterns than fit one page carries them onto the next,
  // rather than dropping any. Clamped during render so changing the category
  // or reshuffling cannot strand the reader on a page that no longer exists.
  const pageCount = Math.max(
    1,
    Math.ceil(fluencyGroups.length / FLUENCY_ROWS_PER_PAGE),
  );
  const currentPage = Math.min(page, pageCount - 1);
  const pageGroups = fluencyGroups.slice(
    currentPage * FLUENCY_ROWS_PER_PAGE,
    (currentPage + 1) * FLUENCY_ROWS_PER_PAGE,
  );

  const instruction: Record<PatternSheetKind, string> = {
    match: isFamilyUnit
      ? "Draw a line from each picture to the word that spells it."
      : "Draw a line from each picture to the letters its word is built on.",
    write: "Write the missing letters to finish each word.",
    vowel: "Draw a line from each picture to the vowel you hear in its word.",
    choose:
      mark === "circle"
        ? "Circle the letters that finish each word."
        : "Colour the letters that finish each word.",
    fluency: isFamilyUnit
      ? "Read each family aloud. Only the first sound changes."
      : "Read each row aloud. Every word in it shares the same letters.",
  };

  const isEmpty =
    (kind === "match" && matchSheet.rows.length === 0) ||
    (kind === "write" && writingRows.length === 0) ||
    (kind === "vowel" && vowelSheet.rows.length === 0) ||
    (kind === "choose" && choiceSheet.rows.length === 0) ||
    (kind === "fluency" && fluencyGroups.length === 0);

  return (
    <div className="flex flex-col gap-6">
      {/* ---- Controls (screen only) ---- */}
      <div className="flex flex-wrap items-end justify-center gap-x-8 gap-y-4 print:hidden">
        {!asksForTheVowel && options.length > 1 && (
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

        {(kind === "match" ||
          kind === "vowel" ||
          kind === "fluency") && (
          <SegmentedToggle
            caption="Shape"
            size="xs"
            value={shape}
            onChange={setShape}
            options={SHAPE_OPTIONS_WITH_ICONS}
          />
        )}

        {choosesBlendSet && (
          <SegmentedToggle
            caption="Blends"
            size="xs"
            value={blendSet}
            onChange={setBlendSet}
            options={BLEND_SET_OPTIONS}
          />
        )}

        {kind === "choose" && (
          <SegmentedToggle
            caption="Mark"
            size="xs"
            value={mark}
            onChange={setMark}
            options={CHOICE_MARK_OPTIONS}
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

        {/* Not offered on the reading sheet: it prints every pattern in a
            fixed order, so a reshuffle would change nothing a teacher can
            see. */}
        {kind !== "fluency" && (
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
        )}

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
        // The paging buttons sit either side of the sheet, level with its
        // middle, rather than up with the settings — the same place Unit 1's
        // multi-page sheets put them. Kept in the layout when unusable so the
        // sheet stays centred instead of jumping sideways.
        <div className="flex items-center justify-center gap-2 sm:gap-4 print:block">
          {kind === "fluency" && pageCount > 1 && (
            <StepButton
              direction="previous"
              targetLabel={`sheet ${currentPage}`}
              onClick={() => setPage(currentPage - 1)}
              className={cn("print:hidden", currentPage === 0 && "invisible")}
            />
          )}

        <WorksheetPage
          title={`${unit.title} · ${TITLES[kind]}`}
          instruction={instruction[kind]}
        >
          {kind === "match" && <MatchRows sheet={matchSheet} shape={shape} />}
          {kind === "write" && <WritingRows rows={writingRows} />}
          {kind === "vowel" && (
            <VowelMatchRows sheet={vowelSheet} shape={shape} />
          )}
          {kind === "choose" && (
            <ChoiceRows
              sheet={{ ...choiceSheet, rows: choiceRows }}
              mark={mark}
            />
          )}
          {kind === "fluency" && (
            <FluencyFamilies groups={pageGroups} shape={shape} />
          )}
        </WorksheetPage>

          {kind === "fluency" && pageCount > 1 && (
            <StepButton
              direction="next"
              targetLabel={`sheet ${currentPage + 2}`}
              onClick={() => setPage(currentPage + 1)}
              className={cn(
                "print:hidden",
                currentPage === pageCount - 1 && "invisible",
              )}
            />
          )}
        </div>
      )}
    </div>
  );
}

function MatchRows({
  sheet,
  shape,
}: {
  sheet: ReturnType<typeof buildPatternMatchSheet>;
  shape: WordShape;
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
          style={{ height: `${SHAPED_ROW_HEIGHT_MM}mm` }}
        >
          <div className="flex shrink-0 flex-col items-center">
            {/* Plain <img> so the asset prints at its exact size — see the
                note in worksheet-page.tsx. */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={row.picture.src}
              alt={row.picture.alt}
              className="object-contain"
              style={{
                width: `${PATTERN_MATCH_LAYOUT.pictureBox}mm`,
                height: `${PATTERN_MATCH_LAYOUT.pictureBox}mm`,
              }}
            />
            {row.blankLength > 0 && (
              <BlankedWord
                before={row.before}
                after={row.after}
                blankLength={row.blankLength}
              />
            )}
          </div>
          <Anchor />

          {/* The blank middle is where the child rules the line. */}
          <span className="flex-1" />

          <Anchor />
          <WordShapeMark
            word={sheet.patterns[index]?.text ?? ""}
            shape={shape}
            widthMm={SHAPED_ANSWER_WIDTH_MM}
            colour={sheet.patterns[index]?.colour ?? "#334155"}
          />
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
            style={{ height: `${VOWEL_MATCH_ROW_HEIGHT_MM}mm` }}
          >
            {/* Plain picture: a frame around it competes with the shapes on
                the answer side, which are the things being chosen between. */}
            <div className="flex shrink-0 flex-col items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={row.picture.src}
                alt={row.picture.alt}
                className="object-contain"
                style={{
                  width: `${PATTERN_MATCH_LAYOUT.pictureBox}mm`,
                  height: `${PATTERN_MATCH_LAYOUT.pictureBox}mm`,
                }}
              />
              {/* The spelling with its vowel taken out, so the line a child
                  draws is an answer they have already written down. */}
              <BlankedWord
                before={row.before}
                after={row.after}
                blankLength={row.blankLength}
              />
            </div>
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

