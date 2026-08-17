"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Drawing the lines a child rules between two columns.
 *
 * Unit 2's matching sheet can place its dots straight from the layout
 * constants: both its columns hold the same number of fixed-width things. The
 * pattern units cannot — a picture sits over a spelling of whatever width the
 * word comes to, and the answer column distributes however many answers there
 * are over whatever height the picture column reaches. So their dots are
 * measured off the rendered page instead, and their lines are drawn in pixels.
 *
 * None of it prints.
 */

/** A dot's centre, in pixels from the top-left of the board. */
export interface AnchorPoint {
  x: number;
  y: number;
}

export interface MeasuredAnchors {
  left: Array<AnchorPoint | null>;
  right: Array<AnchorPoint | null>;
  width: number;
  height: number;
}

/**
 * Tracks where two columns of anchor dots have landed.
 *
 * Attach `board` to the element the two columns sit in, and stash each dot in
 * `leftDots` / `rightDots` by index. Re-measures whenever the board resizes,
 * and whenever `signature` changes — pass anything that moves the dots without
 * resizing the board, such as a control that changes how tall each answer is.
 */
export function useMatchLines(signature: string, tracking = false) {
  const board = useRef<HTMLDivElement>(null);
  const leftDots = useRef<Array<HTMLElement | null>>([]);
  const rightDots = useRef<Array<HTMLElement | null>>([]);
  const [anchors, setAnchors] = useState<MeasuredAnchors>({
    left: [],
    right: [],
    width: 0,
    height: 0,
  });

  /**
   * Where the pointer is, for the line still being drawn.
   *
   * Followed only while `tracking` — there is no reason to re-render the sheet
   * on every mouse move when no line is out. It is deliberately not cleared
   * when tracking stops: the caller draws the trail only while a line is out,
   * and keeping the last position means the next line appears at the pointer
   * straight away rather than waiting for it to move.
   */
  const [trail, setTrail] = useState<AnchorPoint | null>(null);

  useEffect(() => {
    if (!tracking) return;
    const root = board.current;
    if (!root) return;

    // Tracked on the window rather than the board, so the line keeps following
    // even when the pointer wanders off the sheet.
    const follow = (event: PointerEvent) => {
      const base = root.getBoundingClientRect();
      setTrail({ x: event.clientX - base.left, y: event.clientY - base.top });
    };

    window.addEventListener("pointermove", follow);
    return () => window.removeEventListener("pointermove", follow);
  }, [tracking]);

  useEffect(() => {
    const root = board.current;
    if (!root) return;

    const measure = () => {
      const base = root.getBoundingClientRect();
      // The dots pulse, but a scale about the centre leaves the centre where
      // it was — so this stays right mid-animation.
      const centre = (element: HTMLElement | null): AnchorPoint | null => {
        if (!element) return null;
        const box = element.getBoundingClientRect();
        return {
          x: box.left - base.left + box.width / 2,
          y: box.top - base.top + box.height / 2,
        };
      };

      setAnchors({
        left: leftDots.current.map(centre),
        right: rightDots.current.map(centre),
        width: base.width,
        height: base.height,
      });
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    return () => observer.disconnect();
  }, [signature]);

  return { board, leftDots, rightDots, anchors, trail };
}

/** One line the child has drawn, by the index of the dot at each end. */
export interface MatchLine {
  from: number;
  to: number;
  correct: boolean;
}

/**
 * The lines, over both columns.
 *
 * One runs from any left dot to any right dot, so they belong to the sheet
 * rather than to either end — which is why they are drawn on one overlay
 * rather than inside the rows.
 */
export function MatchLines({
  anchors,
  lines,
  pending,
}: {
  anchors: MeasuredAnchors;
  lines: MatchLine[];
  /** The line still being drawn: from a left dot to wherever the pointer is. */
  pending?: { from: number; to: AnchorPoint | null } | null;
}) {
  const trailing = pending?.to ? anchors.left[pending.from] : null;

  return (
    <svg
      viewBox={`0 0 ${anchors.width} ${anchors.height}`}
      width={anchors.width}
      height={anchors.height}
      aria-hidden
      className="pointer-events-none absolute top-0 left-0 print:hidden"
    >
      {/* Dashed and lighter than a landed line, so a line being pulled never
          reads as one already ruled. */}
      {trailing && pending?.to && (
        <line
          x1={trailing.x}
          y1={trailing.y}
          x2={pending.to.x}
          y2={pending.to.y}
          stroke="var(--worksheet-ink)"
          strokeWidth={2.6}
          strokeLinecap="round"
          strokeDasharray="7 6"
          strokeOpacity={0.7}
        />
      )}

      {lines.map((line, index) => {
        const from = anchors.left[line.from];
        const to = anchors.right[line.to];
        if (!from || !to) return null;

        return (
          <line
            key={index}
            data-match-line
            x1={from.x}
            y1={from.y}
            x2={to.x}
            y2={to.y}
            stroke={
              line.correct
                ? "var(--worksheet-right)"
                : "var(--worksheet-wrong)"
            }
            // Pixels, not millimetres: this overlay is measured off the page
            // rather than laid out on it. 0.9mm, in the units to hand.
            strokeWidth={3.4}
            strokeLinecap="round"
            // Normalised, so one dash offset draws every length of line.
            pathLength={1}
            strokeDasharray={1}
            strokeDashoffset={0}
          />
        );
      })}
    </svg>
  );
}
