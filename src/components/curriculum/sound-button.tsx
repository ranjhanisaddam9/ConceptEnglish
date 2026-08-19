"use client";

import { Square, Volume2, VolumeOff } from "lucide-react";

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
  /**
   * Turns the button into a stop button while it is playing.
   *
   * Off by default: a single letter or word is over before a stop control
   * would be read, and one that flickers on every tap is just noise. Worth
   * turning on for something long enough that a listener might want out —
   * a whole story, for instance.
   */
  stoppable?: boolean;
  /**
   * Small label under the button. Reads "Stop" while a stoppable button is
   * playing, so the caption and the icon never disagree.
   */
  caption?: string;
  size?: keyof typeof SIZE_CLASSES;
  className?: string;
}

export function SoundButton({
  text,
  audioUrl,
  label,
  stoppable = false,
  caption,
  size = "lg",
  className,
}: SoundButtonProps) {
  const { speak, stop, isSpeaking, isSupported } = useSpeech({ text, audioUrl });

  if (!isSupported) {
    return (
      <Captioned caption={caption}>
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
      </Captioned>
    );
  }

  // A stoppable button is a toggle: the same target starts it and stops it,
  // so a child who wants it to stop presses the thing that is already under
  // their finger.
  const stopping = stoppable && isSpeaking;
  const action = stopping ? "Stop reading" : label;

  return (
    <Captioned caption={stopping ? "Stop" : caption}>
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
          // Without `stoppable` the hook ignores repeat taps; keeping the
          // button focusable (rather than `disabled`) avoids yanking focus
          // away mid-interaction.
          aria-label={action}
          aria-busy={isSpeaking}
          title={action}
          onClick={stopping ? stop : speak}
          className={cn(
            "relative rounded-full border border-primary/20 bg-primary/10 text-primary",
            "hover:bg-primary/20 aria-busy:bg-primary/20",
            "motion-safe:transition-transform motion-safe:active:scale-95",
            SIZE_CLASSES[size],
            className,
          )}
        >
          {stopping ? (
            // Filled, so it reads as a stop square rather than an outline the
            // speaker icon could be mistaken for at a glance.
            <Square aria-hidden className="fill-current" />
          ) : (
            <Volume2
              aria-hidden
              className={cn(isSpeaking && "motion-safe:animate-pulse")}
            />
          )}
        </Button>
      </span>
    </Captioned>
  );
}

/**
 * Adds the small label under a button, when there is one.
 *
 * Returns the button untouched otherwise, so the many call sites without a
 * caption keep the exact layout they had.
 */
function Captioned({
  caption,
  children,
}: {
  caption?: string;
  children: React.ReactNode;
}) {
  if (!caption) return children;

  return (
    <span className="inline-flex shrink-0 flex-col items-center gap-1.5">
      {children}
      <span className="text-xs font-medium text-muted-foreground">
        {caption}
      </span>
    </span>
  );
}
