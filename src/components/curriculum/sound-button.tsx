"use client";

import { Volume2, VolumeOff } from "lucide-react";

import { useSpeech, type SpeechSource } from "@/hooks/use-speech";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * The single place the app makes a sound.
 *
 * Pass `text` for text-to-speech, or `audioUrl` for a pre-recorded clip.
 * `audioUrl` wins when both are given, so moving from synthesised speech to
 * recorded voice-over later means filling in a database column — no component
 * change and no call-site change.
 */

const SIZE_CLASSES = {
  // 48px is the floor, and nothing goes below it. The smallest of these sits
  // on a worksheet beside a question, which is the last place to put a target
  // a fingertip can miss.
  md: "size-12 [&_svg]:size-5",
  lg: "size-16 [&_svg]:size-7",
  xl: "size-20 [&_svg]:size-9",
} as const;

export interface SoundButtonProps extends SpeechSource {
  /** Accessible label, e.g. 'Play the sound for "A for Apple"'. */
  label: string;
  size?: keyof typeof SIZE_CLASSES;
  className?: string;
}

export function SoundButton({
  text,
  audioUrl,
  label,
  size = "lg",
  className,
}: SoundButtonProps) {
  const { speak, isSpeaking, isSupported } = useSpeech({ text, audioUrl });

  if (!isSupported) {
    return (
      <Button
        type="button"
        variant="ghost"
        disabled
        aria-label={`${label} (audio is not available in this browser)`}
        className={cn(
          "rounded-full text-muted-foreground",
          SIZE_CLASSES[size],
          className,
        )}
      >
        <VolumeOff aria-hidden />
      </Button>
    );
  }

  return (
    <span className="relative inline-flex shrink-0">
      {/* Expanding halo while playing. Decorative, and only when the user has
          not asked for reduced motion. */}
      {isSpeaking && (
        <span
          aria-hidden
          className="motion-safe:animate-ping absolute inset-0 rounded-full bg-primary/25"
        />
      )}
      <Button
        type="button"
        variant="secondary"
        // The hook ignores repeat taps; keeping the button focusable (rather
        // than `disabled`) avoids yanking focus away mid-interaction.
        aria-label={label}
        aria-busy={isSpeaking}
        title={label}
        onClick={speak}
        className={cn(
          "relative rounded-full border border-primary/20 bg-primary/10 text-primary",
          "hover:bg-primary/20 aria-busy:bg-primary/20",
          "motion-safe:transition-transform motion-safe:active:scale-95",
          SIZE_CLASSES[size],
          className,
        )}
      >
        <Volume2
          aria-hidden
          className={cn(isSpeaking && "motion-safe:animate-pulse")}
        />
      </Button>
    </span>
  );
}
