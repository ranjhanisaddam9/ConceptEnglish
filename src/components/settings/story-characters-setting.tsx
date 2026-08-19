"use client";

import { useState } from "react";
import { toast } from "sonner";

import { SegmentedToggle } from "@/components/curriculum/segmented-toggle";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { saveStoryCast, useStoryCast } from "@/hooks/use-preferences";
import { displayName } from "@/lib/story/placeholders";
import {
  GENDER_OPTIONS,
  type Gender,
  type StoryCast,
  type StoryCharacter,
} from "@/lib/story/types";

/**
 * Who the stories are about.
 *
 * Every story is written with placeholders where a name or a pronoun goes, so
 * setting the two characters here re-tells all ten in the child's own terms —
 * and picks which of the four pictures each story shows.
 *
 * Both characters share one panel rather than getting a box each: they are one
 * setting, and two rows read faster than two cards on a phone.
 *
 * Edits are held locally until Save, so a half-typed name never reaches a
 * story mid-keystroke.
 */
export function StoryCharactersSetting() {
  const saved = useStoryCast();

  // Null until the first edit, so the fields track the stored cast through
  // hydration — seeding state from the store on first render would capture
  // the server-side default and then never catch up.
  const [draft, setDraft] = useState<StoryCast | null>(null);
  const cast = draft ?? saved;

  const dirty =
    draft !== null &&
    (draft.c1.name.trim() !== saved.c1.name ||
      draft.c2.name.trim() !== saved.c2.name ||
      draft.c1.gender !== saved.c1.gender ||
      draft.c2.gender !== saved.c2.gender);

  const edit = (slot: "c1" | "c2", change: Partial<StoryCharacter>) =>
    setDraft({ ...cast, [slot]: { ...cast[slot], ...change } });

  const save = () => {
    saveStoryCast(cast);
    setDraft(null);
    toast.success("Characters saved", {
      description: `The stories are now about ${displayName(cast.c1, "c1")} and ${displayName(cast.c2, "c2")}.`,
    });
  };

  return (
    <Card className="p-6">
      <CardHeader className="p-0">
        <CardTitle className="text-lg">Story characters</CardTitle>
        <CardDescription>
          The two children every story is about. Names and genders are filled
          into the story as it is read, and choose which picture it shows.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4 p-0">
        <fieldset className="flex flex-col gap-4 rounded-2xl border bg-muted/30 p-4">
          <legend className="px-1.5 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
            Characters
          </legend>

          <CharacterRow
            slot="c1"
            label="Character 1 Firstname"
            character={cast.c1}
            onChange={(change) => edit("c1", change)}
          />

          <CharacterRow
            slot="c2"
            label="Character 2 Firstname"
            character={cast.c2}
            onChange={(change) => edit("c2", change)}
          />
        </fieldset>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground">
            {dirty
              ? "You have unsaved changes."
              : `Stories are about ${displayName(cast.c1, "c1")} and ${displayName(cast.c2, "c2")}.`}
          </p>

          <Button
            type="button"
            size="lg"
            onClick={save}
            disabled={!dirty}
            className="h-12 rounded-full px-6 font-semibold"
          >
            Save characters
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * One character: name box and boy/girl switch on a single line.
 *
 * The switch keeps its own caption because it names the control for a screen
 * reader as well as on screen, and the two rows would otherwise be a wall of
 * unlabelled buttons.
 */
function CharacterRow({
  slot,
  label,
  character,
  onChange,
}: {
  slot: "c1" | "c2";
  label: string;
  character: StoryCharacter;
  onChange: (change: Partial<StoryCharacter>) => void;
}) {
  const nameId = `${slot}-name`;

  return (
    <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
      <div className="min-w-44 flex-1 space-y-1.5">
        <Label htmlFor={nameId}>{label}</Label>
        <Input
          id={nameId}
          value={character.name}
          onChange={(event) => onChange({ name: event.target.value })}
          // Names are short, and the stories read better without a surname.
          maxLength={20}
          autoComplete="off"
          spellCheck={false}
          placeholder={displayName({ ...character, name: "" }, slot)}
          // 48px to match every other control a small hand has to hit.
          className="h-12 rounded-xl text-base"
        />
      </div>

      <SegmentedToggle
        caption="Gender"
        value={character.gender}
        onChange={(gender) => onChange({ gender: gender as Gender })}
        options={GENDER_OPTIONS}
        size="sm"
      />
    </div>
  );
}
