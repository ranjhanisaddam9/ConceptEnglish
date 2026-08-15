import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { WritingConsonantsWorksheet } from "@/components/curriculum/writing-consonants-worksheet";
import { getUnitBySlug } from "@/lib/curriculum/queries";
import { randomSheetSeed } from "@/lib/curriculum/sheet-order";

interface WritingPageProps {
  params: Promise<{ unitSlug: string }>;
}

/** Rendered per request so reloading deals a fresh set of words. */
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: WritingPageProps) {
  const { unitSlug } = await params;
  const unit = await getUnitBySlug(unitSlug);
  if (!unit) return { title: "Worksheet not found · Concept English" };

  const noun = unit.letterGroup === "vowel" ? "vowels" : "consonants";
  return { title: `${unit.title} · Writing ${noun} · Concept English` };
}

export default async function WritingConsonantsPage({ params }: WritingPageProps) {
  const { unitSlug } = await params;
  const unit = await getUnitBySlug(unitSlug);

  if (!unit || !unit.isPublished) notFound();

  const group = unit.letterGroup ?? "consonant";
  const noun = group === "vowel" ? "vowels" : "consonants";

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
          Writing {noun}
        </h1>
        <p className="mt-1 text-muted-foreground">
          Each word is spelled out on writing lines with one consonant missing.
          Print, or deal a new set first.
        </p>
      </div>

      <WritingConsonantsWorksheet
        unit={unit}
        items={unit.items}
        group={group}
        seed={randomSheetSeed()}
      />
    </main>
  );
}
