"use client";

import { useSyncExternalStore } from "react";

import { DEFAULT_ACCENT, isAccent, type Accent } from "@/lib/speech";
import { LABEL_MODES, type LabelMode } from "@/lib/curriculum/types";

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
