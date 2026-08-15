import { WordBankSheet } from "@/components/curriculum/word-bank-sheet";
import { artworkInventory } from "@/lib/curriculum/artwork-inventory";
import { getAlphabet } from "@/lib/curriculum/queries";

export const metadata = {
  title: "Word bank · Concept English",
  description:
    "CVC words, word families and consonant blends — the vocabulary phonics work is built from.",
};

/**
 * Reference material rather than a worksheet: it belongs to no single unit,
 * so it sits at the top level of the side panel.
 */
export default async function WordBankPage() {
  // Read off disk rather than hand-listed, so the picture stock-take can never
  // claim something we do not have. The letter units' example words are passed
  // in because they live in the curriculum, not in the word bank.
  const alphabet = await getAlphabet();
  const pictures = await artworkInventory(
    alphabet.flatMap((item) => item.examples.map((example) => example.label)),
  );

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 sm:py-8 print:max-w-none print:p-0">
      <div className="mb-5 print:hidden">
        <h1 className="font-heading text-2xl font-bold sm:text-3xl">
          Word bank
        </h1>
        <p className="mt-1 text-muted-foreground">
          The vocabulary that CVC, word-family, blend and digraph work is built
          from. Edit the lists in <code>src/content/word-bank.ts</code>.
        </p>
      </div>

      <WordBankSheet pictures={pictures} />
    </main>
  );
}
