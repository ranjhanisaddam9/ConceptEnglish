import { BookOpen, Users } from "lucide-react";

import { StoryCard } from "@/components/story/story-card";
import { STORIES, isReadable } from "@/lib/story/stories";

export const metadata = {
  title: "Stories · Concept English",
  description:
    "Ten decodable stories, told about the characters you choose in Settings.",
};

export default function StoryIndexPage() {
  const readable = STORIES.filter(isReadable).length;

  return (
    <main className="doodle-canvas flex-1">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:py-14">
        <header className="mb-10 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <Users className="size-3.5 text-primary" aria-hidden />
            Told about your characters
          </span>
          <h1 className="font-heading mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
            Stories
          </h1>
          <p className="mx-auto mt-3 max-w-md text-balance text-muted-foreground">
            Every story is told about the two characters set in Settings — their
            names, the words for them, and the picture at the top.
          </p>

          <dl className="mt-6 flex items-center justify-center gap-2 text-sm">
            <div className="flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 ring-1 ring-border">
              <BookOpen className="size-4 text-muted-foreground" aria-hidden />
              <dt className="sr-only">Stories ready to read</dt>
              <dd>
                <span className="font-semibold">{readable}</span>{" "}
                <span className="text-muted-foreground">
                  of {STORIES.length} ready
                </span>
              </dd>
            </div>
          </dl>
        </header>

        <ul className="grid gap-5 lg:grid-cols-2">
          {STORIES.map((story) => (
            <li key={story.number}>
              <StoryCard story={story} />
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
