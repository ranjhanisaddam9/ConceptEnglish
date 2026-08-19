import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft, PencilRuler } from "lucide-react";

import { StoryReader } from "@/components/story/story-reader";
import { STORIES, getStory, isReadable, storyLabel } from "@/lib/story/stories";
import { UNIT_ACCENTS } from "@/lib/curriculum/unit-face";

interface StoryPageProps {
  params: Promise<{ storyNumber: string }>;
}

/** Pre-renders the ten story routes; anything else falls through to 404. */
export function generateStaticParams() {
  return STORIES.map((story) => ({ storyNumber: String(story.number) }));
}

/**
 * Parses the route segment.
 *
 * Number() alone would accept "1.0" and " 1", both of which would render the
 * same story at a second URL, so the segment has to be plain digits.
 */
function parseStoryNumber(segment: string): number | null {
  return /^\d+$/.test(segment) ? Number(segment) : null;
}

export async function generateMetadata({ params }: StoryPageProps) {
  const { storyNumber } = await params;
  const parsed = parseStoryNumber(storyNumber);
  const story = parsed === null ? undefined : getStory(parsed);

  if (!story) return { title: "Story not found · Concept English" };

  return {
    title: `${storyLabel(story)} · Concept English`,
    description: story.moral || undefined,
  };
}

export default async function StoryPage({ params }: StoryPageProps) {
  const { storyNumber } = await params;
  const parsed = parseStoryNumber(storyNumber);
  const story = parsed === null ? undefined : getStory(parsed);

  if (!story) notFound();

  const accent = UNIT_ACCENTS[(story.number - 1) % UNIT_ACCENTS.length];

  return (
    <main className="flex-1" data-accent={accent}>
      <div className="mx-auto w-full max-w-4xl px-4 py-6 sm:py-10">
        <Link
          href="/story"
          className="mb-6 inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          <ChevronLeft className="size-4" aria-hidden />
          All stories
        </Link>

        {isReadable(story) ? (
          <StoryReader story={story} />
        ) : (
          <div className="rounded-3xl border-2 border-dashed p-10 text-center">
            <PencilRuler
              className="mx-auto size-8 text-muted-foreground"
              aria-hidden
            />
            <h1 className="font-heading mt-4 text-2xl font-bold">
              Story {story.number} is still being written
            </h1>
            <p className="mt-2 text-muted-foreground">
              Its script and pictures have not been added yet. Story 1 is ready
              to read.
            </p>
            <Link
              href="/story/1"
              className="mt-6 inline-flex rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
            >
              Read Story 1
            </Link>
          </div>
        )}
      </div>
    </main>
  );
}
