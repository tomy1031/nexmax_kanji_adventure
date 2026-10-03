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
 *
 * playJingle is the one tune that does not loop: a few seconds over the
 * music, which dips under it, when a letter lights its sign in the town and
 * when a fight is won.
 */

/**
 * town: タイトル / map: 地図（話を えらぶ）/ story: お話と 書き取り（同じ 曲で つなぐ）/
 * battle: たたかい（チュートリアル・前の ルート）/ boss: 1章の 話の モジクイと たたかう / shop: 漢字やさん /
 * sad: 字が 消えて 困って いる お話の 始め / tension: モジクイが 出る（出会い・プロローグの 影）
 */
export type BgmTrack = 'town' | 'map' | 'story' | 'battle' | 'boss' | 'shop' | 'sad' | 'tension';

/**
 * The file for each track, once it is in public/audio/bgm. A track without
 * one is silence (nothing is requested, so nothing 404s).
 */
export const BGM_FILES: Partial<Record<BgmTrack, string>> = {
  town: 'audio/bgm/town.mp3',
  map: 'audio/bgm/map.mp3',
  story: 'audio/bgm/story.mp3',
  battle: 'audio/bgm/battle.mp3',
  boss: 'audio/bgm/boss.mp3',
  shop: 'audio/bgm/shop.mp3',
  sad: 'audio/bgm/sad.mp3',
  tension: 'audio/bgm/tension.mp3',
};

/** The short tune for a letter coming back and for a win (playJingle). */
export const JINGLE_FILE = 'audio/bgm/jingle.mp3';

/** Under the sound effects, so a stroke or a hit is always heard. */
const VOLUME = 0.32;
const FADE_S = 0.8;
/** The jingle sits on top of the music, which dips under it and comes back. */
const JINGLE_VOLUME = 0.5;
const DUCK = 0.08;
const DUCK_S = 0.15;

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
let jingle: Player | null = null;
/** The music is dipped under the jingle until it ends. */
let ducked = false;

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

const load = (ac: AudioContext, file: string, loop: boolean): Player => {
  const el = new Audio(assetPath(file));
  el.loop = loop;
  el.preload = 'auto';
  el.crossOrigin = 'anonymous';
  const gain = ac.createGain();
  gain.gain.value = 0;
  ac.createMediaElementSource(el).connect(gain).connect(ac.destination);
  return { el, gain };
};

const player = (track: BgmTrack): Player | null => {
  const ac = context();
  if (!ac) return null;
  const file = BGM_FILES[track];
  if (!file) return null;
  let p = players.get(track);
  if (!p) {
    p = load(ac, file, true);
    players.set(track, p);
  }
  return p;
};

const fadeTo = (p: Player, level: number, then?: () => void, seconds = FADE_S) => {
  const ac = context();
  if (!ac) return;
  const now = ac.currentTime;
  p.gain.gain.cancelScheduledValues(now);
  p.gain.gain.setValueAtTime(p.gain.gain.value, now);
  p.gain.gain.linearRampToValueAtTime(level, now + seconds);
  if (then) setTimeout(then, seconds * 1000 + 50);
};

const musicLevel = () => (ducked ? DUCK : VOLUME);

/** Bring what is playing in line with what is wanted and allowed. */
const sync = () => {
  const audible = unlocked && allowed() && document.visibilityState === 'visible';
  if (!audible && jingle && !jingle.el.paused) {
    jingle.el.pause();
    ducked = false;
  }
  const target = audible ? wanted : null;
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
    () => fadeTo(p, musicLevel()),
    () => {},
  );
};

const jingleOf = (ac: AudioContext | null): Player | null => {
  if (!ac) return null;
  if (!jingle) {
    jingle = load(ac, JINGLE_FILE, false);
    jingle.el.addEventListener('ended', unduck);
  }
  return jingle;
};

const unduck = () => {
  if (!ducked) return;
  ducked = false;
  const p = current ? players.get(current) : undefined;
  if (p) fadeTo(p, VOLUME);
};

/**
 * Play the jingle once over the music (a letter comes back to the town, a
 * fight is won). Returns false when it cannot be heard — before the first
 * tap, with sound or BGM off — so the caller can play its own sound instead.
 */
export const playJingle = (): boolean => {
  if (!unlocked || !allowed() || document.visibilityState !== 'visible') return false;
  const ac = context();
  const j = jingleOf(ac);
  if (!ac || !j) return false;
  // Asked again as it starts (a screen's effect running twice): one jingle, not a stutter.
  if (!j.el.paused && j.el.currentTime < 0.6) return true;
  void ac.resume();
  ducked = true;
  const music = current ? players.get(current) : undefined;
  if (music) fadeTo(music, DUCK, undefined, DUCK_S);
  j.el.currentTime = 0;
  j.gain.gain.cancelScheduledValues(ac.currentTime);
  j.gain.gain.setValueAtTime(JINGLE_VOLUME, ac.currentTime);
  j.el.play().catch(unduck);
  return true;
};

/** The jingle is still ringing: a fanfare now would play over it. */
export const jinglePlaying = () => Boolean(jingle && !jingle.el.paused && !jingle.el.ended);

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
    // Fetch the jingle now so the first letter that comes back is not late.
    jingleOf(context());
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
