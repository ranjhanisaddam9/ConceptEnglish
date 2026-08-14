"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

import { useAccent } from "@/hooks/use-preferences";
import { pickVoice } from "@/lib/speech";

/**
 * Plays a short piece of audio for the curriculum UI.
 *
 * Two sources, one API:
 *   - `audioUrl` — a pre-recorded file (preferred when present)
 *   - `text`     — spoken with the Web Speech API, in the selected accent
 *
 * Swapping the whole app from TTS to recorded child-friendly voice audio is
 * therefore a data change (fill in `audioUrl`), not a code change.
 *
 * Only one sound plays at a time across the page: tapping a new button stops
 * whatever was playing, which is what happens when a five-year-old taps
 * everything at once.
 */

export interface SpeechSource {
  /** Text to speak via the Web Speech API. Ignored when `audioUrl` is set. */
  text?: string | null;
  /** Pre-recorded audio file. Takes precedence over `text`. */
  audioUrl?: string | null;
}

export interface UseSpeechResult {
  speak: () => void;
  isSpeaking: boolean;
  /** False when the browser can neither play the file nor synthesise speech. */
  isSupported: boolean;
}

/** Stops whatever is currently playing, whoever started it. */
let stopActive: (() => void) | null = null;

function takeOver(stop: () => void) {
  stopActive?.();
  stopActive = stop;
}

function release(stop: () => void) {
  if (stopActive === stop) stopActive = null;
}

// Speech support never changes during a session, so there is nothing to
// subscribe to — but reading it through useSyncExternalStore keeps server and
// client render in step without a setState-in-effect.
const neverChanges = () => () => {};
const readSpeechSupport = () =>
  typeof window !== "undefined" && "speechSynthesis" in window;
// Assume supported while rendering on the server: it almost always is, and
// assuming otherwise would flash a disabled button on every page load.
const assumeSupported = () => true;

/** Rough upper bound on playback, used as a watchdog (see below). */
function estimatedDurationMs(text: string) {
  return Math.min(15_000, 1_500 + text.length * 160);
}

export function useSpeech({ text, audioUrl }: SpeechSource): UseSpeechResult {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const { accent } = useAccent();

  const canSynthesise = useSyncExternalStore(
    neverChanges,
    readSpeechSupport,
    assumeSupported,
  );

  // Chrome garbage-collects utterances that aren't referenced, which silently
  // truncates playback. Holding a ref keeps them alive.
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const watchdogRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearWatchdog = useCallback(() => {
    if (watchdogRef.current) {
      clearTimeout(watchdogRef.current);
      watchdogRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    clearWatchdog();

    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }
    utteranceRef.current = null;
    setIsSpeaking(false);
  }, [clearWatchdog]);

  // `stop` has a stable identity (its only dependency is memoised), so it can
  // double as this hook's handle in the single-playback registry.
  useEffect(() => {
    // Stop playback if the component unmounts mid-sentence, e.g. the teacher
    // switches letters while a word is still being read out.
    return () => {
      stop();
      release(stop);
    };
  }, [stop]);

  const isSupported = Boolean(audioUrl) || (canSynthesise && Boolean(text));

  const speak = useCallback(() => {
    if (isSpeaking || !isSupported) return;

    takeOver(stop);
    setIsSpeaking(true);

    const finish = () => {
      clearWatchdog();
      utteranceRef.current = null;
      audioRef.current = null;
      setIsSpeaking(false);
      release(stop);
    };

    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audioRef.current = audio;
      audio.addEventListener("ended", finish, { once: true });
      audio.addEventListener("error", finish, { once: true });
      void audio.play().catch(finish);
      // Recorded clips are short; a generous watchdog covers a stalled load.
      watchdogRef.current = setTimeout(finish, 15_000);
      return;
    }

    const spoken = text?.trim();
    if (!spoken) {
      finish();
      return;
    }

    const synth = window.speechSynthesis;
    // Clear any queued utterance left behind by a previous cancel().
    synth.cancel();

    const utterance = new SpeechSynthesisUtterance(spoken);
    utterance.lang = accent;
    // Slower and slightly brighter than default — easier for young learners.
    utterance.rate = 0.75;
    utterance.pitch = 1.1;

    // Voice lists load asynchronously, so this is read per utterance rather
    // than cached at mount.
    const voice = pickVoice(accent, synth.getVoices());
    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    }

    utterance.addEventListener("end", finish, { once: true });
    utterance.addEventListener("error", finish, { once: true });

    utteranceRef.current = utterance;
    synth.speak(utterance);

    // Some browsers never fire `end` (notably when the tab loses focus), which
    // would leave the button disabled forever. Reset defensively.
    watchdogRef.current = setTimeout(finish, estimatedDurationMs(spoken));
  }, [accent, audioUrl, clearWatchdog, isSpeaking, isSupported, stop, text]);

  return { speak, isSpeaking, isSupported };
}
