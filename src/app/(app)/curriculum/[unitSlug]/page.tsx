import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { UnitBrowser } from "@/components/curriculum/unit-browser";
import { getUnitBySlug } from "@/lib/curriculum/queries";

interface UnitPageProps {
  params: Promise<{ unitSlug: string }>;
}

export async function generateMetadata({ params }: UnitPageProps) {
  const { unitSlug } = await params;
  const unit = await getUnitBySlug(unitSlug);
  if (!unit) return { title: "Unit not found · Concept English" };

  return {
    title: `${unit.title} · Concept English`,
    description: unit.description ?? undefined,
  };
}

export default async function UnitPage({ params }: UnitPageProps) {
  const { unitSlug } = await params;
  const unit = await getUnitBySlug(unitSlug);

  if (!unit || !unit.isPublished) notFound();

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-10">
        <Link
          href="/curriculum"
          className="mb-6 inline-flex items-center gap-1 rounded-lg py-2 pr-3 text-sm font-medium text-muted-foreground hover:text-foreground focus-visible:ring-4 focus-visible:ring-ring/60 focus-visible:outline-none"
        >
          <ChevronLeft className="size-4" aria-hidden />
          All units
        </Link>

      <UnitBrowser unit={unit} items={unit.items} />
    </main>
  );
}
