/**
 * The noises an answered question makes.
 *
 * Synthesised rather than loaded: they are short beeps, and a set of audio
 * files would be that many more things to ship, cache and get wrong offline.
 *
 * Rising for right, falling for wrong — the shape carries the meaning, so a
 * child hears which it was before they look up. Drawing a line adds three
 * more: a knock at each end, and a held note in between that rises while the
 * line is out and waiting to land.
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

/**
 * The knock a dot makes when it is tapped.
 *
 * Short and dry, and the same at both ends of a line: it reports the touch and
 * nothing else, leaving right and wrong to be said by playAnswerSound.
 */
export function playTapSound() {
  const audio = audioContext();
  if (!audio) return;

  tone(audio.currentTime, 760, 0.07, 0.12);
}

/** The held note, while one is sounding. */
let stretching: { oscillator: OscillatorNode; volume: GainNode } | null = null;

/**
 * The sound of a line being drawn out of a dot and held there.
 *
 * Starts when a picture is chosen and runs until its letter is, rising all the
 * while, so a child who has picked a picture and stalled can hear that the
 * sheet is still waiting on them. Quiet, and a triangle rather than a sine, so
 * it sits under the room instead of over it.
 */
export function startStretchSound() {
  const audio = audioContext();
  // A second picture chosen before the first is answered keeps the note that
  // is already sounding, rather than stacking another on top of it.
  if (!audio || stretching) return;

  const now = audio.currentTime;
  const oscillator = audio.createOscillator();
  const volume = audio.createGain();

  oscillator.type = "triangle";
  oscillator.frequency.setValueAtTime(240, now);
  // Ten seconds of pull. Long past the point a child has answered, so what is
  // heard is the beginning of the climb rather than the top of it.
  oscillator.frequency.linearRampToValueAtTime(520, now + 10);

  volume.gain.setValueAtTime(0, now);
  volume.gain.linearRampToValueAtTime(0.045, now + 0.08);

  oscillator.connect(volume).connect(audio.destination);
  oscillator.start(now);

  stretching = { oscillator, volume };
}

/** Ends the held note, faded rather than cut so it does not click. */
export function stopStretchSound() {
  const audio = context;
  if (!audio || !stretching) return;

  const { oscillator, volume } = stretching;
  stretching = null;

  const now = audio.currentTime;
  volume.gain.cancelScheduledValues(now);
  volume.gain.setValueAtTime(volume.gain.value, now);
  volume.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
  oscillator.stop(now + 0.08);
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
