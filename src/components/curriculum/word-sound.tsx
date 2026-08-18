"use client";

import { SoundButton } from "@/components/curriculum/sound-button";
import {
  WORD_SOUND_GAP,
  WORD_SOUND_WIDTH,
} from "@/lib/curriculum/worksheet";
import { cn } from "@/lib/utils";

/**
 * The "say this word" button that opens a question on the answerable sheets.
 *
 * Says the word and nothing else — "Dog", not "D for Dog". On these sheets the
 * word is the question: a child who is told the letter has been given the
 * answer before they have looked at the picture.
 *
 * Screen only. It reserves a fixed column so the row's geometry is known —
 * Unit 2's matching sheet works out where to draw its lines from the layout
 * constants — and takes itself out of the layout for print, which returns the
 * printed sheet to exactly what it was.
 */

export function WordSound({
  word,
  className,
}: {
  /** The word to say, spelled as it is written. */
  word: string;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center print:hidden",
        className,
      )}
      style={{
        width: `${WORD_SOUND_WIDTH}mm`,
        marginRight: `${WORD_SOUND_GAP}mm`,
      }}
    >
      <SoundButton text={word} label={`Say ${word}`} size="md" />
    </span>
  );
}
