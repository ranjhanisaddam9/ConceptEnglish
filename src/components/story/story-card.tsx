"use client";

import Link from "next/link";
import { ArrowRight, BookOpen, Lock } from "lucide-react";

import { StoryPicture } from "@/components/story/story-picture";
import { useStoryCast } from "@/hooks/use-preferences";
import { isReadable } from "@/lib/story/stories";
import { UNIT_ACCENTS } from "@/lib/curriculum/unit-face";
import type { Story } from "@/lib/story/types";

/**
 * One story on the story index.
 *
 * The thumbnail is whichever of the four pictures matches the cast, so the
 * grid re-illustrates itself when the characters change in Settings.
 *
 * A story with no script yet is shown but not linked: the shape of the course
 * stays visible without promising a page that would open empty.
 */
export function StoryCard({ story }: { story: Story }) {
  const cast = useStoryCast();
  const readable = isReadable(story);

  // Same rotation the units use, so no two neighbours share a colour.
  const accent = UNIT_ACCENTS[(story.number - 1) % UNIT_ACCENTS.length];

  const body = (
    <>
      <div className="relative aspect-video w-full shrink-0 overflow-hidden rounded-2xl bg-[var(--unit-tint)] sm:w-44">
        {readable ? (
          <StoryPicture
            storyNumber={story.number}
            cast={cast}
            alt=""
            sizes="(min-width: 640px) 11rem, 100vw"
            className="object-cover"
          />
        ) : (
          <div className="grid size-full place-items-center text-[var(--unit-ink)]">
            <Lock className="size-6" aria-hidden />
          </div>
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <span className="inline-flex w-fit items-center gap-1 rounded-full bg-[var(--unit-tint)] px-2.5 py-0.5 text-xs font-semibold text-[var(--unit-ink)]">
          <BookOpen className="size-3" aria-hidden />
          Story {story.number}
        </span>

        <h2 className="font-heading text-xl font-bold text-balance">
          {story.title || "Still to come"}
        </h2>

        {story.moral && (
          <p className="text-sm text-muted-foreground">{story.moral}</p>
        )}

        {readable ? (
          <span className="mt-auto inline-flex w-fit items-center gap-1.5 rounded-full bg-[var(--unit-ink)] px-4 py-2 text-sm font-semibold text-card motion-safe:transition-transform group-hover:scale-[1.03]">
            Read story
            <ArrowRight
              className="size-4 motion-safe:transition-transform group-hover:translate-x-0.5"
              aria-hidden
            />
          </span>
        ) : (
          <span className="mt-auto text-sm text-muted-foreground">
            Not written yet
          </span>
        )}
      </div>
    </>
  );

  const shell =
    "flex h-full flex-col gap-4 rounded-3xl border-2 p-4 sm:flex-row sm:gap-5 sm:p-5";

  if (!readable) {
    return (
      <div
        data-accent={accent}
        aria-disabled
        className={`${shell} border-dashed border-border bg-card/60`}
      >
        {body}
      </div>
    );
  }

  return (
    <Link
      href={`/story/${story.number}`}
      data-accent={accent}
      className={`group ${shell} border-[var(--unit-ring)] bg-card outline-none motion-safe:transition-transform motion-safe:duration-200 hover:-translate-y-0.5 focus-visible:ring-4 focus-visible:ring-[var(--unit-ring)]`}
    >
      {body}
    </Link>
  );
}
