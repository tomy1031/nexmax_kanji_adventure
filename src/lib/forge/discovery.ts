import type { Compound } from '../../types/forge';
import { getCompounds } from '../../data/compounds.generated';

/**
 * Turning the compound table into a treasure hunt.
 *
 * The forge on its own is answer-checking: pick two characters, learn whether
 * they happen to be a word. What was missing is everything that makes looking
 * for something enjoyable — knowing how much there is to find, having a clue
 * to reason from, and having a reason to think before guessing.
 *
 * So a word the learner *could* build but has not yet becomes a card with one
 * character hidden and its English meaning shown: "？人 — adult". The meaning
 * is the question, not the hint. Working from meaning to characters is exactly
 * how a compound is learned, so guessing the card and learning the word are
 * the same act.
 */

export const FoundVia = {
  /** Guessed from a card in the collection. */
  AIMED: 'aimed',
  /** Stumbled on while freely combining in the forge. */
  LUCKY: 'lucky',
  /** Opened with the last hint tier. Does not count toward titles. */
  TOLD: 'told',
} as const;
export type FoundVia = (typeof FoundVia)[keyof typeof FoundVia];

/** Cost in すみ of each hint tier. Tier 0 and 1 are free. */
export const HINT_COST = [0, 0, 2, 3, 10] as const;
export const MAX_HINT = HINT_COST.length - 1;

/** すみ spent on trying a combination that is not yet a known word. */
export const TRY_COST_2 = 3;
export const TRY_COST_3 = 5;

/** Tier 4 only unlocks after this many wrong guesses on that card. */
export const MISSES_BEFORE_ANSWER = 3;

// ---------------------------------------------------------------------------
// Indexes, built once
// ---------------------------------------------------------------------------

let byWord: Map<string, Compound> | null = null;
let byReading: Map<string, Compound[]> | null = null;
/** How many words in the whole table each character appears in. */
let charFrequency: Map<string, number> | null = null;

const buildIndexes = () => {
  if (byWord) return;
  byWord = new Map();
  byReading = new Map();
  charFrequency = new Map();

  for (const c of getCompounds()) {
    byWord.set(c.word, c);
    const sameReading = byReading.get(c.reading);
    if (sameReading) sameReading.push(c);
    else byReading.set(c.reading, [c]);
    for (const ch of new Set(c.word)) {
      charFrequency.set(ch, (charFrequency.get(ch) ?? 0) + 1);
    }
  }
};

export const compoundFor = (word: string): Compound | null => {
  buildIndexes();
  return byWord!.get(word) ?? null;
};

/** Every word writable with exactly these characters. */
export const wordsFor = (owned: Set<string>): Compound[] =>
  getCompounds().filter((c) => [...c.word].every((ch) => owned.has(ch)));

// ---------------------------------------------------------------------------
// Cards
// ---------------------------------------------------------------------------

export interface WordCard {
  compound: Compound;
  /** Index of the character kept hidden. */
  hiddenIndex: number;
  /** The word with the hidden character replaced by '？'. */
  masked: string;
}

/**
 * Which character to hide.
 *
 * The one that appears in *fewer* words is hidden, so the common "spine"
 * characters (人, 日, 一, 国) keep showing up face-up. A learner meeting
 * ？人 for the fifth time has started to see the pattern "○人 = a kind of
 * person", which is the shape of the vocabulary rather than a single word.
 *
 * For a three-character word built on a two-character one (日本 -> 日本語),
 * the known pair is shown and the new character hidden.
 */
export const cardFor = (compound: Compound): WordCard => {
  buildIndexes();
  const chars = [...compound.word];

  let hiddenIndex: number;
  if (chars.length >= 3) {
    // 日本語 -> show 日本, hide 語. Otherwise hide the last character.
    const headIsWord = byWord!.has(chars.slice(0, 2).join(''));
    hiddenIndex = headIsWord ? 2 : chars.length - 1;
  } else {
    const freq = chars.map((ch) => charFrequency!.get(ch) ?? 0);
    // Hide the rarer character; on a tie hide the first so the second shows.
    hiddenIndex = freq[0] <= freq[1] ? 0 : 1;
  }

  const masked = chars.map((ch, i) => (i === hiddenIndex ? '？' : ch)).join('');
  return { compound, hiddenIndex, masked };
};

/** Cards for everything craftable now and not yet found. */
export const openCards = (owned: Set<string>, found: ReadonlySet<string>): WordCard[] =>
  wordsFor(owned)
    .filter((c) => !found.has(c.word))
    .map(cardFor);

// ---------------------------------------------------------------------------
// "This character still has words in it"
// ---------------------------------------------------------------------------

export interface CharProgress {
  char: string;
  found: number;
  total: number;
}

