import { useEffect } from 'react';
import { useGameStore } from '../store/gameStore';
import { assetPath } from './assetPath';

/**
 * BGM — one looping track at a time, chosen by the screen being shown.
 *
 * 2026-10-02「BGM は いったん フリーで」: the tracks are CC0 music (public/audio/bgm,
 * sources in public/audio/bgm/README.md). A screen asks for its track with
 * useBgm; asking for the one already playing changes nothing, so walking
 * from the title to the map keeps the music going, and a new track fades in
 * over the old one.
 *
 * The volume goes through a Web Audio gain node: an iPhone ignores an audio
 * element's own volume. Browsers only allow sound after a tap, so a track
 * asked for before the first tap starts on it. The music stops in the
 * background and when せってい turns sound or BGM off.
 */

/**
 * town: title・地図 / story: お話と 書き取り（同じ 曲で つなぐ）/ battle: たたかい / shop: 漢字やさん /
 * sad: 字が 消えて 困って いる お話の 始め / tension: モジクイが 出る（出会い・プロローグの 影）
 */
export type BgmTrack = 'town' | 'story' | 'battle' | 'shop' | 'sad' | 'tension';

/**
 * The file for each track, once it is in public/audio/bgm. A track without
 * one is silence (nothing is requested, so nothing 404s).
 */
const FILES: Partial<Record<BgmTrack, string>> = {
  town: 'audio/bgm/town.mp3',
  story: 'audio/bgm/story.mp3',
  battle: 'audio/bgm/battle.mp3',
  shop: 'audio/bgm/shop.mp3',
  sad: 'audio/bgm/sad.mp3',
  tension: 'audio/bgm/tension.mp3',
};

/** Under the sound effects, so a stroke or a hit is always heard. */
const VOLUME = 0.32;
const FADE_S = 0.8;

interface Player {
  el: HTMLAudioElement;
  gain: GainNode;
}

let ctx: AudioContext | null = null;
const players = new Map<BgmTrack, Player>();
/** The track the screen asked for, playing or waiting for a tap. */
let wanted: BgmTrack | null = null;
let current: BgmTrack | null = null;
let unlocked = false;

const allowed = () => {
  const s = useGameStore.getState().settings;
  return !s.muted && !s.bgmOff;
};

const context = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  return ctx;
};

const player = (track: BgmTrack): Player | null => {
  const ac = context();
  if (!ac) return null;
  const file = FILES[track];
  if (!file) return null;
  let p = players.get(track);
  if (!p) {
    const el = new Audio(assetPath(file));
    el.loop = true;
    el.preload = 'auto';
    el.crossOrigin = 'anonymous';
    const gain = ac.createGain();
    gain.gain.value = 0;
    ac.createMediaElementSource(el).connect(gain).connect(ac.destination);
    p = { el, gain };
    players.set(track, p);
  }
  return p;
};

const fadeTo = (p: Player, level: number, then?: () => void) => {
  const ac = context();
  if (!ac) return;
  const now = ac.currentTime;
  p.gain.gain.cancelScheduledValues(now);
  p.gain.gain.setValueAtTime(p.gain.gain.value, now);
  p.gain.gain.linearRampToValueAtTime(level, now + FADE_S);
  if (then) setTimeout(then, FADE_S * 1000 + 50);
};

/** Bring what is playing in line with what is wanted and allowed. */
const sync = () => {
  const target = unlocked && allowed() && document.visibilityState === 'visible' ? wanted : null;
  if (target === current) return;
  if (current) {
    const old = players.get(current);
    if (old) fadeTo(old, 0, () => old.el.pause());
  }
  current = target;
  if (!target) return;
  const p = player(target);
  if (!p) return;
  void context()?.resume();
  // A file that is missing or fails to load simply leaves the screen quiet.
  p.el.play().then(
    () => fadeTo(p, VOLUME),
    () => {},
  );
};

/** Ask for a track (null: silence). Repeating the same request does nothing. */
export const playBgm = (track: BgmTrack | null) => {
  wanted = track;
  sync();
};

/** The screen's music while it is shown. */
export const useBgm = (track: BgmTrack | null) => {
  useEffect(() => {
    playBgm(track);
  }, [track]);
};

if (typeof window !== 'undefined') {
  // The first tap anywhere opens the sound.
  const unlock = () => {
    unlocked = true;
    void context()?.resume();
    sync();
    window.removeEventListener('pointerdown', unlock, true);
    window.removeEventListener('keydown', unlock, true);
  };
  window.addEventListener('pointerdown', unlock, true);
  window.addEventListener('keydown', unlock, true);
  document.addEventListener('visibilitychange', sync);
  useGameStore.subscribe((s, prev) => {
    if (s.settings.muted !== prev.settings.muted || s.settings.bgmOff !== prev.settings.bgmOff) sync();
  });
}
