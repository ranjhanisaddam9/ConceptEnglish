"use client";

import { useId, useState } from "react";
import { Printer } from "lucide-react";

import { ItemNav } from "@/components/curriculum/item-nav";
import { SegmentedToggle } from "@/components/curriculum/segmented-toggle";
import { StepButton } from "@/components/curriculum/step-button";
import { WorksheetPage } from "@/components/curriculum/worksheet-page";
import { WorksheetRow, type RowVariant } from "@/components/curriculum/worksheet-row";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { useLetterDots } from "@/hooks/use-letter-dots";
import { useLabelMode } from "@/hooks/use-preferences";
import { itemLabel, labelModeOptions } from "@/lib/curriculum/display";
import { getNeighbours } from "@/lib/curriculum/navigation";
import type { ContentItem, LabelMode, Unit } from "@/lib/curriculum/types";
import {
  DOT_SPACING_EM,
  GUIDE_FONT_WEIGHT,
  LETTER_FONT_FAMILY,
  ROW_COUNT,
  ROW_GAP,
  ROW_RULING,
  WORKSHEET_STYLE_OPTIONS,
  type WorksheetStyle,
} from "@/lib/curriculum/worksheet";

/**
 * A printable handwriting worksheet.
 *
 * The first row is the teacher's model — the letter three times in full ink.
 * Every row after it depends on the chosen style, so one page covers the
 * whole progression from tracing to writing unaided.
 *
 * The page is laid out in millimetres at A4 size, and everything except the
 * page itself is hidden when printing (see the print rules in globals.css).
 */

export interface WorksheetProps {
  unit: Pick<Unit, "title" | "kind">;
  items: ContentItem[];
}

const PRACTICE_VARIANT: Record<WorksheetStyle, RowVariant> = {
  tracing: "trace",
  dots: "dots",
  empty: "blank",
};

/**
 * One letter's sheet.
 *
 * Its own component because each sheet needs its own centre-line dots, and a
 * hook cannot be called in a loop — rendering 26 of these gives 26 legal hook
 * calls, one per component.
 */
function TracingSheet({
  title,
  item,
  mode,
  style,
  id,
  hiddenOnScreen = false,
  breakAfter = false,
}: {
  title: string;
  item: ContentItem;
  mode: LabelMode;
  style: WorksheetStyle;
  id?: string;
  hiddenOnScreen?: boolean;
  breakAfter?: boolean;
}) {
  const glyph = itemLabel(item, mode);

  // Only the dotted style needs a skeleton; asking for an empty glyph keeps
  // the hook call unconditional without doing the work.
  const dots = useLetterDots({
    glyph: style === "dots" ? glyph : "",
    fontFamily: LETTER_FONT_FAMILY,
    fontWeight: GUIDE_FONT_WEIGHT,
    capitalScale: ROW_RULING.capitalScale,
    spacing: DOT_SPACING_EM,
  });

  // "A is for Apple" — the first example word carries the letter's picture.
  const picture = item.examples.find((example) => example.imageUrl);

  return (
    <WorksheetPage
      id={id}
      title={`${title} · Letter ${glyph}`}
      instruction={
        WORKSHEET_STYLE_OPTIONS.find((option) => option.value === style)
          ?.description ?? ""
      }
      picture={
        picture?.imageUrl
          ? { src: picture.imageUrl, alt: picture.label }
          : null
      }
      hiddenOnScreen={hiddenOnScreen}
      breakAfter={breakAfter}
    >
      <div
        className="flex flex-col"
        style={{ gap: `${ROW_GAP}mm`, paddingTop: `${ROW_GAP}mm` }}
      >
        {Array.from({ length: ROW_COUNT }, (_, index) => (
          <WorksheetRow
            key={index}
            glyph={glyph}
            dots={dots}
            // Row 1 is always the model, whatever the style.
            variant={index === 0 ? "model" : PRACTICE_VARIANT[style]}
          />
        ))}
      </div>
    </WorksheetPage>
  );
}

export function Worksheet({ unit, items }: WorksheetProps) {
  const [selectedId, setSelectedId] = useState<string | null>(
    items[0]?.id ?? null,
  );
  const [style, setStyle] = useState<WorksheetStyle>("tracing");
  const [printWholeAlphabet, setPrintWholeAlphabet] = useState(false);
  const printAllId = useId();

  const { mode, setMode } = useLabelMode();
  const modeOptions = labelModeOptions(unit.kind, items);
  const activeMode =
    modeOptions.find((option) => option.value === mode)?.value ??
    modeOptions[0]?.value ??
    "primary";

  const activeItem = items.find((item) => item.id === selectedId) ?? items[0];
  if (!activeItem) return null;

  const neighbours = getNeighbours(items, activeItem.id);

  // With the whole alphabet queued for print, every letter is in the DOM but
  // only the selected one is on screen.
  const sheets = printWholeAlphabet ? items : [activeItem];

  return (
    <div className="flex flex-col gap-6">
      {/* ---- Controls (screen only) ---- */}
      <div className="flex flex-col gap-5 print:hidden">
        <div className="flex flex-wrap items-end justify-center gap-x-8 gap-y-4">
          <SegmentedToggle
            caption="Letters"
            value={activeMode}
            onChange={setMode}
            options={modeOptions}
          />
          <SegmentedToggle
            caption="Practice style"
            value={style}
            onChange={setStyle}
            options={WORKSHEET_STYLE_OPTIONS}
          />

          <div className="flex items-center gap-3">
            <Button
              type="button"
              size="lg"
              onClick={() => window.print()}
              className="h-12 px-5"
            >
              <Printer aria-hidden />
              {printWholeAlphabet
                ? `Print all ${items.length} sheets`
                : "Print worksheet"}
            </Button>

            <div className="flex items-center gap-2">
              <Checkbox
                id={printAllId}
                checked={printWholeAlphabet}
                onCheckedChange={(checked) =>
                  setPrintWholeAlphabet(checked === true)
                }
                className="size-5"
              />
              <Label htmlFor={printAllId} className="font-letter text-base">
                Aa – Zz
              </Label>
            </div>
          </div>
        </div>

        <ItemNav
          items={items}
          selectedItemId={activeItem.id}
          onSelect={setSelectedId}
          mode={activeMode}
          idPrefix="worksheet"
          panelId="worksheet-page"
        />
      </div>

      {/* ---- The A4 page, with letter navigation beside it ---- */}
      <div className="flex items-center justify-center gap-2 sm:gap-4 print:block">
        {neighbours && (
          <StepButton
            direction="previous"
            targetLabel={itemLabel(neighbours.previous, activeMode)}
            onClick={() => setSelectedId(neighbours.previous.id)}
            className="print:hidden"
          />
        )}

        {sheets.map((item, index) => (
          <TracingSheet
            key={item.id}
            id={item.id === activeItem.id ? "worksheet-page" : undefined}
            title={unit.title}
            item={item}
            mode={activeMode}
            style={style}
            hiddenOnScreen={item.id !== activeItem.id}
            breakAfter={index < sheets.length - 1}
          />
        ))}

        {neighbours && (
          <StepButton
            direction="next"
            targetLabel={itemLabel(neighbours.next, activeMode)}
            onClick={() => setSelectedId(neighbours.next.id)}
            className="print:hidden"
          />
        )}
      </div>
    </div>
  );
}
