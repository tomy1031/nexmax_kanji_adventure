/**
 * かくし武器 — one word in each episode that makes a far stronger weapon than
 * the rest (2026-10-04「それぞれの ステージの 漢字でも、隠し武器のような
 * 形で 強いものが あると いい」).
 *
 * Never hinted: found only by trying. Each is a real word written with the
 * kanji learned up to its episode, at least one of them that episode's own,
 * and one a player is unlikely to make first — a find, not the obvious word.
 */
export const HIDDEN_WEAPONS: Readonly<Record<string, string>> = {
  日月: 'moji-1-1',
  金山: 'moji-1-2',
  三日月: 'moji-1-3',
  七五三: 'moji-1-4',
  八百万: 'moji-1-5',
  会社員: 'moji-1-6',
  日本一: 'moji-1-7',
  朝日: 'moji-1-8',
  一人前: 'moji-1-9',
  万年: 'moji-1-10',
  水車: 'moji-1-11',
  // 2章 ミナトタウン（docs/design/12）
  高校生: 'moji-2-1',
  白黒: 'moji-2-2',
  上手: 'moji-2-3',
  金魚: 'moji-2-4',
  人間: 'moji-2-5',
  大男: 'moji-2-6',
  読書: 'moji-2-7',
  友達: 'moji-2-8',
  手紙: 'moji-2-9',
  物語: 'moji-2-10',
};

export const isHiddenWeapon = (word: string): boolean => word in HIDDEN_WEAPONS;
