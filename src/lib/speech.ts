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

export const speak = (text: string): void => {
  if (!canSpeak() || useGameStore.getState().settings.muted) return;
  const synth = window.speechSynthesis;
  synth.cancel();
  const u = new SpeechSynthesisUtterance(toKana(text).replace(/\n/g, ' '));
  u.lang = 'ja-JP';
  u.rate = 0.85;
  const voice = synth.getVoices().find((v) => v.lang.startsWith('ja'));
  if (voice) u.voice = voice;
  synth.speak(u);
};

export const stopSpeaking = (): void => {
  if (canSpeak()) window.speechSynthesis.cancel();
};
