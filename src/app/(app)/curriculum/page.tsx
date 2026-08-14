import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { listUnits } from "@/lib/curriculum/queries";

export const metadata = {
  title: "Curriculum · Concept English",
  description: "Kindergarten to Grade 1 English curriculum units.",
};

export default async function CurriculumIndexPage() {
  const units = (await listUnits()).filter((unit) => unit.isPublished);

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-10 sm:py-14">
        <header className="mb-10 text-center">
          <h1 className="font-heading text-3xl font-bold sm:text-4xl">
            Concept English
          </h1>
          <p className="mt-2 text-muted-foreground">
            Kindergarten to Grade 1 · choose a unit to begin
          </p>
        </header>

        {units.length === 0 ? (
          <p className="rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
            No published units yet. Create one in the admin panel.
          </p>
        ) : (
          <ul className="grid gap-5 sm:grid-cols-2">
            {units.map((unit) => (
              <li key={unit.id}>
                <Link
                  href={`/curriculum/${unit.slug}`}
                  className="block h-full rounded-xl outline-none focus-visible:ring-4 focus-visible:ring-ring/60"
                >
                  <Card className="h-full transition-shadow hover:shadow-md">
                    <CardHeader>
                      <CardTitle className="text-2xl">{unit.title}</CardTitle>
                      {unit.description && (
                        <CardDescription>{unit.description}</CardDescription>
                      )}
                    </CardHeader>
                    <CardContent className="mt-auto flex items-center gap-1.5 text-sm font-medium text-primary">
                      Open unit
                      <ArrowRight className="size-4" aria-hidden />
                    </CardContent>
                  </Card>
                </Link>
              </li>
            ))}
          </ul>
      )}
    </main>
  );
}
