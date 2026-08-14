/**
 * Speech settings, kept free of React so the voice-matching logic stays
 * easy to reason about (and to swap out when recorded audio arrives).
 */

export const ACCENTS = ["en-GB", "en-US"] as const;

export type Accent = (typeof ACCENTS)[number];

export const DEFAULT_ACCENT: Accent = "en-GB";

export const ACCENT_OPTIONS = [
  {
    value: "en-GB" as const,
    label: "British",
    description: "Speak with a British English voice",
  },
  {
    value: "en-US" as const,
    label: "American",
    description: "Speak with an American English voice",
  },
];

export function isAccent(value: unknown): value is Accent {
  return typeof value === "string" && (ACCENTS as readonly string[]).includes(value);
}

/**
 * Voices that actually sound like the chosen accent, best first.
 *
 * Browsers expose wildly different voice lists, so this is a preference
 * order rather than a lookup: named voices first, then anything reporting the
 * right locale, then any English voice at all.
 */
const VOICE_PREFERENCES: Record<Accent, string[]> = {
  "en-GB": [
    "Google UK English Female",
    "Google UK English Male",
    "Microsoft Libby",
    "Microsoft Sonia",
    "Microsoft Ryan",
    "Microsoft Hazel",
    "Daniel",
    "Kate",
    "Serena",
  ],
  "en-US": [
    "Google US English",
    "Microsoft Aria",
    "Microsoft Jenny",
    "Microsoft Guy",
    "Microsoft Zira",
    "Samantha",
    "Alex",
  ],
};

function normaliseLang(lang: string) {
  return lang.replace("_", "-").toLowerCase();
}

export function pickVoice(
  accent: Accent,
  voices: SpeechSynthesisVoice[],
): SpeechSynthesisVoice | null {
  if (!voices.length) return null;

  for (const name of VOICE_PREFERENCES[accent]) {
    const match = voices.find((voice) => voice.name.includes(name));
    if (match) return match;
  }

  const target = normaliseLang(accent);
  const exact = voices.find((voice) => normaliseLang(voice.lang) === target);
  if (exact) return exact;

  // No voice for this accent is installed — any English voice still beats
  // whatever the browser would pick by default.
  return voices.find((voice) => normaliseLang(voice.lang).startsWith("en")) ?? null;
}
