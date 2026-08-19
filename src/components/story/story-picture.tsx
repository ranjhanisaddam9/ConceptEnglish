"use client";

import { useState } from "react";
import Image from "next/image";
import { ImageOff } from "lucide-react";

import { storyImagePath } from "@/lib/story/placeholders";
import type { StoryCast } from "@/lib/story/types";

/**
 * A story's picture, for the cast currently set.
 *
 * Four exist per story — one per pairing of a boy and a girl — and which one
 * shows follows from the characters. A script can be added before its artwork
 * is drawn, so a picture that will not load falls back to a plain panel rather
 * than a broken image: the story is still readable, and the picture appears on
 * its own the moment the files land in public/story.
 */
export function StoryPicture({
  storyNumber,
  cast,
  alt,
  sizes,
  className,
  priority = false,
}: {
  storyNumber: number;
  cast: StoryCast;
  /** Empty for a decorative thumbnail sitting beside its own title. */
  alt: string;
  sizes: string;
  className?: string;
  priority?: boolean;
}) {
  const src = storyImagePath(storyNumber, cast);

  // Keyed on the path rather than a boolean, so switching the cast — and with
  // it the picture — gives the new file its own chance to load.
  const [failed, setFailed] = useState<string | null>(null);

  if (failed === src) {
    return (
      <div className="grid size-full place-items-center gap-1 bg-[var(--unit-tint)] text-[var(--unit-ink)]">
        <ImageOff className="size-6 opacity-70" aria-hidden />
        <span className="sr-only">
          The picture for this story has not been drawn yet.
        </span>
      </div>
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      priority={priority}
      sizes={sizes}
      className={className}
      onError={() => setFailed(src)}
      aria-hidden={alt === "" ? true : undefined}
    />
  );
}
