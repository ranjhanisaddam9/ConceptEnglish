import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { MatchingWorksheet } from "@/components/curriculum/matching-worksheet";
import { getUnitBySlug } from "@/lib/curriculum/queries";

interface MatchPageProps {
  params: Promise<{ unitSlug: string }>;
}

export async function generateMetadata({ params }: MatchPageProps) {
  const { unitSlug } = await params;
  const unit = await getUnitBySlug(unitSlug);
  if (!unit) return { title: "Worksheet not found · Concept English" };

  return { title: `${unit.title} · Match the letters · Concept English` };
}

export default async function MatchWorksheetPage({ params }: MatchPageProps) {
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
          Match the letters
        </h1>
        <p className="mt-1 text-muted-foreground">
          Each question pairs a letter with five choices. Print, or generate a
          fresh set first.
        </p>
      </div>

      <MatchingWorksheet unit={unit} items={unit.items} />
    </main>
  );
}
