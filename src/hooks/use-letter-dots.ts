"use client";

import { useCallback, useSyncExternalStore } from "react";

import {
  getCachedDots,
  requestDots,
  subscribeToDots,
  type SkeletonDot,
  type SkeletonRequest,
} from "@/lib/curriculum/letter-skeleton";

/**
 * Dots along a letter's centre line, computed on the client.
 *
 * Returns null until the raster is ready (a few milliseconds after the font
 * loads). The work is kicked off from `subscribe`, which React calls after
 * mount — so there is no canvas access during render or on the server.
 */
export function useLetterDots(request: SkeletonRequest): SkeletonDot[] | null {
  const { glyph, fontFamily, fontWeight, capitalScale, spacing } = request;

  const subscribe = useCallback(
    (onChange: () => void) => {
      const unsubscribe = subscribeToDots(onChange);
      requestDots({ glyph, fontFamily, fontWeight, capitalScale, spacing });
      return unsubscribe;
    },
    [glyph, fontFamily, fontWeight, capitalScale, spacing],
  );

  const getSnapshot = useCallback(
    () => getCachedDots({ glyph, fontFamily, fontWeight, capitalScale, spacing }),
    [glyph, fontFamily, fontWeight, capitalScale, spacing],
  );

  return useSyncExternalStore(subscribe, getSnapshot, () => null);
}
