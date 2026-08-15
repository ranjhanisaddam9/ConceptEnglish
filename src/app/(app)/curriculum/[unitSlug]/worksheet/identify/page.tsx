import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { IdentifyWorksheet } from "@/components/curriculum/identify-worksheet";
import { getAlphabet, getUnitBySlug } from "@/lib/curriculum/queries";
import { randomSheetSeed } from "@/lib/curriculum/sheet-order";

interface IdentifyPageProps {
  params: Promise<{ unitSlug: string }>;
}

/** Rendered per request so reloading deals a fresh grid of letters. */
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: IdentifyPageProps) {
  const { unitSlug } = await params;
  const unit = await getUnitBySlug(unitSlug);
  if (!unit) return { title: "Worksheet not found · Concept English" };

  return { title: `${unit.title} · Identify letters · Concept English` };
}

export default async function IdentifyPage({ params }: IdentifyPageProps) {
  const { unitSlug } = await params;
  const unit = await getUnitBySlug(unitSlug);

  if (!unit || !unit.isPublished) notFound();

  // The grid needs every letter, whichever group this unit covers — telling
  // one from the other is the exercise.
  const alphabet = await getAlphabet();
  const target = unit.letterGroup ?? "vowel";
  const noun = target === "vowel" ? "vowels" : "consonants";

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
          Identify the {noun}
        </h1>
        <p className="mt-1 text-muted-foreground">
          A grid of mixed letters to hunt through. Reload the page for a fresh
          set.
        </p>
      </div>

      <IdentifyWorksheet
        unit={unit}
        items={alphabet}
        target={target}
        seed={randomSheetSeed()}
      />
    </main>
  );
}
