"use client";

import { cn } from "@/lib/utils";

/**
 * The dot a line is drawn from or to on a matching sheet.
 *
 * Shared by every sheet where a child joins two columns, so a dot behaves the
 * same wherever they meet one: Unit 2's picture-matching sheet and Unit 3's
 * vowel-matching sheet both hang their anchors off this.
 *
 * Stands off whatever it belongs to by `inset` — the picture on its left, the
 * letter or shape on its right — so it reads as the end of a line rather than
 * the edge of a box. What answers to a finger is the invisible square around
 * it, well wider than the dot, and outside the layout so nothing else shifts.
 *
 * An empty ring until it is used, and a ring with a dot inside it after. That
 * one difference says which dots are still asking and which have been dealt
 * with, whether or not anything is moving on the page.
 */
/**
 * The dot itself, without anything to tap.
 *
 * Split out so an answer can be one target made of several parts — Unit 2's
 * matching sheet puts the dot and its letter inside a single button, so that
 * hovering either one lights up both.
 */
export function MatchAnchorDot({
  colour,
  radius,
  pulsing,
  filled,
}: {
  colour: string;
  /** Millimetres. */
  radius: number;
  pulsing: boolean;
  filled: boolean;
}) {
  return (
    <span
      data-anchor-dot
      data-anchor-pulse={pulsing ? "" : undefined}
      className={cn(
        "relative block shrink-0 rounded-full border-2",
        // Whatever the dot is doing on screen, it prints standing still.
        "print:transform-none print:animate-none",
      )}
      style={{
        width: `${radius * 2}mm`,
        height: `${radius * 2}mm`,
        borderColor: colour,
      }}
    >
      {filled && (
        // Inset from the ring rather than touching it, so the two read as a
        // dot in a circle and not as a thicker ring.
        <span
          data-anchor-fill
          className="absolute inset-[2px] rounded-full"
          style={{ backgroundColor: colour }}
        />
      )}
    </span>
  );
}

export function MatchAnchor({
  colour,
  side,
  radius,
  inset,
  label,
  pulsing,
  filled,
  pressed,
  disabled,
  onClick,
}: {
  colour: string;
  /** Which column it is in, and so which side its gap goes on. */
  side: "left" | "right";
  /** Millimetres. */
  radius: number;
  /** Millimetres between the dot and what it belongs to. */
  inset: number;
  label: string;
  pulsing: boolean;
  /** Tapped: the line either starts here or has landed here. */
  filled: boolean;
  pressed?: boolean;
  disabled: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      aria-pressed={pressed}
      className={cn(
        "relative flex shrink-0 rounded-full outline-none",
        "before:absolute before:-inset-[5mm] before:content-['']",
        "focus-visible:ring-4 focus-visible:ring-ring/60",
        disabled ? "cursor-default" : "cursor-pointer",
      )}
      style={{
        [side === "left" ? "marginLeft" : "marginRight"]: `${inset}mm`,
      }}
    >
      <MatchAnchorDot
        colour={colour}
        radius={radius}
        pulsing={pulsing}
        filled={filled}
      />
    </button>
  );
}
