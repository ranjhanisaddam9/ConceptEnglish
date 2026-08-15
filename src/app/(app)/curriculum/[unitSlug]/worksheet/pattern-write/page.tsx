import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { PatternWorksheet } from "@/components/curriculum/pattern-worksheet";
import { artworkInventory } from "@/lib/curriculum/artwork-inventory";
import { getUnitBySlug } from "@/lib/curriculum/queries";
import { randomSheetSeed } from "@/lib/curriculum/sheet-order";

interface PageProps {
  params: Promise<{ unitSlug: string }>;
}

/** Rendered per request so reloading deals a fresh sheet. */
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: PageProps) {
  const { unitSlug } = await params;
  const unit = await getUnitBySlug(unitSlug);
  if (!unit) return { title: "Worksheet not found · Concept English" };

  return { title: `${unit.title} · Write the missing letters · Concept English` };
}

export default async function Page({ params }: PageProps) {
  const { unitSlug } = await params;
  const unit = await getUnitBySlug(unitSlug);

  if (!unit || !unit.isPublished || unit.kind !== "word_patterns") notFound();

  // Only words with a real picture file may appear on a matching sheet.
  const illustrated = (await artworkInventory()).map((entry) => entry.word);

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
          Write the missing letters
        </h1>
        <p className="mt-1 text-muted-foreground">
          Reload the page or press New sheet for a fresh set.
        </p>
      </div>

      <PatternWorksheet
        unit={unit}
        items={unit.items}
        illustrated={illustrated}
        kind="write"
        seed={randomSheetSeed()}
      />
    </main>
  );
}
