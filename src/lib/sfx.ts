import { useGameStore } from '../store/gameStore';

/**
 * 効果音 — synthesised with the Web Audio API.
 *
 * 2026-09-23: 「刀に 効果音を つけて。斬りつける ように」. Every sound here is
 * made from noise and oscillators at the moment it plays, so nothing has to
 * be downloaded, licensed or cached, and a stroke is heard the instant the
 * finger lifts.
 *
 *   slash  — the blade: an airy whoosh that sweeps down, with a short bright
 *            "shing" of steel on top. Plays on every correct stroke.
 *   clang  — a glancing blow off the rock: a dull metal tick. A mistake.
 *   crack  — the rock splitting: a crunch and a low thud.
 *   chime  — a piece of kanji material, or a new blade: a small bell run.
 *   hit    — the blade landing on an opponent.
 *   hurt   — the opponent landing on Nexmax.
 *
 * Respects せってい → 音を 消す. Browsers only allow audio after a tap, which
 * every one of these follows.
 */

let ctx: AudioContext | null = null;
let noiseBuffer: AudioBuffer | null = null;

const audio = (): AudioContext | null => {
  if (useGameStore.getState().settings.muted) return null;
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
};

const noise = (ac: AudioContext): AudioBuffer => {
  if (noiseBuffer && noiseBuffer.sampleRate === ac.sampleRate) return noiseBuffer;
  const len = Math.floor(ac.sampleRate * 0.6);
  noiseBuffer = ac.createBuffer(1, len, ac.sampleRate);
  const data = noiseBuffer.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  return noiseBuffer;
};

/** A burst of filtered noise with a volume envelope. */
const noiseBurst = (
  ac: AudioContext,
  { at, dur, type, from, to, q, gain }: { at: number; dur: number; type: BiquadFilterType; from: number; to: number; q: number; gain: number },
) => {
  const src = ac.createBufferSource();
  src.buffer = noise(ac);
  const filter = ac.createBiquadFilter();
  filter.type = type;
  filter.Q.value = q;
  filter.frequency.setValueAtTime(from, at);
  filter.frequency.exponentialRampToValueAtTime(to, at + dur);
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(gain, at + dur * 0.18);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  src.connect(filter).connect(g).connect(ac.destination);
  src.start(at);
  src.stop(at + dur + 0.02);
};

/** A pitched tone with a fast attack and an exponential tail. */
const tone = (
  ac: AudioContext,
  { at, freq, dur, type = 'sine', gain, glideTo }: { at: number; freq: number; dur: number; type?: OscillatorType; gain: number; glideTo?: number },
) => {
  const osc = ac.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, at);
  if (glideTo) osc.frequency.exponentialRampToValueAtTime(glideTo, at + dur);
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(gain, at + 0.006);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  osc.connect(g).connect(ac.destination);
  osc.start(at);
  osc.stop(at + dur + 0.02);
};

/** The blade. `power` 0..1 makes a heavier, longer swing. */
export const slash = (power = 0.6) => {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  const dur = 0.16 + power * 0.12;
  // The whoosh: a band of air sweeping from high to low as the blade passes.
  noiseBurst(ac, { at: t, dur, type: 'bandpass', from: 5200, to: 700, q: 1.4, gain: 0.55 + power * 0.25 });
  // The edge: a short ring of steel, slightly detuned so it shimmers.
  tone(ac, { at: t + dur * 0.35, freq: 2900 + Math.random() * 300, dur: 0.18, type: 'triangle', gain: 0.07 + power * 0.05 });
  tone(ac, { at: t + dur * 0.35, freq: 4350 + Math.random() * 300, dur: 0.12, type: 'sine', gain: 0.04 });
};

export const clang = () => {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  tone(ac, { at: t, freq: 620, dur: 0.12, type: 'square', gain: 0.05, glideTo: 480 });
  noiseBurst(ac, { at: t, dur: 0.06, type: 'highpass', from: 3000, to: 2000, q: 0.7, gain: 0.12 });
};

export const crack = () => {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  noiseBurst(ac, { at: t, dur: 0.28, type: 'lowpass', from: 2400, to: 300, q: 0.8, gain: 0.7 });
  tone(ac, { at: t, freq: 120, dur: 0.3, type: 'sine', gain: 0.35, glideTo: 55 });
};

export const chime = () => {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  [1318.5, 1760, 2349.3].forEach((f, i) => tone(ac, { at: t + 0.07 * i, freq: f, dur: 0.5, type: 'sine', gain: 0.09 }));
};

export const hit = () => {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime + 0.12;
  noiseBurst(ac, { at: t, dur: 0.14, type: 'lowpass', from: 1800, to: 400, q: 1, gain: 0.5 });
  tone(ac, { at: t, freq: 180, dur: 0.18, type: 'sine', gain: 0.3, glideTo: 70 });
};

/** A short buzz on phones that have one. Kept to the moments that hurt. */
const buzz = (ms: number) => {
  if (useGameStore.getState().settings.muted) return;
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate(ms);
};

export const hurt = () => {
  buzz(70);
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  tone(ac, { at: t, freq: 300, dur: 0.25, type: 'sawtooth', gain: 0.08, glideTo: 120 });
  noiseBurst(ac, { at: t, dur: 0.2, type: 'lowpass', from: 900, to: 200, q: 1, gain: 0.35 });
};

/** A button: a soft wooden tick. Played for every .g-btn press (src/main.tsx). */
export const tap = () => {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  tone(ac, { at: t, freq: 880, dur: 0.07, type: 'triangle', gain: 0.06, glideTo: 660 });
  noiseBurst(ac, { at: t, dur: 0.04, type: 'bandpass', from: 2400, to: 1800, q: 2, gain: 0.05 });
};

/** One star on the result screen. `n` 0..2 rises in pitch. */
export const star = (n = 0) => {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  const base = [1046.5, 1318.5, 1568][Math.min(2, Math.max(0, n))];
  tone(ac, { at: t, freq: base, dur: 0.35, type: 'triangle', gain: 0.11 });
  tone(ac, { at: t, freq: base * 2, dur: 0.25, type: 'sine', gain: 0.05 });
};

/** A cleared stage: a short rising fanfare. */
export const fanfare = () => {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  const notes: [number, number, number][] = [
    [523.3, 0, 0.14],
    [659.3, 0.12, 0.14],
    [784, 0.24, 0.14],
    [1046.5, 0.38, 0.55],
  ];
  for (const [f, at, dur] of notes) {
    tone(ac, { at: t + at, freq: f, dur, type: 'square', gain: 0.045 });
    tone(ac, { at: t + at, freq: f / 2, dur, type: 'triangle', gain: 0.06 });
  }
};

/** A lost fight: two falling notes, gentle — losing is part of learning. */
export const lose = () => {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  tone(ac, { at: t, freq: 392, dur: 0.3, type: 'triangle', gain: 0.08 });
  tone(ac, { at: t + 0.26, freq: 311.1, dur: 0.5, type: 'triangle', gain: 0.08 });
};

/** The fight begins: a low drum and a rising sweep. */
export const battleStart = () => {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  tone(ac, { at: t, freq: 90, dur: 0.35, type: 'sine', gain: 0.4, glideTo: 50 });
  noiseBurst(ac, { at: t + 0.05, dur: 0.45, type: 'bandpass', from: 400, to: 3600, q: 1.2, gain: 0.25 });
};
