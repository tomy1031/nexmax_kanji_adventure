import { toKana } from './ruby';
import { useGameStore } from '../store/gameStore';

/**
 * よみあげ — the line read aloud in Japanese by the device's own voice.
 *
 * For a learner who cannot read the line yet but can follow it by ear
 * (docs/design/07 §3). It reads the furigana, not the kanji, so the device
 * never guesses a reading the script did not intend.
 */
export const canSpeak = (): boolean => typeof window !== 'undefined' && 'speechSynthesis' in window;

/**
 * What is said for a line: its kana, without the pictures — a voice reads 😰
 * or 🪧 out as words ("face with…"), which a learner cannot tell from the line.
 */
export const spokenText = (text: string): string =>
  toKana(text)
    .replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu, '')
    .replace(/\n/g, ' ')
    .replace(/\s{2,}/g, ' ')
    .trim();

export const speak = (text: string): void => {
  if (!canSpeak() || useGameStore.getState().settings.muted) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(spokenText(text));
  u.lang = 'ja-JP';
  u.rate = 0.85;
  const voice = synth.getVoices().find((v) => v.lang.startsWith('ja'));
  if (voice) u.voice = voice;
  synth.speak(u);
};

export const stopSpeaking = (): void => {
  if (canSpeak()) window.speechSynthesis.cancel();
};