/** Per-character found/total over the words the learner can currently build. */
export const charProgress = (owned: Set<string>, found: ReadonlySet<string>): CharProgress[] => {
  const words = wordsFor(owned);
  const totals = new Map<string, { found: number; total: number }>();

  for (const ch of owned) totals.set(ch, { found: 0, total: 0 });
  for (const w of words) {
    for (const ch of new Set(w.word)) {
      const entry = totals.get(ch);
      if (!entry) continue;
      entry.total += 1;
      if (found.has(w.word)) entry.found += 1;
    }
  }

  return [...totals.entries()]
    .map(([char, v]) => ({ char, ...v }))
    .sort((a, b) => b.total - a.total || a.char.localeCompare(b.char, 'ja'));
};

/** Words still to find that use this character. Drives the forge's badges. */
export const remainingForChar = (
  char: string,
  owned: Set<string>,
  found: ReadonlySet<string>,
): number => {
  const p = charProgress(owned, found).find((c) => c.char === char);
  return p ? p.total - p.found : 0;
};

// ---------------------------------------------------------------------------
// What kind of find this was
// ---------------------------------------------------------------------------

export const DiscoveryKind = {
  REVERSIBLE: 'reversible',
  EXTENDED: 'extended',
  HOMOPHONE: 'homophone',
  FAMILY_COMPLETE: 'familyComplete',
  PLAIN: 'plain',
} as const;
export type DiscoveryKind = (typeof DiscoveryKind)[keyof typeof DiscoveryKind];

export const KIND_LABEL: Record<DiscoveryKind, string> = {
  reversible: 'ひっくり返(かえ)しても 言葉(ことば)！',
  extended: '言葉(ことば)が のびた！',
  homophone: '同(おな)じ 読(よ)み、ちがう 字(じ)！',
  familyComplete: 'この 字(じ)の 言葉(ことば)、全部(ぜんぶ) そろった！',
  plain: 'はじめて 見(み)つけた',
};

/**
 * Classify a find, so the same event can be celebrated for what it actually
 * is. Checked in priority order; only one badge is ever shown.
 */
export const discoveryKind = (
  word: string,
  owned: Set<string>,
  /** Words found *including* this one. */
  found: ReadonlySet<string>,
): DiscoveryKind => {
  buildIndexes();
  const compound = byWord!.get(word);
  if (!compound) return DiscoveryKind.PLAIN;
  const chars = [...word];

  // 日本 / 本日 — both real, and the other one is already known.
  if (chars.length === 2) {
    const reversed = [...chars].reverse().join('');
    if (reversed !== word && byWord!.has(reversed) && found.has(reversed)) {
      return DiscoveryKind.REVERSIBLE;
    }
  }

  // 日本 -> 日本語: grew out of a pair already found.
  if (chars.length === 3) {
    const head = chars.slice(0, 2).join('');
    const tail = chars.slice(1).join('');
    if ((byWord!.has(head) && found.has(head)) || (byWord!.has(tail) && found.has(tail))) {
      return DiscoveryKind.EXTENDED;
    }
  }

  // Same reading, different characters, and the other one is already known.
  const sameReading = (byReading!.get(compound.reading) ?? []).filter((c) => c.word !== word);
  if (sameReading.some((c) => found.has(c.word))) return DiscoveryKind.HOMOPHONE;

  // Every word available for one of its characters is now found.
  for (const ch of new Set(chars)) {
    const p = charProgress(owned, found).find((c) => c.char === ch);
    if (p && p.total > 1 && p.found === p.total) return DiscoveryKind.FAMILY_COMPLETE;
  }

  return DiscoveryKind.PLAIN;
};

// ---------------------------------------------------------------------------
// Titles
// ---------------------------------------------------------------------------

export interface Title {
  at: number;
  word: string;
  reading: string;
  en: string;
}

/** Earned on words found by guessing. Words opened with the answer do not count. */
export const TITLES: Title[] = [
  { at: 10, word: '見習い', reading: 'みならい', en: 'apprentice' },
  { at: 50, word: '一人前', reading: 'いちにんまえ', en: 'full-fledged' },
  { at: 100, word: '名人', reading: 'めいじん', en: 'master' },
  { at: 200, word: '先生', reading: 'せんせい', en: 'teacher' },
  { at: 347, word: '生き字引', reading: 'いきじびき', en: 'walking dictionary' },
];

export const titleFor = (earnedCount: number): Title | null => {
  let best: Title | null = null;
  for (const t of TITLES) if (earnedCount >= t.at) best = t;
  return best;
};

export const nextTitle = (earnedCount: number): Title | null =>
  TITLES.find((t) => earnedCount < t.at) ?? null;
