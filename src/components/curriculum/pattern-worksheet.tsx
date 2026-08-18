"use client";

import { useEffect, useMemo, useRef, useState } from "react";

import { AnswerMark } from "@/components/curriculum/answer-mark";
import { ToolbarCheckbox, WorksheetToolbar } from "@/components/curriculum/worksheet-toolbar";
import {
  GAP_BOX_PADDING,
  GapBox,
  useGapAnswers,
  type GapAnswering,
} from "@/components/curriculum/gap-box";
import { MatchAnchor } from "@/components/curriculum/match-anchor";
import { MatchLines, useMatchLines } from "@/components/curriculum/match-lines";
import { SegmentedToggle } from "@/components/curriculum/segmented-toggle";
import { SoundButton } from "@/components/curriculum/sound-button";
import { StepButton } from "@/components/curriculum/step-button";
import { WordShapeMark } from "@/components/curriculum/word-shape";
import { WordSound } from "@/components/curriculum/word-sound";
import { WorksheetPage } from "@/components/curriculum/worksheet-page";
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
import {
  playAnswerSound,
  playTapSound,
  startStretchSound,
  stopStretchSound,
} from "@/lib/curriculum/answer-sound";
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
    // Not "Random": the sheet deliberately holds s-blends back, which is the
    // one thing a random draw would not do.
    label: "Mixed",
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
      widthMm={11}
      colour="currentColor"
      tilt={0}
    />
  ),
}));

/**
 * The name of the shape currently chosen.
 *
 * The buttons are drawings, which is right — a cloud is quicker to recognise
 * drawn than spelled — but it leaves the control unable to say what it is set
 * to. Naming the pick in the caption puts the word back without putting it in
 * five buttons, and reaches a touchscreen, which never sees a tooltip.
 */
const shapeLabel = (value: WordShape) =>
  WORD_SHAPE_OPTIONS.find((option) => option.value === value)?.label ?? "";

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

/** The box an option sits in, in millimetres. */
const CHOICE_OPTION_BOX = 16;

/**
 * One row of the choosing sheet: picture, the spelling with a gap, then the
 * letters to choose between.
 *
 * In "colour" mode every option is drawn inside a ring, so the child fills one
 * in; in "circle" mode they are bare and the child draws the ring themselves.
 *
 * Answering happens on screen only, exactly as it does on Unit 1's matching
 * sheet: choosing rings a bare option or washes a ringed one, and the tick or
 * cross sits out in the margin beside the row. Nothing here prints — a
 * worksheet that arrives with the answers already marked is not a worksheet.
 */
