import { VoiceSetting } from "@/components/settings/voice-setting";

export const metadata = {
  title: "Settings · Concept English",
  description: "Voice and display settings for the curriculum.",
};

export default function SettingsPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-8 sm:py-12">
      <header className="mb-8">
        <h1 className="font-heading text-3xl font-bold">Settings</h1>
        <p className="mt-1 text-muted-foreground">
          These apply to this device only, and are remembered between lessons.
        </p>
      </header>

      <div className="flex flex-col gap-5">
        <VoiceSetting />
      </div>
    </main>
  );
}
