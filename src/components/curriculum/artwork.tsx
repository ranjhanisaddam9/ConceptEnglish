"use client";

import { useState } from "react";

import { placeholderTint } from "@/lib/curriculum/display";
import { cn } from "@/lib/utils";

/**
 * Curriculum illustration with a graceful fallback.
 *
 * When no image has been uploaded yet — or a stored URL has gone stale — this
 * renders a tinted tile showing the letter or word instead, so a freshly
 * seeded page still looks deliberate.
 *
 * Uses a plain <img> rather than next/image on purpose: image URLs come from
 * whichever Supabase project (or future CDN) the deployment is pointed at, and
 * next/image would throw at render time for any host not listed in
 * `next.config.ts`. These are small classroom illustrations, so the
 * optimisation trade-off is worth the robustness.
 */

export interface ArtworkProps {
  src?: string | null;
  alt: string;
  /** Rendered in the tile when there is no usable image. */
  fallbackText: string;
  className?: string;
  fallbackTextClassName?: string;
}

export function Artwork({
  src,
  alt,
  fallbackText,
  className,
  fallbackTextClassName,
}: ArtworkProps) {
  // Remembering *which* src failed (rather than a boolean plus an effect to
  // reset it) means a new src is retried automatically.
  const [failedSrc, setFailedSrc] = useState<string | null>(null);

  const showImage = Boolean(src) && failedSrc !== src;

  return (
    <div
      className={cn(
        "relative flex items-center justify-center overflow-hidden rounded-2xl",
        className,
      )}
      style={
        showImage
          ? undefined
          : { backgroundColor: placeholderTint(fallbackText) }
      }
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element -- see note above
        <img
          src={src ?? undefined}
          alt={alt}
          // Eager on purpose: only one item is on screen at a time, and the
          // picture is the point of the card — it should never pop in late.
          decoding="async"
          onError={() => setFailedSrc(src ?? null)}
          className="size-full object-cover"
        />
      ) : (
        <span
          aria-hidden
          className={cn(
            "font-heading font-bold text-neutral-900/70 select-none",
            fallbackTextClassName ?? "text-5xl",
          )}
        >
          {fallbackText}
        </span>
      )}
    </div>
  );
}
