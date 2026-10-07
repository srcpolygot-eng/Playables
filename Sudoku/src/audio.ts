/** Soft Web Audio SFX — respects YouTube audio flag */

import { YT } from './ytgame';

let ctx: AudioContext | null = null;
let unlocked = false;

function getCtx(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
  }
  return ctx;
}

export function unlockAudio(): void {
  const c = getCtx();
  if (!c) return;
  if (c.state === 'suspended') void c.resume();
  unlocked = true;
}

function tone(freq: number, dur: number, type: OscillatorType = 'sine', gain = 0.08): void {
  if (!YT.isAudioEnabled() || !unlocked) return;
  const c = getCtx();
  if (!c) return;
  const osc = c.createOscillator();
  const g = c.createGain();
  osc.type = type;
  osc.frequency.value = freq;
  g.gain.value = gain;
  g.gain.exponentialRampToValueAtTime(0.001, c.currentTime + dur);
  osc.connect(g);
  g.connect(c.destination);
  osc.start();
  osc.stop(c.currentTime + dur);
}

export const SFX = {
  place(): void {
    tone(520, 0.06, 'sine', 0.05);
  },
  note(): void {
    tone(380, 0.05, 'triangle', 0.04);
  },
  error(): void {
    tone(180, 0.12, 'square', 0.04);
  },
  win(): void {
    const notes = [523, 659, 784, 1046];
    notes.forEach((f, i) => setTimeout(() => tone(f, 0.18, 'sine', 0.07), i * 90));
  },
  click(): void {
    tone(660, 0.04, 'sine', 0.03);
  },
  buy(): void {
    tone(880, 0.08, 'triangle', 0.06);
    setTimeout(() => tone(1100, 0.1, 'triangle', 0.05), 60);
  },
  hint(): void {
    tone(440, 0.1, 'sine', 0.05);
    setTimeout(() => tone(660, 0.12, 'sine', 0.05), 80);
  },
};
