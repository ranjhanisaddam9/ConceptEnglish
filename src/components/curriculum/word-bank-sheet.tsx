"use client";

import { useMemo, useState } from "react";

import { SegmentedToggle } from "@/components/curriculum/segmented-toggle";
import { WorksheetToolbar } from "@/components/curriculum/worksheet-toolbar";
import {
  WORD_BANK_LIST_OPTIONS,
  blendGroups,
  cvcGroups,
  digraphGroups,
  picturesByBlend,
  picturesByDigraph,
  picturesByFamily,
  type PictureEntry,
  type WordBankList,
} from "@/lib/curriculum/word-bank";

/**
 * The phonics word bank.
 *
 * A reference list rather than an exercise: it flows down the page and breaks
 * naturally across sheets when printed, instead of being pinned to one A4
 * page like the worksheets.
 */

/** A row of picture tiles under a family or blend heading. */
function PictureSection({
  title,
  empty,
  groups,
}: {
  title: string;
  empty: string;
  groups: Array<{
    key: string;
    label: string;
    /** Small print under the label, where the label alone is ambiguous. */
    note?: string;
    pictures: PictureEntry[];
  }>;
}) {
  return (
    <section className="flex flex-col gap-3">
      <h2 className="font-heading text-sm font-semibold tracking-wide text-neutral-500 uppercase">
        {title}
      </h2>

      {groups.length === 0 ? (
        <p className="text-sm text-neutral-500">{empty}</p>
      ) : (
        groups.map((group) => (
          <div
            key={group.key}
            className="flex items-center gap-4 break-inside-avoid border-t border-neutral-200 pt-3"
          >
            <div className="shrink-0" style={{ width: "3.5rem" }}>
              <span className="font-letter text-2xl leading-none font-bold text-neutral-400">
                {group.label}
              </span>
              {group.note && (
                <span className="block text-[0.65rem] leading-tight text-neutral-400">
                  {group.note}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-4">
              {group.pictures.map((picture) => (
                <figure key={picture.word} className="w-16 text-center">
                  {/* Plain <img> to keep the asset at its own size — see the
                      note in worksheet-page.tsx. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={picture.src}
                    alt={picture.word}
                    className="h-14 w-full object-contain"
                  />
                  <figcaption className="font-letter mt-1 text-sm font-bold">
                    {picture.word.toLowerCase()}
                  </figcaption>
                </figure>
              ))}
            </div>
          </div>
        ))
      )}
    </section>
  );
}

export function WordBankSheet({ pictures }: { pictures: PictureEntry[] }) {
  const [list, setList] = useState<WordBankList>("cvc");

  const cvc = useMemo(() => cvcGroups(), []);
  const blends = useMemo(() => blendGroups(), []);
  const digraphs = useMemo(() => digraphGroups(), []);
  const familyPictures = useMemo(() => picturesByFamily(pictures), [pictures]);
  const blendPictures = useMemo(() => picturesByBlend(pictures), [pictures]);
  const digraphPictures = useMemo(() => picturesByDigraph(pictures), [pictures]);

  const countPictures = (groups: Array<{ pictures: PictureEntry[] }>) =>
    groups.reduce((total, group) => total + group.pictures.length, 0);

  const familyPictureCount = countPictures(familyPictures);
  const blendPictureCount = countPictures(blendPictures);
  const digraphPictureCount = countPictures(digraphPictures);

  const cvcCount = cvc.reduce(
    (total, group) => total + group.families.length,
    0,
  );
  const familyCount = new Set(
    cvc.flatMap((group) => group.families.map((entry) => entry.family)),
  ).size;
  const blendCount = blends.reduce(
    (total, group) =>
      total + group.blends.reduce((sum, entry) => sum + entry.words.length, 0),
    0,
  );
  const digraphCount = digraphs.reduce(
    (total, group) =>
      total + group.digraphs.reduce((sum, entry) => sum + entry.words.length, 0),
    0,
  );

  return (
    <div className="flex flex-col gap-6">
      {/* ---- Controls (screen only) ---- */}
      <WorksheetToolbar>
        <SegmentedToggle
          caption="List"
          value={list}
          onChange={setList}
          options={WORD_BANK_LIST_OPTIONS}
        />
      </WorksheetToolbar>

      <div
        data-worksheet-page
        className="mx-auto w-full max-w-4xl bg-white p-8 text-neutral-900 shadow-lg ring-1 ring-black/10 print:max-w-none print:p-0 print:shadow-none print:ring-0"
      >
        <header className="mb-6 border-b border-neutral-300 pb-3">
          <p className="font-heading text-lg font-bold">Word bank</p>
          <p className="text-xs text-neutral-500">
            {list === "cvc" &&
              `${cvcCount} three-letter words by starting consonant, each labelled with the word family it joins — ${familyCount} families in all.`}
            {list === "blends" &&
              `${blendCount} words across ${blends.reduce((n, g) => n + g.blends.length, 0)} blends, by starting consonant then blending letter.`}
            {list === "digraphs" &&
              `${digraphCount} words across ${digraphs.reduce((n, g) => n + g.digraphs.length, 0)} digraphs — two letters making one sound.`}
            {list === "pictures" &&
              `${pictures.length} pictures in the library. ${familyPictureCount} are CVC words across ${familyPictures.length} families; ${blendPictureCount} open with a blend; ${digraphPictureCount} carry a digraph.`}
          </p>
        </header>

        {list === "cvc" ? (
          <div className="flex flex-col gap-4">
            {cvc.map((group) => (
              <section
                key={group.start}
                className="flex gap-4 break-inside-avoid border-t border-neutral-200 pt-3"
              >
                <h3
                  className="font-letter shrink-0 text-3xl leading-none font-bold text-neutral-400 uppercase"
                  style={{ width: "2.5rem" }}
                >
                  {group.start}
                </h3>
                <div className="flex flex-wrap gap-x-6 gap-y-2">
                  {group.families.map((entry) => (
                    <p
                      key={entry.family}
                      className="font-letter text-xl leading-none"
                    >
                      <span className="text-neutral-400">-{entry.family}</span>{" "}
                      {entry.word}
                    </p>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : list === "blends" ? (
          <div className="flex flex-col gap-4">
            {blends.map((group) => (
              <section
                key={group.start}
                className="flex gap-4 break-inside-avoid border-t border-neutral-200 pt-3"
              >
                <h3
                  className="font-letter shrink-0 text-3xl leading-none font-bold text-neutral-400 uppercase"
                  style={{ width: "2.5rem" }}
                >
                  {group.start}
                </h3>
                <div className="flex flex-1 flex-col gap-2">
                  {group.blends.map((entry) => (
                    <div key={entry.blend} className="flex gap-3">
                      <span className="font-letter w-12 shrink-0 text-xl font-bold">
                        {entry.blend}
                      </span>
                      <p className="font-letter text-xl leading-relaxed">
                        {entry.words.join("   ")}
                      </p>
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : list === "pictures" ? (
          <div className="flex flex-col gap-8">
            <PictureSection
              title={`Word families — ${familyPictureCount} pictures in ${familyPictures.length} families`}
              empty="No picture in the library is a CVC word yet."
              groups={familyPictures.map((group) => ({
                key: group.family,
                label: `-${group.family}`,
                pictures: group.pictures,
              }))}
            />
            <PictureSection
              title={`Blends — ${blendPictureCount} pictures across ${blendPictures.length} blends`}
              empty="No picture in the library opens with a blend yet."
              groups={blendPictures.map((group) => ({
                key: group.blend,
                label: group.blend,
                pictures: group.pictures,
              }))}
            />
            <PictureSection
              title={`Digraphs — ${digraphPictureCount} pictures across ${digraphPictures.length} digraphs`}
              empty="No picture in the library carries a digraph yet."
              groups={digraphPictures.map((group) => ({
                key: `${group.digraph}-${group.position}`,
                // The pair alone would show "sh" twice; the end it sits at is
                // what tells the two groups apart.
                label: group.digraph,
                note: group.position === "end" ? "at the end" : "at the start",
                pictures: group.pictures,
              }))}
            />
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {digraphs.map((group) => (
              <div key={group.position} className="flex flex-col gap-3">
                <h2 className="font-heading text-sm font-semibold tracking-wide text-neutral-500 uppercase">
                  {group.label}
                </h2>
                {group.digraphs.map((entry) => (
                  <section
                    key={`${group.position}-${entry.digraph}`}
                    className="flex gap-4 break-inside-avoid border-t border-neutral-200 pt-3"
                  >
                    <h3
                      className="font-letter shrink-0 text-3xl leading-none font-bold text-neutral-400"
                      style={{ width: "2.5rem" }}
                    >
                      {entry.digraph}
                    </h3>
                    <p className="font-letter text-xl leading-relaxed">
                      {entry.words.join("   ")}
                    </p>
                  </section>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
