"use client";

import { SegmentedToggle } from "@/components/curriculum/segmented-toggle";
import { SoundButton } from "@/components/curriculum/sound-button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useAccent } from "@/hooks/use-preferences";
import { ACCENT_OPTIONS } from "@/lib/speech";

/**
 * Which English accent the sound buttons speak in.
 *
 * Includes a sample button so the choice can be heard here rather than by
 * going back to a lesson to test it.
 */
export function VoiceSetting() {
  const { accent, setAccent } = useAccent();

  return (
    <Card className="p-6">
      <CardHeader className="p-0">
        <CardTitle className="text-lg">Voice</CardTitle>
        <CardDescription>
          The accent used when a letter or word is read aloud. British is the
          default.
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-wrap items-center justify-between gap-5 p-0">
        <SegmentedToggle
          caption="Accent"
          value={accent}
          onChange={setAccent}
          options={ACCENT_OPTIONS}
        />

        <div className="flex items-center gap-3">
          <span className="text-sm text-muted-foreground">Hear a sample</span>
          <SoundButton
            size="md"
            text="A for Apple"
            label="Hear a sample of the selected voice"
          />
        </div>
      </CardContent>
    </Card>
  );
}
