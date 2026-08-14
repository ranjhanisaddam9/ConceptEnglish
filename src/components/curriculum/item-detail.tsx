"use client";

import { Artwork } from "@/components/curriculum/artwork";
import { SoundButton } from "@/components/curriculum/sound-button";
import { StepButton } from "@/components/curriculum/step-button";
import { WritingLines } from "@/components/curriculum/writing-lines";
import { Card } from "@/components/ui/card";
import {
  exampleLabel,
  exampleSpeechText,
  itemLabel,
  itemSpeechText,
  placeholderTint,
} from "@/lib/curriculum/display";
import type { ContentItem, LabelMode, UnitKind } from "@/lib/curriculum/types";
import { cn } from "@/lib/utils";

/**
 * The lower half of the Letter Page: the big letter, and its example words.
 * Renders whatever item it is handed — nothing here is alphabet-specific.
 */

export interface ItemDetailProps {
  item: ContentItem;
  kind: UnitKind;
  mode: LabelMode;
  /** Matches the `panelId` given to ItemNav. */
  panelId: string;
  /** Id of the nav button that selected this item. */
  labelledBy?: string;
  /** Short label for the item, e.g. "Vowel". */
  badge?: string;
  /** Step controls shown either side of the letter card. */
  onPrevious?: () => void;
  onNext?: () => void;
  previousLabel?: string;
  nextLabel?: string;
  className?: string;
}

export function ItemDetail({
  item,
  kind,
  mode,
  panelId,
  labelledBy,
  badge,
  onPrevious,
  onNext,
  previousLabel,
  nextLabel,
  className,
}: ItemDetailProps) {
  const glyph = itemLabel(item, mode);
  const examples = item.examples;
  const isLetters = kind === "letters";

  const examplesHeading = isLetters
    ? `Words that start with ${item.primaryLabel}`
    : `Examples for ${item.primaryLabel}`;

  return (
    <section
      id={panelId}
      role="tabpanel"
      aria-labelledby={labelledBy}
      tabIndex={-1}
      className={cn("flex flex-col items-center gap-10 outline-none", className)}
    >
      {/* ---- The alphabet card: the letter on writing lines, and its sound ---- */}
      <div className="flex w-full items-center justify-center gap-2 sm:gap-4">
        {onPrevious && previousLabel && (
          <StepButton
            direction="previous"
            targetLabel={previousLabel}
            onClick={onPrevious}
          />
        )}

        <Card className="w-full max-w-2xl gap-2 p-5 sm:p-6">
          {badge && (
            <p className="text-center text-sm font-medium tracking-wide text-muted-foreground uppercase">
              {badge}
            </p>
          )}
          <div className="flex items-center gap-5 sm:gap-7">
          {isLetters ? (
            <WritingLines
              text={glyph}
              label={`The letter ${glyph} written on four-line ruling`}
              className="min-w-0 flex-1"
            />
          ) : (
            <div
              className="font-letter grid h-40 flex-1 place-items-center rounded-2xl text-7xl leading-none font-bold text-neutral-900/80 select-none sm:h-48 sm:text-8xl"
              style={{ backgroundColor: placeholderTint(item.primaryLabel) }}
            >
              {glyph}
            </div>
          )}

            <SoundButton
              size="xl"
              text={itemSpeechText(item)}
              audioUrl={item.audioUrl}
              label={`Say the letter ${item.primaryLabel}`}
            />
          </div>
        </Card>

        {onNext && nextLabel && (
          <StepButton
            direction="next"
            targetLabel={nextLabel}
            onClick={onNext}
          />
        )}
      </div>

      {/* ---- Example words ---- */}
      {examples.length > 0 && (
        <div className="w-full">
          <h2 className="font-heading mb-5 text-center text-xl font-semibold text-muted-foreground sm:text-2xl">
            {examplesHeading}
          </h2>

          <ul
            className={cn(
              "mx-auto grid w-full max-w-5xl gap-5",
              "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3",
              // Keep a lone example from stretching across the full width.
              examples.length === 1 && "max-w-sm sm:grid-cols-1",
              examples.length === 2 && "max-w-2xl lg:grid-cols-2",
            )}
          >
            {examples.map((example) => (
              <li key={example.id}>
                <Card className="h-full items-center gap-4 p-5 text-center">
                  <Artwork
                    src={example.imageUrl}
                    alt={example.label}
                    fallbackText={example.label.charAt(0).toUpperCase()}
                    className="aspect-square w-full max-w-56"
                    fallbackTextClassName="text-6xl"
                  />
                  <p className="font-letter text-3xl font-bold break-words sm:text-4xl">
                    {exampleLabel(example, mode, kind)}
                  </p>
                  <SoundButton
                    size="lg"
                    text={exampleSpeechText(item, example)}
                    audioUrl={example.audioUrl}
                    label={`Say "${exampleSpeechText(item, example)}"`}
                  />
                </Card>
              </li>
            ))}
          </ul>
        </div>
      )}

      {examples.length === 0 && (
        <p className="text-center text-muted-foreground">
          No example words yet for this one.
        </p>
      )}
    </section>
  );
}
