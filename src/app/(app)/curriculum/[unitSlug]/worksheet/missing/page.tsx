import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { MissingLettersWorksheet } from "@/components/curriculum/missing-letters-worksheet";
import { getUnitBySlug } from "@/lib/curriculum/queries";
import { randomSheetSeed } from "@/lib/curriculum/sheet-order";

interface MissingPageProps {
  params: Promise<{ unitSlug: string }>;
}

/**
 * Rendered per request so the seed below is fresh on every visit — reloading
 * gives a new sheet, which is the only way to re-roll now that the page has
 * no shuffle control.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: MissingPageProps) {
  const { unitSlug } = await params;
  const unit = await getUnitBySlug(unitSlug);
  if (!unit) return { title: "Worksheet not found · Concept English" };

  return { title: `${unit.title} · Missing letters · Concept English` };
}

export default async function MissingLettersPage({ params }: MissingPageProps) {
  const { unitSlug } = await params;
  const unit = await getUnitBySlug(unitSlug);

  if (!unit || !unit.isPublished) notFound();

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-8 print:max-w-none print:p-0">
      <div className="mb-5 print:hidden">
        <Link
          href={`/curriculum/${unit.slug}`}
          className="inline-flex items-center gap-1 rounded-lg py-2 pr-3 text-sm font-medium text-muted-foreground hover:text-foreground focus-visible:ring-4 focus-visible:ring-ring/60 focus-visible:outline-none"
        >
          <ChevronLeft className="size-4" aria-hidden />
          {unit.title}
        </Link>
        <h1 className="font-heading mt-1 text-2xl font-bold sm:text-3xl">
          Missing letters
        </h1>
        <p className="mt-1 text-muted-foreground">
          Choose a question shape, then print. Reload the page for a fresh set
          of letters.
        </p>
      </div>

      <MissingLettersWorksheet
        unit={unit}
        items={unit.items}
        seed={randomSheetSeed()}
      />
    </main>
  );
}
