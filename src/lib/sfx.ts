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
 * 文字が 消えた 町 (08 §3.6) writes on empty signboards instead of rocks:
 *
 *   neon   — a stroke lighting up as a neon tube: a short buzz, a glassy ping.
 *   fizz   — a tube that will not light: a sputter. A mistake.
 *   signOn — the whole sign coming on: a relay's clunk, the hum swelling.
 *   beam   — Nexmax firing the written character's light: charge, release.
 *   combo  — a COMBO banner: a run up the scale, longer at each tier.
 *   comboBreak — a COMBO ending: a soft fall.
 *   skill  — a companion's わざ: a rising sweep and a bell chord.
 *
 * The gacha's book: cordTick — its bookmark cord coming out a notch at a
 * time; unlatch — its clasp springing open.
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

/**
 * A stroke lighting up as a neon tube. `power` 0..1: a longer stroke rings
 * longer. `lift` raises the glass ping by that many semitones — in a fight it
 * climbs with each stroke and with the COMBO (lib/combo.ts strokeLift).
 */
export const neon = (power = 0.6, lift = 0) => {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  // The buzz of the tube catching: a low hum and its harmonic, cut short.
  tone(ac, { at: t, freq: 120, dur: 0.12 + power * 0.08, type: 'sawtooth', gain: 0.035 });
  tone(ac, { at: t, freq: 240, dur: 0.1 + power * 0.06, type: 'square', gain: 0.018 });
  noiseBurst(ac, { at: t, dur: 0.07, type: 'bandpass', from: 2600, to: 1800, q: 3, gain: 0.07 });
  // The glass lighting up.
  tone(ac, { at: t + 0.05, freq: (1568 + power * 400) * 2 ** (lift / 12), dur: 0.22, type: 'sine', gain: 0.05 + power * 0.03 });
};

/**
 * A COMBO banner (3, 5, 7, 10…): a quick run up the scale, longer and higher
 * with each tier (1..5), ending on a ringing top note.
 */
export const combo = (tier = 1) => {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  const steps = [0, 4, 7, 12, 16, 19, 24];
  const n = Math.min(steps.length, 2 + tier);
  const base = 659.3 * 2 ** ((tier - 1) / 12);
  for (let i = 0; i < n; i++) {
    const last = i === n - 1;
    const f = base * 2 ** (steps[i] / 12);
    tone(ac, { at: t + i * 0.055, freq: f, dur: last ? 0.5 : 0.12, type: 'triangle', gain: last ? 0.1 : 0.07 });
    if (last) tone(ac, { at: t + i * 0.055, freq: f * 2, dur: 0.4, type: 'sine', gain: 0.04 });
  }
  noiseBurst(ac, { at: t, dur: 0.18, type: 'highpass', from: 5000, to: 8000, q: 0.7, gain: 0.04 });
};

/** A companion's わざ: a quick rising sweep and a bright bell chord. */
export const skill = () => {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  tone(ac, { at: t, freq: 330, dur: 0.22, type: 'sawtooth', gain: 0.03, glideTo: 1320 });
  noiseBurst(ac, { at: t, dur: 0.25, type: 'bandpass', from: 1200, to: 6000, q: 1, gain: 0.08 });
  [1046.5, 1318.5, 1568, 2093].forEach((f, i) => tone(ac, { at: t + 0.2 + i * 0.03, freq: f, dur: 0.6, type: 'triangle', gain: 0.06 }));
};

/** A COMBO ending: a soft fall, not a scold — the mistake already sounded. */
export const comboBreak = () => {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  tone(ac, { at: t, freq: 523.3, dur: 0.16, type: 'triangle', gain: 0.06, glideTo: 392 });
  tone(ac, { at: t + 0.13, freq: 392, dur: 0.3, type: 'triangle', gain: 0.05, glideTo: 261.6 });
};

/** A tube that will not light: three quick sputters and a sagging hum. */
export const fizz = () => {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  for (let i = 0; i < 3; i++) {
    noiseBurst(ac, { at: t + i * 0.045, dur: 0.035, type: 'highpass', from: 3200, to: 2400, q: 0.7, gain: 0.09 });
  }
  tone(ac, { at: t, freq: 180, dur: 0.16, type: 'square', gain: 0.03, glideTo: 110 });
};

/** The whole sign coming on: a relay's clunk, then the hum swelling up. */
export const signOn = () => {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  noiseBurst(ac, { at: t, dur: 0.05, type: 'lowpass', from: 1800, to: 600, q: 1, gain: 0.3 });
  tone(ac, { at: t, freq: 90, dur: 0.12, type: 'sine', gain: 0.22, glideTo: 60 });
  tone(ac, { at: t + 0.04, freq: 220, dur: 0.6, type: 'triangle', gain: 0.05, glideTo: 330 });
};

/** Nexmax firing the written character's light: a rising charge, then the release. */
export const beam = () => {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  tone(ac, { at: t, freq: 300, dur: 0.3, type: 'sine', gain: 0.07, glideTo: 1400 });
  noiseBurst(ac, { at: t + 0.28, dur: 0.24, type: 'bandpass', from: 4000, to: 900, q: 1.2, gain: 0.32 });
  tone(ac, { at: t + 0.28, freq: 880, dur: 0.24, type: 'square', gain: 0.03, glideTo: 440 });
};

/** The gacha's bookmark cord coming out of the book a notch at a time: a small wooden click, higher each notch (`n` 0..2). */
export const cordTick = (n = 0) => {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  tone(ac, { at: t, freq: 520 + n * 160, dur: 0.05, type: 'triangle', gain: 0.07, glideTo: 420 + n * 140 });
  noiseBurst(ac, { at: t, dur: 0.035, type: 'bandpass', from: 3200, to: 2400, q: 3, gain: 0.07 });
};

/** Its clasp springing open: a bright snap of metal, then a rush of air as the book lets go. */
export const unlatch = () => {
  const ac = audio();
  if (!ac) return;
  const t = ac.currentTime;
  tone(ac, { at: t, freq: 1900, dur: 0.06, type: 'square', gain: 0.05, glideTo: 1200 });
  tone(ac, { at: t + 0.03, freq: 2700, dur: 0.2, type: 'triangle', gain: 0.06 });
  noiseBurst(ac, { at: t + 0.05, dur: 0.45, type: 'bandpass', from: 600, to: 4200, q: 0.9, gain: 0.35 });
};
