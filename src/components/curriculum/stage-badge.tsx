import type { Unit } from "@/lib/curriculum/types";
import { cn } from "@/lib/utils";

/**
 * Which year a unit is for.
 *
 * The course spans two, and the later units are squarely Grade 1 work. Shown
 * on the unit card and again at the top of the unit itself, so a teacher who
 * arrives by link rather than through the index still sees it.
 */

export function StageBadge({
  stage,
  className,
}: {
  stage: NonNullable<Unit["stage"]>;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "w-fit rounded-full px-2.5 py-0.5 text-xs font-medium tracking-wide uppercase",
        stage === "Kindergarten"
          ? "bg-[var(--vowel-tint)] text-foreground/70"
          : "bg-muted text-muted-foreground",
        className,
      )}
    >
      {stage}
    </span>
  );
}
