"use client";

import Link from "next/link";
import { Settings, Sparkles } from "lucide-react";

import { SoundButton } from "@/components/curriculum/sound-button";
import { StoryPicture } from "@/components/story/story-picture";
import { useStoryCast } from "@/hooks/use-preferences";
import {
  castVariant,
  displayName,
  fillStanzas,
  spokenStory,
} from "@/lib/story/placeholders";
import type { Story } from "@/lib/story/types";

/**
 * One story, told about the characters set in Settings.
 *
 * A client component because the cast lives on the device: both the picture
 * and every name and pronoun in the text follow from it, so the whole page
 * changes when the teacher changes who the story is about.
 */
export function StoryReader({ story }: { story: Story }) {
  const cast = useStoryCast();

  const stanzas = fillStanzas(story.stanzas, cast);
  const names = `${displayName(cast.c1, "c1")} and ${displayName(cast.c2, "c2")}`;

  // Where each stanza starts in the story as a whole. Lines are numbered
  // across the story rather than within a stanza, so the label a screen
  // reader announces matches the line the child is looking at — and this is
  // derived rather than counted up during render, which would be a mutation
  // the React Compiler is right to object to.
  const stanzaStart = stanzas.reduce<number[]>(
    (starts, stanza) => [...starts, starts[starts.length - 1] + stanza.length],
    [0],
  );
  const lineCount = stanzaStart[stanzaStart.length - 1];

  return (
    <article className="flex flex-col gap-6">
      {/* The picture matching this pairing of characters. Four exist per
          story; `castVariant` picks the one that matches. */}
      <div className="relative aspect-video w-full overflow-hidden rounded-3xl border-2 bg-muted">
        <StoryPicture
          storyNumber={story.number}
          cast={cast}
          alt={`${story.title} — ${names}`}
          // The reader is the point of the page, so this is the LCP image.
          priority
          sizes="(min-width: 1024px) 56rem, 100vw"
          className="object-cover"
        />
      </div>

      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--unit-tint)] px-3 py-1 text-xs font-semibold text-[var(--unit-ink)]">
              <Sparkles className="size-3.5" aria-hidden />
              {story.moral}
            </span>
            {story.genre && (
              <span className="rounded-full border px-3 py-1 text-xs font-medium text-muted-foreground">
                {story.genre}
              </span>
            )}
          </div>

          <h1 className="font-heading mt-3 text-3xl font-bold text-balance sm:text-4xl">
            {story.title}
          </h1>
          <p className="mt-1 text-muted-foreground">
            A story about {names}.{" "}
            <Link
              href="/settings"
              className="inline-flex items-center gap-1 font-medium text-foreground underline underline-offset-4"
            >
              <Settings className="size-3.5" aria-hidden />
              Change characters
            </Link>
          </p>
        </div>

        {/* Reads the whole story straight through. Each line below can also
            be tapped on its own, for a reader working through it slowly.
            Both are stoppable: a story tapped by mistake is a long wait, and
            a line a child has already got is one they want to move on from. */}
        <SoundButton
          size="xl"
          stoppable
          caption="Read it all"
          text={spokenStory(story.stanzas, cast)}
          label={`Read the whole story, ${story.title}, aloud`}
        />
      </header>

      {/* One block per stanza, with a clear break between them: the story is
          written to be read three lines, three lines, then one, and the page
          shows that shape rather than a flat list of seven. */}
      <div className="flex flex-col gap-6">
        {stanzas.map((stanza, stanzaIndex) => (
          <ol
            key={`${story.number}-stanza-${stanzaIndex}`}
            className="flex flex-col gap-1"
          >
            {stanza.map((line, index) => {
              const number = stanzaStart[stanzaIndex] + index + 1;

              return (
                <li
                  key={`${story.number}-line-${number}`}
                  className="flex items-center gap-3 rounded-2xl px-2 py-1.5 hover:bg-muted/60"
                >
                  <SoundButton
                    size="md"
                    stoppable
                    text={line}
                    label={`Read line ${number} aloud`}
                  />
                  {/* Andika, at reading size: this is text a five-year-old is
                      sounding out, not interface copy. */}
                  <p className="font-letter min-w-0 flex-1 text-xl leading-relaxed text-balance sm:text-2xl">
                    {line}
                  </p>
                </li>
              );
            })}
          </ol>
        ))}
      </div>

      {/* Which of the four pictures is showing, as a hint that changing the
          characters changes the artwork too. */}
      <p className="text-center text-xs text-muted-foreground">
        Picture {castVariant(cast)} · {lineCount} lines
      </p>
    </article>
  );
}
