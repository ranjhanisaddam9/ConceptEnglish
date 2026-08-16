/**
 * The two noises an answered question makes.
 *
 * Synthesised rather than loaded: they are two short beeps, and a pair of
 * audio files would be two more things to ship, cache and get wrong offline.
 *
 * Rising for right, falling for wrong — the shape carries the meaning, so a
 * child hears which it was before they look up.
 */

let context: AudioContext | null = null;

/**
 * Browsers refuse to start audio until the user has interacted, so the
 * context is created on the first answer rather than at import.
 */
function audioContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!context) {
    const Ctor =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Ctor) return null;
    context = new Ctor();
  }
  if (context.state === "suspended") void context.resume();
  return context;
}

function tone(at: number, hertz: number, seconds: number, gain: number) {
  const audio = context;
  if (!audio) return;

  const oscillator = audio.createOscillator();
  const volume = audio.createGain();

  oscillator.type = "sine";
  oscillator.frequency.setValueAtTime(hertz, at);

  // Eased in and out: a square-edged note clicks.
  volume.gain.setValueAtTime(0, at);
  volume.gain.linearRampToValueAtTime(gain, at + 0.015);
  volume.gain.exponentialRampToValueAtTime(0.0001, at + seconds);

  oscillator.connect(volume).connect(audio.destination);
  oscillator.start(at);
  oscillator.stop(at + seconds + 0.02);
}

export function playAnswerSound(correct: boolean) {
  const audio = audioContext();
  if (!audio) return;

  const now = audio.currentTime;
  if (correct) {
    // Two notes up, a major third apart.
    tone(now, 660, 0.12, 0.16);
    tone(now + 0.11, 880, 0.18, 0.16);
  } else {
    // Two notes down, and quieter — a nudge, not a buzzer.
    tone(now, 400, 0.14, 0.12);
    tone(now + 0.13, 300, 0.22, 0.12);
  }
}
