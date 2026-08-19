"use client";

import { useMemo, useSyncExternalStore } from "react";

import { DEFAULT_ACCENT, isAccent, type Accent } from "@/lib/speech";
import { LABEL_MODES, type LabelMode } from "@/lib/curriculum/types";
import {
  DEFAULT_GENDER,
  isGender,
  type Gender,
  type StoryCast,
} from "@/lib/story/types";

/**
 * Per-device viewing preferences, persisted to localStorage.
 *
 * These are settings, not curriculum data, so they never go near a database.
 *
 * Built on `useSyncExternalStore` rather than `useState` + an effect: the
 * stored value is read during render (no flash of the default), every
 * component that cares stays in sync, and there is no setState-in-effect for
 * the React Compiler to complain about.
 */

interface Preference<T extends string> {
  read: () => T;
  set: (value: T) => void;
  subscribe: (onChange: () => void) => () => void;
  serverValue: () => T;
}

function createPreference<T extends string>(
  storageKey: string,
  fallback: T,
  isValid: (value: unknown) => value is T,
): Preference<T> {
  // Cached so `read` returns a stable value between changes, as
  // useSyncExternalStore requires.
  let cached: T | null = null;
  const listeners = new Set<() => void>();

  return {
    read() {
      if (cached !== null) return cached;
      try {
        const stored = window.localStorage.getItem(storageKey);
        cached = isValid(stored) ? stored : fallback;
      } catch {
        // localStorage throws in some private-browsing modes.
        cached = fallback;
      }
      return cached;
    },
    set(value) {
      cached = value;
      try {
        window.localStorage.setItem(storageKey, value);
      } catch {
        // The preference just won't survive a reload; not worth interrupting.
      }
      for (const listener of listeners) listener();
    },
    subscribe(onChange) {
      listeners.add(onChange);
      return () => {
        listeners.delete(onChange);
      };
    },
    serverValue: () => fallback,
  };
}

function isLabelMode(value: unknown): value is LabelMode {
  return (
    typeof value === "string" && (LABEL_MODES as readonly string[]).includes(value)
  );
}

/** Uppercase / lowercase / both, in a letters unit. */
export const labelModePreference = createPreference<LabelMode>(
  "concept-english.label-mode",
  "primary",
  isLabelMode,
);

/** Which English accent the sound buttons speak in. */
export const accentPreference = createPreference<Accent>(
  "concept-english.accent",
  DEFAULT_ACCENT,
  isAccent,
);

/**
 * The two characters every story is told about.
 *
 * Held as four separate string preferences rather than one JSON blob, because
 * `useSyncExternalStore` needs `read` to return a stable value and a string
 * is stable for free — a parsed object would be a new reference every read.
 * They are recomposed into a `StoryCast` by `useStoryCast` below.
 */
const isName = (value: unknown): value is string => typeof value === "string";

export const storyCastPreferences = {
  c1: {
    name: createPreference<string>("concept-english.story.c1-name", "", isName),
    gender: createPreference<Gender>(
      "concept-english.story.c1-gender",
      DEFAULT_GENDER,
      isGender,
    ),
  },
  c2: {
    name: createPreference<string>("concept-english.story.c2-name", "", isName),
    gender: createPreference<Gender>(
      "concept-english.story.c2-gender",
      "female",
      isGender,
    ),
  },
} as const;

function usePreference<T extends string>(preference: Preference<T>): T {
  return useSyncExternalStore(
    preference.subscribe,
    preference.read,
    preference.serverValue,
  );
}

export function useLabelMode() {
  return {
    mode: usePreference(labelModePreference),
    setMode: labelModePreference.set,
  } as const;
}

export function useAccent() {
  return {
    accent: usePreference(accentPreference),
    setAccent: accentPreference.set,
  } as const;
}

/**
 * The story cast as one object.
 *
 * Memoised so the identity only changes when a character actually changes;
 * a story re-renders on every keystroke otherwise.
 */
export function useStoryCast(): StoryCast {
  const c1Name = usePreference(storyCastPreferences.c1.name);
  const c1Gender = usePreference(storyCastPreferences.c1.gender);
  const c2Name = usePreference(storyCastPreferences.c2.name);
  const c2Gender = usePreference(storyCastPreferences.c2.gender);

  return useMemo(
    () => ({
      c1: { name: c1Name, gender: c1Gender },
      c2: { name: c2Name, gender: c2Gender },
    }),
    [c1Name, c1Gender, c2Name, c2Gender],
  );
}

/** Writes a whole cast at once, which is what the Save button does. */
export function saveStoryCast(cast: StoryCast) {
  storyCastPreferences.c1.name.set(cast.c1.name.trim());
  storyCastPreferences.c1.gender.set(cast.c1.gender);
  storyCastPreferences.c2.name.set(cast.c2.name.trim());
  storyCastPreferences.c2.gender.set(cast.c2.gender);
}