function ChoiceQuestionRow({
  row,
  mark,
}: {
  row: ReturnType<typeof buildChoiceSheet>["rows"][number];
  mark: ChoiceMark;
}) {
  const encircled = mark === "colour";

  const [chosen, setChosen] = useState<number | null>(null);
  const isCorrect =
    chosen !== null && row.options[chosen].text === row.answer;

  const choose = (index: number) => {
    // A second choice replaces the first rather than adding to it.
    setChosen(index);
    playAnswerSound(row.options[index].text === row.answer);
  };

  return (
    <div
      className="relative flex items-center border-b border-neutral-200"
      style={{ height: `${CHOICE_ROW_HEIGHT_MM}mm`, gap: "8mm" }}
    >
      {chosen !== null && (
        <AnswerMark
          correct={isCorrect}
          popKey={row.options[chosen].text}
          className="top-1/2 -translate-y-1/2"
          style={{ left: "-9mm", width: "8mm", fontSize: "7mm" }}
        />
      )}

      {/* The word, said aloud, before anything else on the row. */}
      <WordSound word={row.picture.alt} />

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
        {row.options.map((option, index) => {
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
                encircled ? "hover:scale-[1.1]" : "hover:scale-[1.2]",
                "rounded-full",
                encircled && "hover:bg-[color-mix(in_oklch,currentColor,transparent_75%)]",
              )}
              style={{
                width: `${CHOICE_OPTION_BOX}mm`,
                height: `${CHOICE_OPTION_BOX}mm`,
                fontSize: "7mm",
                color: option.colour,
                // In circle mode the child's job is to draw a ring, so
                // choosing draws one for them. The ring is always in the
                // layout and merely transparent until then, so nothing shifts
                // and the printed sheet is unchanged.
                border: encircled
                  ? "0.6mm solid #1f2937"
                  : `0.6mm solid ${picked ? option.colour : "transparent"}`,
                // Set here rather than as a utility class: the hover variant
                // owns the same property, and the two were cancelling out.
                ...(picked
                  ? { transform: encircled ? "scale(1.1)" : "scale(1.05)" }
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
        <ChoiceQuestionRow key={row.id} row={row} mark={mark} />
      ))}
    </div>
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
      <WorksheetToolbar
        // Not offered on the reading sheet: it prints every pattern in a fixed
        // order, so a reshuffle would change nothing a teacher can see.
        onNewSheet={
          kind === "fluency" ? undefined : () => setSheetSeed(randomSheetSeed())
        }
      >
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
            caption={`Shape · ${shapeLabel(shape)}`}
            size="icon"
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
          <ToolbarCheckbox
            checked={includeOo}
            onChange={setIncludeOo}
            label="Include oo"
          />
        )}
      </WorksheetToolbar>

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
          {kind === "match" && (
            // A rebuilt sheet asks about different pictures, so the lines
            // already drawn belong to one that no longer exists. Shape is
            // left out: it redraws the answers without changing a question.
            <MatchRows
              key={`${active.value}-${blendSet}-${sheetSeed}`}
              sheet={matchSheet}
              shape={shape}
            />
          )}
          {kind === "write" && (
            // A rebuilt sheet asks about different words, so answers already
            // given belong to one that no longer exists.
            <WritingRows
              key={`${active.value}-${blendSet}-${sheetSeed}`}
              rows={writingRows}
            />
          )}
          {kind === "vowel" && (
            // A rebuilt sheet asks about different pictures, so the lines
            // already drawn belong to one that no longer exists. Keying on
            // what built it remounts the board and clears them. Shape is
            // deliberately left out: it redraws the answers without changing
            // a single question.
            <VowelMatchRows
              key={`${sheetSeed}-${includeOo}`}
              sheet={vowelSheet}
              shape={shape}
            />
          )}
          {kind === "choose" && (
            // A rebuilt sheet asks different questions, so answers already
            // given belong to one that no longer exists. Mark is deliberately
            // left out: it changes how an answer is drawn, not what is asked.
            <ChoiceRows
              key={`${active.value}-${blendSet}-${sheetSeed}`}
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

/**
 * Pictures on the left, the patterns they are built on shuffled down the
 * right.
 *
 * On screen the sheet answers back, the same way Unit 2's matching sheet does:
 * the dots beside the pictures pulse, tapping one draws a line out of it, the
 * dots beside the patterns take over the pulsing, and tapping one lands the
 * line green or red. A pattern is used up once a line settles on it — unlike
 * the vowel sheet, each picture here has its own.
 *
 * The dots are measured rather than placed: a picture sits over a spelling of
 * whatever width its word comes to, so the left column's edge moves from row
 * to row.
 */
function MatchRows({
  sheet,
  shape,
}: {
  sheet: ReturnType<typeof buildPatternMatchSheet>;
  shape: WordShape;
}) {
  /** The picture whose line is out, waiting on a pattern. */
  const [chosen, setChosen] = useState<number | null>(null);
  const [attempts, setAttempts] = useState<LineAttempt[]>([]);
  const verdictTimers = useRef<number[]>([]);

  const { board, leftDots, rightDots, anchors, trail } = useMatchLines(
    `${shape}-${sheet.rows.length}`,
    chosen !== null,
  );

  useEffect(() => {
    const timers = verdictTimers.current;
    return () => {
      stopStretchSound();
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  const answered = new Set(attempts.map((attempt) => attempt.row));
  // A pattern settled on correctly is spoken for; one a wrong line merely
  // touched stays available to the picture it does belong to.
  const claimed = new Set(
    attempts.filter((attempt) => attempt.correct).map((attempt) => attempt.target),
  );

  const choosePicture = (index: number) => {
    if (answered.has(index)) return;

    if (chosen === index) {
      setChosen(null);
      stopStretchSound();
      return;
    }

    setChosen(index);
    playTapSound();
    startStretchSound();
  };

  const choosePattern = (index: number) => {
    if (chosen === null || claimed.has(index)) return;

    stopStretchSound();
    playTapSound();

    const correct = sheet.patterns[index].text === sheet.rows[chosen].pattern;
    setAttempts((drawn) => [...drawn, { row: chosen, target: index, correct }]);
    setChosen(null);

    verdictTimers.current.push(
      window.setTimeout(() => playAnswerSound(correct), LINE_STRETCH_MS),
    );
  };

  return (
    <div
      ref={board}
      className="relative flex flex-col"
      style={{
        gap: `${PATTERN_MATCH_LAYOUT.rowGap}mm`,
        paddingTop: `${PATTERN_MATCH_LAYOUT.rowGap}mm`,
      }}
    >
      {sheet.rows.map((row, index) => {
        const verdict =
          attempts.find((attempt) => attempt.row === index) ?? null;

        return (
          <div
            key={row.id}
            className="relative flex items-center"
            style={{ height: `${SHAPED_ROW_HEIGHT_MM}mm` }}
          >
            {verdict && (
              <AnswerMark
                correct={verdict.correct}
                className="top-1/2 -translate-y-1/2"
                style={{
                  left: "-9mm",
                  width: "8mm",
                  fontSize: "7mm",
                  animationDelay: `${LINE_STRETCH_MS}ms`,
                }}
              />
            )}

            {/* The word, said aloud, before anything else on the row. */}
            <WordSound word={row.picture.alt} />

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

            <span
              ref={(element) => {
                leftDots.current[index] = element;
              }}
              className="flex"
            >
              <MatchAnchor
                colour={sheet.patterns[index]?.colour ?? "var(--worksheet-ink)"}
                side="left"
                radius={VOWEL_ANCHOR_RADIUS}
                inset={VOWEL_ANCHOR_INSET}
                label={`Draw a line from ${row.picture.alt}`}
                pulsing={chosen === null && !answered.has(index)}
                filled={chosen === index || answered.has(index)}
                pressed={chosen === index}
                disabled={answered.has(index)}
                onClick={() => choosePicture(index)}
              />
            </span>

            {/* The blank middle is where the child rules the line. */}
            <span className="flex-1" />

            <span
              ref={(element) => {
                rightDots.current[index] = element;
              }}
              className="flex"
            >
              <MatchAnchor
                colour={sheet.patterns[index]?.colour ?? "var(--worksheet-ink)"}
                side="right"
                radius={VOWEL_ANCHOR_RADIUS}
                inset={VOWEL_ANCHOR_INSET}
                label={`Join the line to ${sheet.patterns[index]?.text ?? ""}`}
                pulsing={chosen !== null && !claimed.has(index)}
                filled={claimed.has(index)}
                disabled={chosen === null || claimed.has(index)}
                onClick={() => choosePattern(index)}
              />
            </span>

            <WordShapeMark
              word={sheet.patterns[index]?.text ?? ""}
              shape={shape}
              widthMm={SHAPED_ANSWER_WIDTH_MM}
              colour={sheet.patterns[index]?.colour ?? "#334155"}
            />
          </div>
        );
      })}

      <MatchLines
        anchors={anchors}
        lines={attempts.map((attempt) => ({
          from: attempt.row,
          to: attempt.target,
          correct: attempt.correct,
        }))}
        pending={chosen === null ? null : { from: chosen, to: trail }}
      />
    </div>
  );
}

/**
 * The vowel sheet's dots are tapped, so they are the size Unit 2's matching
 * sheet uses rather than the plain printed anchors on the other sheets.
 */
const VOWEL_ANCHOR_RADIUS = 2.4;
const VOWEL_ANCHOR_INSET = 3;

/** How long a line takes to run out to the shape it was aimed at. */
const LINE_STRETCH_MS = 320;

/** One line the child has drawn, and how it turned out. */
interface LineAttempt {
  /** Row of the picture it came from. */
  row: number;
  /** Index in the answer column it landed on. */
  target: number;
  correct: boolean;
}

/**
 * Pictures on the left, the vowels on the right.
 *
 * Many pictures share one vowel, so the two sides hold different numbers of
 * items and cannot be laid out as shared rows — each column distributes its
 * own, and the lines cross the gap between.
 *
 * On screen the sheet answers back, the same way Unit 2's matching sheet does:
 * the dots beside the pictures pulse, tapping one draws a line out of it, the
 * dots beside the vowels take over the pulsing, and tapping one lands the line
 * green or red. The one difference is that a vowel is never used up — several
 * pictures share it, and that is the whole exercise — so it stays available
 * however many lines have already landed on it.
 *
 * None of it prints. Because the right-hand column distributes itself over
 * whatever height the left one comes to, the dots cannot be placed from the
 * layout constants the way Unit 2's can, so their centres are measured off the
 * page and the lines are drawn in pixels.
 */
function VowelMatchRows({
  sheet,
  shape,
}: {
  sheet: ReturnType<typeof buildVowelMatchSheet>;
  shape: WordShape;
}) {
  /** The picture whose line is out, waiting on a vowel. */
  const [chosen, setChosen] = useState<number | null>(null);
  const [attempts, setAttempts] = useState<LineAttempt[]>([]);
  const verdictTimers = useRef<number[]>([]);

  // The shape control changes how tall the answer column's marks are, which
  // moves every dot in it.
  const { board, leftDots, rightDots, anchors, trail } = useMatchLines(
    `${shape}-${sheet.rows.length}-${sheet.vowels.length}`,
    chosen !== null,
  );

  useEffect(() => {
    const timers = verdictTimers.current;
    // Leaving mid-question would otherwise leave the held note sounding.
    return () => {
      stopStretchSound();
      timers.forEach((timer) => window.clearTimeout(timer));
    };
  }, []);

  const answered = new Set(attempts.map((attempt) => attempt.row));
  // A vowel belongs to as many pictures as name it, so landing on one never
  // takes it away from the others. Filling it in only reports that at least
  // one line has settled there.
  const settled = new Set(
    attempts.filter((attempt) => attempt.correct).map((attempt) => attempt.target),
  );

  const choosePicture = (index: number) => {
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

  const chooseVowel = (index: number) => {
    if (chosen === null) return;

    stopStretchSound();
    playTapSound();

    const correct = sheet.vowels[index].text === sheet.rows[chosen].vowel;
    setAttempts((drawn) => [...drawn, { row: chosen, target: index, correct }]);
    setChosen(null);

    verdictTimers.current.push(
      window.setTimeout(() => playAnswerSound(correct), LINE_STRETCH_MS),
    );
  };

  return (
    <div
      ref={board}
      className="relative flex items-stretch"
      style={{ paddingTop: "6mm" }}
    >
      <div
        className="flex flex-col"
        style={{ gap: `${PATTERN_MATCH_LAYOUT.rowGap}mm` }}
      >
        {sheet.rows.map((row, index) => {
          const verdict =
            attempts.find((attempt) => attempt.row === index) ?? null;

          return (
            <div
              key={row.id}
              className="relative flex items-center"
              style={{ height: `${VOWEL_MATCH_ROW_HEIGHT_MM}mm` }}
            >
              {verdict && (
                <AnswerMark
                  correct={verdict.correct}
                  className="top-1/2 -translate-y-1/2"
                  style={{
                    left: "-9mm",
                    width: "8mm",
                    fontSize: "7mm",
                    // The verdict arrives with the end of the line, not with
                    // the tap that sent it.
                    animationDelay: `${LINE_STRETCH_MS}ms`,
                  }}
                />
              )}

              {/* The word, said aloud, before anything else on the row. */}
              <WordSound word={row.picture.alt} />

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

              <span
                ref={(element) => {
                  leftDots.current[index] = element;
                }}
                className="flex"
              >
                <MatchAnchor
                  colour={sheet.anchorColours[index]}
                  side="left"
                  radius={VOWEL_ANCHOR_RADIUS}
                  inset={VOWEL_ANCHOR_INSET}
                  label={`Draw a line from ${row.picture.alt}`}
                  pulsing={chosen === null && !answered.has(index)}
                  filled={chosen === index || answered.has(index)}
                  pressed={chosen === index}
                  disabled={answered.has(index)}
                  onClick={() => choosePicture(index)}
                />
              </span>
            </div>
          );
        })}
      </div>

      {/* The blank middle is where the child rules the lines. */}
      <span className="flex-1" />

      {/* Held in from the right edge, so the ships sit on the page rather than
          against its margin. */}
      <div
        className="flex flex-col justify-around"
        style={{ marginRight: "14mm" }}
      >
        {sheet.vowels.map((vowel, index) => (
          <div key={vowel.text} className="flex items-center">
            <span
              ref={(element) => {
                rightDots.current[index] = element;
              }}
              className="flex"
            >
              <MatchAnchor
                colour={vowel.colour}
                side="right"
                radius={VOWEL_ANCHOR_RADIUS}
                inset={VOWEL_ANCHOR_INSET}
                label={`Join the line to ${vowel.text}`}
                pulsing={chosen !== null}
                filled={settled.has(index)}
                disabled={chosen === null}
                onClick={() => chooseVowel(index)}
              />
            </span>
            <WordShapeMark
              word={vowel.text}
              shape={shape}
              widthMm={28}
              colour={vowel.colour}
            />
          </div>
        ))}
      </div>

      <MatchLines
        anchors={anchors}
        lines={attempts.map((attempt) => ({
          from: attempt.row,
          to: attempt.target,
          correct: attempt.correct,
        }))}
        pending={chosen === null ? null : { from: chosen, to: trail }}
      />
    </div>
  );
}

/**
 * One word on its ruling, with a box laid over the gap.
 *
 * The ruling stays exactly as it prints — SVG, untouched — and the box is laid
 * over it in the same millimetres the SVG is drawn in, so the box lands
 * squarely on the gap it belongs to. The same arrangement Unit 2's writing
 * sheet uses, driven by the same hook.
 */
function PatternWordRow({
  row,
  answering,
}: {
  row: ReturnType<typeof buildPatternWritingSheet>[number];
  answering: GapAnswering;
}) {
  const ruling = PATTERN_WRITING_RULING;

  const blank = row.slots.find((slot) => slot.isBlank);
  const answer = answering.answers[row.gap.id];
  const isActive = answering.activeId === row.gap.id;
  // A box standing in the gap replaces the write-here rule, so the two are
  // never drawn on top of each other. Screen only — on paper there is no box,
  // so the rule always prints.
  const covered = isActive || Boolean(answer);

  return (
    <div
      className="relative shrink-0"
      style={{ width: `${row.width}mm`, height: `${ruling.height}mm` }}
    >
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
              className={cn(covered && "hidden print:block")}
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

      {blank && (
        <GapBox
          question={row.gap}
          answer={answer}
          isActive={isActive}
          isOpen={answering.isOpen && isActive}
          onOpen={answering.open}
          onChoose={answering.choose}
          onDismiss={answering.dismiss}
          // The size the word's own letters are drawn at — the answer is part
          // of the word, so it has no business being smaller than the rest.
          letterSize={PATTERN_WRITING_LAYOUT.letterSize}
          className="absolute print:hidden"
          style={{
            left: `${blank.centre - blank.width / 2}mm`,
            top: `${ruling.line1 - GAP_BOX_PADDING}mm`,
            width: `${blank.width}mm`,
            height: `${ruling.baseline - ruling.line1 + GAP_BOX_PADDING * 2}mm`,
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
 * sits here rather than in the rows.
 */
function WritingRows({
  rows,
}: {
  rows: ReturnType<typeof buildPatternWritingSheet>;
}) {
  const answering = useGapAnswers(rows.map((row) => row.gap));

  return (
    <div
      className="flex flex-col"
      style={{
        gap: `${PATTERN_WRITING_LAYOUT.rowGap}mm`,
        paddingTop: `${PATTERN_WRITING_LAYOUT.rowGap}mm`,
      }}
    >
      {rows.map((row) => {
        const answer = answering.answers[row.gap.id];
        const isOpen = answering.isOpen && answering.activeId === row.gap.id;

        return (
          <div
            key={row.id}
            className={cn(
              "relative flex items-center",
              // Lifted above the rows below it so the panel hangs over them.
              isOpen && "z-10",
            )}
            style={{
              height: `${PATTERN_WRITING_LAYOUT.rowHeight}mm`,
              gap: `${PATTERN_WRITING_LAYOUT.gap}mm`,
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

            <PatternWordRow row={row} answering={answering} />
          </div>
        );
      })}
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
            // The shape leaves room beneath it on the line, so the button to
            // hear the word goes there rather than taking width from the row.
            // Screen only: on paper the space simply stays empty.
            <span key={word.text} className="flex flex-col items-center">
              <WordShapeMark
                word={word.text}
                shape={shape}
                widthMm={wordWidth}
                colour={word.colour}
                tilt={word.tilt}
              />
              <SoundButton
                text={word.text}
                label={`Say ${word.text}`}
                size="md"
                // Clear of the line that closes the row. The margin goes on
                // the button rather than the row so it leaves with it: the
                // button is screen-only, and so is the space it asks for.
                className="mb-1 print:hidden"
              />
            </span>
          ))}
        </div>
      ))}
    </div>
  );
}

