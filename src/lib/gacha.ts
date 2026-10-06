import { CARDS, type Individual } from '../data/individuals';
import { kanjiOf } from '../data/charKanji';
import type { Rarity } from './companionSkill';
import { Element } from './forge/elements';
import { CLASS_OF_ELEMENT } from './forge/weapon';

/**
 * The gem shop (docs/design/11 §5).
 *
 * Deliberately honest odds and a short hard ceiling. This is a study app for
 * teenagers: the gacha exists to give the daily habit a payoff, not to teach
 * anyone that pulling is exciting. So:
 *   - no paid currency, ever — gems come only from studying;
 *   - the ★5 ceiling is thirty pulls, not three hundred, and a ten-pull
 *     always holds a ★4 or better;
 *   - a duplicate is never a loss: it raises that card's きずな, and gives
 *     gems back once the きずな is full;
 *   - the rarity shows on the card's back before it turns (no fake near-miss).
 *
 * Five gachas (2026-10-07「ガチャの 種類も もっと 増やして」): いつもの (every
 * card), ピックアップ (this week's ★5 and two ★4 come up more), 町の ガチャ
 * (the town's people only, cheaper, no ★5), 曜日の ガチャ (today's element —
 * 日月火水木金土, the first kanji the town gives back — and the friends good
 * with its weapon come up more), and 字の ガチャ (the friends whose own kanji
 * the player has written come up more: writing is what calls them). And one
 * free pull a day.
 */

export const PULL_COST = 100;
/**
 * Ten pulls for the price of nine, with a guarantee. At ~110 gems a day from
 * the daily tasks, a ten-pull is a weekly event worth saving for.
 */
export const MULTI_COUNT = 10;
export const MULTI_COST = PULL_COST * 9;
/** A ★5 is certain on this pull if none has landed since the last one (いつもの・ピックアップ). */
export const STAR5_CEILING = 30;
/** Gems back for a duplicate whose きずな is already full, by its rarity. */
export const BOND_REFUND: Record<Rarity, number> = { 3: 20, 4: 60, 5: 200 };

export const BannerId = { STANDARD: 'standard', PICKUP: 'pickup', TOWN: 'town', WEEKDAY: 'weekday', KANJI: 'kanji' } as const;
export type BannerId = (typeof BannerId)[keyof typeof BannerId];

export interface Banner {
  id: BannerId;
  /** Furigana notation. */
  name: string;
  /** The tab: a picture and a short name, so it is told apart without reading (furigana notation). */
  tab: { icon: string; label: string };
  single: number;
  multi: number;
  /** Chance of each rarity on an ordinary pull; they add up to 1. */
  rates: Record<Rarity, number>;
  /** Whether its pulls count toward, and can trigger, the ★5 ceiling. */
  ceiling: boolean;
  /** The cards it can give. */
  has: (c: Individual) => boolean;
}

export const BANNERS: Record<BannerId, Banner> = {
  standard: {
    id: 'standard',
    name: 'いつもの ガチャ',
    tab: { icon: '🎲', label: 'いつもの' },
    single: PULL_COST,
    multi: MULTI_COST,
    rates: { 5: 0.03, 4: 0.17, 3: 0.8 },
    ceiling: true,
    has: () => true,
  },
  pickup: {
    id: 'pickup',
    name: 'ピックアップ',
    tab: { icon: '🌟', label: 'ピックアップ' },
    single: PULL_COST,
    multi: MULTI_COST,
    rates: { 5: 0.03, 4: 0.17, 3: 0.8 },
    ceiling: true,
    has: () => true,
  },
  town: {
    id: 'town',
    name: '町(まち)の ガチャ',
    tab: { icon: '🏘️', label: '町(まち)' },
    single: 60,
    multi: 540,
    rates: { 5: 0, 4: 0.25, 3: 0.75 },
    ceiling: false,
    has: (c) => c.kind === 'town' && c.rarity < 5,
  },
  weekday: {
    id: 'weekday',
    name: '曜日(ようび)の ガチャ',
    tab: { icon: '📅', label: '曜日(ようび)' },
    single: PULL_COST,
    multi: MULTI_COST,
    rates: { 5: 0.03, 4: 0.17, 3: 0.8 },
    ceiling: true,
    has: () => true,
  },
  kanji: {
    id: 'kanji',
    name: '字(じ)の ガチャ',
    tab: { icon: '✍️', label: '字(じ)' },
    single: PULL_COST,
    multi: MULTI_COST,
    rates: { 5: 0.03, 4: 0.17, 3: 0.8 },
    ceiling: true,
    has: () => true,
  },
};

