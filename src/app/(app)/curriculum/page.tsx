import { GraduationCap, Layers, Sparkles } from "lucide-react";

import { UnitCard } from "@/components/curriculum/unit-card";
import { listUnits } from "@/lib/curriculum/queries";
import { worksheetsFor } from "@/lib/curriculum/sheet-nav";

export const metadata = {
  title: "Curriculum · Concept English",
  description: "Kindergarten to Grade 1 English curriculum units.",
};

export default async function CurriculumIndexPage() {
  const units = (await listUnits()).filter((unit) => unit.isPublished);

  // Counted here rather than in the card so the card stays a dumb renderer,
  // and so the totals in the header and on each card come from one source.
  const cards = units.map((unit) => ({
    unit,
    sheetCount: worksheetsFor(unit, `/curriculum/${unit.slug}`).length,
  }));

  const totalSheets = cards.reduce((sum, card) => sum + card.sheetCount, 0);

  return (
    <main className="doodle-canvas flex-1">
      <div className="mx-auto w-full max-w-6xl px-4 py-10 sm:py-14">
        <header className="mb-10 text-center">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1 text-xs font-medium text-muted-foreground">
            <Sparkles className="size-3.5 text-primary" aria-hidden />
            Kindergarten to Grade 1
          </span>
          <h1 className="font-heading mt-4 text-4xl font-bold tracking-tight sm:text-5xl">
            Concept English
          </h1>
          <p className="mx-auto mt-3 max-w-md text-balance text-muted-foreground">
            Pick a unit to begin. Every unit teaches the letters, then puts them
            to work on a sheet.
          </p>

          {/* Both figures are counted from the curriculum itself, so they can
              never drift from what the grid below actually offers. */}
          {cards.length > 0 && (
            <dl className="mt-6 flex items-center justify-center gap-2 text-sm">
              <div className="flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 ring-1 ring-border">
                <GraduationCap className="size-4 text-muted-foreground" aria-hidden />
                <dt className="sr-only">Units</dt>
                <dd>
                  <span className="font-semibold">{cards.length}</span>{" "}
                  <span className="text-muted-foreground">units</span>
                </dd>
              </div>
              <div className="flex items-center gap-1.5 rounded-full bg-card px-3 py-1.5 ring-1 ring-border">
                <Layers className="size-4 text-muted-foreground" aria-hidden />
                <dt className="sr-only">Worksheets</dt>
                <dd>
                  <span className="font-semibold">{totalSheets}</span>{" "}
                  <span className="text-muted-foreground">sheets</span>
                </dd>
              </div>
            </dl>
          )}
        </header>

        {cards.length === 0 ? (
          <p className="rounded-3xl border-2 border-dashed p-10 text-center text-muted-foreground">
            No published units yet. Create one in the admin panel.
          </p>
        ) : (
          <ul className="grid gap-5 lg:grid-cols-2">
            {cards.map(({ unit, sheetCount }) => (
              <li key={unit.id}>
                <UnitCard unit={unit} sheetCount={sheetCount} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
