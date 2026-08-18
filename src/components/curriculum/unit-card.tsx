import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Layers } from "lucide-react";

import { StageBadge } from "@/components/curriculum/stage-badge";
import { unitAccent, unitMascot } from "@/lib/curriculum/unit-face";
import type { Unit } from "@/lib/curriculum/types";

/**
 * One unit on the dashboard.
 *
 * The whole card is the link, so a child aiming with a finger rather than a
 * cursor cannot miss. Its colour and picture come from `unit-face`, which
 * derives both from what the unit teaches — nothing here is per-unit special
 * casing, and an eighth unit gets a card without an edit.
 *
 * Stays a server component: no state, no handlers, nothing to hydrate. The
 * hover lift is a transform, which the compositor handles without laying the
 * page out again.
 */

export function UnitCard({
  unit,
  sheetCount,
}: {
  unit: Unit;
  sheetCount: number;
}) {
  return (
    <Link
      href={`/curriculum/${unit.slug}`}
      data-accent={unitAccent(unit)}
      className="group flex h-full items-start gap-4 rounded-3xl border-2 border-[var(--unit-ring)] bg-card p-4 outline-none motion-safe:transition-transform motion-safe:duration-200 hover:-translate-y-0.5 focus-visible:ring-4 focus-visible:ring-[var(--unit-ring)] sm:gap-5 sm:p-5"
    >
      {/* The artwork ships with its own pastel square (see content/artwork),
          so it fills the tile rather than sitting on a second one. The unit
          colour is carried by the border, the badge and the button instead. */}
      <Image
        src={unitMascot(unit)}
        alt=""
        width={128}
        height={128}
        className="size-24 shrink-0 rounded-2xl sm:size-28"
        aria-hidden
      />

      <div className="flex min-w-0 flex-1 flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          {unit.stage && <StageBadge stage={unit.stage} />}
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--unit-tint)] px-2.5 py-0.5 text-xs font-semibold text-[var(--unit-ink)]">
            <Layers className="size-3" aria-hidden />
            {sheetCount} {sheetCount === 1 ? "sheet" : "sheets"}
          </span>
        </div>

        <h2 className="font-heading text-xl font-bold text-balance sm:text-2xl">
          {unit.title}
        </h2>

        {unit.description && (
          <p className="text-sm text-muted-foreground">{unit.description}</p>
        )}

        <span className="mt-auto inline-flex w-fit items-center gap-1.5 rounded-full bg-[var(--unit-ink)] px-4 py-2 text-sm font-semibold text-card motion-safe:transition-transform group-hover:scale-[1.03]">
          Start unit
          <ArrowRight
            className="size-4 motion-safe:transition-transform group-hover:translate-x-0.5"
            aria-hidden
          />
        </span>
      </div>
    </Link>
  );
}
