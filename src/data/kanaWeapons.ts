import { KANA_EPISODES } from './kana';
import { kanaToWrite } from './kanaWords';

/**
 * かなの ぶき (docs/design/22 §5, 2026-10-15「ひらがな、カタカナ編でもひらがな武器を作れるように。
 * 同じようにチュートリアルを。ただし、この武器はひらがな、カタカナの時だけ使える」).
 *
 * A weapon is made by writing its name: when every kana of the name is the
 * player's own (three writes), writing the name once in かなの かじや makes it.
 * It works in 0章の たたかい only (KanaBattle) — never in the town's kanji
 * fights or in たいせん, where the forge's kanji weapons are. A longer name
 * and a later episode make a stronger one, but never by much: writing well
 * still matters more (kanaWeapons.test.ts).
 */

export interface KanaWeapon {
  /** The name in kana; also the id. */
  name: string;
  /** Its meaning, for a player who cannot read it yet. */
  en: string;
  emoji: string;
  /** The picture (Codex, scripts/art/manifest.mjs KANA_WEAPON_ART). */
  img: string;
  /** The episode by which every kana of its name is written. */
  from: string;
  /** Damage times this in 0章の たたかい. */
  power: number;
}

const order = (id: string) => KANA_EPISODES.find((e) => e.id === id)?.order ?? 1;
const weapon = (name: string, en: string, emoji: string, slug: string, from: string): KanaWeapon => ({
  name,
  en,
  emoji,
  img: `img/kanaweapon/${slug}.webp`,
  from,
  power: Math.round((1 + 0.05 * kanaToWrite({ kana: name, emoji, en }).length + 0.02 * order(from)) * 100) / 100,
});

export const KANA_WEAPONS: KanaWeapon[] = [
  weapon('かさ', 'umbrella', '☂️', 'kasa', 'kana-2'),
  weapon('おの', 'axe', '🪓', 'ono', 'kana-3'),
  weapon('つえ', 'staff', '🪄', 'tsue', 'kana-3'),
  weapon('かたな', 'sword', '⚔️', 'katana', 'kana-3'),
  weapon('はさみ', 'scissors', '✂️', 'hasami', 'kana-4'),
  weapon('むち', 'whip', '〰️', 'muchi', 'kana-4'),
  weapon('やり', 'spear', '🔱', 'yari', 'kana-5'),
  weapon('ゆみ', 'bow', '🏹', 'yumi', 'kana-5'),
  weapon('ナイフ', 'knife', '🔪', 'naifu', 'kana-8'),
  weapon('ヨーヨー', 'yo-yo', '🪀', 'yoyo', 'kana-9'),
  weapon('トマホーク', 'tomahawk', '🪓', 'tomahoku', 'kana-9'),
  weapon('ハンマー', 'hammer', '🔨', 'hanma', 'kana-10'),
  weapon('ランス', 'lance', '🗡️', 'ransu', 'kana-10'),
  weapon('ミサイル', 'missile', '🚀', 'misairu', 'kana-10'),
];

export const getKanaWeapon = (name: string | null | undefined): KanaWeapon | undefined => KANA_WEAPONS.find((w) => w.name === name);

/** The kana a weapon's name asks to be written. */
export const weaponKana = (w: KanaWeapon): string[] => kanaToWrite({ kana: w.name, emoji: w.emoji, en: w.en });

/** Every kana of its name is the player's own: it can be made. */
export const canMakeKanaWeapon = (w: KanaWeapon, known: ReadonlySet<string>): boolean => weaponKana(w).every((k) => known.has(k));

/** The first one, made in the tutorial after かな 2話 (かさ). */
export const FIRST_KANA_WEAPON = 'かさ';
