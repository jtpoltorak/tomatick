// Alert sounds are synthesized with the Web Audio API, so the extension ships
// no audio files. Used by the offscreen document (alerts while the popup is
// closed) and by the settings screen (preview).

import type { SoundId } from './timer';

interface Note {
  freq: number;
  /** Seconds after the sound starts. */
  at: number;
  duration: number;
  type: OscillatorType;
}

const SOUNDS: Record<SoundId, Note[]> = {
  // A soft bell: a fundamental plus a quieter overtone, with a long decay.
  bell: [
    { freq: 880, at: 0, duration: 1.6, type: 'sine' },
    { freq: 1760, at: 0, duration: 0.8, type: 'sine' },
    { freq: 880, at: 0.9, duration: 1.6, type: 'sine' },
  ],
  // A rising C-major arpeggio.
  chime: [
    { freq: 1046.5, at: 0, duration: 0.7, type: 'triangle' },
    { freq: 1318.5, at: 0.18, duration: 0.7, type: 'triangle' },
    { freq: 1568, at: 0.36, duration: 1.1, type: 'triangle' },
  ],
  // Three short alarm-clock beeps.
  digital: [0, 0.25, 0.5].map((at) => ({
    freq: 1000,
    at,
    duration: 0.14,
    type: 'square' as const,
  })),
};

/** Plays a sound and resolves when it has finished. */
export function playSound(ctx: AudioContext, sound: SoundId, volume: number): Promise<void> {
  const notes = SOUNDS[sound];
  const start = ctx.currentTime + 0.05;
  // Square waves are much louder than sines at the same gain.
  const level = Math.max(0, Math.min(1, volume)) * (sound === 'digital' ? 0.12 : 0.35);

  for (const note of notes) {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = note.type;
    osc.frequency.value = note.freq;
    const t = start + note.at;
    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(level, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + note.duration);
    osc.connect(gain).connect(ctx.destination);
    osc.start(t);
    osc.stop(t + note.duration + 0.05);
  }

  const end = Math.max(...notes.map((n) => n.at + n.duration));
  return new Promise((resolve) => setTimeout(resolve, (end + 0.1) * 1000));
}