/** The tabs, in order. */
export const BANNER_ORDER: readonly BannerId[] = ['pickup', 'weekday', 'kanji', 'standard', 'town'];

/** Who comes up more on 曜日の ガチャ and 字の ガチャ: half of every rarity, when there is one of that rarity. */
export type Boost = (c: Individual) => boolean;

/** 曜日の ガチャ: each day its element, in the order of the week's kanji (Sunday first, as Date.getDay). */
export const WEEKDAY_KANJI: readonly string[] = ['日(にち)', '月(げつ)', '火(か)', '水(すい)', '木(もく)', '金(きん)', '土(ど)'];
export const WEEKDAY_ELEMENT: readonly Element[] = [Element.KOU, Element.AN, Element.KA, Element.SUI, Element.MOKU, Element.KIN, Element.DO];
/** Today's day of the week, 0 = Sunday (local time). */
export const dayOf = (d: Date = new Date()): number => d.getDay();
/** Friends good with the weapon of the day's element come up more. */
export const weekdayBoost = (day: number): Boost => (c) => c.favours === CLASS_OF_ELEMENT[WEEKDAY_ELEMENT[mod(day, 7)]];
/** 字の ガチャ: a friend comes up more once all of its own kanji have been written (`written`). */
export const kanjiBoost = (written: (char: string) => boolean): Boost => (c) => [...(kanjiOf(c.char)?.kanji ?? '')].every(written);

const FIVES = CARDS.filter((c) => c.rarity === 5);
const FOURS = CARDS.filter((c) => c.rarity === 4);

/** Who may come out: a town person only once the story has met them (Individual.meets). */
export type Met = (c: Individual) => boolean;
const everyone: Met = () => true;
export const isMet = (c: Individual, cleared: readonly string[]): boolean => !c.meets || cleared.includes(c.meets);
const metOr = (cards: Individual[], met: Met) => {
  const known = cards.filter(met);
  return known.length > 0 ? known : cards;
};
const mod = (n: number, m: number) => ((n % m) + m) % m;

/** Weeks since Monday 2026-01-05 (local time): the pickup changes every Monday. */
export const weekOf = (d: Date = new Date()): number => {
  const monday = new Date(2026, 0, 5).getTime();
  const day = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  return Math.floor(Math.round((day - monday) / 86400000) / 7);
};

/** Days until the pickup changes (1..7). */
export const daysToNextPickup = (d: Date = new Date()): number => 7 - mod(Math.round((new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime() - new Date(2026, 0, 5).getTime()) / 86400000), 7);

/** This week's pickup: one ★5 and two ★4, in turn so every card has its week — among those the story has met. */
export const pickupOf = (week: number, met: Met = everyone): { five: Individual; fours: Individual[] } => {
  const fives = metOr(FIVES, met);
  const fours = metOr(FOURS, met);
  return { five: fives[mod(week, fives.length)], fours: [fours[mod(week * 2, fours.length)], fours[mod(week * 2 + 1, fours.length)]] };
};

export interface PullResult {
  card: Individual;
  duplicate: boolean;
  /** The ceiling (or the ten-pull's promise) made this result. */
  guaranteed: boolean;
  /** This week's pickup card. */
  featured: boolean;
}

/**
 * One pull. `random` is injected so the result is testable.
 * `atLeast4`: the ten-pull's promise, used on its last card.
 * `met`: the town people the story has met; no one else comes out.
 */
export const pull = (
  bannerId: BannerId,
  owned: readonly string[],
  pity: number,
  week: number,
  random: () => number = Math.random,
  atLeast4 = false,
  met: Met = everyone,
  boost?: Boost,
): PullResult => {
  const banner = BANNERS[bannerId];
  const ceilingHit = banner.ceiling && pity + 1 >= STAR5_CEILING;
  const roll = random();
  let rarity: Rarity = ceilingHit ? 5 : roll < banner.rates[5] ? 5 : roll < banner.rates[5] + banner.rates[4] ? 4 : 3;
  const promised = atLeast4 && rarity === 3;
  if (promised) rarity = 4;

  const pool = metOr(
    CARDS.filter((c) => c.rarity === rarity && banner.has(c)),
    met,
  );
  const pick = <T,>(xs: readonly T[]) => xs[Math.floor(random() * xs.length) % xs.length];

  const featured = featuredOf(bannerId, rarity, week, met, boost);
  if (featured.length > 0) {
    // Half of every ★5 (or ★4) is this week's; on 曜日・字 half of every rarity is the boosted ones'.
    if (random() < 0.5) {
      const card = pick(featured);
      return { card, duplicate: owned.includes(card.id), guaranteed: ceilingHit || promised, featured: true };
    }
  }
  // Prefer a card the player does not have yet: a collection that fills up is
  // the point, and a wall of duplicates reads as the game wasting their time.
  const fresh = pool.filter((c) => !owned.includes(c.id));
  const card = pick(fresh.length > 0 ? fresh : pool);
  return { card, duplicate: owned.includes(card.id), guaranteed: ceilingHit || promised, featured: isFeatured(bannerId, card, week, met, boost) };
};

/** The cards a rarity's half goes to on this gacha: this week's pickup, or the boosted ones (曜日・字). */
export const featuredOf = (bannerId: BannerId, rarity: Rarity, week: number, met: Met = everyone, boost?: Boost): Individual[] => {
  if (bannerId === 'pickup') {
    if (rarity < 4) return [];
    const { five, fours } = pickupOf(week, met);
    return rarity === 5 ? [five] : fours;
  }
  if ((bannerId === 'weekday' || bannerId === 'kanji') && boost) return CARDS.filter((c) => c.rarity === rarity && BANNERS[bannerId].has(c) && met(c) && boost(c));
  return [];
};

/** Whether a card is one this gacha puts forward (the pickup, or a boosted one). */
export const isFeatured = (bannerId: BannerId, card: Individual, week: number, met: Met = everyone, boost?: Boost): boolean =>
  featuredOf(bannerId, card.rarity, week, met, boost).some((c) => c.id === card.id);

/**
 * Each card's chance on one ordinary pull (not the ceiling's), worked out
 * from the same rules `pull` follows: the rarity's rate, shared among the
 * cards that can come out — the ones the story has met, and, while there are
 * any, the ones the player does not have yet (a card owned waits until its
 * rarity is complete). On the pickup, half of a ★5 or ★4 is this week's
 * card(s). For the くわしい かくりつ table (docs/design/16 §6).
 */
export const cardRates = (bannerId: BannerId, owned: readonly string[], week: number, met: Met = everyone, boost?: Boost): { card: Individual; rate: number }[] => {
  const banner = BANNERS[bannerId];
  const out = new Map<string, { card: Individual; rate: number }>();
  const add = (card: Individual, rate: number) => {
    const e = out.get(card.id);
    if (e) e.rate += rate;
    else out.set(card.id, { card, rate });
  };
  for (const rarity of [5, 4, 3] as const) {
    const r = banner.rates[rarity];
    if (r <= 0) continue;
    const pool = metOr(
      CARDS.filter((c) => c.rarity === rarity && banner.has(c)),
      met,
    );
    const fresh = pool.filter((c) => !owned.includes(c.id));
    const from = fresh.length > 0 ? fresh : pool;
    let rest = r;
    const featured = featuredOf(bannerId, rarity, week, met, boost);
    if (featured.length > 0) {
      for (const c of featured) add(c, (r * 0.5) / featured.length);
      rest = r * 0.5;
    }
    for (const c of from) add(c, rest / from.length);
  }
  return [...out.values()].sort((a, b) => b.card.rarity - a.card.rarity || b.rate - a.rate);
};

/** Pulls left before the ★5 ceiling. */
export const pullsUntilStar5 = (pity: number): number => Math.max(0, STAR5_CEILING - pity);

/** The ★5 counter after this result. Only the gachas with a ceiling move it. */
export const pityAfter = (bannerId: BannerId, pity: number, r: PullResult): number =>
  !BANNERS[bannerId].ceiling ? pity : r.card.rarity === 5 ? 0 : pity + 1;

/**
 * A ten-pull: ten ordinary pulls, so the odds are exactly the single-pull odds
 * — nothing is quietly worse in bulk. The promise is that at least one of the
 * ten is ★4 or better: if the first nine held none, the tenth is made one.
 * `owned` is threaded through, so one run does not hand out the same new card twice as new.
 */
export const pullMany = (
  bannerId: BannerId,
  owned: readonly string[],
  pity: number,
  week: number,
  random: () => number = Math.random,
  met: Met = everyone,
  boost?: Boost,
): { results: PullResult[]; pityAfter: number } => {
  const results: PullResult[] = [];
  const seen = [...owned];
  let p = pity;
  for (let i = 0; i < MULTI_COUNT; i++) {
    const last = i === MULTI_COUNT - 1;
    const none4 = !results.some((r) => r.card.rarity >= 4);
    const r = pull(bannerId, seen, p, week, random, last && none4, met, boost);
    results.push(r);
    if (!seen.includes(r.card.id)) seen.push(r.card.id);
    p = pityAfter(bannerId, p, r);
  }
  return { results, pityAfter: p };
};
